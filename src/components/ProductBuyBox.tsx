"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { useCart } from "@/context/cart";
import type { ColorWay } from "@/lib/types";
import { CheckIcon } from "./icons";

export default function ProductBuyBox({
  productId,
  productSlug,
  titleKey,
  image,
  price,
  sizes,
  stock,
  colorways,
  activeColor,
}: {
  productId: string;
  productSlug: string;
  titleKey: string;
  image: string;
  price: number;
  sizes: string[];
  stock: Record<string, number>;
  colorways: ColorWay[];
  activeColor: string;
}) {
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const tcol = useTranslations("colors");
  const router = useRouter();
  const { add, open } = useCart();

  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);

  function addToBag() {
    if (!size || (stock[size] ?? 0) <= 0) {
      setError(true);
      return;
    }
    const active = colorways.find((c) => c.name === activeColor) ?? colorways[0];
    add({
      id: `${productId}-${active.name}-${size}`,
      productSlug,
      productId,
      titleKey,
      colorName: active.name,
      colorHex: active.hex,
      size,
      price,
      image,
    }, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="mt-7">
      {/* colour */}
      <div className="flex items-baseline justify-between">
        <p className="text-[13px]">
          <span className="text-mist">{tc("color")}: </span>
          {tcol(activeColor as never)}
        </p>
        <p className="text-[12px] text-mist">
          {tc("colorsAvailable", { count: colorways.length })}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {colorways.map((c) => {
          const isActive = c.name === activeColor;
          return (
            <button
              key={c.slug}
              type="button"
              title={tcol(c.name as never)}
              aria-label={tcol(c.name as never)}
              aria-pressed={isActive}
              onClick={() => {
                if (isActive) return;
                router.push(`/products/${c.slug}`);
              }}
              className={[
                "h-7 w-7 rounded-full border transition-all",
                isActive
                  ? "border-ink ring-1 ring-ink ring-offset-2"
                  : "border-line hover:border-graphite",
              ].join(" ")}
              style={{ background: c.hex }}
            />
          );
        })}
      </div>

      {/* size */}
      <div className="mt-8 flex items-baseline justify-between">
        <p className="text-[13px]">
          <span className="text-mist">{tc("size")}: </span>
          {size ?? t("selectSize")}
        </p>
        <Link
          href="/pages/contact"
          className="text-[12px] text-graphite underline underline-offset-4"
        >
          {tc("sizeGuide")}
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {sizes.map((s) => {
          const soldOut = (stock[s] ?? 0) <= 0;
          const low = !soldOut && (stock[s] ?? 0) <= 3;
          return (
            <button
              key={s}
              type="button"
              disabled={soldOut}
              aria-pressed={size === s}
              onClick={() => {
                setSize(s);
                setError(false);
              }}
              className={[
                "relative min-w-14 border px-3 py-2.5 text-[13px] transition-colors",
                soldOut
                  ? "cursor-not-allowed border-line text-mist"
                  : size === s
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-ink",
              ].join(" ")}
            >
              <span className={soldOut ? "line-through" : ""}>{s}</span>
              {soldOut && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid place-items-center"
                >
                  <span className="h-px w-[70%] rotate-[-18deg] bg-mist/70" />
                </span>
              )}
              {low && (
                <span className="absolute -top-2 end-1 bg-terra px-1 text-[9px] tracking-[0.08em] text-paper uppercase">
                  {tc("limited")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-[12px] text-terra">{t("sizeError")}</p>
      )}

      {/* qty + add */}
      <div className="mt-8 flex gap-3">
        <div className="flex items-center border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-12 w-11 transition-colors hover:bg-bone"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-[14px]">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            className="h-12 w-11 transition-colors hover:bg-bone"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button type="button" onClick={addToBag} className="btn-solid flex-1">
          {added ? (
            <>
              <CheckIcon className="h-4 w-4" />
              {t("added")}
            </>
          ) : (
            t("add")
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={open}
        className="mt-3 w-full text-center text-[12px] text-graphite underline underline-offset-4"
      >
        {tc("qty")} · {t("add")}
      </button>
    </div>
  );
}
