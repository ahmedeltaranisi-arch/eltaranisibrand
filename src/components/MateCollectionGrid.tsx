"use client";

import { useMemo, useState } from "react";
import MateProductCard from "./MateProductCard";
import { mateNewArrivals, type MateProduct } from "@/lib/mateNewArrivals";

type Sort = "newest" | "priceAsc" | "priceDesc";

export default function MateCollectionGrid() {
  const [sort, setSort] = useState<Sort>("newest");

  const sorted = useMemo(() => {
    let out = [...mateNewArrivals] as MateProduct[];
    if (sort === "priceAsc") out.sort((a, b) => a.priceLE - b.priceLE);
    if (sort === "priceDesc") out.sort((a, b) => b.priceLE - a.priceLE);
    // newest keeps original order
    return out;
  }, [sort]);

  return (
    <div className="bg-[#fdfbf5]">
      {/* top bar - MATE style: small count left, sort right */}
      <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-black/5 py-4 text-[11px] tracking-[0.08em] uppercase">
          <p className="text-black/70">{sorted.length} Products</p>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-black/50">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-transparent text-[11px] uppercase tracking-[0.08em] outline-none"
            >
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* grid - 4 columns like MATE */}
      <div className="mx-auto max-w-[1600px] px-3 pb-20 sm:px-6 lg:px-8">
        <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-8 sm:gap-x-3 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-12">
          {sorted.map((p) => (
            <MateProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* promo bar like MATE has at bottom? Get 10% off */}
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
