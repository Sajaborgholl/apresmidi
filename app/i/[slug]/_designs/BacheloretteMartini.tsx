"use client";

import { useEffect, useRef, useState } from "react";
import { submitRsvp } from "../actions";
import type { Invite } from "@/lib/types";
import Reveal from "@/app/_components/Reveal";

// Martini Bachelorette — ported from template-bachelorette-martini-prototype.html,
// a clone of the Canva design "Black & White Monochrome Retro Simple
// Bachelorette Weekend Hen Party Invitation". Every position, size, rotation
// and font size on the card comes from that design's own scene data (726.486 ×
// 1024 canvas), and was checked with a pixel diff against Canva's PNG export.
//
// The line art (public/templates/bachelorette-martini/*.svg) is Canva's own
// vector artwork, exported by the customer — not a redraw. bride-martini.svg
// also carries the three star doodles that sit inside its box in the source,
// so only three standalone stars are placed here. star-doodle.svg was
// exported pre-rotated and has had that rotation undone so it can be reused.
//
// LICENSING: these illustrations are Canva library elements by other
// creators (standard licence). The customer chose to build with them and is
// checking whether reuse in a sold template is allowed before launch.
//
// Both fonts are the real ones from the source and free on Google Fonts
// (loaded in app/layout.tsx): Noto Serif Display at wdth 62.5 (Canva's
// "Noto Serif Display ExtraCondensed") and Pinyon Script.

const ASSETS = "/templates/bachelorette-martini";

function Deco({ className, file }: { className: string; file: string }) {
  return (
    <div className={`bm-el ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${ASSETS}/${file}`} alt="" aria-hidden="true" />
    </div>
  );
}

function ordinal(day: number) {
  const tens = day % 100;
  if (tens >= 11 && tens <= 13) return `${day}th`;
  return `${day}${["th", "st", "nd", "rd"][day % 10] ?? "th"}`;
}

export default function BacheloretteMartini({ invite }: { invite: Invite }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The name box is a fixed 35.5% of the card (sized for "OLIVIA'S"). Longer
  // names shrink to fit on one line instead of overflowing into the bride.
  // Everything is in cqw, so the ratio measured once holds at any card width.
  const nameBoxRef = useRef<HTMLDivElement>(null);
  const nameTextRef = useRef<HTMLParagraphElement>(null);
  const [nameScale, setNameScale] = useState(1);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      const box = nameBoxRef.current;
      const text = nameTextRef.current;
      if (cancelled || !box || !text) return;
      // scrollWidth is measured at the current scale, so undo it first.
      setNameScale((current) => Math.min(1, box.clientWidth / (text.scrollWidth / current)));
    });
    return () => {
      cancelled = true;
    };
  }, [invite.host_names]);

  const eventDate = invite.event_date ? new Date(invite.event_date) : null;
  const dayLabel = eventDate ? ordinal(eventDate.getDate()) : null;
  const monthLabel = eventDate ? eventDate.toLocaleDateString("en-US", { month: "long" }) : null;
  const dateFormatted = eventDate
    ? eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;
  const timeFormatted = eventDate
    ? eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;
  const venue = invite.venue_name ?? "Location coming soon";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const { error: insertError } = await submitRsvp({
      invite_id: invite.id,
      guest_name: name.trim(),
      attending: attending === "yes",
      guest_count: attending === "yes" ? guestCount : 0,
    });

    setLoading(false);
    if (insertError) {
      setError("Something went wrong — please try again.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="bm-page">
      <style>{CSS}</style>

      <section className="bm-card" aria-label="Invitation">
        <Deco className="bm-bride bm-in bm-i0" file="bride-martini.svg" />

        <div className="bm-el bm-name bm-in bm-i1" ref={nameBoxRef}>
          <p
            className="bm-text bm-cond"
            ref={nameTextRef}
            style={{ fontSize: `calc(9.901cqw * ${nameScale})` }}
          >
            {invite.host_names}&rsquo;s
          </p>
        </div>

        <div className="bm-el bm-tagline bm-in bm-i2">
          <p className="bm-text">
            Last Fling
            <br />
            Before
            <br />
            The Ring
          </p>
        </div>

        <div className="bm-el bm-title bm-in bm-i3">
          <h1 className="bm-text bm-cond">Bachelorette weekend</h1>
        </div>

        <Deco className="bm-star-e bm-in bm-i6" file="star-doodle.svg" />
        <Deco className="bm-star-f bm-in bm-i6" file="star-doodle.svg" />

        {dayLabel ? (
          <>
            <div className="bm-el bm-day bm-in bm-i4">
              <p className="bm-text bm-cond">{dayLabel}</p>
            </div>
            <div className="bm-el bm-month bm-in bm-i4">
              <p className="bm-text bm-cond">{monthLabel}</p>
            </div>
          </>
        ) : (
          <div className="bm-el bm-month bm-in bm-i4">
            <p className="bm-text bm-cond bm-loose">Date coming soon</p>
          </div>
        )}
        <Deco className="bm-star-d bm-in bm-i6" file="star-doodle.svg" />

        <div className="bm-el bm-address bm-in bm-i4">
          <p className="bm-text bm-cond">{venue}</p>
        </div>

        <Deco className="bm-coupes bm-in bm-i5" file="coupe-glasses.svg" />
      </section>

      <Reveal className="bm-rsvp bm-cond">
        <h2>RSVP</h2>
        {dateFormatted && (
          <p className="bm-when">
            <span>{dateFormatted}</span>
            {timeFormatted && <span> · {timeFormatted}</span>}
          </p>
        )}
        <p className="bm-where">{venue}</p>

        {!submitted ? (
          <>
            <p className="bm-script-note">Will you be there?</p>
            <form className="bm-form" onSubmit={handleSubmit}>
              <div>
                <label className="bm-label" htmlFor="bm-guest-name">
                  Your name
                </label>
                <input
                  id="bm-guest-name"
                  className="bm-input"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <span className="bm-label">Attending</span>
                <div className="bm-choice">
                  <button type="button" aria-pressed={attending === "yes"} onClick={() => setAttending("yes")}>
                    Count me in
                  </button>
                  <button type="button" aria-pressed={attending === "no"} onClick={() => setAttending("no")}>
                    Can&rsquo;t make it
                  </button>
                </div>
              </div>

              {attending === "yes" && (
                <div>
                  <span className="bm-label">Guests</span>
                  <div className="bm-stepper">
                    <button
                      type="button"
                      aria-label="Fewer guests"
                      onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                    >
                      −
                    </button>
                    <output aria-live="polite">{guestCount}</output>
                    <button
                      type="button"
                      aria-label="More guests"
                      onClick={() => setGuestCount((c) => Math.min(6, c + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="bm-error">{error}</p>}

              <button className="bm-submit" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send RSVP"}
              </button>
            </form>
          </>
        ) : (
          <div className="bm-thanks">
            <p className="bm-thanks-script">{attending === "yes" ? "See you there!" : "You’ll be missed!"}</p>
            <p className="bm-thanks-body">
              {attending === "yes"
                ? `Cheers, ${name.trim() || "friend"} — your RSVP is in.`
                : `Thanks for letting us know, ${name.trim() || "friend"}.`}
            </p>
          </div>
        )}
      </Reveal>
    </div>
  );
}

// Card positions are % of Canva's 726.486 × 1024 canvas; font sizes are
// Canva's font-size × its scale() wrapper (×1.83063, or ×2.02429 for the
// script block) in cqw. Text offsets start from Canva's inner translate()
// and were nudged (≤0.6cqw) after a pixel diff against the Canva export.
const CSS = `
.bm-page {
  --bm-cream: #fff5e8;
  --bm-ink: #000000;
  --bm-serif: 'Noto Serif Display', serif;
  --bm-script: 'Pinyon Script', cursive;
  min-height: 100vh;
  background: var(--bm-cream);
  color: var(--bm-ink);
  font-family: var(--bm-serif);
  font-stretch: 62.5%;
}

.bm-card {
  position: relative;
  width: min(100%, 480px);
  aspect-ratio: 726.486 / 1024;
  margin: 0 auto;
  background: var(--bm-cream);
  container-type: inline-size;
  overflow: hidden;
}
.bm-el { position: absolute; }
.bm-el img { display: block; width: 100%; height: 100%; }

.bm-bride  { left: 8.1426%; top: 7.0946%; width: 49.743%; height: 40.506%; }
.bm-coupes { left: 57.093%; top: 73.629%; width: 30.121%; height: 20.007%; }
.bm-star-d { left: 35.154%; top: 75.649%; width: 11.217%; height: 9.795%; }
.bm-star-e { left: 12.131%; top: 63.678%; width: 7.985%; height: 6.972%; transform: rotate(-71.5207deg); }
.bm-star-f { left: 78.643%; top: 63.678%; width: 7.985%; height: 6.972%; transform: rotate(-71.5207deg); }

.bm-text { margin: 0; white-space: nowrap; }
.bm-cond {
  font-family: var(--bm-serif);
  font-stretch: 62.5%;
  font-weight: 400;
  letter-spacing: -0.087em;
  text-transform: uppercase;
}

.bm-name {
  left: 51.412%; top: 13.015%; width: 35.524%; height: 8.396%;
  transform: rotate(-2.92388deg);
  text-align: center;
}
.bm-name .bm-text {
  font-style: italic;
  line-height: 11.34cqw;
  transform: translate(-0.591cqw, 0.008cqw);
}

.bm-tagline {
  left: 46.187%; top: 22.431%; width: 45.972%; height: 27.078%;
  transform: rotate(-2.92388deg);
  text-align: center;
}
.bm-tagline .bm-text {
  font-family: var(--bm-script);
  font-size: 10.999cqw;
  line-height: 12.539cqw;
  transform: translate(-0.4cqw, -0.13cqw);
}

.bm-title { left: 10%; top: 51.387%; width: 80%; height: 20.101%; text-align: center; }
.bm-title .bm-text {
  white-space: normal; /* one string in the source — let it wrap */
  font-kerning: none; /* the source turns kerning off on this layer */
  font-style: italic;
  font-size: 12.431cqw;
  line-height: 13.607cqw;
  transform: translate(-0.62cqw, 0.24cqw);
}

.bm-day { left: 10%; top: 73.629%; width: 49.616%; height: 9.164%; }
.bm-day .bm-text { font-size: 10.942cqw; line-height: 21.67cqw; transform: translate(-0.08cqw, -4.62cqw); }
.bm-month { left: 10%; top: 83.065%; width: 49.616%; height: 4.757%; }
.bm-month .bm-text { font-size: 5.793cqw; line-height: 11.339cqw; transform: translate(-0.08cqw, -2.48cqw); }
.bm-loose { letter-spacing: 0.02em; }
.bm-address { left: 10%; top: 88.615%; width: 49.616%; height: 4.291%; }
.bm-address .bm-text {
  font-kerning: none;
  font-size: 5.04cqw;
  line-height: 7.056cqw;
  transform: translate(-0.08cqw, -0.82cqw);
}

/* ---------- RSVP ---------- */
.bm-rsvp {
  max-width: 480px;
  margin: 0 auto;
  padding: 48px 28px 72px;
  text-align: center;
  border-top: 1px solid var(--bm-ink);
  /* The card's -0.087em tracking only works at display sizes; at form sizes
     it fuses words together, so the RSVP opens it back up. */
  letter-spacing: 0.02em;
}
.bm-rsvp h2 {
  margin: 0;
  font-style: italic;
  font-weight: 400;
  font-size: 64px;
  line-height: 1;
  letter-spacing: -0.06em;
}
.bm-when { margin: 10px 0 2px; font-size: 22px; }
.bm-when span { white-space: nowrap; }
.bm-where { margin: 0 0 32px; font-size: 18px; }
.bm-script-note, .bm-thanks-script {
  font-family: var(--bm-script);
  text-transform: none;
  letter-spacing: 0;
  font-size: 30px;
  margin: 0 0 24px;
}
.bm-thanks-script { font-size: 40px; margin: 8px 0 6px; }
.bm-thanks-body { margin: 0; font-size: 20px; }

.bm-form { display: grid; gap: 22px; text-align: left; }
.bm-label { display: block; font-size: 17px; margin-bottom: 6px; }
.bm-input {
  width: 100%;
  border: 0;
  border-bottom: 1px solid var(--bm-ink);
  border-radius: 0;
  background: transparent;
  padding: 8px 2px;
  font: 400 22px var(--bm-serif);
  font-stretch: 62.5%;
  color: var(--bm-ink);
  outline: none;
}
.bm-input:focus-visible { border-bottom-width: 2px; padding-bottom: 7px; }

.bm-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.bm-choice button, .bm-stepper button, .bm-submit {
  font-family: var(--bm-serif);
  font-stretch: 62.5%;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--bm-ink);
  background: transparent;
  border: 1px solid var(--bm-ink);
  border-radius: 999px;
  cursor: pointer;
  transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1), background-color 160ms ease, color 160ms ease;
}
.bm-choice button { padding: 12px 8px; font-size: 18px; }
.bm-choice button[aria-pressed="true"] { background: var(--bm-ink); color: var(--bm-cream); }
.bm-stepper { display: flex; align-items: center; gap: 18px; }
.bm-stepper button { width: 40px; height: 40px; padding: 0; font: 300 20px/1 system-ui, sans-serif; }
.bm-stepper output { font-size: 30px; min-width: 24px; text-align: center; }
.bm-submit {
  margin-top: 6px;
  padding: 15px;
  font-size: 22px;
  background: var(--bm-ink);
  color: var(--bm-cream);
}
.bm-submit:disabled { opacity: 0.6; cursor: default; }
.bm-choice button:active, .bm-stepper button:active, .bm-submit:active:not(:disabled) { transform: scale(0.97); }
.bm-choice button:focus-visible, .bm-stepper button:focus-visible, .bm-submit:focus-visible {
  outline: 2px solid var(--bm-ink);
  outline-offset: 3px;
}
@media (hover: hover) and (pointer: fine) {
  .bm-choice button[aria-pressed="false"]:hover, .bm-stepper button:hover { background: rgba(0, 0, 0, 0.06); }
}
.bm-error { margin: 0; font-size: 17px; color: #a1121b; text-align: center; }

/* ---------- Motion ---------- */
/* Uses the standalone translate property so it composes with the rotate()
   transforms above instead of overwriting them. */
.bm-in {
  opacity: 0;
  translate: 0 10px;
  animation: bm-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.bm-i0 { animation-delay: 80ms; }
.bm-i1 { animation-delay: 140ms; }
.bm-i2 { animation-delay: 200ms; }
.bm-i3 { animation-delay: 260ms; }
.bm-i4 { animation-delay: 320ms; }
.bm-i5 { animation-delay: 380ms; }
.bm-i6 { animation-delay: 440ms; }
@keyframes bm-rise { to { opacity: 1; translate: 0 0; } }
@keyframes bm-fade { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .bm-in { translate: 0 0; animation-name: bm-fade; }
}
`;
