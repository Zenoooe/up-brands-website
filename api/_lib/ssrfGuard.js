// SSRF guard for server-side "fetch a user-supplied URL" endpoints.
// Rejects non-HTTP(S) schemes, credentials in the URL, and hosts that are not
// on the allowlist (private/internal ranges are never on the allowlist).

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^169\.254\./, // link-local (incl. cloud metadata 169.254.169.254)
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isHostAllowed(hostname, allowedHostSuffixes) {
  const host = hostname.toLowerCase();
  if (PRIVATE_HOST_PATTERNS.some((re) => re.test(host))) return false;
  return allowedHostSuffixes.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/**
 * Validates a user-supplied URL for safe server-side fetching.
 * @param {unknown} rawUrl
 * @param {string[]} allowedHostSuffixes - e.g. ['behance.net']
 * @returns {{ ok: true, url: string } | { ok: false, error: string }}
 */
export function validateExternalUrl(rawUrl, allowedHostSuffixes) {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return { ok: false, error: 'Invalid url parameter' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'Malformed url parameter' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http(s) URLs are allowed' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Credentials are not allowed in url' };
  }

  if (!isHostAllowed(parsed.hostname, allowedHostSuffixes)) {
    return { ok: false, error: 'URL host is not allowed' };
  }

  return { ok: true, url: parsed.toString() };
}
