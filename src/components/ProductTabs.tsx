"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

export default function ProductTabs({
  groups,
}: {
  groups: { key: string; label: string; products: Product[] }[];
}) {
  const t = useTranslations("common");
  const [activeKey, setActiveKey] = useState(groups[0]?.key);
  const active = groups.find((g) => g.key === activeKey) ?? groups[0];

  return (
    <div>
      <div
        role="tablist"
        className="mb-8 flex items-center justify-center gap-8 sm:gap-14"
      >
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            role="tab"
            aria-selected={g.key === activeKey}
            onClick={() => setActiveKey(g.key)}
            className={[
              "border-b pb-1.5 text-[15px] transition-colors sm:text-[17px]",
              g.key === activeKey
                ? "border-dotted border-ink text-ink"
                : "border-transparent text-mist hover:text-graphite",
            ].join(" ")}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" key={active.key} className="animate-fade-up">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {active.products.slice(0, 8).map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      </div>

      <p className="mt-10 text-center text-[12px] text-mist">
        {t("viewAll")}
      </p>
    </div>
  );
}
