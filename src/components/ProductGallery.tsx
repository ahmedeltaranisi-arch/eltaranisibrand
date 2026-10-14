"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CloseIcon, ChevronIcon } from "./icons";

/**
 * Thumbnail rail + main frame + lightbox. `key={activeSlug}` on the main image
 * re-triggers the fade when the shopper switches colourway.
 */
export default function ProductGallery({
  images,
  alt,
  activeSlug,
}: {
  images: string[];
  alt: string;
  activeSlug: string;
}) {
  const t = useTranslations("common");
  const [active, setActive] = useState(0);
  // The reference shows a second full pose on hover; never a zoom. Keyboard focus matches.
  const [preview, setPreview] = useState(false);
  const shownFrame = preview && images.length > 1 ? (active + 1) % images.length : active;
  const [zoom, setZoom] = useState(false);
  const [prevSlug, setPrevSlug] = useState(activeSlug);

  // reset to the first frame when the shopper switches colourway
  // (render-time adjust — avoids a cascading effect)
  if (activeSlug !== prevSlug) {
    setPrevSlug(activeSlug);
    setActive(0);
  }

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setActive((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, images.length]);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[76px_1fr]">
        <ul className="order-2 flex gap-3 sm:order-1 sm:flex-col">
          {images.map((src, i) => (
            <li key={src + i} className="w-16 sm:w-full">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${alt} ${i + 1}`}
                aria-current={active === i}
                className={[
                  "block w-full border transition-colors",
                  active === i ? "border-ink" : "border-transparent hover:border-line",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="aspect-3/4 w-full bg-bone object-contain"
                />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => { setActive(shownFrame); setPreview(false); setZoom(true); }}
          onMouseEnter={() => setPreview(true)}
          onMouseLeave={() => setPreview(false)}
          onFocus={() => setPreview(true)}
          onBlur={() => setPreview(false)}
          className="group relative order-1 block w-full cursor-zoom-in overflow-hidden bg-bone sm:order-2"
          aria-label={t("viewAll")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeSlug + active}
            src={images[shownFrame]}
            alt={alt}
            className="aspect-3/4 w-full animate-fade-up object-contain"
          />
        </button>
      </div>

      {/* lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/95 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i - 1 + images.length) % images.length);
            }}
            className="absolute start-4 grid h-11 w-11 place-items-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper/10"
            aria-label="Previous image"
          >
            <ChevronIcon className="h-5 w-5 rotate-180" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88svh] max-w-[92vw] animate-fade-up object-contain"
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i + 1) % images.length);
            }}
            className="absolute end-4 grid h-11 w-11 place-items-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper/10"
            aria-label="Next image"
          >
            <ChevronIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute top-4 end-4 grid h-11 w-11 place-items-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper/10"
            aria-label={t("close")}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
