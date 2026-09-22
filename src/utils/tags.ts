export interface ProjectTags {
  services: string[];
  industries: string[];
}

export function parseProjectTags(categoryStr?: string): ProjectTags {
  if (!categoryStr) return { services: [], industries: [] };
  try {
    const parsed = JSON.parse(categoryStr);
    return {
      services: Array.isArray(parsed?.services) ? parsed.services : [],
      industries: Array.isArray(parsed?.industries) ? parsed.industries : []
    };
  } catch (e) {
    // legacy fallback
    return { services: [], industries: [] };
  }
}

export function stringifyProjectTags(tags: ProjectTags): string {
  return JSON.stringify(tags);
}
