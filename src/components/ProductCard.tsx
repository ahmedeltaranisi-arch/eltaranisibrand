"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { colorBack, colorImage } from "@/lib/catalog";
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

  // studio front shot follows the selected colourway; hover reveals the back view
  const front = colorImage(active.name, product.image);
  const back = colorBack(active.name, product.imageAlt);

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

        {/* rectangular swatches, always visible; active one underlined */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
                "h-[12px] w-9 border border-ink/10 transition-shadow",
                active.slug === c.slug
                  ? "shadow-[0_5px_0_-3px_#000]"
                  : "hover:shadow-[0_5px_0_-3px_rgba(0,0,0,0.35)]",
              ].join(" ")}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
