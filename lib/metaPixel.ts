// Browser-side Meta Pixel helpers. The base code is loaded by
// app/_components/MetaPixel.tsx; this file only sends events through it.
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

type Fbq = (...args: unknown[]) => void;

export function trackPixel(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined") return;
  if (!pixelAllowedOn(window.location.pathname)) return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (!fbq) return;
  if (eventId) fbq("track", event, params ?? {}, { eventID: eventId });
  else fbq("track", event, params ?? {});
}
