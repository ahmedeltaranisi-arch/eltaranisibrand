"use client";

import { useTranslations } from "next-intl";

const RETURNS_URL = "https://matethelabel.com/apps/redo/returns-portal/login?referralId=6967faba41b4662c3e20b1e9";
export default function ArrivalFaq() {
  const t = useTranslations("newArrivals.faq");
  const items = [
    { question: t("sizeQuestion"), answer: <p>{t.rich("sizeAnswer", { care: (children) => <a href="mailto:care@matethelabel.com">{children}</a> })}</p> },
    { question: t("returnsQuestion"), answer: <p>{t.rich("returnsAnswer", { returns: (children) => <a href={RETURNS_URL}>{children}</a> })}</p> },
    { question: t("shippingQuestion"), answer: <><p>{t("shippingIntro")}</p><ul><li>{t("shippingUnder")}</li><li>{t("shippingOver")}</li></ul><p>{t("shippingDelivery")}</p><p><em>{t("shippingCurrency")}</em></p></> },
    { question: t("fabricsQuestion"), answer: <p>{t("fabricsAnswer")}</p> },
  ];
  return (
    <section className="na-faq" aria-labelledby="collection-faq-heading">
      <h2 id="collection-faq-heading" className="na-eyebrow">{t("title")}</h2>
      <div className="na-faq-list">
        {items.map((item) => (
          <details key={item.question} className="na-faq-item">
            <summary><span>{item.question}</span><span className="na-plus-minus" aria-hidden="true" /></summary>
            <div className="na-faq-answer">{item.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
