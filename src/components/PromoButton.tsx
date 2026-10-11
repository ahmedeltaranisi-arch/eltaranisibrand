"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Fixed "Get 10% Off" pill, bottom-left on every page (like the reference).
 * Slate by default; inverts to a bordered cream chip on hover; × dismisses.
 */
export default function PromoButton() {
  const t = useTranslations("promo");
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div
      className="group fixed bottom-5 left-5 z-[70] flex items-stretch border border-slate bg-slate text-paper shadow-sm transition-colors duration-300 hover:border-ink hover:bg-paper hover:text-ink"
      dir="ltr"
    >
      <button
        type="button"
        className="px-4 py-2.5 text-[13px] font-medium tracking-[0.02em]"
      >
        {t("label")}
      </button>
      <button
        type="button"
        aria-label={t("dismiss")}
        title={t("dismiss")}
        onClick={() => setOpen(false)}
        className="border-s border-paper/30 px-2.5 text-[13px] transition-colors group-hover:border-ink/20 hover:opacity-70"
      >
        ✕
      </button>
    </div>
  );
}
