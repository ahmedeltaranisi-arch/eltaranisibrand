import type { ReactNode } from "react";

/**
 * The real layout lives in app/[locale]/layout.tsx. next-intl's middleware
 * redirects `/` to `/en` or `/ar`, so this shell never paints anything.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
