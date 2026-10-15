"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import { SHOP_ALL_DYES, SHOP_ALL_FABRICS, SHOP_ALL_MEGA_TILES } from "@/lib/shopAll";

/**
 * The header's mega menus, reproduced from the reference header: link columns (Categories,
 * Featured Colors, Featured Fabrics, Featured Collections) and two featured tiles. Every target
 * is a collection this storefront really renders with real products, and every swatch is the
 * dye's own artwork — a row the catalogue cannot fill is not printed.
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

/**
 * The Clothing mega menu, mirroring the reference's own rows: its category list (through Sale), the
 * five dyes it features (each with that dye's real colorways behind it), its fabricates and its
 * collections (through Gift Card). Every row lands on a collection or product page this storefront
 * really renders — the Sale shelf is the reference's own up-to-50-off list and the Gift Card row
 * opens the gift card product, so no menu entry lands on an empty page.
 */
const CLOTHING_CATEGORY_LINKS = [
  { key: "shopAllClothing", href: "/collections/all" },
  { key: "bestSellers", href: "/collections/best-sellers" },
  { key: "activewear", href: "/collections/activewear" },
  { key: "teesTanks", href: "/collections/tees" },
  { key: "sweatshirts", href: "/collections/sweatshirts" },
  { key: "sweatpants", href: "/collections/sweatpants" },
  { key: "sweaters", href: "/collections/sweaters" },
  { key: "bottoms", href: "/collections/bottoms" },
  { key: "sleep", href: "/collections/sleep" },
  { key: "intimates", href: "/collections/intimates" },
  { key: "socks", href: "/collections/socks" },
  { key: "sale", href: "/collections/up-to-50-off" },
] as const;

const CLOTHING_COLLECTION_LINKS = [
  { key: "newArrivals", href: "/collections/new-arrivals" },
  { key: "octoberCapsule", href: "/collections/october-capsule" },
  { key: "getawayEdit", href: "/collections/getaway-edit" },
  { key: "organicStudioUniform", href: "/collections/organic-studio-uniform" },
  { key: "cozyShop", href: "/collections/cozy-shop" },
  { key: "bundleAndSave", href: "/collections/bundle-and-save" },
  { key: "giftCard", href: "/products/gift-card" },
] as const;

export default function ArrivalMegaMenu({ label, href, variant = "activewear" }: {
  label: string;
  href: string;
  /** Which menu to open: the Activewear capture's own, or the Clothing (Shop All) one. */
  variant?: "activewear" | "clothing";
}) {
  const t = useTranslations(variant === "clothing" ? "shopAll.mega" : "activewear.mega");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // The dot marks the label of the page you are standing on, and nothing else. A page this panel
  // happens to list (a Tees shelf, a Sale shelf, Best Sellers) lights its own label or none at all,
  // so two labels never carry a dot and a label never looks current from elsewhere.
  const current = pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  function schedule(next: boolean) {
    if (timer.current) window.clearTimeout(timer.current);
    // A short grace period keeps the pointer's diagonal trip from the label into the panel.
    timer.current = window.setTimeout(() => setOpen(next), next ? 0 : 120);
  }

  const panelId = variant === "clothing" ? "na-mega-clothing" : "na-mega-activewear";

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
        aria-controls={panelId}
        onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }}
      >
        {label}
      </Link>
      <div id={panelId} className="na-header-mega-panel" inert={!open} aria-hidden={!open}>
        <div className="na-header-mega-columns">
          <div>
            <p className="na-header-mega-title">{t("categoriesTitle")}</p>
            {variant === "clothing"
              ? CLOTHING_CATEGORY_LINKS.map((link) => <Link key={link.key} href={link.href}>{t(link.key)}</Link>)
              : MEGA_CATEGORY_LINKS.map((link) => <Link key={link.key} href={link.href}>{t(link.key)}</Link>)}
          </div>
          <div>
            <p className="na-header-mega-title">{t("colorsTitle")}</p>
            {variant === "clothing"
              ? SHOP_ALL_DYES.map((dye) => (
                <Link key={dye.id} href={dye.href}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="na-nav-swatch" src={dye.swatch ?? ""} alt="" width={40} height={40} loading="lazy" />
                  {t(`color.${dye.handle}`)}
                </Link>
              ))
              : MEGA_COLORS.map((link) => (
                <Link key={link.key} href={link.href}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="na-nav-swatch" src={link.swatch} alt="" width={40} height={40} loading="lazy" />
                  {t(link.labelKey)}
                </Link>
              ))}
          </div>
          {variant === "clothing" ? (
            <>
              <div>
                <p className="na-header-mega-title">{t("fabricsTitle")}</p>
                {SHOP_ALL_FABRICS.map((fabric) => (
                  <Link key={fabric.id} href={fabric.href}>{t(`fabric.${fabric.id}`)}</Link>
                ))}
              </div>
              <div>
                <p className="na-header-mega-title">{t("collectionsTitle")}</p>
                {CLOTHING_COLLECTION_LINKS.map((link) => (
                  <Link key={link.key} href={link.href}>{t(link.key)}</Link>
                ))}
              </div>
            </>
          ) : (
            <div>
              <p className="na-header-mega-title">{t("collectionsTitle")}</p>
              {MEGA_COLLECTION_LINKS.map((link) => (
                <Link key={link.key} href={link.href}>{t(link.key)}</Link>
              ))}
            </div>
          )}
        </div>
        <div className="na-header-featured">
          {variant === "clothing"
            ? (
              [
                { key: "octoberCapsule", href: "/collections/october-capsule", image: SHOP_ALL_MEGA_TILES.octoberCapsule },
                { key: "getawayEdit", href: "/collections/getaway-edit", image: SHOP_ALL_MEGA_TILES.getawayEdit },
              ] as const
            ).map((tile) => (
              <Link key={tile.key} href={tile.href}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tile.image} alt="" width={218} height={281} loading="lazy" />
                <span>{t(`tile.${tile.key}`)}</span>
              </Link>
            ))
            : MEGA_TILES.map((tile) => (
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
