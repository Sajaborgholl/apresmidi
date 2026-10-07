"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Mirrors the largest party any template's guest picker allows (6 or 10).
const MAX_GUESTS = 10;
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 1000;
// Flood limits per invite, checked against rows already saved, so they hold
// across server instances. A real party never gets close to either.
const MAX_RSVPS_PER_MINUTE = 20;
const MAX_RSVPS_PER_INVITE = 2000;

export type RsvpInput = {
  invite_id: string;
  guest_name: string;
  attending: boolean;
  guest_count: number;
  message?: string | null;
};

// The only way an RSVP gets saved. Guests used to insert straight into the
// rsvps table with the publishable key, which let anyone write any row for
// any invite (drafts included) with any guest_count. The anon insert policy
// is dropped in supabase/lock-down-rsvps.sql; this validates instead.
//
// Returns { error } instead of throwing, in the same shape the templates
// already read from supabase-js's insert(), so each template only swapped
// one call. Messages stay generic: templates show their own text anyway.
export async function submitRsvp(input: RsvpInput): Promise<{ error: string | null }> {
  const inviteId = String(input?.invite_id ?? "");
  const guestName = String(input?.guest_name ?? "").trim().slice(0, MAX_NAME_LENGTH);
  const attending = input?.attending === true;
  const requested = Math.floor(Number(input?.guest_count));
  // An accepted RSVP is at least the guest themself; a decline is always 0.
  const guestCount = attending ? Math.min(MAX_GUESTS, Math.max(1, Number.isFinite(requested) ? requested : 1)) : 0;
  const message = String(input?.message ?? "").trim().slice(0, MAX_MESSAGE_LENGTH) || null;

  if (!inviteId || !guestName) {
    return { error: "Please enter your name." };
  }

  // Per connection, on top of the per-invite limits below. Generous on
  // purpose: a family RSVPing one by one from the same Wi-Fi, or many guests
  // behind one mobile-carrier IP, must still get through.
  if (!(await rateLimit("rsvp", await clientIp(), 30, 10 * 60))) {
    return { error: "Too many responses right now — please try again in a few minutes." };
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Same visibility rule as the guest page (app/i/[slug]/page.tsx): live
  // invites, plus the always-visible demo rows.
  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("id, status, is_demo")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite || (!invite.is_demo && invite.status !== "live")) {
    return { error: "This invitation isn't accepting RSVPs." };
  }

  const since = new Date(Date.now() - 60_000).toISOString();
  const [{ count: recent }, { count: total }] = await Promise.all([
    supabaseAdmin
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("invite_id", inviteId)
      .gte("created_at", since),
    supabaseAdmin.from("rsvps").select("id", { count: "exact", head: true }).eq("invite_id", inviteId),
  ]);

  if ((recent ?? 0) >= MAX_RSVPS_PER_MINUTE || (total ?? 0) >= MAX_RSVPS_PER_INVITE) {
    return { error: "Too many responses right now — please try again in a minute." };
  }

  const { error } = await supabaseAdmin.from("rsvps").insert({
    invite_id: inviteId,
    guest_name: guestName,
    attending,
    guest_count: guestCount,
    message,
  });

  if (error) {
    console.error("submitRsvp: insert failed", error);
    return { error: "Something went wrong — please try again." };
  }

  return { error: null };
}
