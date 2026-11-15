import { Resend } from "resend";

// Every value interpolated into an HTML email body goes through this —
// customer-typed text especially, so a name or note can't inject links or
// markup into an email that arrives looking like it came from us.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  // The dashboard comes first: it's where the host adds guests and we send
  // each one a personal invitation on WhatsApp. The general link is
  // view-only (guests can't reply from it), so it's described that way.
  const subject = "Your invitation is live: here's your dashboard";
  const text = [
    "Your invitation is live!",
    "",
    "Your private dashboard:",
    dashboardUrl,
    "Keep this email: this link is the only way back into your dashboard, and anyone with it can manage your guests.",
    "",
    "Next steps:",
    "1. Open your dashboard and add your guests (name, WhatsApp number, seats).",
    "2. Press Send: each guest gets their own invitation on WhatsApp and replies from it.",
    "3. Watch the replies come in on your dashboard.",
    "",
    "View-only link (for group chats, social posts or printed cards; guests can't reply from it):",
    guestUrl,
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
      <p>Your invitation is live!</p>
      <p><strong>Your private dashboard:</strong><br/>
      <a href="${escapeHtml(dashboardUrl)}">${escapeHtml(dashboardUrl)}</a><br/>
      <small>Keep this email: this link is the only way back into your dashboard, and anyone with it can manage your guests.</small></p>
      <p><strong>Next steps</strong></p>
      <ol>
        <li>Open your dashboard and add your guests (name, WhatsApp number, seats).</li>
        <li>Press Send: each guest gets their own invitation on WhatsApp and replies from it.</li>
        <li>Watch the replies come in on your dashboard.</li>
      </ol>
      <p><strong>View-only link</strong> (for group chats, social posts or printed cards; guests can't reply from it):<br/>
      <a href="${escapeHtml(guestUrl)}">${escapeHtml(guestUrl)}</a></p>
    `,
  });
}

// The 6-digit code that confirms a host's email before payment
// (app/order/[slug]/emailActions.ts). Same noop-when-unconfigured pattern:
// locally without a Resend key the code is printed in the server log.
export async function sendEmailCodeEmail({ to, code }: { to: string; code: string }) {
  const subject = `${code} is your Après-midi code`;
  const text = [
    `Your code is ${code}`,
    "",
    "Type it on the Après-midi page to confirm your email. It expires in 15 minutes.",
    "",
    "Didn't ask for this? You can ignore this email.",
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
      <p>Your code is</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:8px 0 16px">${escapeHtml(code)}</p>
      <p>Type it on the Après-midi page to confirm your email. It expires in 15 minutes.</p>
      <p><small>Didn't ask for this? You can ignore this email.</small></p>
    `,
  });
}

// "Email me my dashboard link again": every live invitation ordered with
// this address, sent only to that address (so asking for it reveals
// nothing to whoever typed it). Same noop-when-unconfigured pattern.
export async function sendDashboardLinksEmail({
  to,
  invites,
}: {
  to: string;
  invites: { hostNames: string; dashboardUrl: string }[];
}) {
  const subject = invites.length === 1 ? "Your dashboard link" : "Your dashboard links";
  const text = [
    "Here's the link to your private dashboard. Anyone with it can manage your guests, so don't forward it.",
    "",
    ...invites.flatMap((i) => [`${i.hostNames}:`, i.dashboardUrl, ""]),
    "Didn't ask for this? You can ignore this email.",
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
      <p>Here's the link to your private dashboard. Anyone with it can manage your guests, so don't forward it.</p>
      ${invites
        .map((i) => `<p><strong>${escapeHtml(i.hostNames)}</strong><br/><a href="${escapeHtml(i.dashboardUrl)}">${escapeHtml(i.dashboardUrl)}</a></p>`)
        .join("")}
      <p><small>Didn't ask for this? You can ignore this email.</small></p>
    `,
  });
}

// Notifies the team of a new "Get Plus" or "Get Premium" lead from the
// homepage pricing section. Same noop-when-unconfigured / let-the-caller-catch-failures
// pattern as sendInviteReadyEmail above — a failed notification must never
// block the inquiry from being saved (submitPremiumInquiry already commits
// the row before calling this).

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

// Tells the team WhatsApp sending through Kapso is paused (out of credit,
// project under review, or the API key rejected), so guests' invitations are
// queued but not going out until it's fixed. Sent once per pause. Same
// noop-when-unconfigured pattern as above; the caller catches failures.
export async function sendWhatsappPausedAlert(status: string) {
  const reasons: Record<string, string> = {
    paused_credits: "Kapso says the account is out of credit. Top up in Kapso > Billing.",
    paused_review: "Kapso says the project is under review. Check the Kapso dashboard.",
    paused_key: "Kapso rejected the API key or phone number ID. Check KAPSO_API_KEY and KAPSO_PHONE_NUMBER_ID in Vercel.",
  };
  const reason = reasons[status] ?? `Kapso reported: ${status}`;
  const to = "saja.borgholl@hotmail.com";
  const subject = "WhatsApp sending paused";
  const text = [
    reason,
    "",
    "Guests' invitations stay queued and go out automatically once it's fixed.",
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
    html: `<p>${escapeHtml(reason)}</p>
      <p>Guests' invitations stay queued and go out automatically once it's fixed.</p>`,
  });
}
