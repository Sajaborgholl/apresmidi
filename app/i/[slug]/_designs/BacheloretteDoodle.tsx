"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import type { Invite } from "@/lib/types";
import Reveal from "@/app/_components/Reveal";

// Doodle Bachelorette — ported from template-bachelorette-doodle-prototype.html,
// a clone of the Canva design "Blue Illustrated Bachelorette Weekend Party
// Invitation". Two cards stacked: the white invite, then the blue page whose
// original weekend schedule was replaced (per the customer) with the RSVP.
//
// Art placement: each doodle is Canva's own vector export (in
// public/templates/bachelorette-doodle/). Rather than trusting each export's
// padding, every file was slid over Canva's full-page render until its lines
// landed (≥0.84 line overlap, most ≥0.93), so the boxes below include that
// padding. Exports that came out rotated or flipped are placed as rendered.
// The *-white.svg files are the same art recoloured for the blue page.
//
// Text positions/sizes come from the design's scene data (726.486 × 1024
// canvas, ×1.51351 text scale), nudged ≤1.9cqw after a pixel diff. The script
// font needs ligatures off — with them on, Chrome joins "l"+"o" in
// "Bachelorette" more tightly than Canva does.
//
// PENDING ASSETS: wedding rings, the 4-point star cluster, the kitsch outline
// star and the heart weren't exported yet; their Canva boxes are in the
// prototype and they'll be added here once the SVGs arrive.
//
// LICENSING: these are Canva library elements (mostly standard licence; the
// stars/hearts are free). The customer is checking reuse rights before launch.
//
// Fonts are the real ones from the source, free on Google Fonts (loaded in
// app/layout.tsx): Beth Ellen and Walter Turncoat.

const ASSETS = "/templates/bachelorette-doodle";

function Deco({ className, file, delay }: { className: string; file: string; delay?: number }) {
  const style: CSSProperties | undefined = delay === undefined ? undefined : { animationDelay: `${delay}ms` };
  return (
    <div className={`bb-el ${className}${delay === undefined ? "" : " bb-in"}`} style={style}>
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

const rise = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export default function BacheloretteDoodle({ invite }: { invite: Invite }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // "Sarina's" fills its Canva box; longer names shrink to stay on one line.
  // Everything is in cqw, so one measurement holds at any card width.
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
  const dateLabel = eventDate
    ? `${eventDate.toLocaleDateString("en-US", { month: "long" })} ${ordinal(eventDate.getDate())}, ${eventDate.getFullYear()}`
    : "Date coming soon";
  const venue = invite.venue_name ?? "Location coming soon";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("rsvps").insert({
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
    <div className="bb-page">
      <style>{CSS}</style>

      <div className="bb-wrap">
        <section className="bb-card bb-card-1" aria-label="Invitation">
          <Deco className="bb-p1-clink-glasses" file="clink-glasses.svg" delay={60} />
          <Deco className="bb-p1-disco-ball" file="disco-ball.svg" delay={90} />
          <Deco className="bb-p1-man-wine" file="man-wine.svg" delay={300} />
          <Deco className="bb-p1-bikini" file="bikini.svg" delay={240} />
          <Deco className="bb-p1-moon" file="moon.svg" delay={320} />
          <Deco className="bb-p1-wine-toast" file="wine-toast.svg" delay={300} />
          <Deco className="bb-p1-martini" file="martini.svg" delay={200} />
          <Deco className="bb-p1-pouring-wine" file="pouring-wine.svg" delay={220} />
          <Deco className="bb-p1-woman" file="woman.svg" delay={280} />

          <div className="bb-el bb-join bb-tilt bb-in" style={rise(120)}>
            <p className="bb-text bb-hand">Join us for</p>
          </div>
          <div className="bb-el bb-name bb-tilt bb-in" style={rise(180)} ref={nameBoxRef}>
            <p
              className="bb-text bb-scr"
              ref={nameTextRef}
              style={{ fontSize: `calc(10.556cqw * ${nameScale})` }}
            >
              {invite.host_names}&rsquo;s
            </p>
          </div>
          <div className="bb-el bb-title bb-tilt bb-in" style={rise(240)}>
            <h1 className="bb-text bb-scr">Bachelorette</h1>
          </div>
          <div className="bb-el bb-date bb-tilt bb-in" style={rise(300)}>
            <p className="bb-text bb-hand">{dateLabel}</p>
          </div>
          <div className="bb-el bb-addr bb-tilt bb-in" style={rise(340)}>
            <p className="bb-text bb-hand">{venue}</p>
          </div>
          <div className="bb-el bb-note bb-tilt bb-in" style={rise(380)}>
            <p className="bb-text bb-hand">Kindly RSVP below</p>
          </div>
        </section>
      </div>

      <Reveal className="bb-wrap">
        <section className="bb-card bb-card-2" aria-labelledby="bb-rsvp-title">
          <Deco className="bb-p2-disco-ball" file="disco-ball-white.svg" />
          <Deco className="bb-p2-pouring-wine" file="pouring-wine-white.svg" />

          <div className="bb-el bb-h-small-1 bb-tilt">
            <p className="bb-text bb-hand">Will you</p>
          </div>
          <div className="bb-el bb-h-big bb-tilt">
            <h2 className="bb-text bb-scr" id="bb-rsvp-title">
              Join us
            </h2>
          </div>
          <div className="bb-el bb-h-small-2 bb-tilt">
            <p className="bb-text bb-hand">?</p>
          </div>

          <div className="bb-rsvp">
            {!submitted ? (
              <form className="bb-form" onSubmit={handleSubmit}>
                <div>
                  <label className="bb-label" htmlFor="bb-guest-name">
                    Your name
                  </label>
                  <input
                    id="bb-guest-name"
                    className="bb-input"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <span className="bb-label">Attending</span>
                  <div className="bb-choice">
                    <button
                      type="button"
                      className="bb-btn"
                      aria-pressed={attending === "yes"}
                      onClick={() => setAttending("yes")}
                    >
                      Count me in
                    </button>
                    <button
                      type="button"
                      className="bb-btn"
                      aria-pressed={attending === "no"}
                      onClick={() => setAttending("no")}
                    >
                      Can&rsquo;t make it
                    </button>
                  </div>
                </div>

                {attending === "yes" && (
                  <div>
                    <span className="bb-label">Guests</span>
                    <div className="bb-stepper">
                      <button
                        type="button"
                        className="bb-btn"
                        aria-label="Fewer guests"
                        onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                      >
                        −
                      </button>
                      <output aria-live="polite">{guestCount}</output>
                      <button
                        type="button"
                        className="bb-btn"
                        aria-label="More guests"
                        onClick={() => setGuestCount((c) => Math.min(6, c + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {error && <p className="bb-error">{error}</p>}

                <button className="bb-btn bb-submit" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send RSVP"}
                </button>
              </form>
            ) : (
              <div className="bb-thanks">
                <p className="bb-thanks-script">{attending === "yes" ? "See you there!" : "You’ll be missed!"}</p>
                <p className="bb-thanks-body">
                  {attending === "yes"
                    ? `Cheers, ${name.trim() || "friend"} — your RSVP is in.`
                    : `Thanks for letting us know, ${name.trim() || "friend"}.`}
                </p>
              </div>
            )}
          </div>
        </section>
      </Reveal>
    </div>
  );
}

// Boxes are % of Canva's 726.486 × 1024 canvas (left/width of 726.486,
// top/height of 1024). See the file header for how the art boxes were fitted.
const CSS = `
.bb-page {
  --bb-blue: #6694ee;
  --bb-white: #ffffff;
  --bb-script: 'Beth Ellen', cursive;
  --bb-hand: 'Walter Turncoat', cursive;
  min-height: 100vh;
  background: var(--bb-white);
}
.bb-wrap { width: min(100%, 480px); margin: 0 auto; container-type: inline-size; }
.bb-card { position: relative; width: 100%; aspect-ratio: 726.486 / 1024; overflow: hidden; }
.bb-card-1 { background: var(--bb-white); color: var(--bb-blue); }
.bb-card-2 { background: var(--bb-blue); color: var(--bb-white); }
.bb-el { position: absolute; }
.bb-el img { display: block; width: 100%; height: 100%; }

/* ---------- Page 1 art ---------- */
.bb-p1-disco-ball { left: 50.645%; top: -4.063%; width: 46.936%; height: 31.296%; }
.bb-p1-clink-glasses { left: -7.338%; top: -2.976%; width: 52.662%; height: 26.776%; }
.bb-p1-martini { left: -7.984%; top: 33.185%; width: 26.452%; height: 23.630%; }
.bb-p1-woman { left: -16.613%; top: 63.908%; width: 50.081%; height: 33.928%; }
.bb-p1-wine-toast { left: 39.597%; top: 82.847%; width: 16.371%; height: 16.821%; }
.bb-p1-moon { left: 59.596%; top: 83.991%; width: 13.710%; height: 17.450%; }
.bb-p1-man-wine { left: 78.065%; top: 84.792%; width: 32.500%; height: 25.918%; }
.bb-p1-bikini { left: 72.903%; top: 54.125%; width: 36.290%; height: 30.953%; }
.bb-p1-pouring-wine { left: 76.855%; top: 21.341%; width: 64.838%; height: 32.955%; }

/* ---------- Text ---------- */
.bb-text { margin: 0; text-align: center; font-kerning: none; }
.bb-tilt { transform: rotate(-5.35298deg); }
.bb-hand { font-family: var(--bb-hand); text-transform: uppercase; font-weight: 400; }
.bb-scr {
  font-family: var(--bb-script);
  font-weight: 400;
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0, "calt" 0, "clig" 0;
}

.bb-join  { left: 33.359%; top: 20.700%; width: 33.282%; height: 3.547%; }
.bb-name  { left: 21.554%; top: 26.214%; width: 56.892%; height: 8.849%; }
.bb-title { left: 12.462%; top: 39.258%; width: 75.077%; height: 8.849%; }
.bb-date  { left: 16.198%; top: 54.330%; width: 69.633%; height: 3.547%; }
.bb-addr  { left: 28.311%; top: 63.201%; width: 47.723%; height: 6.582%; }
.bb-note  { left: 29.668%; top: 73.481%; width: 47.723%; height: 6.582%; }

.bb-join .bb-text, .bb-date .bb-text {
  font-size: 4.167cqw; line-height: 5.834cqw; white-space: nowrap;
  transform: translate(-0.08cqw, -0.657cqw);
}
.bb-name .bb-text, .bb-title .bb-text { font-size: 10.556cqw; line-height: 14.584cqw; white-space: nowrap; }
.bb-name .bb-text { transform: translate(-0.08cqw, -1.786cqw); }
.bb-title .bb-text { transform: translate(-0.08cqw, -1.866cqw); }
.bb-addr .bb-text, .bb-note .bb-text { font-size: 3.611cqw; line-height: 5cqw; transform: translateY(-0.681cqw); }

/* ---------- Page 2 ---------- */
.bb-p2-disco-ball { left: 50.645%; top: -4.063%; width: 46.936%; height: 31.296%; }
.bb-p2-pouring-wine { left: 70.807%; top: 63.222%; width: 71.935%; height: 36.560%; }

.bb-h-small-1 { left: 14.727%; top: 6.007%; width: 26.538%; height: 4.680%; }
.bb-h-big     { left: -6.671%; top: 10.530%; width: 69.333%; height: 8.849%; }
.bb-h-small-2 { left: 14.727%; top: 20.635%; width: 26.538%; height: 4.680%; }
.bb-h-small-1 .bb-text, .bb-h-small-2 .bb-text {
  font-size: 5.556cqw; line-height: 7.708cqw; transform: translateY(-0.556cqw); white-space: nowrap;
}
.bb-h-big .bb-text { font-size: 10.556cqw; line-height: 14.584cqw; transform: translateY(-1.056cqw); white-space: nowrap; }

/* The RSVP sits where the schedule was (x 22–520, y 360+ on the canvas), in
   normal flow so the card grows instead of clipping if it ever needs more
   room than the 726:1024 shape gives it. */
.bb-card-2 { aspect-ratio: auto; min-height: calc(100cqw * 1024 / 726.486); }
.bb-rsvp {
  position: relative;
  z-index: 1;
  margin-left: 4.2cqw;
  width: 64cqw;
  padding: 50cqw 0 12cqw;
  font-family: var(--bb-hand);
  text-transform: uppercase;
}
.bb-form { display: grid; gap: 5.2cqw; }
.bb-label { display: block; font-size: max(13px, 3.4cqw); letter-spacing: 0.04em; margin-bottom: 1.4cqw; }
.bb-input {
  width: 100%;
  border: 0;
  border-bottom: 2px solid var(--bb-white);
  border-radius: 0;
  background: transparent;
  color: var(--bb-white);
  font: 400 max(16px, 4.6cqw) var(--bb-hand);
  padding: 1.2cqw 0.4cqw;
  outline: none;
}
.bb-input:focus-visible { border-bottom-width: 3px; }
.bb-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 2.4cqw; }
.bb-btn {
  font-family: var(--bb-hand);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--bb-white);
  background: transparent;
  border: 2px solid var(--bb-white);
  border-radius: 999px;
  cursor: pointer;
  transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1), background-color 160ms ease, color 160ms ease;
}
.bb-choice .bb-btn { padding: 2.6cqw 1.6cqw; font-size: max(12px, 3.4cqw); }
.bb-btn[aria-pressed="true"] { background: var(--bb-white); color: var(--bb-blue); }
.bb-stepper { display: flex; align-items: center; gap: 4cqw; }
.bb-stepper .bb-btn { width: 9cqw; height: 9cqw; min-width: 36px; min-height: 36px; padding: 0; font: 400 max(18px, 5cqw)/1 system-ui, sans-serif; }
.bb-stepper output { font-size: 6cqw; min-width: 5cqw; text-align: center; }
.bb-submit { padding: 3.2cqw; font-size: max(15px, 4.4cqw); background: var(--bb-white); color: var(--bb-blue); }
.bb-submit:disabled { opacity: 0.7; cursor: default; }
.bb-btn:active:not(:disabled) { transform: scale(0.97); }
.bb-btn:focus-visible { outline: 2px solid var(--bb-white); outline-offset: 3px; }
@media (hover: hover) and (pointer: fine) {
  .bb-btn[aria-pressed="false"]:hover, .bb-stepper .bb-btn:hover { background: rgba(255, 255, 255, 0.14); }
}
.bb-error { margin: 0; font-size: max(13px, 3.4cqw); }
.bb-thanks { text-transform: none; }
.bb-thanks-script { font-family: var(--bb-script); font-size: 10cqw; line-height: 1.3; margin: 0; }
.bb-thanks-body { font-size: max(13px, 3.6cqw); margin: 2cqw 0 0; text-transform: uppercase; }

/* ---------- Motion ---------- */
/* translate (not transform) so it composes with the rotations above. */
.bb-in { opacity: 0; translate: 0 8px; animation: bb-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
@keyframes bb-rise { to { opacity: 1; translate: 0 0; } }
@keyframes bb-fade { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .bb-in { translate: 0 0; animation-name: bb-fade; }
}
`;
