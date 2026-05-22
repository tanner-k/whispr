/**
 * client.ts — typed fetch wrapper for the Whispr backend.
 *
 * All requests hit `/api/...` (proxied to the FastAPI backend on
 * :8000 in dev — see vite.config.ts). Every backend response is an
 * {@link ApiEnvelope}; this client unwraps it: on success it returns
 * `data`, on failure it throws {@link ApiError}.
 *
 * No endpoints are live yet — the backend lands in T6+.
 */
import type { ApiEnvelope } from '../types';

/** Base path for all API calls. Dev server proxies this to the backend. */
const API_BASE = '/api';

/** Thrown when a request fails at the transport or envelope level. */
export class ApiError extends Error {
  /** HTTP status code, or 0 for network/transport failures. */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Normalizes a path into a full `/api/...` URL. */
function buildUrl(path: string): string {
  const trimmed = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${trimmed}`;
}

/**
 * Performs a request and unwraps the {@link ApiEnvelope}.
 *
 * @throws {ApiError} on a non-OK status, a malformed body, or an
 *   envelope with `success: false`.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : 'Network request failed';
    throw new ApiError(detail, 0);
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(`Malformed response from ${path}`, response.status);
  }

  if (!response.ok || !envelope.success) {
    throw new ApiError(envelope.error ?? `Request to ${path} failed`, response.status);
  }

  if (envelope.data === null || envelope.data === undefined) {
    throw new ApiError(`Empty data in successful response from ${path}`, response.status);
  }

  return envelope.data;
}

/** GET `/api{path}`, returning the unwrapped payload. */
export function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: 'GET' });
}

/** POST `/api{path}` with a JSON body, returning the unwrapped payload. */
export function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** PUT `/api{path}` with a JSON body, returning the unwrapped payload. */
export function apiPut<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** DELETE `/api{path}`, returning the unwrapped payload. */
export function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: 'DELETE' });
}

/** Convenience object grouping the typed verbs. */
export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
} as const;
