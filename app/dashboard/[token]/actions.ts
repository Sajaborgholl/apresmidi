"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseWallClock } from "@/lib/calendar";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug } from "@/lib/templates/registry";
import type { FormState } from "@/lib/types";
import { readInviteFields } from "@/lib/inviteFields";
import { PhotoError, missingPhotoSlots, uploadInvitePhotos } from "@/lib/invitePhotos";

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
// `returnTo` is the dashboard tab the host opened the editor from, so saving
// lands them back where they were.
export type EditReturnTo = "overview" | "invitation";

export async function updateInvite(token: string, returnTo: EditReturnTo, _prevState: FormState, formData: FormData): Promise<FormState> {
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
  redirect(`/dashboard/${token}${returnTo === "invitation" ? "/invitation" : ""}?saved=1`);
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
  const { hostNames, eventDate, venueName, venueMapUrl, dressCode, guestMessage, highlights } = read.fields;

  const rel = invite.templates as { slug: string } | { slug: string }[] | null;
  const templateSlug = Array.isArray(rel) ? rel[0]?.slug : rel?.slug;
  const fields = getTemplateBySlug(templateSlug)?.fields;

  if (fields?.host_names && !hostNames) {
    throw new EditInputError("Please enter the host names.");
  }
  // Same rules as a new order: a date, and every photo slot filled (a new
  // file or the one already saved).
  if (fields?.event_date && !eventDate) {
    throw new EditInputError("Please choose the event date and time.");
  }
  const missing = missingPhotoSlots(formData, fields?.photoCount ?? 0, invite.photo_urls ?? []);
  if (missing.length > 0) {
    throw new EditInputError(`Please add ${missing.length === 1 ? "the missing photo" : "all the photos"} (photo ${missing.join(", ")}).`);
  }

  const update: Record<string, unknown> = {};
  // Only fields this template's manifest actually shows are written, so a
  // field the form never rendered (and so never submitted) can't be wiped.
  if (fields?.host_names) update.host_names = hostNames;
  if (fields?.event_date) update.event_date = eventDate;
  if (fields?.venue_name) update.venue_name = venueName;
  if (fields?.venue_map_url) update.venue_map_url = venueMapUrl;
  if (fields?.dress_code) update.dress_code = dressCode;
  if (fields?.guest_message) update.guest_message = guestMessage;
  if (fields?.highlights) update.highlights = highlights;
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

// The host's reply deadline (the Invitation tab): replies close after that
// day, and sending stops. `date` is "YYYY-MM-DD", or null to remove it. It
// can't be in the past, nor after the event's day.
export async function setReplyDeadline(token: string, date: string | null): Promise<{ error: string } | { ok: true }> {
  if (typeof token !== "string" || !token) return { error: "Please reopen your dashboard link." };
  const supabaseAdmin = getSupabaseAdmin();
  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("id, status, event_date")
    .eq("dashboard_token", token)
    .maybeSingle();
  if (!invite || invite.status !== "live") return { error: "Please reopen your dashboard link." };

  let value: string | null = null;
  if (date) {
    const m = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const day = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
    if (!m || Number.isNaN(day) || new Date(day).toISOString().slice(0, 10) !== date) {
      return { error: "Please choose a valid date." };
    }
    const now = new Date();
    if (day < Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) {
      return { error: "The deadline can't be in the past." };
    }
    const event = parseWallClock(invite.event_date);
    if (event && day > Date.UTC(event.year, event.month - 1, event.day)) {
      return { error: "The deadline must be on or before your event day." };
    }
    value = date;
  }

  const { error } = await supabaseAdmin.from("invites").update({ reply_by: value }).eq("id", invite.id);
  if (error) {
    console.error("setReplyDeadline: failed", error);
    return { error: "Couldn't save the deadline — please try again." };
  }
  revalidatePath(`/dashboard/${token}`, "layout");
  return { ok: true };
}
