"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { collections, shopMenu } from "@/lib/catalog";
import {
  BagIcon,
  ChevronIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "./icons";
import CartCount from "./CartCount";
import WishlistCount from "./WishlistCount";
import SearchOverlay from "./SearchOverlay";
import Wordmark from "./Wordmark";
import { useCart } from "@/context/cart";

export default function Header() {
  const t = useTranslations("nav");
  const tr = useTranslations();
  const { open } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 160);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  return (
    <>
      <header
        className={[
          "sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm transition-transform duration-500",
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          {/* left: desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            <button
              type="button"
              onMouseEnter={() => setMenuOpen(true)}
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className="nav-link"
            >
              {t("shop")}
            </button>
            <Link
              href="/collections/loungewear"
              className="nav-link"
              onMouseEnter={() => setMenuOpen(false)}
            >
              {t("loungewear")}
            </Link>
            <Link
              href="/collections/activewear"
              className="nav-link"
              onMouseEnter={() => setMenuOpen(false)}
            >
              {t("activewear")}
            </Link>
            <Link
              href="/collections/best-sellers"
              className="nav-link"
              onMouseEnter={() => setMenuOpen(false)}
            >
              {t("bundles")}
            </Link>
          </nav>

          {/* mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-ms-2 p-2 lg:hidden"
            aria-label={t("openMenu")}
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {/* centre: wordmark */}
          <Link
            href="/"
            onMouseEnter={() => setMenuOpen(false)}
            className="absolute inset-x-0 mx-auto flex w-fit justify-center text-ink"
            aria-label="Home"
          >
            <Wordmark className="h-[18px] w-auto sm:h-[22px]" />
          </Link>

          {/* right: utilities */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 transition-opacity hover:opacity-60"
              aria-label={t("search")}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            <Link
              href="/pages/contact"
              className="hidden p-2 transition-opacity hover:opacity-60 sm:block"
              aria-label={t("account")}
            >
              <UserIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/wishlist"
              className="relative hidden p-2 transition-opacity hover:opacity-60 sm:block"
              aria-label={t("wishlist")}
            >
              <HeartIcon className="h-5 w-5" />
              <WishlistCount />
            </Link>
            <button
              type="button"
              onClick={open}
              className="relative p-2 transition-opacity hover:opacity-60"
              aria-label={t("cart")}
            >
              <BagIcon className="h-5 w-5" />
              <CartCount />
            </button>
          </div>
        </div>

        {/* desktop mega menu */}
        <div
          onMouseLeave={() => setMenuOpen(false)}
          className={[
            "absolute inset-x-0 top-full hidden border-b border-line bg-paper lg:block",
            menuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          ].join(" ")}
          style={{ transition: "opacity .25s ease" }}
        >
          {shopMenu.map((group) => (
            <div
              key={group.key}
              className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-10 py-10"
            >
              <div className="col-span-8 grid grid-cols-3 gap-8">
                {group.columns.map((col) => (
                  <div key={col.titleKey}>
                    <p className="eyebrow mb-4 text-mist">{tr(col.titleKey)}</p>
                    <ul className="space-y-2.5">
                      {col.links.map((link) => (
                        <li key={link.labelKey}>
                          <Link
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            className="text-[13px] text-graphite transition-colors hover:text-ink"
                          >
                            {tr(link.labelKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="col-span-4 grid grid-cols-2 gap-4">
                {group.featured.map((card) => (
                  <Link
                    key={card.labelKey}
                    href={card.href}
                    onClick={() => setMenuOpen(false)}
                    className="group relative overflow-hidden bg-bone"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt=""
                      className="aspect-4/5 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 text-xs tracking-[0.1em] text-paper uppercase">
                      {tr(card.labelKey)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-[60] lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={[
            "absolute inset-0 bg-ink/30 transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div
          className={[
            "absolute inset-y-0 start-0 flex w-[86%] max-w-sm flex-col bg-paper transition-transform duration-400 ease-[cubic-bezier(.16,1,.3,1)]",
            menuOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <Wordmark className="h-[18px] w-auto" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="p-2"
              aria-label={t("closeMenu")}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="space-y-1">
              {[
                { label: t("shop"), href: "/collections/best-sellers" },
                { label: t("loungewear"), href: "/collections/loungewear" },
                { label: t("activewear"), href: "/collections/activewear" },
                { label: t("bundles"), href: "/collections/best-sellers" },
                { label: t("about"), href: "/pages/about" },
                { label: t("contact"), href: "/pages/contact" },
              ].map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between border-b border-line py-3.5 text-[15px]"
                  >
                    {item.label}
                    <ChevronIcon className="h-4 w-4 text-mist rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>

            <p className="eyebrow mt-8 mb-3 text-mist">
              {tr("collections.indexTitle")}
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {collections.map((c) => (
                <li key={c.handle}>
                  <Link
                    href={`/collections/${c.handle}`}
                    onClick={() => setMenuOpen(false)}
                    className="text-[13px] text-graphite"
                  >
                    {tr(c.titleKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
