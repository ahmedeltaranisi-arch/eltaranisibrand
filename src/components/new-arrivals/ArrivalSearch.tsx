"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { arrivalCatalog, formatLE, mateNewArrivals } from "@/lib/mateNewArrivals";
import ArrivalModal from "./ArrivalModal";
import { CloseIcon, SearchIcon } from "../icons";

export default function ArrivalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("newArrivals");
  const heading = useId();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return mateNewArrivals.slice(0, 6);
    return arrivalCatalog.filter((product) => {
      const haystack = `${product.title} ${product.color.label} ${product.color.group} ${t(`products.${product.style}`)} ${t(`color.${product.color.name}`)}`.toLocaleLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).slice(0, 24);
  }, [query, t]);
  return (
    <ArrivalModal open={open} onClose={onClose} labelledBy={heading} className="na-search-drawer sf-header-dialog">
      <button type="button" className="na-modal-close" aria-label={t("close")} onClick={onClose}><CloseIcon className="h-5 w-5" /></button>
      <h2 id={heading}>{t("searchTitle")}</h2>
      <div className="na-search-field"><SearchIcon className="h-4 w-4" /><input type="search" autoFocus aria-label={t("searchTitle")} placeholder={t("searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <p className="na-eyebrow">{t(query ? "searchResults" : "searchPrompt")}</p>
      <div className="na-search-results" aria-live="polite">
        {results.length === 0 ? <p>{t("searchEmpty")}</p> : results.map((product) => (
          <Link key={product.slug} href={`/products/${product.slug}`} onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.images[0]} alt="" width={88} height={114} loading="lazy" />
            <div><h3>{t(`products.${product.style}`)}</h3><p>{t(`color.${product.color.name}`)}</p><span>{formatLE(product.priceLE)}</span></div>
          </Link>
        ))}
      </div>
    </ArrivalModal>
  );
}
