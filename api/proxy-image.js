import { validateExternalUrl } from './_lib/ssrfGuard.js';

// Hosts we are willing to proxy images from. Extend via env if needed.
const ALLOWED_HOSTS = (process.env.IMAGE_PROXY_ALLOWED_HOSTS ||
  'behance.net,adobe.com,adobestatic.com')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

export default async function handler(req, res) {
  const { url } = req.query;

  const check = validateExternalUrl(url, ALLOWED_HOSTS);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }

  try {
    // Add User-Agent to mimic a browser, sometimes helps with strict CDNs
    const response = await fetch(check.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Only proxy actual image payloads back to the client.
    if (!contentType.startsWith('image/')) {
      return res.status(415).json({ error: 'Upstream response is not an image' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    res.send(buffer);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch image', details: error.message });
  }
}
