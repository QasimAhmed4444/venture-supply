const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export async function apiFetch<T>(path: string): Promise<T> {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}
