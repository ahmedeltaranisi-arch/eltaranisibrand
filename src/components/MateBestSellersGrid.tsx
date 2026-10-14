"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MateProductCard from "./MateProductCard";
import ArrivalFilterDrawer from "./new-arrivals/ArrivalFilterDrawer";
import ArrivalQuickAdd from "./new-arrivals/ArrivalQuickAdd";
import ArrivalFaq from "./new-arrivals/ArrivalFaq";
import { Link } from "@/navigation";
import { useCollectionUrlState } from "@/lib/useCollectionUrlState";
import {
  COLOR_GROUPS, PAGE_SIZE, filterCount,
  type CollectionFilters, type MateProduct,
} from "@/lib/mateNewArrivals";
import {
  BEST_SELLER_TABS, SIZE_FACETS, bestSellerFacetCounts, bestSellersQuery,
  filterBestSellers, readBestSellersState, sortBestSellers, tabProducts,
  type BestSellerState,
} from "@/lib/mateBestSellers";

/** The reference plants one two-column editorial after the sixth card of the first page. */
const EDITORIAL_AFTER = 5;

export default function MateBestSellersGrid() {
  const t = useTranslations("bestSellers");
  const shared = useTranslations("newArrivals");
  const { state, navigate } = useCollectionUrlState(readBestSellersState, bestSellersQuery);
  const [drawer, setDrawer] = useState({ open: false, entry: "filters" as "filters" | "sort", session: 0 });
  const [quickAdd, setQuickAdd] = useState<MateProduct | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);

  const rail = useMemo(() => tabProducts(state.tab), [state.tab]);
  const filtered = useMemo(() => filterBestSellers(rail, state), [rail, state]);
  const sorted = useMemo(() => sortBestSellers(filtered, state.sort), [filtered, state.sort]);
  const counts = useMemo(() => bestSellerFacetCounts(rail, state), [rail, state]);
  // A colour group the current rail cannot offer is removed from the UI rather than offered empty.
  const colorRows = useMemo(() => COLOR_GROUPS.filter((group) => (counts.colors[group] ?? 0) > 0), [counts]);
  const tabs = useMemo(
    () => BEST_SELLER_TABS.filter((tab) => (tab.id === "all" ? true : tabProducts(tab.id).length > 0)),
    [],
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // The reference renders an empty grid for a page past the end of the collection rather than
  // clamping back to the last one, so a stale or shared link never silently shows other products.
  const page = Math.max(1, state.page);
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function update(next: BestSellerState, push = false, scroll = false) {
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
    <>
      <section className="na-collection-intro" aria-labelledby="best-sellers-title">
        <h1 id="best-sellers-title">{t("title")}</h1>
        <p>{t("description")}</p>
      </section>

      <nav className="na-collection-nav" aria-label={t("rails")}>
        <ul role="list" className="na-collection-nav-list">
          {tabs.map((tab, index) => {
            const current = tab.id === state.tab;
            const query = bestSellersQuery({ ...state, tab: tab.id, page: 1 });
            return (
              <li key={tab.id} className="na-collection-nav-item">
                <Link
                  href={`/collections/best-sellers${query ? `?${query}` : ""}`}
                  className={`na-collection-nav-link ${current ? "is-current" : ""}`}
                  aria-current={current ? "page" : undefined}
                  onClick={() => { closeDrawer(); window.setTimeout(() => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                >
                  <span className="na-collection-nav-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tab.image} alt={t(`tabAlt.${tab.id}`)} width={436} height={562} loading={index === 0 ? "eager" : "lazy"} />
                  </span>
                  <span className="na-collection-nav-label">
                    <span className="na-collection-nav-label-text">{t(tab.labelKey)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="na-collection" aria-label={t("title")}>
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
          <div className="na-product-grid" data-result-count={sorted.length} data-tab={state.tab}>
            {visible.map((product, index) => (
              <Fragment key={product.slug}>
                <MateProductCard product={product} priority={index < 4} onQuickAdd={setQuickAdd} leadingBadges={["Best Seller"]} />
                {page === 1 && index === EDITORIAL_AFTER && visible.length > EDITORIAL_AFTER + 1 && (
                  <article className="na-bs-editorial">
                    <div className="na-bs-editorial-media">
                      <span className="na-bs-editorial-pane">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/img/best-sellers/editorial-primary.webp" alt={t("editorialHeading")} width={678} height={862} loading="lazy" />
                      </span>
                      <span className="na-bs-editorial-pane">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/img/best-sellers/editorial-secondary.webp" alt="" aria-hidden="true" width={678} height={862} loading="lazy" />
                      </span>
                    </div>
                    <div className="na-bs-editorial-content">
                      <h2>{t("editorialHeading")}</h2>
                      <p>{t("editorialText")}</p>
                      <Link href="/collections/best-sellers?tab=sleep" className="na-dotted">{t("editorialCta")}</Link>
                    </div>
                  </article>
                )}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="na-collection-empty">
            <p>{shared("noResults")}</p>
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
        <Link href="/collections/all">{shared("shopAll")}</Link><span aria-hidden="true">•</span><span aria-current="page">{t("title")}</span>
      </nav>

      <ArrivalFilterDrawer
        key={drawer.session} open={drawer.open} entry={drawer.entry} state={state} counts={counts} resultCount={sorted.length}
        sizeOptions={SIZE_FACETS} colorOptions={colorRows}
        onChange={changeFilters} onSort={(sort) => update({ ...state, sort, page: 1 })} onClose={closeDrawer}
        onApply={() => { closeDrawer(); window.setTimeout(() => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
      />
      <ArrivalQuickAdd key={quickAdd?.slug ?? "closed"} product={quickAdd} onClose={() => setQuickAdd(null)} />
    </>
  );
}
