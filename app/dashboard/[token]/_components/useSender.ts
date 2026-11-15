"use client";

import { useState, useTransition } from "react";
import { cancelQueued, sendInvitations, sendReminders, type SendResult } from "../sendActions";
import type { Confirm } from "./ui-client";

// Sending invitations and reminders, shared by the Send panel, each guest's
// row and the selection bar. The first send asks the host to confirm their
// guests expect the invitation (WhatsApp's business policy requires opt-in):
// `consentFor` then holds the guests waiting on that confirmation.
export function useSender(token: string, onNotice: (text: string, error?: boolean) => void, onSent: () => void, confirm: Confirm) {
  const [consentFor, setConsentFor] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  function report(r: SendResult, what: string) {
    if ("error" in r) return onNotice(r.error, true);
    if ("needsConsent" in r) return;
    if (r.queued === 0) {
      return onNotice(`Nothing to send: those guests already have a ${what} on its way, or were reminded today.`, true);
    }
    const minutes = Math.max(1, Math.ceil((r.queued * 1.2) / 60));
    onNotice(
      `${r.queued} ${what}${r.queued === 1 ? "" : "s"} on the way${
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

  async function stop() {
    const ok = await confirm({
      title: "Stop sending?",
      text: "Messages that haven't gone out yet won't be sent. Ones already sent can't be recalled.",
      confirmLabel: "Stop sending",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await cancelQueued(token);
      onNotice("error" in r ? r.error : `Stopped ${r.cancelled} message${r.cancelled === 1 ? "" : "s"}.`, "error" in r);
    });
  }

  return { pending, send, remind, stop, consentFor, cancelConsent: () => setConsentFor(null) };
}

export type Sender = ReturnType<typeof useSender>;
