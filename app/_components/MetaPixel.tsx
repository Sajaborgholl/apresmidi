"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { loadPixel, pixelAllowedOn } from "@/lib/metaPixel";

// Mounted once in the root layout, BEFORE {children}: React runs effects in
// tree order, so the PageView below goes out before any page's own event
// (e.g. ViewContent from PixelEvent). Loads the Pixel the first time the
// visitor is on an allowed page and sends one PageView per allowed page.
export default function MetaPixel() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || !pixelAllowedOn(pathname)) return;
    loadPixel()?.("track", "PageView");
  }, [pathname]);
  return null;
}
