import "server-only";
import type { FilledTemplate } from "@/lib/whatsappTemplates";

// Kapso (kapso.ai): WhatsApp's official Cloud API, through which the
// Après-midi number sends guests their invitations. Secrets (Vercel env):
//   KAPSO_API_KEY          - project API key (header X-API-Key)
//   KAPSO_PHONE_NUMBER_ID  - the sending number's Meta phone number ID
//   KAPSO_WEBHOOK_SECRET   - signs Kapso's webhook calls (we choose it)

const META = "https://api.kapso.ai/meta/whatsapp/v24.0";
const TIMEOUT_MS = 20_000;

export type SendResult =
  | { ok: true; msgId: string }
  // Try again later (rate limits, a message still in flight, Kapso/Meta hiccups).
  | { ok: false; kind: "retry"; error: string; retryAfterSeconds?: number }
  // Nothing can be sent until someone fixes it (credits, review, key).
  | { ok: false; kind: "paused"; error: string; reason: "credits" | "review" | "key" }
  // This message can't be sent (invalid number, opted out…): don't retry.
  | { ok: false; kind: "failed"; error: string };

export function isKapsoConfigured(): boolean {
  return Boolean(process.env.KAPSO_API_KEY && process.env.KAPSO_PHONE_NUMBER_ID);
}

function headers() {
  return { "X-API-Key": process.env.KAPSO_API_KEY ?? "", "Content-Type": "application/json", Accept: "application/json" };
}

type ErrorBody = {
  error?: { code?: number | string; message?: string; title?: string; error_data?: { details?: string } } | string;
  code?: number | string;
  message?: string;
};

function describe(body: ErrorBody, status: number): { code: string; message: string } {
  const e = typeof body.error === "object" && body.error ? body.error : null;
  const code = String(e?.code ?? body.code ?? "");
  const message =
    [e?.message ?? e?.title ?? (typeof body.error === "string" ? body.error : undefined) ?? body.message, e?.error_data?.details]
      .filter(Boolean)
      .join(" — ") || `HTTP ${status}`;
  return { code, message };
}

// Meta codes meaning "slow down / try later" (throughput, spam limits, the
// daily cap on business-initiated messages for new numbers).
const RETRY_META_CODES = new Set(["4", "80007", "130429", "131048", "131056", "133016"]);

// Sorts a failed response the way the queue acts on it.
export function classifyError(status: number, body: ErrorBody, retryAfter: string | null): SendResult {
  const { code, message } = describe(body, status);
  const error = code ? `${message} (${code})` : message;
  if (status === 402) return { ok: false, kind: "paused", reason: "credits", error };
  if (status === 423) return { ok: false, kind: "paused", reason: "review", error };
  if (status === 401 || status === 403) return { ok: false, kind: "paused", reason: "key", error };
  if (status === 409 || status === 429 || status >= 500 || RETRY_META_CODES.has(code)) {
    const wait = Number(retryAfter);
    return {
      ok: false,
      kind: "retry",
      error,
      retryAfterSeconds: Number.isFinite(wait) && wait > 0 ? wait : code === "131048" || code === "131056" ? 60 * 60 : 60,
    };
  }
  return { ok: false, kind: "failed", error };
}

// One approved template, with this message's variables and button ending.
export async function sendTemplate(toDigits: string, t: Pick<FilledTemplate, "name" | "language" | "params" | "buttonSuffix">): Promise<SendResult> {
  if (!isKapsoConfigured()) return { ok: false, kind: "paused", reason: "key", error: "KAPSO_API_KEY / KAPSO_PHONE_NUMBER_ID not set" };

  const components: unknown[] = [
    {
      type: "body",
      parameters: Object.entries(t.params).map(([parameter_name, text]) => ({ type: "text", parameter_name, text })),
    },
  ];
  if (t.buttonSuffix) {
    components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: t.buttonSuffix }] });
  }

  let res: Response;
  try {
    res = await fetch(`${META}/${process.env.KAPSO_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toDigits,
        type: "template",
        template: { name: t.name, language: { code: t.language }, components },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    return { ok: false, kind: "retry", error: `Network error: ${(err as Error).message}` };
  }

  let body: ErrorBody & { messages?: { id?: string }[] } = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON (gateway error page): decided by status.
  }
  const id = body.messages?.[0]?.id;
  if (res.ok && id) return { ok: true, msgId: id };
  return classifyError(res.status, body, res.headers.get("retry-after"));
}
