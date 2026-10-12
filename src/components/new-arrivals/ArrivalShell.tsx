"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/navigation";
import { getArrivalProduct } from "@/lib/mateNewArrivals";
import ArrivalFooter from "./ArrivalFooter";
import ArrivalPromo from "./ArrivalPromo";
import ArrivalCartDrawer from "./ArrivalCartDrawer";
import PromoButton from "../PromoButton";
import CartDrawer from "../CartDrawer";

/** Keep page/footer skins distinct; the shared header is mounted once in the layout. */
export default function ArrivalShell({ children, footer }: {
  children: ReactNode; footer: ReactNode;
}) {
  const pathname = usePathname();
  const productSlug = pathname.startsWith("/products/") ? pathname.split("/")[2] : "";
  const isArrivalRoute = pathname === "/collections/new-arrivals" || !!getArrivalProduct(productSlug);
  if (!isArrivalRoute) return <><main id="main" className="flex-1">{children}</main>{footer}<PromoButton /><CartDrawer /></>;
  return (
    <div className="na-storefront">
      <main id="main" className="na-main">{children}</main>
      <ArrivalFooter />
      <ArrivalPromo />
      <ArrivalCartDrawer />
    </div>
  );
}
