import "server-only";
import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { InviteGuest } from "@/lib/guestRules";

// A guest's personal-link secret: 128 random bits, base64url (22 chars).
export function newGuestToken(): string {
  return randomBytes(16).toString("base64url");
}

// Only well-formed tokens reach the database.
export function isGuestToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{22}$/.test(token);
}

// The guest behind a personal link, with their reply, as a template needs
// it. Null if the token is unknown or belongs to another invite, so a token
// can't be replayed against a different invitation's slug.
export async function getInviteGuest(inviteId: string, token: string): Promise<InviteGuest | null> {
  if (!isGuestToken(token)) return null;
  const supabaseAdmin = getSupabaseAdmin();
  const { data: guest } = await supabaseAdmin
    .from("guests")
    .select("id, invite_id, name, seats, token")
    .eq("token", token)
    .maybeSingle();
  if (!guest || guest.invite_id !== inviteId) return null;

  const { data: reply } = await supabaseAdmin
    .from("rsvps")
    .select("attending, guest_count, message")
    .eq("guest_id", guest.id)
    .maybeSingle();

  return {
    token: guest.token,
    name: guest.name,
    seats: guest.seats,
    reply: reply
      ? { attending: reply.attending, guest_count: reply.guest_count ?? 0, message: reply.message ?? null }
      : null,
  };
}
