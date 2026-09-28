"use server";

import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug } from "@/lib/templates/registry";
import { buildWhatsappNumber } from "@/lib/types";
import { dialCodeForCountry } from "@/lib/countryCodes";
import { uploadInvitePhotos } from "@/lib/invitePhotos";

// Saves the dashboard's "Edit invitation" screen (the customize page reused
// in edit mode). Authorized by the dashboard_token alone, same as every
// dashboard page, and only for invites that are 'live'.
//
// Only invite *content* columns are written. The slug is deliberately never
// touched, even when host names change, so the guest link the host already
// shared keeps working; status/token/owner_email/paid_at are off limits too.
//
// Same (unused) _prevState shape as createOrder so it fits useActionState.
export async function updateInvite(token: string, _prevState: unknown, formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("id, slug, status, photo_urls, templates(slug)")
    .eq("dashboard_token", token)
    .maybeSingle();

  if (!invite || invite.status !== "live") {
    throw new Error("Invite not found.");
  }

  const hostNames = String(formData.get("host_names") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const venueName = String(formData.get("venue_name") ?? "").trim();
  const venueMapUrl = String(formData.get("venue_map_url") ?? "").trim();
  const whatsappCountry = String(formData.get("whatsapp_country") ?? "").trim();
  const whatsappNumber = buildWhatsappNumber(
    dialCodeForCountry(whatsappCountry),
    String(formData.get("whatsapp_number") ?? "")
  );

  const rel = invite.templates as { slug: string } | { slug: string }[] | null;
  const templateSlug = Array.isArray(rel) ? rel[0]?.slug : rel?.slug;
  const fields = getTemplateBySlug(templateSlug)?.fields;

  if (fields?.host_names && !hostNames) {
    throw new Error("Host names are required.");
  }

  const update: Record<string, unknown> = {};
  // Only fields this template's manifest actually shows are written, so a
  // field the form never rendered (and so never submitted) can't be wiped.
  if (fields?.host_names) update.host_names = hostNames;
  if (fields?.event_date) update.event_date = eventDate || null;
  if (fields?.venue_name) update.venue_name = venueName || null;
  if (fields?.venue_map_url) update.venue_map_url = venueMapUrl || null;
  if (fields?.whatsapp_number) update.whatsapp_number = whatsappNumber;
  if (fields && fields.photoCount > 0) {
    const photoUrls = await uploadInvitePhotos(supabaseAdmin, formData, invite.slug, fields.photoCount, {
      existing: invite.photo_urls ?? [],
      versioned: true,
    });
    update.photo_urls = photoUrls;
  }

  const { error } = await supabaseAdmin.from("invites").update(update).eq("id", invite.id);
  if (error) {
    throw new Error(`Could not save your changes: ${error.message}`);
  }

  redirect(`/dashboard/${token}?saved=1`);
}
