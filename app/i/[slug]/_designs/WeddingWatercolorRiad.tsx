"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { Invite } from "@/lib/types";
import { parseWallClock } from "@/lib/calendar";
import { useHydrated } from "@/lib/useHydrated";
import { submitRsvp } from "../actions";
import SaveTheDate from "./SaveTheDate";
import WhatsappConfirmLink from "./WhatsappConfirmLink";
import { ArchIcon, LanternIcon, PalmIcon, RIAD_H, RIAD_W, RiadLantern, ARCH_CX, ARCH_HALF, ARCH_TOP, GROUND } from "./riadArt";

// The painted scene, pre-rendered from riadArt.tsx by scripts/render-riad-art.tsx.
const A = "/templates/wedding-watercolor-riad";

// Watercolor Riad Wedding — a painted Moorish garden gate (riadArt.tsx).
// Guests land on the closed gate: two carved wooden doors inside the arch.
// Tapping opens the doors onto the garden and pool, then the page glides
// in. Previews (`embedded`) start already open.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// "Saturday 12 June 2027", from the time the host typed (never shifted by
// the guest's timezone — see parseWallClock).
function longDate(eventDate: string | null): string | null {
  const t = parseWallClock(eventDate);
  if (!t) return null;
  const weekday = DAYS[new Date(Date.UTC(t.year, t.month - 1, t.day)).getUTCDay()];
  return `${weekday} ${t.day} ${MONTHS[t.month - 1]} ${t.year}`;
}

function timeLabel(eventDate: string | null): string | null {
  const t = parseWallClock(eventDate);
  if (!t) return null;
  const h = t.hour % 12 || 12;
  return `${h}:${String(t.minute).padStart(2, "0")} ${t.hour < 12 ? "AM" : "PM"}`;
}

// "Lea & Karim" -> ["LEA", "KARIM"], drawn with a small italic "&" between.
function splitNames(hostNames: string): string[] {
  return hostNames
    .split(/\s*(?:&|\band\b|\bet\b|\+)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function Names({ hostNames }: { hostNames: string }) {
  const parts = splitNames(hostNames);
  if (parts.length < 2) return <>{hostNames}</>;
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <em className="wr-amp"> &amp; </em>}
          <span className="wr-name">{p}</span>
        </span>
      ))}
    </>
  );
}

// The painted scene, with optional doors slotted between its two layers.
function RiadScene({ doors, open, onDoorsOpened }: { doors?: boolean; open?: boolean; onDoorsOpened?: () => void }) {
  // Door leaves cover the arch opening's bounding box (plus a little, so
  // their edges tuck under the gate's frame, which is drawn above them).
  const pad = 4;
  const doorBox: CSSProperties = {
    left: `${((ARCH_CX - ARCH_HALF - pad) / RIAD_W) * 100}%`,
    top: `${((ARCH_TOP - pad) / RIAD_H) * 100}%`,
    width: `${((ARCH_HALF * 2 + pad * 2) / RIAD_W) * 100}%`,
    height: `${((GROUND - ARCH_TOP + pad) / RIAD_H) * 100}%`,
  };
  return (
    <div className="wr-scene">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${A}/scene-back.webp`} alt="" className="riad-layer" />
      {doors && (
        <div className={`wr-doors${open ? " open" : ""}`} style={doorBox}>
          <div className="wr-door wr-door-l" onTransitionEnd={(e) => e.propertyName === "transform" && onDoorsOpened?.()} />
          <div className="wr-door wr-door-r" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${A}/scene-front.webp`} alt="" className="riad-layer" />
      <RiadLantern />
    </div>
  );
}

// Fades/rises content in once it scrolls into view. Content is only hidden
// once JavaScript runs (.wr-js), so it never stays invisible without it.
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`wr-rv${inView ? " in" : ""} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

// Countdown to the host's typed time on the guest's own clock.
function subscribeToClock(onTick: () => void) {
  const t = setInterval(onTick, 1000);
  return () => clearInterval(t);
}
const currentSecond = () => Math.floor(Date.now() / 1000);
const noTimeOnServer = () => null;

function Countdown({ eventDate }: { eventDate: string | null }) {
  const now = useSyncExternalStore(subscribeToClock, currentSecond, noTimeOnServer);
  const t = parseWallClock(eventDate);
  if (!t) return null;
  const target = new Date(t.year, t.month - 1, t.day, t.hour, t.minute).getTime() / 1000;
  const left = now === null ? null : Math.max(0, target - now);
  const parts: [string, number | null][] = [
    ["Days", left === null ? null : Math.floor(left / 86400)],
    ["Hours", left === null ? null : Math.floor((left % 86400) / 3600)],
    ["Minutes", left === null ? null : Math.floor((left % 3600) / 60)],
    ["Seconds", left === null ? null : left % 60],
  ];
  return (
    <div className="wr-count" role="timer" aria-label="Countdown to the wedding">
      {parts.map(([label, v], i) => (
        <div key={label} className="wr-count-cell">
          {i > 0 && <span className="wr-count-dot" aria-hidden="true">◆</span>}
          <span className="wr-count-num">{v === null ? "–" : String(v).padStart(2, "0")}</span>
          <span className="wr-count-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// Opening gate overlay.
function Gate({ hostNames, onOpen }: { hostNames: string; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, []);

  function finish() {
    if (done.current) return;
    done.current = true;
    onOpen();
  }

  function start() {
    if (open) return;
    setOpen(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finish();
      return;
    }
    // Fallback in case the transition events never arrive (hidden tab).
    window.setTimeout(() => setLeaving(true), 1900);
    window.setTimeout(finish, 3200);
  }

  return (
    <div className={`wr-gate${leaving ? " leaving" : ""}`} onTransitionEnd={(e) => e.target === e.currentTarget && leaving && finish()}>
      <div className="wr-gate-inner">
        <p className="wr-kicker">You are invited</p>
        <p className="wr-gate-names">
          <Names hostNames={hostNames} />
        </p>
        <button type="button" className="wr-gate-btn" onClick={start} aria-label="Open the invitation">
          <RiadScene doors open={open} onDoorsOpened={() => setLeaving(true)} />
        </button>
        <p className={`wr-gate-hint${open ? " gone" : ""}`}>Tap the doors to open</p>
      </div>
    </div>
  );
}

export default function WeddingWatercolorRiad({ invite, embedded = false }: { invite: Invite; embedded?: boolean }) {
  const [opened, setOpened] = useState(embedded);
  const namesRef = useRef<HTMLHeadingElement>(null);
  const hydrated = useHydrated();
  useEffect(() => {
    if (opened && !embedded) namesRef.current?.focus({ preventScroll: true });
  }, [opened, embedded]);

  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dateText = longDate(invite.event_date);
  const time = timeLabel(invite.event_date);
  const photo = invite.photo_urls?.[0];

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

  const waMessage = encodeURIComponent(
    `Hi! It's ${name.trim() || "a friend"} — ${
      attending === "yes"
        ? `we'd be delighted to celebrate with you${guestCount > 1 ? ` (${guestCount} of us)` : ""}!`
        : "sadly we won't be able to make it, but we'll be with you in heart."
    }`
  );
  const waLink = invite.whatsapp_number ? `https://wa.me/${invite.whatsapp_number}?text=${waMessage}` : null;

  return (
    <div className={`wr-page${hydrated ? " wr-js" : ""}`}>
      <style>{CSS}</style>

      {!opened && <Gate hostNames={invite.host_names} onOpen={() => setOpened(true)} />}

      <div inert={!opened}>
        <header className="wr-hero">
          <h1 ref={namesRef} tabIndex={-1} className="wr-names">
            <Names hostNames={invite.host_names} />
          </h1>
          <p className="wr-date">{dateText ?? "Date coming soon"}</p>
          <div className="wr-hero-art">
            <RiadScene />
          </div>
        </header>

        <section className="wr-section wr-intro">
          <Reveal>
            <p className="wr-kicker">Together with their families</p>
            <p className="wr-lead">
              request the pleasure of your company
              <br />
              at the celebration of their marriage
            </p>
          </Reveal>
          <Reveal delay={150}>
            <Countdown eventDate={invite.event_date} />
          </Reveal>
        </section>

        <section className="wr-section">
          <Reveal>
            <div className="wr-photo-arch">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={invite.host_names} />
              ) : (
                <div className="wr-photo-empty">Your photo here</div>
              )}
            </div>
          </Reveal>
        </section>

        <section className="wr-section wr-details">
          <Reveal>
            <h2 className="wr-h2">The details</h2>
          </Reveal>
          <div className="wr-cards">
            <Reveal className="wr-card">
              <LanternIcon />
              <h3>When</h3>
              <p>{dateText ?? "We'll share the date very soon."}</p>
              {time && <p className="wr-muted">at {time}</p>}
              <SaveTheDate invite={invite} triggerClassName="wr-btn wr-btn-ghost" />
            </Reveal>
            <Reveal className="wr-card" delay={120}>
              <ArchIcon />
              <h3>Where</h3>
              <p>{invite.venue_name ?? "The venue will be announced soon."}</p>
              {invite.venue_map_url && (
                <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="wr-btn wr-btn-ghost">
                  View map
                </a>
              )}
            </Reveal>
            <Reveal className="wr-card" delay={240}>
              <PalmIcon />
              <h3>Dress code</h3>
              <p>Garden formal — light colours and comfortable shoes for the lawn.</p>
            </Reveal>
          </div>
        </section>

        <section id="rsvp" className="wr-section wr-rsvp">
          <Reveal>
            <div className="wr-rsvp-card">
              <h2 className="wr-h2">Kindly reply</h2>
              <p className="wr-muted">We would love to know if you can join us.</p>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="wr-form">
                  <label>
                    <span className="wr-label">Full name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                  </label>
                  <div className="wr-toggle-row">
                    <button type="button" className={`wr-toggle${attending === "yes" ? " active" : ""}`} onClick={() => setAttending("yes")}>
                      Joyfully accept
                    </button>
                    <button type="button" className={`wr-toggle${attending === "no" ? " active" : ""}`} onClick={() => setAttending("no")}>
                      Regretfully decline
                    </button>
                  </div>
                  {attending === "yes" && (
                    <label>
                      <span className="wr-label">Number of guests</span>
                      <input type="number" min={1} max={10} value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} />
                    </label>
                  )}
                  {error && <p className="wr-error">{error}</p>}
                  <button type="submit" className="wr-btn" disabled={loading || !hydrated}>
                    {loading ? "Sending…" : "Send reply"}
                  </button>
                </form>
              ) : (
                <div className="wr-thanks">
                  <p>
                    {attending === "yes"
                      ? `Thank you, ${name.trim()} — we can't wait to celebrate with you.`
                      : `We'll miss you, ${name.trim()}. Thank you for letting us know.`}
                  </p>
                  {waLink && (
                    <WhatsappConfirmLink href={waLink} demo={invite.is_demo} className="wr-btn wr-btn-wa">
                      Confirm on WhatsApp too
                    </WhatsappConfirmLink>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        </section>

        <footer className="wr-footer">
          <p className="wr-footer-names">
            <Names hostNames={invite.host_names} />
          </p>
          <p className="wr-muted">With love, see you in the garden</p>
        </footer>
      </div>
    </div>
  );
}

const CSS = `
body { margin: 0; background: #f7f1e7; }
.wr-page {
  --terra: #b0603f; --terra-deep: #8f4b34; --sage: #6f8a55; --ink: #4a3a32; --paper: #f7f1e7; --card: #fbf7f0;
  --std-paper: #fbf7f0; --std-ink: #8f4b34; --std-accent: #f1e2d2;
  --std-script: 'Cormorant Garamond', serif; --std-sans: 'Hanken Grotesk', sans-serif;
  color: var(--ink);
  font-family: 'Cormorant Garamond', serif;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.28  0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23p)'/%3E%3C/svg%3E"),
    var(--paper);
  min-height: 100vh;
  overflow-x: hidden;
}
.wr-scene { position: relative; width: 100%; aspect-ratio: ${RIAD_W} / ${RIAD_H}; }
.riad-layer { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.riad-lantern { transform-origin: ${ARCH_CX}px ${ARCH_TOP}px; transform-box: view-box; animation: wr-sway 5s ease-in-out infinite; }
.riad-glow { animation: wr-glow 3.2s ease-in-out infinite; }
@keyframes wr-sway { 0%,100% { transform: rotate(-2.2deg); } 50% { transform: rotate(2.2deg); } }
@keyframes wr-glow { 0%,100% { opacity: .55; } 50% { opacity: 1; } }

/* Hero */
.wr-hero {
  text-align: center;
  padding: 64px 0 0;
  background: linear-gradient(#d9eaec 0%, #e6efec 45%, rgba(247,241,231,0) 100%);
}
.wr-names, .wr-gate-names, .wr-footer-names {
  font-family: 'Cormorant Garamond', serif; font-weight: 500; color: var(--terra);
  text-transform: uppercase; letter-spacing: 0.08em; line-height: 1.05; margin: 0 auto; padding: 0 20px;
}
.wr-names { font-size: clamp(2.3rem, 9vw, 4rem); }
.wr-names:focus { outline: none; }
.wr-amp { text-transform: none; font-style: italic; font-weight: 400; letter-spacing: 0; font-size: 0.72em; }
.wr-name { white-space: nowrap; }
.wr-date { font-style: italic; font-size: clamp(1.15rem, 4.4vw, 1.5rem); margin: 10px 0 18px; color: var(--ink); }
.wr-hero-art { max-width: 640px; margin: 0 auto; }
.wr-hero-art .wr-scene { width: 118%; margin-left: -9%; }
@media (min-width: 640px) {
  .wr-hero-art .wr-scene { width: 100%; margin-left: 0; }
  /* on wide screens the painting would end in hard edges: soften them away */
  .wr-hero-art { -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent); mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent); }
}

/* Sections */
.wr-section { padding: 56px 24px; max-width: 760px; margin: 0 auto; text-align: center; }
.wr-intro { padding-top: 32px; }
.wr-kicker {
  font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.28em;
  text-transform: uppercase; color: var(--sage); margin: 0 0 12px;
}
.wr-lead { font-size: clamp(1.3rem, 5vw, 1.7rem); font-style: italic; line-height: 1.35; margin: 0 0 36px; }
.wr-h2 { font-weight: 500; font-size: clamp(2rem, 8vw, 2.8rem); color: var(--terra); margin: 0 0 24px; letter-spacing: 0.02em; }
.wr-muted { opacity: 0.75; font-style: italic; font-size: 1.1rem; margin: 4px 0 0; }

/* Countdown */
.wr-count { display: flex; justify-content: center; align-items: flex-start; gap: 0; }
.wr-count-cell { position: relative; display: flex; flex-direction: column; align-items: center; min-width: 74px; }
.wr-count-dot { position: absolute; left: -5px; top: 16px; font-size: 8px; color: var(--sage); opacity: .7; }
.wr-count-num { font-size: clamp(2.2rem, 9vw, 3rem); font-weight: 500; color: var(--terra); line-height: 1; font-variant-numeric: lining-nums tabular-nums; }
.wr-count-label { font-family: 'Hanken Grotesk', sans-serif; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 8px; color: var(--ink); opacity: .7; }

/* Photo in an arch */
.wr-photo-arch {
  width: min(78vw, 300px); aspect-ratio: 3 / 4; margin: 0 auto; position: relative;
  border-radius: 999px 999px 4px 4px; overflow: hidden;
  outline: 1.5px solid var(--terra); outline-offset: 9px;
  background: #ead9c6;
  box-shadow: 0 18px 40px -24px rgba(143,75,52,.55);
}
.wr-photo-arch img { width: 100%; height: 100%; object-fit: cover; display: block; }
.wr-photo-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-style: italic; color: var(--terra-deep); opacity: .6; font-size: 1.2rem; }

/* Details */
.wr-cards { display: grid; gap: 20px; grid-template-columns: 1fr; }
@media (min-width: 720px) { .wr-cards { grid-template-columns: repeat(3, 1fr); } }
.wr-card {
  background: var(--card); border: 1px solid rgba(176,96,63,.35); border-radius: 160px 160px 14px 14px;
  padding: 38px 22px 30px; display: flex; flex-direction: column; align-items: center;
}
.wr-card h3 { font-weight: 500; font-size: 1.9rem; color: var(--terra); margin: 10px 0 6px; }
.wr-card p { margin: 0; font-size: 1.2rem; line-height: 1.35; }
.wr-card .wr-btn { margin-top: 18px; }
.riad-icon { display: block; }

/* Buttons */
.wr-btn {
  display: inline-block; font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.2em;
  text-transform: uppercase; text-decoration: none; cursor: pointer;
  background: var(--terra); color: #fbf7f0; border: 1px solid var(--terra); border-radius: 999px; padding: 14px 26px;
}
.wr-btn:disabled { opacity: .6; cursor: not-allowed; }
.wr-btn-ghost { background: transparent; color: var(--terra); }
.wr-btn-wa { background: #25D366; border-color: #25D366; margin-top: 14px; }

/* RSVP */
.wr-rsvp-card {
  background: var(--card); border: 1px solid rgba(176,96,63,.35); border-radius: 14px; padding: 40px 24px 34px;
  max-width: 460px; margin: 0 auto;
}
.wr-form { display: flex; flex-direction: column; gap: 18px; margin-top: 24px; text-align: left; }
.wr-form label { display: flex; flex-direction: column; gap: 6px; }
.wr-label { font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--sage); }
.wr-form input {
  font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; color: var(--ink);
  background: transparent; border: none; border-bottom: 1px solid rgba(74,58,50,.4); padding: 6px 2px; border-radius: 0;
}
.wr-form input:focus { outline: none; border-bottom-color: var(--terra); }
.wr-toggle-row { display: flex; gap: 10px; }
.wr-toggle {
  flex: 1; font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-style: italic; cursor: pointer;
  padding: 10px 6px; border-radius: 999px; border: 1px solid rgba(176,96,63,.5); background: transparent; color: var(--terra-deep);
}
.wr-toggle.active { background: var(--terra); border-color: var(--terra); color: #fbf7f0; }
.wr-form .wr-btn { align-self: center; margin-top: 6px; }
.wr-error { color: #a83232; font-size: 1rem; margin: 0; }
.wr-thanks p { font-size: 1.4rem; font-style: italic; margin: 24px 0 0; }

/* Footer */
.wr-footer { text-align: center; padding: 30px 20px 70px; }
.wr-footer-names { font-size: 1.6rem; }

/* Scroll reveal */
.wr-js .wr-rv { opacity: 0; transform: translateY(18px); transition: opacity .9s ease, transform .9s ease; }
.wr-js .wr-rv.in { opacity: 1; transform: none; }

/* Gate */
.wr-gate {
  position: fixed; inset: 0; z-index: 50; overflow: hidden;
  background: linear-gradient(#d9eaec 0%, #eef1ea 55%, #f7f1e7 100%);
  display: flex; align-items: center; justify-content: center;
  transition: opacity 1.1s ease;
}
.wr-gate.leaving { opacity: 0; pointer-events: none; }
.wr-gate-inner { width: 100%; max-width: 560px; text-align: center; transition: transform 1.3s cubic-bezier(.6,0,.3,1); }
.wr-gate.leaving .wr-gate-inner { transform: scale(2.6) translateY(4%); }
.wr-gate-names { font-size: clamp(1.8rem, 8vw, 2.8rem); margin-bottom: 10px; }
.wr-gate-btn { display: block; width: 118%; margin-left: -9%; padding: 0; border: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
@media (min-width: 560px) { .wr-gate-btn { width: 100%; margin-left: 0; } }
.wr-gate-hint {
  font-style: italic; font-size: 1.25rem; color: var(--terra-deep); margin: 6px 0 0;
  animation: wr-pulse 2.4s ease-in-out infinite; transition: opacity .4s;
}
.wr-gate-hint.gone { opacity: 0; animation: none; }
@keyframes wr-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }

.wr-doors { position: absolute; display: flex; }
.wr-door {
  flex: 1; height: 100%;
  background:
    radial-gradient(circle, #d8b26a 0 1.6px, transparent 2.2px) 0 0 / 16px 18px,
    linear-gradient(90deg, rgba(0,0,0,.18) 0 1px, transparent 1px 100%) 0 0 / 20% 100%,
    linear-gradient(#7b4a2c, #6a3d24);
  box-shadow: inset 0 0 0 5px #5a321d, inset 0 0 0 7px rgba(216,178,106,.55), inset 0 0 22px rgba(0,0,0,.35);
  transition: transform 1.8s cubic-bezier(.5,0,.25,1);
  position: relative;
}
.wr-door::after {
  content: ""; position: absolute; top: 56%; width: 9px; height: 9px; border-radius: 50%;
  border: 2px solid #d8b26a;
}
.wr-door-l { transform-origin: left center; }
.wr-door-r { transform-origin: right center; }
.wr-door-l::after { right: 6px; }
.wr-door-r::after { left: 6px; }
.wr-doors.open .wr-door-l { transform: perspective(700px) rotateY(82deg); }
.wr-doors.open .wr-door-r { transform: perspective(700px) rotateY(-82deg); }

@media (prefers-reduced-motion: reduce) {
  .riad-lantern, .riad-glow, .wr-gate-hint { animation: none; }
  .wr-js .wr-rv { opacity: 1; transform: none; transition: none; }
}
`;
