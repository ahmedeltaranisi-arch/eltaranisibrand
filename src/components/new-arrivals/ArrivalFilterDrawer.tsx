"use client";

import { useId, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  CATEGORIES, COLOR_GROUPS, SIZES, SORT_OPTIONS, filterCount,
  type CollectionState, type CollectionFilters, type CollectionSort,
} from "@/lib/mateNewArrivals";
import { CloseIcon } from "../icons";
import ArrivalModal from "./ArrivalModal";

type Counts = {
  categories: Record<string, number>;
  sizes: Record<string, number>;
  colors: Record<string, number>;
};
const GROUP_COLORS: Record<string, string> = {
  Beige: "#d9c5ae", Black: "#111111", Blue: "#536879", Brown: "#72574a", Green: "#435548",
  Grey: "#a8a8a5", Neutral: "#dad3c8", Pink: "#d2aaa8", Purple: "#65485c", Red: "#8b323b", White: "#f9f8f2",
};

function FilterGroup({ label, initialOpen = false, children }: { label: string; initialOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initialOpen);
  const id = useId();
  return (
    <section className={`na-filter-group ${open ? "is-open" : ""}`}>
      <button className="na-filter-summary" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span>{label}</span><span className="na-plus-minus" aria-hidden="true" />
      </button>
      <div id={id} className="na-filter-collapse" inert={!open} aria-hidden={!open}>
        <div className="na-filter-collapse-inner">{children}</div>
      </div>
    </section>
  );
}

export default function ArrivalFilterDrawer({
  open, entry, state, counts, resultCount, onChange, onSort, onClose, onApply,
  sizeOptions, colorOptions,
}: {
  open: boolean;
  entry: "filters" | "sort";
  state: CollectionState;
  counts: Counts;
  resultCount: number;
  onChange: (filters: CollectionFilters) => void;
  onSort: (sort: CollectionSort) => void;
  onClose: () => void;
  onApply: () => void;
  /** Collections with a wider size vocabulary (the reference's eleven rows) pass their own list. */
  sizeOptions?: readonly string[];
  /** Colors a collection cannot offer are removed from the UI entirely. */
  colorOptions?: readonly string[];
}) {
  const sizeRows = sizeOptions ?? SIZES;
  const colorRows = colorOptions ?? COLOR_GROUPS;
  const t = useTranslations("newArrivals");
  const heading = useId();
  const count = filterCount(state);
  function toggle(facet: keyof CollectionFilters, value: string) {
    const selected = state[facet];
    onChange({ ...state, [facet]: selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value] });
  }
  const selectedChips = [
    ...state.categories.map((value) => ({ value, facet: "categories" as const, label: t(`category.${value}`) })),
    ...state.sizes.map((value) => ({ value, facet: "sizes" as const, label: value })),
    ...state.colors.map((value) => ({ value, facet: "colors" as const, label: t(`colorGroup.${value}`) })),
  ];

  return (
    <ArrivalModal open={open} onClose={onClose} labelledBy={heading} className="na-filter-drawer">
      <form className="na-filter-form" onSubmit={(event) => { event.preventDefault(); onApply(); }}>
        <header className="na-filter-header">
          <h2 id={heading}>{t("filters")} ({count})</h2>
          <button type="button" className="na-filter-close" aria-label={t("close")} onClick={onClose}><CloseIcon className="h-[14px] w-[14px]" /></button>
        </header>

        <div className="na-filter-sort">
          <FilterGroup label={t("sortHeading")} initialOpen>
            <fieldset className="na-sort-options">
              <legend className="sr-only">{t("sortHeading")}</legend>
              {SORT_OPTIONS.map((sort) => (
                <label key={sort}>
                  <input type="radio" name="sort_by" value={sort} checked={state.sort === sort} onChange={() => onSort(sort)} />
                  <span>{t(`sort.${sort}`)}</span>
                </label>
              ))}
            </fieldset>
          </FilterGroup>
        </div>

        <div className="na-filter-active">
          <span className="na-filter-active-label">{t("filters")}</span>
          {count > 0 && (
            <div className="na-filter-chips">
              {selectedChips.map((chip) => (
                <button key={`${chip.facet}-${chip.value}`} type="button" aria-label={t("removeFilter", { label: chip.label })} onClick={() => toggle(chip.facet, chip.value)}>
                  {chip.label}<span aria-hidden="true">×</span>
                </button>
              ))}
              <button type="button" className="na-filter-clear" onClick={() => onChange({ categories: [], sizes: [], colors: [] })}>{t("clearAll")}</button>
            </div>
          )}
        </div>

        <FilterGroup label={t("categoryLabel")} initialOpen={entry === "sort"}>
          <div className="na-filter-values">
            {CATEGORIES.map((value) => (
              <label key={value} className="na-filter-value">
                <input type="checkbox" name="category" value={value} checked={state.categories.includes(value)} disabled={counts.categories[value] === 0 && !state.categories.includes(value)} onChange={() => toggle("categories", value)} />
                <span className="na-filter-checkbox" aria-hidden="true" />
                <span>{t(`category.${value}`)} <span className="na-filter-value-count">({counts.categories[value]})</span></span>
              </label>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label={t("sizeLabel")} initialOpen={entry === "sort"}>
          <div className="na-filter-values">
            {sizeRows.map((value) => (
              <label key={value} className="na-filter-value">
                <input type="checkbox" name="size" value={value} checked={state.sizes.includes(value)} disabled={counts.sizes[value] === 0 && !state.sizes.includes(value)} onChange={() => toggle("sizes", value)} />
                <span className="na-filter-checkbox" aria-hidden="true" />
                <span>{value} <span className="na-filter-value-count">({counts.sizes[value]})</span></span>
              </label>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label={t("colorGroupLabel")} initialOpen={entry === "sort"}>
          <div className="na-filter-values na-filter-colors">
            {colorRows.map((value) => (
              <label key={value} className="na-filter-value">
                <input type="checkbox" name="color" value={value} checked={state.colors.includes(value)} disabled={counts.colors[value] === 0 && !state.colors.includes(value)} onChange={() => toggle("colors", value)} />
                <span className="na-filter-color" style={{ background: GROUP_COLORS[value] }} aria-hidden="true" />
                <span>{t(`colorGroup.${value}`)} <span className="na-filter-value-count">({counts.colors[value]})</span></span>
              </label>
            ))}
          </div>
        </FilterGroup>
        <footer className="na-filter-footer">
          <button className="na-filter-apply" type="submit">{t("seeResults", { count: resultCount })}</button>
        </footer>
      </form>
    </ArrivalModal>
  );
}
