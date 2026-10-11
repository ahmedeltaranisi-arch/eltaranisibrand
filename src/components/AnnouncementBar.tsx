import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/navigation";

/**
 * Two stacked bars, mirroring the reference structure:
 *  1. light localised shipping notice
 *  2. dark promo strip
 * All copy is original to this build.
 */
export default async function AnnouncementBar() {
  const locale = await getLocale();
  const t = await getTranslations("announce");

  const country = locale === "ar" ? "مصر" : "Egypt";

  return (
    <div className="relative z-40">
      {/* light localised bar */}
      <div className="bg-paper text-ink">
        <p className="flex h-9 items-center justify-center px-4 text-[12px] tracking-[0.02em]">
          {t("shippingLine", { country })}
        </p>
      </div>

      {/* dark promo bar */}
      <div className="bg-ink text-paper">
        <ul className="flex h-9 items-center justify-center gap-0 overflow-hidden px-4">
          {[0, 1].map((i) => (
            <li key={i} className="flex items-center">
              <Link
                href={t(`items.${i}.href` as never)}
                className="group flex items-center gap-2 text-2xs tracking-[0.12em] uppercase whitespace-nowrap"
              >
                <span>{t(`items.${i}.text` as never)}</span>
                <span className="text-mist transition-colors group-hover:text-sage">·</span>
                <span className="underline decoration-1 underline-offset-4 transition-colors group-hover:text-sage">
                  {t(`items.${i}.cta` as never)}
                </span>
              </Link>
              {i === 0 && <span aria-hidden className="mx-6 text-mist">|</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
