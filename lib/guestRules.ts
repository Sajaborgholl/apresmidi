import { MAX_LENGTH, WHATSAPP_DIGITS } from "@/lib/validation";

// Rules for a host's guest list, shared by the dashboard's forms (as input
// limits and instant checks) and the server actions that enforce them. Plain
// data and functions, so Client and Server Components can both import it.

// Keep MAX_SEATS_PER_GUEST in step with guests_seats_range in
// supabase/add-guest-list.sql.
export const MAX_SEATS_PER_GUEST = 10;
export const MAX_GUESTS_PER_INVITE = 500;
export const MAX_RSVP_MESSAGE_LENGTH = 1000;

// What a template receives for a personal invitation link: who the guest is,
// how many people they may bring (themselves included), and their reply so
// far. The token identifies them to submitGuestRsvp; it's in their own URL
// already, so handing it to their page reveals nothing new.
export type GuestReply = {
  attending: boolean;
  guest_count: number;
  message: string | null;
};

export type InviteGuest = {
  token: string;
  name: string;
  seats: number;
  reply: GuestReply | null;
  // The sample guest shown on demo invitations: replies aren't saved.
  demo?: boolean;
};

// The guest on demo invitations (homepage, template pages) and the customize
// preview, so visitors and hosts see the RSVP form. It has no name, so no
// made-up name or greeting appears: templates skip the name parts when it's
// "". Real guests always have a name (checkGuest requires one).
export const SAMPLE_GUEST: InviteGuest = {
  token: "sample",
  name: "",
  seats: 3,
  reply: null,
  demo: true,
};

export type GuestInput = { name: string; phone: string; seats: number };

// Cleans and checks one guest as typed by the host (a form row, a spreadsheet
// line or a picked contact). `phone` must already include the country code;
// formatting characters (spaces, dashes, +, parentheses) are dropped.
// Returns the cleaned guest, or the problem written for the host.
export function checkGuest(raw: { name?: unknown; phone?: unknown; seats?: unknown }): { guest: GuestInput } | { error: string } {
  const name = String(raw.name ?? "").replace(/\s+/g, " ").trim();
  if (!name) return { error: "Add the guest's name." };
  if (name.length > MAX_LENGTH.personName) return { error: `Names can be at most ${MAX_LENGTH.personName} characters.` };

  let phone = String(raw.phone ?? "").trim();
  // "00961…" is the same as "+961…".
  if (phone.startsWith("00")) phone = phone.slice(2);
  phone = phone.replace(/\D/g, "");
  if (phone.length < WHATSAPP_DIGITS.min || phone.length > WHATSAPP_DIGITS.max) {
    return { error: "Enter a full WhatsApp number with the country code (e.g. +961 70 123 456)." };
  }

  const seatsText = String(raw.seats ?? "").trim();
  const seats = seatsText === "" ? 1 : Number(seatsText);
  if (!Number.isInteger(seats) || seats < 1 || seats > MAX_SEATS_PER_GUEST) {
    return { error: `Seats must be a whole number from 1 to ${MAX_SEATS_PER_GUEST}.` };
  }

  return { guest: { name, phone, seats } };
}

// "+961 70 123 456"-style display of stored digits, for the dashboard. Only
// the country code is split off reliably; the rest is grouped in threes.
export function formatPhone(digits: string): string {
  return `+${digits}`;
}
