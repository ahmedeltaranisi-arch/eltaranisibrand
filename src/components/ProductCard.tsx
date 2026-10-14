"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { colorwayShots } from "@/lib/catalog";
import type { Product } from "@/lib/types";
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

  const { front, back } = colorwayShots(product, active.name);

  return (
    <article className="group product-reveal-card relative flex flex-col">
      <Link
        href={`/products/${active.slug}`}
        className="product-card-media relative block overflow-hidden bg-[#f6f3ec]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`f-${active.slug}`}
          src={front}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          className="aspect-[3/4] w-full object-contain object-center transition-opacity duration-500 group-hover:opacity-0 group-focus-within:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`b-${active.slug}`}
          src={back}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 aspect-[3/4] w-full object-contain object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
        />

        {product.badges?.includes("best") && (
          <span className="absolute bottom-2 left-2 bg-[#fcf9f2] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-black">
            Best Seller
          </span>
        )}
        {product.badges?.includes("limited") && (
          <span className="absolute bottom-2 left-2 bg-[#fcf9f2] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-black">
            Limited
          </span>
        )}
      </Link>

      <div className="pt-[10px]">
        <Link href={`/products/${active.slug}`}>
          <h3 className="line-clamp-2 text-[12px] leading-[1.35] tracking-[0.01em] text-black group-hover:underline">
            {title}
          </h3>
        </Link>

        <p className="mt-[4px] text-[11px] font-normal tracking-[0.02em] text-black">
          ${product.price}
          {product.compareAt && (
            <span className="ms-2 text-black/50 line-through">
              ${product.compareAt}
            </span>
          )}
        </p>

        {/* MATE rectangular swatches with underline */}
        <div className="mt-[10px] flex flex-wrap items-center gap-[6px]">
          {shown.map((c) => {
            const isActive = active.slug === c.slug;
            return (
              <span
                key={c.slug}
                className={[
                  "inline-block border-b pb-[4px] transition-colors",
                  isActive ? "border-black" : "border-transparent",
                ].join(" ")}
              >
                <button
                  type="button"
                  title={tc(c.name as never)}
                  aria-label={tc(c.name as never)}
                  aria-pressed={isActive}
                  onClick={() => {
                    setActive(c);
                    router.prefetch(`/products/${c.slug}`);
                  }}
                  onMouseEnter={() => setActive(c)}
                  onDoubleClick={() => router.push(`/products/${c.slug}`)}
                  className="block h-[10px] w-[32px] border border-black/10 transition-transform hover:scale-[1.02]"
                  style={{ background: c.hex }}
                />
              </span>
            );
          })}
          {more > 0 && (
            <span className="ms-[2px] text-[11px] text-black">+{more}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            const size =
              product.sizes.find((sz) => (product.stock[sz] ?? 0) > 0) ??
              product.sizes[0];
            add(
              {
                id: `${product.id}-${active.name}-${size}`,
                productSlug: active.slug,
                productId: product.id,
                titleKey: product.titleKey,
                colorName: active.name,
                colorHex: active.hex,
                size,
                price: product.price,
                image: front,
              },
              1
            );
            setAdded(true);
            open();
            window.setTimeout(() => setAdded(false), 1600);
          }}
          className={[
            "product-reveal-action mt-3 flex h-[40px] w-full items-center justify-center text-[11px] uppercase tracking-[0.12em]",
          ].join(" ")}
        >
          <span>{added ? t("added") : `${t("add")} +`}</span>
        </button>

        {/* color name like MATE shows on hover? Keep subtle */}
        <p className="mt-2 text-[10px] tracking-[0.08em] text-black/50 uppercase opacity-0 transition-opacity group-hover:opacity-100">
          {tc(active.name as never)}
        </p>
      </div>
    </article>
  );
}
