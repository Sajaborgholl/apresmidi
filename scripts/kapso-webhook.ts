// Registers (or lists) Kapso's webhook for the Après-midi number, so delivery
// and read statuses and guests' replies reach the app.
//
//   npx tsx scripts/kapso-webhook.ts list
//   npx tsx scripts/kapso-webhook.ts register   # after the site is deployed
//
// Uses NEXT_PUBLIC_SITE_URL (or SITE_URL=…) for the address and
// KAPSO_WEBHOOK_SECRET as the signing secret — the deployed site must have
// the same secret.
import { kapso, loadEnv, phoneNumber } from "./kapso-env";

const PLATFORM = "https://api.kapso.ai/platform/v1";
const EVENTS = [
  "whatsapp.message.received",
  "whatsapp.message.sent",
  "whatsapp.message.delivered",
  "whatsapp.message.read",
  "whatsapp.message.failed",
];

async function main() {
  const mode = process.argv[2] ?? "list";
  const env = loadEnv();
  const number = await phoneNumber(env);
  const base = `${PLATFORM}/whatsapp/phone_numbers/${number.phoneNumberId}/webhooks`;

  if (mode === "list") {
    const { status, json } = await kapso(env, "GET", base);
    console.log(`HTTP ${status}`);
    for (const w of (json.data as Record<string, unknown>[] | undefined) ?? []) {
      console.log(`${w.id}  ${w.url}  active=${w.active}  events=${JSON.stringify(w.events)}`);
    }
    return;
  }

  if (mode === "register") {
    const site = process.env.SITE_URL ?? env.NEXT_PUBLIC_SITE_URL ?? "";
    if (!/^https:\/\//.test(site) || site.includes("localhost")) {
      throw new Error(`Set NEXT_PUBLIC_SITE_URL (or SITE_URL=…) to the live https site first; got "${site}".`);
    }
    if (!env.KAPSO_WEBHOOK_SECRET) throw new Error("KAPSO_WEBHOOK_SECRET is missing from .env.local");
    const { status, json } = await kapso(env, "POST", base, {
      whatsapp_webhook: {
        kind: "kapso",
        url: `${site.replace(/\/+$/, "")}/api/whatsapp/webhook`,
        events: EVENTS,
        secret_key: env.KAPSO_WEBHOOK_SECRET,
        active: true,
      },
    });
    const data = (json.data as Record<string, unknown> | undefined) ?? {};
    console.log(`HTTP ${status}`, status < 300 ? `webhook ${data.id} → ${data.url}` : JSON.stringify(json));
    return;
  }

  throw new Error(`Unknown mode "${mode}" (use list or register).`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
