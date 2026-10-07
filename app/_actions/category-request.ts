"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { sendCategoryRequestNotification } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export type CategoryRequestState = { error: string } | { success: true } | null;

// Runs when the "suggest a category" form on the homepage (right after
// "Browse by occasion") is submitted, via useActionState — same shape as
// submitPremiumInquiry (app/_actions/premium-inquiry.ts). Inserts via the
// admin/service-role client — same reason category_requests has no anon RLS
// policies at all (see supabase/add-category-requests-table.sql).
export async function submitCategoryRequest(
  _prevState: CategoryRequestState,
  formData: FormData
): Promise<CategoryRequestState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  // Honeypot — same as submitPremiumInquiry (see CategoryRequestForm.tsx).
  if (String(formData.get("website") ?? "")) {
    return { success: true };
  }

  if (!name) {
    return { error: "Name is required." };
  }
  // Deliberately simple format check — same as submitPremiumInquiry.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "A valid email address is required." };
  }
  if (!category) {
    return { error: "Tell us what occasion you have in mind." };
  }

  // Each request emails the team inbox, so this caps how fast it can be flooded.
  if (!(await rateLimit("category-request", await clientIp(), 5, 60 * 60))) {
    return { error: "We've received several requests from you already — please try again later." };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error: insertError } = await supabaseAdmin.from("category_requests").insert({ name, email, category });

  if (insertError) {
    return { error: `Could not save your info: ${insertError.message}` };
  }

  // Never let a failed notification undo the lead we already saved above.
  try {
    await sendCategoryRequestNotification({ name, email, category });
  } catch (err) {
    console.error("submitCategoryRequest: failed to send notification email", err);
  }

  return { success: true };
}
