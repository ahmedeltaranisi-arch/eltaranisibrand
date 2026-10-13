"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";

const STORAGE_KEY = "eltaranisi.theme";
const EVENT = "eltaranisi-theme-change";
type Theme = "light" | "dark";

function readTheme(): Theme { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      document.documentElement.dataset.theme = saved === "dark" || (saved !== "light" && media.matches) ? "dark" : "light";
    } catch { /* The current in-memory preference stays usable. */ }
    listener();
  };
  const storage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) sync(); };
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", storage);
  media.addEventListener("change", sync);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener("storage", storage); media.removeEventListener("change", sync); };
}

export default function ThemeToggle() {
  const t = useTranslations("appearance");
  const locale = useLocale();
  useLayoutEffect(() => {
    // Locale navigation replaces the root <html>; restore the saved theme
    // before painting rather than letting that navigation reset appearance.
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      document.documentElement.dataset.theme = saved === "dark" || (saved !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    } catch { /* Bootstrap already supplied a safe default. */ }
    window.dispatchEvent(new Event(EVENT));
  }, [locale]);
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const dark = theme === "dark";
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Private browsing may disable storage. */ }
    window.dispatchEvent(new Event(EVENT));
  }
  return (
    <button type="button" className="site-theme-toggle" data-theme-toggle aria-label={t(dark ? "switchToLight" : "switchToDark")} aria-pressed={dark} title={t(dark ? "switchToLight" : "switchToDark")} onClick={toggle}>
      <span dir="auto">{t(dark ? "day" : "night")}</span>
      {dark ? <svg className="theme-sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg> : <svg className="theme-moon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5 8.5 8.5 0 1 0 20.5 14.6Z" /></svg>}
    </button>
  );
}
