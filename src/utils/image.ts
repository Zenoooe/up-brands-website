
export function toWpImageProxyUrl(url: string) {
  const cleaned = url.replace(/^https?:\/\//, '');
  return `https://i0.wp.com/${cleaned}`;
}

export function getSupabaseUrl(url: string, width: number) {
  if (!url || !url.includes('supabase.co')) return url;
  
  // Replace with custom CDN if configured (e.g. Cloudflare)
  // Fallback to hardcoded CDN if env var is missing in production build
  const cdnUrl = import.meta.env.VITE_SUPABASE_CDN_URL || 'https://cdn.up-brands.com';
  let optimizedUrl = url;
  
  if (cdnUrl) {
    try {
      const urlObj = new URL(url);
      // Remove '/storage/v1/object/public' prefix for cleaner CDN URLs
      // Example: https://xyz.supabase.co/storage/v1/object/public/bucket/img.jpg 
      //       -> https://cdn.up-brands.com/bucket/img.jpg
      const cleanPath = urlObj.pathname.replace('/storage/v1/object/public', '');
      optimizedUrl = `${cdnUrl}${cleanPath}`;
    } catch (e) {
      console.warn('CDN URL replacement failed', e);
    }
  }

  const separator = optimizedUrl.includes('?') ? '&' : '?';
  return `${optimizedUrl}${separator}width=${width}&quality=85&format=webp`;
}
