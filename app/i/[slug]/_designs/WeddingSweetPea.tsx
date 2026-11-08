"use client";

// Sweet Pea Wedding: a dreamy pastel garden at dawn. The guest first sees a
// folded (gatefold) card sealed with a pressed-flower wax seal; a tap breaks
// the seal, the two flaps swing open in 3D, sweet peas pop up from inside like
// a pop-up book and two butterflies fly out, then the card grows into the page.
// The page scrolls over a painted sky that drifts from dawn blush to evening
// lilac-blue, sections come out of a soft mist, and one butterfly follows the
// guest down the page, landing on each section title.
//
// Art is pre-rendered watercolor (public/templates/wedding-sweet-pea/), never
// live SVG filters (they freeze phones). Fonts: Gilda Display (titles, names)
// + Jost light (everything else). One palette throughout: lilac, powder blue,
// peach blush, butter cream, sage, plum ink.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Invite } from "@/lib/types";
import type { InviteGuest } from "@/lib/guestRules";
import { parseWallClock } from "@/lib/calendar";
import SaveTheDate from "./SaveTheDate";
import { GuestWelcome, RsvpByInvitationNote, replySummary, useGuestRsvp } from "./guestRsvp";

const ART = "/templates/wedding-sweet-pea";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const p2 = (n: number) => String(n).padStart(2, "0");

// read at tap time, not in render: no state needed
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Section content rises out of a soft mist (blur -> sharp) as it scrolls in.
function Mist({ children, className = "", delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "p" | "h2" }) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (setInView(true), io.disconnect())),
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`sp-mist ${inView ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

// A watercolor butterfly whose two wings flap independently (the painted
// butterfly is split down its body; each half folds towards it).
function Butterfly({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={`sp-fly ${className}`} style={style} aria-hidden="true">
      <span className="sp-wing sp-wing-l" />
      <span className="sp-wing sp-wing-r" />
    </span>
  );
}

// ------------------------------------------------------------------ gate
type GateStage = "closed" | "seal" | "open" | "grow" | "done";

function FoldGate({ names, dateLine, onDone, onGone }: { names: string; dateLine: string; onDone: () => void; onGone: () => void }) {
  const [stage, setStage] = useState<GateStage>("closed");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const [a, b] = splitNames(names);

  function open() {
    if (stage !== "closed") return;
    if (prefersReducedMotion()) {
      setStage("grow");
      timers.current.push(window.setTimeout(onDone, 300));
      timers.current.push(window.setTimeout(onGone, 900));
      return;
    }
    setStage("seal");
    timers.current.push(window.setTimeout(() => setStage("open"), 520));
    timers.current.push(window.setTimeout(() => setStage("grow"), 3300));
    timers.current.push(window.setTimeout(onDone, 3750));
    timers.current.push(window.setTimeout(onGone, 4700));
  }

  return (
    <div className={`sp-gate st-${stage}`} role="dialog" aria-label="Invitation">
      <div className="sp-gate-sky" aria-hidden="true" />
      <div className="sp-gate-clouds" aria-hidden="true">
        <span className="sp-cloud c1" />
        <span className="sp-cloud c2" />
        <span className="sp-cloud c3" />
      </div>
      <button type="button" className="sp-card" onClick={open} aria-label="Tap to open the invitation" style={{ "--vine": `url(${ART}/vine.webp)` } as CSSProperties}>
        {/* the inside of the card, revealed when the flaps swing open */}
        <span className="sp-inside">
          <span className="sp-pop sp-pop-back" style={{ backgroundImage: `url(${ART}/spray.webp)` }} />
          <span className="sp-pop sp-pop-front" style={{ backgroundImage: `url(${ART}/spray.webp)` }} />
          <span className="sp-inside-text">
            <span className="sp-eyebrow">Together with love</span>
            <span className="sp-inside-names">
              {a}
              {b && <span className="sp-amp">&amp;</span>}
              {b}
            </span>
            <span className="sp-inside-date">{dateLine}</span>
          </span>
        </span>
        <span className="sp-flap sp-flap-l">
          <span className="sp-flap-face sp-flap-front">
            <span className="sp-flap-letter">{a.charAt(0)}</span>
          </span>
          <span className="sp-flap-face sp-flap-back" />
        </span>
        <span className="sp-flap sp-flap-r">
          <span className="sp-flap-face sp-flap-front">
            <span className="sp-flap-letter">{(b || a).charAt(0)}</span>
          </span>
          <span className="sp-flap-face sp-flap-back" />
        </span>
        <span className="sp-band" aria-hidden="true" />
        <span className="sp-sprig" style={{ backgroundImage: `url(${ART}/spray.webp)` }} aria-hidden="true" />
        <span className="sp-seal" style={{ backgroundImage: `url(${ART}/seal.webp)` }} />
        <Butterfly className="sp-out sp-out-1" />
        <Butterfly className="sp-out sp-out-2" />
      </button>
      <p className="sp-tap">Tap to open</p>
    </div>
  );
}

function splitNames(names: string): [string, string] {
  const parts = names.split(/\s*(?:&|\band\b|\+)\s*/i).filter(Boolean);
  return [parts[0] ?? names, parts[1] ?? ""];
}

// ------------------------------------------------------------------ countdown
function useNow(active: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);
  return now;
}

function Countdown({ eventDate }: { eventDate: string | null }) {
  const t = parseWallClock(eventDate);
  const now = useNow(Boolean(t));
  if (!t) return null;
  // The wall-clock time the couple typed, read as the guest's local time.
  const target = new Date(t.year, t.month - 1, t.day, t.hour, t.minute).getTime();
  const diff = now === null ? null : Math.max(0, target - now);
  const parts: [string, number | null][] = [
    ["Days", diff === null ? null : Math.floor(diff / 86_400_000)],
    ["Hours", diff === null ? null : Math.floor(diff / 3_600_000) % 24],
    ["Minutes", diff === null ? null : Math.floor(diff / 60_000) % 60],
    ["Seconds", diff === null ? null : Math.floor(diff / 1000) % 60],
  ];
  return (
    <section className="sp-sec sp-count">
      <Mist>
        <p className="sp-eyebrow">Counting down</p>
        <h2 className="sp-title" data-perch>Until we say yes</h2>
      </Mist>
      <Mist className="sp-count-row" delay={150}>
        {parts.map(([label, v]) => (
          <span className="sp-count-cell" key={label}>
            <span className="sp-count-num">
              {/* keyed on the value: each change replays the soft paper flip */}
              <span key={v ?? "x"} className="sp-flip">{v === null ? "–" : label === "Days" ? v : p2(v)}</span>
            </span>
            <span className="sp-count-label">{label}</span>
          </span>
        ))}
      </Mist>
    </section>
  );
}

// ------------------------------------------------------------------ where: a path draws itself to the pin
function PathToPin() {
  const ref = useRef<SVGSVGElement | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (setDrawn(true), io.disconnect())), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <svg ref={ref} className={`sp-path ${drawn ? "drawn" : ""}`} viewBox="0 0 300 120" aria-hidden="true">
      <path className="sp-path-line" d="M14 96 C 52 30, 92 112, 132 70 S 196 18, 226 52 S 262 90, 272 58" pathLength={1} />
      <g className="sp-pin" transform="translate(272 54)">
        <path d="M0 0 C -9 -10, -15 -18, -15 -26 A 15 15 0 0 1 15 -26 C 15 -18, 9 -10, 0 0 Z" />
        <circle cx="0" cy="-26" r="5.2" />
      </g>
      <circle className="sp-path-start" cx="14" cy="96" r="4" />
    </svg>
  );
}

// ------------------------------------------------------------------ RSVP
function Petals({ burst }: { burst: number }) {
  // A soft burst of petals each time the guest joyfully accepts.
  const petals = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const ang = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = 120 + ((i * 37) % 100);
        return {
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist * 0.75 - 40,
          rot: ((i * 67) % 360) - 180,
          hue: i % 5,
          delay: (i % 6) * 25,
          size: 15 + ((i * 13) % 11),
        };
      }),
    [],
  );
  if (!burst) return null;
  return (
    <span className="sp-burst" key={burst} aria-hidden="true">
      {petals.map((p, i) => (
        <span
          key={i}
          className={`sp-petal h${p.hue}`}
          style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--rot": `${p.rot}deg`, animationDelay: `${p.delay}ms`, width: p.size, height: p.size * 0.7 } as CSSProperties}
        />
      ))}
    </span>
  );
}

function Rsvp({ invite, guest }: { invite: Invite; guest: InviteGuest | null }) {
  const rsvp = useGuestRsvp(guest);
  const [burst, setBurst] = useState(0);
  const prevSaved = useRef(rsvp.saved);
  useEffect(() => {
    if (rsvp.saved && rsvp.saved !== prevSaved.current && rsvp.saved.attending) setBurst((n) => n + 1);
    prevSaved.current = rsvp.saved;
  }, [rsvp.saved]);
  const [a, b] = splitNames(invite.host_names);

  return (
    <section id="rsvp" className="sp-sec sp-rsvp">
      <Mist className="sp-panel sp-rsvp-panel">
        <p className="sp-eyebrow">Kindly reply</p>
        <h2 className="sp-title" data-perch>RSVP</h2>
        <Petals burst={burst} />
        {!guest ? (
          <RsvpByInvitationNote className="sp-text" />
        ) : !rsvp.showForm && rsvp.saved ? (
          <div className="sp-done" role="status">
            {rsvp.saved.attending && (
              <span className="sp-stamp" key={burst} style={{ backgroundImage: `url(${ART}/seal.webp)` }}>
                <span>See you there</span>
              </span>
            )}
            <p className="sp-done-big">{rsvp.saved.attending ? `Yay${rsvp.toName}!` : `We'll miss you${rsvp.toName}.`}</p>
            <p className="sp-text">
              {rsvp.saved.attending ? `${a}${b ? ` & ${b}` : ""} can't wait to celebrate with you. ${replySummary(rsvp.saved)}` : "Thank you for letting us know."}
            </p>
            <button type="button" className="sp-link" onClick={rsvp.edit}>
              Change my reply
            </button>
          </div>
        ) : (
          <form className="sp-form" onSubmit={rsvp.submit}>
            <p className="sp-text">We would love to know if you can make it.</p>
            <div className="sp-choice" role="group" aria-label="Will you be there?">
              {(
                [
                  [true, "Joyfully accept"],
                  [false, "Regretfully decline"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  className={`sp-pill${rsvp.attending === value ? " on" : ""}`}
                  aria-pressed={rsvp.attending === value}
                  onClick={() => rsvp.setAttending(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {rsvp.attending && rsvp.maxGuests > 1 && (
              <div className="sp-guests">
                <span className="sp-small" id="sp-guests-label">
                  Guests, you included &middot; up to {rsvp.maxGuests}
                </span>
                <div className="sp-stepper" role="group" aria-labelledby="sp-guests-label">
                  <button type="button" aria-label="One guest fewer" disabled={rsvp.guestCount <= 1} onClick={() => rsvp.setGuestCount(rsvp.guestCount - 1)}>
                    −
                  </button>
                  <output aria-live="polite">{rsvp.guestCount}</output>
                  <button type="button" aria-label="One guest more" disabled={rsvp.guestCount >= rsvp.maxGuests} onClick={() => rsvp.setGuestCount(rsvp.guestCount + 1)}>
                    +
                  </button>
                </div>
              </div>
            )}
            <label className="sp-note">
              <span className="sp-small">A note for the couple (optional)</span>
              <textarea rows={3} maxLength={1000} value={rsvp.message} onChange={(e) => rsvp.setMessage(e.target.value)} />
            </label>
            {rsvp.error && (
              <p className="sp-error" role="alert">
                {rsvp.error}
              </p>
            )}
            <div className="sp-form-actions">
              <button type="submit" className="sp-btn" disabled={rsvp.loading}>
                {rsvp.loading ? "Sending…" : rsvp.changing ? "Update my reply" : "Send my reply"}
              </button>
              {rsvp.changing && (
                <button type="button" className="sp-link" onClick={rsvp.cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </Mist>
    </section>
  );
}

// ------------------------------------------------------------------ the butterfly that follows the guest
function Follower({ active }: { active: boolean }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = window.innerWidth * 0.8, y = -80, vx = 0, vy = 0, raf = 0, t0 = performance.now();
    let flap = 0;
    const perches = () => Array.from(document.querySelectorAll<HTMLElement>("[data-perch]"));
    function target() {
      const vh = window.innerHeight;
      let best: { x: number; y: number } | null = null, bestD = Infinity;
      for (const p of perches()) {
        const r = p.getBoundingClientRect();
        if (r.bottom < 40 || r.top > vh - 60) continue;
        const d = Math.abs(r.top + r.height / 2 - vh * 0.42);
        if (d < bestD) {
          bestD = d;
          // sit on the top-right of the title's last letter
          const range = document.createRange();
          range.selectNodeContents(p);
          const rects = range.getClientRects();
          const last = rects[rects.length - 1] ?? r;
          const room = window.innerWidth - last.right;
          best = room > 64
            ? { x: last.right + 32, y: last.top + last.height * 0.45 }
            : { x: Math.min(last.right - 8, window.innerWidth - 34), y: last.top - 26 };
        }
      }
      return best ?? { x: window.innerWidth - 46, y: vh * 0.22 };
    }
    function tick(now: number) {
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      const tg = target();
      // a gentle, slightly wandering flight path
      const wob = Math.sin(now / 340) * 6;
      const ax = (tg.x - x) * 9 - vx * 5.2;
      const ay = (tg.y + wob - y) * 9 - vy * 5.2;
      vx += ax * dt; vy += ay * dt;
      x += vx * dt; y += vy * dt;
      const speed = Math.hypot(vx, vy);
      flap += dt * (speed > 30 ? 22 : 4.5);
      // wings: fast beats in flight, a slow open-close when resting
      const open = speed > 30 ? 0.25 + 0.75 * Math.abs(Math.cos(flap)) : 0.55 + 0.45 * Math.abs(Math.cos(flap));
      const tilt = Math.max(-28, Math.min(28, vx * 0.08));
      el!.style.transform = `translate3d(${x - 24}px, ${y - 30}px, 0) rotate(${tilt}deg)`;
      el!.style.setProperty("--open", open.toFixed(3));
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  if (!active) return null;
  return (
    <span ref={ref} className="sp-follower" aria-hidden="true">
      <Butterfly />
    </span>
  );
}

// ------------------------------------------------------------------ page
export default function WeddingSweetPea({ invite, embedded = false, guest = null }: { invite: Invite; embedded?: boolean; guest?: InviteGuest | null }) {
  const [opened, setOpened] = useState(embedded);
  const [gateGone, setGateGone] = useState(embedded);
  const t = parseWallClock(invite.event_date);
  const weekday = t ? DAYS[new Date(Date.UTC(t.year, t.month - 1, t.day)).getUTCDay()] : null;
  const dateLong = t ? `${t.day} ${MONTHS[t.month - 1]} ${t.year}` : null;
  const dateDots = t ? `${p2(t.day)} · ${p2(t.month)} · ${t.year}` : "Date to be announced";
  const time = t ? `${t.hour % 12 || 12}:${p2(t.minute)} ${t.hour < 12 ? "AM" : "PM"}` : null;
  const [a, b] = splitNames(invite.host_names);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Scroll progress drives the sky (dawn -> lilac -> evening blue) and the
  // cloud parallax. One rAF-throttled listener writing CSS variables.
  const onScroll = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, window.scrollY / max));
    root.style.setProperty("--p", p.toFixed(4));
    root.style.setProperty("--sy", `${window.scrollY}`);
  }, []);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(onScroll);
    };
    onScroll();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [onScroll]);

  // keep the page still behind the closed card
  useEffect(() => {
    if (opened) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [opened]);

  return (
    <div className={`sp-root ${opened ? "is-open" : ""} ${embedded ? "is-embedded" : ""}`} ref={rootRef}>
      <style>{CSS}</style>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=Jost:wght@300;400;500&display=swap" precedence="default" />

      {/* the painted sky + drifting clouds, fixed behind everything */}
      <div className="sp-sky" aria-hidden="true">
        <div className="sp-sky-l sp-sky-dawn" />
        <div className="sp-sky-l sp-sky-day" />
        <div className="sp-sky-l sp-sky-dusk" />
        <div className="sp-sky-clouds far">
          <span className="sp-cloud c1" />
          <span className="sp-cloud c3" />
        </div>
        <div className="sp-sky-clouds near">
          <span className="sp-cloud c2" />
          <span className="sp-cloud c4" />
        </div>
        <div className="sp-grain" />
      </div>

      {!gateGone && <FoldGate names={invite.host_names} dateLine={dateDots} onDone={() => setOpened(true)} onGone={() => setGateGone(true)} />}

      <main className="sp-page" inert={!opened}>
        <header className="sp-hero">
          <span className="sp-hero-spray" style={{ backgroundImage: `url(${ART}/spray.webp)` }} aria-hidden="true" />
          <p className="sp-eyebrow">Together with love</p>
          <h1 className="sp-names">
            <span>{a}</span>
            {b && <span className="sp-amp">&amp;</span>}
            {b && <span>{b}</span>}
          </h1>
          <p className="sp-hero-line">invite you to celebrate their wedding</p>
          <p className="sp-hero-date">{dateDots}</p>
          <GuestWelcome guest={guest} className="sp-welcome" parts={{ dear: "sp-welcome-dear", seats: "sp-small" }} />
          <span className="sp-scroll-hint" aria-hidden="true">
            <span />
          </span>
        </header>

        <Countdown eventDate={invite.event_date} />

        <section className="sp-sec">
          <Mist className="sp-panel">
            <span className="sp-vine sp-vine-l" style={{ backgroundImage: `url(${ART}/vine.webp)` }} aria-hidden="true" />
            <p className="sp-eyebrow">The day</p>
            <h2 className="sp-title" data-perch>When</h2>
            {t ? (
              <>
                <p className="sp-big">{weekday}</p>
                <p className="sp-text sp-text-lg">{dateLong}</p>
                <p className="sp-text">at {time}</p>
                <div className="sp-actions">
                  <SaveTheDate invite={invite} triggerClassName="sp-btn sp-btn-ghost" triggerLabel="Save the date" />
                </div>
              </>
            ) : (
              <p className="sp-text">The date will be shared soon.</p>
            )}
          </Mist>
        </section>

        <section className="sp-sec">
          <Mist className="sp-panel">
            <span className="sp-vine sp-vine-r" style={{ backgroundImage: `url(${ART}/vine.webp)` }} aria-hidden="true" />
            <p className="sp-eyebrow">The place</p>
            <h2 className="sp-title" data-perch>Where</h2>
            <PathToPin />
            <p className="sp-text sp-text-lg">{invite.venue_name || "Venue to be announced"}</p>
            {invite.venue_map_url && (
              <div className="sp-actions">
                <a className="sp-btn" href={invite.venue_map_url} target="_blank" rel="noopener noreferrer">
                  Get directions
                </a>
              </div>
            )}
          </Mist>
        </section>

        <Rsvp invite={invite} guest={guest} />

        <footer className="sp-end">
          <Mist>
            <p className="sp-eyebrow">With love</p>
            <p className="sp-end-names" data-perch>
              {a}
              {b && <span className="sp-amp">&amp;</span>}
              {b}
            </p>
          </Mist>
          <Butterfly className="sp-rest" />
          <p className="sp-made">Invitation by Après-midi</p>
        </footer>
      </main>

      <Follower active={opened && !embedded} />
    </div>
  );
}

const CSS = `
.sp-root {
  --lilac: #d6cde6; --lilac-d: #9a8fb3; --blue: #c9d7e6; --peach: #efe2b8; --butter: #f3e6b5;
  --sage: #b9bfa6; --cream: #fbf8f2; --ink: #3f3a36; --ink-soft: #857c73; --line: rgba(120,108,96,.35);
  --title: 'Gilda Display', 'Times New Roman', serif; --body: 'Jost', 'Helvetica Neue', sans-serif;
  --std-paper: #fbf8f2; --std-ink: #3f3a36; --std-accent: #efeadf;
  --std-script: 'Gilda Display', serif; --std-sans: 'Jost', sans-serif;
  --p: 0;
  position: relative; min-height: 100vh; color: var(--ink); font-family: var(--body); font-weight: 300;
  -webkit-font-smoothing: antialiased; overflow-x: clip;
}
.sp-root *, .sp-root *::before, .sp-root *::after { box-sizing: border-box; }
body:has(.sp-root) { margin: 0; background: #f1ece3; }

/* ---------- sky ---------- */
.sp-sky { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.sp-sky-l { position: absolute; inset: 0; }
.sp-sky-dawn { background: url(${ART}/sky.webp) center / cover no-repeat, linear-gradient(180deg, #ebe8ee 0%, #f4f0e8 50%, #f3ead6 100%); }
.sp-sky-day { background: linear-gradient(180deg, #e6e4ee 0%, #efebe4 50%, #f2ead8 100%); opacity: calc(min(1, max(0, (var(--p) - 0.25) * 2.2)) * 0.75); }
.sp-sky-dusk { background: linear-gradient(180deg, #d4dce8 0%, #e0dde8 55%, #ece6dc 100%); opacity: calc(min(1, max(0, (var(--p) - 0.62) * 2.6)) * 0.85); }
.sp-sky-clouds { position: absolute; inset: -20% 0; will-change: transform; }
.sp-sky-clouds.far { transform: translate3d(0, calc(var(--sy, 0) * -0.04px), 0); }
.sp-sky-clouds.near { transform: translate3d(0, calc(var(--sy, 0) * -0.12px), 0); }
.sp-cloud { position: absolute; display: block; background: url(${ART}/clouds.webp) no-repeat; background-size: 400% 100%; opacity: .5; filter: brightness(1.25) saturate(.7); }
.sp-cloud.c1 { width: 62vw; max-width: 380px; aspect-ratio: 2.5/1; top: 18%; left: -14%; background-position: 0 0; animation: sp-drift 46s ease-in-out infinite alternate; }
.sp-cloud.c2 { width: 54vw; max-width: 340px; aspect-ratio: 2.5/1; top: 46%; right: -12%; background-position: 33.333% 0; animation: sp-drift 38s ease-in-out -9s infinite alternate-reverse; }
.sp-cloud.c3 { width: 48vw; max-width: 300px; aspect-ratio: 2.5/1; top: 72%; left: 8%; background-position: 66.666% 0; opacity: .6; animation: sp-drift 52s ease-in-out -20s infinite alternate; }
.sp-cloud.c4 { width: 58vw; max-width: 360px; aspect-ratio: 2.5/1; top: 96%; left: -10%; background-position: 100% 0; animation: sp-drift 41s ease-in-out -5s infinite alternate; }
@keyframes sp-drift { from { translate: -4vw 0; } to { translate: 6vw 0; } }
.sp-grain { position: absolute; inset: 0; background: url(${ART}/grain.png); }

/* ---------- shared type ---------- */
.sp-eyebrow { font: 400 11px/1 var(--body); letter-spacing: .34em; text-transform: uppercase; color: var(--ink-soft); margin: 0 0 14px; }
.sp-title { font: 400 clamp(34px, 10vw, 48px)/1.08 var(--title); text-wrap: balance; margin: 0 0 18px; color: var(--ink); letter-spacing: .01em; }
.sp-amp { display: block; font-family: var(--title); font-size: .5em; color: var(--lilac-d); margin: .12em 0 .08em; }
.sp-text { font: 300 16px/1.65 var(--body); margin: 0 0 6px; color: var(--ink); text-wrap: balance; }
.sp-text-lg { font-size: 19px; font-weight: 400; }
.sp-big { font: 400 30px/1.2 var(--title); margin: 0 0 6px; }
.sp-small { font: 400 11px/1.4 var(--body); letter-spacing: .14em; text-transform: uppercase; color: var(--ink-soft); }

/* ---------- page ---------- */
.sp-page { position: relative; z-index: 1; padding: 0 22px 40px; max-width: 520px; margin: 0 auto; text-align: center; }
.sp-hero { position: relative; min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 0 90px; }
.sp-hero-spray { position: absolute; top: 3svh; left: 50%; width: min(118vw, 600px); aspect-ratio: 16/9; translate: -50% 0; background: center / contain no-repeat; pointer-events: none; }
.sp-names { font: 400 clamp(58px, 18vw, 86px)/.98 var(--title); margin: 4px 0 18px; display: flex; flex-direction: column; align-items: center; }
.sp-hero-line { font: 300 15px/1.5 var(--body); letter-spacing: .06em; margin: 0 0 22px; color: var(--ink-soft); }
.sp-hero-date { font: 400 17px/1 var(--body); letter-spacing: .38em; margin: 0; padding: 14px 0 14px .38em; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.sp-welcome { margin-top: 30px; }
.sp-welcome-dear { font: 400 22px/1.3 var(--title); margin: 0 0 4px; }
.sp-scroll-hint { position: absolute; bottom: 28px; left: 50%; translate: -50% 0; width: 1px; height: 46px; background: rgba(63,58,54,.18); overflow: hidden; }
.sp-scroll-hint span { position: absolute; left: 0; top: -40%; width: 1px; height: 40%; background: var(--ink); animation: sp-hint 2.2s ease-in-out infinite; }
@keyframes sp-hint { to { top: 100%; } }
.sp-root:not(.is-open) .sp-hero > * { opacity: 0; }
.is-open .sp-hero > * { animation: sp-hero-in 1.2s cubic-bezier(.2,.7,.2,1) both; }
.is-open .sp-hero .sp-eyebrow { animation-delay: .05s; } .is-open .sp-names { animation-delay: .15s; }
.is-open .sp-hero-line { animation-delay: .35s; } .is-open .sp-hero-date { animation-delay: .5s; }
@keyframes sp-hero-in { from { opacity: 0; filter: blur(8px); transform: translateY(10px); } }
.is-embedded .sp-hero > * { animation: none; }

.sp-sec { position: relative; padding: 46px 0; }
.sp-panel {
  position: relative; padding: 46px 26px 40px; border-radius: 180px 180px 26px 26px;
  background: rgba(251, 248, 242, .84); box-shadow: 0 24px 60px -30px rgba(80, 70, 60, .3);
  outline: 1px solid var(--line); outline-offset: -10px;
}
.sp-vine { position: absolute; top: -26px; width: 110px; aspect-ratio: 9/16; background: center top / contain no-repeat; pointer-events: none; }
.sp-vine-l { left: -16px; }
.sp-vine-r { right: -16px; transform: scaleX(-1); }
.sp-actions { margin-top: 22px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }

/* mist reveal */
.sp-mist { opacity: 0; filter: blur(10px); transform: translateY(22px); transition: opacity 1.2s ease, filter 1.3s ease, transform 1.3s cubic-bezier(.2,.7,.2,1); }
.sp-mist.in { opacity: 1; filter: none; transform: none; }
.is-embedded .sp-mist { opacity: 1; filter: none; transform: none; transition: none; }

/* buttons */
.sp-btn, .sp-root .sp-btn {
  display: inline-block; font: 400 12px/1 var(--body); letter-spacing: .24em; text-transform: uppercase; text-decoration: none;
  color: var(--cream); background: var(--ink); border: 1px solid var(--ink); border-radius: 999px; padding: 16px 28px; cursor: pointer;
  transition: transform .25s ease, background .25s ease;
}
.sp-btn:active { transform: scale(.97); }
.sp-btn:disabled { opacity: .6; }
.sp-btn-ghost { color: var(--ink); background: transparent; }
.sp-link { font: 400 12px/1 var(--body); letter-spacing: .18em; text-transform: uppercase; background: none; border: 0; color: var(--ink-soft); text-decoration: underline; text-underline-offset: 5px; cursor: pointer; padding: 12px; }

/* countdown */
.sp-count-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 6px; }
.sp-count-cell { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.sp-count-num { width: 100%; aspect-ratio: 3/4; max-width: 84px; display: grid; place-items: center; border-radius: 40px 40px 12px 12px;
  background: rgba(251,248,242,.85); outline: 1px solid var(--line); outline-offset: -6px; perspective: 300px; overflow: hidden;
  font: 400 30px/1 var(--title); font-variant-numeric: lining-nums tabular-nums; }
.sp-flip { display: block; animation: sp-flip .6s cubic-bezier(.2,.7,.3,1); transform-origin: 50% 0; }
@keyframes sp-flip { from { transform: rotateX(-80deg); opacity: 0; filter: blur(2px); } }
.sp-count-label { font: 400 10px/1 var(--body); letter-spacing: .2em; text-transform: uppercase; color: var(--ink-soft); }

/* where */
.sp-path { display: block; width: 100%; max-width: 300px; margin: 0 auto 14px; overflow: visible; }
.sp-path-line { fill: none; stroke: var(--lilac-d); stroke-width: 1.6; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; }
.sp-path.drawn .sp-path-line { transition: stroke-dashoffset 2.4s cubic-bezier(.45,.1,.3,1); stroke-dashoffset: 0; }
.sp-path-start { fill: var(--lilac-d); }
.sp-pin { opacity: 0; transform-box: fill-box; }
.sp-pin path { fill: var(--peach); stroke: var(--ink); stroke-width: 1.2; }
.sp-pin circle { fill: var(--cream); stroke: var(--ink); stroke-width: 1.2; }
.sp-path.drawn .sp-pin { animation: sp-pin .7s cubic-bezier(.3,1.6,.5,1) 2.25s both; }
@keyframes sp-pin { from { opacity: 0; translate: 0 -18px; } to { opacity: 1; translate: 0 0; } }

/* rsvp */
.sp-rsvp-panel { padding-bottom: 46px; overflow: visible; }
.sp-form { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.sp-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
.sp-pill { font: 400 14px/1.3 var(--body); color: var(--ink); background: transparent; border: 1px solid rgba(63,58,54,.4); border-radius: 999px; padding: 15px 10px; cursor: pointer; transition: background .3s, color .3s, border-color .3s; }
.sp-pill.on { background: var(--butter); border-color: #d9c88f; color: var(--ink); font-weight: 500; }
.sp-guests { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.sp-stepper { display: flex; align-items: center; gap: 22px; }
.sp-stepper button { width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(63,58,54,.4); background: transparent; color: var(--ink); font: 300 22px/1 var(--body); cursor: pointer; }
.sp-stepper button:disabled { opacity: .3; }
.sp-stepper output { font: 400 32px/1 var(--title); min-width: 30px; }
.sp-note { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.sp-note textarea { font: 300 15px/1.5 var(--body); color: var(--ink); background: rgba(255,255,255,.6); border: 1px solid rgba(63,58,54,.25); border-radius: 18px; padding: 12px 14px; resize: none; }
.sp-error { color: #9a5b4b; font-size: 14px; margin: 0; }
.sp-form-actions { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.sp-done { display: flex; flex-direction: column; align-items: center; }
.sp-done-big { font: 400 34px/1.15 var(--title); margin: 4px 0 8px; }
.sp-stamp { position: relative; width: 112px; height: 112px; margin: 0 0 8px; background: center / contain no-repeat; display: grid; place-items: center; animation: sp-stamp .75s cubic-bezier(.3,1.4,.5,1) both; }
.sp-stamp span { position: absolute; bottom: -6px; left: 50%; translate: -50% 0; white-space: nowrap; font: 400 10px/1 var(--body); letter-spacing: .26em; text-transform: uppercase; color: var(--ink); background: var(--butter); padding: 6px 10px; border-radius: 999px; }
@keyframes sp-stamp { from { transform: scale(2.2) rotate(-18deg); opacity: 0; } 60% { opacity: 1; } }
.sp-burst { position: absolute; left: 50%; top: 52%; width: 0; height: 0; pointer-events: none; z-index: 3; }
.sp-petal { position: absolute; left: 0; top: 0; border-radius: 0 85% 0 85%; box-shadow: inset -2px -2px 4px rgba(255,255,255,.55); animation: sp-petal 1.9s cubic-bezier(.15,.7,.3,1) both; opacity: 0; }
.sp-petal.h0 { background: #d6cde6; } .sp-petal.h1 { background: #f1e2a8; } .sp-petal.h2 { background: #c6d5e6; } .sp-petal.h3 { background: #ebe4d6; } .sp-petal.h4 { background: #c9bfdd; }
@keyframes sp-petal {
  0% { opacity: 0; transform: translate(0, 0) rotate(0) scale(.4); }
  12% { opacity: 1; }
  70% { opacity: 1; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1); }
  100% { opacity: 0; transform: translate(calc(var(--dx) * 1.1), calc(var(--dy) + 120px)) rotate(calc(var(--rot) * 1.6)) scale(.9); }
}

/* closing */
.sp-end { position: relative; padding: 70px 0 30px; }
.sp-end-names { font: 400 clamp(34px, 10.5vw, 46px)/1 var(--title); margin: 0; white-space: nowrap; }
.sp-end-names .sp-amp { display: inline; font-size: .6em; margin: 0 .25em; }
.sp-made { font: 400 10px/1 var(--body); letter-spacing: .3em; text-transform: uppercase; color: var(--ink-soft); margin: 54px 0 0; opacity: .7; }
.is-open:not(.is-embedded) .sp-rest { display: none; }
.sp-rest { position: relative; margin: 30px auto 0; --open: .7; animation: sp-rest 3.4s ease-in-out infinite; }
@keyframes sp-rest { 0%,100% { --open: .9; } 50% { --open: .45; } }

/* ---------- butterfly ---------- */
@property --open { syntax: '<number>'; inherits: true; initial-value: 1; }
.sp-fly { --open: 1; position: relative; display: block; width: 48px; height: 36px; }
.sp-wing { position: absolute; top: 0; width: 50%; height: 100%; background: url(${ART}/butterfly.webp) no-repeat; background-size: 200% 100%; }
.sp-wing-l { left: 0; background-position: 0 0; transform-origin: 100% 50%; transform: perspective(120px) rotateY(calc((1 - var(--open)) * 70deg)); }
.sp-wing-r { right: 0; background-position: 100% 0; transform-origin: 0 50%; transform: perspective(120px) rotateY(calc((1 - var(--open)) * -70deg)); }
.sp-follower { position: fixed; left: 0; top: 0; z-index: 5; pointer-events: none; will-change: transform; filter: drop-shadow(0 6px 6px rgba(60,50,40,.18)); }

/* ---------- gate: the folded card ---------- */
.sp-gate { position: fixed; inset: 0; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; transition: opacity 1s ease; }
.sp-gate-sky { position: absolute; inset: 0; background: url(${ART}/sky.webp) center / cover no-repeat, linear-gradient(180deg, #ebe8ee 0%, #f4f0e8 50%, #f3ead6 100%); }
.sp-gate-clouds { position: absolute; inset: 0; }
.sp-card {
  --w: min(74vw, 330px); position: relative; width: var(--w); aspect-ratio: 3 / 4.25; border: 0; padding: 0; background: none; cursor: pointer;
  perspective: 1600px; transform-style: preserve-3d; -webkit-tap-highlight-color: transparent;
  transition: transform 1.1s cubic-bezier(.6,0,.2,1), opacity .9s ease .25s;
  animation: sp-float 5s ease-in-out infinite;
}
@keyframes sp-float { 0%,100% { translate: 0 0; rotate: -1deg; } 50% { translate: 0 -8px; rotate: .6deg; } }
.st-open .sp-card, .st-grow .sp-card { animation: none; }
.st-open .sp-card { transform: scale(.66); transition: transform 1.6s cubic-bezier(.55,.05,.25,1); }
.sp-inside { position: absolute; inset: 0; border-radius: 6px; background: var(--cream) url(${ART}/grain.png); box-shadow: 0 40px 70px -30px rgba(70,60,50,.5), 0 2px 6px rgba(70,60,50,.08), inset 0 0 0 1px var(--line); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.sp-inside::after { content: ""; position: absolute; inset: 10px; border: 1px solid var(--line); border-radius: 3px; pointer-events: none; }
.sp-inside-text { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; padding-top: 34%; }
.sp-inside-text .sp-eyebrow { font-size: 9px; margin-bottom: 10px; }
.sp-inside-names { font: 400 calc(var(--w) * .15)/1 var(--title); color: var(--ink); display: flex; flex-direction: column; align-items: center; }
.sp-inside-date { font: 400 11px/1 var(--body); letter-spacing: .32em; margin-top: 14px; color: var(--ink); }
.sp-pop { position: absolute; left: -12%; right: -12%; top: -2%; height: 46%; background: center / contain no-repeat; transform-origin: 50% 100%; transform: perspective(500px) rotateX(-88deg); opacity: 0; }
.sp-pop-back { top: -6%; filter: saturate(.85) brightness(1.04); transform: perspective(500px) rotateX(-88deg) scale(.92); }
.st-open .sp-pop, .st-grow .sp-pop { animation: sp-popup 1.15s cubic-bezier(.25,1.45,.45,1) .55s both; }
.st-open .sp-pop-back, .st-grow .sp-pop-back { animation-name: sp-popup-back; animation-delay: .75s; }
@keyframes sp-popup { from { opacity: 0; transform: perspective(500px) rotateX(-88deg); } 30% { opacity: 1; } to { opacity: 1; transform: perspective(500px) rotateX(0); } }
@keyframes sp-popup-back { from { opacity: 0; transform: perspective(500px) rotateX(-88deg) scale(.92) scaleX(-1); } 30% { opacity: .9; } to { opacity: .9; transform: perspective(500px) rotateX(0) scale(.92) scaleX(-1); } }
.sp-flap { position: absolute; top: 0; bottom: 0; width: 50%; transform-style: preserve-3d; transition: transform 1.6s cubic-bezier(.55,.05,.25,1); z-index: 3; }
.sp-flap-l { left: 0; transform-origin: 0 50%; }
.sp-flap-r { right: 0; transform-origin: 100% 50%; }
.sp-flap-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; background: #f8f4ec url(${ART}/grain.png); overflow: hidden; }
.sp-flap-l .sp-flap-face { border-radius: 6px 0 0 6px; }
.sp-flap-r .sp-flap-face { border-radius: 0 6px 6px 0; }
.sp-flap-front { box-shadow: inset 0 0 0 1px var(--line), 0 6px 18px -8px rgba(60,50,40,.25); }
.sp-flap-front::before { content: ""; position: absolute; inset: 10px; border: 1px solid var(--line); }
.sp-flap-l .sp-flap-front::before { border-right: 0; } .sp-flap-r .sp-flap-front::before { border-left: 0; }
.sp-flap-front::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,255,255,0) 60%, rgba(110,95,80,.10)); opacity: 1; transition: opacity 1.6s; }
.sp-flap-r .sp-flap-front::after { background: linear-gradient(270deg, rgba(255,255,255,0) 60%, rgba(110,95,80,.10)); }
.sp-flap-back { transform: rotateY(180deg); background-color: #f2eee6; }
.sp-flap-back::before { content: ""; position: absolute; inset: 8% 6%; background: var(--vine) center / contain no-repeat; opacity: .95; }
.sp-flap-r .sp-flap-back::before { transform: scaleX(-1); }
.sp-flap-back::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(110,95,80,.16), rgba(255,255,255,0) 70%); }
.sp-flap-letter { position: absolute; top: 30%; font: 400 calc(var(--w) * .2)/1 var(--title); color: var(--ink); translate: 0 -50%; opacity: .88; }
.sp-flap-l .sp-flap-letter { right: 16%; } .sp-flap-r .sp-flap-letter { left: 16%; }
.st-open .sp-flap-l, .st-grow .sp-flap-l { transform: rotateY(-164deg); }
.st-open .sp-flap-r, .st-grow .sp-flap-r { transform: rotateY(164deg); }
.sp-band { position: absolute; left: -2px; right: -2px; top: 50%; height: 22%; z-index: 5; background: linear-gradient(180deg, rgba(214,205,230,.55), rgba(214,205,230,.42)); backdrop-filter: blur(1.5px); -webkit-backdrop-filter: blur(1.5px); border-top: 1px solid rgba(255,255,255,.7); border-bottom: 1px solid rgba(154,143,179,.35); box-shadow: 0 3px 8px -4px rgba(60,50,40,.25); transition: transform .7s cubic-bezier(.5,0,.3,1), opacity .5s ease; }
.sp-sprig { position: absolute; left: 50%; top: 61%; width: calc(var(--w) * .62); aspect-ratio: 16/9; translate: -50% -50%; rotate: -14deg; z-index: 5; background: center / contain no-repeat; pointer-events: none; transition: transform .7s cubic-bezier(.5,0,.3,1), opacity .5s ease; }
.st-seal .sp-band, .st-open .sp-band, .st-grow .sp-band { transform: translateY(40px); opacity: 0; }
.st-seal .sp-sprig, .st-open .sp-sprig, .st-grow .sp-sprig { transform: translate(30px, 50px) rotate(10deg); opacity: 0; }
.sp-seal { position: absolute; left: 50%; top: 61%; width: calc(var(--w) * .38); aspect-ratio: 1; translate: -50% -50%; background: center / contain no-repeat; z-index: 6; filter: drop-shadow(0 6px 8px rgba(70,45,90,.25)); transition: transform .5s cubic-bezier(.3,1.5,.5,1), opacity .5s ease; }
.sp-card:hover .sp-seal { transform: scale(1.04); }
.st-seal .sp-seal { animation: sp-seal-pop .6s cubic-bezier(.3,.9,.4,1) forwards; }
.st-open .sp-seal, .st-grow .sp-seal { opacity: 0; transform: translateY(-160px) rotate(-40deg) scale(.6); }
@keyframes sp-seal-pop { 0% { transform: scale(1); } 35% { transform: scale(1.18) rotate(6deg); } 100% { transform: translateY(-160px) rotate(-40deg) scale(.6); opacity: 0; } }
.sp-out { position: absolute; left: 50%; top: 40%; z-index: 7; opacity: 0; width: 96px; height: 72px; filter: drop-shadow(0 8px 8px rgba(63,58,54,.2)); }
.st-open .sp-out-1, .st-grow .sp-out-1 { animation: sp-out1 2.6s cubic-bezier(.35,.1,.3,1) .9s both, sp-flap .16s ease-in-out infinite alternate; }
.st-open .sp-out-2, .st-grow .sp-out-2 { animation: sp-out2 2.8s cubic-bezier(.35,.1,.3,1) 1.15s both, sp-flap .18s ease-in-out infinite alternate; }
@keyframes sp-flap { from { --open: 1; } to { --open: .2; } }
@keyframes sp-out1 { 0% { opacity: 0; transform: translate(-50%, 0) scale(.5); } 15% { opacity: 1; } 50% { transform: translate(-190px, -260px) rotate(-14deg) scale(1); } 100% { opacity: 0; transform: translate(-120px, -70vh) rotate(8deg) scale(.9); } }
@keyframes sp-out2 { 0% { opacity: 0; transform: translate(-50%, 0) scale(.5); } 15% { opacity: 1; } 50% { transform: translate(150px, -200px) rotate(12deg) scale(.85); } 100% { opacity: 0; transform: translate(220px, -66vh) rotate(-10deg) scale(.8); } }
.sp-tap { position: relative; font: 400 12px/1 var(--body); letter-spacing: .4em; text-transform: uppercase; color: var(--ink); margin: 0; padding-left: .4em; animation: sp-breathe 2.6s ease-in-out infinite; transition: opacity .4s; }
@keyframes sp-breathe { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
.st-seal .sp-tap, .st-open .sp-tap, .st-grow .sp-tap { opacity: 0; animation: none; }
/* the open card grows into the page */
.st-grow .sp-card { transform: scale(1.9); opacity: 0; transition: transform 1.25s cubic-bezier(.5,0,.2,1), opacity .7s ease .45s; }
.st-grow { pointer-events: none; }
.st-grow .sp-gate-sky, .st-grow .sp-gate-clouds, .st-grow .sp-tap { opacity: 0; transition: opacity .9s ease .35s; }
@media (prefers-reduced-motion: reduce) {
  .sp-card, .sp-tap, .sp-cloud { animation: none !important; }
  .sp-mist { filter: none; transform: none; }
}
`;
