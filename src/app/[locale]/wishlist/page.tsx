import { getTranslations, setRequestLocale } from "next-intl/server";
import WishlistGrid from "@/components/WishlistGrid";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("wishlist");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-[30px] leading-tight font-light sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-graphite">
          {t("body")}
        </p>
      </header>

      <WishlistGrid />
    </div>
  );
}
