"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

/** A real integration boundary: never report a subscription that wasn't saved. */
export default function ArrivalNewsletter({ source = "footer" }: { source?: "footer" | "offer" }) {
  const t = useTranslations("newArrivals");
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "pending" | "success" | "unavailable">("idle");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setStatus("invalid"); return; }
    setStatus("pending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), source }),
      });
      setStatus(response.ok ? "success" : "unavailable");
    } catch { setStatus("unavailable"); }
  }
  return (
    <form className="na-newsletter" onSubmit={submit} noValidate>
      {status === "success" ? <p role="status">{t("subscribeSuccess")}</p> : (
        <div className="na-newsletter-fields">
          <label htmlFor={id} className="sr-only">{t("email")}</label>
          <input id={id} type="email" name="email" autoComplete="email" autoCapitalize="off" spellCheck={false} value={email} placeholder={t("email")} aria-invalid={status === "invalid"} aria-describedby={status === "invalid" || status === "unavailable" ? `${id}-status` : undefined} onChange={(event) => { setEmail(event.target.value); setStatus("idle"); }} />
          <button type="submit" disabled={status === "pending"}>{t(status === "pending" ? "subscribing" : "subscribe")}</button>
        </div>
      )}
      {(status === "invalid" || status === "unavailable") && <p id={`${id}-status`} className="na-form-error" role="alert">{t(status === "invalid" ? "emailInvalid" : "subscribeUnavailable")}</p>}
    </form>
  );
}
