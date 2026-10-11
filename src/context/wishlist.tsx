"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

type WishlistState = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
};

const KEY = "storefront.wishlist.v1";
const EVENT = "storefront:wishlist-change";
const EMPTY: string[] = [];

/* ---------- localStorage-backed store (same shape as the cart) ---------- */

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : EMPTY;
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(next: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getServerSnapshot = () => EMPTY;

export function useWishlistIds(): string[] {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}

/* ------------------------------ provider ------------------------------ */

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const ids = useWishlistIds();

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const current = read();
    write(
      current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id],
    );
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((v) => v !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo<WishlistState>(
    () => ({ ids, has, toggle, remove, clear, count: ids.length }),
    [ids, has, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

const WishlistContext = createContext<WishlistState | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
