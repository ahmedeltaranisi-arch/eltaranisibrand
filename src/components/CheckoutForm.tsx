"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { FREE_SHIPPING_THRESHOLD, useCart } from "@/context/cart";
import { ArrowIcon, CheckIcon } from "./icons";
import { productKey } from "@/lib/catalog";

const EXPRESS_FEE = 18;
const TAX_RATE = 0.08;

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Egypt",
  "United Arab Emirates",
  "Saudi Arabia",
  "Australia",
];

type Errors = Record<string, boolean>;

/** Demo order reference. Lives outside the component so no impure call ever
 *  happens during render (react-hooks/purity). */
function makeOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const tail = Math.floor(Math.random() * 900 + 100);
  return `MTL-${stamp}-${tail}`;
}

export default function CheckoutForm({
  stripeLive,
  locale,
}: {
  stripeLive: boolean;
  locale: string;
}) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const tp = useTranslations("p");
  const tcol = useTranslations("colors");
  const { lines, subtotal, count, clear } = useCart();

  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [method, setMethod] = useState<"card" | "cod">("card");
  const [errors, setErrors] = useState<Errors>({});
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const shipping =
    delivery === "express"
      ? EXPRESS_FEE
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : 8;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const summary = useMemo(
    () => ({ subtotal, shipping, tax, total, count }),
    [subtotal, shipping, tax, total, count],
  );

  if (orderNumber) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-pine/15 text-pine">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h1 className="text-[28px] leading-tight font-light sm:text-[36px]">
          {t("success.title")}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-graphite">
          {t("success.body")}
        </p>
        <p className="mt-6 border border-line px-4 py-3 text-[14px]">
          <span className="text-mist">{t("success.orderNumber")}: </span>
          <span className="font-medium">{orderNumber}</span>
        </p>
        <Link href="/collections/best-sellers" className="btn-solid mt-8">
          {t("success.cta")}
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-[26px] font-light sm:text-[34px]">
          {t("emptyTitle")}
        </h1>
        <p className="mt-3 text-[15px] text-graphite">{t("emptyBody")}</p>
        <Link href="/collections/best-sellers" className="btn-outline mt-8">
          {tc("emptyCta")}
        </Link>
      </div>
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const required = [
      "email",
      "firstName",
      "lastName",
      "address",
      "city",
      "postal",
      "country",
    ];
    const next: Errors = {};
    for (const field of required) {
      if (!String(form.get(field) ?? "").trim()) next[field] = true;
    }
    const email = String(form.get("email") ?? "");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = true;

    if (method === "card") {
      const digits = String(form.get("cardNumber") ?? "").replace(/\D/g, "");
      if (digits.length < 12) next.cardNumber = true;
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(String(form.get("expiry") ?? "").trim()))
        next.expiry = true;
      if (String(form.get("cvc") ?? "").replace(/\D/g, "").length < 3)
        next.cvc = true;
      if (!String(form.get("nameOnCard") ?? "").trim()) next.nameOnCard = true;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (stripeLive) {
      void payWithStripe();
      return;
    }

    clear();
    setOrderNumber(makeOrderNumber());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function payWithStripe() {
    setSubmitting(true);
    setStripeError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          delivery,
          lines: lines.map((l) => ({
            slug: l.productSlug,
            size: l.size,
            color: l.colorName,
            qty: l.qty,
          })),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setStripeError(data.error === "out_of_stock" ? data.error : t("stripeError"));
        setSubmitting(false);
        return;
      }
      clear();
      window.location.assign(data.url);
    } catch {
      setStripeError(t("stripeError"));
      setSubmitting(false);
    }
  }

  const field = (name: string, extra = "") =>
    `h-12 w-full border bg-paper px-3 text-[14px] outline-none focus:border-ink ${
      errors[name] ? "border-terra" : "border-line"
    } ${extra}`;

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16"
    >
      <div className="space-y-12">
        {/* contact */}
        <section>
          <h2 className="mb-5 text-[16px]">{t("contact.title")}</h2>
          <label className="block">
            <span className="mb-2 block text-[12px] text-graphite">
              {t("contact.email")}
            </span>
            <input name="email" type="email" className={field("email")} />
          </label>
          <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px] text-graphite">
            <input
              name="newsletter"
              type="checkbox"
              defaultChecked
              className="h-3.5 w-3.5 accent-ink"
            />
            {t("contact.newsletter")}
          </label>
        </section>

        {/* shipping */}
        <section>
          <h2 className="mb-5 text-[16px]">{t("shipping.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[12px] text-graphite">
                {t("shipping.firstName")}
              </span>
              <input name="firstName" className={field("firstName")} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] text-graphite">
                {t("shipping.lastName")}
              </span>
              <input name="lastName" className={field("lastName")} />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-[12px] text-graphite">
              {t("shipping.address")}
            </span>
            <input name="address" className={field("address")} />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-[12px] text-graphite">
              {t("shipping.apartment")}
            </span>
            <input name="apartment" className={field("apartment")} />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-[12px] text-graphite">
                {t("shipping.city")}
              </span>
              <input name="city" className={field("city")} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] text-graphite">
                {t("shipping.postal")}
              </span>
              <input name="postal" className={field("postal")} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] text-graphite">
                {t("shipping.country")}
              </span>
              <select
                name="country"
                defaultValue=""
                className={field("country")}
              >
                <option value="" disabled />
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-[12px] text-graphite">
              {t("shipping.phone")}
            </span>
            <input name="phone" type="tel" className={field("phone")} />
          </label>
        </section>

        {/* delivery */}
        <section>
          <h2 className="mb-5 text-[16px]">{t("delivery.title")}</h2>
          <div className="divide-y divide-line border border-line">
            {(["standard", "express"] as const).map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 px-4 py-4 transition-colors ${
                  delivery === option ? "bg-bone" : "hover:bg-bone/50"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={delivery === option}
                  onChange={() => setDelivery(option)}
                  className="h-3.5 w-3.5 accent-ink"
                />
                <span className="flex-1">
                  <span className="block text-[14px]">
                    {t(`delivery.${option}.label`)}
                  </span>
                  <span className="block text-[12px] text-mist">
                    {t(`delivery.${option}.note`)}
                  </span>
                </span>
                <span className="text-[14px]">
                  {option === "standard" && summary.shipping === 0
                    ? t("summary.free")
                    : t(`delivery.${option}.price`)}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* payment */}
        <section>
          <h2 className="mb-5 text-[16px]">{t("payment.title")}</h2>
          <div className="mb-5 flex gap-2">
            {(["card", "cod"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={[
                  "flex-1 border px-4 py-3 text-[13px] transition-colors",
                  method === m
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-ink",
                ].join(" ")}
              >
                {t(`payment.${m}`)}
              </button>
            ))}
          </div>

          {method === "card" ? (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[12px] text-graphite">
                  {t("payment.cardNumber")}
                </span>
                <input
                  name="cardNumber"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  className={field("cardNumber")}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-[12px] text-graphite">
                    {t("payment.expiry")}
                  </span>
                  <input
                    name="expiry"
                    placeholder="04/29"
                    className={field("expiry")}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] text-graphite">
                    {t("payment.cvc")}
                  </span>
                  <input
                    name="cvc"
                    inputMode="numeric"
                    className={field("cvc")}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-[12px] text-graphite">
                  {t("payment.nameOnCard")}
                </span>
                <input name="nameOnCard" className={field("nameOnCard")} />
              </label>
            </div>
          ) : (
            <p className="border border-line px-4 py-4 text-[13px] text-graphite">
              {t("payment.demoNote")}
            </p>
          )}
          <p className="mt-4 text-[12px] text-mist">{t("payment.demoNote")}</p>
        </section>
      </div>

      {/* summary */}
      <aside className="h-fit border border-line p-5 lg:sticky lg:top-24">
        <h2 className="mb-5 text-[16px]">{t("summary.title")}</h2>

        <ul className="max-h-72 divide-y divide-line overflow-y-auto">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-3 py-3">
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={line.image}
                  alt=""
                  className="h-20 w-16 bg-bone object-cover"
                />
                <span className="absolute -top-2 -end-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] text-paper">
                  {line.qty}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] leading-snug">
                  {tp(`${productKey(line.titleKey)}.title`)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-mist">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-line"
                    style={{ background: line.colorHex }}
                  />
                  {tcol(line.colorName as never)} · {line.size}
                </p>
              </div>
              <p className="text-[13px]">${line.price * line.qty}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-line pt-5 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-graphite">{t("summary.subtotal")}</dt>
            <dd>${summary.subtotal}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-graphite">{t("summary.shipping")}</dt>
            <dd>{summary.shipping === 0 ? t("summary.free") : `$${summary.shipping}`}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-graphite">{t("summary.tax")}</dt>
            <dd>${summary.tax}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-[16px]">
            <dt>{t("summary.total")}</dt>
            <dd>${summary.total}</dd>
          </div>
        </dl>

        {stripeError && (
          <p className="mt-4 border border-terra/40 bg-terra/5 px-3 py-2.5 text-[12px] leading-relaxed text-terra">
            {stripeError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-solid mt-6 w-full"
        >
          {submitting
            ? t("redirecting")
            : stripeLive
              ? t("payWithStripe")
              : t("place")}
          {!submitting && <ArrowIcon className="h-4 w-4 rtl:rotate-180" />}
        </button>
        <Link
          href="/cart"
          className="mt-3 block text-center text-[12px] text-graphite underline underline-offset-4"
        >
          {t("backToCart")}
        </Link>
      </aside>
    </form>
  );
}
