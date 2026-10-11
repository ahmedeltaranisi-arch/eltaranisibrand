"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { useCart } from "@/context/cart";
import { MinusIcon, PlusIcon } from "./icons";
import { productKey } from "@/lib/catalog";

export default function CartLines() {
  const t = useTranslations("cart");
  const tp = useTranslations("p");
  const tcol = useTranslations("colors");
  const { lines, setQty, remove } = useCart();

  if (lines.length === 0) {
    return (
      <div className="border border-line px-6 py-20 text-center">
        <p className="text-[15px]">{t("empty")}</p>
        <Link href="/collections/best-sellers" className="btn-outline mt-6">
          {t("emptyCta")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {lines.map((line) => (
        <li key={line.id} className="flex gap-5 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={line.image}
            alt=""
            className="h-36 w-24 shrink-0 bg-bone object-cover sm:h-44 sm:w-32"
          />
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/products/${line.productSlug}`}
                  className="text-[15px] hover:underline"
                >
                  {tp(`${productKey(line.titleKey)}.title`)}
                </Link>
                <p className="mt-1.5 flex items-center gap-2 text-[12px] text-mist">
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-line"
                    style={{ background: line.colorHex }}
                  />
                  {tcol(line.colorName as never)} · {t("subtotal")}{" "}
                  {line.size}
                </p>
              </div>
              <p className="text-[15px]">${line.price * line.qty}</p>
            </div>

            <div className="mt-auto flex items-center justify-between pt-4">
              <div className="flex items-center border border-line">
                <button
                  type="button"
                  onClick={() => setQty(line.id, line.qty - 1)}
                  className="p-2.5 transition-colors hover:bg-bone"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <span className="w-9 text-center text-[13px]">{line.qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(line.id, line.qty + 1)}
                  className="p-2.5 transition-colors hover:bg-bone"
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
  );
}
