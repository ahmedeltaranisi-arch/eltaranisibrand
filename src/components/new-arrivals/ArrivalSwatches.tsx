"use client";

import { useTranslations } from "next-intl";
import type { MateProduct } from "@/lib/mateNewArrivals";

export default function ArrivalSwatches({ products, activeSlug, onSelect, expanded = true, previewOnHover = true }: {
  products: MateProduct[];
  activeSlug: string;
  onSelect: (product: MateProduct) => void;
  expanded?: boolean;
  previewOnHover?: boolean;
}) {
  const t = useTranslations("newArrivals");
  return (
    <div className={`na-swatches ${expanded ? "is-expanded" : ""}`} role="group" aria-label={t("colorLabel")}>
      {products.map((product) => (
        <button
          key={product.slug}
          type="button"
          className={`na-swatch ${product.slug === activeSlug ? "is-current" : ""}`}
          style={{ backgroundColor: product.color.hex, backgroundImage: `url("${product.color.swatch}")` }}
          title={t(`color.${product.color.name}`)}
          aria-label={t("selectColor", { color: t(`color.${product.color.name}`) })}
          aria-pressed={product.slug === activeSlug}
          onClick={() => onSelect(product)}
          onMouseEnter={previewOnHover ? () => onSelect(product) : undefined}
          onFocus={previewOnHover ? () => onSelect(product) : undefined}
        />
      ))}
    </div>
  );
}
