import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";
import { productsByCollection } from "@/lib/catalog";
import HeroSlider, { type HeroSlide } from "@/components/HeroSlider";
import Marquee from "@/components/Marquee";
import ProductTabs from "@/components/ProductTabs";
import ReviewCarousel from "@/components/ReviewCarousel";
import Reveal from "@/components/Reveal";
import { ArrowIcon, LeafIcon } from "@/components/icons";

const VALUE_COUNT = 4;
const REVIEW_COUNT = 3;
const GALLERY = [
  "/img/hero-model.jpg",
  "/img/p-midi-legging.jpg",
  "/img/editorial-fabric.jpg",
  "/img/p-zip-hoodie.jpg",
  "/img/hero-still-life.jpg",
  "/img/p-scoop-bra.jpg",
  "/img/p-polo.jpg",
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tt = await getTranslations("home.tabs");

  const slides: HeroSlide[] = [0, 1, 2].map((i) => ({
    eyebrow: t(`hero.slides.${i}.eyebrow` as never),
    title: t(`hero.slides.${i}.title` as never),
    cta: t(`hero.slides.${i}.cta` as never),
    href: t(`hero.slides.${i}.href` as never),
    image: t(`hero.slides.${i}.image` as never),
  }));

  const groups = [
    {
      key: "new-arrivals",
      label: tt("newArrivals"),
      products: productsByCollection("new-arrivals"),
    },
    {
      key: "best-sellers",
      label: tt("bestSellers"),
      products: productsByCollection("best-sellers"),
    },
    {
      key: "loungewear",
      label: tt("loungewear"),
      products: productsByCollection("loungewear"),
    },
  ];

  return (
    <>
      <HeroSlider slides={slides} />
      <Marquee />

      {/* statement */}
      <Reveal as="section" className="px-4 py-20 text-center sm:px-6 lg:py-28">
        <h2 className="mx-auto max-w-4xl text-[28px] leading-[1.18] font-light sm:text-[44px] lg:text-[54px]">
          {t("statement.title")}
        </h2>
        <Link href={t("statement.href")} className="btn-outline mt-9">
          {t("statement.cta")}
        </Link>
      </Reveal>

      {/* editorial two-up */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-4 sm:px-6 lg:grid-cols-2 lg:px-10">
        {(["one", "two"] as const).map((k) => (
          <Reveal
            key={k}
            as="article"
            className="group relative overflow-hidden bg-bone"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={k === "one" ? "/img/editorial-fabric.jpg" : "/img/p-high-neck-tank.jpg"}
              alt=""
              loading="lazy"
              className="aspect-4/3 w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-ink/10 to-transparent p-6 text-paper sm:p-9">
              <p className="eyebrow mb-3 flex items-center gap-2 opacity-85">
                <LeafIcon className="h-4 w-4" />
                {t(`editorial.${k}.eyebrow` as never)}
              </p>
              <h3 className="max-w-md text-[22px] leading-tight font-light sm:text-[28px]">
                {t(`editorial.${k}.title` as never)}
              </h3>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed opacity-90">
                {t(`editorial.${k}.body` as never)}
              </p>
              <Link
                href={t(`editorial.${k}.href` as never)}
                className="mt-5 inline-flex items-center gap-2 text-[12px] tracking-[0.12em] uppercase underline-offset-4 hover:underline"
              >
                {t(`editorial.${k}.cta` as never)}
                <ArrowIcon className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </Reveal>
        ))}
      </section>

      {/* tabbed products */}
      <Reveal as="section" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <ProductTabs groups={groups} />
      </Reveal>

      {/* values */}
      <section className="border-y border-line bg-bone">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <h2 className="mb-12 text-center text-[24px] font-light sm:text-[32px]">
            {t("values.title")}
          </h2>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: VALUE_COUNT }, (_, i) => (
              <Reveal as="li" key={i} delay={i * 90}>
                <LeafIcon className="mb-4 h-6 w-6 text-pine" />
                <h3 className="text-[15px]">{t(`values.items.${i}.title` as never)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-graphite">
                  {t(`values.items.${i}.body` as never)}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* reviews */}
      <Reveal as="section" className="px-4 py-20 sm:px-6 lg:py-28">
        <h2 className="eyebrow mb-10 text-center text-mist">
          {t("reviews.title")}
        </h2>
        <ReviewCarousel count={REVIEW_COUNT} />
      </Reveal>

      {/* community gallery */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-[22px] font-light sm:text-[28px]">
              {t("instagram.title")}
            </h2>
            <p className="mt-2 text-[13px] text-graphite">
              {t("instagram.body")}{" "}
              <span className="text-ink">{t("instagram.handle")}</span>
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {GALLERY.map((src, i) => (
              <li key={src + i} className="overflow-hidden bg-bone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
