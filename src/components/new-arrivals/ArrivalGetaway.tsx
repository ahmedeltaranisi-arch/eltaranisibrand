"use client";

import { useTranslations } from "next-intl";

const GETAWAY_URL = "https://matethelabel.com/collections/the-getaway-edit";
export default function ArrivalGetaway() {
  const t = useTranslations("newArrivals");
  return (
    <section className="na-getaway" aria-labelledby="getaway-heading">
      <a href={GETAWAY_URL} className="na-getaway-media" aria-label={`${t("getawayTitle")} — ${t("shopNow")}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/new-arrivals/getaway-street.webp" alt={t("getawayStreetAlt")} loading="lazy" width={960} height={1200} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/new-arrivals/getaway-still.webp" alt={t("getawayStillAlt")} loading="lazy" width={960} height={1200} />
      </a>
      <div className="na-getaway-copy">
        <h2 id="getaway-heading">{t("getawayTitle")}</h2>
        <p>{t("getawayBody")}</p>
        <a href={GETAWAY_URL} className="na-dotted">{t("shopNow")}</a>
      </div>
    </section>
  );
}
