export function getVimeoId(url: string) {
  if (!url) return null;
  // Matches: vimeo.com/123456, player.vimeo.com/video/123456
  const match = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
  return match ? match[1] : null;
}
