// simple fetch wrapper for frontend <-> backend communication
// usage: import { request } from '../lib/request';

// In dev and production the Next.js rewrite in next.config.ts forwards
// /api/* → NEXT_PUBLIC_API_BASE/*, avoiding CORS entirely.
const API_BASE = '/api';
// DEBUG_TOKEN removed; we now fetch dynamically from localStorage

export type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  /** if set to true the helper will not attach the default JSON headers
   * or send credentials.  Useful for public endpoints or file uploads. */
  skipDefaults?: boolean;
  /** object payload that will be JSON.stringified automatically */
  json?: any;
  /** HTTP method, defaults to 'GET' */
  method?: string;
};

export async function request<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { skipDefaults, json, method = 'GET', headers = {}, ...rest } = options;

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const init: RequestInit = {
    method,
    ...rest,
    headers: {
      ...(skipDefaults || !token ? {} : {
        'Authorization': `Bearer ${token}`,
      }),
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: skipDefaults ? undefined : 'include',
  };

  if (json !== undefined) {
    init.body = JSON.stringify(json);
  }

  const res = await fetch(url, init);

  let data: any;
  try {
    data = await res.json();
  } catch (e) {
    // not JSON, swallow
    data = null;
  }

  if (!res.ok) {
    const err = new Error(
      data?.message || `HTTP ${res.status} ${res.statusText}`
    );
    // @ts-ignore
    err.status = res.status;

    if (res.status === 401 && typeof window !== 'undefined') {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }

    throw err;
  }

  return data as T;
}

/** Like request(), but returns a Blob – use for CSV / file download endpoints. */
export async function requestBlob(
  path: string,
  options: RequestOptions = {}
): Promise<Blob> {
  const url = `${API_BASE}${path}`;
  const { skipDefaults, json, method = 'GET', headers = {}, ...rest } = options;

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const init: RequestInit = {
    method,
    ...rest,
    headers: {
      ...(skipDefaults || !token ? {} : { 'Authorization': `Bearer ${token}` }),
      ...headers,
    },
    credentials: skipDefaults ? undefined : 'include',
  };

  if (json !== undefined) init.body = JSON.stringify(json);

  const res = await fetch(url, init);
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status} ${res.statusText}`);
    const err = new Error(msg || `HTTP ${res.status} ${res.statusText}`);
    // @ts-ignore
    err.status = res.status;

    if (res.status === 401 && typeof window !== 'undefined') {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }

    throw err;
  }
  return res.blob();
}
