"use client";

import { useState, useTransition } from "react";
import { PaperPlaneTilt, BellRinging, StopCircle, WarningCircle } from "@phosphor-icons/react";
import { invitationTemplate } from "@/lib/whatsappTemplates";
import { cancelQueued, sendInvitations, sendReminders, type SendResult } from "../sendActions";
import type { DashboardGuest, SendingState } from "../_lib/format";

const buttonClass =
  "inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-2 text-[13px] font-semibold transition hover:border-black/30 active:scale-[0.97] disabled:opacity-40";
const primaryClass =
  "inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition hover:opacity-90 active:scale-[0.97] disabled:opacity-40";

// Guests who haven't been sent their invitation yet (nothing sent, or the
// last attempt failed or was stopped).
export function notYetInvited(g: DashboardGuest) {
  return !g.delivery || g.delivery.status === "failed" || g.delivery.status === "cancelled";
}

// Sending invitations and reminders, shared by the panel's buttons and each
// guest's "Send"/"Retry" button. The first send asks the host to confirm their
// guests expect the invitation (WhatsApp's business policy requires opt-in).
export function useSender(token: string, onNotice: (text: string, error?: boolean) => void, onSent: () => void) {
  const [consentFor, setConsentFor] = useState<string[] | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [pending, startTransition] = useTransition();

  function report(r: SendResult, what: string) {
    if ("error" in r) return onNotice(r.error, true);
    if ("needsConsent" in r) return;
    if (r.queued === 0) {
      return onNotice(`Nothing to send: those guests already have a ${what} on its way, or were reminded today.`, true);
    }
    const minutes = Math.max(1, Math.ceil((r.queued * 1.2) / 60));
    onNotice(
      `${r.queued} ${what}${r.queued === 1 ? "" : "s"} on the way — they go out one by one${
        r.queued > 1 ? `, about ${minutes} minute${minutes === 1 ? "" : "s"} in all` : ""
      }.${r.skipped ? ` ${r.skipped} skipped (already on the way).` : ""}`
    );
    onSent();
  }

  function send(ids: string[], consent = false) {
    if (ids.length === 0) return;
    startTransition(async () => {
      const r = await sendInvitations(token, ids, consent);
      if ("needsConsent" in r) {
        setConsentFor(ids);
        setConsentChecked(false);
        return;
      }
      setConsentFor(null);
      report(r, "invitation");
    });
  }

  function remind(ids?: string[]) {
    startTransition(async () => {
      const r = await sendReminders(token, ids);
      if ("needsConsent" in r) return onNotice("Send the invitations first; reminders can follow.", true);
      report(r, "reminder");
    });
  }

  function stop() {
    if (!window.confirm("Stop the messages that haven't gone out yet? Ones already sent can't be recalled.")) return;
    startTransition(async () => {
      const r = await cancelQueued(token);
      onNotice("error" in r ? r.error : `Stopped ${r.cancelled} message${r.cancelled === 1 ? "" : "s"}.`, "error" in r);
    });
  }

  return {
    pending,
    send,
    remind,
    stop,
    consentFor,
    consentChecked,
    setConsentChecked,
    cancelConsent: () => setConsentFor(null),
  };
}

export type Sender = ReturnType<typeof useSender>;

// Sending invitations and reminders on WhatsApp, from the Après-midi number.
export default function SendPanel({
  sender,
  guests,
  selected,
  sending,
  event,
  linkBase,
}: {
  sender: Sender;
  guests: DashboardGuest[];
  selected: Set<string>;
  sending: SendingState;
  event: { hostNames: string; category: string | null; eventDate: string | null };
  linkBase: string;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const uninvited = guests.filter(notYetInvited);
  const remindable = guests.filter(
    (g) => !g.reply && g.delivery && ["sent", "delivered", "read"].includes(g.delivery.status)
  );
  const sample = guests.find((g) => selected.has(g.id)) ?? guests[0];
  // linkBase is `${site}/i/${slug}/g/`: split back into its parts.
  const linkMatch = linkBase.match(/^(.*)\/i\/([^/]+)\/g\/$/);
  const previewText = invitationTemplate(
    event,
    { name: sample?.name ?? "Rami & family", seats: sample?.seats ?? 2 },
    { siteUrl: linkMatch?.[1] ?? "", slug: linkMatch?.[2] ?? "", token: sample?.token ?? "…" }
  ).preview;
  const paused = sending.pending > 0 && sending.whatsapp.startsWith("paused");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.08] bg-[var(--cream)]/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="display mr-auto text-[15px] font-bold">Send on WhatsApp</p>
        <button type="button" onClick={() => setShowPreview((s) => !s)} className={buttonClass} aria-expanded={showPreview}>
          {showPreview ? "Hide message" : "See message"}
        </button>
      </div>

      {showPreview && (
        <pre
          className="whitespace-pre-wrap rounded-xl border border-black/[0.06] bg-white p-3.5 font-sans text-[13px] leading-relaxed text-[var(--ink)]/80"
        >
          {previewText}
        </pre>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={sender.pending || selected.size === 0}
          onClick={() => sender.send([...selected])}
          className={primaryClass}
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          <PaperPlaneTilt size={15} />
          Send to selected{selected.size ? ` (${selected.size})` : ""}
        </button>
        <button
          type="button"
          disabled={sender.pending || uninvited.length === 0}
          onClick={() => sender.send(uninvited.map((g) => g.id))}
          className={buttonClass}
        >
          <PaperPlaneTilt size={15} />
          Send to everyone not invited yet ({uninvited.length})
        </button>
        <button
          type="button"
          disabled={sender.pending || remindable.length === 0}
          onClick={() => sender.remind()}
          className={buttonClass}
        >
          <BellRinging size={15} />
          Remind guests who haven&apos;t replied ({remindable.length})
        </button>
      </div>

      {sender.consentFor && (
        <div className="rounded-xl border border-[var(--ink)]/15 bg-white p-3.5 text-[13px]">
          <p className="font-semibold">Before your first invitations go out</p>
          <p className="mt-1 text-[var(--ink)]/65">
            Invitations are sent from the Après-midi WhatsApp number in your name. Please only add people who know you and
            expect your invitation.
          </p>
          <label className="mt-2.5 flex items-start gap-2">
            <input
              type="checkbox"
              checked={sender.consentChecked}
              onChange={(e) => sender.setConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>These guests know me and expect this invitation.</span>
          </label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!sender.consentChecked || sender.pending}
              onClick={() => sender.send(sender.consentFor ?? [], true)}
              className={primaryClass}
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Send {sender.consentFor.length} invitation{sender.consentFor.length === 1 ? "" : "s"}
            </button>
            <button type="button" onClick={sender.cancelConsent} className={buttonClass}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {sending.pending > 0 && (
        <div
          role="status"
          className={`flex flex-wrap items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] ${
            paused ? "bg-[#b3261e]/[0.07] text-[#b3261e]" : "bg-[var(--blue)]/25"
          }`}
        >
          {paused ? <WarningCircle size={16} /> : <PaperPlaneTilt size={16} />}
          <span className="mr-auto">
            {paused
              ? `Sending is paused on our side for a moment. ${sending.pending} message${
                  sending.pending === 1 ? "" : "s"
                } will go out automatically as soon as it's resolved — we've been alerted.`
              : `Sending… ${sending.pending} message${sending.pending === 1 ? "" : "s"} left.`}
          </span>
          <button type="button" onClick={sender.stop} disabled={sender.pending} className={buttonClass}>
            <StopCircle size={15} />
            Stop sending
          </button>
        </div>
      )}
    </div>
  );
}
