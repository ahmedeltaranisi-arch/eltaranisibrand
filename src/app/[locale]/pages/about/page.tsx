import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import Reveal from "@/components/Reveal";

const MATERIAL_COUNT = 5;
const RESPONSIBILITY_COUNT = 4;
const STAT_COUNT = 3;
const PARAGRAPH_COUNT = 3;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <>
      {/* hero */}
      <section className="relative h-[62svh] min-h-[420px] overflow-hidden bg-bone">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/shots/legging-jet-1.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-ink/5" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-12 text-paper sm:px-6 lg:px-10">
          <p className="eyebrow mb-4 opacity-85">{t("hero.eyebrow")}</p>
          <h1 className="max-w-2xl text-[32px] leading-[1.1] font-light sm:text-[50px]">
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed opacity-90">
            {t("hero.body")}
          </p>
        </div>
      </section>

      {/* story */}
      <Reveal as="section" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
        <h2 className="text-[26px] leading-tight font-light sm:text-[36px]">
          {t("story.title")}
        </h2>
        <div className="mt-7 space-y-5">
          {Array.from({ length: PARAGRAPH_COUNT }, (_, i) => (
            <p key={i} className="text-[15px] leading-[1.75] text-graphite">
              {t(`story.paragraphs.${i}` as never)}
            </p>
          ))}
        </div>
      </Reveal>

      {/* materials */}
      <section id="materials" className="border-y border-line bg-bone scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <p className="eyebrow mb-3 text-mist">{t("materials.eyebrow")}</p>
          <h2 className="text-[26px] font-light sm:text-[36px]">
            {t("materials.title")}
          </h2>
          <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: MATERIAL_COUNT }, (_, i) => (
              <Reveal as="li" key={i} delay={i * 70}>
                <h3 className="text-[15px]">{t(`materials.items.${i}.title` as never)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-graphite">
                  {t(`materials.items.${i}.body` as never)}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* factories */}
      <section id="factories" className="scroll-mt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-24">
          <div>
            <p className="eyebrow mb-3 text-mist">{t("factories.eyebrow")}</p>
            <h2 className="text-[26px] font-light sm:text-[36px]">
              {t("factories.title")}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-graphite">
              {t("factories.body")}
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
              {Array.from({ length: STAT_COUNT }, (_, i) => (
                <div key={i}>
                  <dt className="text-[28px] font-light">
                    {t(`factories.stats.${i}.value` as never)}
                  </dt>
                  <dd className="mt-1 text-[12px] text-mist">
                    {t(`factories.stats.${i}.label` as never)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/shots/crossover-jet-3.jpg"
            alt=""
            loading="lazy"
            className="aspect-4/3 w-full bg-bone object-cover"
          />
        </div>
      </section>

      {/* responsibility */}
      <section
        id="responsibility"
        className="border-t border-line bg-bone scroll-mt-20"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <p className="eyebrow mb-3 text-mist">{t("responsibility.eyebrow")}</p>
          <h2 className="text-[26px] font-light sm:text-[36px]">
            {t("responsibility.title")}
          </h2>
          <ul className="mt-12 divide-y divide-line border-y border-line">
            {Array.from({ length: RESPONSIBILITY_COUNT }, (_, i) => (
              <li key={i} className="grid gap-2 py-6 sm:grid-cols-[240px_1fr] sm:gap-8">
                <h3 className="text-[15px]">
                  {t(`responsibility.items.${i}.title` as never)}
                </h3>
                <p className="text-[13px] leading-relaxed text-graphite">
                  {t(`responsibility.items.${i}.body` as never)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* cta */}
      <Reveal as="section" className="px-4 py-20 text-center sm:px-6 lg:py-28">
        <h2 className="text-[24px] font-light sm:text-[34px]">
          {t("cta.title")}
        </h2>
        <Link href="/collections/best-sellers" className="btn-solid mt-8">
          {t("cta.label")}
        </Link>
      </Reveal>
    </>
  );
}
