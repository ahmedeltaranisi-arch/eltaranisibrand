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

  const cats = [
    { img: "/img/p-sports-bra.jpg", count: productsByCollection("activewear").length },
    { img: "/img/p-high-neck-tank.jpg", count: productsByCollection("all").length },
    { img: "/img/p-zip-hoodie.jpg", count: productsByCollection("loungewear").length },
  ];

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

      {/* statement: copy left, portrait right (matches reference) */}
      <section className="grid lg:grid-cols-2">
        <div className="flex flex-col items-start justify-start px-4 pt-16 pb-12 text-start sm:px-6 lg:px-10 lg:pt-24 lg:pb-16">
          <h2 className="max-w-md text-[30px] leading-[1.25] sm:text-[40px]">
            {t("statement.title")
              .split("*")
              .map((part, i) =>
                i % 2 ? (
                  <em key={i} className="italic">
                    {part}
                  </em>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
          </h2>
          <Link
            href={t("statement.href")}
            className="mt-9 inline-block w-fit text-[13px] underline decoration-1 underline-offset-[6px] transition-opacity hover:opacity-70"
          >
            {t("statement.cta")}
          </Link>
        </div>
        <div className="relative min-h-[440px] lg:min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/hero-model.jpg"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
      </section>

      {/* tabbed products */}
      <Reveal as="section" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <ProductTabs groups={groups} />
      </Reveal>

      {/* meet the new colour — split banner */}
      <section className="relative grid lg:grid-cols-2">
        <div className="relative min-h-[420px] lg:min-h-[560px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/fig-closeup.jpg"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
        <div className="relative min-h-[420px] lg:min-h-[560px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/fig-full.jpg"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-paper">
          <p className="eyebrow mb-3 drop-shadow-sm">{t("fig.eyebrow")}</p>
          <h2 className="font-display text-[40px] drop-shadow-sm sm:text-[56px]">
            {t("fig.title")}
          </h2>
          <Link
            href={t("fig.href")}
            className="pointer-events-auto mt-6 text-[12px] tracking-[0.12em] uppercase underline underline-offset-4 hover:opacity-80"
          >
            {t("fig.cta")}
          </Link>
        </div>
      </section>

      {/* materials: portrait left, story + stretch video right */}
      <section className="grid bg-bone lg:grid-cols-2">
        <div className="relative min-h-[480px] lg:min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/a-high-neck-tank.jpg"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
        <div className="flex flex-col px-4 py-14 sm:px-8 lg:px-14 lg:py-20">
          <p className="eyebrow mb-6">{t("materials.eyebrow")}</p>
          <h2 className="max-w-xl text-[26px] leading-[1.3] sm:text-[34px]">
            {t("materials.title")
              .split("*")
              .map((part, i) =>
                i % 2 ? (
                  <em key={i} className="italic">
                    {part}
                  </em>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
          </h2>
          <div className="mt-14 flex items-end justify-between gap-6 lg:mt-24">
            <Link
              href={t("materials.href")}
              className="text-[13px] underline decoration-1 underline-offset-[6px] hover:opacity-70"
            >
              {t("materials.link")}
            </Link>
            <video
              className="aspect-square w-[46%] max-w-[260px] bg-paper object-cover"
              src="https://videos.pexels.com/video-files/30104843/12911922_1920_1080_30fps.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>
      </section>

      {/* category trio with hover state */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <p className="eyebrow mb-8">{t("categories.eyebrow")}</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {cats.map((c, i) => (
            <Reveal
              key={c.img}
              as="article"
              className="group relative overflow-hidden bg-bone"
            >
              <Link href={t(`categories.items.${i}.href` as never)} className="relative block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt=""
                  loading="lazy"
                  className="aspect-3/4 w-full object-cover object-top transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/25" />
                <h3 className="absolute top-6 start-6 text-[30px] font-light transition-colors duration-300 group-hover:text-paper sm:text-[38px]">
                  {t(`categories.items.${i}.title` as never)}
                  <sup className="ms-1 align-super text-[12px]">({c.count})</sup>
                </h3>
                <p className="absolute bottom-6 start-6 text-[13px] underline decoration-dotted underline-offset-4 transition-colors duration-300 group-hover:text-paper">
                  {t("categories.cta")}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* getaway edit */}
      <section className="grid bg-bone lg:grid-cols-2">
        <div className="flex flex-col px-4 pt-16 pb-10 sm:px-8 lg:px-14 lg:pt-24">
          <h2 className="font-display text-[38px] sm:text-[52px]">
            {t("getaway.title")}
          </h2>
          <div className="mt-14 flex justify-center lg:mt-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/hero-still-life.jpg"
              alt=""
              loading="lazy"
              className="w-[62%] max-w-[300px] object-cover"
            />
          </div>
        </div>
        <div className="relative min-h-[480px] lg:min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/getaway-model.jpg"
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
      </section>

      {/* dress code statement over portrait */}
      <section className="relative px-4 py-24 lg:py-32">
        <div className="relative mx-auto w-full max-w-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/dresscode-model.jpg"
            alt=""
            loading="lazy"
            className="aspect-3/4 w-full object-cover object-top"
          />
        </div>
        <h2 className="pointer-events-none absolute top-[36%] left-1/2 w-[min(92vw,880px)] -translate-x-1/2 text-center text-[26px] leading-snug sm:text-[34px]">
          {t("dress.title")
            .split("*")
            .map((part, i) =>
              i % 2 ? (
                <em key={i} className="italic">
                  {part}
                </em>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
        </h2>
        <div className="mt-10 text-center">
          <Link
            href={t("dress.href")}
            className="text-[13px] underline decoration-dotted underline-offset-[6px] hover:opacity-70"
          >
            {t("dress.cta")}
          </Link>
        </div>
      </section>

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
