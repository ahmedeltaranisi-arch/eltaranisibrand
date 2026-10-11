"use client";

import { useTranslations } from "next-intl";
import { useWishlist } from "@/context/wishlist";
import { HeartIcon } from "./icons";

export default function WishlistButton({
  productId,
  size = "md",
}: {
  productId: string;
  size?: "sm" | "md";
}) {
  const t = useTranslations("wishlist");
  const { has, toggle } = useWishlist();
  const saved = has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={saved}
      aria-label={saved ? t("remove") : t("save")}
      title={saved ? t("remove") : t("save")}
      className={[
        "grid place-items-center rounded-full bg-paper/85 text-ink backdrop-blur-sm transition-all hover:bg-paper",
        saved ? "text-terra" : "text-ink/70",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
      ].join(" ")}
    >
      <HeartIcon
        filled={saved}
        className={size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]"}
      />
    </button>
  );
}
