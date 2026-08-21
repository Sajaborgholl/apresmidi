"use server";

import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug } from "@/lib/templates/registry";
import { slugify } from "./_lib/slugify";
import { redirect } from "next/navigation";
import { sendInviteReadyEmail } from "@/lib/email";
import { createWhishPayment } from "@/lib/whish";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 6 lowercase hex chars pulled off a UUID — 16^6 (~16.7M) combinations, no
// new dependency needed. Appended to every invite slug (not just on
// collision) so the guest link itself isn't guessable from the host names
// alone (e.g. someone trying "john-jane", "sarah-karim", etc.).
function randomSlugSuffix(): string {
  return randomUUID().replace(/-/g, "").slice(0, 6);
}

// Runs when the intake form on /order/[slug] is submitted. Creates the
// invite as a DRAFT (not publicly visible — see the status/is_demo check
// in app/i/[slug]/page.tsx). It only flips to 'live' via
// confirmInvitePayment below, once payment succeeds.
export async function createOrder(templateSlug: string, formData: FormData) {
  const supabaseAdmin = getSupabaseAdmin();

  const hostNames = String(formData.get("host_names") ?? "").trim();
  const ownerEmail = String(formData.get("owner_email") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const venueName = String(formData.get("venue_name") ?? "").trim();
  const venueMapUrl = String(formData.get("venue_map_url") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const age = ageRaw ? Number(ageRaw) : null;

  if (!hostNames) {
    throw new Error("Host names are required.");
  }
  // Deliberately simple format check — full deliverability validation
  // (e.g. a verification email) is out of scope here.
  if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    throw new Error("A valid email address is required.");
  }

  const { data: template } = await supabaseAdmin
    .from("templates")
    .select("id")
    .eq("slug", templateSlug)
    .single();

  if (!template) {
    throw new Error("Template not found.");
  }

  // Base slug from host names ("Sarah & Karim" -> "sarah-karim"), always
  // with a random suffix appended (e.g. "sarah-karim-x7k2p9") — not just as
  // a collision tiebreaker. The while-loop below is now just a cheap
  // safety net for the astronomically unlikely case of a suffix clash, not
  // the primary uniqueness mechanism.
  const baseSlug = slugify(hostNames) || "invite";
  let inviteSlug = `${baseSlug}-${randomSlugSuffix()}`;
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from("invites")
      .select("id")
      .eq("slug", inviteSlug)
      .maybeSingle();
    if (!existing) break;
    inviteSlug = `${baseSlug}-${randomSlugSuffix()}`;
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

  const { error: insertError } = await supabaseAdmin.from("invites").insert({
    slug: inviteSlug,
    template_id: template.id,
    host_names: hostNames,
    owner_email: ownerEmail,
    event_date: eventDate || null,
    venue_name: venueName || null,
    venue_map_url: venueMapUrl || null,
    whatsapp_number: whatsappNumber || null,
    age,
    photo_urls: photoUrls.length > 0 ? photoUrls : null,
    status: "draft",
  });

  // Surfacing this matters: a silent failure here (e.g. schema drift, a
  // migration not yet applied) would otherwise redirect to a confirmation
  // page for an invite that was never actually created, which just 404s
  // with no indication why.
  if (insertError) {
    throw new Error(`Could not create invite: ${insertError.message}`);
  }

  redirect(`/order/${templateSlug}/confirmation?invite=${inviteSlug}`);
}

// The single trusted entry point for "a real payment was verified for this
// invite." This function does NOT talk to Whish (or any payment provider)
// at all — that integration doesn't exist yet and is explicitly out of
// scope here. Whatever gets built later (a webhook route handler with its
// own signature verification, or a redirect-back page that independently
// re-checks payment status server-side) must call this ONLY after it has
// verified the payment itself; this function trusts its caller completely.
//
// Must never be reachable via a GET route/query param the customer's own
// browser can trigger unauthenticated (e.g. never "if success=true in the
// URL, call this") — a webhook needs its own signature check first, and a
// redirect-back flow needs a server-side status lookup against Whish,
// never just trusting what the redirect URL claims.
//
// Idempotent: safe to call more than once for the same invite (webhook
// retries, accidental double-calls) — a second call reuses the existing
// dashboard_token/paid_at and skips re-sending the email.
export async function confirmInvitePayment(
  inviteSlug: string
): Promise<{ dashboardUrl: string; guestUrl: string }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("id, owner_email, dashboard_token, status")
    .eq("slug", inviteSlug)
    .single();

  if (!invite) {
    throw new Error(`confirmInvitePayment: no invite found for slug "${inviteSlug}"`);
  }

  const alreadyConfirmed = invite.status === "live" && Boolean(invite.dashboard_token);
  const dashboardToken = invite.dashboard_token ?? randomUUID();

  if (!alreadyConfirmed) {
    await supabaseAdmin
      .from("invites")
      .update({
        status: "live",
        dashboard_token: dashboardToken,
        paid_at: new Date().toISOString(),
      })
      .eq("id", invite.id);
  }

  const guestUrl = `${BASE_URL}/i/${inviteSlug}`;
  const dashboardUrl = `${BASE_URL}/dashboard/${dashboardToken}`;

  if (!alreadyConfirmed) {
    // Never let an email failure block the payment confirmation itself —
    // the status flip above has already committed by this point.
    try {
      await sendInviteReadyEmail({ to: invite.owner_email, dashboardUrl, guestUrl });
    } catch (err) {
      console.error("confirmInvitePayment: failed to send owner email", err);
    }
  }

  return { dashboardUrl, guestUrl };
}

// Matches the fixed "$80" priceLabel shown on app/order/[slug]/page.tsx —
// there's only the one Standard price point right now, nothing per-template.
const STANDARD_PRICE_USD = "80.00";

// Kicks off a real Whish payment and returns the hosted collectUrl to send
// the customer's browser to. Does NOT mark the invite paid — Whish's
// callback (app/api/whish/callback/route.ts) is what eventually calls
// confirmInvitePayment, and only after independently re-checking status.
export async function startWhishPayment(
  templateSlug: string,
  inviteSlug: string
): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("status")
    .eq("slug", inviteSlug)
    .single();

  if (!invite) {
    throw new Error(`startWhishPayment: no invite found for slug "${inviteSlug}"`);
  }
  if (invite.status === "live") {
    throw new Error("This invite has already been paid for.");
  }

  const confirmationUrl = `${BASE_URL}/order/${templateSlug}/confirmation?invite=${encodeURIComponent(inviteSlug)}`;

  // externalId = the invite slug itself (already globally unique) — Whish
  // treats a repeated externalId as a safe retry rather than a double
  // charge, which is exactly what we want if the customer clicks "Pay"
  // again after an abandoned attempt.
  const { collectUrl } = await createWhishPayment({
    amount: STANDARD_PRICE_USD,
    currency: "USD",
    invoice: `Après-midi invite — ${inviteSlug}`,
    externalId: inviteSlug,
    successCallbackUrl: `${BASE_URL}/api/whish/callback?invite=${encodeURIComponent(inviteSlug)}`,
    failureCallbackUrl: `${BASE_URL}/api/whish/callback?invite=${encodeURIComponent(inviteSlug)}`,
    successRedirectUrl: confirmationUrl,
    failureRedirectUrl: `${confirmationUrl}&result=failure`,
  });

  return collectUrl;
}
