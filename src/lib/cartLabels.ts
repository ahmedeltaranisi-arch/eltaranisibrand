"use client";

import { useTranslations } from "next-intl";
import type { CartLine } from "./types";

/** Resolve current-locale labels for both real arrival SKUs and legacy carts. */
export function useCartLabels() {
  const t = useTranslations();
  return {
    title: (line: CartLine) => t.has(line.titleKey) ? t(line.titleKey) : (line.title ?? line.productSlug.replace(/-/g, " ")),
    color: (line: CartLine) => {
      const arrivalKey = `newArrivals.color.${line.colorName}`;
      const legacyKey = `colors.${line.colorName}`;
      if (line.titleKey.startsWith("newArrivals.") && t.has(arrivalKey)) return t(arrivalKey);
      return t.has(legacyKey) ? t(legacyKey) : t.has(arrivalKey) ? t(arrivalKey) : (line.colorLabel ?? line.colorName);
    },
  };
}
