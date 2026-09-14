"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Invite } from "@/lib/types";

// Birthday Retro Polaroid — ported from the approved static mockup
// (template-birthday-retro-polaroid-prototype.html): recreates a Canva
// "Avery's Birthday Party" retro-polaroid A6 invite. The prototype's
// hardcoded "Avery"/"Olivia"/date/venue copy and its client-only fake
// RSVP form are replaced with real invite data and a real Supabase
// insert, matching every other template's data-binding + RSVP pattern
// (see BirthdayDisco.tsx / BirthdayCreamPink.tsx).
//
// The prototype's "Hello, Olivia!" line addressed a specific *guest* by
// name — there's no such field on Invite (a guest's name is only known
// once they fill out the RSVP form itself), so that's replaced with a
// generic "You're Invited!" rather than inventing a field that can't
// exist. "dresscode: chic retro" is kept as fixed decorative copy (this
// template's own theme, the same way BirthdayDisco's disco flavor text
// is fixed) since there's no dress-code field to bind it to.
//
// Three raster layers — the polaroid backing card, the washi-tape strip,
// and the demo photo — are exact full-resolution exports fetched
// directly from the source Canva design's own asset URLs (not hand-built
// CSS / not a generic stock substitute), per the same "ask for the exact
// asset" rule as birthday-cream-pink's ribbon badges:
// public/templates/birthday-retro-polaroid/polaroid-frame.png,
// washi-tape.png, and demo-photo.jpg. The frame and tape are licensed
// "STANDARD" (paid) in the source's own metadata, so they're used only
// as this template's fixed decoration, never swapped per-invite; the
// photo ("Woman Drinking Champagne") is licensed "FREE," confirmed in
// that same metadata before reusing it as demo content — see
// seed-birthday-retro-polaroid-demo.sql. Position/rotation for the frame
// and tape, and the photo placeholder's exact placement within the
// frame's black photo-window, are all measured pixel values from the
// source — see the prototype file's own comments for the underlying
// math. Everything else (the
// "happy birthday" background script rows, text layout) is plain CSS
// positioned with the same cqw-based proportional scaling technique the
// prototype used, since it came from a fixed-canvas Canva design.
//
// Two pages, matching the prototype: the invite card itself, then an
// RSVP section directly below it, styled in this template's own
// palette/type (--rp-ink, --rp-cream, Be Vietnam Pro / Yellowtail)
// rather than copied from another template's RSVP look.

// Scroll-reveal wrapper — same IntersectionObserver idiom as
// BirthdayCreamPink's Reveal / TypewriterText.tsx: fades + slides up
// once ~20% into view, then disconnects.
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`rp-reveal${visible ? " visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

// A customer's own uploaded photo, or a striped placeholder before
// they've added one — sized/positioned by the parent to sit exactly in
// polaroid-frame.png's own photo-window.
function PhotoSlot({ url, alt }: { url: string | undefined; alt: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} />
  ) : (
    <span className="rp-photo-placeholder">Photo coming soon</span>
  );
}

// A placeholder date for invites that haven't set event_date yet, so the
// hero never shows an empty/"coming soon" gap where the source design's
// bold "29.01.2030" always sits. Derived from the invite's own id rather
// than Math.random(): this component renders on the server first, then
// hydrates on the client — a value that's actually random per render
// would differ between those two passes and trigger a hydration
// mismatch. Hashing a stable prop instead gives a date that looks
// arbitrary but stays identical across server and client (and across
// reloads), for the same invite.
function placeholderDate(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(hash);
  const day = (abs % 28) + 1;
  const month = ((abs >> 5) % 12) + 1;
  const year = 2026 + ((abs >> 9) % 4);
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

export default function BirthdayRetroPolaroid({ invite }: { invite: Invite }) {
  const [guestName, setGuestName] = useState("");
  const [attending, setAttending] = useState<"accept" | "decline">("accept");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eventDate = invite.event_date ? new Date(invite.event_date) : null;
  // Compact numeric "DD.MM.YYYY" — matching the source design's own date
  // style (it was "29.01.2030" in a box sized for exactly that many
  // characters). A "long" weekday/month format easily wraps to 3 lines in
  // that box, overflowing down into the address text below it.
  const dateFormatted = eventDate
    ? eventDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replaceAll("/", ".")
    : placeholderDate(invite.id);
  const timeFormatted = eventDate
    ? eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("rsvps").insert({
      invite_id: invite.id,
      guest_name: guestName.trim(),
      attending: attending === "accept",
      guest_count: attending === "accept" ? guestCount : 0,
    });

    setLoading(false);
    if (insertError) {
      setError("Something went wrong — please try again.");
      return;
    }
    setSubmitted(true);
  }

  const waMessage = encodeURIComponent(
    `Hi! It's ${guestName.trim() || "Friend"} — ${
      attending === "accept"
        ? `count me in, can't wait to celebrate${guestCount > 1 ? ` with ${guestCount} of us` : ""}!`
        : "I'm so sorry, I won't be able to make it this time!"
    }`
  );
  const waLink = invite.whatsapp_number ? `https://wa.me/${invite.whatsapp_number}?text=${waMessage}` : null;

  return (
    <>
      <style>{CSS}</style>

      {/* ============ PAGE 1 — INVITE ============ */}
      <section className="rp-hero-section">
        <Reveal className="rp-stage">
          <div className="rp-bg-script rp-row-1">happy birthday</div>
          <div className="rp-bg-script rp-row-2">happy birthday</div>
          <div className="rp-bg-script rp-row-3">happy birthday</div>

          <div className="rp-polaroid-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/templates/birthday-retro-polaroid/polaroid-frame.png" alt="" aria-hidden="true" />
            <div className="rp-polaroid-photo">
              <PhotoSlot url={invite.photo_urls?.[0]} alt={invite.host_names} />
            </div>
          </div>
          <div className="rp-washi-tape">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/templates/birthday-retro-polaroid/washi-tape.png" alt="" aria-hidden="true" />
          </div>

          <p className="rp-txt rp-txt-center rp-pretitle">You&apos;re Invited!</p>
          <p className="rp-txt rp-txt-center rp-subtitle">to have a fun celebration at</p>
          <p className="rp-txt rp-txt-center rp-headline">{invite.host_names}&apos;s birthday party</p>

          <p className="rp-txt rp-txt-left rp-date">{dateFormatted}</p>
          <p className="rp-txt rp-txt-left rp-address">
            {timeFormatted ? `Starts at ${timeFormatted}` : "Time coming soon"}
            <br />
            {invite.venue_name ?? "Venue coming soon"}
            {invite.venue_map_url && (
              <>
                {" — "}
                <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="rp-map-link">
                  View map
                </a>
              </>
            )}
          </p>

          <p className="rp-txt rp-txt-right rp-dresscode">dresscode: chic retro</p>
        </Reveal>
      </section>

      {/* ============ PAGE 2 — RSVP ============ */}
      <section className="rp-rsvp-section">
        <Reveal className="rp-page">
          <p className="rp-rsvp-eyebrow">One more thing</p>
          <h2 className="rp-rsvp-heading">RSVP</h2>
          <p className="rp-rsvp-sub">Let us know if you&apos;ll be celebrating with {invite.host_names}!</p>

          {!submitted ? (
            <form className="rp-rsvp-form" onSubmit={handleSubmit}>
              <label className="rp-rsvp-field">
                <span>Guest Name</span>
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </label>

              <div className="rp-rsvp-attend-row" role="group" aria-label="Attending">
                <button
                  type="button"
                  className={`rp-rsvp-attend-btn ${attending === "accept" ? "active" : ""}`}
                  onClick={() => setAttending("accept")}
                >
                  Count me in
                </button>
                <button
                  type="button"
                  className={`rp-rsvp-attend-btn ${attending === "decline" ? "active" : ""}`}
                  onClick={() => setAttending("decline")}
                >
                  Can&apos;t make it
                </button>
              </div>

              {attending === "accept" && (
                <label className="rp-rsvp-field">
                  <span>Number of Guests</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                  />
                </label>
              )}

              {error && <p className="rp-rsvp-error">{error}</p>}

              <button type="submit" className="rp-rsvp-submit-btn" disabled={loading}>
                {loading ? "Sending…" : "Send RSVP"}
              </button>
            </form>
          ) : (
            <div className="rp-rsvp-thanks">
              <p className="rp-rsvp-thanks-title">{attending === "accept" ? "Yay!" : "We'll miss you"}</p>
              <p className="rp-rsvp-thanks-body">
                {attending === "accept"
                  ? `Can't wait to celebrate with you, ${guestName.trim() || "friend"}!`
                  : `Thanks for letting us know, ${guestName.trim() || "friend"}.`}
              </p>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="rp-rsvp-submit-btn rp-wa-btn">
                  Confirm on WhatsApp too
                </a>
              )}
            </div>
          )}
        </Reveal>
      </section>
    </>
  );
}

const CSS = `
* { box-sizing: border-box; }

:root {
  --rp-ink: #d24e2a;
  --rp-cream: #efece6;
  --rp-white: #ffffff;
  --rp-font-script: 'Yellowtail', cursive;
  --rp-font-body: 'Be Vietnam Pro', sans-serif;
  --rp-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

/* Full-bleed sections, same convention as every other template in this
   folder (BirthdayCreamPink, BirthdayDisco, etc.) — background fills
   100% of the width, content is capped/centered inside it. The
   prototype's "card floating on a gray backdrop" look (a fixed margin +
   surrounding gray) doesn't translate here: the homepage/order-page
   preview embeds this page in a scaled iframe sized to the *card's* own
   box, so any outer padding/backdrop just eats into the visible
   thumbnail — the invite needs to fill its container edge-to-edge like
   every other template does. */

.rp-hero-section, .rp-rsvp-section {
  width: 100%;
  background: var(--rp-cream);
  font-family: var(--rp-font-body);
}

/* Breathing room around/between the two sections. Also adds real page
   height — this template only has 2 sections (vs. 3-5 on the other
   birthday templates), so on a wide screen the homepage/order preview's
   simulated box (see the --stage comment below) can end up taller than
   this page's total content, leaving empty space at the bottom of the
   card; padding here is the direct lever for that, short of adding more
   sections. */
.rp-hero-section { padding: 64px 16px 48px; }
.rp-rsvp-section { padding-top: 32px; }

.rp-hero-section img, .rp-rsvp-section img { max-width: 100%; display: block; }

/* ---------- Scroll reveal ---------- */

.rp-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 700ms var(--rp-ease-out), transform 700ms var(--rp-ease-out);
}
.rp-reveal.visible { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .rp-reveal { transform: none; transition: opacity 300ms ease; }
}

/* ---------- Page 1 — the invite card ----------
   container-type lets every font-size below be expressed in cqw (% of
   the card's own current width) instead of a fixed px value, so the
   whole card scales exactly proportionally at any size — the source is
   a fixed-canvas Canva design (649.155 x 915), so every position/size/
   rotation here is that source's own pixel value converted to a % of
   this box. See the prototype file for the full derivation, including
   the base*scale font-size correction (Canva nests text in a scaled
   wrapper — reading font-size off the <p> directly, without multiplying
   by that wrapper's own scale factor, undersizes everything).

   max-width: this A6 aspect ratio (105:148, taller than it is wide)
   means the card's rendered HEIGHT grows fast with width — unlike
   BirthdayDisco/BirthdayCreamPink's wider, shorter hero sections. The
   homepage/order-page card preview (HeroPreview.tsx) renders this page
   inside an iframe sized to 4x the preview card's own box, then scales
   the result down by 0.25 — so "how much of the page shows in the
   preview" depends on real rendered pixel height at that 4x width, not
   on the small on-screen card size. 640px was picked by solving for the
   width that gives this card roughly the same rendered height as
   BirthdayDisco's hero section at that 4x width (~900px) — checked via
   DOM measurement against a real render, not eyeballed — so the preview
   card shows a comparable amount of content/zoom level to the other
   birthday templates instead of over- or under-filling the box. */

.rp-stage {
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  aspect-ratio: 105 / 148;
  overflow: hidden;
}

.rp-bg-script {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rp-ink);
  font-family: var(--rp-font-script);
  font-weight: 400;
  line-height: 1.383;
  white-space: nowrap;
  font-size: calc(142.128 / 649.155 * 100cqw);
}

.rp-row-1 { left: -9.180%; top: 18.966%; width: 113.702%; height: 18.379%; transform: rotate(-5.122deg); }
.rp-row-2 { left: -6.837%; top: 37.489%; width: 113.702%; height: 18.379%; transform: rotate(-5.122deg); }
.rp-row-3 { left: -4.526%; top: 55.794%; width: 113.702%; height: 18.379%; transform: rotate(-5.122deg); }

/* ---------- Polaroid photo (exact source assets, placed independently) ---------- */

.rp-polaroid-frame {
  position: absolute;
  left: 28.093%;
  top: 29.916%;
  width: 43.807%;
  transform: rotate(3.527deg);
  transform-origin: center;
}

.rp-polaroid-frame img { width: 100%; height: auto; display: block; }

.rp-polaroid-photo {
  position: absolute;
  left: 4.893%;
  top: 6%;
  width: 91.284%;
  height: 72.5%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-polaroid-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

.rp-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(135deg, rgba(0,0,0,0.75), rgba(0,0,0,0.75) 10px, rgba(0,0,0,0.85) 10px, rgba(0,0,0,0.85) 20px);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: calc(13 / 649.155 * 100cqw);
  text-align: center;
  padding: 6%;
}

.rp-washi-tape {
  position: absolute;
  left: 40.427%;
  top: 26.646%;
  width: 22.629%;
  transform: rotate(0deg);
  transform-origin: center;
  z-index: 1;
}

.rp-washi-tape img { width: 100%; height: auto; display: block; }

/* ---------- Text blocks ---------- */

.rp-txt {
  position: absolute;
  margin: 0;
  display: flex;
  align-items: center;
  color: var(--rp-ink);
  text-transform: uppercase;
}

.rp-txt-center { justify-content: center; text-align: center; }
.rp-txt-left { justify-content: flex-start; text-align: left; }
.rp-txt-right { justify-content: flex-end; text-align: right; }

.rp-pretitle {
  left: 29.454%; top: 4.836%; width: 41.090%; height: 2.265%;
  font-weight: 700;
  font-size: calc(18.0321 / 649.155 * 100cqw);
  line-height: 1.05;
}

.rp-subtitle {
  left: 14.038%; top: 7.325%; width: 71.916%; height: 2.256%;
  font-weight: 400;
  font-size: calc(18.0321 / 649.155 * 100cqw);
  line-height: 1.28;
}

.rp-headline {
  left: 7.124%; top: 11.303%; width: 85.752%; height: 5.196%;
  font-weight: 800;
  font-size: calc(40.591 / 649.155 * 100cqw);
  line-height: 1.07;
}

.rp-date {
  left: 7.124%; top: 81.868%; width: 40.837%; height: 5.935%;
  font-weight: 800;
  font-size: calc(46.0263 / 649.155 * 100cqw);
  line-height: 1.08;
}

.rp-address {
  left: 7.124%; top: 89.799%; width: 48.922%; height: 8%;
  font-weight: 400;
  font-size: calc(19.3991 / 649.155 * 100cqw);
  line-height: 1.26;
}

.rp-map-link { text-decoration: underline; }

.rp-dresscode {
  left: 74.199%; top: 84.050%; width: 18.677%; height: 4.788%;
  font-weight: 800;
  font-size: calc(18.0322 / 649.155 * 100cqw);
  line-height: 1.28;
}

/* ---------- Page 2 — RSVP form ----------
   Not from source data — a second page using this template's own
   palette/type language so it reads as part of the same invite rather
   than a bolted-on form. */

.rp-page {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 56px 32px 64px;
  text-align: center;
}

.rp-rsvp-eyebrow {
  margin: 0 0 0.4em;
  color: var(--rp-ink);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 1.1rem;
}

.rp-rsvp-heading {
  margin: 0 0 0.3em;
  color: var(--rp-ink);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-size: clamp(2.2rem, 6vw, 3rem);
  line-height: 1.05;
}

.rp-rsvp-sub {
  margin: 0 0 2em;
  color: var(--rp-ink);
  opacity: 0.85;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.4;
}

.rp-rsvp-form { display: flex; flex-direction: column; gap: 1.6em; text-align: left; }

.rp-rsvp-field { display: flex; flex-direction: column; gap: 0.5em; }

.rp-rsvp-field span {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: var(--rp-ink);
  font-size: 0.75rem;
}

.rp-rsvp-field input {
  border: none;
  border-bottom: 2px solid rgba(210, 78, 42, 0.25);
  background: transparent;
  padding: 0.4em 0.1em 0.6em;
  font-family: var(--rp-font-body);
  font-weight: 500;
  color: var(--rp-ink);
  font-size: 1.1rem;
  outline: none;
  transition: border-color 200ms ease;
}

.rp-rsvp-field input:focus { border-bottom-color: var(--rp-ink); }
.rp-rsvp-field input::placeholder { color: rgba(210, 78, 42, 0.4); }

.rp-rsvp-attend-row { display: flex; gap: 0.7em; }

.rp-rsvp-attend-btn {
  flex: 1;
  padding: 0.8em 1em;
  border-radius: 999px;
  border: 2px solid var(--rp-ink);
  background: transparent;
  color: var(--rp-ink);
  font-family: var(--rp-font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, transform 160ms var(--rp-ease-out);
}

.rp-rsvp-attend-btn.active { background: var(--rp-ink); color: var(--rp-cream); }
.rp-rsvp-attend-btn:active { transform: scale(0.97); }

.rp-rsvp-error { font-size: 0.85rem; color: var(--rp-ink); margin: -8px 0 0; font-weight: 600; }

.rp-rsvp-submit-btn {
  margin-top: 0.4em;
  padding: 0.9em 1em;
  border-radius: 999px;
  border: none;
  background: var(--rp-ink);
  color: var(--rp-cream);
  font-family: var(--rp-font-body);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.95rem;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  display: block;
  box-shadow: 0 10px 20px rgba(210, 78, 42, 0.3);
  transition: transform 160ms var(--rp-ease-out), opacity 160ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .rp-rsvp-submit-btn:hover { transform: translateY(-2px); }
}
.rp-rsvp-submit-btn:active { transform: scale(0.98); }
.rp-rsvp-submit-btn:disabled { opacity: 0.6; cursor: default; }

.rp-wa-btn { margin-top: 16px; background: #25D366; color: #fff; box-shadow: 0 8px 18px rgba(37, 211, 102, 0.35); }

.rp-rsvp-thanks { animation: rp-fade-up 500ms var(--rp-ease-out) both; }

.rp-rsvp-thanks-title {
  color: var(--rp-ink);
  font-weight: 800;
  text-transform: uppercase;
  font-size: 2rem;
  margin: 0 0 10px;
}

.rp-rsvp-thanks-body { margin: 0; color: var(--rp-ink); opacity: 0.85; font-weight: 500; }

@keyframes rp-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .rp-rsvp-thanks { animation: none; }
}

@media (max-width: 480px) {
  .rp-page { padding: 40px 20px 48px; }
}
`;
