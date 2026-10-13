"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { GlobeIcon } from "./icons";

export default function LocaleSwitcher({ variant = "footer" }: { variant?: "header" | "footer" }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const other = locale === "en" ? "ar" : "en";
  const label = t(other === "ar" ? "arabic" : "english");
  function switchLocale() {
    // Read browser-only URL state on activation, not during static rendering.
    // Collection filters, sorting, pagination and fragment are all retained.
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: other, scroll: false });
  }
  return (
    <button type="button" onClick={switchLocale} className={variant === "header" ? "site-locale-toggle" : "inline-flex items-center gap-1.5 transition-colors hover:text-ink"} aria-label={`${t("language")}: ${label}`} data-locale-toggle={variant}>
      <GlobeIcon className="h-3.5 w-3.5" />
      <span className={variant === "header" ? "locale-label-full" : undefined} dir="auto">{label}</span>
      {variant === "header" && <span className="locale-label-short" aria-hidden="true">{other === "ar" ? "AR" : "EN"}</span>}
    </button>
  );
}
