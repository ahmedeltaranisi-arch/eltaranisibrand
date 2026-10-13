import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCollection, productsByCollection } from "@/lib/catalog";
import CollectionFilters from "@/components/CollectionFilters";
import Breadcrumbs from "@/components/Breadcrumbs";
import MateCollectionGrid from "@/components/MateCollectionGrid";
import MateBestSellersGrid from "@/components/MateBestSellersGrid";
import MateActivewearGrid from "@/components/MateActivewearGrid";

/** The Activewear collection plus the child collections and dyes its rails and mega menu link to. */
const ACTIVEWEAR_CHILD_HANDLES = [
  "leggings-and-shorts",
  "sports-bras",
  "activewear-tops",
  "biker-shorts",
  "dresses-unitards",
] as const;

/** The reference links five dye collections from the mega menu; each shows that dye's own colorways. */
const ACTIVEWEAR_DYE_HANDLES: Record<string, string> = {
  fig: "fig",
  nori: "nori",
  mulberry: "mulberry",
  "mocha-move": "mocha",
  pebble: "pebble",
};

/** Tiles that mean "the whole Activewear collection" on the reference store. */
const ACTIVEWEAR_ALIAS_HANDLES = ["move-by-mate", "organic-studio-uniform"] as const;

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
    ...ACTIVEWEAR_CHILD_HANDLES,
    ...Object.keys(ACTIVEWEAR_DYE_HANDLES),
    ...ACTIVEWEAR_ALIAS_HANDLES,
  ].map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  const c = getCollection(handle);
  if (!c) return {};
  if (handle === "new-arrivals") {
    const t = await getTranslations({ locale, namespace: "newArrivals" });
    return { title: t("title"), description: t("description") };
  }
  if (handle === "best-sellers") {
    const t = await getTranslations({ locale, namespace: "bestSellers" });
    return { title: t("title"), description: t("description") };
  }
  if (handle === "activewear" || ACTIVEWEAR_ALIAS_HANDLES.includes(handle as "move-by-mate")) {
    const t = await getTranslations({ locale, namespace: "activewear" });
    return { title: t("title"), description: t("description") };
  }
  if (ACTIVEWEAR_CHILD_HANDLES.includes(handle as "sports-bras")) {
    const t = await getTranslations({ locale, namespace: "activewear" });
    return {
      title: t(`subCollections.${handle}.title`),
      description: t(`subCollections.${handle}.description`),
    };
  }
  if (handle in ACTIVEWEAR_DYE_HANDLES) {
    const t = await getTranslations({ locale, namespace: "newArrivals" });
    const a = await getTranslations({ locale, namespace: "activewear" });
    return { title: t(`color.${ACTIVEWEAR_DYE_HANDLES[handle]}`), description: a("description") };
  }
  const t = await getTranslations({ locale });
  return { title: t(c.titleKey), description: t(c.descriptionKey) };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  if (handle === "activewear") {
    await connection();
    return <MateActivewearGrid editorials />;
  }
  if (ACTIVEWEAR_CHILD_HANDLES.includes(handle as "sports-bras")) {
    await connection();
    return <MateActivewearGrid handle={handle} />;
  }
  if (handle in ACTIVEWEAR_DYE_HANDLES) {
    await connection();
    return <MateActivewearGrid handle={handle} dye={ACTIVEWEAR_DYE_HANDLES[handle]} />;
  }
  if (ACTIVEWEAR_ALIAS_HANDLES.includes(handle as "move-by-mate")) {
    await connection();
    return <MateActivewearGrid editorials />;
  }

  const collection = getCollection(handle);
  if (!collection) notFound();

  const t = await getTranslations("collections");
  const nameKey = handle.replace(/-([a-z])/g, (_, ch: string) =>
    ch.toUpperCase(),
  );
  const items = productsByCollection(handle);

  if (handle === "new-arrivals" || handle === "best-sellers") {
    // Request-render the collection, including the actual URL's filters/sort,
    // rather than returning a blank client-only collection on the first load.
    await connection();
    return handle === "best-sellers" ? <MateBestSellersGrid /> : <MateCollectionGrid />;
  }

  return (
    <>
      {/* hero - keep for other collections */}
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

      {/* grid + filters - now using MATE style cards */}
      <div className="bg-[#fdfbf5]">
        <div className="mx-auto max-w-[1600px] px-3 py-10 sm:px-6 lg:px-8 lg:py-14">
          <CollectionFilters products={items} />
        </div>
      </div>
    </>
  );
}
