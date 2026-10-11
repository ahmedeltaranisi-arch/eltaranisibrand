"use client";

import { useSyncExternalStore } from "react";
import { useCart } from "@/context/cart";

const emptySubscribe = () => () => {};

/**
 * Cart count only exists after hydration, so the server snapshot stays 0 and
 * the badge pops in on the client without a hydration mismatch.
 */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function CartCount() {
  const { count } = useCart();
  const mounted = useMounted();

  if (!mounted || count === 0) return null;

  return (
    <span className="absolute -top-1 -end-1 min-w-[16px] rounded-full bg-ink px-1 text-center text-[9px] leading-4 font-medium text-paper">
      {count}
    </span>
  );
}
