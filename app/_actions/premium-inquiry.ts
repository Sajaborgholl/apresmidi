"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPremiumInquiryNotification } from "@/lib/email";
import { PLUS_ADDONS, type InquiryPlan } from "@/lib/plans";
import { dialCodeForCountry } from "@/lib/countryCodes";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// Cap on the optional notes box — matches the textarea's maxLength in
// PlanRequestDialog.tsx, enforced here too since the form can be bypassed.
const NOTES_MAX_LENGTH = 1000;

export type PremiumInquiryState = { error: string } | { success: true } | null;

// Runs when the "Get Plus" or "Get Premium" form on the homepage pricing section
// (the request window in app/_components/PlanRequestDialog.tsx) is submitted, via useActionState
// — returns a result object instead of throwing, so the form can show
// inline validation/success states without a full error-boundary crash.
// Inserts via the admin/service-role client — same reason premium_inquiries
// has no anon RLS policies at all (see
// supabase/add-premium-inquiries-table.sql).
export async function submitPremiumInquiry(
  _prevState: PremiumInquiryState,
  formData: FormData
): Promise<PremiumInquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  // The form sends the country (by name — see PlanRequestDialog.tsx) and the
  // local number separately; they're saved together as one readable string,
  // e.g. "+44 7700 900123", in the existing phone column.
  const dialCode = dialCodeForCountry(String(formData.get("phone_country") ?? ""));
  const localNumber = String(formData.get("phone") ?? "").trim();
  // Optional, on both Plus and Premium. Empty is saved as null, not "".
  const notes = String(formData.get("notes") ?? "").trim().slice(0, NOTES_MAX_LENGTH) || null;
  const plan: InquiryPlan = formData.get("plan") === "plus" ? "plus" : "premium";
  // Only Plus offers add-ons, and only names from the shared list are kept,
  // so a tampered form can't write arbitrary text into the row or the email.
  const addons =
    plan === "plus"
      ? PLUS_ADDONS.filter((a) => formData.getAll("addons").includes(a))
      : [];

  // Honeypot: a field people never see (see PlanRequestDialog.tsx). Only a
  // bot fills it — it gets the normal success response, but nothing is
  // saved or emailed.
  if (String(formData.get("website") ?? "")) {
    return { success: true };
  }

  if (!name) {
    return { error: "Name is required." };
  }
  // Deliberately simple format check — same as the owner_email check in
  // app/order/[slug]/actions.ts, full deliverability validation is out of
  // scope here.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "A valid email address is required." };
  }
  if (!dialCode) {
    return { error: "Please choose your country code." };
  }
  if (!localNumber) {
    return { error: "Phone number is required." };
  }
  const phone = `${dialCode} ${localNumber}`;

  // Each inquiry emails the team inbox, so this caps how fast it can be flooded.
  if (!(await rateLimit("premium-inquiry", await clientIp(), 5, 60 * 60))) {
    return { error: "We've received several requests from you already — please try again later." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  let { error: insertError } = await supabaseAdmin
    .from("premium_inquiries")
    .insert({ name, email, phone, plan, addons, notes });

  // PGRST204 is PostgREST's "column not found": the plan/addons/notes columns
  // from supabase/add-inquiry-plan-fields.sql haven't been added yet. Save
  // the lead without them rather than lose it; the email below still carries
  // the plan, the add-ons and the notes.
  if (insertError?.code === "PGRST204") {
    console.warn("submitPremiumInquiry: plan/addons/notes columns missing — run supabase/add-inquiry-plan-fields.sql");
    ({ error: insertError } = await supabaseAdmin.from("premium_inquiries").insert({ name, email, phone }));
  }

  if (insertError) {
    return { error: `Could not save your info: ${insertError.message}` };
  }

  // Never let a failed notification undo the lead we already saved above.
  try {
    await sendPremiumInquiryNotification({ name, email, phone, plan, addons, notes });
  } catch (err) {
    console.error("submitPremiumInquiry: failed to send notification email", err);
  }

  return { success: true };
}
