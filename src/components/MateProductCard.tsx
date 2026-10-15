"use client";

import { hoverFrame } from "@/lib/photoSelection";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { formatLE, type MateProduct } from "@/lib/mateNewArrivals";
import { catalogColorways } from "@/lib/mateCatalog";
import { getAnyCatalogProduct } from "@/lib/shopAllProducts";

export default function MateProductCard({ product, priority = false, onQuickAdd, leadingBadges, colorways: colorwayRow }: {
  product: MateProduct;
  priority?: boolean;
  onQuickAdd: (product: MateProduct) => void;
  /** Collection-level badges (the reference badges every Best Sellers card), never stored data. */
  leadingBadges?: string[];
  /**
   * Collections that print one swatch per colour group (Shop All) pass their own row builder;
   * everything else keeps the arrival capture's colourways on that collection's own photography.
   */
  colorways?: (product: MateProduct) => MateProduct[];
}) {
  const t = useTranslations("newArrivals");
  const [activeSlug, setActiveSlug] = useState(product.slug);
  const [expanded, setExpanded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageHovered, setImageHovered] = useState(false);
  /** Keyboard focus shows the same alternate pose as a pointer hover: no zoom, no crop. */
  const [imageFocused, setImageFocused] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const colorways = (colorwayRow ?? catalogColorways)(product);
  // The colourway we were handed wins; a slug switch resolves inside this card's own swatch row
  // first, so the swap shows that collection's own photograph of the colour.
  const active = activeSlug === product.slug
    ? product
    : colorways.find((colorway) => colorway.slug === activeSlug) ?? getAnyCatalogProduct(activeSlug) ?? product;
  const title = t(`products.${active.style}`);
  const color = t(`color.${active.color.name}`);
  const badges = [...new Set([...(leadingBadges ?? []), ...active.badges])];
  const hero = active.images[imageIndex] ?? active.images[0];
  // The hover frame is a second whole photograph of the same colourway; a colourway that owns
  // only one keeps it, because a card never swaps to a crop.
  const alternate = hoverFrame(active.images, active.category, hero);
  const previewAlternate = Boolean(alternate) && (imageHovered || imageFocused);
  const displayedIndex = previewAlternate ? active.images.indexOf(alternate) : imageIndex;

  function selectColor(colorway: MateProduct) {
    if (activeSlug === colorway.slug) return;
    setImageHovered(false);
    setImageFocused(false);
    setImageIndex(0);
    setActiveSlug(colorway.slug);
  }
  function changeImage(direction: number) {
    setImageHovered(false);
    setImageFocused(false);
    setImageIndex((index) => (index + direction + active.images.length) % active.images.length);
  }

  return (
    <article className="na-product-card product-reveal-card" data-product-slug={active.slug} data-default-slug={product.slug} data-price={active.priceLE} data-compare-at={active.compareAtLE ?? ""}>
      <div className="na-product-media-frame">
        <Link
          href={`/products/${active.slug}`}
          className="na-product-media"
          aria-label={t("imagePosition", { product: title, color, position: displayedIndex + 1, total: active.images.length })}
          onMouseEnter={() => setImageHovered(true)}
          onMouseLeave={() => setImageHovered(false)}
          onFocus={() => setImageFocused(true)}
          onBlur={() => setImageFocused(false)}
          onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; dragged.current = false; }}
          onPointerUp={(event) => {
            if (!pointerStart.current) return;
            const dx = event.clientX - pointerStart.current.x;
            const dy = event.clientY - pointerStart.current.y;
            pointerStart.current = null;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
              dragged.current = true;
              changeImage(dx < 0 ? 1 : -1);
            }
          }}
          onClick={(event) => { if (dragged.current) { event.preventDefault(); dragged.current = false; } }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault(); changeImage(event.key === "ArrowRight" ? 1 : -1);
            }
          }}
          draggable={false}
        >
          {/* Local WebP photographs preserve the correct garment, dye and model pose. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt={`${title} — ${color}`} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} width={900} height={1200} draggable={false} />
          {alternate && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={alternate} alt="" aria-hidden="true" className={`na-product-hover-image ${previewAlternate ? "is-visible" : ""}`} loading="lazy" width={900} height={1200} draggable={false} />
          )}
        </Link>
        {active.images.length > 1 && <div className="na-product-scrollbar" aria-hidden="true"><span style={{ width: `${100 / active.images.length}%`, transform: `translateX(${displayedIndex * 100}%)` }} /></div>}
        {badges.length > 0 && (
          <div className="na-product-badges">
            {badges.map((badge) => {
              const key = badge.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
              return <span key={badge} className="na-product-badge">{t.has(`badges.${key}`) ? t(`badges.${key}`) : badge}</span>;
            })}
          </div>
        )}
      </div>
      <h3 className="na-product-title"><Link href={`/products/${active.slug}`}>{title}</Link></h3>
      <p className="na-product-price">
        {active.compareAtLE
          // A colourway the reference discounts prints the price it usually costs, struck through,
          // in front of the sale price — the same two numbers, in the same order, on the same line.
          ? <s className="na-product-compare-price">{formatLE(active.compareAtLE)}</s>
          : null}
        <span className="na-product-current-price">{formatLE(active.priceLE)}</span>
      </p>
      {/* The reference prints the swatch rail under the price and the quick-add last. */}
      <div className={`na-swatches ${expanded ? "is-expanded" : ""}`} role="group" aria-label={t("colorLabel")}>
        {colorways.map((colorway) => (
          <button
            type="button"
            key={colorway.slug}
            className={`na-swatch ${active.slug === colorway.slug ? "is-current" : ""}`}
            style={{ backgroundColor: colorway.color.hex, backgroundImage: `url("${colorway.color.swatch}")` }}
            title={t(`color.${colorway.color.name}`)}
            aria-label={t("selectColor", { color: t(`color.${colorway.color.name}`) })}
            aria-pressed={active.slug === colorway.slug}
            onClick={() => selectColor(colorway)}
            onMouseEnter={() => selectColor(colorway)}
            onFocus={() => selectColor(colorway)}
          />
        ))}
        {colorways.length > 4 && <button type="button" className="na-swatch-more na-swatch-more-desktop" aria-expanded={expanded} aria-label={t("showAllColors", { count: colorways.length - 4, product: title })} onClick={() => setExpanded(true)}>+{colorways.length - 4}</button>}
        {colorways.length > 3 && <button type="button" className="na-swatch-more na-swatch-more-mobile" aria-expanded={expanded} aria-label={t("showAllColors", { count: colorways.length - 3, product: title })} onClick={() => setExpanded(true)}>+{colorways.length - 3}</button>}
      </div>
      <button type="button" className="na-product-add product-reveal-action" aria-haspopup="dialog" aria-label={`${t("quickAdd")} ${title}`} onClick={() => onQuickAdd(active)}>
        <span>{t("add")}</span><span aria-hidden="true">+</span>
      </button>
    </article>
  );
}
