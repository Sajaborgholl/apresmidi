"use server";

import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug } from "@/lib/templates/registry";
import type { FormState } from "@/lib/types";
import { readInviteFields } from "@/lib/inviteFields";
import { PhotoError, uploadInvitePhotos } from "@/lib/invitePhotos";

// Saves the dashboard's "Edit invitation" screen (the customize page reused
// in edit mode). Authorized by the dashboard_token alone, same as every
// dashboard page, and only for invites that are 'live'.
//
// Only invite *content* columns are written. The slug is deliberately never
// touched, even when host names change, so the guest link the host already
// shared keeps working; status/token/owner_email/paid_at are off limits too.
//
// Same shape as createOrder: fits useActionState, redirects on success, and
// RETURNS { error } on failure so the edit screen keeps the host's changes
// and shows the message above the form.
export async function updateInvite(token: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    await saveInviteChanges(token, formData);
  } catch (err) {
    if (err instanceof EditInputError || err instanceof PhotoError) {
      return { error: err.message };
    }
    console.error("updateInvite: failed", err);
    return { error: "Something went wrong saving your changes — please try again." };
  }

  // Outside the try: redirect() works by throwing, and must not be caught.
  redirect(`/dashboard/${token}?saved=1`);
}

// Something wrong with what the host submitted; its message is shown as-is.
class EditInputError extends Error {}

async function saveInviteChanges(token: string, formData: FormData): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("id, slug, status, photo_urls, templates(slug)")
    .eq("dashboard_token", token)
    .maybeSingle();

  if (!invite || invite.status !== "live") {
    throw new EditInputError("This invite can't be edited right now. Please reopen it from your dashboard link.");
  }

  // Same size/format rules as a new order: lib/inviteFields.ts.
  const read = readInviteFields(formData);
  if ("error" in read) {
    throw new EditInputError(read.error);
  }
  const { hostNames, eventDate, venueName, venueMapUrl, whatsappNumber } = read.fields;

  const rel = invite.templates as { slug: string } | { slug: string }[] | null;
  const templateSlug = Array.isArray(rel) ? rel[0]?.slug : rel?.slug;
  const fields = getTemplateBySlug(templateSlug)?.fields;

  if (fields?.host_names && !hostNames) {
    throw new EditInputError("Please enter the host names.");
  }

  const update: Record<string, unknown> = {};
  // Only fields this template's manifest actually shows are written, so a
  // field the form never rendered (and so never submitted) can't be wiped.
  if (fields?.host_names) update.host_names = hostNames;
  if (fields?.event_date) update.event_date = eventDate;
  if (fields?.venue_name) update.venue_name = venueName;
  if (fields?.venue_map_url) update.venue_map_url = venueMapUrl;
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
}
