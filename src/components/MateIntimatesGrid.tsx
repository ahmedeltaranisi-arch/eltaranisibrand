"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MateProductCard from "./MateProductCard";
import ArrivalFilterDrawer from "./new-arrivals/ArrivalFilterDrawer";
import ArrivalQuickAdd from "./new-arrivals/ArrivalQuickAdd";
import ArrivalFaq from "./new-arrivals/ArrivalFaq";
import { Link } from "@/navigation";
import { useCollectionUrlState } from "@/lib/useCollectionUrlState";
import {
  filterCount,
  filterShopAll,
  offeredCategories,
  offeredColorGroups,
  readShopAllState,
  shopAllFacetCounts,
  shopAllQuery,
  sizeMatches,
  sortShopAll,
  SHOP_ALL_SIZE_FACETS,
  type CollectionFilters,
  type MateProduct,
  type ShopAllState,
} from "@/lib/shopAll";
import { PAGE_SIZE } from "@/lib/mateNewArrivals";
import {
  INTIMATES_FEATURED_COLORS,
  INTIMATES_TABS,
  intimatesColorway,
  intimatesColorways,
  intimatesProducts,
  intimatesProductsInColor,
} from "@/lib/intimates";

export default function MateIntimatesGrid({ handle = "intimates" }: { handle?: string }) {
  const t = useTranslations("intimatesPage");
  const shared = useTranslations("newArrivals");
  const searchParams = useSearchParams();
  const requestedColor = searchParams.get("intimates_color");
  const selectedColor = INTIMATES_FEATURED_COLORS.some((color) => color.key === requestedColor) ? requestedColor : "";
  const writeState = useCallback((next: ShopAllState) => {
    const query = new URLSearchParams(shopAllQuery(next));
    if (selectedColor) query.set("intimates_color", selectedColor);
    return query.toString();
  }, [selectedColor]);
  const { state, navigate } = useCollectionUrlState(readShopAllState, writeState);
  const [drawer, setDrawer] = useState({ open: false, entry: "filters" as "filters" | "sort", session: 0 });
  const [quickAdd, setQuickAdd] = useState<MateProduct | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);

  const rail = useMemo(() => intimatesProducts(handle), [handle]);
  const colorFilteredRail = useMemo(
    () => selectedColor ? intimatesProductsInColor(handle, selectedColor) : rail,
    [rail, handle, selectedColor],
  );
  const filtered = useMemo(() => filterShopAll(colorFilteredRail, state), [colorFilteredRail, state]);
  // Featured keeps each Intimates shelf's own captured product order.
  const sorted = useMemo(() => sortShopAll(filtered, state.sort, true), [filtered, state.sort]);
  const counts = useMemo(() => shopAllFacetCounts(colorFilteredRail, state), [colorFilteredRail, state]);
  const categoryRows = useMemo(() => offeredCategories(colorFilteredRail), [colorFilteredRail]);
  const colorRows = useMemo(() => offeredColorGroups(colorFilteredRail), [colorFilteredRail]);
  const sizeRows = useMemo(
    () => SHOP_ALL_SIZE_FACETS.filter((size) => colorFilteredRail.some((product) => sizeMatches(product, size))),
    [colorFilteredRail],
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(state.page, pageCount);
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const title = t(`collection.${handle}.title` as never);
  const description = t(`collection.${handle}.description` as never);
  const selectedColorCopy = INTIMATES_FEATURED_COLORS.find((color) => color.key === selectedColor);

  function update(next: ShopAllState, push = false, scroll = false) {
    navigate(next, push);
    if (scroll) toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function changeFilters(filters: CollectionFilters) {
    update({ ...state, ...filters, page: 1 });
  }
  function openDrawer(entry: "filters" | "sort") {
    setDrawer((previous) => ({ open: true, entry, session: previous.session + 1 }));
  }
  function closeDrawer() { setDrawer((previous) => ({ ...previous, open: false })); }

  return (
    <div className="na-intimates" data-intimates-handle={handle}>
      <h1 className="sr-only">{title}</h1>
      <p className="sr-only">{description}</p>

      <nav className="na-collection-nav na-intimates-nav" aria-label={t("tabsLabel")}>
        <ul role="list" className="na-collection-nav-list">
          {INTIMATES_TABS.map((tab, index) => {
            const current = tab.handle === handle;
            return (
              <li key={tab.id} className="na-collection-nav-item">
                <Link
                  href={`/collections/${tab.handle}`}
                  className={`na-collection-nav-link ${current ? "is-current" : ""}`}
                  aria-current={current ? "page" : undefined}
                  onClick={() => {
                    closeDrawer();
                    window.setTimeout(() => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                  }}
                >
                  <span className="na-collection-nav-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tab.image} alt={t(`tabAlt.${tab.altKey}`)} width={500} height={644} loading={index === 0 ? "eager" : "lazy"} />
                  </span>
                  <span className="na-collection-nav-label">
                    <span className="na-collection-nav-label-text">{t(`tab.${tab.id}`)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="na-collection na-intimates-collection" aria-label={title}>
        {selectedColorCopy && (
          <div className="na-intimates-color-filter">
            <span className="na-intimates-color-filter-swatch" style={{ backgroundColor: selectedColorCopy.hex }} aria-hidden="true" />
            <span>{t(`menu.color.${selectedColorCopy.labelKey}` as never)}</span>
            <Link href="/collections/intimates" className="na-dotted">{shared("clearAll")}</Link>
          </div>
        )}
        <div ref={toolbar} className="na-collection-toolbar">
          <button type="button" className="na-dotted na-all-filters" aria-expanded={drawer.open} aria-haspopup="dialog" onClick={() => openDrawer("filters")}>
            {shared("allFilters")} {filterCount(state) > 0 ? `(${filterCount(state)})` : "+"}
          </button>
          <button type="button" className="na-sort-trigger" aria-expanded={drawer.open} aria-haspopup="dialog" onClick={() => openDrawer("sort")}>
            <span className="na-sort-label-desktop">{shared("sortBy")}</span>
            <span className="na-sort-label-mobile na-dotted">{shared("sortShort")} +</span>
            <span className="na-sort-value na-dotted">{state.sort === "manual" ? shared("featured") : shared(`sort.${state.sort}`)}</span>
          </button>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">{shared("resultsAnnouncement", { count: sorted.length })}</p>

        {visible.length > 0 ? (
          <div className="na-product-grid na-intimates-product-grid" data-result-count={sorted.length} data-rail={handle}>
            {handle === "intimates" && page === 1 && (
              <article className="na-intimates-editorial">
                <div className="na-intimates-editorial-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/intimates/editorial-second-skin.jpg" alt={t("editorial.alt")} width={999} height={1293} loading="eager" />
                </div>
                <div className="na-intimates-editorial-content">
                  <h2>{t("editorial.title")}</h2>
                  <p>{t("editorial.body")}</p>
                </div>
              </article>
            )}
            {visible.map((product, index) => {
              const swatchProduct = intimatesColorway(product);
              return (
                <MateProductCard
                  key={product.slug}
                  product={swatchProduct}
                  priority={index < 3}
                  onQuickAdd={setQuickAdd}
                  colorways={intimatesColorways}
                />
              );
            })}
          </div>
        ) : (
          <div className="na-collection-empty">
            <h2>{shared("noResults")}</h2>
            <p>{shared("noResultsBody")}</p>
            <button type="button" className="na-dotted" onClick={() => changeFilters({ categories: [], sizes: [], colors: [] })}>{shared("clearAll")}</button>
          </div>
        )}

        {pageCount > 1 && (
          <nav className="na-pagination" aria-label={shared("pagination")}>
            {page > 1 && <button type="button" onClick={() => update({ ...state, page: page - 1 }, true, true)}>{shared("previousPage")} «</button>}
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" aria-label={shared("pageLabel", { page: number })} aria-current={page === number ? "page" : undefined} onClick={() => update({ ...state, page: number }, true, true)}>{number}</button>
            ))}
            {page < pageCount && <button type="button" onClick={() => update({ ...state, page: page + 1 }, true, true)}>{shared("nextPage")} »</button>}
          </nav>
        )}
      </section>

      <ArrivalFaq />
      <nav className="na-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/collections/all">{t("breadcrumbShop")}</Link><span aria-hidden="true">•</span><span aria-current="page">{title}</span>
      </nav>

      <ArrivalFilterDrawer
        key={drawer.session}
        open={drawer.open}
        entry={drawer.entry}
        state={state}
        counts={counts}
        resultCount={sorted.length}
        categoryOptions={categoryRows}
        sizeOptions={sizeRows}
        colorOptions={colorRows}
        onChange={changeFilters}
        onSort={(sort) => update({ ...state, sort, page: 1 })}
        onClose={closeDrawer}
        onApply={() => {
          closeDrawer();
          window.setTimeout(() => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        }}
      />
      <ArrivalQuickAdd key={quickAdd?.slug ?? "closed"} product={quickAdd} onClose={() => setQuickAdd(null)} />
    </div>
  );
}
