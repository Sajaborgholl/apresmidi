"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug } from "@/lib/templates/registry";
import { slugify } from "./_lib/slugify";
import { redirect } from "next/navigation";

// Runs when the intake form on /order/[slug] is submitted. Creates the
// invite as a DRAFT (not publicly visible — the "public read live invites"
// RLS policy only allows status = 'live'). It only flips to 'live' once
// payment succeeds, which isn't wired up yet. That's what makes it safe to
// let people fill this out before the Whish/Tap integration exists.
export async function createOrder(templateSlug: string, formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const hostNames = String(formData.get("host_names") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const venueName = String(formData.get("venue_name") ?? "").trim();
  const venueMapUrl = String(formData.get("venue_map_url") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();

  if (!hostNames) {
    throw new Error("Host names are required.");
  }

  const { data: template } = await supabaseAdmin
    .from("templates")
    .select("id")
    .eq("slug", templateSlug)
    .single();

  if (!template) {
    throw new Error("Template not found.");
  }

  // Build a unique invite slug from the host names ("Sarah & Karim" ->
  // "sarah-karim"), adding a numeric suffix if that slug is already taken.
  const baseSlug = slugify(hostNames) || "invite";
  let inviteSlug = baseSlug;
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from("invites")
      .select("id")
      .eq("slug", inviteSlug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    inviteSlug = `${baseSlug}-${attempt}`;
  }

  // Upload any photos that came with the submission (CustomizeForm names
  // them photo_1, photo_2, ... up to the template's manifest photoCount).
  // Uploaded to the invite-photos bucket from setup-photo-storage.sql.
  // Position is preserved with "" for any slot that's empty or fails to
  // upload, since templates read photos by fixed index (photo_urls[0],
  // [1], [2]) and skipping a slot shouldn't shift the ones after it.
  const registryEntry = getTemplateBySlug(templateSlug);
  const photoCount = registryEntry?.fields.photoCount ?? 0;
  const photoUrls: string[] = [];

  for (let i = 1; i <= photoCount; i++) {
    const file = formData.get(`photo_${i}`);
    let url = "";

    if (file instanceof File && file.size > 0) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${inviteSlug}-${i}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("invite-photos")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });

      if (!uploadError) {
        url = supabaseAdmin.storage.from("invite-photos").getPublicUrl(path).data.publicUrl;
      }
    }

    photoUrls.push(url);
  }

  await supabaseAdmin.from("invites").insert({
    slug: inviteSlug,
    template_id: template.id,
    host_names: hostNames,
    event_date: eventDate || null,
    venue_name: venueName || null,
    venue_map_url: venueMapUrl || null,
    whatsapp_number: whatsappNumber || null,
    photo_urls: photoUrls.length > 0 ? photoUrls : null,
    status: "draft",
  });

  redirect(`/order/${templateSlug}/confirmation?invite=${inviteSlug}`);
}
