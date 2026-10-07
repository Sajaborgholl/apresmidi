import { NextRequest, NextResponse } from "next/server";
import { getWhishPaymentStatus } from "@/lib/whish";
import { confirmInvitePayment } from "@/lib/payments";
import { getSupabaseAdmin } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Whish hits this as an unauthenticated GET when a payment attempt settles
// (success or failure — see successCallbackUrl/failureCallbackUrl in
// startWhishPayment). Exactly because it's unauthenticated, this route
// never trusts that it was even called for a real success — it always
// re-asks Whish for the actual status before doing anything, and only
// confirmInvitePayment()s on a genuine "success".
//
// Because anyone can call it, it also refuses to be a free way to make this
// server call Whish's API: only a real, still-unpaid invite gets a status
// check, and callers are rate limited per IP. Whish itself calls this once
// or twice per payment, nowhere near the limit.
export async function GET(req: NextRequest) {
  const inviteSlug = req.nextUrl.searchParams.get("invite");
  if (!inviteSlug) {
    return NextResponse.json({ error: "missing invite" }, { status: 400 });
  }

  if (!(await rateLimit("whish-callback", await clientIp(req.headers), 60, 60))) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const { data: invite } = await getSupabaseAdmin()
    .from("invites")
    .select("status")
    .eq("slug", inviteSlug)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "unknown invite" }, { status: 404 });
  }
  // Already confirmed (an earlier callback, or a retry of this one): nothing
  // to check or change.
  if (invite.status === "live") {
    return NextResponse.json({ ok: true, collectStatus: "success" });
  }

  try {
    const { collectStatus } = await getWhishPaymentStatus({ externalId: inviteSlug, currency: "USD" });
    if (collectStatus === "success") {
      await confirmInvitePayment(inviteSlug);
    }
    return NextResponse.json({ ok: true, collectStatus });
  } catch (err) {
    console.error("whish callback: status check failed", err);
    return NextResponse.json({ error: "status check failed" }, { status: 500 });
  }
}
