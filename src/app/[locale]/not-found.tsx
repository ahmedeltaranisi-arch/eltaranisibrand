import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { productsByCollection } from "@/lib/catalog";
import ProductRail from "@/components/ProductRail";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const popular = productsByCollection("best-sellers").slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
      <p className="text-[64px] leading-none font-light text-mist">404</p>
      <h1 className="mt-4 max-w-xl text-[28px] leading-tight font-light sm:text-[38px]">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-xl text-[15px] text-graphite">{t("body")}</p>
      <Link href="/collections/best-sellers" className="btn-solid mt-8">
        {t("cta")}
      </Link>

      <section className="mt-20">
        <h2 className="mb-8 text-[20px] font-light sm:text-[26px]">
          {t("popular")}
        </h2>
        <ProductRail products={popular} />
      </section>
    </div>
  );
}
