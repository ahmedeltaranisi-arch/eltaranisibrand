import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactForm from "@/components/ContactForm";
import FaqList from "@/components/FaqList";

const INFO_COUNT = 3;

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
      <header className="mb-14 max-w-2xl">
        <p className="eyebrow mb-3 text-mist">{t("hero.eyebrow")}</p>
        <h1 className="text-[32px] leading-tight font-light sm:text-[46px]">
          {t("hero.title")}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-graphite">
          {t("hero.body")}
        </p>
      </header>

      <div className="grid gap-14 lg:grid-cols-[1fr_340px] lg:gap-20">
        <ContactForm topics={[0, 1, 2, 3, 4].map((i) => t(`form.topics.${i}` as never))} />

        <aside>
          <h2 className="eyebrow mb-5 text-mist">{t("info.title")}</h2>
          <ul className="divide-y divide-line border-y border-line">
            {Array.from({ length: INFO_COUNT }, (_, i) => (
              <li key={i} className="py-4">
                <p className="text-[12px] text-mist">
                  {t(`info.items.${i}.label` as never)}
                </p>
                <p className="mt-1 text-[14px]">
                  <a
                    href={t(`info.items.${i}.href` as never)}
                    className="hover:underline"
                  >
                    {t(`info.items.${i}.value` as never)}
                  </a>
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <section className="mt-20 max-w-3xl">
        <h2 className="mb-6 text-[22px] font-light sm:text-[28px]">
          {t("faq.title")}
        </h2>
        <FaqList count={5} />
      </section>
    </div>
  );
}
