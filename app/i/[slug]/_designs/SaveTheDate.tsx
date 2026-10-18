"use client";

import { useEffect, useRef, useState } from "react";
import type { Invite } from "@/lib/types";
import { calendarEvent, eventTitle, googleCalendarUrl, icsFile, outlookCalendarUrl } from "@/lib/calendar";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// A "Save the date" trigger that opens a small menu to add the event to the
// guest's calendar — Apple/iPhone (an .ics file from /i/<slug>/calendar.ics),
// Google Calendar or Outlook.com (pre-filled "new event" pages). With no date
// set there's nothing to save yet, so it stays a link down to the RSVP.
//
// Blush Bow uses it as-is (its `.pill` trigger, cream/pink menu). Other
// templates pass their own trigger class/label and restyle the menu through
// the --std-* CSS variables (see CSS below) on any ancestor.
export default function SaveTheDate({
  invite,
  category = "wedding",
  triggerClassName = "pill",
  triggerLabel = "Save the date",
}: {
  invite: Invite;
  category?: string;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  const guestUrl = invite.slug ? `${BASE_URL}/i/${invite.slug}` : BASE_URL;
  const event = calendarEvent({
    title: eventTitle(invite.host_names, category),
    eventDate: invite.event_date,
    venueName: invite.venue_name,
    venueMapUrl: invite.venue_map_url,
    guestUrl,
  });

  // Close on a tap outside the menu, or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!event) {
    return (
      <a href="#rsvp" className={triggerClassName}>
        {triggerLabel}
      </a>
    );
  }

  // The real guest page serves the file from the route; the customize page's
  // preview has no saved invite yet, so it builds the same file inline.
  const appleHref = invite.slug
    ? `/i/${invite.slug}/calendar.ics`
    : `data:text/calendar;charset=utf-8,${encodeURIComponent(icsFile(event, "preview@apresmidi"))}`;

  const options = [
    // The route's file opens straight in Calendar on iPhone/Mac; only the
    // inline preview file needs `download` to be saved rather than shown.
    { label: "Apple / iPhone", href: appleHref, newTab: false, download: !invite.slug },
    { label: "Google Calendar", href: googleCalendarUrl(event), newTab: true, download: false },
    { label: "Outlook.com", href: outlookCalendarUrl(event), newTab: true, download: false },
  ];

  return (
    <span ref={wrapRef} className="std">
      <style>{CSS}</style>
      <button
        type="button"
        className={`${triggerClassName} std-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {triggerLabel}
      </button>
      {open && (
        <span className="std-menu" role="menu" aria-label="Add to your calendar">
          <span className="std-title">Add to your calendar</span>
          {options.map((o) =>
            // On a demo (public showcase), the options are shown but inert:
            // adding a made-up couple's wedding to a visitor's real calendar
            // — reminder and all — would only confuse them.
            invite.is_demo ? (
              <span key={o.label} role="menuitem" aria-disabled="true" className="std-option std-option-off">
                {o.label}
              </span>
            ) : (
              <a
                key={o.label}
                role="menuitem"
                className="std-option"
                href={o.href}
                {...(o.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...(o.download ? { download: "invitation.ics" } : {})}
                onClick={() => setOpen(false)}
              >
                {o.label}
              </a>
            )
          )}
          {invite.is_demo && <span className="std-note">Your guests will add your date here</span>}
        </span>
      )}
    </span>
  );
}

// Blush Bow's look by default: cream card, 1.5px ink border, uppercase pills.
// Templates override the --std-* variables to match their own palette.
const CSS = `
.std {
  position: relative; display: inline-block;
  --std-paper-d: var(--std-paper, #FBF1DE); --std-ink-d: var(--std-ink, #1c1c1c); --std-accent-d: var(--std-accent, #F6C9D3);
  --std-script-d: var(--std-script, 'Caveat', cursive); --std-sans-d: var(--std-sans, 'Space Grotesk', sans-serif);
}
.std-menu {
  position: absolute; top: calc(100% + 10px); left: 0; z-index: 20;
  display: flex; flex-direction: column; gap: 8px;
  min-width: 230px; padding: 14px;
  background: var(--std-paper-d); border: 1.5px solid var(--std-ink-d); border-radius: 16px;
  box-shadow: 0 10px 30px rgba(28, 28, 28, 0.12);
  animation: std-in .18s ease-out;
}
.std-title {
  font-family: var(--std-script-d); font-weight: 700; font-size: 1.35rem; line-height: 1;
  color: var(--std-ink-d); margin: 0 2px 4px; text-align: left;
}
.std-option {
  display: block; text-align: center;
  font-family: var(--std-sans-d); font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; font-size: 11px; line-height: 1.2; color: var(--std-ink-d); text-decoration: none;
  background: var(--std-accent-d); border: 1.5px solid var(--std-ink-d); border-radius: 999px; padding: 11px 18px;
  transition: background .15s ease, color .15s ease;
}
.std-option:hover, .std-option:focus-visible { background: var(--std-ink-d); color: var(--std-paper-d); outline: none; }
.std-option-off { opacity: 0.5; cursor: default; pointer-events: none; }
.std-note {
  font-family: var(--std-script-d); font-weight: 700; font-size: 1.1rem; line-height: 1.1;
  color: var(--std-ink-d); opacity: 0.75; text-align: center; margin-top: 2px;
}
@keyframes std-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .std-menu { animation: none; } }
`;
