"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/navigation";
import { getAnyCatalogProduct } from "@/lib/shopAllProducts";
import { SHOP_ALL_ROUTES } from "@/lib/shopAll";
import { INTIMATES_HANDLES } from "@/lib/intimates";
import ArrivalPromo from "./ArrivalPromo";
import ArrivalCartDrawer from "./ArrivalCartDrawer";
import PromoButton from "../PromoButton";
import CartDrawer from "../CartDrawer";

/**
 * Every collection the arrival skin serves: New Arrivals, Best Sellers, Activewear with its
 * children and dyes, and every rail of the Shop All collection.
 */
const ARRIVAL_COLLECTIONS = new Set([
  ...SHOP_ALL_ROUTES.map((handle) => `/collections/${handle}`),
  ...INTIMATES_HANDLES.map((handle) => `/collections/${handle}`),
  "/collections/new-arrivals",
  "/collections/best-sellers",
  "/collections/activewear",
  "/collections/leggings-and-shorts",
  "/collections/sports-bras",
  "/collections/activewear-tops",
  "/collections/biker-shorts",
  "/collections/dresses-unitards",
  "/collections/fig",
  "/collections/nori",
  "/collections/mulberry",
  "/collections/mocha-move",
  "/collections/pebble",
  "/collections/move-by-mate",
  "/collections/organic-studio-uniform",
]);

/** Keep page/footer skins distinct; the shared header is mounted once in the layout. */
export default function ArrivalShell({ children, footer }: {
  children: ReactNode; footer: ReactNode;
}) {
  const pathname = usePathname();
  const productSlug = pathname.startsWith("/products/") ? pathname.split("/")[2] : "";
  const isArrivalRoute = ARRIVAL_COLLECTIONS.has(pathname) || !!getAnyCatalogProduct(productSlug);
  if (!isArrivalRoute) return <><main id="main" className="flex-1">{children}</main>{footer}<PromoButton /><CartDrawer /></>;
  return (
    <>
    <div className="na-storefront">
      <main id="main" className="na-main">{children}</main>
      <ArrivalPromo />
      <ArrivalCartDrawer />
    </div>
    {footer}
    </>
  );
}
