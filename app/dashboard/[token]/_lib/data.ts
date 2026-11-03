import { cache } from "react";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { DashboardGuest, DashboardInvite, DashboardRsvp, SendingState } from "./format";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The one gate for every dashboard page (the (panel) layout, each section
// and the edit screen). Reachable only by knowing the long, random
// dashboard_token. Wrapped in cache() so the layout and the page it wraps
// share a single query per request instead of each looking the token up.
export const getDashboardInvite = cache(async (token: string): Promise<DashboardInvite> => {
  const { data: invite } = await getSupabaseAdmin()
    .from("invites")
    .select(
      "id, slug, host_names, event_date, venue_name, venue_map_url, whatsapp_number, photo_urls, paid_at, status, templates(slug, name, category)"
    )
    .eq("dashboard_token", token)
    .maybeSingle();

  // Defense in depth: token possession alone isn't sufficient — an invite
  // that isn't (or is no longer) 'live' must not show RSVP data just
  // because a dashboard_token happens to resolve to it.
  if (!invite || invite.status !== "live") notFound();

  // Same defensive object-or-array shape as app/i/[slug]/page.tsx — there's
  // no generated Database type to pin the join's cardinality.
  type TemplateRow = { slug: string; name: string; category: string };
  const rel = invite.templates as TemplateRow | TemplateRow[] | null;
  const template = (Array.isArray(rel) ? rel[0] : rel) ?? null;

  return {
    id: invite.id,
    slug: invite.slug,
    host_names: invite.host_names,
    event_date: invite.event_date,
    venue_name: invite.venue_name,
    venue_map_url: invite.venue_map_url,
    whatsapp_number: invite.whatsapp_number,
    photo_urls: invite.photo_urls,
    paid_at: invite.paid_at,
    template,
  };
});

// The host's guest list, oldest first (the order they added them), each with
// their reply joined from rsvps.
export const getDashboardGuests = cache(async (inviteId: string): Promise<DashboardGuest[]> => {
  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: guests }, { data: replies }, { data: messages }] = await Promise.all([
    supabaseAdmin
      .from("guests")
      .select("id, name, phone, seats, token, first_opened_at, last_opened_at, open_count, created_at")
      .eq("invite_id", inviteId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("rsvps")
      .select("guest_id, attending, guest_count, message, created_at, updated_at")
      .eq("invite_id", inviteId)
      .not("guest_id", "is", null),
    // Newest first, so the first one seen per guest is their latest.
    supabaseAdmin
      .from("guest_messages")
      .select("guest_id, kind, status, error, created_at, sent_at")
      .eq("invite_id", inviteId)
      .in("kind", ["invite", "reminder"])
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
  ]);
  const byGuest = new Map((replies ?? []).map((r) => [r.guest_id as string, r]));
  const latestMessage = new Map<string, NonNullable<typeof messages>[number]>();
  for (const m of messages ?? []) {
    if (m.guest_id && !latestMessage.has(m.guest_id)) latestMessage.set(m.guest_id, m);
  }
  return (guests ?? []).map((g) => {
    const r = byGuest.get(g.id);
    const m = latestMessage.get(g.id);
    return {
      ...g,
      delivery: m
        ? {
            kind: m.kind as "invite" | "reminder",
            status: m.status as NonNullable<DashboardGuest["delivery"]>["status"],
            error: m.error ?? null,
            at: m.sent_at ?? m.created_at,
          }
        : null,
      reply: r
        ? {
            attending: r.attending,
            guest_count: r.guest_count ?? 0,
            message: r.message ?? null,
            replied_at: r.updated_at ?? r.created_at,
            changed: Boolean(r.updated_at),
          }
        : null,
    };
  });
});

export async function getSendingState(inviteId: string): Promise<SendingState> {
  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: invite }, { count }, { data: status }] = await Promise.all([
    supabaseAdmin.from("invites").select("send_consent_at").eq("id", inviteId).maybeSingle(),
    supabaseAdmin
      .from("guest_messages")
      .select("id", { count: "exact", head: true })
      .eq("invite_id", inviteId)
      .in("status", ["queued", "sending"])
      .in("kind", ["invite", "reminder"]),
    supabaseAdmin.from("whatsapp_status").select("status").eq("id", 1).maybeSingle(),
  ]);
  return {
    consented: Boolean(invite?.send_consent_at),
    pending: count ?? 0,
    whatsapp: status?.status ?? "unknown",
  };
}

// Replies sent through the general link before guest lists existed (no guest
// attached). Kept so hosts don't lose them.
export const getEarlierRsvps = cache(async (inviteId: string): Promise<DashboardRsvp[]> => {
  const { data } = await getSupabaseAdmin()
    .from("rsvps")
    .select("id, guest_name, attending, guest_count, message, created_at")
    .eq("invite_id", inviteId)
    .is("guest_id", null)
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getDashboardRsvps = cache(async (inviteId: string): Promise<DashboardRsvp[]> => {
  const { data } = await getSupabaseAdmin()
    .from("rsvps")
    .select("id, guest_name, attending, guest_count, message, created_at")
    .eq("invite_id", inviteId)
    .order("created_at", { ascending: false });
  return data ?? [];
});
