const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export const SESSION_TOKEN_KEY = "vs.session_token";

export function getSessionToken(): string | null {
  try { return window.localStorage.getItem(SESSION_TOKEN_KEY); } catch { return null; }
}

export function setSessionToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(SESSION_TOKEN_KEY, token);
    else window.localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}/api${path}`;
  const headers = new Headers(init?.headers ?? {});
  const token = getSessionToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  // 204 No Content (and other empty bodies) — return undefined cast as T.
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
