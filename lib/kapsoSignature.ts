import { createHmac, timingSafeEqual } from "crypto";

// Kapso signs each webhook call: X-Webhook-Signature is the hex HMAC-SHA256
// of the raw request body, keyed with the secret we registered
// (KAPSO_WEBHOOK_SECRET). Compared in constant time.
export function validKapsoSignature(rawBody: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signature.trim().replace(/^sha256=/, ""), "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
