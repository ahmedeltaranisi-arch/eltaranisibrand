"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import type { CartLine } from "@/lib/types";
import { getArrivalProduct } from "@/lib/mateNewArrivals";

type CartState = {
  lines: CartLine[]; isOpen: boolean; count: number; subtotal: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (id: string) => void; setQty: (id: string, qty: number) => void;
  clear: () => void; open: () => void; close: () => void;
};

export const FREE_SHIPPING_THRESHOLD = 200;
const STORAGE_KEY = "storefront.cart.v1";
const STORAGE_EVENT = "storefront:cart-change";
const EMPTY: CartLine[] = [];
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;
let memoryOnly = false;

/** Ignore malformed persisted entries and refresh imported SKUs from our catalog. */
function normalizeLine(value: unknown): CartLine | undefined {
  if (!value || typeof value !== "object") return;
  const line = value as CartLine;
  if (![line.id, line.productSlug, line.productId, line.titleKey, line.colorName, line.colorHex, line.size, line.image].every((s) => typeof s === "string")) return;
  if (typeof line.price !== "number" || !Number.isFinite(line.price) || line.price < 0 || typeof line.qty !== "number" || !Number.isFinite(line.qty) || line.qty < 1) return;
  const qty = Math.min(10, Math.trunc(line.qty));
  const product = getArrivalProduct(line.productSlug);
  if (product) {
    if (!product.availableSizes.includes(line.size)) return;
    return { id: `${product.id}-${line.size}`, productSlug: product.slug, productId: product.id,
      titleKey: `newArrivals.products.${product.style}`, title: product.title,
      colorName: product.color.name, colorLabel: product.color.label, colorHex: product.color.hex,
      size: line.size, price: product.priceUSD, priceLE: product.priceLE, image: product.images[0], qty };
  }
  return { ...line, qty };
}

function normalizeCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return EMPTY;
  const unique = new Map<string, CartLine>();
  for (const item of value.slice(0, 50)) {
    const line = normalizeLine(item);
    if (!line) continue;
    const existing = unique.get(line.id);
    unique.set(line.id, existing ? { ...existing, qty: Math.min(existing.qty + line.qty, 10) } : line);
  }
  return [...unique.values()];
}

/** Stable snapshots prevent the useSyncExternalStore render-loop pitfall. */
function readLines(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  if (memoryOnly) return cachedLines;
  let raw: string | null;
  try { raw = window.localStorage.getItem(STORAGE_KEY); }
  catch { memoryOnly = true; return cachedLines; }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try { cachedLines = raw ? normalizeCart(JSON.parse(raw)) : EMPTY; }
    catch { cachedLines = EMPTY; }
  }
  return cachedLines;
}

function writeLines(next: CartLine[]) {
  if (typeof window === "undefined") return;
  cachedLines = normalizeCart(next);
  cachedRaw = JSON.stringify(cachedLines);
  try { window.localStorage.setItem(STORAGE_KEY, cachedRaw); memoryOnly = false; }
  catch { memoryOnly = true; }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(STORAGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(STORAGE_EVENT, onChange); window.removeEventListener("storage", onChange); };
}
const getServerSnapshot = () => EMPTY;
export function useCartLines(): CartLine[] { return useSyncExternalStore(subscribe, readLines, getServerSnapshot); }

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useCartLines();
  const [isOpen, setIsOpen] = useState(false);
  const add = useCallback((input: Omit<CartLine, "qty">, qty = 1) => {
    const line = normalizeLine({ ...input, qty });
    if (!line) return;
    const current = readLines();
    const existing = current.find((l) => l.id === line.id);
    writeLines(existing ? current.map((l) => l.id === line.id ? { ...l, qty: Math.min(l.qty + line.qty, 10) } : l) : [...current, line]);
    setIsOpen(true);
  }, []);
  const remove = useCallback((id: string) => writeLines(readLines().filter((l) => l.id !== id)), []);
  const setQty = useCallback((id: string, qty: number) => {
    if (!Number.isFinite(qty)) return;
    writeLines(qty <= 0 ? readLines().filter((l) => l.id !== id) : readLines().map((l) => l.id === id ? { ...l, qty: Math.max(1, Math.min(Math.trunc(qty), 10)) } : l));
  }, []);
  const clear = useCallback(() => writeLines([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((n, l) => n + l.qty * l.price, 0), [lines]);
  const value = useMemo<CartState>(() => ({ lines, isOpen, count, subtotal, add, remove, setQty, clear, open, close }), [lines, isOpen, count, subtotal, add, remove, setQty, clear, open, close]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
const CartContext = createContext<CartState | null>(null);
export function useCart() { const ctx = useContext(CartContext); if (!ctx) throw new Error("useCart must be used inside <CartProvider>"); return ctx; }
