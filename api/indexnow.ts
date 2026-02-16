import type { VercelRequest, VercelResponse } from '@vercel/node';

// This API endpoint handles URL submission to IndexNow protocol (supported by Bing, Yandex, etc.)
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Allow GET (query) or POST (body) parameters
  const url = request.query.url || request.body?.url;
  
  // Use existing key from public directory
  const key = process.env.INDEXNOW_KEY || 'a3cd48afa2594bc6b12faaa904168506';
  const host = 'www.up-brands.com';

  if (!url) {
    return response.status(400).json({ error: 'Missing url parameter' });
  }

  // Construct payload according to IndexNow spec
  const urlList = Array.isArray(url) ? url : [url];
  const payload = {
    host: host,
    key: key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: urlList
  };

  try {
    // Submit to IndexNow and Bing endpoints
    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow'
    ];

    await Promise.all(endpoints.map(endpoint => 
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      })
    ));

    return response.status(200).json({ 
      success: true, 
      message: `Successfully submitted ${urlList.length} URL(s) to IndexNow`,
      submitted: urlList
    });
  } catch (error) {
    console.error('IndexNow Error:', error);
    return response.status(500).json({ error: 'Failed to submit to IndexNow' });
  }
}
