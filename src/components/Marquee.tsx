import { getTranslations } from "next-intl/server";

export default async function Marquee() {
  const t = await getTranslations("home");
  const text = t("marquee");

  return (
    <div className="overflow-hidden border-y border-line bg-bone py-3 select-none">
      <div className="animate-marquee flex w-max">
        {[0, 1].map((i) => (
          <span
            key={i}
            aria-hidden={i === 1}
            className="eyebrow shrink-0 whitespace-nowrap text-graphite"
          >
            {text}
            {text}
            {text}
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
