/**
 * Scheme allowlist for URLs that reach `href`/`src` from note content.
 *
 * Note bodies are arbitrary markdown, so their link and image URLs are
 * untrusted input to the DOM. Without this the only thing standing between a
 * `javascript:` URL and execution is the Content-Security-Policy, which makes
 * the CSP a single point of failure for a class it was never meant to be the
 * sole control for.
 */

/** Substituted for any URL that fails the allowlist. */
export const SAFE_FALLBACK_URL = 'about:blank';

/**
 * Schemes permitted on a link. Everything else is replaced.
 *
 * Deliberately matches @milkdown/preset-commonmark's own SAFE_PROTOCOLS. Since
 * this sanitizer rewrites the document model, anything it rejects is blanked
 * before the editor ever sees it — being stricter than the library would
 * silently break legitimate `tel:`/`ftp:` links in a user's notes without
 * closing any script-execution vector.
 */
const ALLOWED_LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:', 'ftp:']);

/** A leading `scheme:`, per RFC 3986's scheme grammar. */
const SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;

export interface SanitizeOptions {
  /**
   * `image` additionally permits `data:image/*`, which the CSP already allows
   * via `img-src 'data:'`. Links never get `data:`.
   */
  kind?: 'link' | 'image';
}

/**
 * Return `url` unchanged when it is safe to place in `href`/`src`, otherwise
 * `SAFE_FALLBACK_URL`. Relative URLs carry no scheme and are always safe.
 */
export function sanitizeUrl(url: string, options: SanitizeOptions = {}): string {
  if (typeof url !== 'string') return SAFE_FALLBACK_URL;

  const trimmed = url.trim();
  if (trimmed === '') return SAFE_FALLBACK_URL;

  // Browsers ignore control characters and whitespace when parsing a scheme,
  // so `java\tscript:` runs. Strip them before matching, but return the
  // original string when the URL turns out to be safe.
  // eslint-disable-next-line no-control-regex
  const collapsed = trimmed.replace(/[\u0000-\u0020]/g, '');

  const scheme = SCHEME_PATTERN.exec(collapsed);
  if (!scheme) return url; // relative — no scheme to abuse

  const normalized = `${scheme[1]!.toLowerCase()}:`;

  if (options.kind === 'image' && normalized === 'data:') {
    return /^data:image\//i.test(collapsed) ? url : SAFE_FALLBACK_URL;
  }

  return ALLOWED_LINK_SCHEMES.has(normalized) ? url : SAFE_FALLBACK_URL;
}
