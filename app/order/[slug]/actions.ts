"use server";

import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug } from "@/lib/templates/registry";
import { slugify } from "./_lib/slugify";
import { redirect } from "next/navigation";
import { createWhishPayment } from "@/lib/whish";
import { buildWhatsappNumber } from "@/lib/types";
import { dialCodeForCountry } from "@/lib/countryCodes";
import { uploadInvitePhotos } from "@/lib/invitePhotos";
import { clientIp, rateLimit } from "@/lib/rateLimit";

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
// confirmInvitePayment (lib/payments.ts), once payment succeeds.
//
// Takes an (unused) _prevState param purely so it fits useActionState's
// (prevState, formData) => ... contract — CustomizePanel.tsx binds
// `templateSlug` and reads back `isPending` to disable/label the
// "Continue to payment" button while this is running (photo uploads can
// take a few seconds). It never actually returns a state: every path
// either throws or calls redirect().
export async function createOrder(templateSlug: string, _prevState: unknown, formData: FormData) {
  // Checked before anything is uploaded: each order can carry up to 3 photos.
  if (!(await rateLimit("create-order", await clientIp(), 10, 60 * 60))) {
    throw new Error("Too many orders from your connection — please try again in an hour.");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const hostNames = String(formData.get("host_names") ?? "").trim();
  const ownerEmail = String(formData.get("owner_email") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const venueName = String(formData.get("venue_name") ?? "").trim();
  const venueMapUrl = String(formData.get("venue_map_url") ?? "").trim();
  const whatsappCountry = String(formData.get("whatsapp_country") ?? "").trim();
  const whatsappNumber = buildWhatsappNumber(
    dialCodeForCountry(whatsappCountry),
    String(formData.get("whatsapp_number") ?? "")
  );

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

  // Upload any photos that came with the submission — see
  // lib/invitePhotos.ts for the slot/position rules.
  const registryEntry = getTemplateBySlug(templateSlug);
  const photoCount = registryEntry?.fields.photoCount ?? 0;
  const photoUrls = await uploadInvitePhotos(supabaseAdmin, formData, inviteSlug, photoCount);

  // The confirmation page's private reference — never the slug, which is the
  // public guest link. See supabase/add-order-token.sql.
  const orderToken = randomUUID();

  const { error: insertError } = await supabaseAdmin.from("invites").insert({
    slug: inviteSlug,
    order_token: orderToken,
    // Created now, not at payment time, so every confirmation of this order
    // (including duplicate callbacks) emails the same, working link. Safe on
    // a draft: the dashboard only opens for live invites.
    dashboard_token: randomUUID(),
    template_id: template.id,
    host_names: hostNames,
    owner_email: ownerEmail,
    event_date: eventDate || null,
    venue_name: venueName || null,
    venue_map_url: venueMapUrl || null,
    whatsapp_number: whatsappNumber,
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

  redirect(`/order/${templateSlug}/confirmation?order=${orderToken}`);
}

// Marking an invite paid (confirmInvitePayment) deliberately does NOT live in
// this file: every export here is a Server Action anyone can POST to. It's in
// lib/payments.ts, a server-only module with no endpoint.

// Must match the $80 the customer is shown before paying: the confirmation
// page's "Pay with Whish — $80" button and the Standard plan in Pricing.tsx.
// There's only the one Standard price point right now, nothing per-template.
const STANDARD_PRICE_USD = "80.00";

// Kicks off a real Whish payment and returns the hosted collectUrl to send
// the customer's browser to. Does NOT mark the invite paid — Whish's
// callback (app/api/whish/callback/route.ts) is what eventually calls
// confirmInvitePayment, and only after independently re-checking status.
export async function startWhishPayment(
  templateSlug: string,
  inviteSlug: string
): Promise<string> {
  // Each call is an outbound request to Whish's API.
  if (!(await rateLimit("start-payment", await clientIp(), 10, 10 * 60))) {
    throw new Error("Too many payment attempts — please wait a few minutes and try again.");
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("status, order_token")
    .eq("slug", inviteSlug)
    .single();

  if (!invite) {
    throw new Error(`startWhishPayment: no invite found for slug "${inviteSlug}"`);
  }
  if (invite.status === "live") {
    throw new Error("This invite has already been paid for.");
  }

  // Path form, not ?order=…: Whish's browser redirect drops query strings,
  // which left customers on a bare /confirmation page that 404'd. See
  // confirmation/[invite]/[[...result]]/page.tsx, which turns this back into
  // the query form. (The server-to-server callbacks below keep their query
  // strings — Whish documents that it forwards those unchanged.)
  // The customer returns with their private order_token, so the page can
  // show them their dashboard link. Invites created before order_token
  // existed fall back to the slug, which gets the "check your email" view.
  const returnRef = invite.order_token ?? inviteSlug;
  const confirmationUrl = `${BASE_URL}/order/${templateSlug}/confirmation/${encodeURIComponent(returnRef)}`;

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
    // "result=processing" distinguishes "just got redirected back from
    // Whish, waiting on its webhook to actually confirm the payment" from
    // a customer's first-ever visit to this page (which hasn't attempted
    // payment yet) — see app/order/[slug]/confirmation/page.tsx, where
    // this shows a "Confirming your payment…" state instead of the normal
    // pick-a-payment-method one, without changing how fast AutoRefresh
    // itself polls for the real status flip.
    successRedirectUrl: `${confirmationUrl}/processing`,
    failureRedirectUrl: `${confirmationUrl}/failure`,
  });

  return collectUrl;
}
