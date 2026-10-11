"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronIcon, StarIcon } from "./icons";

/**
 * Reviewer portraits come from the brand shoot (real people, no AI faces), so
 * the face above the stars changes with the quote it belongs to.
 */
const AVATARS = ["/img/rev-a.jpg", "/img/rev-b.jpg", "/img/rev-c.jpg"];

export default function ReviewCarousel({ count }: { count: number }) {
  const t = useTranslations("home.reviews");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      7000,
    );
    return () => window.clearInterval(id);
  }, [count]);

  return (
    <div className="mx-auto max-w-3xl text-center">
      {/* the face that belongs to the quote on screen */}
      <div className="mb-7 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`a-${index}`}
          src={AVATARS[index % AVATARS.length]}
          alt=""
          aria-hidden
          loading="lazy"
          className="animate-fade-up h-16 w-16 rounded-full border border-line object-cover sm:h-[72px] sm:w-[72px]"
        />
      </div>

      <div className="mb-5 flex justify-center gap-1 text-ink">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} className="h-4 w-4" />
        ))}
      </div>

      <blockquote key={index} className="animate-fade-up">
        <p className="text-[20px] leading-relaxed font-light sm:text-[26px]">
          “{t(`items.${index}.quote` as never)}”
        </p>
        <footer className="mt-6 text-[12px] tracking-[0.1em] text-mist uppercase">
          {t(`items.${index}.name` as never)} ·{" "}
          {t(`items.${index}.location` as never)}
        </footer>
      </blockquote>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + count) % count)}
          className="grid h-9 w-9 place-items-center rounded-full border border-line transition-colors hover:border-ink"
          aria-label={t("prev")}
        >
          <ChevronIcon className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % count)}
          className="grid h-9 w-9 place-items-center rounded-full border border-line transition-colors hover:border-ink"
          aria-label={t("next")}
        >
          <ChevronIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
