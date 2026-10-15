"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import Wordmark from "../Wordmark";
import LocaleSwitcher from "../LocaleSwitcher";
import { useCart } from "@/context/cart";
import { CloseIcon, MenuIcon } from "../icons";
import { ArrivalSearchIcon, ArrivalAccountIcon, ArrivalBagIcon } from "./ArrivalIcons";
import ArrivalModal from "./ArrivalModal";
import ArrivalSearch from "./ArrivalSearch";
import ArrivalMegaMenu from "./ArrivalMegaMenu";

export const NAV = [
  ["new", "/collections/new-arrivals"], ["bestSellers", "/collections/best-sellers"],
  ["activewear", "/collections/activewear"], ["clothing", "/collections/all"],
  ["intimates", "/collections/intimates"], ["about", "/pages/about"],
] as const;

export default function ArrivalHeader() {
  const t = useTranslations("newArrivals");
  const nav = useTranslations("nav");
  const pathname = usePathname();
  const { count, open: openCart } = useCart();
  const [announcement, setAnnouncement] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuHeading = useId();
  useEffect(() => {
    const timer = window.setInterval(() => setAnnouncement((value) => 1 - value), 8000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="na-local-shipping sf-header-scope">{t("announcementShipping")}</div>
      <header className="na-header-wrap sf-header-scope" data-site-header="eltaranisi">
        <div className="na-announcement">
          <Link href={announcement === 0 ? "/collections/all" : "/collections/best-sellers"}>
            <span>{t(announcement === 0 ? "announcementFirst" : "announcementSecond")}</span><span aria-hidden="true">•</span><span>{t("announcementCta")}</span>
          </Link>
        </div>
        <div className="na-header-bar">
          <Link href="/" className="na-header-logo" aria-label="Eltaranisi Brand — Home">
            <Wordmark />
          </Link>
          <nav className="na-header-nav" aria-label="Main navigation">
            <ul>{NAV.map(([key, href]) => {
              const current = pathname === href || pathname.startsWith(`${href}/`);
              // The three menu surfaces keep their collection-specific catalogue and featured tiles.
              if (key === "activewear") return <li key={key}><ArrivalMegaMenu label={nav(key)} href={href} variant="activewear" /></li>;
              if (key === "clothing") return <li key={key}><ArrivalMegaMenu label={nav(key)} href={href} variant="clothing" /></li>;
              if (key === "intimates") return <li key={key}><ArrivalMegaMenu label={nav(key)} href={href} variant="intimates" /></li>;
              return <li key={key}><Link href={href} className={current ? "is-current" : ""} aria-current={current ? "page" : undefined}>{nav(key)}</Link></li>;
            })}</ul>
          </nav>
          <div className="na-header-actions">
            <button type="button" aria-label={t("openSearch")} onClick={() => setSearchOpen(true)}><ArrivalSearchIcon /></button>
            <Link href="/pages/contact" className="na-account" aria-label={t("account")}><ArrivalAccountIcon /></Link>
            <button type="button" className="na-header-bag" aria-label={`${t("bag")} (${count})`} onClick={openCart}>
              <ArrivalBagIcon />{count > 0 && <span className="na-cart-count">{count}</span>}
            </button>
            <LocaleSwitcher variant="header" />
            <button type="button" className="na-menu-toggle" aria-label={t("openMenu")} onClick={() => setMenuOpen(true)}><MenuIcon className="h-[21px] w-[21px]" /></button>
          </div>
        </div>
      </header>
      <ArrivalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ArrivalModal open={menuOpen} onClose={() => setMenuOpen(false)} labelledBy={menuHeading} className="na-mobile-menu sf-header-dialog">
        <h2 id={menuHeading} className="sr-only">{t("openMenu")}</h2>
        <button type="button" className="na-modal-close" aria-label={t("close")} onClick={() => setMenuOpen(false)}><CloseIcon className="h-5 w-5" /></button>
        <Link href="/" className="na-header-logo" aria-label="Eltaranisi Brand — Home" onClick={() => setMenuOpen(false)}><Wordmark /></Link>
        <nav>{NAV.map(([key, href]) => <Link key={key} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuOpen(false)}>{nav(key)}<span aria-hidden="true">+</span></Link>)}</nav>
      </ArrivalModal>
    </>
  );
}
