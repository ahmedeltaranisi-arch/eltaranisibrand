import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/navigation";

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
    <div className="elt-about" data-about-page="eltaranisi">
      <section className="elt-about-hero" aria-labelledby="about-title">
        <div className="elt-about-hero-images" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/about/hero-left.jpg" alt="" width={1442} height={1596} fetchPriority="high" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/about/hero-right.jpg" alt="" width={1438} height={1596} fetchPriority="high" />
        </div>
        <div className="elt-about-hero-shade" aria-hidden="true" />
        <div className="elt-about-hero-copy">
          <p className="elt-about-eyebrow">{t("hero.eyebrow")}</p>
          <h1 id="about-title">{t("hero.title")}</h1>
          <p className="elt-about-hero-body">{t("hero.body")}</p>
        </div>
      </section>

      <section id="journal" className="elt-about-story" aria-labelledby="about-story-title">
        <div className="elt-about-story-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/about/story-portrait.jpg" alt="" width={1124} height={1280} loading="lazy" />
        </div>
        <div className="elt-about-story-copy">
          <p className="elt-about-eyebrow">{t("hero.eyebrow")}</p>
          <h2 id="about-story-title">{t("story.title")}</h2>
          <div className="elt-about-prose">
            {Array.from({ length: PARAGRAPH_COUNT }, (_, index) => (
              <p key={index}>{t(`story.paragraphs.${index}` as never)}</p>
            ))}
          </div>
        </div>
      </section>

      <section id="materials" className="elt-about-materials" aria-labelledby="about-materials-title">
        <div className="elt-about-materials-copy">
          <p className="elt-about-eyebrow">{t("materials.eyebrow")}</p>
          <h2 id="about-materials-title">{t("materials.title")}</h2>
          <ul className="elt-about-material-list">
            {Array.from({ length: MATERIAL_COUNT }, (_, index) => (
              <li key={index}>
                <h3>{t(`materials.items.${index}.title` as never)}</h3>
                <p>{t(`materials.items.${index}.body` as never)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="elt-about-materials-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/about/materials-portrait.jpg" alt="" width={900} height={1028} loading="lazy" />
        </div>
      </section>

      <section className="elt-about-fullbleed" aria-labelledby="about-fullbleed-title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/about/fullbleed-story.jpg" alt="" width={2200} height={1224} loading="lazy" />
        <div className="elt-about-fullbleed-shade" aria-hidden="true" />
        <div className="elt-about-fullbleed-copy">
          <p className="elt-about-eyebrow">{t("fullbleed.eyebrow")}</p>
          <h2 id="about-fullbleed-title">{t("fullbleed.title")}</h2>
          <p>{t("fullbleed.body")}</p>
          <a href="#materials" className="elt-about-text-link">{t("fullbleed.cta")}</a>
        </div>
      </section>

      <section id="factories" className="elt-about-factories" aria-labelledby="about-factories-title">
        <div className="elt-about-factories-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/about/people-and-practice.jpg" alt="" width={523} height={594} loading="lazy" />
        </div>
        <div className="elt-about-factories-copy">
          <p className="elt-about-eyebrow">{t("factories.eyebrow")}</p>
          <h2 id="about-factories-title">{t("factories.title")}</h2>
          <p className="elt-about-body">{t("factories.body")}</p>
          <dl className="elt-about-stats">
            {Array.from({ length: STAT_COUNT }, (_, index) => (
              <div key={index}>
                <dt>{t(`factories.stats.${index}.value` as never)}</dt>
                <dd>{t(`factories.stats.${index}.label` as never)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="responsibility" className="elt-about-responsibility" aria-labelledby="about-responsibility-title">
        <div className="elt-about-responsibility-copy">
          <p className="elt-about-eyebrow">{t("packaging.eyebrow")}</p>
          <h2 id="about-responsibility-title">{t("packaging.title")}</h2>
          <p className="elt-about-body">{t("packaging.body")}</p>
          <ul className="elt-about-responsibility-list">
            {Array.from({ length: RESPONSIBILITY_COUNT }, (_, index) => (
              <li key={index}>
                <h3>{t(`responsibility.items.${index}.title` as never)}</h3>
                <p>{t(`responsibility.items.${index}.body` as never)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="elt-about-responsibility-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/about/responsibility.jpg" alt="" width={786} height={826} loading="lazy" />
        </div>
      </section>

      <section className="elt-about-editorials" aria-label={`${t("tiles.fabricLibrary")} and ${t("tiles.journal")}`}>
        <Link href="/pages/about#materials" className="elt-about-editorial-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/about/fabric-library.jpg" alt="" width={690} height={790} loading="lazy" />
          <span>{t("tiles.fabricLibrary")}</span>
        </Link>
        <Link href="/pages/about#journal" className="elt-about-editorial-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/about/everyday-essentials.jpg" alt="" width={784} height={1256} loading="lazy" />
          <span>{t("tiles.journal")}</span>
        </Link>
      </section>
    </div>
  );
}
