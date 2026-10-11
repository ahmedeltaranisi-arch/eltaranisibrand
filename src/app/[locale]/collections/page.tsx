import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { collections, productsByCollection } from "@/lib/catalog";

export default async function CollectionsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("collections");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
      <header className="mb-12 max-w-2xl">
        <h1 className="text-[32px] leading-tight font-light sm:text-[44px]">
          {t("indexTitle")}
        </h1>
        <p className="mt-3 text-[15px] text-graphite">{t("indexBody")}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => {
          const count = productsByCollection(c.handle).length;
          return (
            <li key={c.handle}>
              <Link
                href={`/collections/${c.handle}`}
                className="group block overflow-hidden bg-bone"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.hero}
                  alt=""
                  loading="lazy"
                  className="aspect-4/5 w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
                />
                <div className="px-1 py-4">
                  <h2 className="flex items-baseline justify-between text-[16px]">
                    {t(`${c.handle.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase())}.title` as never)}
                    <span className="text-[12px] text-mist">{count}</span>
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-graphite">
                    {t(
                      `${c.handle.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase())}.description` as never,
                    )}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
