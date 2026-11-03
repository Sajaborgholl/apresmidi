"use client";

import { useState, type FormEvent } from "react";
import { submitGuestRsvp } from "../actions";
import type { GuestReply, InviteGuest } from "@/lib/guestRules";

// The RSVP logic every template shares, now that replies come only from a
// guest's personal link. Each template keeps its own markup and styling and
// reads everything it needs from this hook:
//
//   const rsvp = useGuestRsvp(guest);
//   - no guest (the general link): render <RsvpByInvitationNote />
//   - rsvp.showForm: the form — accept/decline (rsvp.attending), a guest
//     count from 1 to rsvp.maxGuests, optionally a note (rsvp.message)
//   - otherwise the saved reply (rsvp.saved) with a "Change my reply"
//     button calling rsvp.edit()
//
// A guest has one reply; submitting again updates it. The sample guest on
// demo invitations "saves" locally only.
export function useGuestRsvp(guest: InviteGuest | null | undefined) {
  const initial = guest?.reply ?? null;
  const [saved, setSaved] = useState<GuestReply | null>(initial);
  const [editing, setEditing] = useState(!initial);
  const [attending, setAttending] = useState(initial ? initial.attending : true);
  const [guestCount, setGuestCountRaw] = useState(initial && initial.attending ? initial.guest_count : 1);
  const [message, setMessage] = useState(initial?.message ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxGuests = guest?.seats ?? 1;
  // Never above the guest's seats. The minimum of 1 is applied on submit, so a
  // number box can be cleared to type a new value without snapping back to 1.
  const setGuestCount = (n: number) => setGuestCountRaw(Math.min(maxGuests, Math.max(0, Math.floor(n) || 0)));

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!guest || loading) return;
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
    if (saved) {
      setAttending(saved.attending);
      setGuestCountRaw(saved.attending ? Math.max(1, saved.guest_count) : 1);
      setMessage(saved.message ?? "");
    }
    setError("");
    setEditing(true);
  }

  return {
    guest: guest ?? null,
    // ", Rami" for friendly lines (`Yay${rsvp.toName}!` → "Yay, Rami!"), or
    // "" for the customize preview's unnamed guest ("Yay!").
    toName: guest?.name.trim() ? `, ${guest.name.trim().split(/\s+/)[0]}` : "",
    showForm: Boolean(guest) && editing,
    // True while changing an existing reply (to offer "Cancel").
    changing: editing && saved !== null,
    cancelEdit: () => setEditing(false),
    saved,
    attending,
    setAttending,
    guestCount,
    setGuestCount,
    maxGuests,
    message,
    setMessage,
    loading,
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
    </div>
  );
}

// Shown in place of the RSVP form on the general invitation link.
export function RsvpByInvitationNote({ className }: { className: string }) {
  return (
    <p className={className}>
      Please RSVP through the personal invitation link you received.
    </p>
  );
}
