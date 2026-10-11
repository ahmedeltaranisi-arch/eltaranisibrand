import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";

export default async function Breadcrumbs({
  items,
  tone = "dark",
}: {
  items: { label?: string; labelKey?: string; href?: string }[];
  tone?: "dark" | "light";
}) {
  const t = await getTranslations("collections");

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase ${
        tone === "light" ? "text-paper/80" : "text-mist"
      }`}
    >
      <Link href="/" className={tone === "light" ? "hover:text-paper" : "hover:text-ink"}>
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span aria-hidden>/</span>
          {item.href ? (
            <Link
              href={item.href}
              className={tone === "light" ? "hover:text-paper" : "hover:text-ink"}
            >
              {item.label ?? (item.labelKey ? t(item.labelKey) : "")}
            </Link>
          ) : (
            <span className={tone === "light" ? "text-paper" : "text-ink"}>
              {item.label ?? (item.labelKey ? t(item.labelKey) : "")}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
