// "Save the date": everything needed to put an invite's event into a guest's
// calendar — a downloadable .ics file (Apple Calendar, Outlook desktop, most
// Android calendars) and pre-filled "new event" links for Google Calendar and
// Outlook.com. Plain functions, no React or server imports: the template's
// button (browser) and the .ics route (server) both use them.

// How long the event lasts in the guest's calendar — invites only store a
// start time.
export const EVENT_HOURS = 3;

export type WallClock = { year: number; month: number; day: number; hour: number; minute: number };

// event_date holds the time the host typed: "2027-06-12T15:00:00+00:00" from
// the database (their wall-clock time, stored as if it were UTC) or
// "2027-06-12T15:00" from the customize form. Either way the first fields are
// what they typed, so everything here works from those — never from a Date in
// some timezone, which would shift the time for guests elsewhere.
export function parseWallClock(eventDate: string | null | undefined): WallClock | null {
  const m = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  return { year, month, day, hour, minute };
}

// The event as a Date for display: built from the typed numbers in whatever
// timezone the code runs in, so local getters (getDate, getHours) and
// toLocale*String without a timeZone show exactly what the host typed, for
// every guest, on the server and in the browser alike. Never use
// `new Date(event_date)` for display: that reads the stored value as UTC and
// shifts it into the guest's timezone (6 PM became 9 PM in Beirut).
export function wallClockDate(eventDate: string | null | undefined): Date | null {
  const t = parseWallClock(eventDate);
  return t ? new Date(t.year, t.month - 1, t.day, t.hour, t.minute) : null;
}

// True once the event's day is over (from the next calendar day on, by
// today's UTC date: at most a few hours late for Lebanon). Replies close
// and the dashboard stops sending then. False when there's no date.
export function eventDayPassed(eventDate: string | null | undefined, now = new Date()): boolean {
  const t = parseWallClock(eventDate);
  if (!t) return false;
  return Date.UTC(t.year, t.month - 1, t.day) < Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

// The reply deadline ("YYYY-MM-DD", set on the dashboard) is over: from the
// next calendar day on, like eventDayPassed. False when there's none.
export function replyDeadlinePassed(replyBy: string | null | undefined, now = new Date()): boolean {
  const m = replyBy?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return false;
  return Date.UTC(+m[1], +m[2] - 1, +m[3]) < Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

// No more replies: the reply deadline or the event's day is over.
export function repliesClosed(eventDate: string | null | undefined, replyBy: string | null | undefined, now = new Date()): boolean {
  return eventDayPassed(eventDate, now) || replyDeadlinePassed(replyBy, now);
}

// "Wednesday, August 12": a "YYYY-MM-DD" deadline for display, read as the
// calendar day it is (no timezone shift).
export function formatReplyBy(replyBy: string): string {
  const [y, m, d] = replyBy.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Wall-clock arithmetic done in UTC so no daylight-saving shift can creep in.
function addHours(t: WallClock, hours: number): WallClock {
  const d = new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute) + hours * 3_600_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

const p2 = (n: number) => String(n).padStart(2, "0");
// "20270612T150000" — "floating" time (no Z, no timezone): the calendar shows
// it at exactly that clock time wherever the guest is.
const compact = (t: WallClock) => `${t.year}${p2(t.month)}${p2(t.day)}T${p2(t.hour)}${p2(t.minute)}00`;
// "2027-06-12T15:00:00", the same floating time in the form Outlook.com wants.
const isoLocal = (t: WallClock) => `${t.year}-${p2(t.month)}-${p2(t.day)}T${p2(t.hour)}:${p2(t.minute)}:00`;

export type CalendarEvent = {
  title: string;
  start: WallClock;
  end: WallClock;
  location: string | null;
  description: string;
  url: string;
};

const OCCASION: Record<string, string> = { wedding: "wedding", birthday: "birthday", bachelorette: "bachelorette" };

// "Peyton & Shane's wedding" — by the template's category; anything else gets
// a plain "Peyton & Shane's celebration".
export function eventTitle(hostNames: string, category: string | null | undefined): string {
  return `${hostNames}'s ${OCCASION[category ?? ""] ?? "celebration"}`;
}

export function calendarEvent(input: {
  title: string;
  eventDate: string | null | undefined;
  venueName: string | null | undefined;
  venueMapUrl: string | null | undefined;
  guestUrl: string;
}): CalendarEvent | null {
  const start = parseWallClock(input.eventDate);
  if (!start) return null;
  const lines = [`You're invited! RSVP here: ${input.guestUrl}`];
  if (input.venueMapUrl) lines.push(`Map: ${input.venueMapUrl}`);
  return {
    title: input.title,
    start,
    end: addHours(start, EVENT_HOURS),
    location: input.venueName || null,
    description: lines.join("\n"),
    url: input.guestUrl,
  };
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${compact(e.start)}/${compact(e.end)}`,
    details: e.description,
  });
  if (e.location) q.set("location", e.location);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export function outlookCalendarUrl(e: CalendarEvent): string {
  const q = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: isoLocal(e.start),
    enddt: isoLocal(e.end),
    body: e.description,
  });
  if (e.location) q.set("location", e.location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q.toString()}`;
}

// iCalendar text values escape \ ; , and newlines (RFC 5545 §3.3.11).
const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Lines longer than 75 bytes are folded: CRLF + a space. Counted in UTF-8
// bytes, never splitting a character (names like "Rami & Rasha ❤" or Arabic).
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    if (bytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

// A complete .ics file for one event, with a reminder the day before.
export function icsFile(e: CalendarEvent, uid: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Apres-midi//Invitations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${compact(e.start)}`,
    `DTEND:${compact(e.end)}`,
    `SUMMARY:${escapeText(e.title)}`,
    ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
    `DESCRIPTION:${escapeText(e.description)}`,
    `URL:${e.url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`Tomorrow: ${e.title}`)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
