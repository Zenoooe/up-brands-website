import { parseBehanceRssXml, type BehanceProjectItem, type BehanceProjectsResult } from '../shared/behance';
import { splitProjectTitle } from '../shared/project-metadata';

type BehanceGraphQLResponse = {
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
          covers?: {
            size_808?: { url?: string | null } | null;
            size_404?: { url?: string | null } | null;
            size_202?: { url?: string | null } | null;
          } | null;
          fields?: Array<{
            label?: string | null;
          }> | null;
          isPrivate?: boolean | null;
          isHiddenFromWorkTab?: boolean | null;
        }> | null;
      } | null;
    } | null;
  };
  errors?: Array<{
    message?: string;
  }>;
};

const BEHANCE_GRAPHQL_URL = 'https://www.behance.net/v3/graphql';
const PAGE_SIZE = 12;
const MAX_PAGES = 50;
const GRAPHQL_TIMEOUT_MS = 4500;
const RSS_TIMEOUT_MS = 8000;

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

function pickCategory(labels: string[]) {
  if (labels.includes('Branding')) return 'Branding';
  if (labels.length > 0) return labels[0];
  return 'Branding';
}

function pickImageUrl(covers: BehanceGraphQLResponse['data']['user']['profileProjects']['nodes'][number]['covers']) {
  return covers?.size_808?.url || covers?.size_404?.url || covers?.size_202?.url || '';
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
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchBehanceProjectsPage(username: string, after?: string | null) {
  const response = await fetchWithTimeout(BEHANCE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'Referer': `https://www.behance.net/${username}/projects`,
      'Origin': 'https://www.behance.net',
    },
    body: JSON.stringify({
      query: PROFILE_PROJECTS_QUERY,
      variables: {
        username,
        after: after || null,
      },
    }),
  }, GRAPHQL_TIMEOUT_MS);

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`Behance GraphQL request failed: ${response.status} ${bodyText.slice(0, 200)}`);
  }

  const payload = JSON.parse(bodyText) as BehanceGraphQLResponse;
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

export async function fetchAllBehanceProjects(username: string): Promise<BehanceProjectsResult> {
  const projects: BehanceProjectItem[] = [];
  let after: string | null | undefined = null;
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    const { pageInfo, nodes } = await fetchBehanceProjectsPage(username, after);
    pageCount += 1;

    for (const node of nodes) {
      if (!node?.id || !node?.name || !node?.url) {
        continue;
      }

      if (node.isPrivate || node.isHiddenFromWorkTab) {
        continue;
      }

      const imageUrl = pickImageUrl(node.covers);
      if (!imageUrl) {
        continue;
      }

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

  const uniqueProjects = Array.from(
    new Map(projects.map((project) => [project.id, project])).values(),
  );

  return {
    projects: uniqueProjects,
    total: uniqueProjects.length,
    pageCount,
  };
}

export async function fetchBehanceRssProjects(username: string): Promise<BehanceProjectsResult> {
  const rssUrl = `https://www.behance.net/feeds/user?username=${encodeURIComponent(username)}&t=${Date.now()}`;
  const response = await fetchWithTimeout(rssUrl, {
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    },
  }, RSS_TIMEOUT_MS);

  const xmlText = await response.text();
  if (!response.ok) {
    throw new Error(`Behance RSS request failed: ${response.status} ${xmlText.slice(0, 200)}`);
  }

  return parseBehanceRssXml(xmlText);
}
