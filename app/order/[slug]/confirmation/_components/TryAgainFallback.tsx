"use client";

import { useEffect, useState } from "react";

// Reveals a "try again" link only after a delay. The normal case is that
// AutoRefresh (polling every 5s on the confirmation page) catches the
// webhook's status flip well before this ever shows — this only matters
// if the webhook itself never lands (a rare Whish-side failure), so
// there's still a way out instead of waiting on the "Confirming your
// payment…" screen forever. `href` drops back to the plain confirmation
// URL (no result=processing), which re-shows the normal pick-a-method
// buttons if the invite still isn't live, or the real success page if it
// turns out to have gone live in the meantime.
export default function TryAgainFallback({ href, delayMs = 15000 }: { href: string; delayMs?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);

  if (!show) return null;

  return (
    <div className="mt-6 border-t border-black/10 pt-5">
      <p className="text-[13px] opacity-55">Taking longer than expected?</p>
      <a
        href={href}
        className="mt-1 inline-block text-[13.5px] font-semibold underline underline-offset-2"
        style={{ color: "var(--blue-dark)" }}
      >
        Try again
      </a>
    </div>
  );
}
