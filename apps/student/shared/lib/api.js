import * as TokenStore from './token-store';

/**
 * API CLIENT — the ONE place the student app talks to the Annpurna backend.
 *
 * The JWT lives in a file (see token-store.js) and in this module's memory
 * cache. Every request adds `Authorization: Bearer <token>`, so no screen
 * ever handles auth headers itself.
 *
 * Base URL comes from EXPO_PUBLIC_API_URL; the fallback below is for local
 * ad-hoc runs. A real phone build must set it to a reachable LAN address.
 */

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

let memoryToken = null;
let initialLoad = null;

/** Loads the persisted token once per process; safe to call repeatedly. */
export function loadSession() {
  initialLoad =
    initialLoad ||
    TokenStore.loadToken()
      .then((t) => {
        memoryToken = t;
        return t;
      })
      .catch(() => {
        memoryToken = null;
        return null;
      });
  return initialLoad;
}

export async function setToken(token) {
  memoryToken = token;
  await TokenStore.saveToken(token);
}

export async function clearToken() {
  memoryToken = null;
  await TokenStore.clearToken();
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (memoryToken) headers.Authorization = `Bearer ${memoryToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No internet connection.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.error;
    throw err;
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};