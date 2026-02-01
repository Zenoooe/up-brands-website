import { supabase } from '../lib/supabase';

export async function backupImageToSupabase(imageUrl: string, projectId: string): Promise<string> {
  try {
    // 1. Fetch image through a CORS proxy to avoid issues
    // Using allorigins.win as used in sync logic
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch source image');
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
