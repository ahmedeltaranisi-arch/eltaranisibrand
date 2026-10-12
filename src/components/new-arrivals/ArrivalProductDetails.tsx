"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";
import { useCart } from "@/context/cart";
import { formatLE, mateNewArrivals, productColorways, type MateProduct } from "@/lib/mateNewArrivals";
import ArrivalSwatches from "./ArrivalSwatches";
import ArrivalModal from "./ArrivalModal";
import ArrivalQuickAdd from "./ArrivalQuickAdd";
import MateProductCard from "../MateProductCard";
import { CloseIcon } from "../icons";

const MEASUREMENTS = [
  // Reference shop's published size guide, not illustrative measurements.
  ["XS", "32–34", "24–25", "34–35"], ["S", "34–36", "26–27", "36–37"], ["M", "36–38", "28–29", "38–39"],
  ["L", "38–40", "30–31", "40–41"], ["XL", "40–42", "32–34", "42–44"],
];

export default function ArrivalProductDetails({ product }: { product: MateProduct }) {
  const t = useTranslations("newArrivals");
  const router = useRouter();
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [error, setError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<MateProduct | null>(null);
  const heading = useId();
  const sizeGroup = useId();
  const title = t(`products.${product.style}`);
  const colorways = productColorways(product);
  const related = mateNewArrivals.filter((p) => p.style !== product.style).slice(0, 4);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!size || !product.availableSizes.includes(size)) { setError(true); return; }
    add({ id: `${product.id}-${size}`, productSlug: product.slug, productId: product.id,
      titleKey: `newArrivals.products.${product.style}`, title,
      colorName: product.color.name, colorLabel: t(`color.${product.color.name}`), colorHex: product.color.hex,
      size, price: product.priceUSD, priceLE: product.priceLE, image: product.images[0],
    }, 1);
  }

  return (
    <>
      <section className="na-product-page">
        <div className="na-product-gallery" aria-label={title}>
          {product.images.map((image, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={image} src={image} width={900} height={1200} alt={t("imagePosition", { product: title, color: t(`color.${product.color.name}`), position: index + 1, total: product.images.length })} loading={index < 2 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} />
          ))}
        </div>
        <div className="na-product-buybox">
          <div className="na-product-heading"><h1>{title}</h1><p>{formatLE(product.priceLE)}</p></div>
          <form onSubmit={submit}>
            <p className="na-option-label">{t("colorLabel")} <span>{t(`color.${product.color.name}`)}</span></p>
            <div className="na-color-groups">
              {(["essential", "limited"] as const).map((edition) => {
                const group = colorways.filter((p) => p.colorEdition === edition);
                return group.length > 0 && <div key={edition}><p className="na-color-edition">{t(edition)}</p><ArrivalSwatches products={group} activeSlug={product.slug} previewOnHover={false} onSelect={(next) => { if (next.slug !== product.slug) router.replace(`/products/${next.slug}`, { scroll: false }); }} /></div>;
              })}
            </div>
            <fieldset className="na-size-option">
              <legend className="sr-only">{t("sizeLabel")}</legend>
              <div className="na-product-size-heading"><p className="na-option-label">{t("sizeLabel")} <span>{size}</span></p><button type="button" className="na-dotted" onClick={() => setGuideOpen(true)}>{t("sizeGuide")}</button></div>
              <div className="na-size-choices">{product.sizes.map((value) => <label key={value}><input type="radio" name={sizeGroup} value={value} checked={size === value} disabled={!product.availableSizes.includes(value)} onChange={() => { setSize(value); setError(false); }} /><span>{value}</span></label>)}</div>
            </fieldset>
            {error && <p className="na-form-error" role="alert">{t("selectSize")}</p>}
            <button type="submit" className="na-button-solid">{t("addToCart", { price: formatLE(product.priceLE) })}</button>
          </form>
          <div className="na-product-description">
            <details><summary>{t("descriptionHeading")}</summary><p>{product.description}</p></details>
            <details><summary>{t("fitNotes")}</summary><p>{t("fitBody")}</p></details>
            <details><summary>{t("shippingReturns")}</summary><p>{t("faq.shippingIntro")}</p><p>{t("faq.shippingDelivery")}</p></details>
          </div>
        </div>
      </section>
      <section className="na-related"><h2>{t("relatedProducts")}</h2><div className="na-product-grid">{related.map((p) => <MateProductCard key={p.slug} product={p} onQuickAdd={setQuickAdd} />)}</div></section>
      <ArrivalModal open={guideOpen} onClose={() => setGuideOpen(false)} labelledBy={heading} className="na-size-guide-dialog">
        <button type="button" className="na-modal-close" aria-label={t("close")} onClick={() => setGuideOpen(false)}><CloseIcon className="h-5 w-5" /></button>
        <h2 id={heading}>{t("sizeGuideTitle")}</h2><p>{t("sizeGuideBody")}</p>
        <table><thead><tr><th>{t("sizeLabel")}</th><th>{t("bust")}</th><th>{t("waist")}</th><th>{t("hips")}</th></tr></thead><tbody>{MEASUREMENTS.map((row) => <tr key={row[0]}>{row.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody></table>
      </ArrivalModal>
      <ArrivalQuickAdd key={quickAdd?.slug ?? "closed"} product={quickAdd} onClose={() => setQuickAdd(null)} />
    </>
  );
}
