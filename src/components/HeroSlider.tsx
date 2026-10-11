"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { ChevronIcon, PauseIcon, PlayIcon } from "./icons";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  cta: string;
  href: string;
  image: string;
};

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const t = useTranslations("home.hero");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const go = useCallback(
    (dir: 1 | -1) =>
      setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => go(1), 6000);
    return () => window.clearInterval(id);
  }, [playing, go]);

  return (
    <section className="relative overflow-hidden bg-bone">
      <div className="relative h-[78svh] min-h-[520px] w-full sm:h-[86svh]">
        {slides.map((slide, i) => (
          <div
            key={slide.image}
            aria-hidden={i !== index}
            className={[
              "absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)]",
              i === index ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt=""
              className="h-full w-full object-cover object-top"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-ink/5 to-transparent" />
          </div>
        ))}

        {/* copy */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-10">
          <div key={index} className="max-w-xl animate-fade-up text-paper">
            <p className="eyebrow mb-3 opacity-80">{slides[index].eyebrow}</p>
            <h1 className="text-[34px] leading-[1.05] font-light sm:text-[52px] lg:text-[64px]">
              {slides[index].title}
            </h1>
            <Link
              href={slides[index].href}
              className="mt-7 inline-flex h-12 items-center gap-2 bg-paper px-7 text-[11px] tracking-[0.14em] text-ink uppercase transition-colors hover:bg-bone"
            >
              {slides[index].cta}
            </Link>
          </div>
        </div>

        {/* controls */}
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-end gap-2 px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid h-9 w-9 place-items-center rounded-full border border-paper/40 text-paper transition-colors hover:bg-paper/15"
            aria-label={playing ? t("pause") : t("play")}
          >
            {playing ? (
              <PauseIcon className="h-3.5 w-3.5" />
            ) : (
              <PlayIcon className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => go(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-paper/40 text-paper transition-colors hover:bg-paper/15"
            aria-label={t("prev")}
          >
            <ChevronIcon className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-paper/40 text-paper transition-colors hover:bg-paper/15"
            aria-label={t("next")}
          >
            <ChevronIcon className="h-4 w-4" />
          </button>
          <div className="ms-3 flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.image + i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}`}
                className={[
                  "h-1 rounded-full transition-all",
                  i === index ? "w-6 bg-paper" : "w-2 bg-paper/45",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
