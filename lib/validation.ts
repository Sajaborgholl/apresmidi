// Size and format rules for everything people type into the site's forms.
// One source, read by the forms (as maxLength, so real users never hit the
// server-side error) and by the server actions (which enforce it, since a
// form's own limits can be bypassed). Plain data and functions — no React or
// server imports — because both Client and Server Components import it.

export const MAX_LENGTH = {
  hostNames: 80,
  venueName: 120,
  venueMapUrl: 500,
  // The longest an email address can be (RFC 5321).
  email: 254,
  personName: 100,
  phone: 30,
  category: 100,
} as const;

// E.164: a full international number (country code included) is at most 15
// digits; 7 is a safe floor for any real one.
export const WHATSAPP_DIGITS = { min: 7, max: 15 } as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Every template turns venue_map_url into a "View on map" button guests tap,
// so only links to a real maps service are accepted — not just any URL, which
// would let an invite send guests to any site under our name.
const MAP_SERVICES = "a Google Maps, Apple Maps or Waze link";

function isMapHost(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  // Google: share links, and google.<country>/maps (google.com, google.com.lb…)
  if (host === "maps.app.goo.gl") return true;
  if (host === "goo.gl" && path.startsWith("/maps")) return true;
  if (/^maps\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)) return true;
  if (/^(www\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host) && path.startsWith("/maps")) return true;
  // Apple: maps.apple.com, and the newer maps.apple short links
  if (host === "maps.apple.com" || host === "maps.apple") return true;
  // Waze
  if (host === "waze.com" || host === "www.waze.com" || host === "ul.waze.com") return true;
  return false;
}

// Returns the link to store (always https), or a message for the customer.
// A missing "https://" is added rather than rejected, since people often
// paste "maps.app.goo.gl/…" on its own.
export function checkMapLink(raw: string): { url: string } | { error: string } {
  if (raw.length > MAX_LENGTH.venueMapUrl) return { error: `That map link is too long — please paste ${MAP_SERVICES}.` };
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { error: `Please paste ${MAP_SERVICES}.` };
  }
  if ((url.protocol !== "https:" && url.protocol !== "http:") || !isMapHost(url)) {
    return { error: `Please paste ${MAP_SERVICES}.` };
  }
  url.protocol = "https:";
  return { url: url.toString() };
}

// The form's datetime-local value ("2026-06-12T19:00"). Rejects anything else
// before it reaches the database, and dates no real event would have.
export function isValidEventDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return false;
  const time = Date.parse(`${value}Z`);
  if (Number.isNaN(time)) return false;
  const parsed = new Date(time);
  // JavaScript rolls impossible dates over (Feb 30 -> Mar 2) instead of
  // rejecting them, so the date must read back exactly as it was written.
  if (parsed.toISOString().slice(0, 16) !== value.slice(0, 16)) return false;
  const year = parsed.getUTCFullYear();
  return year >= 2000 && year <= 2100;
}
