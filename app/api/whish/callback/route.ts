import { NextRequest, NextResponse } from "next/server";
import { getWhishPaymentStatus } from "@/lib/whish";
import { confirmInvitePayment } from "@/app/order/[slug]/actions";

// Whish hits this as an unauthenticated GET when a payment attempt settles
// (success or failure — see successCallbackUrl/failureCallbackUrl in
// startWhishPayment). Exactly because it's unauthenticated, this route
// never trusts that it was even called for a real success — it always
// re-asks Whish for the actual status before doing anything, and only
// confirmInvitePayment()s on a genuine "success".
export async function GET(req: NextRequest) {
  const inviteSlug = req.nextUrl.searchParams.get("invite");
  if (!inviteSlug) {
    return NextResponse.json({ error: "missing invite" }, { status: 400 });
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
