"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import MateProductCard from "./MateProductCard";
import ArrivalFilterDrawer from "./new-arrivals/ArrivalFilterDrawer";
import ArrivalQuickAdd from "./new-arrivals/ArrivalQuickAdd";
import ArrivalFaq from "./new-arrivals/ArrivalFaq";
import { Link } from "@/navigation";
import { useCollectionUrlState } from "@/lib/useCollectionUrlState";
import { PAGE_SIZE, filterCount, type CollectionFilters, type MateProduct } from "@/lib/mateNewArrivals";
import {
  ACTIVEWEAR_CATEGORIES,
  ACTIVEWEAR_COLOR_GROUPS,
  ACTIVEWEAR_NAV,
  ACTIVEWEAR_SIZES,
  ACTIVEWEAR_VISIBLE_RAILS,
  activewearFacetCounts,
  activewearQuery,
  filterActivewear,
  railForCollectionHandle,
  railProducts,
  readActivewearState,
  sortActivewear,
  type ActivewearState,
} from "@/lib/activewearCatalog";

/** The reference plants its two-column editorial after the sixth card of the first page. */
const EDITORIAL_AFTER = 5;
const VIDEO_SRC = "/media/aw-editorial.mp4";

type Props = {
  /** The collection handle being rendered; a child collection keeps its rail selected. */
  handle?: string;
  /** A single dye's page (`/collections/fig`): the grid shows that dye's own colorways. */
  dye?: string;
  /** Editorial blocks only exist on the Activewear collection itself. */
  editorials?: boolean;
};

export default function MateActivewearGrid({ handle = "activewear", dye, editorials = false }: Props) {
  const t = useTranslations("activewear");
  const shared = useTranslations("newArrivals");
  const { state, navigate } = useCollectionUrlState(readActivewearState, activewearQuery);
  const [drawer, setDrawer] = useState({ open: false, entry: "filters" as "filters" | "sort", session: 0 });
  const [quickAdd, setQuickAdd] = useState<MateProduct | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);

  // A child collection pins its own rail; the Activewear collection follows the URL.
  const railId = railForCollectionHandle(handle) ?? state.rail;
  const rail = useMemo(() => {
    const products = railProducts(railId);
    return dye ? products.filter((product) => product.color.name === dye) : products;
  }, [railId, dye]);
  const filtered = useMemo(() => filterActivewear(rail, state), [rail, state]);
  const sorted = useMemo(() => sortActivewear(filtered, state.sort), [filtered, state.sort]);
  const counts = useMemo(() => activewearFacetCounts(rail, state), [rail, state]);
  // A colour group or category this rail cannot offer is removed rather than offered empty.
  const colorRows = useMemo(
    () => ACTIVEWEAR_COLOR_GROUPS.filter((group) => (counts.colors[group] ?? 0) > 0),
    [counts],
  );
  const categoryRows = useMemo(
    () => ACTIVEWEAR_CATEGORIES.filter((category) => (counts.categories[category] ?? 0) > 0),
    [counts],
  );
  const sizeRows = useMemo(
    () => ACTIVEWEAR_SIZES.filter((size) => (counts.sizes[size] ?? 0) > 0 || state.sizes.includes(size)),
    [counts, state.sizes],
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(state.page, pageCount);
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function update(next: ActivewearState, push = false, scroll = false) {
    navigate(next, push);
    if (scroll) toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function changeFilters(filters: CollectionFilters) {
    update({ ...state, ...filters, page: 1 });
  }
  function openDrawer(entry: "filters" | "sort") {
    setDrawer((previous) => ({ open: true, entry, session: previous.session + 1 }));
  }
  function closeDrawer() {
    setDrawer((previous) => ({ ...previous, open: false }));
  }
  function toggleVideo() {
    const element = video.current;
    if (!element) return;
    if (element.paused) {
      void element.play().then(() => setVideoPlaying(true)).catch(() => setVideoPlaying(false));
    } else {
      element.pause();
      setVideoPlaying(false);
    }
  }

  // Child collections carry the reference's own headline; a dye's page is named after the dye.
  const heading = dye
    ? shared(`color.${dye}`)
    : t.has(`subCollections.${handle}.title`)
      ? t(`subCollections.${handle}.title`)
      : t("title");
  const description = t.has(`subCollections.${handle}.description`)
    ? t(`subCollections.${handle}.description`)
    : t("description");

  return (
    <>
      <section className="na-collection-intro" aria-labelledby="activewear-title">
        <h1 id="activewear-title">{heading}</h1>
        <p>{description}</p>
      </section>

      <nav className="na-collection-nav" aria-label={t("railsLabel")}>
        <ul role="list" className="na-collection-nav-list">
          {ACTIVEWEAR_VISIBLE_RAILS.map((item, index) => {
            const current = item.id === railId;
            return (
              <li key={item.id} className="na-collection-nav-item">
                <Link
                  href={`/collections/${item.handle}`}
                  className={`na-collection-nav-link ${current ? "is-current" : ""}`}
                  aria-current={current ? "page" : undefined}
                  onClick={() => {
                    closeDrawer();
                    window.setTimeout(
                      () => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                      50,
                    );
                  }}
                >
                  <span className="na-collection-nav-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt=""
                      width={218}
                      height={281}
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </span>
                  <span className="na-collection-nav-label">
                    <span className="na-collection-nav-label-text">{t(`rails.${item.id}`)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="na-collection" aria-label={heading}>
        <div ref={toolbar} className="na-collection-toolbar">
          <button
            type="button"
            className="na-dotted na-all-filters"
            aria-expanded={drawer.open}
            aria-haspopup="dialog"
            onClick={() => openDrawer("filters")}
          >
            {shared("allFilters")} {filterCount(state) > 0 ? `(${filterCount(state)})` : "+"}
          </button>
          <button
            type="button"
            className="na-sort-trigger"
            aria-expanded={drawer.open}
            aria-haspopup="dialog"
            onClick={() => openDrawer("sort")}
          >
            <span className="na-sort-label-desktop">{shared("sortBy")}</span>
            <span className="na-sort-label-mobile na-dotted">{shared("sortShort")} +</span>
            <span className="na-sort-value na-dotted">
              {state.sort === "manual" ? shared("featured") : shared(`sort.${state.sort}`)}
            </span>
          </button>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {shared("resultsAnnouncement", { count: sorted.length })}
        </p>
        {visible.length > 0 ? (
          <div className="na-product-grid" data-result-count={sorted.length} data-rail={railId}>
            {visible.map((product, index) => (
              <Fragment key={product.slug}>
                {editorials && page === 1 && index === 0 && (
                  <article className="na-aw-editorial-video">
                    <div className="na-aw-editorial-video-media">
                      {/* No native chrome at all: the reference shows only its own play/pause disc,
                          so `controls` stays off and the browser is told not to offer picture-in-
                          picture, remote playback or a download button either. The clip itself is
                          the hit target, so a tap anywhere on it toggles playback. */}
                      <video
                        ref={video}
                        className="na-aw-editorial-video-el"
                        poster={ACTIVEWEAR_NAV.editorial.videoStill}
                        src={VIDEO_SRC}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        disablePictureInPicture
                        disableRemotePlayback
                        controlsList="nodownload noplaybackrate noremoteplayback"
                        aria-label={t("editorialVideoAlt")}
                        onClick={toggleVideo}
                        onPlay={() => setVideoPlaying(true)}
                        onPause={() => setVideoPlaying(false)}
                      />
                      <button
                        type="button"
                        className={`na-aw-editorial-toggle ${videoPlaying ? "is-playing" : ""}`}
                        aria-label={videoPlaying ? t("pauseVideo") : t("playVideo")}
                        onClick={toggleVideo}
                      >
                        {/* One control only: the disc carries the play mark while the clip is
                            paused and the pause mark while it runs, exactly like the reference. */}
                        {videoPlaying ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M5.5 3v10M10.5 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M5.5 3 12.5 8l-7 5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="na-aw-editorial-content">
                      <h2>{t("editorialVideoHeading")}</h2>
                      <p>{t("editorialVideoText")}</p>
                    </div>
                  </article>
                )}
                <MateProductCard product={product} priority={index < 4} onQuickAdd={setQuickAdd} />
                {editorials && page === 1 && index === EDITORIAL_AFTER && (
                  <article className="na-bs-editorial na-aw-editorial-split">
                    <Link
                      href="/collections/move-by-mate"
                      className="na-bs-editorial-media na-aw-editorial-link"
                      aria-label={t("editorialHeading")}
                    >
                      <span className="na-bs-editorial-pane">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ACTIVEWEAR_NAV.editorial.primary}
                          alt={t("editorialHeading")}
                          width={678}
                          height={862}
                          loading="lazy"
                        />
                      </span>
                      <span className="na-bs-editorial-pane">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ACTIVEWEAR_NAV.editorial.secondary}
                          alt=""
                          aria-hidden="true"
                          width={678}
                          height={862}
                          loading="lazy"
                        />
                      </span>
                    </Link>
                    <div className="na-bs-editorial-content">
                      <h2>{t("editorialHeading")}</h2>
                      <p>{t("editorialText")}</p>
                    </div>
                  </article>
                )}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="na-collection-empty">
            <h2>{shared("noResults")}</h2>
            <p>{shared("noResultsBody")}</p>
            <button type="button" className="na-dotted" onClick={() => changeFilters({ categories: [], sizes: [], colors: [] })}>
              {shared("clearAll")}
            </button>
          </div>
        )}
        {pageCount > 1 && (
          <nav className="na-pagination" aria-label={shared("pagination")}>
            {page > 1 && (
              <button type="button" onClick={() => update({ ...state, page: page - 1 }, true, true)}>
                {shared("previousPage")} «
              </button>
            )}
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                aria-label={shared("pageLabel", { page: number })}
                aria-current={page === number ? "page" : undefined}
                onClick={() => update({ ...state, page: number }, true, true)}
              >
                {number}
              </button>
            ))}
            {page < pageCount && (
              <button type="button" onClick={() => update({ ...state, page: page + 1 }, true, true)}>
                {shared("nextPage")} »
              </button>
            )}
          </nav>
        )}
      </section>

      <ArrivalFaq />
      <nav className="na-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/collections/all">{shared("shopAll")}</Link>
        <span aria-hidden="true">•</span>
        <span aria-current="page">{heading}</span>
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
          window.setTimeout(
            () => toolbar.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
            50,
          );
        }}
      />
      <ArrivalQuickAdd key={quickAdd?.slug ?? "closed"} product={quickAdd} onClose={() => setQuickAdd(null)} />
    </>
  );
}
