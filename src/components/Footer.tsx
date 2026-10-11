import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import Newsletter from "./Newsletter";
import LocaleSwitcher from "./LocaleSwitcher";

const COL_COUNT = [4, 5, 3] as const;

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="bg-bone">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* top: monogram + link columns */}
        <div className="grid gap-12 pt-14 pb-10 lg:grid-cols-[1fr_2fr] lg:gap-8">
          <div>
            <span className="inline-flex h-10 w-10 items-center justify-center border border-ink/70 font-display text-[18px]">
              E
            </span>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COL_COUNT.map((count, col) => (
              <ul key={col} className="space-y-3.5">
                {Array.from({ length: count }, (_, i) => (
                  <li key={i}>
                    <Link
                      href={t(`v2.cols.${col}.links.${i}.href` as never)}
                      className="text-[11px] tracking-[0.08em] text-ink uppercase transition-opacity hover:opacity-60"
                    >
                      {t(`v2.cols.${col}.links.${i}.label` as never)}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* newsletter */}
        <div className="grid gap-8 pb-16 lg:grid-cols-2">
          <div className="hidden lg:block" />
          <div className="max-w-md lg:justify-self-start">
            <h2 className="font-display text-[24px] sm:text-[28px]">
              {t("v2.newsTitle")}
            </h2>
            <p className="mt-3 text-[12px] leading-relaxed text-graphite">
              {t("v2.newsBody")}
            </p>
            <div className="mt-6">
              <Newsletter />
            </div>
          </div>
        </div>

        {/* giant wordmark */}
        <div className="overflow-hidden pb-6">
          <p
            aria-hidden
            className="font-display leading-[0.82] tracking-[0.02em] whitespace-nowrap text-ink select-none [font-size:clamp(40px,9.5vw,132px)]"
          >
            ELTARANISI
          </p>
        </div>

        {/* legal row */}
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-ink/10 py-5">
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {(
              [
                ["legalRow.0", "/pages/contact"],
                ["legalRow.1", "/pages/contact"],
                ["legalRow.2", "/pages/contact"],
                ["legalRow.3", "/pages/contact"],
              ] as const
            ).map(([k, href]) => (
              <Link
                key={k}
                href={href}
                className="text-[10px] tracking-[0.1em] text-ink uppercase transition-opacity hover:opacity-60"
              >
                {t(`v2.${k}` as never)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-[10px] tracking-[0.1em] uppercase">
            <span className="text-graphite">
              © {new Date().getFullYear()} · {t("legal.rights")}
            </span>
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
