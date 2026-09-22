
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let path = url.pathname;
    
    // Default: Supabase
    let targetHost = 'sbnnpbtvdvggpqesohxa.supabase.co';
    
    // 1. Behance Logic: proxy known Behance image paths to Behance CDN.
    // Older synced images mainly use /project_modules/... while newer cover
    // images from RSS / profile APIs often use /projects/... .
    if (path.startsWith('/project_modules/') || path.startsWith('/projects/')) {
        targetHost = 'mir-s3-cdn-cf.behance.net';
        // Path remains as is (for example /project_modules/... or /projects/...)
    } 
    // 2. Supabase Logic (Existing): If not Behance, default to Supabase Storage
    else {
        // Auto-complete Supabase storage path if missing
        // If request is /project-images/xxx.jpg -> /storage/v1/object/public/project-images/xxx.jpg
        if (!path.startsWith('/storage/v1/object/public')) {
            path = `/storage/v1/object/public${path}`;
        }
    }

    const targetUrl = `https://${targetHost}${path}${url.search}`;

    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', targetHost);
    newHeaders.set('User-Agent', 'Cloudflare-Worker-Image-Proxy');
    newHeaders.set('Accept', '*/*');
    
    // Behance specific: Remove Referer to avoid potential hotlink protection
    if (targetHost.includes('behance')) {
        newHeaders.delete('Referer');
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: newHeaders,
        redirect: 'follow'
      });

      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');

      // Force Cache (1 year)
      if (response.status === 200) {
        responseHeaders.set('Cache-Control', 'public, max-age=31536000');
      }

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders
      });

    } catch (e) {
      return new Response(`Worker Error: ${e.message}`, { status: 502 });
    }
  },
};
