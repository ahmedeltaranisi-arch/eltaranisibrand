"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { colorwayShots } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import WishlistButton from "./WishlistButton";
import { useCart } from "@/context/cart";

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
  const { add, open } = useCart();
  const [added, setAdded] = useState(false);

  const [active, setActive] = useState(product.colorways[0]);
  const shown = product.colorways.slice(0, SWATCH_LIMIT);
  const more = product.colorways.length - shown.length;
  const key = product.titleKey.replace(/^p\./, "").replace(/\.title$/, "");
  const title = tp(`${key}.title`);

  // every style has a frame set per tone, so the swatch swaps the model shot to
  // the real colourway; hovering then reveals the second pose of the same tone
  const { front, back } = colorwayShots(product, active.name);

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

        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p className="text-[13px]">
            ${product.price}
            {product.compareAt && (
              <span className="ms-2 text-mist line-through">
                ${product.compareAt}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              const size =
                product.sizes.find((sz) => (product.stock[sz] ?? 0) > 0) ??
                product.sizes[0];
              add({
                id: `${product.id}-${active.name}-${size}`,
                productSlug: active.slug,
                productId: product.id,
                titleKey: product.titleKey,
                colorName: active.name,
                colorHex: active.hex,
                size,
                price: product.price,
                image: front,
              });
              setAdded(true);
              open();
              window.setTimeout(() => setAdded(false), 1600);
            }}
            className={[
              "text-[12px] text-graphite underline decoration-dotted underline-offset-4 transition-opacity duration-200 hover:opacity-60",
              added
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            ].join(" ")}
          >
            {added ? t("added") : `${t("add")}+`}
          </button>
        </div>

        {/* the colourway row reads like the reference: swatches + the tone name
            of the frame on screen, with an overflow count for the rest */}
        <p className="mt-2.5 text-[11px] tracking-[0.08em] text-mist uppercase">
          {tc(active.name as never)}
          {more > 0 && <span className="ms-1.5">+{more}</span>}
        </p>

        {/* rectangular swatches, always visible; active gets an underline with a gap */}
        <div className="mt-2 flex flex-wrap items-start gap-2">
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
