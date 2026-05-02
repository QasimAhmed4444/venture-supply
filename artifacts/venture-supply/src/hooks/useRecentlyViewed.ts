import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "vs_recently_viewed";
const MAX_ITEMS = 12;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / disabled storage — silently ignore */
  }
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(() => read());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIds(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const track = useCallback((productId: string) => {
    if (!productId) return;
    const current = read();
    const next = [productId, ...current.filter((x) => x !== productId)].slice(0, MAX_ITEMS);
    write(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  return { ids, track, clear };
}
