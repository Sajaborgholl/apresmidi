import type { Metadata } from "next";
import PurchaseBeacon from "./PurchaseBeacon";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Loaded only inside a hidden iframe on the order confirmation page, right
// after a payment is confirmed (see PurchasePixel there). Exists so the
// Purchase event is sent from a clean URL: the confirmation page's own URL
// carries the customer's private order token, and the Pixel reports the page
// URL to Meta. The /order/* pages send no referrer, so nothing leaks through
// document.referrer either. Nothing here is secret or trusted: a Pixel event
// can be faked by anyone who knows the (public) Pixel ID anyway.
export default async function PurchasePixelPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const eventId = e && /^purchase-[0-9a-f]{20}$/.test(e) ? e : null;
  return eventId ? <PurchaseBeacon eventId={eventId} /> : null;
}
