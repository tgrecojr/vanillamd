import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sanitizeUrl, SAFE_FALLBACK_URL } from './urlSafety.js';

describe('markdown URL scheme allowlist', () => {
  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    '  javascript:alert(1)',
    'java\tscript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  ])('neutralises %s', (url) => {
    expect(sanitizeUrl(url)).toBe(SAFE_FALLBACK_URL);
  });

  it.each([
    'https://example.com/page',
    'http://example.com/page',
    'mailto:someone@example.com',
    '/relative/path.md',
    './sibling.md',
    '../parent.md',
    '#anchor',
    'plain-relative.md',
  ])('passes %s through unchanged', (url) => {
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('handles empty and non-string input safely', () => {
    expect(sanitizeUrl('')).toBe(SAFE_FALLBACK_URL);
    expect(sanitizeUrl(undefined as unknown as string)).toBe(SAFE_FALLBACK_URL);
  });

  it('allows data: images but never data: links', () => {
    // Images are already permitted by the CSP's img-src 'data:'.
    expect(sanitizeUrl('data:image/png;base64,iVBORw0KGgo=', { kind: 'image' })).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    );
    expect(sanitizeUrl('data:text/html;base64,PHN2Zz4=', { kind: 'image' })).toBe(
      SAFE_FALLBACK_URL,
    );
  });

  it('treats a scheme-relative URL as an ordinary external link', () => {
    // `//evil.com` resolves to https://evil.com. That is exactly what an
    // explicit https:// link would do, and external links are permitted by
    // design, so this is intentional rather than a bypass. Pinned so a future
    // change to the allowlist has to decide about it deliberately.
    expect(sanitizeUrl('//example.com/page')).toBe('//example.com/page');
  });

  it('is wired into the editor through the document-level sanitizer', async () => {
    // Asserting only that Editor.tsx mentions the sanitizer would pass even
    // against wiring that has no effect, which is how the first attempt at this
    // fix slipped through. The behavioural proof lives in
    // urlSanitizerPlugin.test.ts; this just pins the wiring's shape.
    const editor = await readFile(resolve(import.meta.dirname, 'components/Editor.tsx'), 'utf8');
    expect(editor).toContain('sanitizeDocUrls');
    expect(editor).toContain('appendTransaction');
    // The attr-only override is inert against the commonmark preset's toDOM
    // spread — it must not come back.
    expect(editor).not.toContain('linkAttr.key');
    expect(editor).not.toContain('imageAttr.key');
  });
});
