import { after, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { sendText } from "@/lib/kapso";
import { validKapsoSignature } from "@/lib/kapsoSignature";

// Kapso's webhook for the Après-midi number (registered with
// scripts/kapso-webhook.ts for https://<site>/api/whatsapp/webhook). Every
// call is signed: X-Webhook-Signature is the hex HMAC-SHA256 of the raw body,
// keyed with KAPSO_WEBHOOK_SECRET. The event name is in X-Webhook-Event.
//
//   whatsapp.message.sent / delivered / read / failed -> our message's status
//   whatsapp.message.received -> a guest wrote to the Après-midi number:
//                                reply once (a day) with their personal link

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

// A guest wrote to the Après-midi number (nobody reads it). Instead of
// forwarding to the host, it answers once a day with the guest's personal
// link, so they reply where the host will see it. The same message every
// time, even after the event (their page then says replies have closed).
// Free, and needs no Meta template: their own message opens WhatsApp's
// 24-hour window for a normal text reply. Not queued: the queue only sends
// approved templates, and a missed reply isn't worth retrying.
async function onReceived(payload: Json): Promise<void> {
  const message = obj(payload.message);
  const phone = String(message.from ?? obj(payload.conversation).phone_number ?? "").replace(/\D/g, "");
  if (phone.length < 7 || phone.length > 15) return;

  const supabaseAdmin = getSupabaseAdmin();
  // Who is this? The guest we most recently sent an invitation/reminder to.
  // Anyone we never invited gets no reply.
  const { data: last } = await supabaseAdmin
    .from("guest_messages")
    .select("invite_id, guest_id")
    .eq("to_phone", phone)
    .in("kind", ["invite", "reminder"])
    .not("guest_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last?.guest_id) return;

  const [{ data: guest }, { data: invite }] = await Promise.all([
    supabaseAdmin.from("guests").select("id, name, token").eq("id", last.guest_id).maybeSingle(),
    supabaseAdmin.from("invites").select("slug, host_names, status").eq("id", last.invite_id).maybeSingle(),
  ]);
  if (!guest || !invite || invite.status !== "live") return;
  if (!(await rateLimit("wa-autoreply", guest.id, 1, 24 * 60 * 60))) return;

  const link = `${SITE_URL}/i/${invite.slug}/g/${guest.token}`;
  const text = `Hi ${guest.name}! Messages to this number aren't read. To reply to ${invite.host_names}'s invitation, tap your personal link: ${link}`;
  const result = await sendText(phone, text);
  if (!result.ok) console.error(`whatsapp webhook: auto-reply to guest ${guest.id} failed`, result.error);
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
    for (const [i, item] of items.entries()) {
      const payload = obj(item);
      const event = headerEvent || String(payload.event ?? "");
      try {
        // Kapso retries deliveries; the delivered/read/failed statuses of one
        // message share a key, so the event name is part of it.
        if (idempotency && !(await rateLimit("kapso-wh", `${event}:${idempotency}:${i}`, 1, 2 * 24 * 60 * 60))) continue;
        if (event in STATUS_EVENTS) await onStatus(event, payload);
        else if (event === "whatsapp.message.received") await onReceived(payload);
      } catch (err) {
        console.error(`whatsapp webhook: ${event} failed`, err);
      }
    }
  });

  return NextResponse.json({ received: true });
}
