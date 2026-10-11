import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { getStripe } from "@/lib/stripe";
import { CheckIcon } from "@/components/icons";

type Status = "paid" | "pending" | "unavailable" | "not_found";

async function resolveSession(sessionId: string | null): Promise<{
  status: Status;
  reference: string | null;
  email: string | null;
}> {
  if (!sessionId) return { status: "unavailable", reference: null, email: null };
  const stripe = getStripe();
  if (!stripe) return { status: "unavailable", reference: sessionId, email: null };

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const status: Status =
      session.payment_status === "paid"
        ? "paid"
        : session.payment_status === "unpaid"
          ? "pending"
          : "pending";
    return {
      status,
      reference: session.id,
      email: session.customer_details?.email ?? null,
    };
  } catch {
    return { status: "not_found", reference: sessionId, email: null };
  }
}

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { session_id } = await searchParams;
  const { status, reference, email } = await resolveSession(session_id ?? null);
  const t = await getTranslations("order");

  const headline =
    status === "paid"
      ? t("paid.title")
      : status === "pending"
        ? t("pending.title")
        : status === "not_found"
          ? t("notFound.title")
          : t("unavailable.title");

  const body =
    status === "paid"
      ? t("paid.body")
      : status === "pending"
        ? t("pending.body")
        : status === "not_found"
          ? t("notFound.body")
          : t("unavailable.body");

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-pine/15 text-pine">
        <CheckIcon className="h-7 w-7" />
      </span>

      <h1 className="text-[28px] leading-tight font-light sm:text-[36px]">
        {headline}
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-graphite">{body}</p>

      {email && (
        <p className="mt-4 text-[13px] text-mist">
          {t("receiptTo")} <span className="text-ink">{email}</span>
        </p>
      )}

      {reference && (
        <p className="mt-6 border border-line px-4 py-3 text-[14px]">
          <span className="text-mist">{t("reference")}: </span>
          <span className="font-medium">{reference}</span>
        </p>
      )}

      <Link href="/collections/best-sellers" className="btn-solid mt-8">
        {t("cta")}
      </Link>
    </div>
  );
}
