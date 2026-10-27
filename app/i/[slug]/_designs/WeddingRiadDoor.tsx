"use client";
/* eslint-disable @next/next/no-img-element -- every <img> here is fixed,
   pre-sized collage artwork, placed like the siblings do. */

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { Invite } from "@/lib/types";
import { parseWallClock } from "@/lib/calendar";
import { useHydrated } from "@/lib/useHydrated";
import { submitRsvp } from "../actions";
import SaveTheDate from "./SaveTheDate";
import WhatsappConfirmLink from "./WhatsappConfirmLink";
import { FRAME, FRAME_PAD, OPENING, PLACE, SCENE_H, SCENE_W, StringLights } from "./riadDoorArt";

// Riad Door Wedding — a collage on linen: an old studded wooden double door
// with string lights, a palm, pink bougainvillea, rattan mats and clay pots
// (riadDoorArt.tsx, pre-rendered to images by scripts/render-riad-door-art.tsx).
//
// Guests land on the closed door in the middle of the screen. Tapping opens
// both leaves — through the doorway they already see the invitation, because
// the linen around the door is a sheet with a door-shaped hole and the real
// page sits right behind it — then we slowly walk through and the page is
// simply there. After that it's a normal page that scrolls down, on the same
// linen all the way. Previews (`embedded`) skip the door.

const A = "/templates/wedding-riad-door";
const DOORS_MS = 1800;
const ZOOM_MS = 3400;

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

// "Lea & Karim" -> ["Lea", "Karim"], drawn with a small italic "&" between.
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
          {i > 0 && <em className="rd-amp"> &amp; </em>}
          <span className="rd-name">{p}</span>
        </span>
      ))}
    </>
  );
}

// % helpers for placing pieces in the scene box
const pct = (n: number, of: number) => `${(n / of) * 100}%`;
function placeStyle(x: number, y: number, w: number): CSSProperties {
  return { left: pct(x, SCENE_W), top: pct(y, SCENE_H), width: pct(w, SCENE_W) };
}

// The collage, with door leaves that open.
function DoorScene({ open, onDoorsOpened, sceneRef }: { open: boolean; onDoorsOpened: () => void; sceneRef: React.Ref<HTMLDivElement> }) {
  return (
    <div className="rd-scene" ref={sceneRef}>
      {/* the mats sit behind the door: cut where the doorway starts so they
          never show through it once it's open */}
      <div className="rd-mats" style={{ clipPath: `inset(0 ${100 - (OPENING.x / SCENE_W) * 100}% 0 0)` }}>
        <img src={`${A}/mat.webp`} alt="" className="rd-piece" style={placeStyle(PLACE.matSmall.x, PLACE.matSmall.y, PLACE.matSmall.w)} />
        <img src={`${A}/mat.webp`} alt="" className="rd-piece" style={placeStyle(PLACE.matBig.x, PLACE.matBig.y, PLACE.matBig.w)} />
      </div>
      <div
        className={`rd-doors${open ? " open" : ""}`}
        style={{ left: pct(OPENING.x, SCENE_W), top: pct(OPENING.y, SCENE_H), width: pct(OPENING.w, SCENE_W), height: pct(OPENING.h, SCENE_H) }}
      >
        <img
          src={`${A}/leaf-l.webp`}
          alt=""
          className="rd-leaf rd-leaf-l"
          onTransitionEnd={(e) => {
            e.stopPropagation();
            if (e.propertyName === "transform") onDoorsOpened();
          }}
        />
        <img src={`${A}/leaf-r.webp`} alt="" className="rd-leaf rd-leaf-r" />
      </div>
      <img
        src={`${A}/frame.webp`}
        alt=""
        className="rd-piece"
        style={placeStyle(FRAME.x - FRAME_PAD, FRAME.y - FRAME_PAD, FRAME.w + FRAME_PAD * 2)}
      />
      <StringLights />
      <img src={`${A}/palm.webp`} alt="" className="rd-piece rd-sway" style={placeStyle(PLACE.palm.x, PLACE.palm.y, PLACE.palm.w)} />
      <img src={`${A}/pots.webp`} alt="" className="rd-piece" style={placeStyle(PLACE.pots.x, PLACE.pots.y, PLACE.pots.w)} />
      <img src={`${A}/flowers.webp`} alt="" className="rd-piece" style={placeStyle(PLACE.flowers.x, PLACE.flowers.y, PLACE.flowers.w)} />
    </div>
  );
}

// The opening: linen sheet with a door-shaped hole, the collage, then the
// measured walk-through zoom.
function Gate({ hostNames, onOpen }: { hostNames: string; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<CSSProperties | null>(null);
  const [hole, setHole] = useState<string | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const zoomStarted = useRef(false);
  const done = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, []);

  // Where the doorway is on screen, in px.
  function openingRect() {
    const s = sceneRef.current!.getBoundingClientRect();
    const u = s.width / SCENE_W;
    return { x: s.left + OPENING.x * u, y: s.top + OPENING.y * u, w: OPENING.w * u, h: OPENING.h * u };
  }

  // Cut the doorway out of the linen sheet (and keep it cut on resize).
  useLayoutEffect(() => {
    const measure = () => {
      if (zoomStarted.current || !paperRef.current || !sceneRef.current) return;
      const p = paperRef.current.getBoundingClientRect();
      const o = openingRect();
      const x = o.x - p.left + 1;
      const y = o.y - p.top + 1;
      setHole(
        `path(evenodd, "M0 0 H${p.width} V${p.height} H0 Z M${x.toFixed(1)} ${y.toFixed(1)} h${(o.w - 2).toFixed(1)} v${(o.h - 2).toFixed(1)} h${(-(o.w - 2)).toFixed(1)} Z")`
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  function zoom() {
    if (zoomStarted.current) return;
    zoomStarted.current = true;
    const inner = innerRef.current;
    if (inner && sceneRef.current) {
      const o = openingRect();
      const ir = inner.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.max(vw / o.w, vh / o.h) * 1.1;
      const cx = o.x + o.w / 2;
      const cy = o.y + o.h / 2;
      setZoomStyle({
        transformOrigin: `${cx - ir.left}px ${cy - ir.top}px`,
        transform: `translate(${vw / 2 - cx}px, ${vh / 2 - cy}px) scale(${scale})`,
      });
    }
  }

  function finish() {
    if (done.current) return;
    done.current = true;
    onOpen();
  }

  function start() {
    if (open) return;
    setOpen(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    // Normally each step starts on the previous animation's transitionend;
    // these are fallbacks (a hidden tab never fires them).
    window.setTimeout(zoom, DOORS_MS + 400);
    window.setTimeout(finish, DOORS_MS + ZOOM_MS + 1000);
  }

  return (
    <div className={`rd-gate${zoomStyle ? " zooming" : ""}`}>
      <div
        ref={innerRef}
        className="rd-gate-inner"
        style={zoomStyle ?? undefined}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "transform") finish();
        }}
      >
        <div ref={paperRef} className="rd-paper" style={hole ? { clipPath: hole } : undefined} />
        <div className="rd-gate-col">
          <div className="rd-gate-text">
            <p className="rd-kicker">You are invited</p>
            <p className="rd-gate-names">
              <Names hostNames={hostNames} />
            </p>
          </div>
          <button type="button" className="rd-gate-btn" onClick={start} aria-label="Open the invitation">
            <DoorScene open={open} onDoorsOpened={zoom} sceneRef={sceneRef} />
          </button>
          <p className={`rd-gate-hint${open ? " gone" : ""}`}>Tap the door to open</p>
        </div>
      </div>
    </div>
  );
}

// Fades/rises content in once it scrolls into view. Content is only hidden
// once JavaScript runs (.rd-js), so it never stays invisible without it.
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
    <div ref={ref} className={`rd-rv${inView ? " in" : ""} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
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
    <div className="rd-count" role="timer" aria-label="Countdown to the wedding">
      {parts.map(([label, v], i) => (
        <div key={label} className="rd-count-cell">
          {i > 0 && <span className="rd-count-dot" aria-hidden="true">◆</span>}
          <span className="rd-count-num">{v === null ? "–" : String(v).padStart(2, "0")}</span>
          <span className="rd-count-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function WeddingRiadDoor({ invite, embedded = false }: { invite: Invite; embedded?: boolean }) {
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
    <div className={`rd-page${hydrated ? " rd-js" : ""}`}>
      <style>{CSS}</style>

      {!opened && <Gate hostNames={invite.host_names} onOpen={() => setOpened(true)} />}

      <div inert={!opened}>
        <header className="rd-hero">
          <p className="rd-kicker">Together with their families</p>
          <h1 ref={namesRef} tabIndex={-1} className="rd-names">
            <Names hostNames={invite.host_names} />
          </h1>
          <p className="rd-date">{dateText ?? "Date coming soon"}</p>
          <span className="rd-divider" aria-hidden="true" />
          <p className="rd-scroll-hint">Scroll down</p>
        </header>

        <section className="rd-section rd-intro">
          <Reveal>
            <p className="rd-lead">
              request the pleasure of your company
              <br />
              at the celebration of their marriage
            </p>
          </Reveal>
          <Reveal delay={150}>
            <Countdown eventDate={invite.event_date} />
          </Reveal>
        </section>

        <section className="rd-section rd-details">
          <img src={`${A}/palm.webp`} alt="" className="rd-deco rd-deco-palm" />
          <Reveal>
            <h2 className="rd-h2">The details</h2>
          </Reveal>
          <div className="rd-cards">
            <Reveal className="rd-card">
              <h3>When</h3>
              <p>{dateText ?? "We'll share the date very soon."}</p>
              {time && <p className="rd-muted">at {time}</p>}
              <SaveTheDate invite={invite} triggerClassName="rd-btn rd-btn-ghost" />
              <img src={`${A}/flowers.webp`} alt="" className="rd-deco rd-deco-flowers" />
            </Reveal>
            <Reveal className="rd-card" delay={120}>
              <h3>Where</h3>
              <p>{invite.venue_name ?? "The venue will be announced soon."}</p>
              {invite.venue_map_url && (
                <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="rd-btn rd-btn-ghost">
                  View map
                </a>
              )}
              <img src={`${A}/pots.webp`} alt="" className="rd-deco rd-deco-pots" />
            </Reveal>
            <Reveal className="rd-card" delay={240}>
              <h3>Dress code</h3>
              <p>Garden formal — light colours and comfortable shoes.</p>
              <img src={`${A}/flowers.webp`} alt="" className="rd-deco rd-deco-flowers rd-deco-flip" />
            </Reveal>
          </div>
        </section>

        <section id="rsvp" className="rd-section rd-rsvp">
          <Reveal>
            <div className="rd-rsvp-card">
              <h2 className="rd-h2">Kindly reply</h2>
              <p className="rd-muted">We would love to know if you can join us.</p>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="rd-form">
                  <label>
                    <span className="rd-label">Full name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                  </label>
                  <div className="rd-toggle-row">
                    <button type="button" className={`rd-toggle${attending === "yes" ? " active" : ""}`} onClick={() => setAttending("yes")}>
                      Joyfully accept
                    </button>
                    <button type="button" className={`rd-toggle${attending === "no" ? " active" : ""}`} onClick={() => setAttending("no")}>
                      Regretfully decline
                    </button>
                  </div>
                  {attending === "yes" && (
                    <label>
                      <span className="rd-label">Number of guests</span>
                      <input type="number" min={1} max={10} value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} />
                    </label>
                  )}
                  {error && <p className="rd-error">{error}</p>}
                  <button type="submit" className="rd-btn" disabled={loading || !hydrated}>
                    {loading ? "Sending…" : "Send reply"}
                  </button>
                </form>
              ) : (
                <div className="rd-thanks">
                  <p>
                    {attending === "yes"
                      ? `Thank you, ${name.trim()} — we can't wait to celebrate with you.`
                      : `We'll miss you, ${name.trim()}. Thank you for letting us know.`}
                  </p>
                  {waLink && (
                    <WhatsappConfirmLink href={waLink} demo={invite.is_demo} className="rd-btn rd-btn-wa">
                      Confirm on WhatsApp too
                    </WhatsappConfirmLink>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        </section>

        <footer className="rd-footer">
          <div className="rd-footer-art" aria-hidden="true">
            <img src={`${A}/mat.webp`} alt="" className="rd-f-mat" />
            <img src={`${A}/pots.webp`} alt="" className="rd-f-pots" />
          </div>
          <p className="rd-footer-names">
            <Names hostNames={invite.host_names} />
          </p>
          <p className="rd-muted">With love, see you there</p>
        </footer>
      </div>
    </div>
  );
}

const LINEN = `url(${A}/linen.jpg)`;

const CSS = `
body { margin: 0; background: #ece6dc; }
.rd-page {
  --brown: #5b3a26; --terra: #a8603c; --rose: #c2306f; --sage: #6c8467; --ink: #4a3a30; --card: #fbf8f2;
  --std-paper: #fbf8f2; --std-ink: #5b3a26; --std-accent: #efe4d6;
  --std-script: 'Cormorant Garamond', serif; --std-sans: 'Hanken Grotesk', sans-serif;
  color: var(--ink);
  font-family: 'Cormorant Garamond', serif;
  background: #ece6dc ${LINEN} 0 0 / 360px repeat;
  min-height: 100vh;
  overflow-x: hidden;
}
.rd-page img { -webkit-user-drag: none; user-select: none; }

/* Hero: exactly one screen, the first thing seen through the doorway */
.rd-hero {
  min-height: 100svh; box-sizing: border-box; padding: 40px 24px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
}
.rd-names {
  font-weight: 500; color: var(--brown); text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.05;
  margin: 0; font-size: clamp(2.6rem, 11vw, 4.4rem);
}
.rd-names:focus { outline: none; }
.rd-name { white-space: nowrap; display: inline-block; }
.rd-amp { display: block; text-transform: none; font-style: italic; font-weight: 400; letter-spacing: 0; font-size: 0.62em; color: var(--terra); margin: 4px 0; }
.rd-date { font-style: italic; font-size: clamp(1.25rem, 5vw, 1.6rem); margin: 18px 0 0; }
.rd-divider { width: 46px; height: 1px; background: var(--brown); opacity: .45; margin: 26px 0 18px; }
.rd-scroll-hint { font-family: 'Hanken Grotesk', sans-serif; font-size: 10px; letter-spacing: .26em; text-transform: uppercase; color: var(--sage); margin: 0; }
.rd-scroll-hint::after {
  content: ""; display: block; width: 9px; height: 9px; margin: 10px auto 0;
  border-right: 1.5px solid var(--sage); border-bottom: 1.5px solid var(--sage); transform: rotate(45deg);
  animation: rd-bob 1.8s ease-in-out infinite;
}
@keyframes rd-bob { 0%,100% { transform: translateY(0) rotate(45deg); } 50% { transform: translateY(6px) rotate(45deg); } }

.rd-kicker {
  font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 10.5px; letter-spacing: 0.28em;
  text-transform: uppercase; color: var(--sage); margin: 0 0 16px;
}

/* Sections */
.rd-section { position: relative; padding: 64px 24px; max-width: 760px; margin: 0 auto; text-align: center; }
.rd-intro { padding-top: 20px; }
.rd-lead { font-size: clamp(1.35rem, 5.2vw, 1.75rem); font-style: italic; line-height: 1.4; margin: 0 0 38px; }
.rd-h2 { font-weight: 500; font-size: clamp(2.1rem, 8.5vw, 2.9rem); color: var(--brown); margin: 0 0 26px; letter-spacing: 0.02em; }
.rd-muted { opacity: 0.75; font-style: italic; font-size: 1.1rem; margin: 4px 0 0; }

/* Countdown */
.rd-count { display: flex; justify-content: center; align-items: flex-start; }
.rd-count-cell { position: relative; display: flex; flex-direction: column; align-items: center; min-width: 74px; }
.rd-count-dot { position: absolute; left: -5px; top: 16px; font-size: 7px; color: var(--rose); opacity: .7; }
.rd-count-num { font-size: clamp(2.3rem, 9vw, 3rem); font-weight: 500; color: var(--brown); line-height: 1; font-variant-numeric: lining-nums tabular-nums; }
.rd-count-label { font-family: 'Hanken Grotesk', sans-serif; font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 8px; opacity: .7; }

.rd-deco { position: absolute; pointer-events: none; z-index: 1; }
.rd-deco-palm { width: 130px; right: -46px; top: -30px; opacity: .95; }
@media (min-width: 720px) { .rd-deco-palm { right: -120px; width: 170px; } }

/* Details: arch-topped cards (a semicircle on top, like a doorway), with
   the bougainvillea and the pots tucked at their feet */
.rd-cards { display: grid; gap: 54px; grid-template-columns: 1fr; justify-items: center; position: relative; padding-bottom: 20px; }
@media (min-width: 720px) { .rd-cards { grid-template-columns: repeat(3, 1fr); gap: 40px; } }
.rd-card {
  position: relative; box-sizing: border-box; width: min(76vw, 290px); min-height: min(96vw, 370px);
  background: var(--card); border-radius: 999px 999px 6px 6px;
  padding: 84px 24px 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 18px 34px -18px rgba(60,40,25,.55), 0 0 0 1px rgba(91,58,38,.08);
}
.rd-card::before {
  content: ""; position: absolute; inset: 10px; border-radius: 999px 999px 3px 3px;
  border: 1px solid rgba(168,96,60,.38); pointer-events: none;
}
.rd-card h3 { font-weight: 500; font-size: 2rem; color: var(--brown); margin: 0 0 8px; }
.rd-card h3::after { content: ""; display: block; width: 28px; height: 1px; background: var(--rose); opacity: .6; margin: 10px auto 0; }
.rd-card p { margin: 0; font-size: 1.25rem; line-height: 1.35; position: relative; }
.rd-card .rd-btn { margin-top: 20px; position: relative; }
.rd-deco-flowers { width: 38%; left: -16%; bottom: -12%; }
.rd-deco-flowers.rd-deco-flip { left: auto; right: -16%; transform: scaleX(-1); }
.rd-deco-pots { width: 46%; right: -18%; bottom: -8%; }

/* Buttons */
.rd-btn {
  display: inline-block; font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.2em;
  text-transform: uppercase; text-decoration: none; cursor: pointer;
  background: var(--brown); color: #fbf8f2; border: 1px solid var(--brown); border-radius: 999px; padding: 14px 26px;
}
.rd-btn:disabled { opacity: .6; cursor: not-allowed; }
.rd-btn-ghost { background: transparent; color: var(--brown); }
.rd-btn-wa { background: #25D366; border-color: #25D366; margin-top: 14px; }

/* RSVP */
.rd-rsvp-card {
  background: var(--card); border-radius: 4px; padding: 40px 24px 34px; max-width: 440px; margin: 0 auto;
  box-shadow: 0 18px 34px -20px rgba(60,40,25,.6), 0 0 0 1px rgba(91,58,38,.08);
}
.rd-form { display: flex; flex-direction: column; gap: 18px; margin-top: 24px; text-align: left; }
.rd-form label { display: flex; flex-direction: column; gap: 6px; }
.rd-label { font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--sage); }
.rd-form input {
  font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; color: var(--ink);
  background: transparent; border: none; border-bottom: 1px solid rgba(74,58,48,.4); padding: 6px 2px; border-radius: 0;
}
.rd-form input:focus { outline: none; border-bottom-color: var(--brown); }
.rd-toggle-row { display: flex; gap: 8px; }
.rd-toggle {
  flex: 1; font-family: 'Cormorant Garamond', serif; font-size: 1.08rem; font-style: italic; cursor: pointer;
  padding: 10px 4px; border-radius: 999px; border: 1px solid rgba(91,58,38,.45); background: transparent; color: var(--brown);
}
.rd-toggle.active { background: var(--brown); border-color: var(--brown); color: #fbf8f2; }
.rd-form .rd-btn { align-self: center; margin-top: 6px; }
.rd-error { color: #a83232; font-size: 1rem; margin: 0; }
.rd-thanks p { font-size: 1.4rem; font-style: italic; margin: 24px 0 0; }

/* Footer */
.rd-footer { text-align: center; padding: 20px 20px 70px; }
.rd-footer-art { position: relative; width: 170px; height: 120px; margin: 0 auto 18px; }
.rd-f-mat { position: absolute; width: 110px; left: 10px; top: 0; }
.rd-f-pots { position: absolute; width: 110px; right: 0; bottom: 0; }
.rd-footer-names { font-weight: 500; color: var(--brown); text-transform: uppercase; letter-spacing: .1em; font-size: 1.5rem; margin: 0; }
.rd-footer-names .rd-amp { display: inline; }

/* Scroll reveal */
.rd-js .rd-rv { opacity: 0; transform: translateY(18px); transition: opacity .9s ease, transform .9s ease; }
.rd-js .rd-rv.in { opacity: 1; transform: none; }

/* ---------------- Gate ---------------- */
.rd-gate { position: fixed; inset: 0; z-index: 50; overflow: hidden; }
.rd-gate.zooming { pointer-events: none; }
/* the last part of the walk-through: the door's edges and the palm still at
   the screen edges melt away into the page behind */
.rd-gate.zooming { opacity: 0; transition: opacity ${ZOOM_MS * 0.4}ms ease ${ZOOM_MS * 0.55}ms; }
.rd-gate-inner { position: absolute; inset: 0; transition: transform ${ZOOM_MS}ms cubic-bezier(.45,0,.2,1); }
/* the linen sheet with the doorway cut out (clip-path set from JS); same
   tile and origin as the page, so the two line up exactly */
.rd-paper { position: absolute; inset: 0; background: #ece6dc ${LINEN} 0 0 / 360px repeat; }
.rd-gate-col {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 3svh 0 4svh; box-sizing: border-box; text-align: center;
}
.rd-gate-text, .rd-gate-hint { transition: opacity .6s ease; }
.rd-gate.zooming .rd-gate-text { opacity: 0; }
.rd-gate-names {
  font-family: 'Cormorant Garamond', serif; font-weight: 500; color: var(--brown);
  text-transform: uppercase; letter-spacing: 0.1em; line-height: 1.05; margin: 0 0 4px; padding: 0 20px;
  font-size: clamp(1.8rem, 8vw, 2.6rem);
}
.rd-gate-names .rd-amp { display: inline; }
.rd-gate-btn {
  display: block; width: min(100vw, 64svh, 520px); padding: 0; border: 0; background: none; cursor: pointer;
  -webkit-tap-highlight-color: transparent; flex: none;
}
.rd-gate-hint {
  font-style: italic; font-size: 1.25rem; color: var(--brown); margin: 4px 0 0;
  animation: rd-pulse 2.4s ease-in-out infinite;
}
.rd-gate-hint.gone { opacity: 0; animation: none; }
@keyframes rd-pulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }

.rd-scene { position: relative; width: 100%; aspect-ratio: ${SCENE_W} / ${SCENE_H}; }
.rd-mats { position: absolute; inset: 0; }
.rd-piece { position: absolute; height: auto; display: block; }
.rd-layer { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.rd-sway { transform-origin: 45% 98%; animation: rd-sway 6s ease-in-out infinite; }
@keyframes rd-sway { 0%,100% { transform: rotate(-0.8deg); } 50% { transform: rotate(0.8deg); } }
.rd-glow { animation: rd-twinkle 2.4s ease-in-out infinite; animation-delay: inherit; }
.rd-bulb { animation-delay: inherit; }
@keyframes rd-twinkle { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
.rd-gate.zooming .rd-lights { opacity: 0; transition: opacity ${ZOOM_MS * 0.3}ms ease; }

.rd-doors { position: absolute; display: flex; perspective: 900px; }
.rd-leaf { width: 50%; height: 100%; display: block; transition: transform ${DOORS_MS}ms cubic-bezier(.5,0,.25,1); }
.rd-leaf-l { transform-origin: left center; }
.rd-leaf-r { transform-origin: right center; }
.rd-doors.open .rd-leaf-l { transform: rotateY(88deg); }
.rd-doors.open .rd-leaf-r { transform: rotateY(-88deg); }

@media (prefers-reduced-motion: reduce) {
  .rd-sway, .rd-glow, .rd-gate-hint, .rd-scroll-hint::after { animation: none; }
  .rd-js .rd-rv { opacity: 1; transform: none; transition: none; }
}
`;
