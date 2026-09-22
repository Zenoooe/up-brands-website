import { splitProjectTitle } from './project-metadata';

export type BehanceProjectItem = {
  id: string;
  rawTitle: string;
  title: string;
  subtitle: string;
  link: string;
  imageUrl: string;
  sourceCategory: string;
};

export type BehanceProjectsResult = {
  projects: BehanceProjectItem[];
  total: number;
  pageCount: number;
};

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

export function parseBehanceRssXml(xmlText: string): BehanceProjectsResult {
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
