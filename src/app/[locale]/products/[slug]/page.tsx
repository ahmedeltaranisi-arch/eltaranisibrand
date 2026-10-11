import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getColorway,
  getProductBySlug,
  productSlugs,
  products,
} from "@/lib/catalog";
import { STUDIO_PRODUCTS, colorBack, colorImage, productKey } from "@/lib/catalog";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGallery from "@/components/ProductGallery";
import WishlistButton from "@/components/WishlistButton";
import ProductRail from "@/components/ProductRail";
import ProductBuyBox from "@/components/ProductBuyBox";
import Reveal from "@/components/Reveal";

export function generateStaticParams() {
  return productSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: productKey(product).replace(/([A-Z])/g, " $1").trim(),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = getProductBySlug(slug);
  const colorway = getColorway(slug);
  if (!product || !colorway) notFound();

  const t = await getTranslations("product");
  const tp = await getTranslations("p");
  const tc = await getTranslations("colors");
  const tcol = await getTranslations("collections");
  const key = productKey(product);

  const related = products
    .filter((p) => p.id !== product.id)
    .filter((p) => p.collections.some((c) => product.collections.includes(c)))
    .slice(0, 4);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-10">
        <Breadcrumbs
          items={[
            { labelKey: "indexTitle", href: "/collections" },
            {
              label: tp(`${key}.title`),
              href: `/collections/${product.collections[0]}`,
            },
            { label: tc(colorway.name as never) },
          ]}
        />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-12">
        {/* gallery */}
        <ProductGallery
          images={STUDIO_PRODUCTS.has(product.id) ? [colorImage(colorway.name, product.image), colorBack(colorway.name, product.imageAlt)] : [product.image, product.imageAlt]}
          alt={tp(`${key}.title`)}
          activeSlug={colorway.slug}
        />

        {/* buy box */}
        <div className="lg:pt-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[26px] leading-tight font-light sm:text-[34px]">
              {tp(`${key}.title`)}
            </h1>
            <span className="mt-1 border border-line">
              <WishlistButton productId={product.id} />
            </span>
          </div>
          <p className="mt-2 text-[14px] text-graphite">
            {tp(`${key}.blurb` as never)}
          </p>

          <p className="mt-4 flex items-baseline gap-3">
            <span className="text-[18px]">${product.price}</span>
            {product.compareAt && (
              <span className="text-[14px] text-mist line-through">
                ${product.compareAt}
              </span>
            )}
          </p>

          <p className="mt-3 text-[12px] text-mist">
            {t("reviews", { count: product.reviewCount })} · {product.rating}/5
          </p>

          <ProductBuyBox
            productId={product.id}
            productSlug={colorway.slug}
            titleKey={product.titleKey}
            image={product.image}
            price={product.price}
            sizes={product.sizes}
            stock={product.stock}
            colorways={product.colorways.map((c) => ({
              name: c.name,
              hex: c.hex,
              slug: c.slug,
            }))}
            activeColor={colorway.name}
          />

          {/* accordions */}
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {[
              {
                label: t("description"),
                body: tp(`${key}.description` as never),
              },
              {
                label: t("materials"),
                body: `${tp(`${key}.material` as never)}\n${tp(`${key}.care` as never)}`,
              },
              { label: t("shippingReturns"), body: t("shippingBody") },
            ].map((row) => (
              <AccordionRow key={row.label} label={row.label} body={row.body} />
            ))}
          </dl>

          <p className="mt-5 text-[12px] text-mist">{t("fitNote")}</p>
        </div>
      </div>

      {/* reviews */}
      <Reveal as="section" className="border-t border-line bg-bone">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-light sm:text-[28px]">
                {t("reviews")}
              </h2>
              <p className="mt-1 text-[13px] text-mist">{t("reviewNote")}</p>
            </div>
            <p className="text-[13px]">
              <span className="text-[20px]">{product.rating}</span>
              <span className="text-mist">
                {" "}
                / 5 · {t("reviews", { count: product.reviewCount })}
              </span>
            </p>
          </div>

          <ul className="grid gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="bg-paper p-6">
                <div className="mb-3 flex gap-0.5 text-ink" aria-hidden>
                  {Array.from({ length: 5 }, (_, s) => (
                    <span key={s}>★</span>
                  ))}
                </div>
                <h3 className="text-[15px]">{t(`sampleReviews.${i}.title` as never)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-graphite">
                  {t(`sampleReviews.${i}.body` as never)}
                </p>
                <p className="mt-4 text-[12px] text-mist">
                  {t(`sampleReviews.${i}.name` as never)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* related */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <h2 className="mb-8 text-[22px] font-light sm:text-[28px]">
          {tcol("youMayAlsoLike")}
        </h2>
        <ProductRail products={related} />
      </section>
    </>
  );
}

function AccordionRow({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <input type="checkbox" id={`acc-${label}`} className="peer sr-only" />
      <label
        htmlFor={`acc-${label}`}
        className="flex cursor-pointer items-center justify-between py-4 text-[13px] tracking-[0.06em]"
      >
        {label}
        <span className="text-mist transition-transform peer-checked:rotate-45">
          +
        </span>
      </label>
      <div className="grid grid-rows-[0fr] transition-all duration-300 peer-checked:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <p className="pb-5 text-[13px] leading-relaxed whitespace-pre-line text-graphite">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
