"use client";

import { useState } from "react";
import MateProductCard from "./MateProductCard";
import ArrivalQuickAdd from "./new-arrivals/ArrivalQuickAdd";
import { Link } from "@/navigation";
import type { MateProduct } from "@/lib/mateNewArrivals";

export type HomeRail = {
  key: string;
  label: string;
  /** Where "View all" leads for this rail. */
  href: string;
  products: MateProduct[];
};

/**
 * The home rails share the collection cards, so every swatch is a real photographed colorway:
 * picking a colour swaps to that colourway's own garment, dye and model pose instead of a
 * tinted fallback frame (the legacy `ProductCard` could only guess at frames it never shot).
 */
export default function MateHomeRails({ rails, viewAll }: { rails: HomeRail[]; viewAll: string }) {
  const [activeKey, setActiveKey] = useState(rails[0]?.key);
  const [quickAdd, setQuickAdd] = useState<MateProduct | null>(null);
  const active = rails.find((rail) => rail.key === activeKey) ?? rails[0];
  if (!active) return null;

  return (
    <div>
      <div role="tablist" className="mb-8 flex items-center justify-center gap-8 sm:gap-14">
        {rails.map((rail) => {
          const current = rail.key === active.key;
          return (
            <button
              key={rail.key}
              type="button"
              role="tab"
              aria-selected={current}
              onClick={() => setActiveKey(rail.key)}
              className={`border-b pb-1.5 text-[15px] transition-colors sm:text-[17px] ${
                current ? "border-dotted border-ink text-ink" : "border-transparent text-mist hover:text-graphite"
              }`}
            >
              {rail.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" key={active.key} className="animate-fade-up">
        <div className="na-product-grid">
          {active.products.map((product, index) => (
            <MateProductCard key={product.slug} product={product} priority={index < 2} onQuickAdd={setQuickAdd} />
          ))}
        </div>
      </div>

      <p className="mt-10 text-center text-[12px] text-mist">
        <Link href={active.href} className="underline decoration-dotted underline-offset-4 hover:text-ink">
          {viewAll}
        </Link>
      </p>

      <ArrivalQuickAdd key={quickAdd?.slug ?? "closed"} product={quickAdd} onClose={() => setQuickAdd(null)} />
    </div>
  );
}
