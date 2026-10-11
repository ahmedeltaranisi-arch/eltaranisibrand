import { createNavigation } from "next-intl/navigation";
import { routing } from "./i18n/routing";

/** Locale-aware Link / redirect / router. Use these instead of next/link. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
