"use client";

import { useEffect } from "react";
import { META_PIXEL_ID } from "@/lib/metaPixel";

// Reports the sale to the Meta Pixel once per order and browser: adds a
// hidden same-site iframe on /pixel/purchase, which sends the event from a
// URL without the order token (see app/pixel/purchase/page.tsx). The iframe
// is left in place (removing it early could cancel the request).
export default function PurchasePixel({ eventId }: { eventId: string }) {
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    const key = `apm-${eventId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      // Private mode etc.: still send; Meta dedupes on the event id.
    }
    const frame = document.createElement("iframe");
    frame.src = `/pixel/purchase?e=${encodeURIComponent(eventId)}`;
    frame.title = "";
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
  }, [eventId]);
  return null;
}
