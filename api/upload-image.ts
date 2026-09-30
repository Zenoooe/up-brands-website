import type { VercelRequest, VercelResponse } from '@vercel/node';

// Uploads an image to the GitHub repo's dedicated `assets` branch and returns
// a jsDelivr CDN URL (free image hosting, no Supabase Storage usage).
//
// jsDelivr serves any branch/tag:
//   https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}

const GITHUB_PAT = process.env.GITHUB_PAT;
const REPO_OWNER = 'Zenoooe';
const REPO_NAME = 'up-brands-website';
const BRANCH = 'assets';
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}`;

// Allow slightly larger JSON payloads (base64 images). Vercel still caps the
// raw request body at ~4.5MB, so the client downscales before uploading.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

function sanitizeName(name: string) {
  const withoutExt = name.replace(/\.[^.]+$/, '');
  const cleaned = withoutExt
    .normalize('NFKD')
    // Keep unicode letters/numbers (including CJK) plus dash/underscore.
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return cleaned || 'image';
}

function parseDataUrl(data: string): { base64: string; contentType: string } {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(data);
  if (!match) {
    // Assume raw base64 string
    return { base64: data, contentType: 'image/jpeg' };
  }
  const [, contentType, isBase64, payload] = match;
  return {
    base64: isBase64 ? payload : Buffer.from(decodeURIComponent(payload)).toString('base64'),
    contentType: contentType || 'image/jpeg',
  };
}

async function githubFetch(path: string, init?: RequestInit) {
  return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${GITHUB_PAT}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

async function readError(res: Response) {
  const body = await res.text().catch(() => '');
  return `GitHub ${res.status}${body ? `: ${body.slice(0, 300)}` : ''}`;
}

async function ensureBranch() {
  const check = await githubFetch(`/branches/${BRANCH}`);
  if (check.ok) return;
  const checkInfo = await readError(check);

  // Branch missing → create it from the repo's default branch.
  const repoRes = await githubFetch('');
  if (!repoRes.ok) {
    throw new Error(`Unable to read repository info (${await readError(repoRes)}); branch check: ${checkInfo}`);
  }
  const repo = await repoRes.json();
  const defaultBranch = repo.default_branch || 'main';

  const refRes = await githubFetch(`/git/ref/heads/${defaultBranch}`);
  if (!refRes.ok) throw new Error(`Unable to read ${defaultBranch} branch (${await readError(refRes)})`);
  const ref = await refRes.json();

  const createRes = await githubFetch('/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: ref.object.sha }),
  });
  // 422 means it was created concurrently — that's fine.
  if (!createRes.ok && createRes.status !== 422) {
    throw new Error(`Unable to create ${BRANCH} branch (${await readError(createRes)})`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GITHUB_PAT) {
    console.error('Missing GITHUB_PAT env var');
    return res.status(500).json({ error: 'Server configuration error: Missing GitHub Token' });
  }

  try {
    const { data, url, filename, folder = 'blog' } = (req.body || {}) as {
      data?: string;
      url?: string;
      filename?: string;
      folder?: string;
    };

    if (!data && !url) {
      return res.status(400).json({ error: 'Provide either `data` (base64/data URL) or `url`' });
    }

    let base64: string;
    let contentType: string;
    const originalName = filename || (url ? url.split('?')[0].split('/').pop() || 'image' : 'image');

    if (data) {
      const parsed = parseDataUrl(data);
      base64 = parsed.base64;
      contentType = parsed.contentType;
    } else {
      const imgRes = await fetch(url as string, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        },
      });
      if (!imgRes.ok) {
        throw new Error(`Failed to fetch source image: ${imgRes.status}`);
      }
      contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await imgRes.arrayBuffer();
      base64 = Buffer.from(arrayBuffer).toString('base64');
    }

    const extFromName = originalName.includes('.') ? originalName.split('.').pop()!.toLowerCase() : '';
    const ext = EXT_BY_TYPE[contentType.split(';')[0].trim()] || extFromName || 'jpg';
    const safeFolder = (folder || 'blog').replace(/[^\p{L}\p{N}_-]+/gu, '').slice(0, 40) || 'blog';
    const safeName = sanitizeName(originalName);
    const path = `${safeFolder}/${Date.now()}-${safeName}.${ext}`;

    await ensureBranch();

    const uploadRes = await githubFetch(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `chore(assets): upload ${path}`,
        content: base64,
        branch: BRANCH,
      }),
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('GitHub upload error:', uploadRes.status, errorText);
      throw new Error(`GitHub upload failed: ${uploadRes.status}: ${errorText.slice(0, 300)}`);
    }

    const cdnUrl = `${CDN_BASE}/${path}`;
    return res.status(200).json({ success: true, url: cdnUrl, path });
  } catch (error: any) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ error: error?.message || 'Image upload failed' });
  }
}
