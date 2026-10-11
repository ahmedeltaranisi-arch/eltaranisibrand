import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Inter, Cairo } from "next/font/google";

import { routing } from "@/i18n/routing";
import { CartProvider } from "@/context/cart";
import { WishlistProvider } from "@/context/wishlist";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import LocaleLayout from "@/components/LocaleLayout";

import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MATE the Label — Organic Everyday Essentials",
    template: "%s | MATE the Label",
  },
  description:
    "Everyday essentials cut from certified organic and natural fibres. Breathable, responsibly made, built to last.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <NextIntlClientProvider>
          <WishlistProvider>
            <CartProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
              >
                <LocaleLayout k="common.skip" />
              </a>
              <AnnouncementBar />
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
              <CartDrawer />
            </CartProvider>
          </WishlistProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
