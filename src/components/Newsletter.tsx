"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowIcon, CheckIcon } from "./icons";

export default function Newsletter() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const tn = useTranslations("newArrivals");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "pending" | "unavailable" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      return;
    }
    setState("pending");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), source: "footer" }) });
      setState(response.ok ? "done" : "unavailable");
    } catch { setState("unavailable"); }
  }

  if (state === "done") {
    return (
      <p role="status" className="flex items-center gap-2 bg-pine/10 px-4 py-3.5 text-[13px] text-pine">
        <CheckIcon className="h-4 w-4" />
        {tc("subscribeSuccess")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-center border-b border-ink">
        <input
          type="email"
          autoComplete="email"
          maxLength={254}
          disabled={state === "pending"}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setState("idle");
          }}
          placeholder={t("emailPlaceholder")}
          aria-label={t("emailPlaceholder")}
          className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-mist"
        />
        <button
          type="submit"
          disabled={state === "pending"}
          className="px-2 py-2 transition-opacity hover:opacity-60"
          aria-label={t("subscribe")}
        >
          <ArrowIcon className="h-5 w-5 rtl:rotate-180" />
        </button>
      </div>
      {state === "error" && (
        <p role="alert" className="mt-2 text-[12px] text-terra">{tc("emailInvalid")}</p>
      )}
      {state === "unavailable" && <p role="alert" className="mt-2 text-[12px] text-terra">{tn("subscribeUnavailable")}</p>}
    </form>
  );
}
