// Pure types and helpers shared by the dashboard's server pages and its
// client components. Kept apart from data.ts, which imports the
// service-role Supabase client and must never reach the browser.

export type DashboardInvite = {
  id: string;
  slug: string;
  host_names: string;
  event_date: string | null;
  venue_name: string | null;
  venue_map_url: string | null;
  whatsapp_number: string | null;
  photo_urls: string[] | null;
  paid_at: string | null;
  template: { slug: string; name: string; category: string } | null;
};

export type DashboardRsvp = {
  id: string;
  guest_name: string;
  attending: boolean;
  guest_count: number | null;
  message: string | null;
  created_at: string;
};

export function summarizeRsvps(rsvps: DashboardRsvp[]) {
  const accepted = rsvps.filter((r) => r.attending);
  const declined = rsvps.filter((r) => !r.attending);
  // Headcount of confirmed attendees, not just number of RSVP responses —
  // someone who accepted "+1" contributes 2 here, not 1.
  const headcount = accepted.reduce((sum, r) => sum + (r.guest_count ?? 1), 0);
  return { accepted, declined, headcount, total: rsvps.length };
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Whole calendar days from today to the event (negative once it's past),
// or null when the host hasn't set a date.
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  // The event's calendar day is read in UTC (see formatEventDate below);
  // today's is the server's, which is close enough for a day count.
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const e = new Date(iso);
  const eventDay = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
  return Math.round((eventDay - today) / 86400000);
}

// event_date is stored from a naive datetime-local string, which Postgres
// reads as UTC — so it's formatted in UTC too, to show exactly the time the
// host typed rather than shifting it by the server's timezone.
export function formatEventDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
  };
}
