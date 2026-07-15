import { useCallback, useEffect, useState } from "react";

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as string[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(ids));
}

export function useLocalGameList(key: string, max = 100) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read(key));
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setIds(read(key));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const add = useCallback(
    (id: string) => {
      setIds((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)].slice(0, max);
        write(key, next);
        return next;
      });
    },
    [key, max],
  );

  const remove = useCallback(
    (id: string) => {
      setIds((prev) => {
        const next = prev.filter((x) => x !== id);
        write(key, next);
        return next;
      });
    },
    [key],
  );

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) => {
        const exists = prev.includes(id);
        const next = exists ? prev.filter((x) => x !== id) : [id, ...prev].slice(0, max);
        write(key, next);
        return next;
      });
    },
    [key, max],
  );

  const clear = useCallback(() => {
    write(key, []);
    setIds([]);
  }, [key]);

  return { ids, add, remove, toggle, clear, has: (id: string) => ids.includes(id) };
}

export const FAVORITES_KEY = "pkok:favorites";
export const RECENT_KEY = "pkok:recent";
