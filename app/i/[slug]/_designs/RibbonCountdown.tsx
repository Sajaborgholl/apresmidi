"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import TypewriterText from "./TypewriterText";
import { useHydrated } from "@/lib/useHydrated";
import { parseWallClock } from "@/lib/calendar";

// Blush Bow's wedding countdown: a hand-drawn ribbon with the template's bow
// tied in the middle, and four cream gift tags hanging from it (days, hours,
// minutes, seconds). When it scrolls into view the ribbon draws itself and
// the tags drop in; after that they sway gently on their strings.

// The current second, shared by everything that reads it. Ticks once a
// second while mounted. On the server (and during hydration) there is no
// "now", so the tags render placeholders and the browser fills them in —
// the server HTML and the first browser render then agree.
function subscribeToClock(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const currentSecond = () => Math.floor(Date.now() / 1000);
const noTimeOnServer = () => null;

// The countdown targets the host's typed time on the guest's own clock — a
// host's "7:00 PM" never becomes 10:00 PM in Beirut. See parseWallClock.
function wallClockTarget(eventDate: string | null): number | null {
  const t = parseWallClock(eventDate);
  if (!t) return null;
  const target = new Date(t.year, t.month - 1, t.day, t.hour, t.minute).getTime();
  return Number.isNaN(target) ? null : target;
}

const pad = (n: number) => String(n).padStart(2, "0");

const SWAY = [
  { duration: "3.4s", delay: "0s" },
  { duration: "3.9s", delay: "-1.1s" },
  { duration: "3.6s", delay: "-0.6s" },
  { duration: "4.1s", delay: "-1.7s" },
];

function Tag({ value, label, index }: { value: string; label: string; index: number }) {
  return (
    <div
      className="rc-hanger"
      style={{ animationDuration: SWAY[index].duration, animationDelay: SWAY[index].delay }}
    >
      <span className="rc-string" />
      <div className="rc-drop" style={{ animationDelay: `${1 + index * 0.14}s` }}>
        <div className="rc-card">
          <svg className="rc-card-shape" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
            <polygon points="4,22 22,4 78,4 96,22 96,136 4,136" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="rc-hole" />
          <span className="rc-number script">{value}</span>
          <span className="rc-label">{label}</span>
        </div>
      </div>
    </div>
  );
}

export default function RibbonCountdown({ eventDate, bow }: { eventDate: string | null; bow: ReactNode }) {
  const target = wallClockTarget(eventDate);
  const now = useSyncExternalStore(subscribeToClock, currentSecond, noTimeOnServer);
  const hydrated = useHydrated();
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  // Same trigger as TypewriterText: start the entrance once it's on screen.
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
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (target === null) return null;

  const remaining = now === null ? null : Math.max(0, target - now * 1000);
  const married = remaining === 0;
  const totalSeconds = remaining === null ? 0 : Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const tags =
    remaining === null
      ? ["–", "–", "–", "–"]
      : [String(days), pad(hours), pad(minutes), pad(seconds)];

  // Only changes once a minute, so a screen reader isn't re-read every second.
  const spoken =
    remaining === null
      ? "Countdown to the wedding"
      : married
        ? "The wedding day is here — just married!"
        : `Countdown to the wedding: ${days} days, ${hours} hours and ${minutes} minutes to go`;

  // "armed" (hidden, waiting to animate in) only once the page is running in
  // the browser — without JavaScript the ribbon and tags simply show.
  const stateClass = !hydrated ? "" : inView ? " rc-in" : " rc-armed";

  return (
    <section ref={ref} className={`rc${stateClass}`} aria-label={spoken}>
      <style>{CSS}</style>
      <h2 className="script rc-heading" aria-hidden="true">
        <TypewriterText text={married ? "We said I do!" : "Counting down to forever"} />
      </h2>

      <div className="rc-stage" aria-hidden="true">
        <div className="rc-ribbon">
          <svg viewBox="0 0 1000 60" preserveAspectRatio="none">
            <path
              d="M6,30 C120,10 240,48 360,30 C430,20 470,26 500,30 C530,34 570,40 640,30 C760,12 880,50 994,30"
              pathLength={1}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="rc-bow">{bow}</div>
        </div>

        {married ? (
          <div className="rc-tags rc-tags-single">
            <Tag value="Just married!" label="" index={0} />
          </div>
        ) : (
          <div className="rc-tags">
            {["Days", "Hours", "Minutes", "Seconds"].map((label, i) => (
              <Tag key={label} value={tags[i]} label={label} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const CSS = `
/* Same vertical padding as the template's other sections (WeddingBlushBow.tsx), so the gaps around the countdown match the rest of the page. */
.rc { padding: 80px 8vw; text-align: center; overflow: hidden; }
.rc-heading { font-size: clamp(1.8rem, 4vw, 2.4rem); margin: 0 0 6px; }
.rc-stage { position: relative; max-width: 760px; margin: 0 auto; }

/* The ribbon, drawn left to right on entrance (stroke-dashoffset 1 -> 0). */
.rc-ribbon { position: relative; height: 60px; }
.rc-ribbon > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.rc-ribbon > svg path {
  fill: none; stroke: #1c1c1c; stroke-width: 2.5px; stroke-linecap: round;
  stroke-dasharray: 1; stroke-dashoffset: 0;
}
.rc-armed .rc-ribbon > svg path { stroke-dashoffset: 1; }
.rc-in .rc-ribbon > svg path { stroke-dashoffset: 0; transition: stroke-dashoffset 1.2s ease-in-out; }
.rc-bow { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -58%); line-height: 0; z-index: 2; }
.rc-armed .rc-bow { opacity: 0; transform: translate(-50%, -58%) scale(0.6); }
.rc-in .rc-bow { animation: rc-pop 0.45s 0.55s cubic-bezier(.34,1.56,.64,1) both; }

/* Tags hang just below the ribbon; the strings tuck up behind it. */
.rc-tags { display: grid; grid-template-columns: repeat(4, minmax(0, 120px)); justify-content: space-between; gap: 12px; margin-top: -26px; padding: 0 4%; }
.rc-tags-single { grid-template-columns: minmax(0, 220px); justify-content: center; }
.rc-hanger {
  display: flex; flex-direction: column; align-items: center;
  transform-origin: 50% 0;
  animation-name: rc-sway; animation-iteration-count: infinite; animation-timing-function: ease-in-out;
}
.rc-string { width: 1.5px; height: 44px; background: #1c1c1c; }
.rc-drop { width: 100%; }
.rc-armed .rc-drop { opacity: 0; }
.rc-in .rc-drop { animation: rc-drop 0.55s cubic-bezier(.34,1.56,.64,1) both; }

.rc-card {
  position: relative; height: 136px; margin-top: -8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  padding-top: 18px;
}
.rc-card-shape { position: absolute; inset: 0; width: 100%; height: 100%; }
.rc-card-shape polygon { fill: #FBF1DE; stroke: #1c1c1c; stroke-width: 1.5px; }
.rc-hole { position: absolute; top: 12px; left: 50%; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; border: 1.5px solid #1c1c1c; background: #F6C9D3; }
.rc-number { position: relative; font-size: 2.8rem; line-height: 1; }
.rc-tags-single .rc-number { font-size: 2.2rem; }
.rc-label {
  position: relative;
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; font-size: 11px;
}

@keyframes rc-sway { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
@keyframes rc-drop { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rc-pop { from { opacity: 0; transform: translate(-50%, -58%) scale(0.6); } to { opacity: 1; transform: translate(-50%, -58%) scale(1); } }

@media (max-width: 640px) {
  .rc { padding: 56px 4vw; }
  .rc-tags { gap: 8px; padding: 0; margin-top: -24px; }
  .rc-string { height: 34px; }
  .rc-card { height: 108px; padding-top: 16px; }
  .rc-number { font-size: 2rem; }
  .rc-label { font-size: 9px; letter-spacing: 0.03em; }
  .rc-bow svg { width: 70px; height: 35px; }
}

/* Reduced motion: everything simply shown; numbers still update. */
@media (prefers-reduced-motion: reduce) {
  .rc-hanger, .rc-in .rc-drop, .rc-in .rc-bow { animation: none !important; }
  .rc-armed .rc-ribbon > svg path, .rc-in .rc-ribbon > svg path { stroke-dashoffset: 0; transition: none; }
  .rc-armed .rc-drop, .rc-armed .rc-bow { opacity: 1; }
  .rc-armed .rc-bow { transform: translate(-50%, -58%); }
}
`;
