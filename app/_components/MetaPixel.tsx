"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { META_PIXEL_ID, pixelAllowedOn } from "@/lib/metaPixel";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
};

// Meta's standard base code, written out so it only loads on allowed pages.
function loadPixel() {
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const n = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  } as Fbq;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  // The Pixel otherwise sends its own PageView on every client-side route
  // change, including into excluded pages (e.g. the order -> confirmation
  // redirect, whose URL carries the order token). We send PageView ourselves.
  n.disablePushState = true;
  w.fbq = n;
  w._fbq = n;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  // No automatic button-click / page-metadata collection: only the events
  // this site sends on purpose.
  n("set", "autoConfig", false, META_PIXEL_ID);
  n("init", META_PIXEL_ID);
}

// Mounted once in the root layout. Loads the Pixel the first time the visitor
// is on an allowed page and sends one PageView per allowed page visited.
export default function MetaPixel() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || !pixelAllowedOn(pathname)) return;
    loadPixel();
    (window as unknown as { fbq: Fbq }).fbq("track", "PageView");
  }, [pathname]);
  return null;
}
