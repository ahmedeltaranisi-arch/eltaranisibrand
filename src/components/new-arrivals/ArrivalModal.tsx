"use client";

import { useEffect, useRef, type ReactNode } from "react";

let scrollLocks = 0;
let previousOverflow = "";
let previousPadding = "";
function lockScroll() {
  if (scrollLocks++ === 0) {
    previousOverflow = document.body.style.overflow;
    previousPadding = document.body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--scrollLocks === 0) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    }
  };
}

/** Native dialog supplies focus trapping, inert background, Escape and focus return. */
export default function ArrivalModal({
  open, onClose, className = "", labelledBy, children,
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
  labelledBy: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) {
      if (element.open) element.close();
      return;
    }
    if (!element.open) element.showModal();
    const release = lockScroll();
    return () => {
      if (element.open) element.close();
      release();
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={`na-dialog ${className}`}
      aria-labelledby={labelledBy}
      aria-modal="true"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
