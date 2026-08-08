import { describe, it, expect } from 'vitest';
import { normalizeLogicalPath, resolveWithin, validateSegment, PathError } from './paths.js';

describe('normalizeLogicalPath', () => {
  it('accepts a simple note path', () => {
    expect(normalizeLogicalPath('notes/todo.md')).toBe('notes/todo.md');
  });

  it('collapses redundant and backslash separators', () => {
    expect(normalizeLogicalPath('a//b\\c.md')).toBe('a/b/c.md');
  });

  it('preserves unicode titles', () => {
    expect(normalizeLogicalPath('café/notes.md')).toBe('café/notes.md');
  });

  it.each([
    ['..', 'parent traversal'],
    ['../secrets', 'leading parent'],
    ['notes/../../etc/passwd', 'embedded parent'],
    ['./hidden', 'dot segment'],
    ['', 'empty'],
    ['   ', 'whitespace-only segment'],
    ['a/b\u0000c', 'null byte'],
    ['a/b\nc', 'newline control char'],
    ['a/b:c', 'colon'],
    ['a/<b>', 'angle brackets'],
    ['trailingdot.', 'trailing dot'],
    ['trailingspace ', 'trailing space'],
    ['.ghost/stash.md', 'dot-prefixed leading segment'],
    ['visible/.ghost/stash.md', 'dot-prefixed inner segment'],
    ['.secret.md', 'dot-prefixed note'],
  ])('rejects %s (%s)', (input) => {
    expect(() => normalizeLogicalPath(input)).toThrow(PathError);
  });

  it('rejects non-string input', () => {
    expect(() => normalizeLogicalPath(undefined)).toThrow(PathError);
    expect(() => normalizeLogicalPath(42)).toThrow(PathError);
  });
});

describe('validateSegment hidden-entry rule', () => {
  // The tree hides dot-prefixed entries; the mutation paths must agree, or a
  // client can build a subtree the UI never renders.
  it('rejects a dot-prefixed segment', () => {
    expect(() => validateSegment('.hidden')).toThrow(PathError);
    expect(() => validateSegment('.git')).toThrow(PathError);
  });

  it('still accepts dots that are not segment-leading', () => {
    expect(normalizeLogicalPath('my.notes.md')).toBe('my.notes.md');
    expect(normalizeLogicalPath('v1.2/release.notes.md')).toBe('v1.2/release.notes.md');
  });
});

describe('resolveWithin', () => {
  const root = '/data';

  it('resolves a valid path inside the root', () => {
    expect(resolveWithin(root, 'a/b.md')).toBe('/data/a/b.md');
  });

  it('throws if a crafted path escapes the root', () => {
    // normalizeLogicalPath would reject this first, but resolveWithin is the
    // defense-in-depth layer and must reject it on its own too.
    expect(() => resolveWithin(root, '../etc/passwd')).toThrow(PathError);
  });

  it('does not treat a sibling prefix as inside the root', () => {
    expect(() => resolveWithin('/data', '../data-evil/x.md')).toThrow(PathError);
  });
});
