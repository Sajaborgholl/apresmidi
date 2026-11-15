"use server";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { sendEmailCodeEmail } from "@/lib/email";
import { EMAIL_PATTERN, MAX_LENGTH } from "@/lib/validation";

// Confirms the host's email before payment: their private dashboard link is
// sent there and it's their only way back in, so a mistyped address must not
// get through. EmailVerifyDialog.tsx calls these two; createOrder then only
// accepts an email whose code was verified (and uses it once).
//
// Codes live in the email_verifications table
// (supabase/add-invite-details-and-email-codes.sql): only a hash is stored,
// they expire after 15 minutes, and a code allows 5 wrong tries.

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type SendCodeResult = { error: string } | { ok: true; verificationId: string };
export type VerifyCodeResult = { error: string } | { ok: true };

function hashCode(verificationId: string, code: string): string {
  return createHash("sha256").update(`${verificationId}:${code}`).digest("hex");
}

function cleanEmail(raw: unknown): string | null {
  const email = String(raw ?? "").trim();
  return email && email.length <= MAX_LENGTH.email && EMAIL_PATTERN.test(email) ? email : null;
}

export async function sendEmailCode(rawEmail: string): Promise<SendCodeResult> {
  const email = cleanEmail(rawEmail);
  if (!email) return { error: "Please enter a valid email address." };

  // Per connection and per address, so nobody can flood an inbox.
  if (!(await rateLimit("email-code-ip", await clientIp(), 10, 60 * 60))) {
    return { error: "Too many codes from your connection. Please try again in an hour." };
  }
  if (!(await rateLimit("email-code-to", email.toLowerCase(), 5, 60 * 60))) {
    return { error: "Too many codes sent to this email. Please try again in an hour." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { data: row, error } = await supabaseAdmin
    .from("email_verifications")
    .insert({ email, code_hash: "pending", expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString() })
    .select("id")
    .single();
  if (error || !row) {
    console.error("sendEmailCode: insert failed", error);
    return { error: "Couldn't send a code just now. Please try again." };
  }
  // The hash includes the row's id, so a code is only valid for its own row.
  await supabaseAdmin.from("email_verifications").update({ code_hash: hashCode(row.id, code) }).eq("id", row.id);

  try {
    await sendEmailCodeEmail({ to: email, code });
  } catch (err) {
    console.error("sendEmailCode: email failed", err);
    return { error: "Couldn't send the email. Please check the address and try again." };
  }
  return { ok: true, verificationId: row.id };
}

export async function verifyEmailCode(verificationId: string, rawEmail: string, rawCode: string): Promise<VerifyCodeResult> {
  const email = cleanEmail(rawEmail);
  const code = String(rawCode ?? "").replace(/\D/g, "");
  if (!email || typeof verificationId !== "string" || code.length !== 6) {
    return { error: "Please enter the 6-digit code from the email." };
  }
  if (!(await rateLimit("email-code-verify", await clientIp(), 30, 10 * 60))) {
    return { error: "Too many tries. Please wait a few minutes." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: row } = await supabaseAdmin
    .from("email_verifications")
    .select("id, email, code_hash, attempts, expires_at, verified_at")
    .eq("id", verificationId)
    .maybeSingle();
  if (!row || row.email.toLowerCase() !== email.toLowerCase()) {
    return { error: "This code doesn't match. Please request a new one." };
  }
  if (row.verified_at) return { ok: true };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { error: "This code has expired. Please request a new one." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { error: "Too many wrong tries. Please request a new code." };
  }

  const expected = Buffer.from(row.code_hash, "hex");
  const given = Buffer.from(hashCode(row.id, code), "hex");
  const matches = expected.length === given.length && timingSafeEqual(expected, given);
  if (!matches) {
    await supabaseAdmin.from("email_verifications").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return { error: left > 0 ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries. Please request a new code." };
  }

  await supabaseAdmin.from("email_verifications").update({ verified_at: new Date().toISOString() }).eq("id", row.id);
  return { ok: true };
}
