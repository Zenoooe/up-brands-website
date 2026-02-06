import { supabase } from '../lib/supabase';

export async function backupImageToSupabase(imageUrl: string, projectId: string): Promise<string> {
  try {
    // Use our own Vercel API proxy which is more reliable than public CORS proxies
    // Fallback to allorigins only if running locally without Vercel API (optional, but good for dev)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // In production, use our own API. In local, if not using vercel dev, this might fail, 
    // so we can fallback or just expect users to use 'vercel dev' or accept it fails locally.
    // For now, let's try our API first.
    let proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;

    // If we are strictly local and not proxying /api, we might need the public proxy as fallback.
    // But let's assume the Vercel deployment is the target.
    
    let response = await fetch(proxyUrl);
    
    // Fallback to public proxy if our API fails (e.g. 404 in local dev without vercel functions)
    if (!response.ok && isLocal) {
      console.warn('Local API proxy failed, trying Vite local proxy...');
      
      // If we are on localhost, we can use the Vite proxy we configured in vite.config.ts
      // to route requests to /behance-cdn/...
      // Original: https://mir-s3-cdn-cf.behance.net/project_modules/...
      // Proxy: /behance-cdn/project_modules/...
      
      try {
        const urlObj = new URL(imageUrl);
        if (urlObj.hostname === 'mir-s3-cdn-cf.behance.net') {
           proxyUrl = `/behance-cdn${urlObj.pathname}`;
           console.log('Using Vite proxy for image:', proxyUrl);
           response = await fetch(proxyUrl);
        } else {
           // If it's not a Behance CDN URL, fallback to AllOrigins as last resort
           console.warn('Not a Behance CDN URL, falling back to AllOrigins');
           proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
           response = await fetch(proxyUrl);
        }
      } catch (e) {
         // Invalid URL or other error, fallback to AllOrigins
         proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
         response = await fetch(proxyUrl);
      }
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch source image: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // 2. Determine file extension
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const fileName = `${projectId}_${Date.now()}.${ext}`;

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(fileName, blob, {
        contentType,
        upsert: true
      });

    if (error) throw error;

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}
