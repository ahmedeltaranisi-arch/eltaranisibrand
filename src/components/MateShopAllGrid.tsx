"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MateProductCard from "./MateProductCard";
import ArrivalFilterDrawer from "./new-arrivals/ArrivalFilterDrawer";
import ArrivalQuickAdd from "./new-arrivals/ArrivalQuickAdd";
import ArrivalFaq from "./new-arrivals/ArrivalFaq";
import { Link } from "@/navigation";
import { useCollectionUrlState } from "@/lib/useCollectionUrlState";
import { SHOP_ALL_EDITORIAL, SHOP_ALL_SIZE_FACETS, SHOP_ALL_TABS, filterCount, offeredCategories, offeredColorGroups, railProducts, readShopAllState, shopAllColorways, shopAllFacetCounts, shopAllQuery, sortShopAll, filterShopAll, type CollectionFilters, type MateProduct, type ShopAllState, type EditorialPanes } from "@/lib/shopAll";
import { PAGE_SIZE } from "@/lib/mateNewArrivals";

/**
 * The reference plants one two-column editorial after the sixth card and a second one further
 * down the first page; both are reproduced at the same positions.
 */
const EDITORIALS: Array<{
  after: number;
  heading: string;
  body: string;
  cta: string;
  panes: EditorialPanes;
  href: string;
  /** The reference's second editorial runs the full grid width; both keep its own aspect. */
  fullWidth?: boolean;
}> = [
  {
    after: 5,
    heading: "editorial.octoberCapsule.heading",
    body: "editorial.octoberCapsule.body",
    cta: "editorial.octoberCapsule.cta",
    panes: SHOP_ALL_EDITORIAL.octoberCapsule,
    href: "/collections/october-capsule",
  },
  {
    after: 17,
    heading: "editorial.getawayEdit.heading",
    body: "editorial.getawayEdit.body",
    cta: "editorial.getawayEdit.cta",
    panes: SHOP_ALL_EDITORIAL.getawayEdit,
    href: "/collections/getaway-edit",
    fullWidth: true,
  },
];

export default function MateShopAllGrid({ handle = "all" }: { handle?: string }) {
  const t = useTranslations("shopAll");
  const shared = useTranslations("newArrivals");
  const { state, navigate } = useCollectionUrlState(readShopAllState, shopAllQuery);
  const [drawer, setDrawer] = useState({ open: false, entry: "filters" as "filters" | "sort", session: 0 });
  const [quickAdd, setQuickAdd] = useState<MateProduct | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);

  const rail = useMemo(() => railProducts(handle), [handle]);
  const filtered = useMemo(() => filterShopAll(rail, state), [rail, state]);
  // Featured keeps this shelf's own captured order (the reference's rule); the other sorts re-rank.
  const sorted = useMemo(() => sortShopAll(filtered, state.sort, true), [filtered, state.sort]);
  const counts = useMemo(() => shopAllFacetCounts(rail, state), [rail, state]);
  // A facet a rail cannot offer is removed from the UI rather than shown empty.
  const colorRows = useMemo(() => offeredColorGroups(rail), [rail]);
  const categoryRows = useMemo(() => offeredCategories(rail), [rail]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // The reference renders an empty grid for a page past the end of the collection rather than
  // clamping back to the last one, so a stale or shared link never silently shows other products.
  const page = Math.max(1, state.page);
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copyKey = handle === "all" ? null : `collection.${handle}`;
  const title = copyKey && t.has(`${copyKey}.title`) ? t(`${copyKey}.title`) : t("title");
  const description = copyKey && t.has(`${copyKey}.description`) ? t(`${copyKey}.description`) : t("description");

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
    <>
      <section className="na-collection-intro" aria-labelledby="shop-all-title">
        <h1 id="shop-all-title">{title}</h1>
        <p>{description}</p>
      </section>

      <nav className="na-collection-nav" aria-label={t("rails")}>
        <ul role="list" className="na-collection-nav-list">
          {SHOP_ALL_TABS.map((tab, index) => {
            const current = tab.handle === handle || (tab.id === "all" && handle === "all");
            return (
              <li key={tab.id} className="na-collection-nav-item">
                <Link
                  href={tab.href}
                  className={`na-collection-nav-link ${current ? "is-current" : ""}`}
                  aria-current={current ? "page" : undefined}
                  onClick={() => { closeDrawer(); window.setTimeout(() => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                >
                  <span className="na-collection-nav-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tab.image ?? ""} alt={t(`tabAlt.${tab.id}`)} width={436} height={562} loading={index === 0 ? "eager" : "lazy"} />
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

      <section className="na-collection" aria-label={title}>
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
          <div className="na-product-grid" data-result-count={sorted.length} data-rail={handle}>
            {visible.map((product, index) => (
              <Fragment key={product.slug}>
                <MateProductCard product={product} priority={index < 4} onQuickAdd={setQuickAdd} colorways={shopAllColorways} />
                {page === 1 &&
                  EDITORIALS.filter((editorial) => editorial.after === index).map((editorial) => (
                    <article key={editorial.href} className={`na-sa-editorial ${editorial.fullWidth ? "is-full-width" : ""}`}>
                      <div className="na-sa-editorial-media">
                        <Link href={editorial.href} className="na-sa-editorial-media-link" tabIndex={-1} aria-hidden="true">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="na-sa-editorial-image" src={editorial.panes.primary} alt="" width={editorial.panes.primarySize.width} height={editorial.panes.primarySize.height} loading="lazy" />
                        </Link>
                        <span className="na-sa-editorial-pane">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="na-sa-editorial-image" src={editorial.panes.secondary} alt="" width={editorial.panes.secondarySize.width} height={editorial.panes.secondarySize.height} loading="lazy" />
                        </span>
                      </div>
                      <div className="na-sa-editorial-content">
                        <h2>{t(editorial.heading)}</h2>
                        <p>{t(editorial.body)}</p>
                        <Link href={editorial.href} className="na-dotted">{t(editorial.cta)}</Link>
                      </div>
                    </article>
                  ))}
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
        <Link href="/collections/all">{t("tab.all")}</Link><span aria-hidden="true">•</span><span aria-current="page">{title}</span>
      </nav>

      <ArrivalFilterDrawer
        key={drawer.session}
        open={drawer.open}
        entry={drawer.entry}
        state={state}
        counts={counts}
        resultCount={sorted.length}
        categoryOptions={categoryRows}
        sizeOptions={SHOP_ALL_SIZE_FACETS}
        colorOptions={colorRows}
        onChange={changeFilters}
        onSort={(sort) => update({ ...state, sort, page: 1 })}
        onClose={closeDrawer}
        onApply={() => { closeDrawer(); window.setTimeout(() => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
      />
      <ArrivalQuickAdd key={quickAdd?.slug ?? "closed"} product={quickAdd} onClose={() => setQuickAdd(null)} />
    </>
  );
}
