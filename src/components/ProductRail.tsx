import { getTranslations } from "next-intl/server";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default async function ProductRail({
  products,
  cols = 4,
}: {
  products: Product[];
  cols?: 2 | 3 | 4;
}) {
  const t = await getTranslations("common");

  if (products.length === 0) {
    return <p className="py-16 text-center text-[14px] text-mist">{t("outOfStock")}</p>;
  }

  const grid =
    cols === 2
      ? "grid-cols-2"
      : cols === 3
        ? "grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid gap-x-4 gap-y-10 sm:gap-x-6 ${grid}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
