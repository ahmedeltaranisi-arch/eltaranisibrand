"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import ArrivalModal from "./ArrivalModal";
import ArrivalNewsletter from "./ArrivalNewsletter";
import { CloseIcon } from "../icons";

export default function ArrivalPromo() {
  const t = useTranslations("newArrivals");
  const heading = useId();
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  return (
    <>
      {visible && <div className="na-promo" dir="ltr">
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">{t("promo")}</button>
        <button type="button" className="na-promo-dismiss" aria-label={t("promoDismiss")} onClick={() => setVisible(false)}>×</button>
      </div>}
      <ArrivalModal open={open} onClose={() => setOpen(false)} labelledBy={heading} className="na-offer-dialog">
        <button type="button" className="na-modal-close" aria-label={t("close")} onClick={() => setOpen(false)}><CloseIcon className="h-5 w-5" /></button>
        <h2 id={heading}>{t("promoTitle")}</h2><p>{t("promoBody")}</p><ArrivalNewsletter source="offer" />
      </ArrivalModal>
    </>
  );
}
