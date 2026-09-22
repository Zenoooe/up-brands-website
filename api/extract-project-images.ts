import type { VercelRequest, VercelResponse } from '@vercel/node';

const FETCH_TIMEOUT_MS = 12000;
const BEHANCE_API_TIMEOUT_MS = 8000;
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const BEHANCE_OFFICIAL_API_URL = 'https://api.behance.net/v2';

function cleanImageUrl(url: string) {
  const unescaped = url.replace(/\\/g, '').replace('/rendition', '');

  for (const ext of VALID_EXTENSIONS) {
    const index = unescaped.toLowerCase().indexOf(ext);
    if (index !== -1) {
      return unescaped.substring(0, index + ext.length);
    }
  }

  return '';
}

function isProjectPageUrl(value?: string | null) {
  const normalized = (value || '').trim();
  return /behance\.net\/gallery\//i.test(normalized) || /zcool\.com\.cn\/work\//i.test(normalized);
}

function isBehanceProjectUrl(value?: string | null) {
  return /behance\.net\/gallery\//i.test((value || '').trim());
}

function getBehanceProjectId(value?: string | null) {
  const match = (value || '').match(/behance\.net\/gallery\/(\d+)\//i);
  return match?.[1] || '';
}

function getBehanceApiKey() {
  return (
    process.env.BEHANCE_API_KEY ||
    process.env.BEHANCE_CLIENT_ID ||
    process.env.BEHANCE_CLIENTID ||
    ''
  ).trim();
}

function mergeUniqueImageUrls(existing: string[], incoming: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const url of [...existing, ...incoming]) {
    const normalized = cleanImageUrl(url) || url.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    merged.push(normalized);
  }

  return merged;
}

function extractProjectImagesFromHtml(htmlInput: string) {
  const broadRegex =
    /(https?:\\?\/\\?\/[a-zA-Z0-9.-]*behance\.net\\?\/project_modules\\?\/[^"'\s),]+|https?:\\?\/\\?\/img\.zcool\.cn\\?\/[a-zA-Z0-9.\/_\\-]+\.(?:jpg|jpeg|png|webp|gif))/gi;

  const rawMatches = htmlInput.match(broadRegex) || [];
  if (rawMatches.length === 0) return [];

  const imageGroups: Record<string, string[]> = {};
  const order: string[] = [];

  for (const rawUrl of rawMatches) {
    const cleanedUrl = cleanImageUrl(rawUrl);
    if (!cleanedUrl) continue;

    if (cleanedUrl.includes('zcool.cn')) {
      const filename = cleanedUrl.split('/').pop() || cleanedUrl;
      if (!imageGroups[filename]) {
        imageGroups[filename] = [];
        order.push(filename);
      }
      if (!imageGroups[filename].includes(cleanedUrl)) {
        imageGroups[filename].push(cleanedUrl);
      }
      continue;
    }

    const filename = cleanedUrl.split('/').pop() || cleanedUrl;
    const id = filename.substring(0, filename.lastIndexOf('.')) || filename;
    if (!imageGroups[id]) {
      imageGroups[id] = [];
      order.push(id);
    }
    if (!imageGroups[id].includes(cleanedUrl)) {
      imageGroups[id].push(cleanedUrl);
    }
  }

  const finalImages: string[] = [];

  for (const id of order) {
    const urls = imageGroups[id];
    if (!urls?.length) continue;

    if (urls[0].includes('zcool.cn')) {
      finalImages.push(urls[0]);
      continue;
    }

    const best =
      urls.find((url) => url.includes('max_3840_webp')) ||
      urls.find((url) => url.includes('max_3840')) ||
      urls.find((url) => url.includes('2800_webp')) ||
      urls.find((url) => url.includes('2800_opt_1')) ||
      urls.find((url) => url.includes('source')) ||
      urls.find((url) => url.includes('fs_')) ||
      urls.find((url) => url.includes('1400_opt_1')) ||
      urls.find((url) => url.includes('max_1200')) ||
      urls[0];

    finalImages.push(best);
  }

  return mergeUniqueImageUrls([], finalImages);
}

function collectStringUrls(value: unknown, bucket: string[]) {
  if (!value) return;

  if (typeof value === 'string') {
    const normalized = cleanImageUrl(value) || value.trim();
    if (normalized) bucket.push(normalized);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStringUrls(item, bucket);
    return;
  }

  if (typeof value === 'object') {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      collectStringUrls(nestedValue, bucket);
    }
  }
}

function extractBehanceImagesFromModules(modules: unknown) {
  if (!Array.isArray(modules)) return [];

  const collected: string[] = [];

  for (const module of modules) {
    if (!module || typeof module !== 'object') continue;

    const moduleRecord = module as Record<string, unknown>;
    if (moduleRecord.type !== 'image') continue;

    collectStringUrls(moduleRecord.src, collected);
    collectStringUrls(moduleRecord.sizes, collected);
    collectStringUrls(moduleRecord.original, collected);
    collectStringUrls(moduleRecord.image, collected);
  }

  return mergeUniqueImageUrls([], collected);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Project page request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchBehanceImagesViaOfficialApi(projectId: string, apiKey: string) {
  const url = `${BEHANCE_OFFICIAL_API_URL}/projects/${encodeURIComponent(projectId)}?api_key=${encodeURIComponent(apiKey)}`;
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      },
    },
    BEHANCE_API_TIMEOUT_MS,
  );

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Behance official API request failed: ${response.status} ${bodyText.slice(0, 200)}`);
  }

  const payload = JSON.parse(bodyText) as {
    project?: {
      modules?: unknown;
    };
  };

  return extractBehanceImagesFromModules(payload.project?.modules);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const urlParam = req.query.url;
  const projectUrl = Array.isArray(urlParam) ? urlParam[0] : urlParam;

  if (!projectUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  if (!isProjectPageUrl(projectUrl)) {
    return res.status(400).json({ error: 'Only Behance or ZCOOL project links are supported' });
  }

  try {
    const behanceApiKey = getBehanceApiKey();
    const behanceProjectId = isBehanceProjectUrl(projectUrl) ? getBehanceProjectId(projectUrl) : '';

    if (behanceApiKey && behanceProjectId) {
      try {
        const images = await fetchBehanceImagesViaOfficialApi(behanceProjectId, behanceApiKey);
        if (images.length > 0) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          return res.status(200).json({
            images,
            total: images.length,
            source: 'api',
          });
        }
      } catch (officialApiError) {
        console.warn('Behance official API image extraction failed, falling back to page extraction:', officialApiError);
      }
    }

    const response = await fetchWithTimeout(
      projectUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cache-Control': 'no-cache, no-store',
        },
      },
      FETCH_TIMEOUT_MS,
    );

    const html = await response.text();

    if (!response.ok) {
      if (response.status === 403) {
        return res.status(403).json({
          error: 'Project page blocked the request',
          details:
            behanceProjectId
              ? 'Behance blocked direct server-side extraction for this page. Add BEHANCE_API_KEY in Vercel to unlock API-based extraction, or use the HTML extractor fallback for now.'
              : 'Behance blocked direct server-side extraction for this page. Use the HTML extractor fallback for now, or try a ZCOOL link.',
        });
      }

      throw new Error(`Failed to fetch project page: ${response.status} ${response.statusText}`);
    }

    const images = extractProjectImagesFromHtml(html);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).json({
      images,
      total: images.length,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Project image extraction error:', error);
    return res.status(500).json({
      error: 'Failed to extract project images',
      details,
    });
  }
}
