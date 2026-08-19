"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPremiumInquiryNotification } from "@/lib/email";

export type PremiumInquiryState = { error: string } | { success: true } | null;

// Runs when the "Get Premium" form on the homepage pricing section
// (app/_components/PremiumInquiryForm.tsx) is submitted, via useActionState
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
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }
  // Deliberately simple format check — same as the owner_email check in
  // app/order/[slug]/actions.ts, full deliverability validation is out of
  // scope here.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "A valid email address is required." };
  }
  if (!phone) {
    return { error: "Phone number is required." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error: insertError } = await supabaseAdmin.from("premium_inquiries").insert({ name, email, phone });

  if (insertError) {
    return { error: `Could not save your info: ${insertError.message}` };
  }

  // Never let a failed notification undo the lead we already saved above.
  try {
    await sendPremiumInquiryNotification({ name, email, phone });
  } catch (err) {
    console.error("submitPremiumInquiry: failed to send notification email", err);
  }

  return { success: true };
}
