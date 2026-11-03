// Submits Après-midi's WhatsApp templates (lib/whatsappTemplates.ts) to Meta
// for approval through Kapso, and shows where they stand.
//
//   npx tsx scripts/kapso-templates.ts preview   # print what would be submitted
//   npx tsx scripts/kapso-templates.ts submit    # submit all for review
//   npx tsx scripts/kapso-templates.ts submit apresmidi_guest_reply  # just these
//   npx tsx scripts/kapso-templates.ts status    # PENDING / APPROVED / REJECTED
//
// The button links use NEXT_PUBLIC_SITE_URL (or SITE_URL=… on the command
// line): it must be the live site, since an approved template's link can't
// be changed afterwards.
import { TEMPLATES, templateRequest } from "../lib/whatsappTemplates";
import { kapso, loadEnv, phoneNumber } from "./kapso-env";

const META = "https://api.kapso.ai/meta/whatsapp/v24.0";

async function main() {
  const mode = process.argv[2] ?? "preview";
  const env = loadEnv(mode !== "preview");
  const site = process.env.SITE_URL ?? env.NEXT_PUBLIC_SITE_URL ?? "";

  if (mode === "preview") {
    for (const t of TEMPLATES) {
      const r = templateRequest(t, site || "https://YOUR-SITE");
      const buttons = r.components.find((c) => c.type === "BUTTONS") as { buttons: { text: string; url: string }[] } | undefined;
      const button = buttons ? `\n[${buttons.buttons[0].text}] → ${buttons.buttons[0].url}` : "\n(no button)";
      console.log(`\n=== ${t.name} [${t.language}] (${t.kind}) ===\n${t.body}\n\n${t.footer ?? ""}${button}`);
    }
    return;
  }

  const number = await phoneNumber(env);
  console.log(`Number: ${number.display} (status ${number.status}), WhatsApp Business Account ${number.businessAccountId}`);
  if (!number.businessAccountId) throw new Error("Kapso didn't return a business_account_id for this number.");

  if (mode === "submit") {
    if (!/^https:\/\//.test(site) || site.includes("localhost")) {
      throw new Error(`Set NEXT_PUBLIC_SITE_URL (or SITE_URL=…) to the live https site first; got "${site}".`);
    }
    // Optional template names after "submit" limit it to those (e.g. to
    // resubmit one that was refused); otherwise all are submitted.
    const only = process.argv.slice(3);
    for (const t of TEMPLATES.filter((t) => only.length === 0 || only.includes(t.name))) {
      const { status, json } = await kapso(env, "POST", `${META}/${number.businessAccountId}/message_templates`, templateRequest(t, site));
      console.log(`${t.name} [${t.language}]: HTTP ${status} ${JSON.stringify(json)}`);
    }
    return;
  }

  if (mode === "status") {
    const { status, json } = await kapso(env, "GET", `${META}/${number.businessAccountId}/message_templates?limit=100`);
    if (status !== 200) throw new Error(`HTTP ${status} ${JSON.stringify(json)}`);
    const ours = new Set(TEMPLATES.map((t) => `${t.name}|${t.language}`));
    for (const t of (json.data as Record<string, unknown>[] | undefined) ?? []) {
      if (!ours.has(`${t.name}|${t.language}`)) continue;
      console.log(`${String(t.name).padEnd(34)} ${String(t.language).padEnd(4)} ${String(t.status).padEnd(10)} ${t.category ?? ""}${t.rejected_reason && t.rejected_reason !== "NONE" ? ` — rejected: ${t.rejected_reason}` : ""}`);
    }
    return;
  }

  throw new Error(`Unknown mode "${mode}" (use preview, submit or status).`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
