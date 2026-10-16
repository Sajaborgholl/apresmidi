import "server-only";

import { createHash } from "node:crypto";
import { purchaseEventId } from "@/lib/purchaseEventId";

// Meta Conversions API: sends Purchase from the server once Whish has really
// confirmed a payment (see confirmInvitePayment in lib/payments.ts). Done
// server-side because the customer may never come back from Whish's page, and
// because the confirmation page's URL carries the private order token, so the
// browser Pixel is kept off it.
//
// Needs META_PIXEL_ID (or NEXT_PUBLIC_META_PIXEL_ID) and META_CAPI_TOKEN.
// Optional META_TEST_EVENT_CODE shows events under Events Manager > Test events.
// Missing config = silently does nothing. Never throws.

const PIXEL_ID = process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const TOKEN = process.env.META_CAPI_TOKEN ?? "";
const TEST_CODE = process.env.META_TEST_EVENT_CODE ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const sha256 = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export async function sendPurchaseEvent(opts: { inviteSlug: string; email: string | null; valueUsd: number }) {
  if (!PIXEL_ID || !TOKEN) return;
  const userData: Record<string, string[]> = { external_id: [sha256(opts.inviteSlug)] };
  if (opts.email) userData.em = [sha256(opts.email)];
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        // Same id on any retry, so Meta counts one purchase per invite.
        event_id: purchaseEventId(opts.inviteSlug),
        action_source: "website",
        // The site root, never the confirmation URL (it carries the order token).
        event_source_url: BASE_URL,
        user_data: userData,
        custom_data: { currency: "USD", value: opts.valueUsd, content_type: "product", content_name: "Standard invite" },
      },
    ],
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  };
  try {
    const res = await fetch(`https://graph.facebook.com/v23.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error("metaCapi: Purchase rejected", res.status, (await res.text()).slice(0, 300));
  } catch (err) {
    console.error("metaCapi: Purchase not sent", err);
  }
}
