"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Params = Pick<URLSearchParams, "get" | "getAll">;

/**
 * The URL is the source of truth for a collection page, but re-reading it after every facet
 * toggle would need a round trip — the reference store applies filters instantly instead.
 * So a local draft shadows the URL until the URL itself moves (Back/Forward, a rail link, a
 * pasted deep link), at which point the address wins again. `read`/`write` must be stable
 * module-level functions so the derived state stays memoised.
 */
export function useCollectionUrlState<S>(read: (params: Params) => S, write: (state: S) => string) {
  const params = useSearchParams();
  const [draft, setDraft] = useState<{ source: Params; value: S } | null>(null);
  const fromUrl = useMemo(() => read(params), [params, read]);
  const state = draft && draft.source === params ? draft.value : fromUrl;

  const navigate = useCallback((next: S, push = false) => {
    const query = write(next);
    const url = window.location.pathname + (query ? `?${query}` : "");
    if (push) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
    setDraft({ source: params, value: next });
  }, [params, write]);

  return { state, navigate };
}
