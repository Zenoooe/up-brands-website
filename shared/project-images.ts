const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

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

export function isProjectPageUrl(value?: string | null) {
  const normalized = (value || '').trim();
  return /behance\.net\/gallery\//i.test(normalized) || /zcool\.com\.cn\/work\//i.test(normalized);
}

export function mergeUniqueImageUrls(existing: string[], incoming: string[]) {
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

export function extractProjectImagesFromHtml(htmlInput: string) {
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
