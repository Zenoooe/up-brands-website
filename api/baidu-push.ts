import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { site, token, url } = request.query;

  if (!site || !token || !url) {
    return response.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const baiduApi = `http://data.zz.baidu.com/urls?site=${site}&token=${token}`;
    const baiduResponse = await fetch(baiduApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: url as string,
    });

    const data = await baiduResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: 'Failed to push to Baidu' });
  }
}