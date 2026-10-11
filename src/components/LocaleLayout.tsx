"use client";

import { useTranslations } from "next-intl";

/**
 * Tiny helper so server components can drop a translated string into a
 * `title`/`aria-label` attribute without turning the whole tree into a client
 * component. `values` are passed through to next-intl's ICU formatter.
 */
export default function LocaleLayout({
  k,
  values,
}: {
  k: string;
  values?: Record<string, string | number>;
}) {
  const t = useTranslations();
  return <>{t(k, values)}</>;
}
