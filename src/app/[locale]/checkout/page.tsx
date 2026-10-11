import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutForm from "@/components/CheckoutForm";
import { stripeEnabled } from "@/lib/stripe";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <h1 className="mb-10 text-[30px] leading-tight font-light sm:text-[40px]">
        {t("title")}
      </h1>
      <CheckoutForm stripeLive={stripeEnabled()} locale={locale} />
    </div>
  );
}
