import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow POST requests from your domain or Supabase
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Configuration - MUST SET THESE IN VERCEL ENVIRONMENT VARIABLES
  const GITHUB_PAT = process.env.GITHUB_PAT;
  const REPO_OWNER = 'Up-Brands'; // Assuming Organization/User name
  const REPO_NAME = 'newweb';     // Assuming Repo name
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