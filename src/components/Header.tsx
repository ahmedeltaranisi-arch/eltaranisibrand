"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { collections } from "@/lib/catalog";
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

/** Centre navigation, in order, matching the reference layout. */
const NAV = [
  { key: "new", href: "/collections/new-arrivals" },
  { key: "bestSellers", href: "/collections/best-sellers" },
  { key: "activewear", href: "/collections/activewear" },
  { key: "clothing", href: "/collections/all" },
  { key: "intimates", href: "/collections/intimates" },
  { key: "about", href: "/pages/about" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const tc = useTranslations();
  const { open } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm" 
      >
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-10">
          {/* left: brand */}
          <div className="flex justify-start">
            <Link href="/" aria-label="Home">
              <Wordmark />
            </Link>
          </div>

          {/* centre: primary nav (desktop) */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <Link key={item.key} href={item.href} className="nav-link">
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* mobile: hamburger (sits in the right cell's start) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="justify-self-start -ms-2 p-2 lg:hidden"
            aria-label={t("openMenu")}
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {/* right: utilities */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
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
            <Wordmark />
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
              {NAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between border-b border-line py-3.5 text-[15px]"
                  >
                    {t(item.key)}
                    <ChevronIcon className="h-4 w-4 text-mist rtl:rotate-180" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/pages/contact"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between border-b border-line py-3.5 text-[15px]"
                >
                  {t("contact")}
                  <ChevronIcon className="h-4 w-4 text-mist rtl:rotate-180" />
                </Link>
              </li>
            </ul>

            <p className="eyebrow mt-8 mb-3 text-mist">
              {tc("collections.indexTitle")}
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {collections.map((c) => (
                <li key={c.handle}>
                  <Link
                    href={`/collections/${c.handle}`}
                    onClick={() => setMenuOpen(false)}
                    className="text-[13px] text-graphite"
                  >
                    {tc(c.titleKey)}
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
