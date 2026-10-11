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
      // sizes that actually have units on hand
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
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
      {/* sidebar */}
      <aside className="mb-8 lg:mb-0">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow text-mist">{t("title")}</h2>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setSizes([]);
                setColors([]);
                setBands([]);
                setInStockOnly(false);
              }}
              className="text-[12px] text-graphite underline underline-offset-4"
            >
              {t("clear")}
            </button>
          )}
        </div>

        <fieldset className="mt-6">
          <legend className="mb-3 text-[13px]">{t("size")}</legend>
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
                    "min-w-10 border px-2.5 py-1.5 text-[12px] transition-colors",
                    !anyInStock
                      ? "cursor-not-allowed border-line text-mist line-through"
                      : sizes.includes(s)
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-ink",
                  ].join(" ")}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="mb-3 text-[13px]">{t("color")}</legend>
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
                  "h-5 w-5 rounded-full border transition-all",
                  colors.includes(c.name)
                    ? "border-ink ring-1 ring-ink ring-offset-1"
                    : "border-line hover:border-graphite",
                ].join(" ")}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </fieldset>

        <label className="mt-7 flex cursor-pointer items-center gap-2.5 border-y border-line py-4 text-[13px]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => setInStockOnly((v) => !v)}
            className="h-3.5 w-3.5 accent-ink"
          />
          {t("inStock")}
        </label>

        <fieldset className="mt-7">
          <legend className="mb-3 text-[13px]">{t("price")}</legend>
          <ul className="space-y-2">
            {PRICE_BANDS.map((b) => (
              <li key={b.id}>
                <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    checked={bands.includes(b.id)}
                    onChange={() => toggle(bands, setBands, b.id)}
                    className="h-3.5 w-3.5 accent-ink"
                  />
                  {t("under", { amount: b.amount })}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </aside>

      {/* results */}
      <div>
        <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
          <p className="text-[13px] text-mist">
            {t("count", { count: visible.length })}
          </p>
          <label className="flex items-center gap-2 text-[13px]">
            <span className="hidden text-mist sm:inline">{t("sort")}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ink"
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`sortOptions.${s}` as never)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visible.length === 0 ? (
          <p className="py-20 text-center text-[14px] text-mist">
            {t("noResults")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
            {visible.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
