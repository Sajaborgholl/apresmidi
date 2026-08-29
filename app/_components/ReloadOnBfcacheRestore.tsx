"use client";

import { useEffect } from "react";

// Chrome/Chromium (and so Opera, Edge, etc.) changed their back-forward
// cache (bfcache) policy a while back: pages are now bfcache-eligible even
// when they send `Cache-Control: no-store` (see next.config.ts's
// headers() — that header is still worth sending, just no longer
// sufficient alone) — Chrome prioritizes bfcache performance over
// honoring no-store as an exclusion signal. The reliable, currently-
// recommended fix (per web.dev's own bfcache guidance) isn't to prevent
// the cache — that's no longer guaranteeable — it's to detect a bfcache
// restore via the `pageshow` event's `persisted` flag and immediately
// force a full reload, so a customer never actually sees the frozen,
// stale draft (old typed values, old preview state) — only a near-
// instant flash before the real, fresh page loads in its place.
export default function ReloadOnBfcacheRestore() {
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}
