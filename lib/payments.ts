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
