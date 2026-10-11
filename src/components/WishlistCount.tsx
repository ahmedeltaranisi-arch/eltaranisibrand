"use client";

import { useSyncExternalStore } from "react";
import { useWishlist } from "@/context/wishlist";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/** Wishlist size is only known after hydration — server render stays empty. */
export default function WishlistCount() {
  const { count } = useWishlist();
  const mounted = useMounted();

  if (!mounted || count === 0) return null;

  return (
    <span className="absolute -top-1 -end-1 min-w-[16px] rounded-full bg-ink px-1 text-center text-[9px] leading-4 font-medium text-paper">
      {count}
    </span>
  );
}
