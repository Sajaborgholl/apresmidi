"use client";

import { useState } from "react";
import { BellRinging, PaperPlaneTilt, UsersThree, WhatsappLogo } from "@phosphor-icons/react";
import { invitationTemplate, reminderTemplate } from "@/lib/whatsappTemplates";
import { canRemind, notYetInvited, type DashboardGuest } from "../_lib/format";
import { Button } from "./ui";
import { Sheet } from "./ui-client";
import type { Sender } from "./useSender";

export type SendMode = "invite" | "selected" | "reminder";

type EventInfo = { hostNames: string; category: string | null; eventDate: string | null };

// The Send panel: pick who gets what, see the exact WhatsApp message, send.
export default function SendSheet({
  open,
  onClose,
  initialMode,
  sender,
  guests,
  selected,
  event,
  linkBase,
}: {
  open: boolean;
  onClose: () => void;
  initialMode: SendMode;
  sender: Sender;
  guests: DashboardGuest[];
  selected: Set<string>;
  event: EventInfo;
  linkBase: string;
}) {
  const notSent = guests.filter(notYetInvited);
  const remindable = guests.filter(canRemind);
  const selectedGuests = guests.filter((g) => selected.has(g.id));
  // Ticked guests split in two: those who never got it, and those who did
  // (re-sending to them is opt-in, so nobody gets it twice by accident).
  const selectedNew = selectedGuests.filter(notYetInvited).map((g) => g.id);
  const selectedAlready = selectedGuests.filter((g) => !notYetInvited(g)).map((g) => g.id);
  const [resendAlready, setResendAlready] = useState(false);
  const selectedIds = resendAlready ? [...selectedNew, ...selectedAlready] : selectedNew;

  const options: { mode: SendMode; title: string; detail: string; count: number; icon: typeof PaperPlaneTilt }[] = [
    { mode: "invite", title: "Invite everyone not invited yet", detail: "Guests who haven't received their invitation, or whose last one failed.", count: notSent.length, icon: PaperPlaneTilt },
    ...(selectedGuests.length > 0
      ? [
          {
            mode: "selected" as const,
            title: "Invite the selected guests",
            detail:
              selectedAlready.length > 0
                ? `${selectedNew.length} new · ${selectedAlready.length} already invited.`
                : "Sends the invitation to the guests you ticked.",
            count: selectedIds.length,
            icon: UsersThree,
          },
        ]
      : []),
    { mode: "reminder", title: "Remind guests who haven't replied", detail: "Only guests whose invitation arrived. At most one reminder a day each.", count: remindable.length, icon: BellRinging },
  ];

  const [mode, setMode] = useState<SendMode>(initialMode);
  const chosen = options.find((o) => o.mode === mode) ?? options[0];

  // linkBase is `${site}/i/${slug}/g/`: split back into its parts.
  const linkMatch = linkBase.match(/^(.*)\/i\/([^/]+)\/g\/$/);
  const link = { siteUrl: linkMatch?.[1] ?? "", slug: linkMatch?.[2] ?? "" };
  const pool = chosen.mode === "reminder" ? remindable : chosen.mode === "selected" ? guests.filter((g) => selectedIds.includes(g.id)) : notSent;
  const sample = pool[0] ?? guests[0];
  const preview =
    chosen.mode === "reminder"
      ? reminderTemplate(event, { name: sample?.name ?? "Guest name" }, { ...link, token: sample?.token ?? "…" }).preview
      : invitationTemplate(event, { name: sample?.name ?? "Guest name", seats: sample?.seats ?? 2 }, { ...link, token: sample?.token ?? "…" }).preview;
  // The preview ends with "[Button] url": shown as a button under the bubble.
  const [bodyText, buttonLine] = preview.split(/\n\n(?=\[)/);
  const buttonLabel = buttonLine?.match(/^\[(.+?)\]/)?.[1];

  function go() {
    if (chosen.mode === "reminder") sender.remind();
    else sender.send(chosen.mode === "selected" ? selectedIds : notSent.map((g) => g.id));
    onClose();
  }

  const noun = chosen.mode === "reminder" ? "reminder" : "invitation";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Send on WhatsApp"
      description="Messages go out from the Après-midi number, one by one, in your name."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={<WhatsappLogo size={16} weight="fill" />} disabled={chosen.count === 0 || sender.pending} onClick={go}>
            {chosen.count === 0 ? "Nobody to send to" : `Send ${chosen.count} ${noun}${chosen.count === 1 ? "" : "s"}`}
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2.5 text-[13px] font-semibold text-[var(--ink)]/65">What to send</legend>
        <div className="flex flex-col gap-2">
          {options.map((o) => {
            const active = o.mode === chosen.mode;
            const Icon = o.icon;
            return (
              <label
                key={o.mode}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                  active ? "border-[var(--ink)] bg-[var(--cream)]" : "border-[var(--line)] hover:border-black/20"
                } ${o.count === 0 ? "opacity-55" : ""}`}
              >
                <input type="radio" name="send-mode" className="sr-only" checked={active} onChange={() => setMode(o.mode)} />
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? "bg-[var(--ink)] text-[var(--cream)]" : "bg-black/[0.05] text-[var(--ink)]/60"}`}>
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold">{o.title}</span>
                    <span className="shrink-0 rounded-full bg-black/[0.06] px-2 py-0.5 text-[12px] font-semibold tabular-nums">{o.count}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[var(--ink)]/65">{o.detail}</span>
                </span>
              </label>
            );
          })}
        </div>
        {chosen.mode === "selected" && selectedAlready.length > 0 && (
          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--cream)] px-3.5 py-3 text-[13px]">
            <input
              type="checkbox"
              checked={resendAlready}
              onChange={(e) => setResendAlready(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
            />
            <span>
              Also re-send to the {selectedAlready.length} already invited
              <span className="block text-[12px] text-[var(--ink)]/65">They&apos;ll get the same WhatsApp invitation a second time.</span>
            </span>
          </label>
        )}
      </fieldset>

      <div className="mt-6">
        <p className="mb-2.5 text-[13px] font-semibold text-[var(--ink)]/65">
          What {sample ? sample.name.split(/\s+/)[0] : "each guest"} will receive
        </p>
        <div className="rounded-2xl bg-[#ECE5DD] p-3.5">
          <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-white p-3.5 shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{bodyText}</p>
            {buttonLabel && (
              <p className="mt-3 border-t border-black/[0.07] pt-2.5 text-center text-[14px] font-semibold text-[#027EB5]">{buttonLabel}</p>
            )}
          </div>
        </div>
        <p className="mt-2 text-[12px] text-[var(--ink)]/65">Each guest sees their own name, seats and personal link.</p>
      </div>
    </Sheet>
  );
}

// Asked once, before an invitation's first send.
export function ConsentSheet({ sender }: { sender: Sender }) {
  const [checked, setChecked] = useState(false);
  const ids = sender.consentFor;
  return (
    <Sheet
      open={ids !== null}
      onClose={sender.cancelConsent}
      title="Before your first invitations go out"
      footer={
        <>
          <Button onClick={sender.cancelConsent}>Cancel</Button>
          <Button variant="primary" disabled={!checked || sender.pending} onClick={() => ids && sender.send(ids, true)}>
            Send {ids?.length ?? 0} invitation{ids?.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <p className="text-[14px] leading-relaxed text-[var(--ink)]/70">
        Invitations are sent from the Après-midi WhatsApp number in your name. WhatsApp only allows messages to people who
        expect them, so please only add guests who know you and are expecting your invitation.
      </p>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] p-4">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--ink)]" />
        <span className="text-[14px] font-medium">These guests know me and expect this invitation.</span>
      </label>
    </Sheet>
  );
}
