"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function FaqList({ count }: { count: number }) {
  const t = useTranslations("contact.faq");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-line border-y border-line">
      {Array.from({ length: count }, (_, i) => {
        const isOpen = open === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-start text-[14px]"
            >
              {t(`items.${i}.q` as never)}
              <span
                className={`shrink-0 text-mist transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ${
                isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl text-[13px] leading-relaxed text-graphite">
                  {t(`items.${i}.a` as never)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
