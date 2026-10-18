"use client";

import { useEffect } from "react";
import { trackPixel } from "@/lib/metaPixel";

// Fires one Pixel event when a page mounts, for Server Component pages that
// can't call trackPixel themselves (e.g. ViewContent on a template page).
export default function PixelEvent({ event, params }: { event: string; params?: Record<string, unknown> }) {
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    trackPixel(event, JSON.parse(key));
  }, [event, key]);
  return null;
}
