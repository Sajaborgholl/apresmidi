// Thin wrapper around the Whish Pay API (docs:
// https://whish-partners.pages.dev/whish-pay-9z366gc6922w/). Two calls only:
// initiate a payment (get a hosted collectUrl to redirect the customer to),
// and check a payment's real status server-side. Nothing here trusts a
// customer's browser — see the trust-boundary note on confirmInvitePayment
// in app/order/[slug]/actions.ts, which is the only thing allowed to act on
// a "success" this module reports.

// Defaults to the sandbox API, since that's what the credentials we have
// are for. Vercel sets NODE_ENV=production on every deployment (including
// preview ones), so that can't be used to infer "we have real production
// Whish credentials now" — only an explicit WHISH_BASE_URL override can.
// Set WHISH_BASE_URL=https://api.whish.money/itel-service/api once Whish
// issues real production credentials.
const WHISH_BASE_URL =
  process.env.WHISH_BASE_URL ?? "https://partner.api.sbx.whish.money/itel-service/api";

type WhishEnvelope<T> = { status: boolean; code: string | null; data: T };

function whishHeaders(): HeadersInit {
  const channel = process.env.WHISH_CHANNEL;
  const secret = process.env.WHISH_SECRET;
  const websiteUrl = process.env.WHISH_WEBSITE_URL;

  if (!channel || !secret || !websiteUrl) {
    throw new Error(
      "Whish is not configured: set WHISH_CHANNEL, WHISH_SECRET, WHISH_WEBSITE_URL in the environment."
    );
  }

  return {
    channel,
    secret,
    websiteUrl,
    "Content-Type": "application/json",
    "User-Agent": `apresmidi/1.0 (+${process.env.NEXT_PUBLIC_SITE_URL ?? "https://apresmidi.app"}; sborghol@edtpartners.com)`,
  };
}

export async function createWhishPayment(params: {
  amount: string;
  currency: "USD" | "LBP";
  invoice?: string;
  externalId: string;
  successCallbackUrl: string;
  failureCallbackUrl: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}): Promise<{ collectUrl: string }> {
  const res = await fetch(`${WHISH_BASE_URL}/payment/whish`, {
    method: "POST",
    headers: whishHeaders(),
    body: JSON.stringify(params),
  });

  const body: WhishEnvelope<{ collectUrl: string }> = await res.json();
  if (!body.status || !body.data?.collectUrl) {
    throw new Error(`Whish payment initiation failed (code ${body.code ?? "unknown"})`);
  }
  return body.data;
}

export type WhishCollectStatus = "pending" | "success" | "failed" | "refunded" | "unknown";

// The only source of truth for "did this actually get paid." Callback and
// redirect URLs from Whish are not authenticated, so every caller must
// confirm here before treating a payment as real.
export async function getWhishPaymentStatus(params: {
  externalId: string;
  currency: "USD" | "LBP";
}): Promise<{ collectStatus: WhishCollectStatus }> {
  const res = await fetch(`${WHISH_BASE_URL}/payment/collect/status`, {
    method: "POST",
    headers: whishHeaders(),
    body: JSON.stringify(params),
  });

  const body: WhishEnvelope<{ collectStatus: WhishCollectStatus }> = await res.json();
  if (!body.status || !body.data?.collectStatus) {
    throw new Error(`Whish status check failed (code ${body.code ?? "unknown"})`);
  }
  return body.data;
}
