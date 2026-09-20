"use client";

import { useEffect, useRef } from "react";

/**
 * Re-runs `callback` when the tab regains focus or becomes visible again.
 *
 * Used for day-scoped data (e.g. daily usage quotas): a tab left open across a
 * date change re-fetches as soon as the user returns to it, so today's numbers
 * are shown without a manual page reload.
 */
export function useRefreshOnFocus(callback: () => void) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    const run = () => saved.current();

    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };

    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
