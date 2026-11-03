import { after, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { processQueue } from "@/lib/whatsappQueue";
import { guestReplyTemplate } from "@/lib/whatsappTemplates";
import { validKapsoSignature } from "@/lib/kapsoSignature";

// Kapso's webhook for the Après-midi number (registered with
// scripts/kapso-webhook.ts for https://<site>/api/whatsapp/webhook). Every
// call is signed: X-Webhook-Signature is the hex HMAC-SHA256 of the raw body,
// keyed with KAPSO_WEBHOOK_SECRET. The event name is in X-Webhook-Event.
//
//   whatsapp.message.sent / delivered / read / failed -> our message's status
//   whatsapp.message.received -> a guest wrote to the Après-midi number:
//                                forward it to the host's own WhatsApp

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FORWARDS_PER_GUEST_PER_DAY = 20;

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});

// Statuses only move forward: a late "delivered" never overwrites "read".
const RANK: Record<string, number> = { sending: 0, sent: 1, delivered: 2, read: 3 };
const STATUS_EVENTS: Record<string, string> = {
  "whatsapp.message.sent": "sent",
  "whatsapp.message.delivered": "delivered",
  "whatsapp.message.read": "read",
  "whatsapp.message.failed": "failed",
};

async function onStatus(event: string, payload: Json) {
  const message = obj(payload.message);
  const id = typeof message.id === "string" ? message.id : null;
  const status = STATUS_EVENTS[event];
  if (!id || !status) return;
  const supabaseAdmin = getSupabaseAdmin();
  const { data: msg } = await supabaseAdmin.from("guest_messages").select("id, status").eq("wa_msg_id", id).maybeSingle();
  if (!msg) return;
  const now = new Date().toISOString();

  if (status === "failed") {
    const statuses = obj(message.kapso).statuses;
    const last = Array.isArray(statuses) ? obj(statuses[statuses.length - 1]) : {};
    const err = obj(Array.isArray(last.errors) ? last.errors[0] : undefined);
    const why = [err.title, err.message].filter((s) => typeof s === "string" && s).join(": ") || "WhatsApp couldn't deliver this message.";
    if (msg.status !== "read" && msg.status !== "failed") {
      await supabaseAdmin.from("guest_messages").update({ status: "failed", error: String(why).slice(0, 300), updated_at: now }).eq("id", msg.id);
    }
    return;
  }
  if ((RANK[status] ?? -1) > (RANK[msg.status] ?? 99)) {
    await supabaseAdmin.from("guest_messages").update({ status, updated_at: now }).eq("id", msg.id);
  }
}

// The text of an incoming message, or a short label for media.
function incomingText(message: Json): string {
  const text = obj(message.text).body ?? obj(message.kapso).content;
  if (typeof text === "string" && text.trim()) return text.trim();
  const interactive = obj(message.interactive);
  const reply = obj(interactive.button_reply).title ?? obj(interactive.list_reply).title ?? obj(message.button).text;
  if (typeof reply === "string" && reply.trim()) return reply.trim();
  const labels: Record<string, string> = {
    image: "[sent a photo]",
    audio: "[sent a voice message]",
    video: "[sent a video]",
    sticker: "[sent a sticker]",
    document: "[sent a file]",
    location: "[sent a location]",
  };
  return labels[String(message.type)] ?? "";
}

// Returns true if a forward was queued.
async function onReceived(payload: Json): Promise<boolean> {
  const message = obj(payload.message);
  const phone = String(message.from ?? obj(payload.conversation).phone_number ?? "").replace(/\D/g, "");
  const text = incomingText(message);
  if (phone.length < 7 || phone.length > 15 || !text) return false;

  const supabaseAdmin = getSupabaseAdmin();
  // Who is this? The guest we most recently sent an invitation/reminder to.
  const { data: last } = await supabaseAdmin
    .from("guest_messages")
    .select("invite_id, guest_id")
    .eq("to_phone", phone)
    .in("kind", ["invite", "reminder"])
    .not("guest_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last?.guest_id) return false;

  const [{ data: guest }, { data: invite }] = await Promise.all([
    supabaseAdmin.from("guests").select("id, name, phone").eq("id", last.guest_id).maybeSingle(),
    supabaseAdmin
      .from("invites")
      .select("id, host_names, event_date, whatsapp_number, status, templates(category)")
      .eq("id", last.invite_id)
      .maybeSingle(),
  ]);
  if (!guest || !invite?.whatsapp_number || invite.status !== "live") return false;
  // Never forward a host's own messages (that would bounce between numbers).
  if (phone === invite.whatsapp_number) return false;
  const { count: hostNumbers } = await supabaseAdmin
    .from("invites")
    .select("id", { count: "exact", head: true })
    .eq("whatsapp_number", phone)
    .eq("status", "live");
  if (hostNumbers) return false;
  if (!(await rateLimit("wa-forward", guest.id, FORWARDS_PER_GUEST_PER_DAY, 24 * 60 * 60))) return false;

  const rel = invite.templates as { category: string } | { category: string }[] | null;
  const category = (Array.isArray(rel) ? rel[0]?.category : rel?.category) ?? null;
  const t = guestReplyTemplate({ hostNames: invite.host_names, category, eventDate: invite.event_date }, guest, text);
  const { error } = await supabaseAdmin.from("guest_messages").insert({
    invite_id: invite.id,
    guest_id: guest.id,
    kind: "forward",
    to_phone: invite.whatsapp_number,
    body: t.preview,
    template_name: t.name,
    template_language: t.language,
    template_params: t.params,
    button_suffix: t.buttonSuffix,
  });
  if (error) {
    console.error("whatsapp webhook: forward queue failed", error);
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!validKapsoSignature(raw, request.headers.get("x-webhook-signature"), process.env.KAPSO_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const headerEvent = request.headers.get("x-webhook-event") ?? "";
  const idempotency = request.headers.get("x-idempotency-key");
  // Batched deliveries carry several events; single ones just one.
  const items = Array.isArray(parsed) ? parsed : Array.isArray(obj(parsed).data) ? (obj(parsed).data as unknown[]) : [parsed];

  // Answer quickly (Kapso waits 10 seconds at most) and do the work after.
  after(async () => {
    let forwarded = false;
    for (const [i, item] of items.entries()) {
      const payload = obj(item);
      const event = headerEvent || String(payload.event ?? "");
      try {
        // Kapso retries deliveries; the delivered/read/failed statuses of one
        // message share a key, so the event name is part of it.
        if (idempotency && !(await rateLimit("kapso-wh", `${event}:${idempotency}:${i}`, 1, 2 * 24 * 60 * 60))) continue;
        if (event in STATUS_EVENTS) await onStatus(event, payload);
        else if (event === "whatsapp.message.received") forwarded = (await onReceived(payload)) || forwarded;
      } catch (err) {
        console.error(`whatsapp webhook: ${event} failed`, err);
      }
    }
    if (forwarded) await processQueue(40_000);
  });

  return NextResponse.json({ received: true });
}
