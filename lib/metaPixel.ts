// Browser-side Meta Pixel: loads the base code (on allowed pages only) and
// sends events. PageView comes from app/_components/MetaPixel.tsx.
// Plain module (no React) so any Client Component can import it.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

// Pages the Pixel must never run on. Each of these either carries a secret in
// its URL (dashboard token, order token) or belongs to a customer's guests
// (the invite pages, the customize preview iframe). The Pixel sends the full
// page URL to Meta with every event, so it simply never loads or fires here.
// Purchase is sent server-side instead (lib/metaCapi.ts), without those URLs.
const EXCLUDED = [/^\/i\//, /^\/dashboard(\/|$)/, /^\/order\/[^/]+\/(confirmation|preview)(\/|$)/, /^\/api\//];

export function pixelAllowedOn(pathname: string): boolean {
  return Boolean(META_PIXEL_ID) && !EXCLUDED.some((re) => re.test(pathname));
}

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
};

// Meta's standard base code, written out so it only loads on allowed pages.
// Returns fbq, loading it first if needed (null when the Pixel is off).
export function loadPixel(): Fbq | null {
  if (typeof window === "undefined" || !META_PIXEL_ID) return null;
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return w.fbq;
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
  return n;
}

export function trackPixel(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined") return;
  if (!pixelAllowedOn(window.location.pathname)) return;
  const fbq = loadPixel();
  if (!fbq) return;
  if (eventId) fbq("track", event, params ?? {}, { eventID: eventId });
  else fbq("track", event, params ?? {});
}
