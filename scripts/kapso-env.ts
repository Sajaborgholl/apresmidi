// Shared by the one-off Kapso setup scripts: reads .env.local (the scripts
// run outside Next.js) and calls Kapso's API with the project key.
import fs from "node:fs";

export function loadEnv(requireKapso = true): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
  for (const k of requireKapso ? ["KAPSO_API_KEY", "KAPSO_PHONE_NUMBER_ID"] : []) {
    if (!env[k]) throw new Error(`${k} is missing from .env.local`);
  }
  return env;
}

export async function kapso(env: Record<string, string>, method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "X-API-Key": env.KAPSO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    // keep the text
  }
  return { status: res.status, json: json as Record<string, unknown> };
}

// The number Kapso knows as KAPSO_PHONE_NUMBER_ID, with its WhatsApp
// Business Account ID (needed to create templates).
export async function phoneNumber(env: Record<string, string>) {
  const { status, json } = await kapso(env, "GET", "https://api.kapso.ai/platform/v1/whatsapp/phone_numbers");
  if (status !== 200) throw new Error(`Listing phone numbers failed: HTTP ${status} ${JSON.stringify(json)}`);
  const list = (json.data as Record<string, unknown>[] | undefined) ?? [];
  const match = list.find((p) => String(p.phone_number_id ?? p.id) === env.KAPSO_PHONE_NUMBER_ID);
  if (!match) {
    throw new Error(
      `KAPSO_PHONE_NUMBER_ID doesn't match any number on this Kapso key. Numbers found: ${list
        .map((p) => `${p.display_phone_number} (${p.phone_number_id ?? p.id})`)
        .join(", ") || "none"}`
    );
  }
  return {
    phoneNumberId: String(match.phone_number_id ?? match.id),
    businessAccountId: String(match.business_account_id ?? ""),
    display: String(match.display_phone_number ?? ""),
    status: String(match.status ?? ""),
  };
}
