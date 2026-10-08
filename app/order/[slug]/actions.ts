"use server";

import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug } from "@/lib/templates/registry";
import { slugify } from "./_lib/slugify";
import { redirect } from "next/navigation";
import { createWhishPayment } from "@/lib/whish";
import type { FormState } from "@/lib/types";
import { readInviteFields } from "@/lib/inviteFields";
import { EMAIL_PATTERN, MAX_LENGTH } from "@/lib/validation";
import { PhotoError, uploadInvitePhotos } from "@/lib/invitePhotos";
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
// take a few seconds).
//
// Success redirects to the confirmation page. Every failure RETURNS
// { error } instead of throwing, so the customize page shows it above the
// form with everything the customer typed and picked still in place —
// a thrown error would replace the whole page with the error screen.
export async function createOrder(templateSlug: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  // Checked before anything is uploaded: each order can carry up to 3 photos.
  if (!(await rateLimit("create-order", await clientIp(), 10, 60 * 60))) {
    return { error: "Too many orders from your connection — please try again in an hour." };
  }

  let orderToken: string;
  try {
    orderToken = await saveDraftInvite(templateSlug, formData);
  } catch (err) {
    if (err instanceof OrderInputError || err instanceof PhotoError) {
      return { error: err.message };
    }
    console.error("createOrder: failed", err);
    return { error: "Something went wrong saving your invite — please try again." };
  }

  // Outside the try: redirect() works by throwing, and must not be caught.
  redirect(`/order/${templateSlug}/confirmation?order=${orderToken}`);
}

// Something wrong with what the customer submitted. Like PhotoError, its
// message is written for them and shown as-is.
class OrderInputError extends Error {}

// Validates the submission, uploads its photos and inserts the draft invite.
// Returns the new invite's order_token.
async function saveDraftInvite(templateSlug: string, formData: FormData): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  // Sizes and formats (map link, date, WhatsApp…): lib/inviteFields.ts.
  const read = readInviteFields(formData);
  if ("error" in read) {
    throw new OrderInputError(read.error);
  }
  const { hostNames, eventDate, venueName, venueMapUrl, whatsappNumber } = read.fields;
  const ownerEmail = String(formData.get("owner_email") ?? "").trim();

  if (!hostNames) {
    throw new OrderInputError("Please enter the host names.");
  }
  // Deliberately simple format check — full deliverability validation
  // (e.g. a verification email) is out of scope here.
  if (!ownerEmail || ownerEmail.length > MAX_LENGTH.email || !EMAIL_PATTERN.test(ownerEmail)) {
    throw new OrderInputError("Please enter a valid email address.");
  }

  const { data: template } = await supabaseAdmin
    .from("templates")
    .select("id")
    .eq("slug", templateSlug)
    .single();

  if (!template) {
    throw new OrderInputError("This design isn't available anymore — please pick another one.");
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
    event_date: eventDate,
    venue_name: venueName,
    venue_map_url: venueMapUrl,
    whatsapp_number: whatsappNumber,
    photo_urls: photoUrls.length > 0 ? photoUrls : null,
    status: "draft",
  });

  // Surfacing this matters: a silent failure here (e.g. schema drift, a
  // migration not yet applied) would otherwise redirect to a confirmation
  // page for an invite that was never actually created, which just 404s
  // with no indication why. The real message is logged by createOrder;
  // the customer gets a generic one.
  if (insertError) {
    throw new Error(`Could not create invite: ${insertError.message}`);
  }

  return orderToken;
}

// Marking an invite paid (confirmInvitePayment) deliberately does NOT live in
// this file: every export here is a Server Action anyone can POST to. It's in
// lib/payments.ts, a server-only module with no endpoint.

// Must match the $80 the customer is shown before paying: the confirmation
// page's "Pay with Whish — $80" button and the Standard plan in Pricing.tsx.
// There's only the one Standard price point right now, nothing per-template.
const STANDARD_PRICE_USD = "80.00";

export type StartPaymentResult = { collectUrl: string } | { error: "rate-limited" | "already-paid" | "failed" };

// Kicks off a real Whish payment and returns the hosted collectUrl to send
// the customer's browser to. Does NOT mark the invite paid — Whish's
// callback (app/api/whish/callback/route.ts) is what eventually calls
// confirmInvitePayment, and only after independently re-checking status.
//
// Returns an error code instead of throwing, so the confirmation page can
// show the customer what happened rather than the error screen.
export async function startWhishPayment(templateSlug: string, inviteSlug: string): Promise<StartPaymentResult> {
  // Each call is an outbound request to Whish's API.
  if (!(await rateLimit("start-payment", await clientIp(), 10, 10 * 60))) {
    return { error: "rate-limited" };
  }

  try {
    return await requestWhishPayment(templateSlug, inviteSlug);
  } catch (err) {
    console.error("startWhishPayment: failed", err);
    return { error: "failed" };
  }
}

async function requestWhishPayment(templateSlug: string, inviteSlug: string): Promise<StartPaymentResult> {
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
    return { error: "already-paid" };
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

  return { collectUrl };
}
