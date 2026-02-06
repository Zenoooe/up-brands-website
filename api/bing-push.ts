import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const sitemapUrl = 'https://www.up-brands.com/sitemap.xml';
    // Bing Ping API
    // https://www.bing.com/ping?sitemap=http%3A%2F%2Fwww.example.com%2Fsitemap.xml
    const bingApi = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    await fetch(bingApi);

    return response.status(200).json({ success: true, message: 'Bing pinged successfully' });
  } catch (error) {
    return response.status(500).json({ error: 'Failed to ping Bing' });
  }
}
