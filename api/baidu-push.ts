import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE = 'https://www.up-brands.com';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).json({ error: 'Missing url parameter' });
  }

  // The push token is a secret and must never be supplied by the client.
  const token = process.env.BAIDU_PUSH_TOKEN;
  if (!token) {
    console.error('Missing BAIDU_PUSH_TOKEN env var');
    return response
      .status(500)
      .json({ error: 'Server configuration error: Missing Baidu token' });
  }

  try {
    const baiduApi = `http://data.zz.baidu.com/urls?site=${encodeURIComponent(SITE)}&token=${encodeURIComponent(token)}`;
    const baiduResponse = await fetch(baiduApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: Array.isArray(url) ? url.join('\n') : (url as string),
    });

    const data = await baiduResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: 'Failed to push to Baidu' });
  }
}
