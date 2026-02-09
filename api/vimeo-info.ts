import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url, id } = req.query;
  
  // Construct Vimeo URL
  let vimeoUrl = '';
  if (url) {
    vimeoUrl = Array.isArray(url) ? url[0] : url;
  } else if (id) {
    vimeoUrl = `https://vimeo.com/${id}`;
  } else {
    return res.status(400).json({ error: 'Missing url or id parameter' });
  }

  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`;
    
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      throw new Error(`Vimeo API responded with ${response.status}`);
    }

    const data = await response.json();
    
    // Cache for 24 hours (metadata doesn't change often)
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    res.status(200).json(data);

  } catch (error: any) {
    console.error('Vimeo Info Error:', error);
    res.status(500).json({ error: 'Failed to fetch Vimeo info', details: error.message });
  }
}
