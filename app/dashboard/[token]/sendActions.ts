"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { processQueue } from "@/lib/whatsappQueue";
import { invitationTemplate, reminderTemplate, type FilledTemplate } from "@/lib/whatsappTemplates";
import { MAX_GUESTS_PER_INVITE } from "@/lib/guestRules";

// Sending guests their invitations (and reminders) on WhatsApp from the
// Après-midi number, as Meta-approved templates through Kapso. Messages are
// queued here and sent by the worker (lib/whatsappQueue.ts). Authorized by the
// dashboard_token, like every dashboard action.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const REMINDER_GAP_MS = 24 * 60 * 60 * 1000;

export type SendResult = { error: string } | { needsConsent: true } | { ok: true; queued: number; skipped: number };

type InviteRow = {
  id: string;
  slug: string;
  host_names: string;
  event_date: string | null;
  send_consent_at: string | null;
  status: string;
  templates: { category: string } | { category: string }[] | null;
};

async function liveInvite(token: string) {
  if (typeof token !== "string" || !token) return null;
  const { data } = await getSupabaseAdmin()
    .from("invites")
    .select("id, slug, host_names, event_date, send_consent_at, status, templates(category)")
    .eq("dashboard_token", token)
    .maybeSingle();
  const invite = data as InviteRow | null;
  if (!invite || invite.status !== "live") return null;
  const rel = invite.templates;
  const category = (Array.isArray(rel) ? rel[0]?.category : rel?.category) ?? null;
  return { ...invite, category };
}

const NOT_AVAILABLE = "Sending isn't available right now. Please reopen your dashboard link.";
const TOO_FAST = "You've sent a lot just now — please wait a few minutes and try again.";

function cleanIds(ids: unknown): string[] {
  return Array.isArray(ids) ? [...new Set(ids.map(String))].slice(0, MAX_GUESTS_PER_INVITE) : [];
}

// A queued message: which approved template to send, its variables, and a
// readable copy for the dashboard.
function templateColumns(t: FilledTemplate) {
  return {
    body: t.preview,
    template_name: t.name,
    template_language: t.language,
    template_params: t.params,
    button_suffix: t.buttonSuffix,
  };
}

// Wakes the worker after the response is sent, so the first messages go out
// right away instead of at the next minute's run.
function kickWorker() {
  after(async () => {
    try {
      await processQueue(50_000);
    } catch (err) {
      console.error("kickWorker: failed", err);
    }
  });
}

async function guestsWithPending(inviteId: string): Promise<Set<string>> {
  const { data } = await getSupabaseAdmin()
    .from("guest_messages")
    .select("guest_id")
    .eq("invite_id", inviteId)
    .in("status", ["queued", "sending"])
    .not("guest_id", "is", null);
  return new Set((data ?? []).map((m) => m.guest_id as string));
}

// Sends (or re-sends) the invitation to these guests. The first time, the
// host confirms the guests know them and expect it (WhatsApp's business
// policy requires recipients' opt-in); `consent` records that.
export async function sendInvitations(token: string, guestIds: string[], consent = false): Promise<SendResult> {
  const invite = await liveInvite(token);
  if (!invite) return { error: NOT_AVAILABLE };
  if (!invite.send_consent_at && !consent) return { needsConsent: true };
  if (!(await rateLimit("dash-send", token, 30, 10 * 60))) return { error: TOO_FAST };

  const supabaseAdmin = getSupabaseAdmin();
  if (!invite.send_consent_at) {
    await supabaseAdmin.from("invites").update({ send_consent_at: new Date().toISOString() }).eq("id", invite.id);
  }

  const ids = cleanIds(guestIds);
  if (ids.length === 0) return { error: "Choose at least one guest." };
  const { data: guests } = await supabaseAdmin
    .from("guests")
    .select("id, name, phone, seats, token")
    .eq("invite_id", invite.id)
    .in("id", ids);

  const pending = await guestsWithPending(invite.id);
  const rows = (guests ?? [])
    .filter((g) => !pending.has(g.id))
    .map((g) => ({
      invite_id: invite.id,
      guest_id: g.id,
      kind: "invite",
      to_phone: g.phone,
      ...templateColumns(
        invitationTemplate(
          { hostNames: invite.host_names, category: invite.category, eventDate: invite.event_date },
          { name: g.name, seats: g.seats },
          { siteUrl: SITE_URL, slug: invite.slug, token: g.token }
        )
      ),
    }));

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("guest_messages").insert(rows);
    if (error) {
      console.error("sendInvitations: queue failed", error);
      return { error: "Couldn't start sending — please try again." };
    }
    kickWorker();
  }
  revalidatePath(`/dashboard/${token}/guests`);
  return { ok: true, queued: rows.length, skipped: ids.length - rows.length };
}

// A gentle reminder to guests who got their invitation but haven't replied,
// at most once a day per guest. Without ids: everyone who qualifies.
export async function sendReminders(token: string, guestIds?: string[]): Promise<SendResult> {
  const invite = await liveInvite(token);
  if (!invite) return { error: NOT_AVAILABLE };
  if (!invite.send_consent_at) return { needsConsent: true };
  if (!(await rateLimit("dash-send", token, 30, 10 * 60))) return { error: TOO_FAST };

  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin.from("guests").select("id, name, phone, seats, token").eq("invite_id", invite.id);
  const ids = guestIds ? cleanIds(guestIds) : null;
  if (ids) query = query.in("id", ids);
  const [{ data: guests }, { data: replies }, { data: messages }] = await Promise.all([
    query,
    supabaseAdmin.from("rsvps").select("guest_id").eq("invite_id", invite.id).not("guest_id", "is", null),
    supabaseAdmin
      .from("guest_messages")
      .select("guest_id, kind, status, created_at")
      .eq("invite_id", invite.id)
      .in("kind", ["invite", "reminder"]),
  ]);

  const replied = new Set((replies ?? []).map((r) => r.guest_id as string));
  const invited = new Set<string>();
  const remindedRecently = new Set<string>();
  const pending = new Set<string>();
  const now = Date.now();
  for (const m of messages ?? []) {
    const id = m.guest_id as string;
    if (m.kind === "invite" && ["sent", "delivered", "read"].includes(m.status)) invited.add(id);
    if (m.kind === "reminder" && now - new Date(m.created_at).getTime() < REMINDER_GAP_MS) remindedRecently.add(id);
    if (m.status === "queued" || m.status === "sending") pending.add(id);
  }

  const targets = (guests ?? []).filter(
    (g) => invited.has(g.id) && !replied.has(g.id) && !remindedRecently.has(g.id) && !pending.has(g.id)
  );
  const rows = targets.map((g) => ({
    invite_id: invite.id,
    guest_id: g.id,
    kind: "reminder",
    to_phone: g.phone,
    ...templateColumns(
      reminderTemplate(
        { hostNames: invite.host_names, category: invite.category, eventDate: invite.event_date },
        { name: g.name },
        { siteUrl: SITE_URL, slug: invite.slug, token: g.token }
      )
    ),
  }));

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("guest_messages").insert(rows);
    if (error) {
      console.error("sendReminders: queue failed", error);
      return { error: "Couldn't start sending — please try again." };
    }
    kickWorker();
  }
  revalidatePath(`/dashboard/${token}/guests`);
  return { ok: true, queued: rows.length, skipped: (guests?.length ?? 0) - rows.length };
}

// Stops messages that haven't gone out yet (already-sent ones can't be recalled).
export async function cancelQueued(token: string): Promise<{ error: string } | { ok: true; cancelled: number }> {
  const invite = await liveInvite(token);
  if (!invite) return { error: NOT_AVAILABLE };
  const { data, error } = await getSupabaseAdmin()
    .from("guest_messages")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("invite_id", invite.id)
    .eq("status", "queued")
    .in("kind", ["invite", "reminder"])
    .select("id");
  if (error) return { error: "Couldn't stop sending — please try again." };
  revalidatePath(`/dashboard/${token}/guests`);
  return { ok: true, cancelled: data?.length ?? 0 };
}
