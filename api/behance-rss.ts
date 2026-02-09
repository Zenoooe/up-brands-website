import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Missing username' });
  }

  try {
    // Add a random query param to bust Behance's server-side cache
    const rssUrl = `https://www.behance.net/feeds/user?username=${username}&t=${Date.now()}`;
    
    console.log(`Fetching Behance RSS: ${rssUrl}`);

    const response = await fetch(rssUrl, {
      headers: {
        // Pretend to be a bot or standard browser to ensure we get a response
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache, no-store'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Behance feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();

    // Check if we actually got XML
    if (!xmlText.includes('<?xml') && !xmlText.includes('<rss')) {
       console.warn('Response does not look like XML:', xmlText.substring(0, 100));
       // It might be a Cloudflare challenge or HTML error page
    }

    // Pass the XML back to the client
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.status(200).send(xmlText);

  } catch (error: any) {
    console.error('Behance RSS Error:', error);
    res.status(500).json({ error: 'Failed to fetch Behance feed', details: error.message });
  }
}
