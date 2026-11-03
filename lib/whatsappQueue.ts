import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTemplate } from "@/lib/kapso";
import { sendWhatsappPausedAlert } from "@/lib/email";

// Sends queued WhatsApp messages (table guest_messages) through Kapso, one
// at a time about a second apart — well inside Kapso's per-minute limits and
// gentle on Meta's quality checks. Run by app/api/whatsapp/worker every
// minute, and right after a host presses Send.
//
// whatsapp_status holds where sending stands: "ok", or "paused_credits" /
// "paused_review" / "paused_key" when Kapso refuses every message until
// someone fixes the account. Paused messages stay queued and go out as soon
// as a send succeeds again (each run tries one).

const SPACING_MS = 1_100;
const MAX_ATTEMPTS = 4;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Saves where sending stands, and emails the team when it becomes paused
// (once per pause, not every minute it stays paused).
export async function setWhatsappStatus(status: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: before } = await supabaseAdmin.from("whatsapp_status").select("status").eq("id", 1).maybeSingle();
  if (before?.status === status) return;
  await supabaseAdmin.from("whatsapp_status").update({ status, updated_at: new Date().toISOString() }).eq("id", 1);
  if (status.startsWith("paused")) {
    try {
      await sendWhatsappPausedAlert(status);
    } catch (err) {
      console.error("setWhatsappStatus: alert email failed", err);
    }
  }
}

export type WorkerRun = { sent: number; failed: number; retried: number; paused: boolean; skipped?: string };

type Claimed = {
  id: string;
  to_phone: string;
  attempts: number;
  template_name: string | null;
  template_language: string | null;
  template_params: Record<string, string> | null;
  button_suffix: string | null;
};

// Sends what's due within `budgetMs` (kept under the 60-second function
// limit on Vercel's free plan). Returns what happened, for logs.
export async function processQueue(budgetMs = 50_000): Promise<WorkerRun> {
  const supabaseAdmin = getSupabaseAdmin();
  const started = Date.now();
  const run: WorkerRun = { sent: 0, failed: 0, retried: 0, paused: false };

  const { data: leased } = await supabaseAdmin.rpc("take_whatsapp_worker_lease", {
    p_seconds: Math.ceil(budgetMs / 1000) + 10,
  });
  if (!leased) return { ...run, skipped: "another worker is running" };

  try {
    const { data: state } = await supabaseAdmin.from("whatsapp_status").select("status").eq("id", 1).maybeSingle();
    // While paused, try a single message per run to see if it's fixed.
    const perRun = state?.status?.startsWith("paused") ? 1 : Math.max(1, Math.floor((budgetMs - 2_000) / SPACING_MS));
    const { data: batch, error } = await supabaseAdmin.rpc("claim_guest_messages", { p_limit: perRun });
    if (error) throw error;
    const messages = (batch ?? []) as Claimed[];
    if (messages.length === 0) return { ...run, skipped: "nothing due" };

    for (const [i, msg] of messages.entries()) {
      const now = () => new Date().toISOString();
      if (Date.now() - started > budgetMs - SPACING_MS) {
        // Out of time: put the rest back for the next run.
        await supabaseAdmin.from("guest_messages").update({ status: "queued", attempts: msg.attempts - 1 }).eq("id", msg.id);
        continue;
      }
      if (!msg.template_name || !msg.template_language) {
        await supabaseAdmin
          .from("guest_messages")
          .update({ status: "failed", error: "No WhatsApp template (queued before the switch to Kapso).", updated_at: now() })
          .eq("id", msg.id);
        run.failed++;
        continue;
      }
      if (i > 0) await sleep(SPACING_MS);

      const result = await sendTemplate(msg.to_phone, {
        name: msg.template_name,
        language: "en",
        params: msg.template_params ?? {},
        buttonSuffix: msg.button_suffix ?? "",
      });

      if (result.ok) {
        run.sent++;
        await supabaseAdmin
          .from("guest_messages")
          .update({ status: "sent", wa_msg_id: result.msgId, sent_at: now(), error: null, updated_at: now() })
          .eq("id", msg.id);
        await setWhatsappStatus("ok");
      } else if (result.kind === "paused") {
        // The account can't send right now (credits, review, key): this and
        // the rest go back to the queue untouched until it's fixed.
        run.paused = true;
        await supabaseAdmin
          .from("guest_messages")
          .update({ status: "queued", attempts: msg.attempts - 1, error: result.error, updated_at: now() })
          .in("id", messages.slice(i).map((m) => m.id));
        await setWhatsappStatus(`paused_${result.reason}`);
        break;
      } else if (result.kind === "retry" && msg.attempts < MAX_ATTEMPTS) {
        run.retried++;
        const waitSeconds = result.retryAfterSeconds ?? 60 * 2 ** (msg.attempts - 1);
        await supabaseAdmin
          .from("guest_messages")
          .update({
            status: "queued",
            error: result.error,
            next_attempt_at: new Date(Date.now() + waitSeconds * 1000).toISOString(),
            updated_at: now(),
          })
          .eq("id", msg.id);
      } else {
        run.failed++;
        await supabaseAdmin.from("guest_messages").update({ status: "failed", error: result.error, updated_at: now() }).eq("id", msg.id);
      }
    }
    return run;
  } finally {
    await supabaseAdmin.rpc("release_whatsapp_worker_lease");
  }
}
