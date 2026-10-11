"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FREE_SHIPPING_THRESHOLD, useCart } from "@/context/cart";
import { ArrowIcon } from "./icons";
import { Link } from "@/navigation";

export default function CartSummary() {
  const t = useTranslations("cart");
  const { subtotal, lines } = useCart();
  const [promo, setPromo] = useState("");

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} className="mb-6 flex gap-2">
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

      <dl className="space-y-2 border-y border-line py-4 text-[14px]">
        <div className="flex justify-between">
          <dt>{t("subtotal")}</dt>
          <dd>${subtotal}</dd>
        </div>
        <div className="flex justify-between text-mist">
          <dt>Shipping</dt>
          <dd>{remaining === 0 ? "—" : "—"}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[12px] text-mist">
        {remaining === 0 ? t("freeShipping") : t("awayFromFree", { amount: remaining })}
      </p>

      {lines.length === 0 ? (
        <span className="btn-solid mt-5 w-full cursor-not-allowed opacity-45">
          {t("checkout")}
        </span>
      ) : (
        <Link href="/checkout" className="btn-solid mt-5 w-full">
          {t("checkout")}
          <ArrowIcon className="h-4 w-4 rtl:rotate-180" />
        </Link>
      )}
      <p className="mt-3 text-center text-[12px] text-mist">
        {t("shippingNote")}
      </p>
    </>
  );
}
