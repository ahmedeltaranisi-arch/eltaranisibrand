"use client";

import { useState } from "react";
import { Link, useRouter } from "@/navigation";
import { useCart } from "@/context/cart";
import type { MateProduct } from "@/lib/mateNewArrivals";

export default function MateProductCard({ product }: { product: MateProduct }) {
  const router = useRouter();
  const { add, open } = useCart();
  const [activeIdx, setActiveIdx] = useState(0);
  const [added, setAdded] = useState(false);

  const activeColor = product.colors[activeIdx] ?? product.colors[0];
  const front = product.images[0];
  const back = product.images[1] ?? product.images[0];

  // show first 4 swatches, rest as +N
  const shown = product.colors.slice(0, 4);
  const more = product.colors.length - shown.length;

  const handleAdd = () => {
    // pick a default size
    const size = "M";
    add(
      {
        id: `${product.id}-${activeColor.name}-${size}`,
        productSlug: product.slug,
        productId: product.id,
        titleKey: `p.mate.${product.id}.title`,
        colorName: activeColor.name,
        colorHex: activeColor.hex,
        size,
        price: product.priceLE,
        image: front,
      },
      1
    );
    setAdded(true);
    open();
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group relative flex flex-col">
      {/* image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden bg-[#f6f3ec]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={front}
          alt={product.title}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover object-top transition-opacity duration-500 group-hover:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={back}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 aspect-[3/4] w-full object-cover object-top opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {product.badge && (
          <span className="absolute bottom-2 left-2 bg-[#fcf9f2] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-black">
            {product.badge}
          </span>
        )}
      </Link>

      {/* info */}
      <div className="pt-[10px]">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-[12px] leading-[1.35] tracking-[0.01em] text-black">
            {product.title}
          </h3>
        </Link>

        <p className="mt-[4px] text-[11px] font-normal tracking-[0.02em] text-black">
          {product.priceDisplay}
        </p>

        {/* swatches - MATE style: small rectangles with underline for active */}
        <div className="mt-[10px] flex flex-wrap items-center gap-[6px]">
          {shown.map((c, idx) => {
            const isActive = idx === activeIdx;
            return (
              <span
                key={`${c.name}-${idx}`}
                className={[
                  "inline-block border-b pb-[4px] transition-colors",
                  isActive ? "border-black" : "border-transparent",
                ].join(" ")}
              >
                <button
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={isActive}
                  onClick={() => setActiveIdx(idx)}
                  onMouseEnter={() => setActiveIdx(idx)}
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

        {/* Add button - appears on hover like MATE */}
        <button
          type="button"
          onClick={handleAdd}
          className={[
            "mt-3 flex h-[40px] w-full items-center justify-center bg-[#ede6d6] text-[11px] uppercase tracking-[0.12em] text-black transition-all duration-300",
            "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0",
            "hover:bg-[#e8e0d0] focus-visible:opacity-100 focus-visible:translate-y-0",
            "lg:opacity-0 lg:group-hover:opacity-100",
            // On mobile, keep visible? MATE hides until hover even on mobile, but we show on hover/focus
            // For touch devices, show always after first tap? We'll keep hover logic and also make it visible on small screens via opacity-100 on touch?
            // To match video, it should appear on hover only, but for usability we keep it hidden until hover.
            // We'll add a fallback: if no hover capability, show with opacity 100 on mobile? Let's keep hidden on mobile too to match video, but add group-focus-within.
            "group-focus-within:opacity-100 group-focus-within:translate-y-0",
          ].join(" ")}
        >
          {added ? "Added" : "Add +"}
        </button>
      </div>
    </article>
  );
}
