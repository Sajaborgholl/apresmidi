import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendInviteReadyEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The single trusted entry point for "a real payment was verified for this
// invite." This function does NOT talk to Whish itself — it trusts its caller
// completely, so every caller must have verified the payment first. Today
// that's app/api/whish/callback/route.ts (only after getWhishPaymentStatus
// reports "success") and the dev-only "Simulate payment success" button on
// the confirmation page.
//
// Deliberately NOT in a "use server" file: every export of one of those
// becomes a Server Action, i.e. an endpoint anyone can POST to with its ID.
// This lives in a plain module instead, so it has no endpoint at all, and
// "server-only" makes the build fail if it's ever imported into client code.
//
// Must never be reachable via a GET route/query param the customer's own
// browser can trigger unauthenticated (e.g. never "if success=true in the
// URL, call this") — a webhook needs its own signature check first, and a
// redirect-back flow needs a server-side status lookup against Whish,
// never just trusting what the redirect URL claims.
//
// Idempotent, including under concurrency: safe to call more than once for
// the same invite, even at the same moment (Whish retrying a slow callback).
// The flip to 'live' is a single conditional UPDATE, so exactly one call
// wins it; only that call sends the email, and every call returns the one
// dashboard_token that was actually saved. (It used to read, then write a
// fresh random token — two overlapping calls each saved and emailed their
// own token, and the overwritten one's emailed link 404'd.)
export async function confirmInvitePayment(
  inviteSlug: string
): Promise<{ dashboardUrl: string; guestUrl: string }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("id, owner_email, dashboard_token")
    .eq("slug", inviteSlug)
    .single();

  if (!invite) {
    throw new Error(`confirmInvitePayment: no invite found for slug "${inviteSlug}"`);
  }

  // createOrder sets dashboard_token up front; this fallback only covers
  // invites created before it did.
  const { data: flipped, error: flipError } = await supabaseAdmin
    .from("invites")
    .update({
      status: "live",
      dashboard_token: invite.dashboard_token ?? randomUUID(),
      paid_at: new Date().toISOString(),
    })
    .eq("id", invite.id)
    // "Not confirmed yet". Postgres re-checks this on the latest row version
    // when two UPDATEs race, so the second one matches nothing.
    .or("status.neq.live,dashboard_token.is.null")
    .select("dashboard_token");

  if (flipError) {
    // Thrown, not swallowed: the callback answers 500, so Whish can retry.
    throw new Error(`confirmInvitePayment: could not mark "${inviteSlug}" paid: ${flipError.message}`);
  }

  const wonFlip = (flipped?.length ?? 0) > 0;
  let dashboardToken: string | null = flipped?.[0]?.dashboard_token ?? null;

  if (!wonFlip) {
    // Already confirmed (by an earlier or concurrent call) — use its token.
    const { data: current } = await supabaseAdmin
      .from("invites")
      .select("dashboard_token")
      .eq("id", invite.id)
      .single();
    dashboardToken = current?.dashboard_token ?? null;
  }

  const guestUrl = `${BASE_URL}/i/${inviteSlug}`;
  const dashboardUrl = `${BASE_URL}/dashboard/${dashboardToken}`;

  if (wonFlip) {
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
