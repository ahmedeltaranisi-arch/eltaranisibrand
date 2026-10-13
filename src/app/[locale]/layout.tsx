import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Inter, Cairo, Fraunces } from "next/font/google";

import { routing } from "@/i18n/routing";
import { CartProvider } from "@/context/cart";
import { WishlistProvider } from "@/context/wishlist";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { themeBootstrap } from "@/lib/themeBootstrap";
import Footer from "@/components/Footer";
import LocaleLayout from "@/components/LocaleLayout";
import ArrivalShell from "@/components/new-arrivals/ArrivalShell";

import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://eltaranisibrand.vercel.app"),
  title: { default: "Eltaranisi — Organic Everyday Essentials", template: "%s | Eltaranisi" },
  description: "Everyday essentials cut from certified organic and natural fibres. Breathable, responsibly made, built to last.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export default async function LocaleRootLayout({ children, params }: {
  children: React.ReactNode; params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html suppressHydrationWarning lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${inter.variable} ${cairo.variable} ${fraunces.variable} h-full antialiased`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <NextIntlClientProvider>
          <WishlistProvider>
            <CartProvider>
              <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"><LocaleLayout k="common.skip" /></a>
              <Header />
              <ArrivalShell footer={<Footer />}>
                {children}
              </ArrivalShell>
              <ThemeToggle />
            </CartProvider>
          </WishlistProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
