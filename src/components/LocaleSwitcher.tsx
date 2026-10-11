"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { GlobeIcon } from "./icons";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  const other = locale === "en" ? "ar" : "en";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: other })}
      className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
      aria-label={`${t("language")}: ${t(other === "ar" ? "arabic" : "english")}`}
    >
      <GlobeIcon className="h-3.5 w-3.5" />
      {t(other === "ar" ? "arabic" : "english")}
    </button>
  );
}
