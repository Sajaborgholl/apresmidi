"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { isGuestToken } from "@/lib/guests";
import { MAX_RSVP_MESSAGE_LENGTH, type GuestReply } from "@/lib/guestRules";
import { repliesClosed } from "@/lib/calendar";

export type GuestRsvpInput = {
  token: string;
  attending: boolean;
  guest_count: number;
  message?: string | null;
};

// The only way an RSVP gets saved: from a guest's personal link. The guest
// is identified by the token in that link, so their name and their seat
// allowance come from the host's guest list — never from what the browser
// sends. Each guest has one reply, which they can change any time.
//
// Returns { error } instead of throwing, with messages written for guests;
// templates show them as-is.
export async function submitGuestRsvp(input: GuestRsvpInput): Promise<{ error: string | null; reply?: GuestReply }> {
  const token = input?.token;
  if (!isGuestToken(token)) {
    return { error: "This invitation link isn't valid." };
  }

  // Per connection, generous on purpose: a family replying from the same
  // Wi-Fi, or many guests behind one mobile-carrier IP, must get through.
  if (!(await rateLimit("rsvp", await clientIp(), 30, 10 * 60))) {
    return { error: "Too many responses right now — please try again in a few minutes." };
  }
  // Per guest: a few changes of mind are fine; a script hammering one link isn't.
  if (!(await rateLimit("rsvp-guest", token, 20, 60 * 60))) {
    return { error: "You've changed your reply a lot just now — please try again later." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: guest } = await supabaseAdmin
    .from("guests")
    .select("id, invite_id, name, seats, invites(status, is_demo, event_date, reply_by)")
    .eq("token", token)
    .maybeSingle();

  type InviteRow = { status: string; is_demo: boolean | null; event_date: string | null; reply_by: string | null };
  const rel = guest?.invites as InviteRow | InviteRow[] | null | undefined;
  const invite = Array.isArray(rel) ? rel[0] : rel;
  // Same visibility rule as the guest page: live invites (and demo rows).
  if (!guest || !invite || (!invite.is_demo && invite.status !== "live")) {
    return { error: "This invitation isn't accepting RSVPs." };
  }
  if (!invite.is_demo && repliesClosed(invite.event_date, invite.reply_by)) {
    return { error: "Replies have closed." };
  }

  const attending = input.attending === true;
  const requested = Math.floor(Number(input.guest_count));
  // Accepting is at least the guest themself, at most their seats; a decline is 0.
  const guestCount = attending ? Math.min(guest.seats, Math.max(1, Number.isFinite(requested) ? requested : 1)) : 0;
  const message = String(input.message ?? "").trim().slice(0, MAX_RSVP_MESSAGE_LENGTH) || null;
  const now = new Date().toISOString();

  const { data: existing } = await supabaseAdmin.from("rsvps").select("id").eq("guest_id", guest.id).maybeSingle();

  const row = { attending, guest_count: guestCount, message, guest_name: guest.name };
  const update = () => supabaseAdmin.from("rsvps").update({ ...row, updated_at: now }).eq("guest_id", guest.id);
  let { error } = existing
    ? await update()
    : await supabaseAdmin.from("rsvps").insert({ ...row, invite_id: guest.invite_id, guest_id: guest.id });
  // Two first replies at the same moment (a double tap on two phones): the
  // other one inserted first (one reply per guest), so this one updates it.
  if (error?.code === "23505") ({ error } = await update());

  if (error) {
    console.error("submitGuestRsvp: save failed", error);
    return { error: "Something went wrong — please try again." };
  }

  return { error: null, reply: { attending, guest_count: guestCount, message } };
}

// "Opened" for the host's dashboard. Fire-and-forget from the guest's page;
// rate-limited so a script can't inflate the count.
export async function markGuestOpened(token: string): Promise<void> {
  if (!isGuestToken(token)) return;
  if (!(await rateLimit("guest-open", token, 30, 60 * 60))) return;
  const { error } = await getSupabaseAdmin().rpc("record_guest_open", { p_token: token });
  if (error) console.error("markGuestOpened: failed", error);
}
