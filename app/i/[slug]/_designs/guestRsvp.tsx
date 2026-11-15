"use client";

import { useState, type FormEvent } from "react";
import { submitGuestRsvp } from "../actions";
import { useHydrated } from "@/lib/useHydrated";
import { formatReplyBy } from "@/lib/calendar";
import { MAX_RSVP_MESSAGE_LENGTH, type GuestReply, type InviteGuest } from "@/lib/guestRules";

// The RSVP logic every template shares, now that replies come only from a
// guest's personal link. Each template keeps its own markup and styling and
// reads everything it needs from this hook:
//
//   const rsvp = useGuestRsvp(guest);
//   - no guest (the general link), or replies closed with nothing saved
//     (rsvp.closedNoReply): render <RsvpByInvitationNote closed=… />
//   - rsvp.showForm: the form — accept/decline (rsvp.attending), a guest
//     count from 1 to rsvp.maxGuests, optionally a note (rsvp.message)
//   - otherwise the saved reply (rsvp.saved) with a "Change my reply"
//     button calling rsvp.edit(), shown only while rsvp.canChange
//
// A guest has one reply; submitting again updates it. The sample guest on
// demo invitations "saves" locally only.
export function useGuestRsvp(guest: InviteGuest | null | undefined) {
  const initial = guest?.reply ?? null;
  // After the event's day, nothing can be sent or changed.
  const closed = Boolean(guest?.closed);
  const [saved, setSaved] = useState<GuestReply | null>(initial);
  const [editing, setEditing] = useState(!initial && !closed);
  const maxGuests = guest?.seats ?? 1;
  // Nothing is pre-chosen: a guest must pick "coming" or "not coming", so
  // nobody sends a "yes" by accident.
  const [attending, setAttending] = useState<boolean | null>(initial ? initial.attending : null);
  // Starts at the seats the host reserved (a couple or family usually comes
  // together), never above them even if the host lowered them since.
  const [guestCount, setGuestCountRaw] = useState(
    Math.min(maxGuests, initial && initial.attending ? initial.guest_count : maxGuests)
  );
  const [message, setMessage] = useState(initial?.message ?? "");
  const [loading, setLoading] = useState(false);
  // Until the page's JavaScript runs, a Send tap would do a plain browser
  // submit: the page reloads and the reply is lost. Templates disable Send
  // until then (rsvp.ready).
  const ready = useHydrated();
  const [error, setError] = useState("");

  // Never above the guest's seats. The minimum of 1 is applied on submit, so a
  // number box can be cleared to type a new value without snapping back to 1.
  const setGuestCount = (n: number) => setGuestCountRaw(Math.min(maxGuests, Math.max(0, Math.floor(n) || 0)));

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!guest || loading || closed) return;
    if (attending === null) {
      setError("Please choose whether you're coming.");
      return;
    }
    const reply: GuestReply = {
      attending,
      guest_count: attending ? Math.min(maxGuests, Math.max(1, guestCount)) : 0,
      message: message.trim() || null,
    };
    if (guest.demo) {
      setSaved(reply);
      setEditing(false);
      return;
    }
    setLoading(true);
    setError("");
    const result = await submitGuestRsvp({ token: guest.token, ...reply });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(result.reply ?? reply);
    setEditing(false);
  }

  function edit() {
    if (closed) return;
    if (saved) {
      setAttending(saved.attending);
      setGuestCountRaw(Math.min(maxGuests, saved.attending ? Math.max(1, saved.guest_count) : maxGuests));
      setMessage(saved.message ?? "");
    }
    setError("");
    setEditing(true);
  }

  return {
    guest: guest ?? null,
    // ", Rami Haddad" for friendly lines (`Yay${rsvp.toName}!`), or "" for
    // the customize preview's unnamed guest ("Yay!"). The full name: a first
    // word would turn "The Haddad Family" into "Yay, The!".
    toName: guest?.name.trim() ? `, ${guest.name.trim()}` : "",
    showForm: Boolean(guest) && editing && !closed,
    // Replies have closed and this guest never replied: show the closed note.
    closedNoReply: closed && saved === null,
    // Whether to offer "Change my reply".
    canChange: !closed,
    // True while changing an existing reply (to offer "Cancel").
    changing: editing && saved !== null,
    cancelEdit: () => setEditing(false),
    saved,
    attending,
    // Picking an answer clears "Please choose whether you're coming."
    setAttending: (value: boolean) => {
      setAttending(value);
      setError("");
    },
    guestCount,
    setGuestCount,
    maxGuests,
    message,
    setMessage,
    loading,
    ready,
    error,
    submit,
    edit,
  };
}

export function seatsLine(seats: number): string {
  return seats === 1 ? "A seat is reserved for you" : `${seats} seats are reserved for you`;
}

export function replySummary(reply: GuestReply): string {
  if (!reply.attending) return "You've let them know you can't make it.";
  return reply.guest_count === 1 ? "You're coming." : `You're coming, ${reply.guest_count} of you.`;
}

// The personal greeting near the top of a guest's invitation. Templates pass
// a class (and their own child classes via `parts`) to style it in their look.
// None for the customize preview's unnamed guest.
export function GuestWelcome({
  guest,
  className,
  parts = {},
}: {
  guest: InviteGuest | null | undefined;
  className: string;
  parts?: { dear?: string; seats?: string };
}) {
  if (!guest?.name) return null;
  return (
    <div className={className}>
      <p className={parts.dear}>Dear {guest.name},</p>
      <p className={parts.seats}>
        You&rsquo;re warmly invited &middot; {seatsLine(guest.seats).toLowerCase()}
      </p>
      {/* The host's deadline, while it's still open and they haven't replied. */}
      {guest.replyBy && !guest.closed && !guest.reply && (
        <p className={parts.seats}>Please reply by {formatReplyBy(guest.replyBy)}</p>
      )}
    </div>
  );
}

// The optional note for the hosts, shown in every template's form (it lands
// on the dashboard's Messages tab). Unstyled on purpose: it takes the
// template's own font and colours, with just enough shape to read as a field.
export function RsvpNoteField({
  rsvp,
  label = "A note for the hosts",
  className,
  rows = 3,
}: {
  rsvp: { message: string; setMessage: (m: string) => void };
  label?: string;
  className?: string;
  // Fewer on a fixed-size page (the Coastal flip-book).
  rows?: number;
}) {
  return (
    <label className={className} style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", textAlign: "left" }}>
      <span style={{ fontSize: "0.85em", opacity: 0.8 }}>
        {label} <span style={{ opacity: 0.7 }}>(optional)</span>
      </span>
      <textarea
        rows={rows}
        maxLength={MAX_RSVP_MESSAGE_LENGTH}
        value={rsvp.message}
        onChange={(e) => rsvp.setMessage(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          font: "inherit",
          fontSize: 16,
          color: "inherit",
          background: "rgba(255,255,255,0.6)",
          border: "1px solid currentColor",
          borderRadius: 12,
          padding: "10px 12px",
          resize: "vertical",
          opacity: 0.9,
        }}
      />
    </label>
  );
}

// Shown in place of the RSVP form on the general invitation link, and on a
// personal link once replies have closed (`closed`).
export function RsvpByInvitationNote({ className, closed }: { className: string; closed?: boolean }) {
  return (
    <p className={className}>
      {closed ? "Replies have closed." : "Please RSVP through the personal invitation link you received."}
    </p>
  );
}
