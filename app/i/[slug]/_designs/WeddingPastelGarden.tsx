"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import type { Invite } from "@/lib/types";
import { parseWallClock } from "@/lib/calendar";
import { MAX_RSVP_MESSAGE_LENGTH, type InviteGuest } from "@/lib/guestRules";
import SaveTheDate from "./SaveTheDate";
import { GuestWelcome, RsvpByInvitationNote, replySummary, useGuestRsvp } from "./guestRsvp";

// Pastel Garden Wedding — ported from the owner's exported invitation
// ("Ghina-Malek-Invitation.html", a built bundle of this same component). The
// layout, CSS and motion are the source's own, unchanged; only the RSVP now
// goes through the shared useGuestRsvp (the export had a stand-in) and the
// artwork, which the export inlined, lives in public/templates/wedding-pastel-garden/:
//   sky.webp     the dawn sky behind everything
//   clouds.webp  four clouds in one strip (one per .sp-cloud)
//   grain.png    paper grain (the page, the card's inside and its flaps)
//   wing.webp    a butterfly's two wings side by side
//   spray.webp   the sweet-pea spray (hero, pop-up, the card's sprig)
//   vine.webp    the climbing vine on the panels and the flaps' backs
//   seal.webp    the wax seal (and the "See you there" stamp)
//
// Guests first see a folded card with a wax seal. Tapping it: the seal pops off,
// the flaps open, the flowers pop up, two butterflies fly out, and the names and
// flowers glide into place on the page. Embedded previews skip the card.

const A = "/templates/wedding-pastel-garden";
const SPRAY_RATIO = 1400 / 784;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const pad2 = (n: number) => String(n).padStart(2, "0");
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// "Ghina & Malek" -> ["Ghina", "Malek"]; also splits on "and" / "+".
function splitNames(names: string): [string, string] {
  const parts = names.split(/\s*(?:&|\band\b|\+)\s*/i).filter(Boolean);
  return [parts[0] ?? names, parts[1] ?? ""];
}

// Scroll reveal: fades in from a soft blur, once.
function Mist({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (setShown(true), io.disconnect())),
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`sp-mist ${shown ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

function Butterfly({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={`sp-fly ${className}`} style={style} aria-hidden="true">
      <span className="sp-wing sp-wing-l" />
      <span className="sp-wing sp-wing-r" />
    </span>
  );
}

type GateStage = "closed" | "seal" | "open" | "grow";

// The folded card shown before the invitation opens.
function Gate({
  names,
  dateLine,
  onDone,
  onGone,
}: {
  names: string;
  dateLine: string;
  onDone: () => void;
  onGone: () => void;
}) {
  const [stage, setStage] = useState<GateStage>("closed");
  const timers = useRef<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const sprayRatio = useRef(SPRAY_RATIO);

  useEffect(() => {
    const img = new Image();
    img.onload = () => (sprayRatio.current = img.naturalWidth / img.naturalHeight);
    img.src = `${A}/spray.webp`;
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const [first, second] = splitNames(names);

  // Glide the card's names, eyebrow and flowers to where they sit on the page,
  // so the card hands over to the page instead of cutting to it.
  function morph() {
    const root = rootRef.current;
    if (!root) return;
    const ease = "1s cubic-bezier(.45,0,.2,1)";
    const pairs: [string, string][] = [
      [".sp-inside-names", ".sp-hero .sp-names"],
      [".sp-inside-text .sp-eyebrow", ".sp-hero > .sp-eyebrow"],
    ];
    for (const [fromSel, toSel] of pairs) {
      const from = root.querySelector<HTMLElement>(fromSel);
      const to = document.querySelector<HTMLElement>(toSel);
      if (!from || !to) continue;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const fs = getComputedStyle(from);
      const ts = getComputedStyle(to);
      const scale = from.offsetWidth ? a.width / from.offsetWidth : 1;
      const fromSize = parseFloat(fs.fontSize) * scale;
      const toSize = parseFloat(ts.fontSize);
      const clone = from.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position: "fixed",
        left: `${a.left + a.width / 2}px`,
        top: `${a.top + a.height / 2}px`,
        margin: "0",
        zIndex: "30",
        transform: "translate(-50%, -50%)",
        fontFamily: fs.fontFamily,
        fontWeight: fs.fontWeight,
        fontSize: `${fromSize}px`,
        lineHeight: String(parseFloat(ts.lineHeight) / toSize || 1),
        letterSpacing: `${(parseFloat(fs.letterSpacing) || 0) / parseFloat(fs.fontSize)}em`,
        color: fs.color,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        transition: `left ${ease}, top ${ease}, font-size ${ease}, color ${ease}`,
      });
      clone.dataset.morph = "1";
      root.appendChild(clone);
      from.style.visibility = "hidden";
      void clone.offsetWidth;
      Object.assign(clone.style, {
        left: `${b.left + b.width / 2}px`,
        top: `${b.top + b.height / 2}px`,
        fontSize: `${toSize}px`,
        color: ts.color,
      });
    }

    const pop = root.querySelector<HTMLElement>(".sp-pop-front");
    const spray = document.querySelector<HTMLElement>(".sp-hero-spray");
    if (pop && spray) {
      // The drawn area of a `contain`-fitted image inside a box.
      const fit = (r: DOMRect) => {
        const ratio = sprayRatio.current;
        const w = r.width / r.height > ratio ? r.height * ratio : r.width;
        const h = w / ratio;
        return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
      };
      const a = fit(pop.getBoundingClientRect());
      const b = fit(spray.getBoundingClientRect());
      const flowers = document.createElement("span");
      Object.assign(flowers.style, {
        position: "fixed",
        left: `${a.left}px`,
        top: `${a.top}px`,
        width: `${a.width}px`,
        height: `${a.height}px`,
        zIndex: "29",
        background: `url(${A}/spray.webp) center / 100% 100% no-repeat`,
        pointerEvents: "none",
        transition: `left ${ease}, top ${ease}, width ${ease}, height ${ease}`,
      });
      flowers.dataset.morph = "1";
      root.appendChild(flowers);
      pop.style.visibility = "hidden";
      void flowers.offsetWidth;
      Object.assign(flowers.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` });
    }
  }

  function open() {
    if (stage !== "closed") return;
    const t = timers.current;
    if (reducedMotion()) {
      setStage("grow");
      t.push(window.setTimeout(onDone, 300));
      t.push(window.setTimeout(onGone, 900));
      return;
    }
    setStage("seal");
    t.push(window.setTimeout(() => setStage("open"), 300));
    t.push(
      window.setTimeout(() => {
        morph();
        setStage("grow");
      }, 2750)
    );
    t.push(
      window.setTimeout(() => {
        flushSync(onDone);
        rootRef.current?.querySelectorAll("[data-morph]").forEach((el) => el.remove());
      }, 3780)
    );
    t.push(window.setTimeout(onGone, 3900));
  }

  return (
    <div ref={rootRef} className={`sp-gate st-${stage}`} role="dialog" aria-label="Invitation">
      <div className="sp-gate-sky" aria-hidden="true" />
      <div className="sp-gate-clouds" aria-hidden="true">
        <span className="sp-cloud c1" />
        <span className="sp-cloud c2" />
        <span className="sp-cloud c3" />
      </div>
      <button
        type="button"
        className="sp-card"
        onClick={open}
        aria-label="Tap to open the invitation"
        style={{ "--vine": `url(${A}/vine.webp)` } as CSSProperties}
      >
        <span className="sp-inside">
          <span className="sp-pop sp-pop-back" style={{ backgroundImage: `url(${A}/spray.webp)` }} />
          <span className="sp-pop sp-pop-front" style={{ backgroundImage: `url(${A}/spray.webp)` }} />
          <span className="sp-inside-text">
            <span className="sp-eyebrow">Together with love</span>
            <span className="sp-inside-names">
              {first}
              {second && <span className="sp-amp">&amp;</span>}
              {second}
            </span>
            <span className="sp-inside-date">{dateLine}</span>
          </span>
        </span>
        <span className="sp-flap sp-flap-l">
          <span className="sp-flap-face sp-flap-front">
            <span className="sp-flap-letter">{first.charAt(0)}</span>
          </span>
          <span className="sp-flap-face sp-flap-back" />
        </span>
        <span className="sp-flap sp-flap-r">
          <span className="sp-flap-face sp-flap-front">
            <span className="sp-flap-letter">{(second || first).charAt(0)}</span>
          </span>
          <span className="sp-flap-face sp-flap-back" />
        </span>
        <span className="sp-band" aria-hidden="true" />
        <span className="sp-sprig" style={{ backgroundImage: `url(${A}/spray.webp)` }} aria-hidden="true" />
        <span className="sp-seal" style={{ backgroundImage: `url(${A}/seal.webp)` }} />
      </button>
      <Butterfly className="sp-out sp-out-1" />
      <Butterfly className="sp-out sp-out-2" />
      <p className="sp-tap">Tap to open</p>
    </div>
  );
}

// The current time, ticking each second — null until mounted, so the server
// and first browser render agree.
function useNow(active: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, [active]);
  return now;
}

function Countdown({ eventDate }: { eventDate: string | null }) {
  const t = parseWallClock(eventDate);
  const now = useNow(Boolean(t));
  if (!t) return null;
  const target = new Date(t.year, t.month - 1, t.day, t.hour, t.minute).getTime();
  const left = now === null ? null : Math.max(0, target - now);
  const cells: [string, number | null][] = [
    ["Days", left === null ? null : Math.floor(left / 864e5)],
    ["Hours", left === null ? null : Math.floor(left / 36e5) % 24],
    ["Minutes", left === null ? null : Math.floor(left / 6e4) % 60],
    ["Seconds", left === null ? null : Math.floor(left / 1e3) % 60],
  ];
  return (
    <section className="sp-sec sp-count">
      <Mist>
        <p className="sp-eyebrow">Counting down</p>
        <h2 className="sp-title" data-perch>
          Until we say yes
        </h2>
      </Mist>
      <Mist className="sp-count-row" delay={150}>
        {cells.map(([label, value]) => (
          <span className="sp-count-cell" key={label}>
            <span className="sp-count-num">
              <span className="sp-flip" key={value ?? "x"}>
                {value === null ? "–" : label === "Days" ? value : pad2(value)}
              </span>
            </span>
            <span className="sp-count-label">{label}</span>
          </span>
        ))}
      </Mist>
    </section>
  );
}

// A winding path that draws itself to a map pin when scrolled into view.
function PathToVenue() {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (setDrawn(true), io.disconnect())),
      { threshold: 0.6 }
    );
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

// Petals thrown when a guest says yes. `burst` changes each time, replaying it.
function PetalBurst({ burst }: { burst: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const angle = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = 120 + ((i * 37) % 100);
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist * 0.75 - 40,
          rot: ((i * 67) % 360) - 180,
          hue: i % 5,
          delay: (i % 6) * 25,
          size: 15 + ((i * 13) % 11),
        };
      }),
    []
  );
  if (!burst) return null;
  return (
    <span className="sp-burst" aria-hidden="true" key={burst}>
      {petals.map((p, i) => (
        <span
          key={i}
          className={`sp-petal h${p.hue}`}
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}ms`,
              width: p.size,
              height: p.size * 0.7,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

function Rsvp({ invite, guest }: { invite: Invite; guest: InviteGuest | null }) {
  const rsvp = useGuestRsvp(guest);
  const [burst, setBurst] = useState(0);
  const lastSaved = useRef(rsvp.saved);
  useEffect(() => {
    if (rsvp.saved && rsvp.saved !== lastSaved.current && rsvp.saved.attending) setBurst((n) => n + 1);
    lastSaved.current = rsvp.saved;
  }, [rsvp.saved]);
  const [first, second] = splitNames(invite.host_names);

  return (
    <section id="rsvp" className="sp-sec sp-rsvp">
      <Mist className="sp-panel sp-rsvp-panel">
        <p className="sp-eyebrow">Kindly reply</p>
        <h2 className="sp-title" data-perch>
          RSVP
        </h2>
        <PetalBurst burst={burst} />
        {!guest || rsvp.closedNoReply ? (
          <RsvpByInvitationNote className="sp-text" closed={rsvp.closedNoReply} />
        ) : !rsvp.showForm && rsvp.saved ? (
          <div className="sp-done" role="status">
            {rsvp.saved.attending && (
              <span className="sp-stamp" key={burst} style={{ backgroundImage: `url(${A}/seal.webp)` }}>
                <span>See you there</span>
              </span>
            )}
            <p className="sp-done-big">{rsvp.saved.attending ? `Yay${rsvp.toName}!` : `We'll miss you${rsvp.toName}.`}</p>
            <p className="sp-text">
              {rsvp.saved.attending
                ? `${first}${second ? ` & ${second}` : ""} can't wait to celebrate with you. ${replySummary(rsvp.saved)}`
                : "Thank you for letting us know."}
            </p>
            {rsvp.canChange && (
              <button type="button" className="sp-link" onClick={rsvp.edit}>
                Change my reply
              </button>
            )}
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
                  <button
                    type="button"
                    aria-label="One guest fewer"
                    disabled={rsvp.guestCount <= 1}
                    onClick={() => rsvp.setGuestCount(rsvp.guestCount - 1)}
                  >
                    &minus;
                  </button>
                  <output aria-live="polite">{rsvp.guestCount}</output>
                  <button
                    type="button"
                    aria-label="One guest more"
                    disabled={rsvp.guestCount >= rsvp.maxGuests}
                    onClick={() => rsvp.setGuestCount(rsvp.guestCount + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <label className="sp-note">
              <span className="sp-small">A note for the couple (optional)</span>
              <textarea
                rows={3}
                maxLength={MAX_RSVP_MESSAGE_LENGTH}
                value={rsvp.message}
                onChange={(e) => rsvp.setMessage(e.target.value)}
              />
            </label>
            {rsvp.error && (
              <p className="sp-error" role="alert">
                {rsvp.error}
              </p>
            )}
            <div className="sp-form-actions">
              <button type="submit" className="sp-btn" disabled={rsvp.loading || !rsvp.ready}>
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

// A butterfly that follows the reader down the page and settles beside
// whichever title (`data-perch`) is nearest the middle of the screen.
function Follower({ active }: { active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let x = window.innerWidth * 0.8;
    let y = -80;
    let vx = 0;
    let vy = 0;
    let raf = 0;
    let last = performance.now();
    let phase = 0;

    function perch() {
      const vh = window.innerHeight;
      let best: { x: number; y: number } | null = null;
      let bestDist = Infinity;
      for (const t of Array.from(document.querySelectorAll("[data-perch]"))) {
        const r = t.getBoundingClientRect();
        if (r.bottom < 40 || r.top > vh - 60) continue;
        const d = Math.abs(r.top + r.height / 2 - vh * 0.42);
        if (d < bestDist) {
          bestDist = d;
          const range = document.createRange();
          range.selectNodeContents(t);
          const lines = range.getClientRects();
          const line = lines[lines.length - 1] ?? r;
          best =
            window.innerWidth - line.right > 64
              ? { x: line.right + 32, y: line.top + line.height * 0.45 }
              : { x: Math.min(line.right - 8, window.innerWidth - 34), y: line.top - 26 };
        }
      }
      return best ?? { x: window.innerWidth - 46, y: vh * 0.22 };
    }

    function frame(time: number) {
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const target = perch();
      const bob = Math.sin(time / 340) * 6;
      const ax = (target.x - x) * 9 - vx * 5.2;
      const ay = (target.y + bob - y) * 9 - vy * 5.2;
      vx += ax * dt;
      vy += ay * dt;
      x += vx * dt;
      y += vy * dt;
      const speed = Math.hypot(vx, vy);
      phase += dt * (speed > 30 ? 22 : 4.5);
      const open = speed > 30 ? 0.25 + 0.75 * Math.abs(Math.cos(phase)) : 0.55 + 0.45 * Math.abs(Math.cos(phase));
      const tilt = Math.max(-28, Math.min(28, vx * 0.08));
      el!.style.transform = `translate3d(${x - 24}px, ${y - 30}px, 0) rotate(${tilt}deg)`;
      el!.style.setProperty("--open", open.toFixed(3));
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  if (!active) return null;
  return (
    <span ref={ref} className="sp-follower" aria-hidden="true">
      <Butterfly />
    </span>
  );
}

export default function WeddingPastelGarden({
  invite,
  embedded = false,
  guest = null,
}: {
  invite: Invite;
  // Shown inside a preview: no folded card, the page is open from the start.
  embedded?: boolean;
  guest?: InviteGuest | null;
}) {
  const [opened, setOpened] = useState(embedded);
  const [gateGone, setGateGone] = useState(embedded);

  const t = parseWallClock(invite.event_date);
  const weekday = t ? DAYS[new Date(Date.UTC(t.year, t.month - 1, t.day)).getUTCDay()] : null;
  const longDate = t ? `${t.day} ${MONTHS[t.month - 1]} ${t.year}` : null;
  const dateLine = t ? `${pad2(t.day)} · ${pad2(t.month)} · ${t.year}` : "Date to be announced";
  const time = t ? `${t.hour % 12 || 12}:${pad2(t.minute)} ${t.hour < 12 ? "AM" : "PM"}` : null;
  const [first, second] = splitNames(invite.host_names);

  // The sky shifts from dawn to dusk as the guest scrolls; clouds parallax.
  const rootRef = useRef<HTMLDivElement>(null);
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
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(onScroll);
    };
    onScroll();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [onScroll]);

  // No scrolling behind the closed card.
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
    <div className={`sp-root ${opened ? "is-open" : ""} ${embedded ? "is-embedded" : "from-gate"}`} ref={rootRef}>
      <style>{CSS}</style>
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

      {!gateGone && (
        <Gate names={invite.host_names} dateLine={dateLine} onDone={() => setOpened(true)} onGone={() => setGateGone(true)} />
      )}

      <main className="sp-page" inert={!opened}>
        <header className="sp-hero">
          <span className="sp-hero-spray" style={{ backgroundImage: `url(${A}/spray.webp)` }} aria-hidden="true" />
          <p className="sp-eyebrow">Together with love</p>
          <h1 className="sp-names">
            <span>{first}</span>
            {second && <span className="sp-amp">&amp;</span>}
            {second && <span>{second}</span>}
          </h1>
          <p className="sp-hero-line">invite you to celebrate their wedding</p>
          <p className="sp-hero-date">{dateLine}</p>
          <GuestWelcome guest={guest} className="sp-welcome" parts={{ dear: "sp-welcome-dear", seats: "sp-small" }} />
          <span className="sp-scroll-hint" aria-hidden="true">
            <span />
          </span>
        </header>

        <Countdown eventDate={invite.event_date} />

        <section className="sp-sec">
          <Mist className="sp-panel">
            <span className="sp-vine sp-vine-l" style={{ backgroundImage: `url(${A}/vine.webp)` }} aria-hidden="true" />
            <p className="sp-eyebrow">The day</p>
            <h2 className="sp-title" data-perch>
              When
            </h2>
            {t ? (
              <>
                <p className="sp-big">{weekday}</p>
                <p className="sp-text sp-text-lg">{longDate}</p>
                <p className="sp-text">at {time}</p>
                <div className="sp-actions">
                  <SaveTheDate
                    invite={invite}
                    triggerClassName="sp-btn sp-btn-ghost"
                    triggerLabel="Save the date"
                    guestToken={guest && !guest.demo ? guest.token : undefined}
                  />
                </div>
              </>
            ) : (
              <p className="sp-text">The date will be shared soon.</p>
            )}
          </Mist>
        </section>

        <section className="sp-sec">
          <Mist className="sp-panel">
            <span className="sp-vine sp-vine-r" style={{ backgroundImage: `url(${A}/vine.webp)` }} aria-hidden="true" />
            <p className="sp-eyebrow">The place</p>
            <h2 className="sp-title" data-perch>
              Where
            </h2>
            <PathToVenue />
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
              {first}
              {second && <span className="sp-amp">&amp;</span>}
              {second}
            </p>
          </Mist>
          <Butterfly className="sp-rest" />
          <p className="sp-made">Invitation by Apr&egrave;s-midi</p>
        </footer>
      </main>

      <Follower active={opened && !embedded} />
    </div>
  );
}

// The source's stylesheet, unchanged apart from the artwork now being files
// and `pointer-events: none` on .sp-out (the hidden butterflies sat over the
// card's middle and swallowed taps).
// Fonts (Gilda Display, Jost) load from the shared <link> in app/layout.tsx.
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
.sp-sky-dawn { background: url(${A}/sky.webp) center / cover no-repeat, linear-gradient(180deg, #ebe8ee 0%, #f4f0e8 50%, #f3ead6 100%); }
.sp-sky-day { background: linear-gradient(180deg, #e6e4ee 0%, #efebe4 50%, #f2ead8 100%); opacity: calc(min(1, max(0, (var(--p) - 0.25) * 2.2)) * 0.75); }
.sp-sky-dusk { background: linear-gradient(180deg, #d4dce8 0%, #e0dde8 55%, #ece6dc 100%); opacity: calc(min(1, max(0, (var(--p) - 0.62) * 2.6)) * 0.85); }
.sp-sky-clouds { position: absolute; inset: -20% 0; will-change: transform; }
.sp-sky-clouds.far { transform: translate3d(0, calc(var(--sy, 0) * -0.04px), 0); }
.sp-sky-clouds.near { transform: translate3d(0, calc(var(--sy, 0) * -0.12px), 0); }
.sp-cloud { position: absolute; display: block; background: url(${A}/clouds.webp) no-repeat; background-size: 400% 100%; opacity: .75; }
.sp-cloud.c1 { width: 62vw; max-width: 380px; aspect-ratio: 2.5/1; top: 18%; left: -14%; background-position: 0 0; animation: sp-drift 46s ease-in-out infinite alternate; }
.sp-cloud.c2 { width: 54vw; max-width: 340px; aspect-ratio: 2.5/1; top: 46%; right: -12%; background-position: 33.333% 0; animation: sp-drift 38s ease-in-out -9s infinite alternate-reverse; }
.sp-cloud.c3 { width: 48vw; max-width: 300px; aspect-ratio: 2.5/1; top: 72%; left: 8%; background-position: 66.666% 0; opacity: .6; animation: sp-drift 52s ease-in-out -20s infinite alternate; }
.sp-cloud.c4 { width: 58vw; max-width: 360px; aspect-ratio: 2.5/1; top: 96%; left: -10%; background-position: 100% 0; animation: sp-drift 41s ease-in-out -5s infinite alternate; }
@keyframes sp-drift { from { translate: -4vw 0; } to { translate: 6vw 0; } }
.sp-grain { position: absolute; inset: 0; background: url(${A}/grain.png); }

/* ---------- shared type ---------- */
.sp-eyebrow { font: 400 11px/1 var(--body); letter-spacing: .34em; text-transform: uppercase; color: var(--ink-soft); margin: 0 0 14px; }
.sp-title { font: 400 clamp(34px, 10vw, 48px)/1.08 var(--title); text-wrap: balance; margin: 0 0 18px; color: var(--ink); letter-spacing: .01em; }
.sp-amp { display: block; font-family: var(--title); font-size: .5em; color: inherit; margin: .12em 0 .08em; }
.sp-text { font: 300 16px/1.65 var(--body); margin: 0 0 6px; color: var(--ink); text-wrap: balance; }
.sp-text-lg { font-size: 19px; font-weight: 400; }
.sp-big { font: 400 30px/1.2 var(--title); margin: 0 0 6px; }
.sp-small { font: 400 11px/1.4 var(--body); letter-spacing: .14em; text-transform: uppercase; color: var(--ink-soft); }

/* ---------- page ---------- */
.sp-page { position: relative; z-index: 1; padding: 0 22px 40px; max-width: 520px; margin: 0 auto; text-align: center; }
.sp-hero { position: relative; min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 0 90px; }
.sp-hero-spray { position: absolute; top: 7svh; left: 50%; width: min(110vw, 560px); aspect-ratio: 16/9; translate: -50% 0; background: center / contain no-repeat; pointer-events: none; }
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
.is-open.from-gate .sp-hero > .sp-eyebrow, .is-open.from-gate .sp-names, .is-open.from-gate .sp-hero-spray { animation: none; }
.is-open.from-gate .sp-hero-line { animation-delay: 0s; } .is-open.from-gate .sp-hero-date { animation-delay: .15s; }
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
.sp-wing { position: absolute; top: 0; width: 50%; height: 100%; background: url(${A}/wing.webp) no-repeat; background-size: 200% 100%; }
.sp-wing-l { left: 0; background-position: 0 0; transform-origin: 100% 50%; transform: perspective(120px) rotateY(calc((1 - var(--open)) * 70deg)); }
.sp-wing-r { right: 0; background-position: 100% 0; transform-origin: 0 50%; transform: perspective(120px) rotateY(calc((1 - var(--open)) * -70deg)); }
.sp-follower { position: fixed; left: 0; top: 0; z-index: 5; pointer-events: none; will-change: transform; filter: drop-shadow(0 6px 6px rgba(60,50,40,.18)); }

/* ---------- gate: the folded card ---------- */
.sp-gate { position: fixed; inset: 0; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; overflow: hidden; }
.sp-gate-sky { position: absolute; inset: 0; background: url(${A}/sky.webp) center / cover no-repeat, linear-gradient(180deg, #ebe8ee 0%, #f4f0e8 50%, #f3ead6 100%); }
.sp-gate-clouds { position: absolute; inset: 0; }
.sp-card {
  --w: min(74vw, 330px); position: relative; width: var(--w); aspect-ratio: 3 / 4.25; border: 0; padding: 0; background: none; cursor: pointer;
  perspective: 1600px; transform-style: preserve-3d; -webkit-tap-highlight-color: transparent;
  animation: sp-float 5s ease-in-out infinite;
}
@keyframes sp-float { 0%,100% { translate: 0 0; rotate: -1deg; } 50% { translate: 0 -8px; rotate: .6deg; } }
.st-seal .sp-card, .st-open .sp-card, .st-grow .sp-card { animation: none; }
/* opening pushes gently towards the guest: the card never shrinks away */
.st-open .sp-card { transform: scale(1.16); transition: transform 2.2s cubic-bezier(.45,.05,.25,1); }
.st-grow .sp-card { transform: scale(1.16); opacity: 0; transition: opacity .55s ease .1s; }
.sp-inside { position: absolute; inset: 0; border-radius: 6px; background: var(--cream) url(${A}/grain.png); box-shadow: 0 40px 70px -30px rgba(70,60,50,.5), 0 2px 6px rgba(70,60,50,.08), inset 0 0 0 1px var(--line); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.sp-inside::after { content: ""; position: absolute; inset: 10px; border: 1px solid var(--line); border-radius: 3px; pointer-events: none; }
.sp-inside-text { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; padding-top: 34%; opacity: 0; transition: opacity .6s ease .45s; }
.st-open .sp-inside-text, .st-grow .sp-inside-text { opacity: 1; }
.st-grow .sp-inside-date { opacity: 0; transition: opacity .3s; }
.sp-inside-text .sp-eyebrow { font-size: 9px; margin-bottom: 10px; }
.sp-inside-names { font: 400 calc(var(--w) * .15)/1 var(--title); color: var(--ink); display: flex; flex-direction: column; align-items: center; }
.sp-inside-date { font: 400 11px/1 var(--body); letter-spacing: .32em; margin-top: 14px; color: var(--ink); }
.sp-pop { position: absolute; left: -12%; right: -12%; top: -2%; height: 46%; background: center / contain no-repeat; transform-origin: 50% 100%; transform: perspective(500px) rotateX(-88deg); opacity: 0; }
.sp-pop-back { top: -6%; filter: saturate(.85) brightness(1.04); transform: perspective(500px) rotateX(-88deg) scale(.92); }
/* the flowers rise only once the flaps are out of the way, so the pop-up is seen */
.st-open .sp-pop, .st-grow .sp-pop { animation: sp-popup 1.05s cubic-bezier(.25,1.4,.45,1) .8s both; }
.st-open .sp-pop-back, .st-grow .sp-pop-back { animation-name: sp-popup-back; animation-delay: .95s; }
.st-grow .sp-pop-back { opacity: 0 !important; transition: opacity .3s; }
@keyframes sp-popup { from { opacity: 0; transform: perspective(500px) rotateX(-88deg); } 25% { opacity: 1; } to { opacity: 1; transform: perspective(500px) rotateX(0); } }
@keyframes sp-popup-back { from { opacity: 0; transform: perspective(500px) rotateX(-88deg) scale(.92) scaleX(-1); } 25% { opacity: .9; } to { opacity: .9; transform: perspective(500px) rotateX(0) scale(.92) scaleX(-1); } }
/* flaps overlap by a hair so nothing shows through the centre line */
.sp-flap { position: absolute; top: 0; bottom: 0; width: calc(50% + 1px); transform-style: preserve-3d; transition: transform 1.45s cubic-bezier(.32,.12,.25,1); z-index: 3; }
.sp-flap-l { left: 0; transform-origin: 0 50%; }
.sp-flap-r { right: 0; transform-origin: 100% 50%; }
.sp-flap-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; background: #f8f4ec url(${A}/grain.png); overflow: hidden; }
.sp-flap-l .sp-flap-face { border-radius: 6px 0 0 6px; }
.sp-flap-r .sp-flap-face { border-radius: 0 6px 6px 0; }
.sp-flap-front { box-shadow: inset 0 0 0 1px var(--line); }
.sp-flap-front::before { content: ""; position: absolute; inset: 10px; border: 1px solid var(--line); }
.sp-flap-l .sp-flap-front::before { border-right: 0; } .sp-flap-r .sp-flap-front::before { border-left: 0; }
.sp-flap-front::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,255,255,0) 55%, rgba(110,95,80,.08)); }
.sp-flap-r .sp-flap-front::after { background: linear-gradient(270deg, rgba(255,255,255,0) 55%, rgba(110,95,80,.08)); }
.sp-flap-back { transform: rotateY(180deg); background-color: #f2eee6; }
.sp-flap-back::before { content: ""; position: absolute; inset: 8% 6%; background: var(--vine) center / contain no-repeat; opacity: .95; }
.sp-flap-r .sp-flap-back::before { transform: scaleX(-1); }
.sp-flap-back::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(110,95,80,.12), rgba(255,255,255,0) 70%); }
.sp-flap-letter { position: absolute; top: 30%; font: 400 calc(var(--w) * .2)/1 var(--title); color: var(--ink); translate: 0 -50%; opacity: .88; }
.sp-flap-l .sp-flap-letter { right: 16%; } .sp-flap-r .sp-flap-letter { left: 16%; }
.st-open .sp-flap-l, .st-grow .sp-flap-l { transform: rotateY(-164deg); }
.st-open .sp-flap-r, .st-grow .sp-flap-r { transform: rotateY(164deg); }
/* the vellum band slides off to the side, the sprig drops away, the seal cracks off and spins up */
.sp-band { position: absolute; left: -2px; right: -2px; top: 50%; height: 22%; z-index: 5; background: linear-gradient(180deg, rgba(214,205,230,.55), rgba(214,205,230,.42)); backdrop-filter: blur(1.5px); -webkit-backdrop-filter: blur(1.5px); border-top: 1px solid rgba(255,255,255,.7); border-bottom: 1px solid rgba(154,143,179,.35); box-shadow: 0 3px 8px -4px rgba(60,50,40,.25); transition: transform .6s cubic-bezier(.55,0,.6,1) .08s, opacity .25s ease .4s; }
.sp-sprig { position: absolute; left: 50%; top: 61%; width: calc(var(--w) * .62); aspect-ratio: 16/9; translate: -50% -50%; rotate: -14deg; z-index: 5; background: center / contain no-repeat; pointer-events: none; transition: transform .6s cubic-bezier(.55,0,.7,1), opacity .25s ease .38s; }
.st-seal .sp-band, .st-open .sp-band, .st-grow .sp-band { transform: translateX(-120%) rotate(-4deg); opacity: 0; }
.st-seal .sp-sprig, .st-open .sp-sprig, .st-grow .sp-sprig { transform: translate(40px, 240px) rotate(38deg); opacity: 0; }
.sp-seal { position: absolute; left: 50%; top: 61%; width: calc(var(--w) * .38); aspect-ratio: 1; translate: -50% -50%; background: center / contain no-repeat; z-index: 6; filter: drop-shadow(0 6px 8px rgba(70,45,90,.25)); transition: transform .4s cubic-bezier(.3,1.5,.5,1); }
.sp-card:hover .sp-seal { transform: scale(1.04); }
.st-seal .sp-seal, .st-open .sp-seal, .st-grow .sp-seal { animation: sp-seal-pop .7s cubic-bezier(.3,.6,.4,1) forwards; }
@keyframes sp-seal-pop {
  0% { transform: scale(1); filter: drop-shadow(0 6px 8px rgba(70,45,90,.25)); }
  18% { transform: scale(1.16) rotate(-5deg); filter: drop-shadow(0 18px 18px rgba(70,45,90,.3)); }
  70% { opacity: 1; }
  100% { transform: translate(110px, -300px) rotate(220deg) scale(.7); opacity: 0; filter: drop-shadow(0 30px 24px rgba(70,45,90,.15)); }
}
/* two butterflies flutter out of the card and stay on screen before rising away */
.sp-out { position: absolute; left: 50%; top: 46%; z-index: 7; opacity: 0; width: 120px; height: 90px; margin: -45px 0 0 -60px; filter: drop-shadow(0 10px 10px rgba(63,58,54,.22)); pointer-events: none; }
.st-open .sp-out-1, .st-grow .sp-out-1 { animation: sp-out1 2.3s cubic-bezier(.4,.1,.4,1) 1.15s both, sp-flap .15s ease-in-out infinite alternate; }
.st-open .sp-out-2, .st-grow .sp-out-2 { animation: sp-out2 2.2s cubic-bezier(.4,.1,.4,1) 1.35s both, sp-flap .17s ease-in-out infinite alternate; }
@keyframes sp-flap { from { --open: 1; } to { --open: .15; } }
@keyframes sp-out1 {
  0% { opacity: 0; transform: translate(0, 0) scale(.35); } 12% { opacity: 1; transform: translate(-24px, -40px) scale(.75) rotate(-8deg); }
  38% { transform: translate(-105px, -150px) scale(1) rotate(-14deg); } 58% { transform: translate(-40px, -225px) scale(1) rotate(10deg); }
  80% { opacity: 1; transform: translate(-100px, -300px) scale(.95) rotate(-8deg); } 100% { opacity: 0; transform: translate(-60px, -470px) scale(.85) rotate(6deg); }
}
@keyframes sp-out2 {
  0% { opacity: 0; transform: translate(0, 0) scale(.35); } 12% { opacity: 1; transform: translate(30px, -30px) scale(.7) rotate(10deg); }
  38% { transform: translate(105px, -110px) scale(.9) rotate(14deg); } 58% { transform: translate(55px, -200px) scale(.9) rotate(-8deg); }
  80% { opacity: 1; transform: translate(110px, -270px) scale(.88) rotate(8deg); } 100% { opacity: 0; transform: translate(80px, -450px) scale(.8) rotate(-6deg); }
}
.sp-tap { position: relative; font: 400 12px/1 var(--body); letter-spacing: .4em; text-transform: uppercase; color: var(--ink); margin: 0; padding-left: .4em; animation: sp-breathe 2.6s ease-in-out infinite; transition: opacity .3s; }
@keyframes sp-breathe { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
.st-seal .sp-tap, .st-open .sp-tap, .st-grow .sp-tap { opacity: 0; animation: none; }
.st-grow { pointer-events: none; }
.st-grow .sp-gate-sky, .st-grow .sp-gate-clouds { opacity: 0; transition: opacity .9s ease .1s; }
@media (prefers-reduced-motion: reduce) {
  .sp-card, .sp-tap, .sp-cloud { animation: none !important; }
  .sp-mist { filter: none; transform: none; }
}
`;
