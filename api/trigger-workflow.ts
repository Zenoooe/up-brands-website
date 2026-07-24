import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow POST requests only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require an authenticated admin: the client sends its Supabase access token.
  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : '';

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase env vars for auth verification');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);

  if (authError || !userData?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Configuration - MUST SET THESE IN VERCEL ENVIRONMENT VARIABLES
  const GITHUB_PAT = process.env.GITHUB_PAT;
  const REPO_OWNER = 'Zenoooe';
  const REPO_NAME = 'up-brands-website';
  const WORKFLOW_FILE = 'sitemap-automation.yml';

  if (!GITHUB_PAT) {
    console.error('Missing GITHUB_PAT env var');
    return res.status(500).json({ error: 'Server configuration error: Missing GitHub Token' });
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main', // The branch to run the workflow on
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API Error:', errorText);
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    return res.status(200).json({ success: true, message: 'Workflow triggered successfully' });
  } catch (error: any) {
    console.error('Failed to trigger workflow:', error);
    return res.status(500).json({ error: error.message });
  }
}
