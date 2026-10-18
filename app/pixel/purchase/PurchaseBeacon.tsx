"use client";

import { useEffect } from "react";
import { loadPixel, META_PIXEL_ID } from "@/lib/metaPixel";
import { STANDARD_PLAN } from "@/lib/plans";

export default function PurchaseBeacon({ eventId }: { eventId: string }) {
  useEffect(() => {
    loadPixel()?.(
      "trackSingle",
      META_PIXEL_ID,
      "Purchase",
      { value: STANDARD_PLAN.priceUsd, currency: "USD", content_type: "product", content_name: "Standard invite" },
      { eventID: eventId }
    );
  }, [eventId]);
  return null;
}
