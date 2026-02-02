import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contact, message } = req.body;
  const PUSHPLUS_TOKEN = process.env.PUSHPLUS_TOKEN;

  if (!contact) {
    return res.status(400).json({ error: 'Contact info is required' });
  }

  try {
    if (PUSHPLUS_TOKEN) {
        // Send to PushPlus (WeChat)
        await fetch('http://www.pushplus.plus/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: PUSHPLUS_TOKEN,
                title: 'New Lead from Up-Brands',
                content: `Contact: ${contact}\n\nHistory:\n${message}`,
                template: 'txt'
            })
        });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
