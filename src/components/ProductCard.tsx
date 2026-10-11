"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { colorImage } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import WishlistButton from "./WishlistButton";

const SWATCH_LIMIT = 9;

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const t = useTranslations("common");
  const tp = useTranslations("p");
  const tc = useTranslations("colors");
  const router = useRouter();

  const [active, setActive] = useState(product.colorways[0]);
  const shown = product.colorways.slice(0, SWATCH_LIMIT);
  const extra = product.colorways.length - shown.length;
  const key = product.titleKey.replace(/^p\./, "").replace(/\.title$/, "");
  const title = tp(`${key}.title`);

  // the garment photo follows the selected colourway — always a real person
  const mainImage = colorImage(active.name, product.image);

  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/products/${active.slug}`}
        className="relative block overflow-hidden bg-bone"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={active.slug}
          src={mainImage}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          className="aspect-3/4 w-full animate-fade-up object-cover object-top transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
        />

        {/* badge bottom-left, like the reference */}
        {product.badges?.map((b) => (
          <span
            key={b}
            className="absolute bottom-3 start-3 bg-bone px-2.5 py-1.5 text-[10px] tracking-[0.12em] uppercase"
          >
            {b === "best"
              ? t("bestSeller")
              : b === "new"
                ? t("new")
                : t("limited")}
          </span>
        ))}

        {product.compareAt && (
          <span className="absolute top-3 end-3 bg-terra px-2 py-1 text-[10px] tracking-[0.14em] text-paper uppercase">
            {t("sale")}
          </span>
        )}

        <span className="absolute top-2.5 end-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <WishlistButton productId={product.id} size="sm" />
        </span>
      </Link>

      <div className="pt-3">
        <Link href={`/products/${active.slug}`}>
          <h3 className="text-[14px] leading-snug group-hover:underline">
            {title}
          </h3>
        </Link>

        <p className="mt-1 text-[13px]">
          ${product.price}
          {product.compareAt && (
            <span className="ms-2 text-mist line-through">${product.compareAt}</span>
          )}
        </p>

        {/* colourways reveal on hover; switching swaps to a real person in that tone */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          {shown.map((c) => (
            <button
              key={c.slug}
              type="button"
              title={tc(c.name as never)}
              aria-label={tc(c.name as never)}
              aria-pressed={active.slug === c.slug}
              onClick={() => {
                setActive(c);
                router.prefetch(`/products/${c.slug}`);
              }}
              onDoubleClick={() => router.push(`/products/${c.slug}`)}
              className={[
                "h-4 w-4 rounded-full border transition-all",
                active.slug === c.slug
                  ? "border-ink ring-1 ring-ink ring-offset-1"
                  : "border-line hover:border-graphite",
              ].join(" ")}
              style={{ background: c.hex }}
            />
          ))}
          {extra > 0 && (
            <span className="text-[11px] text-mist">
              {t("moreColors", { count: extra })}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
