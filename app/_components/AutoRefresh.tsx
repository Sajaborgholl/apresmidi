"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polls by re-running the current Server Component's data fetch on an
// interval (router.refresh()) — no new API route or client-side fetch
// endpoint needed. Used by: the order confirmation page (waiting on a
// draft to flip to paid) and the owner dashboard (picking up new RSVPs
// without a manual reload).
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
