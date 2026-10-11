"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

type Sort = "featured" | "priceAsc" | "priceDesc" | "rating" | "newest";

const PRICE_BANDS = [
  { id: "under60", max: 60, amount: 60 },
  { id: "under100", max: 100, amount: 100 },
  { id: "under150", max: 150, amount: 150 },
];

const SORTS: Sort[] = ["featured", "priceAsc", "priceDesc", "rating", "newest"];

export default function CollectionFilters({ products }: { products: Product[] }) {
  const t = useTranslations("collections.filters");
  const tc = useTranslations("colors");
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [bands, setBands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");
  const [showFilters, setShowFilters] = useState(false);

  const allSizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.sizes))),
    [products],
  );
  const allColors = useMemo(
    () =>
      Array.from(
        new Map(
          products
            .flatMap((p) => p.colorways)
            .map((c) => [c.name, c] as const),
        ).values(),
      ),
    [products],
  );

  const visible = useMemo(() => {
    let out = products.filter((p) => {
      const available = p.sizes.filter((sz) => (p.stock[sz] ?? 0) > 0);
      if (inStockOnly && available.length === 0) return false;
      if (sizes.length && !sizes.some((s) => available.includes(s))) return false;
      if (colors.length && !colors.some((c) => p.colorways.some((cw) => cw.name === c)))
        return false;
      if (bands.length) {
        const caps = bands.map(
          (b) => PRICE_BANDS.find((band) => band.id === b)?.max ?? Infinity,
        );
        if (!caps.some((cap) => p.price <= cap)) return false;
      }
      return true;
    });

    if (sort === "priceAsc") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "rating") out = [...out].sort((a, b) => b.rating - a.rating);
    if (sort === "newest")
      out = [...out].sort((a, b) =>
        (b.badges?.includes("new") ? 1 : 0) - (a.badges?.includes("new") ? 1 : 0),
      );
    return out;
  }, [products, sizes, colors, bands, inStockOnly, sort]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const dirty =
    sizes.length + colors.length + bands.length > 0 || inStockOnly;

  return (
    <div>
      {/* MATE top bar */}
      <div className="flex items-center justify-between border-b border-black/5 py-4 text-[11px] tracking-[0.08em] uppercase">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 text-black hover:opacity-70 lg:hidden"
          >
            <span className="h-[10px] w-[12px] border border-black/20" />
            Filter
          </button>
          <p className="text-black/70">
            {t("count", { count: visible.length })}
          </p>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setSizes([]);
                setColors([]);
                setBands([]);
                setInStockOnly(false);
              }}
              className="text-[11px] text-black/50 underline underline-offset-4 hover:text-black"
            >
              {t("clear")}
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em]">
          <span className="hidden text-black/50 sm:inline">{t("sort")}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-transparent text-[11px] uppercase tracking-[0.08em] outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sortOptions.${s}` as never)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
        {/* sidebar - MATE minimal */}
        <aside className={`${showFilters ? "block" : "hidden"} mb-8 lg:block lg:mb-0`}>
          <div className="space-y-8">
            <fieldset>
              <legend className="mb-3 text-[11px] uppercase tracking-[0.08em] text-black">
                {t("size")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((s) => {
                  const anyInStock = products.some((p) => (p.stock[s] ?? 0) > 0);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={!anyInStock}
                      aria-pressed={sizes.includes(s)}
                      onClick={() => toggle(sizes, setSizes, s)}
                      className={[
                        "min-w-9 border px-2 py-1 text-[11px] uppercase tracking-[0.05em] transition-colors",
                        !anyInStock
                          ? "cursor-not-allowed border-black/10 text-black/20 line-through"
                          : sizes.includes(s)
                            ? "border-black bg-black text-white"
                            : "border-black/10 hover:border-black",
                      ].join(" ")}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-[11px] uppercase tracking-[0.08em] text-black">
                {t("color")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {allColors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={tc(c.name as never)}
                    aria-label={tc(c.name as never)}
                    aria-pressed={colors.includes(c.name)}
                    onClick={() => toggle(colors, setColors, c.name)}
                    className={[
                      "h-[10px] w-[28px] border transition-all",
                      colors.includes(c.name)
                        ? "border-black ring-1 ring-black ring-offset-1"
                        : "border-black/10 hover:border-black/30",
                    ].join(" ")}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-center gap-2 text-[11px] uppercase tracking-[0.05em]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={() => setInStockOnly((v) => !v)}
                className="h-3 w-3 accent-black"
              />
              {t("inStock")}
            </label>

            <fieldset>
              <legend className="mb-3 text-[11px] uppercase tracking-[0.08em] text-black">
                {t("price")}
              </legend>
              <ul className="space-y-2">
                {PRICE_BANDS.map((b) => (
                  <li key={b.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] uppercase tracking-[0.05em]">
                      <input
                        type="checkbox"
                        checked={bands.includes(b.id)}
                        onChange={() => toggle(bands, setBands, b.id)}
                        className="h-3 w-3 accent-black"
                      />
                      {t("under", { amount: b.amount })}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          </div>
        </aside>

        {/* results - 4 columns like MATE */}
        <div>
          {visible.length === 0 ? (
            <p className="py-20 text-center text-[12px] text-black/50">
              {t("noResults")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-2 gap-y-8 sm:gap-x-3 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-12">
              {visible.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Get 10% Off promo like MATE */}
      <div className="fixed bottom-3 left-3 z-40 flex items-center gap-2 bg-[#1a1a1a] px-3 py-2 text-[11px] text-white shadow-lg">
        <span>Get 10% Off</span>
        <button
          type="button"
          className="ml-2 text-white/60 hover:text-white"
          aria-label="Dismiss"
          onClick={(e) => {
            (e.currentTarget.parentElement as HTMLElement).style.display = "none";
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
