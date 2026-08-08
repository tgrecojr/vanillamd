import { resolve, sep, posix } from 'node:path';

/** Thrown when a client-supplied path is rejected by validation. */
export class PathError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'PathError';
  }
}

const MAX_SEGMENT_LENGTH = 255;
const MAX_PATH_LENGTH = 1024;
const MAX_DEPTH = 40;

// Illegal characters inside a single path segment. We use a denylist (rather
// than an allowlist) so note/folder titles can contain unicode, but still
// forbid control chars, path separators, and filesystem-hostile glyphs. Final
// traversal safety comes from the containment re-check in resolveWithin().
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const HOSTILE_CHARS = /[\\/:*?"<>|]/;

/**
 * Validate and normalize an untrusted relative path into a clean POSIX-style
 * logical path (forward slashes, no leading/trailing slash). Throws PathError
 * on anything suspicious. Does NOT touch the filesystem.
 */
export function normalizeLogicalPath(input: unknown): string {
  if (typeof input !== 'string') {
    throw new PathError('Path must be a string');
  }
  if (input.length > MAX_PATH_LENGTH) {
    throw new PathError('Path is too long');
  }

  // Accept either separator from the client, normalize to POSIX.
  const raw = input.replace(/\\/g, '/');
  const segments = raw.split('/').filter((s) => s.length > 0);

  if (segments.length === 0) {
    throw new PathError('Path is empty');
  }
  if (segments.length > MAX_DEPTH) {
    throw new PathError('Path is too deeply nested');
  }

  for (const segment of segments) {
    validateSegment(segment);
  }

  return posix.join(...segments);
}

/** Validate a single path segment (one folder or file name). */
export function validateSegment(segment: string): void {
  if (segment.length === 0) {
    throw new PathError('A path segment is empty');
  }
  if (segment.length > MAX_SEGMENT_LENGTH) {
    throw new PathError('A path segment is too long');
  }
  if (segment === '.' || segment === '..') {
    throw new PathError('Path traversal is not allowed');
  }
  // The tree hides dot-prefixed entries, so allowing them here would let a
  // client create, fill and delete a subtree the UI never renders. Read and
  // write must agree on what exists.
  if (segment.startsWith('.')) {
    throw new PathError('A path segment may not start with a dot');
  }
  if (CONTROL_CHARS.test(segment)) {
    throw new PathError('A path segment contains control characters');
  }
  if (HOSTILE_CHARS.test(segment)) {
    throw new PathError('A path segment contains illegal characters');
  }
  // Windows-hostile trailing space/dot.
  if (segment.endsWith(' ') || segment.endsWith('.')) {
    throw new PathError('A path segment may not end with a space or dot');
  }
}

/**
 * Resolve a validated logical path against the data root and assert, by string
 * comparison of the resolved absolute paths, that the result stays inside the
 * root. Defense in depth on top of normalizeLogicalPath().
 */
export function resolveWithin(root: string, logicalPath: string): string {
  const absoluteRoot = resolve(root);
  const target = resolve(absoluteRoot, logicalPath);
  if (target !== absoluteRoot && !target.startsWith(absoluteRoot + sep)) {
    throw new PathError('Resolved path escapes the data directory');
  }
  return target;
}

/** True if the logical path names a markdown file. */
export function isMarkdownPath(logicalPath: string): boolean {
  return logicalPath.toLowerCase().endsWith('.md');
}

/** Ensure a note path ends in .md, throwing otherwise. */
export function assertMarkdownPath(logicalPath: string): void {
  if (!isMarkdownPath(logicalPath)) {
    throw new PathError('Note files must end in .md');
  }
}
