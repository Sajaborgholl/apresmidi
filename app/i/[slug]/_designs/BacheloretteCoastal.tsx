"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Invite } from "@/lib/types";

// react-pageflip renders a real canvas/DOM paper-curl (proper curved fold,
// moving highlight, cast shadow) instead of our hand-rolled clip-path
// approximation. It touches the DOM directly, so it has to be client-only —
// loaded with ssr:false rather than imported normally.
const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

// ---------- Static geometry for the scalloped fan-lace oval frame ----------
// Precomputed once at module scope since it never depends on invite data —
// both pages share the exact same frame, so this is rendered twice from the
// same numbers.
const FRAME = { cx: 200, cy: 262, rx: 172, ry: 232 };
const FAN_COUNT = 34;
const DOT_COUNT = 60;

// Trig results can print with a different last digit on the server (Node)
// vs the client (browser) for the exact same math, which trips React's
// hydration diff even though the values are visually identical. Rounding
// to 3 decimal places keeps plenty of precision for pixels while making
// the server- and client-rendered strings byte-for-byte identical.
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// react-pageflip listens for mousedown/touchstart on the book itself (to
// detect corner-drag gestures) and calls preventDefault() on that event —
// which blocks the browser's default "focus this element" behavior. It
// only skips inputs, textareas, etc. it doesn't know about (only <a> and
// <button> are exempted internally), so form fields inside a flip-book
// page silently never get focus. Fixing this from a normal React
// onMouseDown prop doesn't work: React only dispatches synthetic events
// once the native event has already bubbled all the way up to React's
// root listener, and page-flip's own real addEventListener sits on an
// ancestor *below* that root — so its handler (and its preventDefault())
// already ran by the time our synthetic handler would fire. Attaching a
// real, non-delegated listener directly on the input itself (via this ref
// callback) runs at the right moment — right as the event reaches the
// input — so stopPropagation() here actually keeps it from ever reaching
// page-flip's listener further up the tree, while leaving the browser's
// own default focus behavior on the input untouched.
function stopFlipDrag(node: HTMLElement | null) {
  if (!node) return;
  node.addEventListener("mousedown", (e) => e.stopPropagation());
  node.addEventListener("touchstart", (e) => e.stopPropagation());
}

const FANS = Array.from({ length: FAN_COUNT }, (_, i) => {
  const angle = (i / FAN_COUNT) * Math.PI * 2 - Math.PI / 2;
  const x = r3(FRAME.cx + FRAME.rx * Math.cos(angle));
  const y = r3(FRAME.cy + FRAME.ry * Math.sin(angle));
  const deg = r3((angle * 180) / Math.PI + 90);
  return { x, y, deg };
});

// Fan "ribs" are drawn in each fan's own local (rotated) coordinate space,
// so the 5 rib endpoints are identical for every fan — only computed once.
const FAN_RIBS = [-10, -5, 0, 5, 10].map((r) => {
  const rad = (r / 13) * (Math.PI / 2);
  return { x2: r3(13 * Math.sin(rad)), y2: r3(-13 * Math.cos(rad)) };
});

const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => {
  const angle = (i / DOT_COUNT) * Math.PI * 2;
  return {
    x: r3(FRAME.cx + (FRAME.rx - 20) * Math.cos(angle)),
    y: r3(FRAME.cy + (FRAME.ry - 20) * Math.sin(angle)),
  };
});

function DoilyFrame() {
  return (
    <svg className="doily" viewBox="0 0 400 564" preserveAspectRatio="none" aria-hidden="true">
      {FANS.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.deg})`}>
          <path d="M -13 0 A 13 13 0 0 1 13 0 Z" fill="#fff" stroke="var(--pink-light)" strokeWidth={0.6} />
          {FAN_RIBS.map((rib, j) => (
            <line key={j} x1={0} y1={0} x2={rib.x2} y2={rib.y2} stroke="var(--pink-light)" strokeWidth={0.6} />
          ))}
        </g>
      ))}
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.6} fill="var(--pink)" />
      ))}
      <ellipse cx={FRAME.cx} cy={FRAME.cy} rx={FRAME.rx - 28} ry={FRAME.ry - 28} fill="#fff" />
    </svg>
  );
}

// ---------- Watercolor-style vertical stripes ----------
const STRIPE_XS = [-20, 78, 178, 278, 378];
const STRIPE_COLORS = ["var(--green)", "var(--pink)", "var(--green)", "var(--pink)", "var(--green)"];

function Stripes({ id }: { id: string }) {
  const filterId = `${id}-rough`;
  return (
    <svg className="stripes-svg" viewBox="0 0 400 564" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves={2} seed={7} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={16} />
        </filter>
      </defs>
      <rect x={0} y={0} width={400} height={564} fill="var(--cream)" />
      <g filter={`url(#${filterId})`}>
        {STRIPE_XS.map((x, i) => (
          <rect key={i} x={x} y={-10} width={58} height={584} fill={STRIPE_COLORS[i]} />
        ))}
      </g>
    </svg>
  );
}

// ---------- Shell + bow illustration ----------
const SHELL_CX = 62;
const SHELL_CY = 78;
const SHELL_TURNS = 2.4;
const SHELL_STEPS = 80;

function shellPoint(i: number) {
  const t = i / SHELL_STEPS;
  const angle = t * SHELL_TURNS * Math.PI * 2 - Math.PI * 0.6;
  const r = 4 + t * 46;
  const x = SHELL_CX + r * Math.cos(angle) * 0.9 - t * 30;
  const y = SHELL_CY - t * 68 + r * Math.sin(angle) * 0.5;
  return { x, y, angle };
}

const SHELL_SPIRAL_D = Array.from({ length: SHELL_STEPS + 1 }, (_, i) => {
  const { x, y } = shellPoint(i);
  return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
}).join(" ");

const SHELL_TICKS = Array.from({ length: SHELL_STEPS }, (_, i) => i)
  .filter((i) => i >= 10 && i % 6 === 0)
  .map((i) => {
    const { x, y, angle } = shellPoint(i);
    return {
      x1: r3(x),
      y1: r3(y),
      x2: r3(x + 6 * Math.cos(angle + 1)),
      y2: r3(y + 6 * Math.sin(angle + 1)),
    };
  });

function ShellIllustration() {
  return (
    <svg width={150} height={110} viewBox="0 0 150 110" aria-hidden="true">
      <path d={SHELL_SPIRAL_D} fill="none" stroke="var(--green-dark)" strokeWidth={2} strokeLinecap="round" />
      {SHELL_TICKS.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--green)" strokeWidth={1.4} />
      ))}
      <g transform="translate(96,52) rotate(8)">
        <path
          d="M0 0 C -16 -15 -25 6 -8 7 C -18 12 -11 24 0 9 C 11 24 18 12 8 7 C 25 6 16 -15 0 0 Z"
          fill="var(--pink)"
          stroke="var(--pink-light)"
          strokeWidth={1}
        />
        <circle cx={0} cy={4} r={4.5} fill="var(--green-dark)" />
        <path d="M -4 8 C -8 22 -6 34 -12 42" stroke="var(--pink)" strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M 4 8 C 8 22 4 34 10 44" stroke="var(--pink)" strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// react-pageflip requires each page to be a forwardRef component so it can
// grab the DOM node directly.
const InvitePage = forwardRef<HTMLDivElement, { invite: Invite; onRsvp: () => void }>(function InvitePage(
  { invite, onRsvp },
  ref
) {
  const eventDate = invite.event_date ? new Date(invite.event_date) : null;
  const dateFormatted = eventDate
    ? eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;
  const timeFormatted = eventDate
    ? eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="card-page" ref={ref}>
      <Stripes id="stripes-front" />
      <DoilyFrame />
      <div className="content">
        <svg className="arc-wrap" viewBox="0 0 220 60">
          <path id="arcPathFront" d="M 14 52 A 96 96 0 0 1 206 52" fill="transparent" />
          <text>
            <textPath href="#arcPathFront" startOffset="50%" textAnchor="middle">
              Join us for
            </textPath>
          </text>
        </svg>

        <div className="illustration">
          <ShellIllustration />
        </div>

        <div className="script">{invite.host_names}&apos;s</div>
        <div className="title">BACHELORETTE</div>
        <div className="date">
          {dateFormatted ?? "Date coming soon"}
          {timeFormatted ? ` — ${timeFormatted}` : ""}
        </div>

        <div className="lead">
          She said yes — <b>now</b> we celebrate.
        </div>

        <div className="address">{invite.venue_name ?? "Location coming soon"}</div>

        <button className="rsvp-btn" type="button" onClick={onRsvp}>
          RSVP
        </button>
      </div>
    </div>
  );
});

type RsvpPageProps = {
  invite: Invite;
  onBack: () => void;
};

// Owns all of its own form state locally now — it used to be lifted up
// into BacheloretteCoastal and passed down as props, but that meant every
// keystroke re-rendered the *parent*, which recreates the <InvitePage>/
// <RsvpPage> elements passed as HTMLFlipBook's children. react-pageflip
// treats any change to its children as a reason to call updateFromHtml()
// internally (see node_modules/react-pageflip's effect on [props.children]),
// which rebuilds the page's real DOM nodes — wiping input focus after every
// single character. Keeping this state local means typing only re-renders
// this one already-mounted component, not the whole book.
const RsvpPage = forwardRef<HTMLDivElement, RsvpPageProps>(function RsvpPage({ invite, onBack }, ref) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="card-page" ref={ref}>
      <Stripes id="stripes-back" />
      <DoilyFrame />
      <div className="content">
        <div className="script small">We can&apos;t wait</div>
        <div className="title small">TO CELEBRATE WITH YOU</div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <label>
              Full Name
              <input
                ref={stopFlipDrag}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </label>

            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${attending === "yes" ? "active" : ""}`}
                onClick={() => setAttending("yes")}
              >
                Joyfully Accept
              </button>
              <button
                type="button"
                className={`toggle-btn ${attending === "no" ? "active" : ""}`}
                onClick={() => setAttending("no")}
              >
                Regretfully Decline
              </button>
            </div>

            {attending === "yes" && (
              <label>
                Number of Guests
                <input
                  ref={stopFlipDrag}
                  type="number"
                  min={1}
                  max={6}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                />
              </label>
            )}

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Sending..." : "Send RSVP"}
            </button>
          </form>
        ) : (
          <div className="thank-you">
            <div className="script small">Yay!</div>
            <p>
              {attending === "yes"
                ? `Your RSVP has been received, ${name.trim() || "friend"} — see you at the party!`
                : `Thanks for letting us know, ${name.trim() || "friend"} — you'll be missed.`}
            </p>
          </div>
        )}

        <button className="back-btn" type="button" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
});

export default function BacheloretteCoastal({ invite }: { invite: Invite }) {
  // react-pageflip's own TS types are thin, so this ref is typed loosely —
  // book.current.pageFlip() returns the underlying PageFlip instance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const book = useRef<any>(null);

  // Scales the card up while keeping its original 360:506 shape exactly —
  // this is a "contain" fit (like object-fit: contain), not a stretch: it
  // finds the biggest size at that same ratio that fits the viewport (minus
  // a little breathing room), so the card gets taller/bigger without the
  // artwork or text ever getting warped out of proportion.
  const CARD_RATIO_W = 360;
  const CARD_RATIO_H = 506;
  const VIEWPORT_PADDING = 28;

  const [size, setSize] = useState({ width: CARD_RATIO_W, height: CARD_RATIO_H });

  useEffect(() => {
    function measure() {
      const availW = window.innerWidth - VIEWPORT_PADDING * 2;
      const availH = window.innerHeight - VIEWPORT_PADDING * 2;
      const scale = Math.min(availW / CARD_RATIO_W, availH / CARD_RATIO_H);
      const width = Math.round(CARD_RATIO_W * scale);
      const height = Math.round(CARD_RATIO_H * scale);
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <>
      <style>{CSS}</style>

      <div className="page-wrap">
        <div className="book-frame" style={{ width: size.width, height: size.height }}>
          {/*
            size="fixed" + autoSize={false} on purpose: "stretch" let the
            library recompute its own box against our min/max thresholds,
            and when that disagreed with .book-frame's own CSS size, its
            corner-shadow layer rendered taller than our container and
            visibly spilled out below the card. Fixed dimensions that
            exactly match .book-frame's own inline-styled size (computed
            above, keeping the 360:506 ratio) eliminate that mismatch. The
            key forces a clean remount when the size changes, since
            react-pageflip doesn't re-layout an already mounted "fixed"
            book from new width/height props alone.
          */}
          <HTMLFlipBook
            key={`${size.width}x${size.height}`}
            width={size.width}
            height={size.height}
            size="fixed"
            autoSize={false}
            maxShadowOpacity={0.5}
            flippingTime={800}
            showCover={false}
            mobileScrollSupport={true}
            usePortrait={true}
            drawShadow={true}
            /*
              react-pageflip's own .d.ts marks every one of these as
              required, even though the underlying library fills in the
              exact same values itself at runtime if they're omitted (see
              node_modules/page-flip/src/Settings.ts's _default object) —
              this is just a mismatch in their published types, not a real
              behavior change. Passing them explicitly (matching those same
              defaults) satisfies the type checker without altering
              anything. minWidth/maxWidth/minHeight/maxHeight are ignored
              by the library anyway once size="fixed" (it overwrites them
              with width/height internally), so their exact values here
              don't matter.
            */
            className=""
            style={{}}
            startPage={0}
            minWidth={size.width}
            maxWidth={size.width}
            minHeight={size.height}
            maxHeight={size.height}
            startZIndex={0}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
            ref={book}
          >
            <InvitePage invite={invite} onRsvp={() => book.current?.pageFlip().flipNext()} />
            <RsvpPage invite={invite} onBack={() => book.current?.pageFlip().flipPrev()} />
          </HTMLFlipBook>
        </div>

        <p className="hint">Tap RSVP, or drag the corner to turn the page</p>
      </div>
    </>
  );
}

const CSS = `
:root {
  --pink: #fdc5cb;
  --pink-light: #fed6d9;
  --green: #d2d67f;
  --green-dark: #72805a;
  --cream: #FAF3E6;
  --ink: #72805a;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
.page-wrap {
  margin: 0;
  min-height: 100vh;
  background: #EDE7DD;
  font-family: 'Quicksand', sans-serif;
  color: var(--ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
.book-frame { position: relative; overflow: hidden; flex-shrink: 0; }
.card-page { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--cream); }
.stripes-svg, .doily { position: absolute; inset: 0; width: 100%; height: 100%; }
.content { position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%); width: 258px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.arc-wrap { width: 220px; height: 60px; }
.arc-wrap text { font-family: 'Caveat', cursive; font-weight: 600; font-size: 27px; fill: var(--ink); }
.illustration { margin: 2px 0 4px; }
.script { font-family: 'Dancing Script', cursive; font-weight: 400; font-size: 66px; color: var(--ink); line-height: 1; margin-top: 2px; }
.script.small { font-size: 42px; }
.title { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 32px; letter-spacing: 2px; color: var(--ink); margin-top: 2px; }
.title.small { font-size: 19px; letter-spacing: 1.5px; }
.date { margin-top: 12px; font-weight: 600; font-size: 15.5px; color: var(--green-dark); }
.lead { margin-top: 12px; font-size: 13.5px; font-weight: 500; color: var(--green-dark); }
.lead b { font-weight: 700; }
.address { margin-top: 14px; font-size: 15px; font-weight: 700; line-height: 1.4; color: var(--green-dark); }
.rsvp-btn { margin-top: 14px; padding: 8px 26px; border: 1.5px solid var(--green-dark); border-radius: 999px; background: transparent; color: var(--green-dark); font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 1.5px; cursor: pointer; }
.rsvp-btn:hover { background: var(--green-dark); color: #fff; }
form { width: 100%; max-width: 230px; margin-top: 12px; display: flex; flex-direction: column; gap: 12px; }
form label { display: flex; flex-direction: column; gap: 5px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.4px; color: var(--green-dark); text-align: left; }
form input { font-family: 'Quicksand', sans-serif; font-size: 13.5px; padding: 8px 11px; border-radius: 8px; border: 1.5px solid var(--pink); background: #fff; color: var(--ink); outline: none; }
form input:focus { border-color: var(--green-dark); }
.toggle-group { display: flex; gap: 8px; }
.toggle-btn { flex: 1; padding: 8px 6px; border-radius: 8px; border: 1.5px solid var(--pink); background: #fff; font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 11px; color: var(--ink); cursor: pointer; }
.toggle-btn.active { background: var(--green-dark); border-color: var(--green-dark); color: #fff; }
.error-text { font-size: 11.5px; color: #b23; margin: -4px 0 0; }
.submit-btn { margin-top: 2px; padding: 10px; border: none; border-radius: 999px; background: var(--green-dark); color: #fff; font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 1px; cursor: pointer; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.submit-btn:hover { opacity: 0.92; }
.thank-you { margin-top: 18px; }
.thank-you p { font-size: 12.5px; color: #333; max-width: 210px; margin: 6px auto 0; line-height: 1.55; }
.back-btn { margin-top: 14px; background: none; border: none; color: var(--green-dark); font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 1px; cursor: pointer; padding: 6px; }
.hint { margin-top: 20px; font-size: 12.5px; color: #8a7c70; letter-spacing: 0.5px; text-align: center; }
`;
