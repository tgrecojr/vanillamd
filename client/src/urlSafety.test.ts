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

  it('is wired into the editor, not just defined', async () => {
    const editor = await readFile(resolve(import.meta.dirname, 'components/Editor.tsx'), 'utf8');
    expect(editor).toContain('sanitizeUrl');
  });
});
