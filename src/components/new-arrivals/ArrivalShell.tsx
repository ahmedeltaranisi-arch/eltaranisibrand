"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/navigation";
import { getArrivalProduct } from "@/lib/mateNewArrivals";
import ArrivalHeader from "./ArrivalHeader";
import ArrivalFooter from "./ArrivalFooter";
import ArrivalPromo from "./ArrivalPromo";
import ArrivalCartDrawer from "./ArrivalCartDrawer";
import PromoButton from "../PromoButton";
import CartDrawer from "../CartDrawer";

/** Match this collection's reference without redesigning the existing home/other collections. */
export default function ArrivalShell({ children, announcement, header, footer }: {
  children: ReactNode; announcement: ReactNode; header: ReactNode; footer: ReactNode;
}) {
  const pathname = usePathname();
  const productSlug = pathname.startsWith("/products/") ? pathname.split("/")[2] : "";
  const isArrivalRoute = pathname === "/collections/new-arrivals" || !!getArrivalProduct(productSlug);
  if (!isArrivalRoute) return <>{announcement}{header}<main id="main" className="flex-1">{children}</main>{footer}<PromoButton /><CartDrawer /></>;
  return (
    <div className="na-storefront">
      <ArrivalHeader />
      <main id="main" className="na-main">{children}</main>
      <ArrivalFooter />
      <ArrivalPromo />
      <ArrivalCartDrawer />
    </div>
  );
}
