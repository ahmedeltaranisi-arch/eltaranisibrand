"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";

/**
 * The Activewear mega menu, reproduced from the reference header: three link columns
 * (Categories, Featured Colors, Featured Collections) and two featured tiles. Every target is a
 * collection this storefront really renders, and every swatch is the dye's own artwork.
 */
export type MegaColor = { key: string; labelKey: string; href: string; swatch: string };

export const MEGA_CATEGORY_LINKS = [
  { key: "shopAll", href: "/collections/activewear" },
  { key: "leggings", href: "/collections/leggings-and-shorts" },
  { key: "sportsBras", href: "/collections/sports-bras" },
  { key: "activewearTops", href: "/collections/activewear-tops" },
  { key: "bikerShorts", href: "/collections/biker-shorts" },
  { key: "unitards", href: "/collections/dresses-unitards" },
] as const;

export const MEGA_COLORS: MegaColor[] = [
  { key: "fig", labelKey: "fig", href: "/collections/fig", swatch: "/img/aw/color/fig.webp" },
  { key: "nori", labelKey: "nori", href: "/collections/nori", swatch: "/img/aw/color/nori.webp" },
  { key: "mulberry", labelKey: "mulberry", href: "/collections/mulberry", swatch: "/img/aw/color/mulberry.webp" },
  { key: "mocha", labelKey: "mocha", href: "/collections/mocha-move", swatch: "/img/aw/color/mocha.webp" },
  { key: "pebble", labelKey: "pebble", href: "/collections/pebble", swatch: "/img/aw/color/pebble.webp" },
];

export const MEGA_COLLECTION_LINKS = [
  { key: "organicStudioUniform", href: "/collections/organic-studio-uniform" },
] as const;

export const MEGA_TILES = [
  { key: "limitedEditionFig", href: "/collections/fig", image: "/img/aw/mega/limited-edition-fig.webp" },
  { key: "shopAllActivewear", href: "/collections/move-by-mate", image: "/img/aw/mega/shop-all-activewear.webp" },
] as const;

export default function ArrivalMegaMenu({ label, href }: { label: string; href: string }) {
  const t = useTranslations("activewear.mega");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const current =
    pathname === href ||
    MEGA_CATEGORY_LINKS.some((link) => pathname === link.href) ||
    MEGA_COLORS.some((link) => pathname === link.href);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  function schedule(open: boolean) {
    if (timer.current) window.clearTimeout(timer.current);
    // A short grace period keeps the pointer's diagonal trip from the label into the panel.
    timer.current = window.setTimeout(() => setOpen(open), open ? 0 : 120);
  }

  return (
    <div
      ref={wrap}
      className={`na-header-mega ${open ? "is-open" : ""}`}
      onMouseEnter={() => schedule(true)}
      onMouseLeave={() => schedule(false)}
      onFocus={() => schedule(true)}
      onBlur={(event) => { if (!wrap.current?.contains(event.relatedTarget as Node)) schedule(false); }}
    >
      <Link
        href={href}
        className={current ? "is-current" : ""}
        aria-current={current ? "page" : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="na-mega-activewear"
        onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }}
      >
        {label}
      </Link>
      <div id="na-mega-activewear" className="na-header-mega-panel" inert={!open} aria-hidden={!open}>
        <div className="na-header-mega-columns">
          <div>
            <p className="na-header-mega-title">{t("categoriesTitle")}</p>
            {MEGA_CATEGORY_LINKS.map((link) => (
              <Link key={link.key} href={link.href}>{t(link.key)}</Link>
            ))}
          </div>
          <div>
            <p className="na-header-mega-title">{t("colorsTitle")}</p>
            {MEGA_COLORS.map((link) => (
              <Link key={link.key} href={link.href}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="na-nav-swatch" src={link.swatch} alt="" width={40} height={40} loading="lazy" />
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
          <div>
            <p className="na-header-mega-title">{t("collectionsTitle")}</p>
            {MEGA_COLLECTION_LINKS.map((link) => (
              <Link key={link.key} href={link.href}>{t(link.key)}</Link>
            ))}
          </div>
        </div>
        <div className="na-header-featured">
          {MEGA_TILES.map((tile) => (
            <Link key={tile.key} href={tile.href}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tile.image} alt="" width={218} height={281} loading="lazy" />
              <span>{t(tile.key)}</span>
            </Link>
          ))}
        </div>
      </div>
      <span className="na-header-scrim" aria-hidden="true" />
    </div>
  );
}
