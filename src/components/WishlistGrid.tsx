"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { products } from "@/lib/catalog";
import { useCart } from "@/context/cart";
import { useWishlist } from "@/context/wishlist";
import ProductCard from "./ProductCard";
import { CloseIcon } from "./icons";

export default function WishlistGrid() {
  const t = useTranslations("wishlist");
  const { ids, remove, clear } = useWishlist();
  const { add } = useCart();

  const saved = useMemo(
    () => ids.map((id) => products.find((p) => p.id === id)).filter(Boolean),
    [ids],
  ) as typeof products;

  if (saved.length === 0) {
    return (
      <div className="border border-line px-6 py-24 text-center">
        <p className="text-[16px]">{t("empty")}</p>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-graphite">
          {t("emptyBody")}
        </p>
        <Link href="/collections/best-sellers" className="btn-outline mt-7">
          {t("emptyCta")}
        </Link>
      </div>
    );
  }

  function moveToBag(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const firstAvailable =
      product.sizes.find((s) => (product.stock[s] ?? 0) > 0) ?? product.sizes[0];
    add({
      id: `${product.id}-${product.colorways[0].name}-${firstAvailable}`,
      productSlug: product.colorways[0].slug,
      productId: product.id,
      titleKey: product.titleKey,
      colorName: product.colorways[0].name,
      colorHex: product.colorways[0].hex,
      size: firstAvailable,
      price: product.price,
      image: product.image,
    });
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <p className="text-[13px] text-mist">{t("count", { count: saved.length })}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saved.forEach((p) => moveToBag(p.id))}
            className="btn-outline h-11 px-5"
          >
            {t("moveAll")}
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-11 items-center gap-2 border border-line px-4 text-[12px] tracking-[0.08em] text-graphite uppercase transition-colors hover:border-ink hover:text-ink"
          >
            <CloseIcon className="h-3.5 w-3.5" />
            {t("clear")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {saved.map((p) => (
          <div key={p.id} className="relative">
            <ProductCard product={p} />
            <button
              type="button"
              onClick={() => moveToBag(p.id)}
              className="mt-3 w-full border border-line py-2.5 text-[11px] tracking-[0.1em] uppercase transition-colors hover:border-ink"
            >
              {t("moveToBag")}
            </button>
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="mt-2 w-full text-center text-[11px] text-mist underline underline-offset-4 transition-colors hover:text-ink"
            >
              {t("remove")}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
