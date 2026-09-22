export type TitleSplitResult = {
  rawTitle: string;
  title: string;
  subtitle: string;
};

const TITLE_SPLIT_PATTERNS = [/\s+\|\s+/, /\s+｜\s+/, /\s+—\s+/, /\s+–\s+/];

export function normalizeProjectText(value?: string | null) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

export function splitProjectTitle(rawTitle?: string | null): TitleSplitResult {
  const cleanedTitle = normalizeProjectText((rawTitle || '').replace(/^[\s\-–—]+/, ''));

  if (!cleanedTitle) {
    return {
      rawTitle: '',
      title: '',
      subtitle: '',
    };
  }

  for (const pattern of TITLE_SPLIT_PATTERNS) {
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

export function isLegacySubtitleText(value?: string | null) {
  const normalized = normalizeProjectText(value);
  if (!normalized) return false;

  return /[|｜/]/.test(normalized) || normalized.length >= 24;
}

export function getProjectDisplaySubtitle(project: { subtitle?: string | null; category?: string | null }) {
  const subtitle = normalizeProjectText(project.subtitle);
  if (subtitle) return subtitle;

  const category = normalizeProjectText(project.category);
  // Check if it's JSON
  if (category && category.startsWith('{')) return '';
  return isLegacySubtitleText(category) ? category : '';
}

export function getProjectDisplayCategory(project: { category?: string | null }) {
  const category = normalizeProjectText(project.category);
  if (!category) return '';
  
  try {
    if (category.startsWith('{')) {
      const parsed = JSON.parse(category);
      const services = Array.isArray(parsed.services) ? parsed.services : [];
      const industries = Array.isArray(parsed.industries) ? parsed.industries : [];
      const allTags = [...services, ...industries];
      return allTags.join(', ');
    }
  } catch (e) {
    // fallback to string processing
  }

  if (isLegacySubtitleText(category)) return '';
  return category;
}
