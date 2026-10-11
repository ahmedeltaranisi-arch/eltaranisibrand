"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { STUDIO_PRODUCTS, colorBack, colorImage } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import WishlistButton from "./WishlistButton";

const SWATCH_LIMIT = 4;

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
  const key = product.titleKey.replace(/^p\./, "").replace(/\.title$/, "");
  const title = tp(`${key}.title`);

  // only products with a real per-tone studio set swap imagery per colour;
  // everyone else keeps their own photo so the product never "changes"
  const studio = STUDIO_PRODUCTS.has(product.id);
  const front = studio ? colorImage(active.name, product.image) : product.image;
  const back = studio ? colorBack(active.name, product.imageAlt) : product.imageAlt;

  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/products/${active.slug}`}
        className="relative block overflow-hidden bg-bone"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`f-${active.slug}`}
          src={front}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          className="aspect-2/3 w-full object-cover object-top transition-opacity duration-500 group-hover:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`b-${active.slug}`}
          src={back}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 aspect-2/3 w-full object-cover object-top opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* badge bottom-left, like the reference */}
        {product.badges?.map((b) => (
          <span
            key={b}
            className="absolute bottom-3 start-3 z-10 bg-bone px-2.5 py-1.5 text-[10px] tracking-[0.12em] uppercase"
          >
            {b === "best"
              ? t("bestSeller")
              : b === "new"
                ? t("new")
                : t("limited")}
          </span>
        ))}

        <span className="absolute top-2.5 end-2.5 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <WishlistButton productId={product.id} size="sm" />
        </span>
      </Link>

      <div className="pt-3">
        <Link href={`/products/${active.slug}`}>
          <h3 className="text-[14px] leading-snug group-hover:underline">
            {title}
          </h3>
        </Link>

        <p className="mt-1.5 text-[13px]">
          ${product.price}
          {product.compareAt && (
            <span className="ms-2 text-mist line-through">
              ${product.compareAt}
            </span>
          )}
        </p>

        {/* rectangular swatches, always visible; active gets an underline with a gap */}
        <div className="mt-3 flex flex-wrap items-start gap-2">
          {shown.map((c) => (
            <span
              key={c.slug}
              className={[
                "border-b pb-[5px]",
                active.slug === c.slug ? "border-ink" : "border-transparent",
              ].join(" ")}
            >
              <button
                type="button"
                title={tc(c.name as never)}
                aria-label={tc(c.name as never)}
                aria-pressed={active.slug === c.slug}
                onClick={() => {
                  setActive(c);
                  router.prefetch(`/products/${c.slug}`);
                }}
                onDoubleClick={() => router.push(`/products/${c.slug}`)}
                className="block h-[12px] w-9 border border-ink/10"
                style={{ background: c.hex }}
              />
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
