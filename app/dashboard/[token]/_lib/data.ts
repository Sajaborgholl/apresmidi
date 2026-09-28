import { cache } from "react";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { DashboardInvite, DashboardRsvp } from "./format";

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

export const getDashboardRsvps = cache(async (inviteId: string): Promise<DashboardRsvp[]> => {
  const { data } = await getSupabaseAdmin()
    .from("rsvps")
    .select("id, guest_name, attending, guest_count, message, created_at")
    .eq("invite_id", inviteId)
    .order("created_at", { ascending: false });
  return data ?? [];
});
