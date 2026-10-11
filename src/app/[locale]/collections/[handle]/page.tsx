import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCollection, productsByCollection } from "@/lib/catalog";
import CollectionFilters from "@/components/CollectionFilters";
import Breadcrumbs from "@/components/Breadcrumbs";

export function generateStaticParams() {
  return [
    "new-arrivals",
    "best-sellers",
    "loungewear",
    "activewear",
    "tops",
    "bottoms",
    "accessories",
    "sale",
    "all",
    "intimates",
  ].map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const c = getCollection(handle);
  if (!c) return {};
  return {
    title: c.titleKey
      .replace("collections.", "")
      .replace(/([A-Z])/g, " $1")
      .trim(),
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const collection = getCollection(handle);
  if (!collection) notFound();

  const t = await getTranslations("collections");
  const nameKey = handle.replace(/-([a-z])/g, (_, ch: string) =>
    ch.toUpperCase(),
  );
  const items = productsByCollection(handle);

  return (
    <>
      {/* hero */}
      <section className="relative h-[46svh] min-h-[340px] overflow-hidden bg-bone">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={collection.hero}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/25" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-10 text-paper sm:px-6 lg:px-10">
          <Breadcrumbs
            items={[
              { labelKey: "indexTitle", href: "/collections" },
              { label: t(`${nameKey}.title` as never) },
            ]}
            tone="light"
          />
          <h1 className="mt-3 text-[30px] leading-tight font-light sm:text-[44px]">
            {t(`${nameKey}.title` as never)}
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed opacity-90">
            {t(`${nameKey}.description` as never)}
          </p>
        </div>
      </section>

      {/* grid + filters */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <CollectionFilters products={items} />
      </div>
    </>
  );
}
