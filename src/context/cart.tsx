"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { CartLine } from "@/lib/types";

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

export const FREE_SHIPPING_THRESHOLD = 200;
const STORAGE_KEY = "storefront.cart.v1";
const STORAGE_EVENT = "storefront:cart-change";
const EMPTY: CartLine[] = [];

/* ---------- tiny external store over localStorage ----------
 * Read through useSyncExternalStore so the server render and the first client
 * render agree (both empty) and hydration stays clean.
 */
function readLines(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeLines(next: CartLine[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode / quota) — cart stays in memory only */
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(STORAGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STORAGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getServerSnapshot = () => EMPTY;

export function useCartLines(): CartLine[] {
  return useSyncExternalStore(subscribe, readLines, getServerSnapshot);
}

/* --------------------------- provider --------------------------- */

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useCartLines();
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    const current = readLines();
    const existing = current.find((l) => l.id === line.id);
    const next = existing
      ? current.map((l) =>
          l.id === line.id ? { ...l, qty: Math.min(l.qty + qty, 10) } : l,
        )
      : [...current, { ...line, qty }];
    writeLines(next);
    setIsOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    writeLines(readLines().filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const next = readLines();
    writeLines(
      qty <= 0
        ? next.filter((l) => l.id !== id)
        : next.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, 10) } : l)),
    );
  }, []);

  const clear = useCallback(() => writeLines([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((n, l) => n + l.qty * l.price, 0),
    [lines],
  );

  const value = useMemo<CartState>(
    () => ({
      lines,
      isOpen,
      count,
      subtotal,
      add,
      remove,
      setQty,
      clear,
      open,
      close,
    }),
    [lines, isOpen, count, subtotal, add, remove, setQty, clear, open, close],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const CartContext = createContext<CartState | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
