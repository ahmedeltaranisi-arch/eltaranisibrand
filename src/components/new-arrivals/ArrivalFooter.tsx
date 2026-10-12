"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import ArrivalNewsletter from "./ArrivalNewsletter";
import ArrivalModal from "./ArrivalModal";
import { CloseIcon } from "../icons";

const MENUS = [
  [["about", "/pages/about"], ["journal", "/blogs/mate-journal"], ["fabrics", "/pages/fabric-library"], ["faq", "/pages/faq"]],
  [["contact", "/pages/contact"], ["returns", "/apps/redo/returns-portal/login?referralId=6967faba41b4662c3e20b1e9"], ["affiliates", "/pages/affiliate"], ["login", "/account"], ["giftCard", "/a/gifthero/balance"]],
  [["instagram", "https://www.instagram.com/mate_the_label/"], ["facebook", "https://www.facebook.com/MATEtheLabel/"], ["pinterest", "https://www.pinterest.com/matethelabel/_created/"]],
] as const;
const external = (href: string) => href.startsWith("http") ? href : `https://matethelabel.com${href}`;

export default function ArrivalFooter() {
  const t = useTranslations("newArrivals");
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const cookieHeading = useId();
  function openCookies() {
    try {
      const saved = JSON.parse(localStorage.getItem("storefront.cookie-preferences") || "{}");
      setAnalytics(saved.analytics === true); setMarketing(saved.marketing === true);
    } catch { /* Optional consent defaults to off. */ }
    setCookiesOpen(true);
  }
  function saveCookies() {
    try { localStorage.setItem("storefront.cookie-preferences", JSON.stringify({ essential: true, analytics, marketing })); } catch { /* Storage can be unavailable. */ }
    setCookiesOpen(false);
  }
  return (
    <>
      <footer className="na-footer">
        <Link href="/" className="na-footer-monogram" aria-label="ELTARANISI BRAND — Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/eltaranisi-logo.png" alt="ELTARANISI BRAND" width={110} height={110} loading="lazy" />
        </Link>
        <div className="na-footer-menus">
          {MENUS.map((column, index) => <nav key={index} aria-label={`Footer ${index + 1}`}>
            {column.map(([key, href]) => <a key={key} href={external(href)}>{t(`footer.${key}`)}</a>)}
          </nav>)}
        </div>
        <div className="na-footer-newsletter"><h2>{t("footer.newsletterTitle")}</h2><p>{t("footer.newsletterBody")}</p><ArrivalNewsletter /></div>
        <div className="na-footer-certifications" aria-label={t("footer.certifications")}>
          <a href="https://www.bcorp.com" aria-label="B Corp">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/new-arrivals/certification-b-corp.svg" alt="Certified B Corporation" width={47} height={78} loading="lazy" />
          </a>
          <a href="https://www.changeclimate.org/" aria-label="The Climate Label">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/new-arrivals/certification-climate-label.svg" alt="The Climate Label" width={135} height={78} loading="lazy" />
          </a>
        </div>
        <p className="na-footer-wordmark" aria-label="ELTARANISI BRAND">ELTARANISI BRAND</p>
        <div className="na-footer-legal">
          <span>© {new Date().getFullYear()} ELTARANISI BRAND</span>
          <a href="https://matethelabel.com/pages/privacy-policy">{t("footer.privacy")}</a>
          <a href="https://matethelabel.com/apps/enzuzo/data">{t("footer.data")}</a>
          <a href="https://matethelabel.com/pages/accessibility">{t("footer.accessibility")}</a>
          <button type="button" onClick={openCookies}>{t("footer.cookies")}</button>
        </div>
      </footer>
      <ArrivalModal open={cookiesOpen} onClose={() => setCookiesOpen(false)} labelledBy={cookieHeading} className="na-cookie-dialog">
        <button type="button" className="na-modal-close" aria-label={t("close")} onClick={() => setCookiesOpen(false)}><CloseIcon className="h-5 w-5" /></button>
        <h2 id={cookieHeading}>{t("cookieTitle")}</h2><p>{t("cookieBody")}</p>
        <label><input type="checkbox" checked disabled />{t("cookieEssential")}</label>
        <label><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />{t("cookieAnalytics")}</label>
        <label><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />{t("cookieMarketing")}</label>
        <button type="button" className="na-button-solid" onClick={saveCookies}>{t("cookieSave")}</button>
      </ArrivalModal>
    </>
  );
}
