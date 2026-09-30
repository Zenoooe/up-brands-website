// Client helpers for uploading images to the GitHub-hosted CDN (jsDelivr).
// Images are stored on the repo's `assets` branch via /api/upload-image.

const MAX_WIDTH = 1600;
const MAX_SOURCE_BYTES = 1.5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// Downscale / recompress large raster images so they stay under the serverless
// request body limit. SVG and GIF are uploaded as-is to preserve vectors/animation.
async function prepareImage(file: File): Promise<{ data: string; filename: string }> {
  const dataUrl = await readAsDataUrl(file);

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return { data: dataUrl, filename: file.name };
  }

  try {
    const img = await loadImage(dataUrl);
    const needsResize = img.width > MAX_WIDTH;
    const needsRecompress = file.size > MAX_SOURCE_BYTES;
    if (!needsResize && !needsRecompress) {
      return { data: dataUrl, filename: file.name };
    }

    const scale = Math.min(1, MAX_WIDTH / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return { data: dataUrl, filename: file.name };

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const outputType = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
    const quality = outputType === 'image/webp' ? 0.92 : 0.85;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return {
      data: canvas.toDataURL(outputType, quality),
      filename: `${baseName}.${outputType === 'image/webp' ? 'webp' : 'jpg'}`,
    };
  } catch {
    return { data: dataUrl, filename: file.name };
  }
}

export async function uploadImageFile(file: File, folder = 'blog'): Promise<string> {
  const { data, filename } = await prepareImage(file);
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, filename, folder }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) {
    throw new Error(json.error || 'Image upload failed');
  }
  return json.url as string;
}

export async function uploadImageFromUrl(url: string, folder = 'blog', filename?: string): Promise<string> {
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, folder, filename }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) {
    throw new Error(json.error || 'Image upload failed');
  }
  return json.url as string;
}
