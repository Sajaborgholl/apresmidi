"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { newGuestToken } from "@/lib/guests";
import { checkGuest, MAX_GUESTS_PER_INVITE, type GuestInput } from "@/lib/guestRules";

// The host's guest list. Like every dashboard action, authorized by the
// dashboard_token alone and only for live invites; every input is re-checked
// here with lib/guestRules.ts (the forms check the same rules first).
//
// Each returns { error } on failure (written for the host) or a small result
// on success, and refreshes the Guests page.

export type GuestActionResult = { error: string } | { ok: true; note?: string };
export type ImportResult = { error: string } | { ok: true; added: number; skipped: { line: number; reason: string }[] };

async function liveInviteId(token: string): Promise<string | null> {
  if (typeof token !== "string" || !token) return null;
  const { data: invite } = await getSupabaseAdmin()
    .from("invites")
    .select("id, status")
    .eq("dashboard_token", token)
    .maybeSingle();
  return invite && invite.status === "live" ? invite.id : null;
}

// Generous for real use (adding a few hundred guests by hand), but stops a
// runaway script.
async function allowed(token: string, weight = "guests"): Promise<boolean> {
  return rateLimit(`dash-${weight}`, token, 300, 10 * 60);
}

async function guestCount(inviteId: string): Promise<number> {
  const { count } = await getSupabaseAdmin()
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("invite_id", inviteId);
  return count ?? 0;
}

function done(token: string) {
  revalidatePath(`/dashboard/${token}/guests`);
  revalidatePath(`/dashboard/${token}`);
}

// Stops this guest's WhatsApp messages that haven't gone out yet (ones
// already sending can't be pulled back). Used when a guest is removed or
// their number changes, so nothing reaches a dead link or an old number.
async function cancelQueuedFor(inviteId: string, guestId: string): Promise<number> {
  const { data } = await getSupabaseAdmin()
    .from("guest_messages")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("invite_id", inviteId)
    .eq("guest_id", guestId)
    .eq("status", "queued")
    .select("id");
  return data?.length ?? 0;
}

const NOT_AVAILABLE = "Your guest list isn't available right now. Please reopen it from your dashboard link.";
const TOO_FAST = "That's a lot of changes at once — please wait a minute and try again.";

export async function addGuest(token: string, raw: Partial<GuestInput>): Promise<GuestActionResult> {
  const inviteId = await liveInviteId(token);
  if (!inviteId) return { error: NOT_AVAILABLE };
  if (!(await allowed(token))) return { error: TOO_FAST };

  const checked = checkGuest(raw ?? {});
  if ("error" in checked) return { error: checked.error };
  if ((await guestCount(inviteId)) >= MAX_GUESTS_PER_INVITE) {
    return { error: `Your list already has the maximum of ${MAX_GUESTS_PER_INVITE} guests.` };
  }

  const { error } = await getSupabaseAdmin()
    .from("guests")
    .insert({ invite_id: inviteId, ...checked.guest, token: newGuestToken() });
  if (error) {
    if (error.code === "23505") return { error: "This number is already on your list." };
    console.error("addGuest: insert failed", error);
    return { error: "Couldn't add this guest — please try again." };
  }
  done(token);
  return { ok: true };
}

// A spreadsheet or a set of picked contacts. Rows with problems (and numbers
// already on the list, or repeated in the file) are skipped and reported by
// line; the rest are added together.
export async function importGuests(token: string, rows: Partial<GuestInput>[]): Promise<ImportResult> {
  const inviteId = await liveInviteId(token);
  if (!inviteId) return { error: NOT_AVAILABLE };
  if (!(await allowed(token, "import"))) return { error: TOO_FAST };
  if (!Array.isArray(rows) || rows.length === 0) return { error: "There are no guests to add." };
  if (rows.length > MAX_GUESTS_PER_INVITE) {
    return { error: `That's more than ${MAX_GUESTS_PER_INVITE} guests — split the file or remove some rows.` };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: existing } = await supabaseAdmin.from("guests").select("phone").eq("invite_id", inviteId);
  const taken = new Set((existing ?? []).map((g) => g.phone));
  const room = MAX_GUESTS_PER_INVITE - taken.size;

  const skipped: { line: number; reason: string }[] = [];
  const toAdd: (GuestInput & { invite_id: string; token: string })[] = [];
  rows.forEach((raw, i) => {
    const line = i + 1;
    const checked = checkGuest(raw ?? {});
    if ("error" in checked) return skipped.push({ line, reason: checked.error });
    if (taken.has(checked.guest.phone)) return skipped.push({ line, reason: "This number is already on your list." });
    if (toAdd.length >= room) {
      return skipped.push({ line, reason: `Your list is full (${MAX_GUESTS_PER_INVITE} guests).` });
    }
    taken.add(checked.guest.phone);
    toAdd.push({ invite_id: inviteId, ...checked.guest, token: newGuestToken() });
  });

  if (toAdd.length > 0) {
    const { error } = await supabaseAdmin.from("guests").insert(toAdd);
    if (error) {
      console.error("importGuests: insert failed", error);
      return { error: "Couldn't add these guests — please try again." };
    }
  }
  done(token);
  return { ok: true, added: toAdd.length, skipped };
}

export async function updateGuest(token: string, guestId: string, raw: Partial<GuestInput>): Promise<GuestActionResult> {
  const inviteId = await liveInviteId(token);
  if (!inviteId) return { error: NOT_AVAILABLE };
  if (!(await allowed(token))) return { error: TOO_FAST };

  const checked = checkGuest(raw ?? {});
  if ("error" in checked) return { error: checked.error };

  const supabaseAdmin = getSupabaseAdmin();
  const { data: before } = await supabaseAdmin
    .from("guests")
    .select("phone")
    .eq("id", String(guestId))
    .eq("invite_id", inviteId)
    .maybeSingle();
  const { data: guest, error } = await supabaseAdmin
    .from("guests")
    .update(checked.guest)
    .eq("id", String(guestId))
    .eq("invite_id", inviteId)
    .select("id")
    .maybeSingle();
  if (error?.code === "23505") return { error: "Another guest already has this number." };
  if (error || !guest) {
    if (error) console.error("updateGuest: failed", error);
    return { error: "Couldn't save this guest — please try again." };
  }

  const notes: string[] = [];
  // A new number: anything still queued would go to the old one. The
  // dashboard only counts messages sent to the current number, so the guest
  // shows as "Not sent" until the host sends to the new number.
  if (before && before.phone !== checked.guest.phone) {
    const stopped = await cancelQueuedFor(inviteId, guest.id);
    notes.push(
      `${checked.guest.name}'s number changed${stopped ? " and the message waiting to go to the old number was stopped" : ""}. Send their invitation again to reach the new number.`
    );
  }

  // A reply keeps the name it was given at the time: keep it in step, so
  // the Messages tab and exports show the guest's current name.
  await supabaseAdmin.from("rsvps").update({ guest_name: checked.guest.name }).eq("guest_id", guest.id);

  // Fewer seats than an existing "yes": bring the reply down to fit.
  const { data: reply } = await supabaseAdmin
    .from("rsvps")
    .select("id, attending, guest_count")
    .eq("guest_id", guest.id)
    .maybeSingle();
  if (reply?.attending && (reply.guest_count ?? 0) > checked.guest.seats) {
    await supabaseAdmin
      .from("rsvps")
      .update({ guest_count: checked.guest.seats, updated_at: new Date().toISOString() })
      .eq("id", reply.id);
    notes.push(`${checked.guest.name} had replied for ${reply.guest_count}; their reply is now ${checked.guest.seats} to match the seats.`);
  }

  done(token);
  return { ok: true, note: notes.length ? notes.join(" ") : undefined };
}

// Removes several guests at once (the selection bar). Same as deleteGuest for
// each: their queued messages are stopped first, their links stop working,
// and any replies stay under "Earlier replies".
export async function deleteGuests(token: string, guestIds: string[]): Promise<{ error: string } | { ok: true; removed: number }> {
  const inviteId = await liveInviteId(token);
  if (!inviteId) return { error: NOT_AVAILABLE };
  if (!(await allowed(token))) return { error: TOO_FAST };
  const ids = Array.isArray(guestIds) ? [...new Set(guestIds.map(String))].slice(0, MAX_GUESTS_PER_INVITE) : [];
  if (ids.length === 0) return { error: "Choose at least one guest." };

  for (const id of ids) await cancelQueuedFor(inviteId, id);
  const { data, error } = await getSupabaseAdmin()
    .from("guests")
    .delete()
    .eq("invite_id", inviteId)
    .in("id", ids)
    .select("id");
  if (error) {
    console.error("deleteGuests: failed", error);
    return { error: "Couldn't remove these guests — please try again." };
  }
  done(token);
  return { ok: true, removed: data?.length ?? 0 };
}

// Removes the guest; their personal link stops working. Their reply (if any)
// is kept under "Earlier replies" without a guest attached.
export async function deleteGuest(token: string, guestId: string): Promise<GuestActionResult> {
  const inviteId = await liveInviteId(token);
  if (!inviteId) return { error: NOT_AVAILABLE };
  if (!(await allowed(token))) return { error: TOO_FAST };

  // First, so a queued invitation never goes out with a link that no longer works.
  await cancelQueuedFor(inviteId, String(guestId));
  const { error } = await getSupabaseAdmin()
    .from("guests")
    .delete()
    .eq("id", String(guestId))
    .eq("invite_id", inviteId);
  if (error) {
    console.error("deleteGuest: failed", error);
    return { error: "Couldn't remove this guest — please try again." };
  }
  done(token);
  return { ok: true };
}
