import type { VercelRequest, VercelResponse } from '@vercel/node';

type BehanceProjectItem = {
  id: string;
  rawTitle: string;
  title: string;
  subtitle: string;
  link: string;
  imageUrl: string;
  sourceCategory: string;
};

const RSS_TIMEOUT_MS = 12000;
const OFFICIAL_API_TIMEOUT_MS = 8000;
const GRAPHQL_TIMEOUT_MS = 4500;
const PAGE_SIZE = 12;
const MAX_PAGES = 50;
const BEHANCE_GRAPHQL_URL = 'https://www.behance.net/v3/graphql';
const BEHANCE_OFFICIAL_API_URL = 'https://api.behance.net/v2';

const PROFILE_PROJECTS_QUERY = `
  query GetProfileProjects($username: String, $after: String) {
    user(username: $username) {
      profileProjects(first: 12, after: $after) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          id
          name
          url
          isPrivate
          isHiddenFromWorkTab
          covers {
            size_808 {
              url
            }
            size_404 {
              url
            }
            size_202 {
              url
            }
          }
          fields {
            label
          }
        }
      }
    }
  }
`;

function normalizeProjectText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function splitProjectTitle(rawTitle: string) {
  const cleanedTitle = normalizeProjectText(rawTitle.replace(/^[\s\-–—]+/, ''));
  const patterns = [/\s+\|\s+/, /\s+｜\s+/, /\s+—\s+/, /\s+–\s+/];

  for (const pattern of patterns) {
    if (!pattern.test(cleanedTitle)) continue;

    const [titlePart, ...restParts] = cleanedTitle.split(pattern);
    const title = normalizeProjectText(titlePart);
    const subtitle = normalizeProjectText(restParts.join(' | '));

    if (title && subtitle) {
      return {
        rawTitle: cleanedTitle,
        title,
        subtitle,
      };
    }
  }

  return {
    rawTitle: cleanedTitle,
    title: cleanedTitle,
    subtitle: '',
  };
}

function decodeXmlText(value: string) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTagValue(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i'));
  return match ? decodeXmlText(match[1].trim()) : '';
}

function parseBehanceRssXml(xmlText: string) {
  const itemBlocks = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  const projects: BehanceProjectItem[] = [];

  for (const item of itemBlocks) {
    const rawTitle = extractTagValue(item, 'title') || 'Untitled';
    const link = extractTagValue(item, 'link');
    const description = extractTagValue(item, 'description');
    const sourceCategory = extractTagValue(item, 'category') || 'Branding';
    const idMatch = link.match(/\/gallery\/(\d+)\//);
    const imageMatch = description.match(/src=["']([^"']+)["']/i);
    const { title, subtitle } = splitProjectTitle(rawTitle);

    if (!idMatch || !imageMatch?.[1]) {
      continue;
    }

    projects.push({
      id: idMatch[1],
      rawTitle,
      title,
      subtitle,
      link,
      imageUrl: imageMatch[1],
      sourceCategory,
    });
  }

  return {
    projects,
    total: projects.length,
    pageCount: projects.length > 0 ? 1 : 0,
  };
}

function pickCategory(labels: string[]) {
  if (labels.includes('Branding')) return 'Branding';
  if (labels.length > 0) return labels[0];
  return 'Branding';
}

function pickImageUrl(covers?: {
  size_808?: { url?: string | null } | null;
  size_404?: { url?: string | null } | null;
  size_202?: { url?: string | null } | null;
} | null) {
  return covers?.size_808?.url || covers?.size_404?.url || covers?.size_202?.url || '';
}

function getBehanceApiKey() {
  return (
    process.env.BEHANCE_API_KEY ||
    process.env.BEHANCE_CLIENT_ID ||
    process.env.BEHANCE_CLIENTID ||
    ''
  ).trim();
}

function pickOfficialApiImageUrl(covers?: Record<string, unknown> | null) {
  if (!covers || typeof covers !== 'object') return '';

  const candidateKeys = ['original', 'max_808', '808', '404', '202', '230', '115'];
  for (const key of candidateKeys) {
    const value = covers[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  for (const value of Object.values(covers)) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
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
      throw new Error(`Behance RSS request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchBehanceProjectsPage(username: string, after?: string | null) {
  const response = await fetchWithTimeout(
    BEHANCE_GRAPHQL_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        Referer: `https://www.behance.net/${username}/projects`,
        Origin: 'https://www.behance.net',
      },
      body: JSON.stringify({
        query: PROFILE_PROJECTS_QUERY,
        variables: {
          username,
          after: after || null,
        },
      }),
    },
    GRAPHQL_TIMEOUT_MS,
  );

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Behance GraphQL request failed: ${response.status} ${bodyText.slice(0, 200)}`);
  }

  const payload = JSON.parse(bodyText) as {
    data?: {
      user?: {
        profileProjects?: {
          pageInfo?: {
            endCursor?: string | null;
            hasNextPage?: boolean | null;
          };
          nodes?: Array<{
            id?: number | null;
            name?: string | null;
            url?: string | null;
            isPrivate?: boolean | null;
            isHiddenFromWorkTab?: boolean | null;
            covers?: {
              size_808?: { url?: string | null } | null;
              size_404?: { url?: string | null } | null;
              size_202?: { url?: string | null } | null;
            } | null;
            fields?: Array<{ label?: string | null }> | null;
          }> | null;
        } | null;
      } | null;
    };
    errors?: Array<{ message?: string }>;
  };

  const graphQLError = payload.errors?.find((error) => error?.message)?.message;
  if (graphQLError) {
    throw new Error(`Behance GraphQL error: ${graphQLError}`);
  }

  const page = payload.data?.user?.profileProjects;
  return {
    pageInfo: page?.pageInfo || { endCursor: null, hasNextPage: false },
    nodes: page?.nodes || [],
  };
}

async function fetchOfficialBehanceProjectsPage(username: string, apiKey: string, page: number) {
  const url = `${BEHANCE_OFFICIAL_API_URL}/users/${encodeURIComponent(username)}/projects?api_key=${encodeURIComponent(apiKey)}&page=${page}`;
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
    OFFICIAL_API_TIMEOUT_MS,
  );

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Behance official API request failed: ${response.status} ${bodyText.slice(0, 200)}`);
  }

  return JSON.parse(bodyText) as {
    projects?: Array<{
      id?: number | null;
      name?: string | null;
      url?: string | null;
      fields?: string[] | null;
      covers?: Record<string, unknown> | null;
    }>;
  };
}

async function fetchOfficialBehanceProjects(username: string, apiKey: string) {
  const projects: BehanceProjectItem[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const payload = await fetchOfficialBehanceProjectsPage(username, apiKey, page);
    const pageProjects = payload.projects || [];

    for (const project of pageProjects) {
      if (!project?.id || !project?.name || !project?.url) continue;

      const imageUrl = pickOfficialApiImageUrl(project.covers);
      if (!imageUrl) continue;

      const labels = Array.isArray(project.fields)
        ? project.fields.map((field) => String(field || '').trim()).filter(Boolean)
        : [];
      const { rawTitle, title, subtitle } = splitProjectTitle(project.name);

      projects.push({
        id: String(project.id),
        rawTitle,
        title,
        subtitle,
        link: project.url,
        imageUrl,
        sourceCategory: pickCategory(labels),
      });
    }

    if (pageProjects.length < PAGE_SIZE) break;
    page += 1;
  }

  const uniqueProjects = Array.from(new Map(projects.map((project) => [project.id, project])).values());

  return {
    projects: uniqueProjects,
    total: uniqueProjects.length,
    pageCount: page,
  };
}

async function fetchAllBehanceProjects(username: string) {
  const projects: BehanceProjectItem[] = [];
  let after: string | null | undefined = null;
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const { pageInfo, nodes } = await fetchBehanceProjectsPage(username, after);
    pageCount += 1;

    for (const node of nodes) {
      if (!node?.id || !node?.name || !node?.url) continue;
      if (node.isPrivate || node.isHiddenFromWorkTab) continue;

      const imageUrl = pickImageUrl(node.covers);
      if (!imageUrl) continue;

      const labels = (node.fields || [])
        .map((field) => field?.label?.trim() || '')
        .filter(Boolean);
      const { rawTitle, title, subtitle } = splitProjectTitle(node.name);

      projects.push({
        id: String(node.id),
        rawTitle,
        title,
        subtitle,
        link: node.url,
        imageUrl,
        sourceCategory: pickCategory(labels),
      });
    }

    if (!pageInfo?.hasNextPage || !pageInfo?.endCursor || nodes.length < PAGE_SIZE) {
      break;
    }

    after = pageInfo.endCursor;
  }

  const uniqueProjects = Array.from(new Map(projects.map((project) => [project.id, project])).values());

  return {
    projects: uniqueProjects,
    total: uniqueProjects.length,
    pageCount,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const usernameParam = req.query.username;
  const username = Array.isArray(usernameParam) ? usernameParam[0] : usernameParam;

  if (!username) {
    return res.status(400).json({ error: 'Missing username' });
  }

  try {
    const behanceApiKey = getBehanceApiKey();

    if (behanceApiKey) {
      try {
        const officialApiResult = await fetchOfficialBehanceProjects(username, behanceApiKey);
        if (officialApiResult.projects.length > 0) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          return res.status(200).json({
            ...officialApiResult,
            source: 'api',
          });
        }
      } catch (officialApiError) {
        console.warn('Behance official API fetch failed, falling back to GraphQL:', officialApiError);
      }
    }

    try {
      const graphQlResult = await fetchAllBehanceProjects(username);
      if (graphQlResult.projects.length > 0) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return res.status(200).json({
          ...graphQlResult,
          source: 'graphql',
        });
      }
    } catch (graphQlError) {
      console.warn('Behance GraphQL fetch failed, falling back to RSS:', graphQlError);
    }

    const rssUrl = `https://www.behance.net/feeds/user?username=${encodeURIComponent(username)}&t=${Date.now()}`;
    const response = await fetchWithTimeout(
      rssUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache, no-store',
        },
      },
      RSS_TIMEOUT_MS,
    );

    const xmlText = await response.text();

    if (!response.ok) {
      throw new Error(`Failed to fetch Behance feed: ${response.status} ${response.statusText}`);
    }

    const result = parseBehanceRssXml(xmlText);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).json({
      ...result,
      source: 'rss',
      warning: 'Behance currently exposes only the latest RSS items for automated sync, so older projects must be added manually.',
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Behance projects error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Behance projects',
      details,
    });
  }
}
