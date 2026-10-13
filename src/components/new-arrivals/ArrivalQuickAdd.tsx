"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useCart } from "@/context/cart";
import { formatLE, type MateProduct } from "@/lib/mateNewArrivals";
import { catalogColorways } from "@/lib/mateCatalog";
import { CloseIcon } from "../icons";
import ArrivalModal from "./ArrivalModal";
import ArrivalSwatches from "./ArrivalSwatches";

export default function ArrivalQuickAdd({ product, onClose }: { product: MateProduct | null; onClose: () => void }) {
  const t = useTranslations("newArrivals");
  const heading = useId();
  const sizeGroup = useId();
  const { add } = useCart();
  const [selected, setSelected] = useState(product);
  const [size, setSize] = useState<string | null>(product?.sizes.length === 1 ? product.sizes[0] : null);
  const [error, setError] = useState(false);
  const active = selected ?? product;
  if (!product || !active) return null;
  const colorways = catalogColorways(product);
  const title = t(`products.${active.style}`);

  function selectColor(colorway: MateProduct) {
    setSelected(colorway);
    if (size && !colorway.availableSizes.includes(size)) setSize(null);
    setError(false);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !size || !active.availableSizes.includes(size)) { setError(true); return; }
    add({
      id: `${active.id}-${size}`, productSlug: active.slug, productId: active.id,
      titleKey: `newArrivals.products.${active.style}`, title,
      colorName: active.color.name, colorLabel: t(`color.${active.color.name}`), colorHex: active.color.hex,
      size, price: active.priceUSD, priceLE: active.priceLE, image: active.images[0],
    }, 1);
    onClose();
  }

  return (
    <ArrivalModal open={!!product} onClose={onClose} labelledBy={heading} className="na-quick-add">
      <button type="button" className="na-modal-close" aria-label={t("close")} onClick={onClose}><CloseIcon className="h-[20px] w-[20px]" /></button>
      <div className="na-quick-content">
        <div className="na-quick-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active.images[0]} alt={`${title} — ${t(`color.${active.color.name}`)}`} width={900} height={1200} />
        </div>
        <div className="na-quick-details">
          <p className="na-eyebrow">{t("quickAdd")}</p>
          <h2 id={heading}>{title}</h2>
          <p className="na-quick-price">{formatLE(active.priceLE)}</p>
        </div>
        <form className="na-quick-form" onSubmit={submit}>
          <p className="na-option-label">{t("colorLabel")} <span>{t(`color.${active.color.name}`).toUpperCase()}</span></p>
          <div className="na-color-groups">
            {(["essential", "limited"] as const).map((edition) => {
              const group = colorways.filter((colorway) => colorway.colorEdition === edition);
              return group.length > 0 && <div key={edition}><p className="na-color-edition">{t(edition)}</p><ArrivalSwatches products={group} activeSlug={active.slug} onSelect={selectColor} /></div>;
            })}
          </div>
          <fieldset className="na-size-option">
            <legend className="na-option-label">{t("sizeLabel")} <span>{size}</span></legend>
            <div className="na-size-choices">
              {active.sizes.map((value) => (
                <label key={value}>
                  <input type="radio" name={sizeGroup} value={value} checked={size === value} disabled={!active.availableSizes.includes(value)} onChange={() => { setSize(value); setError(false); }} />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p className="na-form-error" role="alert">{t("selectSize")}</p>}
          <button type="submit" className="na-button-solid">{t("addWithPrice", { price: formatLE(active.priceLE) })}</button>
        </form>
        <Link href={`/products/${active.slug}`} className="na-dotted na-quick-product-link" onClick={onClose}>{t("viewProduct")}</Link>
      </div>
    </ArrivalModal>
  );
}
