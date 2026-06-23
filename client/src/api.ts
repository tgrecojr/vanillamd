import type { TreeNode } from './types';

/** Error carrying the HTTP status and server message for a failed API call. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const q = (path: string): string => `?path=${encodeURIComponent(path)}`;

export const api = {
  getTree: () => request<{ tree: TreeNode[] }>('/api/tree').then((r) => r.tree),

  getNote: (path: string) =>
    request<{ content: string }>(`/api/note${q(path)}`).then((r) => r.content),

  saveNote: (path: string, content: string) =>
    request<{ ok: true }>('/api/note', {
      method: 'PUT',
      body: JSON.stringify({ path, content }),
    }),

  createNote: (path: string) =>
    request<{ path: string }>('/api/note', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }).then((r) => r.path),

  createFolder: (path: string) =>
    request<{ path: string }>('/api/folder', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }).then((r) => r.path),

  move: (from: string, to: string) =>
    request<{ path: string }>('/api/move', {
      method: 'POST',
      body: JSON.stringify({ from, to }),
    }).then((r) => r.path),

  deleteNote: (path: string) => request<{ ok: true }>(`/api/note${q(path)}`, { method: 'DELETE' }),

  deleteFolder: (path: string) =>
    request<{ ok: true }>(`/api/folder${q(path)}`, { method: 'DELETE' }),
};
