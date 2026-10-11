import { getTranslations, setRequestLocale } from "next-intl/server";
import { productsByCollection } from "@/lib/catalog";
import CartLines from "@/components/CartLines";
import CartSummary from "@/components/CartSummary";
import ProductRail from "@/components/ProductRail";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("cart");
  const suggested = productsByCollection("best-sellers").slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <h1 className="mb-10 text-[30px] leading-tight font-light sm:text-[40px]">
        {t("title")}
      </h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
        <CartLines />
        <aside className="h-fit border border-line p-6">
          <CartSummary />
        </aside>
      </div>

      <section className="mt-20">
        <h2 className="mb-8 text-[20px] font-light sm:text-[26px]">
          {t("emptyCta")}
        </h2>
        <ProductRail products={suggested} />
      </section>
    </div>
  );
}
