"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MateProductCard from "./MateProductCard";
import ArrivalFilterDrawer from "./new-arrivals/ArrivalFilterDrawer";
import ArrivalQuickAdd from "./new-arrivals/ArrivalQuickAdd";
import ArrivalGetaway from "./new-arrivals/ArrivalGetaway";
import ArrivalDiscover from "./new-arrivals/ArrivalDiscover";
import ArrivalFaq from "./new-arrivals/ArrivalFaq";
import { Link } from "@/navigation";
import { useCollectionUrlState } from "@/lib/useCollectionUrlState";
import {
  PAGE_SIZE, collectionQuery, facetCounts, filterCount, filterProducts,
  mateNewArrivals, readCollectionState, sortProducts,
  type CollectionFilters, type CollectionState, type MateProduct,
} from "@/lib/mateNewArrivals";

export default function MateCollectionGrid() {
  const t = useTranslations("newArrivals");
  const { state, navigate } = useCollectionUrlState(readCollectionState, collectionQuery);
  const [drawer, setDrawer] = useState({ open: false, entry: "filters" as "filters" | "sort", session: 0 });
  const [quickAdd, setQuickAdd] = useState<MateProduct | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => filterProducts(mateNewArrivals, state), [state]);
  const sorted = useMemo(() => sortProducts(filtered, state.sort), [filtered, state.sort]);
  const counts = useMemo(() => facetCounts(mateNewArrivals, state), [state]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // The reference renders an empty grid for a page past the end of the collection rather than
  // clamping back to the last one, so a stale or shared link never silently shows other products.
  const page = Math.max(1, state.page);
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function update(next: CollectionState, push = false, scroll = false) {
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
      <section className="na-collection-intro" aria-labelledby="arrival-title">
        <h1 id="arrival-title">{t("title")}</h1>
        <p>{t("description")}</p>
      </section>
      <section className="na-collection" aria-label={t("title")}>
        <div ref={toolbar} className="na-collection-toolbar">
          <button type="button" className="na-dotted na-all-filters" aria-expanded={drawer.open} aria-haspopup="dialog" onClick={() => openDrawer("filters")}>
            {t("allFilters")} {filterCount(state) > 0 ? `(${filterCount(state)})` : "+"}
          </button>
          <button type="button" className="na-sort-trigger" aria-expanded={drawer.open} aria-haspopup="dialog" onClick={() => openDrawer("sort")}>
            <span className="na-sort-label-desktop">{t("sortBy")}</span>
            <span className="na-sort-label-mobile na-dotted">{t("sortShort")} +</span>
            <span className="na-sort-value na-dotted">{state.sort === "manual" ? t("featured") : t(`sort.${state.sort}`)}</span>
          </button>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">{t("resultsAnnouncement", { count: sorted.length })}</p>
        {visible.length > 0 ? (
          <div className="na-product-grid" data-result-count={sorted.length}>
            {visible.map((product, index) => (
              <Fragment key={product.slug}>
                <MateProductCard product={product} priority={index < 4} onQuickAdd={setQuickAdd} />
                {page === 1 && index === 3 && visible.length > 4 && <ArrivalDiscover />}
                {page === 1 && index === 7 && visible.length > 8 && <ArrivalGetaway />}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="na-collection-empty">
            <p>{t("noResults")}</p>
          </div>
        )}
        {pageCount > 1 && (
          <nav className="na-pagination" aria-label={t("pagination")}>
            {page > 1 && <button type="button" onClick={() => update({ ...state, page: page - 1 }, true, true)}>{t("previousPage")} «</button>}
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" aria-label={t("pageLabel", { page: number })} aria-current={page === number ? "page" : undefined} onClick={() => update({ ...state, page: number }, true, true)}>{number}</button>
            ))}
            {page < pageCount && <button type="button" onClick={() => update({ ...state, page: page + 1 }, true, true)}>{t("nextPage")} »</button>}
          </nav>
        )}
      </section>
      <ArrivalFaq />
      <nav className="na-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/collections/all">{t("shopAll")}</Link><span aria-hidden="true">•</span><span aria-current="page">{t("title")}</span>
      </nav>
      <ArrivalFilterDrawer
        key={drawer.session} open={drawer.open} entry={drawer.entry} state={state} counts={counts} resultCount={sorted.length}
        onChange={changeFilters} onSort={(sort) => update({ ...state, sort, page: 1 })} onClose={closeDrawer}
        onApply={() => { closeDrawer(); window.setTimeout(() => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
      />
      <ArrivalQuickAdd key={quickAdd?.slug ?? "closed"} product={quickAdd} onClose={() => setQuickAdd(null)} />
    </>
  );
}
