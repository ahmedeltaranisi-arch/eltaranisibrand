import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import Newsletter from "./Newsletter";
import LocaleSwitcher from "./LocaleSwitcher";
import Wordmark from "./Wordmark";

const COLUMN_COUNT = { shop: 8, help: 6, about: 5 } as const;

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-line bg-bone">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid gap-10 border-b border-line py-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16 lg:py-16">
          <div className="max-w-sm">
            <h2 className="text-[22px] leading-tight">{t("newsletterTitle")}</h2>
            <p className="mt-3 text-[14px] text-graphite">{t("newsletterBody")}</p>
            <div className="mt-6">
              <Newsletter />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {(["shop", "help", "about"] as const).map((col) => (
              <div key={col}>
                <p className="eyebrow mb-4 text-mist">{t(`columns.${col}.title`)}</p>
                <ul className="space-y-2.5">
                  {Array.from({ length: COLUMN_COUNT[col] }, (_, i) => (
                    <li key={i}>
                      <Link
                        href={t(`columns.${col}.links.${i}.href` as never)}
                        className="text-[13px] text-graphite transition-colors hover:text-ink"
                      >
                        {t(`columns.${col}.links.${i}.label` as never)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Wordmark className="h-[16px] w-auto text-ink" />
            <p className="text-[12px] text-mist">
              © {new Date().getFullYear()} · {t("legal.rights")}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-graphite">
            <Link href="/pages/contact" className="hover:text-ink">
              {t("legal.privacy")}
            </Link>
            <Link href="/pages/contact" className="hover:text-ink">
              {t("legal.terms")}
            </Link>
            <Link href="/pages/contact" className="hover:text-ink">
              {t("legal.accessibility")}
            </Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </div>
    </footer>
  );
}
