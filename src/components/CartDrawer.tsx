"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { FREE_SHIPPING_THRESHOLD, useCart } from "@/context/cart";
import { ArrowIcon, CloseIcon, MinusIcon, PlusIcon } from "./icons";
import { productKey } from "@/lib/catalog";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const tp = useTranslations("p");
  const tcol = useTranslations("colors");
  const { isOpen, close, lines, subtotal, setQty, remove, count } = useCart();
  const [promo, setPromo] = useState("");

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      className={`fixed inset-0 z-[80] ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <div
        onClick={close}
        className={`absolute inset-0 bg-ink/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className={`absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-paper transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
          isOpen ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="text-[13px] tracking-[0.14em] uppercase">
            {t("title")} {count > 0 && <span className="text-mist">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={close}
            className="p-2 transition-opacity hover:opacity-60"
            aria-label={t("continue")}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* free-shipping meter */}
        <div className="border-b border-line px-5 py-3">
          <p className="mb-2 text-[12px] text-graphite">
            {remaining === 0 ? (
              <span className="text-pine">{t("freeShipping")}</span>
            ) : (
              t("awayFromFree", { amount: remaining })
            )}
          </p>
          <div className="h-1 w-full bg-sand">
            <div
              className="h-full bg-pine transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-[15px]">{t("empty")}</p>
            <Link href="/collections/best-sellers" onClick={close} className="btn-outline">
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-4 py-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={line.image}
                    alt=""
                    className="h-28 w-20 shrink-0 bg-bone object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/products/${line.productSlug}`}
                        onClick={close}
                        className="text-[14px] hover:underline"
                      >
                        {tp(`${productKey(line.titleKey)}.title`)}
                      </Link>
                      <p className="text-[14px]">${line.price * line.qty}</p>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-[12px] text-mist">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-line"
                        style={{ background: line.colorHex }}
                      />
                      {tcol(line.colorName as never)} · {line.size}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => setQty(line.id, line.qty - 1)}
                          className="p-2 transition-colors hover:bg-bone"
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-[13px]">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(line.id, line.qty + 1)}
                          className="p-2 transition-colors hover:bg-bone"
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(line.id)}
                        className="text-[12px] text-mist underline underline-offset-4 transition-colors hover:text-ink"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-5 py-5">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mb-4 flex gap-2"
              >
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder={t("promo")}
                  className="h-11 flex-1 border border-line px-3 text-[13px] outline-none focus:border-ink"
                />
                <button type="submit" className="btn-outline h-11 px-5">
                  {t("apply")}
                </button>
              </form>

              <div className="mb-1 flex items-center justify-between text-[14px]">
                <span>{t("subtotal")}</span>
                <span className="text-[16px]">${subtotal}</span>
              </div>
              <p className="mb-4 text-[12px] text-mist">{t("shippingNote")}</p>

              <Link href="/checkout" onClick={close} className="btn-solid w-full">
                {t("checkout")}
                <ArrowIcon className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <button
                type="button"
                onClick={close}
                className="mt-3 w-full text-center text-[12px] text-graphite underline underline-offset-4"
              >
                {t("continue")}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
