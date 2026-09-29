import { Resend } from "resend";

// Wraps Resend so callers never need to think about whether an API key is
// configured yet. Before RESEND_API_KEY is set (local dev, or before
// Resend is fully set up), this just logs to the console instead of
// throwing. Callers (confirmInvitePayment) still wrap calls to this in
// try/catch, since Resend's own API call can fail even when the key IS set
// (bad `to` address, network error, etc.) — that failure must never block
// the payment-confirmation flow that triggered it.
export async function sendInviteReadyEmail({
  to,
  dashboardUrl,
  guestUrl,
}: {
  to: string;
  dashboardUrl: string;
  guestUrl: string;
}) {
  const subject = "Your invite is live!";
  const text = [
    "Your invite is live and ready to share.",
    "",
    "Guest link (share this with your guests):",
    guestUrl,
    "",
    "Your dashboard (private, this is how you see RSVPs, don't share it):",
    dashboardUrl,
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:noop] RESEND_API_KEY not set — would have sent to ${to}:\n${subject}\n\n${text}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Après-midi <onboarding@resend.dev>",
    to,
    subject,
    text,
    html: `
      <p>Your invite is live and ready to share.</p>
      <p><strong>Guest link</strong> (share this with your guests):<br/>
      <a href="${guestUrl}">${guestUrl}</a></p>
      <p><strong>Your dashboard</strong> (private, this is how you see RSVPs, don't share it):<br/>
      <a href="${dashboardUrl}">${dashboardUrl}</a></p>
    `,
  });
}

// Notifies the team of a new "Get Plus" or "Get Premium" lead from the
// homepage pricing section. Same noop-when-unconfigured / let-the-caller-catch-failures
// pattern as sendInviteReadyEmail above — a failed notification must never
// block the inquiry from being saved (submitPremiumInquiry already commits
// the row before calling this).
// Everything the customer typed is escaped before it goes into the HTML
// body — the notes box is free text, so it must not be able to inject markup
// into the team's inbox.
function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendPremiumInquiryNotification({
  name,
  email,
  phone,
  plan,
  addons,
  notes,
}: {
  name: string;
  email: string;
  phone: string;
  plan: "plus" | "premium";
  addons: string[];
  notes: string | null;
}) {
  const to = "saja.borgholl@hotmail.com";
  const planName = plan === "plus" ? "Plus" : "Premium";
  const addonsLine = plan === "plus" ? `Add-ons: ${addons.length ? addons.join(", ") : "none picked yet"}` : null;
  const subject = `New ${planName} inquiry: ${name}`;
  const text = [
    `New ${planName} plan inquiry from the homepage.`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    ...(addonsLine ? [addonsLine] : []),
    ...(notes ? ["", "Notes:", notes] : []),
    "",
    "Follow up within 48 hours.",
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:noop] RESEND_API_KEY not set — would have sent to ${to}:\n${subject}\n\n${text}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Après-midi <onboarding@resend.dev>",
    to,
    subject,
    text,
    html: `
      <p>New ${planName} plan inquiry from the homepage.</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
      <strong>Email:</strong> ${escapeHtml(email)}<br/>
      <strong>Phone:</strong> ${escapeHtml(phone)}${addonsLine ? `<br/>
      <strong>Add-ons:</strong> ${addons.length ? addons.join(", ") : "none picked yet"}` : ""}</p>
      ${notes ? `<p><strong>Notes:</strong><br/>${escapeHtml(notes).replace(/\n/g, "<br/>")}</p>` : ""}
      <p>Follow up within 48 hours.</p>
    `,
  });
}

// Notifies the team of a new "suggest a category" lead from the homepage's
// handwritten-note section. Same noop-when-unconfigured / let-the-caller-
// catch-failures pattern as sendPremiumInquiryNotification above —
// submitCategoryRequest already commits the row before calling this.
export async function sendCategoryRequestNotification({
  name,
  email,
  category,
}: {
  name: string;
  email: string;
  category: string;
}) {
  const to = "saja.borgholl@hotmail.com";
  const subject = `New category request: ${category}`;
  const text = [
    "New category request from the homepage.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Category requested: ${category}`,
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:noop] RESEND_API_KEY not set — would have sent to ${to}:\n${subject}\n\n${text}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Après-midi <onboarding@resend.dev>",
    to,
    subject,
    text,
    html: `
      <p>New category request from the homepage.</p>
      <p><strong>Name:</strong> ${name}<br/>
      <strong>Email:</strong> ${email}<br/>
      <strong>Category requested:</strong> ${category}</p>
    `,
  });
}
