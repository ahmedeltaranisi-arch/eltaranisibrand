"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { products, searchSuggestions } from "@/lib/catalog";
import { CloseIcon, SearchIcon } from "./icons";
import type { Product } from "@/lib/types";
import { productKey } from "@/lib/catalog";

const VISIBLE = 6;

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("search");
  const tp = useTranslations("p");
  const tc = useTranslations();
  const [query, setQuery] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);

  // reset the field when the overlay re-opens (render-time adjust, no effect)
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  const results = useMemo<Product[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const key = productKey(p);
      const title = tp(`${key}.title`).toLowerCase();
      const blurb = tp(`${key}.blurb`).toLowerCase();
      return title.includes(q) || blurb.includes(q) || p.baseSlug.includes(q);
    });
  }, [query, tp]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
      />
      <div className="absolute inset-x-0 top-0 bg-paper shadow-xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center gap-3 border-b border-line py-4">
            <SearchIcon className="h-5 w-5 text-mist" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              className="h-10 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mist"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-2 transition-opacity hover:opacity-60"
              aria-label="Close search"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto py-6">
            {query.trim() === "" ? (
              <>
                <p className="eyebrow mb-4 text-mist">{t("suggestions")}</p>
                <ul className="mb-8 flex flex-wrap gap-2">
                  {searchSuggestions.map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        onClick={onClose}
                        className="inline-block border border-line px-3 py-1.5 text-[13px] transition-colors hover:border-ink"
                      >
                        {tc(s.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>

                <p className="eyebrow mb-4 text-mist">
                  {t("recentlyViewed")}
                </p>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {products.slice(0, VISIBLE).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.colorways[0].slug}`}
                        onClick={onClose}
                        className="group block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt=""
                          className="aspect-3/4 w-full bg-bone object-cover"
                        />
                        <p className="mt-2 text-[13px] group-hover:underline">
                          {tp(`${productKey(p)}.title`)}
                        </p>
                        <p className="text-[12px] text-mist">${p.price}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : results.length === 0 ? (
              <p className="py-10 text-center text-[14px] text-graphite">
                {t("noResults", { query })}
              </p>
            ) : (
              <>
                <p className="eyebrow mb-4 text-mist">
                  {t("products")} · {results.length}
                </p>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {results.slice(0, VISIBLE).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.colorways[0].slug}`}
                        onClick={onClose}
                        className="group block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt=""
                          className="aspect-3/4 w-full bg-bone object-cover"
                        />
                        <p className="mt-2 text-[13px] group-hover:underline">
                          {tp(`${productKey(p)}.title`)}
                        </p>
                        <p className="text-[12px] text-mist">${p.price}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
