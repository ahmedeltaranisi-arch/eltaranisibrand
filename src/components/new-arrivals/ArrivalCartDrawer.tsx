"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { FREE_SHIPPING_THRESHOLD, useCart } from "@/context/cart";
import { formatLE, mateNewArrivals, usdToReferenceLE } from "@/lib/mateNewArrivals";
import { useCartLabels } from "@/lib/cartLabels";
import { CloseIcon } from "../icons";
import ArrivalModal from "./ArrivalModal";

export default function ArrivalCartDrawer() {
  const t = useTranslations("newArrivals");
  const labels = useCartLabels();
  const heading = useId();
  const { isOpen, close, count, lines, setQty, remove, subtotal } = useCart();
  const subtotalLE = lines.reduce((total, line) => total + (line.priceLE ?? usdToReferenceLE(line.price)) * line.qty, 0);
  const recommended = mateNewArrivals.filter((product) => !lines.some((line) => line.productSlug === product.slug)).slice(0, 4);
  return (
    <ArrivalModal open={isOpen} onClose={close} labelledBy={heading} className="na-cart-drawer">
      <header className="na-cart-header"><h2 id={heading} className="na-eyebrow">{t("cartTitle", { count })}</h2><button type="button" aria-label={t("close")} onClick={close}><CloseIcon className="h-4 w-4" /></button></header>
      <div className="na-cart-scroll">
        {lines.length === 0 ? <div className="na-cart-empty"><p>{t("cartEmpty")}</p><Link href="/collections/new-arrivals" className="na-dotted" onClick={close}>{t("continueShopping")}</Link></div> : (
          <ul className="na-cart-lines">
            {lines.map((line) => (
              <li key={line.id}>
                <Link href={`/products/${line.productSlug}`} className="na-cart-image" onClick={close}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={line.image} alt={line.title || ""} width={112} height={145} />
                </Link>
                <div className="na-cart-line-details">
                  <Link href={`/products/${line.productSlug}`} onClick={close}>{labels.title(line)}</Link>
                  <p>{labels.color(line).toUpperCase()} / {line.size}</p>
                  <p>{formatLE(line.priceLE ?? usdToReferenceLE(line.price))}</p>
                  <div className="na-cart-line-bottom"><div className="na-quantity">
                    <button type="button" aria-label={t("decreaseQuantity")} onClick={() => setQty(line.id, line.qty - 1)}>−</button><span>{line.qty}</span><button type="button" aria-label={t("increaseQuantity")} onClick={() => setQty(line.id, line.qty + 1)}>+</button>
                  </div><button type="button" className="na-dotted" onClick={() => remove(line.id)}>{t("remove")}</button></div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {lines.length > 0 && <section className="na-cart-recommendations"><h3 className="na-eyebrow">{t("addToRotation")}</h3><div>
          {recommended.map((product) => <Link key={product.slug} href={`/products/${product.slug}`} onClick={close}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.images[0]} alt="" width={150} height={194} loading="lazy" /><h4>{t(`products.${product.style}`)}</h4><p>{formatLE(product.priceLE)}</p>
          </Link>)}
        </div></section>}
      </div>
      {lines.length > 0 && <footer className="na-cart-footer">
        <p>{subtotal >= FREE_SHIPPING_THRESHOLD ? t("earnedShipping") : t("shippingRemaining", { amount: formatLE(usdToReferenceLE(FREE_SHIPPING_THRESHOLD - subtotal)) })}</p>
        <div><span>{t("subtotal")}</span><span>{formatLE(subtotalLE)}</span></div><p className="na-cart-shipping-note">{t("shippingNote")}</p>
        <Link href="/checkout" onClick={close} className="na-button-solid">{t("checkout")}</Link>
      </footer>}
    </ArrivalModal>
  );
}
