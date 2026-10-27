"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
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
// Tapping opens the doors, the view flies in through the arch, and they
// land above the riad's garden. From there the invitation is one screen:
// scrolling down slides each card off to the left and brings the next one
// in from the right (welcome → countdown → photo → when → where → dress
// code → RSVP), while the garden pans slowly behind. Previews (`embedded`)
// start already inside the garden.

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
          <div
            className="wr-door wr-door-l"
            onTransitionEnd={(e) => {
              e.stopPropagation();
              if (e.propertyName === "transform") onDoorsOpened?.();
            }}
          />
          <div className="wr-door wr-door-r" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${A}/scene-front.webp`} alt="" className="riad-layer" />
      <RiadLantern />
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

// Opening gate overlay: doors open (1.8s), then the camera flies in through
// the arch while the gate fades, handing over to the garden underneath.
const DOORS_MS = 1800;
const ZOOM_MS = 1500;

function Gate({ hostNames, onZoom, onOpen }: { hostNames: string; onZoom: () => void; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const [zooming, setZooming] = useState(false);
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

  function zoom() {
    if (zoomStarted.current) return;
    zoomStarted.current = true;
    setZooming(true);
    onZoom();
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
      zoom();
      finish();
      return;
    }
    // Each step normally starts when the previous animation ends (the doors'
    // and the gate's transitionend); these are fallbacks for when those
    // events never arrive (a hidden tab).
    window.setTimeout(zoom, DOORS_MS + 400);
    window.setTimeout(finish, DOORS_MS + ZOOM_MS + 1200);
  }

  return (
    <div
      className={`wr-gate${zooming ? " zooming" : ""}`}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === "opacity" && zoomStarted.current) finish();
      }}
    >
      <div className="wr-gate-inner">
        <div className="wr-gate-text">
          <p className="wr-kicker">You are invited</p>
          <p className="wr-gate-names">
            <Names hostNames={hostNames} />
          </p>
        </div>
        <button type="button" className="wr-gate-btn" onClick={start} aria-label="Open the invitation">
          <RiadScene doors open={open} onDoorsOpened={zoom} />
        </button>
        <p className={`wr-gate-hint${open ? " gone" : ""}`}>Tap the doors to open</p>
      </div>
    </div>
  );
}

// Scroll position -> which card is showing. Each card gets one screen-height
// of scrolling; within it the slide happens in the middle part, so cards
// rest still at both ends ("dwell") instead of drifting with every pixel.
function smooth(t: number) {
  const c = Math.min(1, Math.max(0, (t - 0.18) / 0.64));
  return c * c * (3 - 2 * c);
}

function useSlides(count: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;
    const panels = Array.from(stage.querySelectorAll<HTMLElement>(".wr-panel"));
    let frame = 0;
    let last = -1;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const top = wrap.getBoundingClientRect().top;
      const span = wrap.offsetHeight - vh;
      const raw = span > 0 ? Math.min(count - 1, Math.max(0, (-top / span) * (count - 1))) : 0;
      const i = Math.floor(raw);
      const pos = i >= count - 1 ? count - 1 : i + smooth(raw - i);
      stage.style.setProperty("--pos", pos.toFixed(4));
      stage.style.setProperty("--prog", (pos / (count - 1)).toFixed(4));
      panels.forEach((el, k) => {
        const d = Math.abs(pos - k);
        el.style.opacity = String(Math.max(0, 1 - d * 0.85));
        el.style.setProperty("--d", (pos - k).toFixed(3));
      });
      const now = Math.round(pos);
      if (now !== last) {
        last = now;
        setActive(now);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);
  return { wrapRef, stageRef, active };
}

export default function WeddingWatercolorRiad({ invite, embedded = false }: { invite: Invite; embedded?: boolean }) {
  const [opened, setOpened] = useState(embedded);
  // The garden starts zoomed in while the camera "flies" through the gate,
  // then settles; previews skip straight to settled.
  const [landed, setLanded] = useState(embedded);
  const namesRef = useRef<HTMLHeadingElement>(null);
  const hydrated = useHydrated();
  useEffect(() => {
    if (opened && !embedded) namesRef.current?.focus({ preventScroll: true });
  }, [opened, embedded]);

  // Scroll snapping makes each scroll gesture move exactly one card. It's
  // switched off while someone is typing in the RSVP (a phone keyboard
  // resizing the screen would otherwise make it jump).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("wr-snap");
    const onIn = (e: FocusEvent) => {
      if ((e.target as HTMLElement).matches?.("input, textarea")) root.classList.remove("wr-snap");
    };
    const onOut = () => root.classList.add("wr-snap");
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      root.classList.remove("wr-snap");
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

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

  const panels: { key: string; label: string; node: ReactNode }[] = [
    {
      key: "welcome",
      label: "Welcome",
      node: (
        <div className="wr-card wr-card-hero">
          <p className="wr-kicker">The wedding of</p>
          <h1 ref={namesRef} tabIndex={-1} className="wr-names">
            <Names hostNames={invite.host_names} />
          </h1>
          <p className="wr-date">{dateText ?? "Date coming soon"}</p>
          <span className="wr-divider" aria-hidden="true" />
          <p className="wr-scroll-hint">Scroll to step inside</p>
        </div>
      ),
    },
    {
      key: "invite",
      label: "Invitation",
      node: (
        <div className="wr-card">
          <p className="wr-kicker">Together with their families</p>
          <p className="wr-lead">
            request the pleasure of your company at the celebration of their marriage
          </p>
          <Countdown eventDate={invite.event_date} />
        </div>
      ),
    },
    {
      key: "photo",
      label: "Photo",
      node: (
        <div className="wr-photo-arch">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={invite.host_names} />
          ) : (
            <div className="wr-photo-empty">Your photo here</div>
          )}
        </div>
      ),
    },
    {
      key: "when",
      label: "When",
      node: (
        <div className="wr-card">
          <LanternIcon />
          <h2>When</h2>
          <p>{dateText ?? "We'll share the date very soon."}</p>
          {time && <p className="wr-muted">at {time}</p>}
          <SaveTheDate invite={invite} triggerClassName="wr-btn wr-btn-ghost" />
        </div>
      ),
    },
    {
      key: "where",
      label: "Where",
      node: (
        <div className="wr-card">
          <ArchIcon />
          <h2>Where</h2>
          <p>{invite.venue_name ?? "The venue will be announced soon."}</p>
          {invite.venue_map_url && (
            <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="wr-btn wr-btn-ghost">
              View map
            </a>
          )}
        </div>
      ),
    },
    {
      key: "dress",
      label: "Dress code",
      node: (
        <div className="wr-card">
          <PalmIcon />
          <h2>Dress code</h2>
          <p>Garden formal — light colours and comfortable shoes for the lawn.</p>
        </div>
      ),
    },
    {
      key: "rsvp",
      label: "RSVP",
      node: (
        <div className="wr-card wr-card-rsvp">
          <h2>Kindly reply</h2>
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
      ),
    },
  ];
  const count = panels.length;
  const { wrapRef, stageRef, active } = useSlides(count);

  return (
    <div className={`wr-page${hydrated ? " wr-js" : ""}`}>
      <style>{CSS}</style>

      {!opened && <Gate hostNames={invite.host_names} onZoom={() => setLanded(true)} onOpen={() => setOpened(true)} />}

      <div inert={!opened} ref={wrapRef} className="wr-scroll" style={{ height: `${count * 100}svh` } as CSSProperties}>
        {/* One snap point per card, so each scroll gesture lands on the next. */}
        {panels.map((p, i) => (
          <div key={p.key} id={p.key === "rsvp" ? "rsvp" : undefined} className="wr-snap-point" style={{ top: `${i * 100}svh` }} />
        ))}
        <div ref={stageRef} className={`wr-stage${landed ? " landed" : ""}`}>
          <div className="wr-bg" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${A}/garden.webp`} alt="" />
          </div>
          <div className="wr-track">
            {panels.map((p, i) => (
              <section key={p.key} className="wr-panel" style={{ left: `${i * 100}%` }} aria-label={p.label}>
                {p.node}
              </section>
            ))}
          </div>
          <div className="wr-dots" aria-hidden="true">
            {panels.map((p, i) => (
              <span key={p.key} className={i === active ? "on" : ""} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
body { margin: 0; background: #f3ead9; }
html.wr-snap { scroll-snap-type: y mandatory; }
.wr-page {
  --terra: #b0603f; --terra-deep: #8f4b34; --sage: #6f8a55; --ink: #4a3a32; --paper: #f7f1e7; --card: rgba(251,247,240,.94);
  --std-paper: #fbf7f0; --std-ink: #8f4b34; --std-accent: #f1e2d2;
  --std-script: 'Cormorant Garamond', serif; --std-sans: 'Hanken Grotesk', sans-serif;
  color: var(--ink);
  font-family: 'Cormorant Garamond', serif;
  background: #f3ead9;
}
.wr-scene { position: relative; width: 100%; aspect-ratio: ${RIAD_W} / ${RIAD_H}; }
.riad-layer { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.riad-lantern { transform-origin: ${ARCH_CX}px ${ARCH_TOP}px; transform-box: view-box; animation: wr-sway 5s ease-in-out infinite; }
.riad-glow { animation: wr-glow 3.2s ease-in-out infinite; }
@keyframes wr-sway { 0%,100% { transform: rotate(-2.2deg); } 50% { transform: rotate(2.2deg); } }
@keyframes wr-glow { 0%,100% { opacity: .55; } 50% { opacity: 1; } }

/* The scroll runway + the one fixed screen everything happens on */
.wr-scroll { position: relative; }
.wr-snap-point { position: absolute; left: 0; width: 1px; height: 100svh; scroll-snap-align: start; pointer-events: none; }
.wr-stage { position: sticky; top: 0; height: 100svh; overflow: hidden; --pos: 0; --prog: 0; }
.wr-bg {
  position: absolute; top: 0; left: 0; height: 100%;
  width: max(140svh, 135vw);
  transform: translateX(calc(var(--prog) * (100vw - max(140svh, 135vw))));
  will-change: transform;
}
.wr-bg img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transform: scale(1.35); transform-origin: 30% 55%;
  transition: transform 2.2s cubic-bezier(.2,.7,.2,1);
}
.wr-stage.landed .wr-bg img { transform: none; }
.wr-track { position: absolute; inset: 0; transform: translateX(calc(var(--pos) * -100%)); will-change: transform; }
.wr-panel {
  position: absolute; top: 0; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center; padding: 64px 22px 70px; box-sizing: border-box;
}

/* Cards */
.wr-card {
  width: 100%; max-width: 360px; max-height: 100%; overflow: auto; box-sizing: border-box; text-align: center;
  background: var(--card); border: 1px solid rgba(176,96,63,.35); border-radius: 180px 180px 16px 16px;
  padding: 54px 26px 34px; display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 24px 50px -30px rgba(74,58,50,.55);
}
.wr-card h2 { font-weight: 500; font-size: 2.2rem; color: var(--terra); margin: 10px 0 6px; }
.wr-card p { margin: 0; font-size: 1.25rem; line-height: 1.35; }
.wr-card .wr-btn { margin-top: 20px; }
.wr-card-hero { padding-top: 70px; padding-bottom: 40px; }
.wr-card-rsvp { border-radius: 16px; padding-top: 34px; }
.riad-icon { display: block; }

.wr-names {
  font-family: 'Cormorant Garamond', serif; font-weight: 500; color: var(--terra);
  text-transform: uppercase; letter-spacing: 0.08em; line-height: 1.08; margin: 0;
  font-size: clamp(2.2rem, 10vw, 3.4rem);
}
.wr-names:focus { outline: none; }
.wr-name { white-space: nowrap; display: inline-block; }
.wr-amp { text-transform: none; font-style: italic; font-weight: 400; letter-spacing: 0; font-size: 0.72em; display: block; margin: 2px 0; }
.wr-date { font-style: italic; font-size: 1.35rem !important; margin-top: 14px !important; }
.wr-divider { width: 46px; height: 1px; background: var(--terra); opacity: .5; margin: 22px 0 16px; }
.wr-scroll-hint {
  font-family: 'Hanken Grotesk', sans-serif; font-size: 10px !important; letter-spacing: .26em; text-transform: uppercase; color: var(--sage);
}
.wr-scroll-hint::after {
  content: ""; display: block; width: 9px; height: 9px; margin: 10px auto 0;
  border-right: 1.5px solid var(--sage); border-bottom: 1.5px solid var(--sage); transform: rotate(45deg);
  animation: wr-bob 1.8s ease-in-out infinite;
}
@keyframes wr-bob { 0%,100% { transform: translateY(0) rotate(45deg); } 50% { transform: translateY(6px) rotate(45deg); } }

.wr-kicker {
  font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 10.5px !important; letter-spacing: 0.28em;
  text-transform: uppercase; color: var(--sage); margin: 0 0 14px !important;
}
.wr-lead { font-size: 1.5rem !important; font-style: italic; line-height: 1.35; margin: 0 0 30px !important; }
.wr-muted { opacity: 0.75; font-style: italic; font-size: 1.1rem !important; margin-top: 4px !important; }

/* Countdown */
.wr-count { display: flex; justify-content: center; align-items: flex-start; }
.wr-count-cell { position: relative; display: flex; flex-direction: column; align-items: center; min-width: 68px; }
.wr-count-dot { position: absolute; left: -5px; top: 14px; font-size: 7px; color: var(--sage); opacity: .7; }
.wr-count-num { font-size: 2.4rem; font-weight: 500; color: var(--terra); line-height: 1; font-variant-numeric: lining-nums tabular-nums; }
.wr-count-label { font-family: 'Hanken Grotesk', sans-serif; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 8px; opacity: .7; }

/* Photo in an arch */
.wr-photo-arch {
  width: min(72vw, 300px, 52svh); aspect-ratio: 3 / 4; position: relative;
  border-radius: 999px 999px 6px 6px; overflow: hidden;
  outline: 1.5px solid #fbf7f0; outline-offset: 8px;
  background: #ead9c6;
  box-shadow: 0 26px 50px -24px rgba(74,58,50,.6);
}
.wr-photo-arch img { width: 100%; height: 100%; object-fit: cover; display: block; }
.wr-photo-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-style: italic; color: var(--terra-deep); opacity: .6; font-size: 1.2rem; }

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
.wr-form { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; text-align: left; width: 100%; }
.wr-form label { display: flex; flex-direction: column; gap: 6px; }
.wr-label { font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--sage); }
.wr-form input {
  font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; color: var(--ink);
  background: transparent; border: none; border-bottom: 1px solid rgba(74,58,50,.4); padding: 6px 2px; border-radius: 0;
}
.wr-form input:focus { outline: none; border-bottom-color: var(--terra); }
.wr-toggle-row { display: flex; gap: 8px; }
.wr-toggle {
  flex: 1; font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-style: italic; cursor: pointer;
  padding: 9px 4px; border-radius: 999px; border: 1px solid rgba(176,96,63,.5); background: transparent; color: var(--terra-deep);
}
.wr-toggle.active { background: var(--terra); border-color: var(--terra); color: #fbf7f0; }
.wr-form .wr-btn { align-self: center; margin-top: 4px; }
.wr-error { color: #a83232; font-size: 1rem; margin: 0; }
.wr-thanks p { font-size: 1.4rem; font-style: italic; margin: 22px 0 0; }

/* Progress dots */
.wr-dots { position: absolute; left: 0; right: 0; bottom: 26px; display: flex; justify-content: center; gap: 9px; }
.wr-dots span { width: 6px; height: 6px; border-radius: 50%; background: rgba(251,247,240,.85); box-shadow: 0 0 0 1px rgba(143,75,52,.35); transition: background .3s, transform .3s; }
.wr-dots span.on { background: var(--terra); transform: scale(1.35); }

/* Gate */
.wr-gate {
  position: fixed; inset: 0; z-index: 50; overflow: hidden;
  background: linear-gradient(#d9eaec 0%, #eef1ea 55%, #f7f1e7 100%);
  display: flex; align-items: center; justify-content: center;
}
.wr-gate.zooming { opacity: 0; transition: opacity ${ZOOM_MS * 0.55}ms ease ${ZOOM_MS * 0.45}ms; pointer-events: none; }
.wr-gate-inner { width: 100%; max-width: 560px; text-align: center; }
@media (max-width: 699px) { .wr-gate-inner { max-width: none; } }
.wr-gate-text, .wr-gate-hint { transition: opacity .5s ease; }
.wr-gate.zooming .wr-gate-text { opacity: 0; }
.wr-gate-names {
  font-family: 'Cormorant Garamond', serif; font-weight: 500; color: var(--terra);
  text-transform: uppercase; letter-spacing: 0.08em; line-height: 1.05; margin: 0 auto 10px; padding: 0 20px;
  font-size: clamp(1.8rem, 8vw, 2.8rem);
}
.wr-gate-names .wr-amp { display: inline; }
.wr-gate-btn {
  display: block; width: 160%; margin-left: -30%; padding: 0; border: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transform-origin: 50% ${(((ARCH_TOP + GROUND) / 2 + 20) / RIAD_H * 100).toFixed(1)}%;
}
.wr-gate.zooming .wr-gate-btn { transform: scale(7); transition: transform ${ZOOM_MS}ms cubic-bezier(.55,0,.35,1); }
@media (min-width: 700px) { .wr-gate-btn { width: 100%; margin-left: 0; } }
.wr-gate-hint {
  font-style: italic; font-size: 1.25rem; color: var(--terra-deep); margin: 6px 0 0;
  animation: wr-pulse 2.4s ease-in-out infinite;
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
  transition: transform ${DOORS_MS}ms cubic-bezier(.5,0,.25,1);
  position: relative;
}
.wr-door::after { content: ""; position: absolute; top: 56%; width: 9px; height: 9px; border-radius: 50%; border: 2px solid #d8b26a; }
.wr-door-l { transform-origin: left center; }
.wr-door-r { transform-origin: right center; }
.wr-door-l::after { right: 6px; }
.wr-door-r::after { left: 6px; }
.wr-doors.open .wr-door-l { transform: perspective(700px) rotateY(82deg); }
.wr-doors.open .wr-door-r { transform: perspective(700px) rotateY(-82deg); }

@media (prefers-reduced-motion: reduce) {
  .riad-lantern, .riad-glow, .wr-gate-hint, .wr-scroll-hint::after { animation: none; }
  .wr-bg img { transition: none; }
}
`;
