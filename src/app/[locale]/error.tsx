"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary. Any client exception during render/hydration
 * lands here instead of leaving the user on a dead screen. The button does a
 * FULL reload so fresh chunks are fetched after a redeploy (the most common
 * cause of "this page couldn't load" right after a deploy).
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[locale] route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="eyebrow text-mist">Something went wrong</p>
      <h1 className="font-display text-[26px] leading-tight">
        This page hit an unexpected error
      </h1>
      <p className="text-[14px] text-graphite">
        Reloading usually fixes it — a fresh version of the site may have just
        been published.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-solid"
        >
          Reload
        </button>
        <button type="button" onClick={reset} className="btn-outline">
          Try again
        </button>
      </div>
    </div>
  );
}
