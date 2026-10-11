"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon } from "./icons";

export default function ContactForm({ topics }: { topics: string[] }) {
  const t = useTranslations("contact.form");
  const tc = useTranslations("common");
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next: Record<string, boolean> = {};
    if (!String(form.get("name") ?? "").trim()) next.name = true;
    const email = String(form.get("email") ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = true;
    if (!String(form.get("message") ?? "").trim()) next.message = true;
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(true);
  }

  const field =
    "h-12 w-full border border-line bg-paper px-3 text-[14px] outline-none focus:border-ink";

  return (
    <div>
      <h2 className="mb-6 text-[20px] font-light sm:text-[24px]">{t("title")}</h2>

      {sent ? (
        <p className="flex items-center gap-2 bg-pine/10 px-4 py-4 text-[14px] text-pine">
          <CheckIcon className="h-4 w-4" />
          {t("success")}
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[12px] text-graphite">
                {t("name")}
              </span>
              <input
                name="name"
                className={`${field} ${errors.name ? "border-terra" : ""}`}
              />
              {errors.name && (
                <span className="mt-1 block text-[12px] text-terra">
                  {tc("required")}
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] text-graphite">
                {t("email")}
              </span>
              <input
                name="email"
                type="email"
                className={`${field} ${errors.email ? "border-terra" : ""}`}
              />
              {errors.email && (
                <span className="mt-1 block text-[12px] text-terra">
                  {tc("emailInvalid")}
                </span>
              )}
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-[12px] text-graphite">
              {t("order")}
            </span>
            <input name="order" className={field} />
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] text-graphite">
              {t("topic")}
            </span>
            <select name="topic" defaultValue={topics[0]} className={field}>
              {topics.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] text-graphite">
              {t("message")}
            </span>
            <textarea
              name="message"
              rows={6}
              className={`w-full border border-line bg-paper px-3 py-3 text-[14px] outline-none focus:border-ink ${
                errors.message ? "border-terra" : ""
              }`}
            />
            {errors.message && (
              <span className="mt-1 block text-[12px] text-terra">
                {tc("required")}
              </span>
            )}
          </label>

          <button type="submit" className="btn-solid">
            {t("submit")}
          </button>
        </form>
      )}
    </div>
  );
}
