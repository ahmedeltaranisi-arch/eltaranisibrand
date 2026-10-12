"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";

/** The reference's one-column editorial between the first two product rows. */
export default function ArrivalDiscover() {
  const t = useTranslations("newArrivals");
  return (
    <article className="na-discover">
      <Link href="/collections/best-sellers" className="na-discover-media" aria-label={t("discoverBestSellers")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/new-arrivals/best-sellers-editorial.webp" alt={t("discoverBestSellers")} width={700} height={875} loading="lazy" />
      </Link>
      <div className="na-discover-copy"><h2>{t("discoverBestSellers")}</h2><Link href="/collections/best-sellers" className="na-dotted">{t("shopNow")}</Link></div>
    </article>
  );
}
