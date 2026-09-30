
export function toWpImageProxyUrl(url: string) {
  const cleaned = url.replace(/^https?:\/\//, '');
  return `https://i0.wp.com/${cleaned}`;
}

export function getValidImageUrl(backupUrl?: string | null, primaryUrl?: string | null): string {
  if (backupUrl && !backupUrl.includes('supabase.co')) {
    return backupUrl;
  }
  return primaryUrl || '';
}

export const getSupabaseUrl = (url: string, width = 800) => {
  if (!url) return '';

  // 0. jsDelivr CDN (GitHub-hosted assets) - serve directly, no proxy needed
  if (url.includes('cdn.jsdelivr.net')) {
    return url;
  }

  // 1. Unsplash Optimization (Direct)
  if (url.includes('images.unsplash.com')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('q', '80');
    urlObj.searchParams.set('fm', 'webp');
    urlObj.searchParams.set('fit', 'max');
    return urlObj.toString();
  }

  // 2. Supabase Optimization (Convert to CDN)
  // NOTE: User has emptied the Supabase bucket and wants to stop using it completely.
  // Any remaining supabase.co URLs should be left as is (they will 404 naturally since bucket is empty,
  // but we shouldn't try to format them or proxy them if they are dead anyway).
  if (url.includes('supabase.co')) {
    return url;
  }

  // 3. Behance Optimization (Proxy via your CDN)
  // If you want to use Behance images but serve them via your Cloudflare CDN
  if (url.includes('behance.net')) {
    const cdnUrl = import.meta.env.VITE_SUPABASE_CDN_URL || 'https://cdn.up-brands.com';
    if (cdnUrl) {
      try {
        const urlObj = new URL(url);
        // Clean path: /project_modules/max_1200/xxxx.jpg
        const proxyPath = urlObj.pathname;
        return `${cdnUrl}${proxyPath}`;
      } catch (e) {
        return url;
      }
    }
  }

  // 4. ZCOOL Images (Direct CDN, no proxy needed)
  if (url.includes('zcool.cn') || url.includes('zcool.com.cn')) {
    // IMPORTANT: Some ZCOOL image links use `http://` in their raw HTML. 
    // If our site is on `https://`, browsers will block mixed active content.
    // So we force upgrade any ZCOOL link to https.
    
    // Zcool often uses WebP or other formats that require proper headers,
    // but a direct img src usually works.
    let finalUrl = url;
    if (finalUrl.startsWith('http://')) {
        finalUrl = finalUrl.replace('http://', 'https://');
    }
    
    // Sometimes Zcool CDN blocks requests without proper Referer (403 Forbidden).
    // If this happens, we might need a proxy, but let's try direct first with https.
    return finalUrl;
  }

  // 5. Fallback for other external images (Proxy via WP CDN)
  // Ensures that any other external image link also goes through a CDN
  if (url.startsWith('http') && 
      !url.includes('localhost') && 
      !url.includes('cdn.up-brands.com') &&
      !url.includes(import.meta.env.VITE_SUPABASE_CDN_URL || 'cdn.up-brands.com')) {
    return toWpImageProxyUrl(url);
  }

  return url;
};
