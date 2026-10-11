import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";

export default async function AnnouncementBar() {
  const t = await getTranslations("announce");
  const count = 3;

  return (
    <div className="relative z-40 bg-ink text-paper">
      <ul className="flex h-9 items-center justify-center overflow-hidden px-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="contents">
            <Link
              href={t(`items.${i}.href` as never)}
              className="group flex items-center gap-2 text-2xs tracking-[0.12em] uppercase whitespace-nowrap"
            >
              <span>{t(`items.${i}.text` as never)}</span>
              <span className="text-mist transition-colors group-hover:text-sage">
                ·
              </span>
              <span className="underline decoration-1 underline-offset-4 transition-colors group-hover:text-sage">
                {t(`items.${i}.cta` as never)}
              </span>
            </Link>
            {i < count - 1 && (
              <span aria-hidden className="mx-6 hidden text-mist sm:inline">
                |
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
