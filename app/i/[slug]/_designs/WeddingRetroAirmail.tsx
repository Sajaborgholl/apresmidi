"use client";
/* eslint-disable @next/next/no-img-element -- every <img> here is fixed,
   pre-sized template artwork or a customer photo, placed like the siblings do. */

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Invite } from "@/lib/types";
import { parseWallClock } from "@/lib/calendar";
import { useHydrated } from "@/lib/useHydrated";
import SaveTheDate from "./SaveTheDate";
import WhatsappConfirmLink from "./WhatsappConfirmLink";
import { submitRsvp } from "../actions";

// Retro Airmail Wedding — cloned from the Canva "Save the date" site
// (apresmidi.my.canva.site/save-the-date). Every element sits at the exact
// position/size/rotation from the source's own scene JSON, in its 1366-unit
// canvas, scaled to the page width — the same "one canvas, scaled" behaviour
// the Canva site has on every screen. The illustrated pieces are the source's
// own artwork (public/templates/wedding-retro-airmail/, exported by the owner
// and cleaned of their baked-in text); all text is live.
//
// Fonts — Canva's own fonts aren't on Google Fonts, so free stand-ins:
//   HK Grotesk Pro        -> Hanken Grotesk (HK Grotesk's open-source origin)
//   Adventures Unlimited  -> Sacramento (thin monoline script)
//   Calgary               -> Cormorant Garamond, uppercase
// ("THE DETAILS", in Roca One, is the source's own title artwork.)
//
// Photos: photo 1 sits in the envelope (as in the design); photo 2 replaces
// the source's black-and-white cut-out of its demo couple: a tilted
// photo with no border or shadow, in black and white.

const A = "/templates/wedding-retro-airmail";
const u = (n: number) => `calc(var(--ra-u) * ${n})`;

// A box in canvas units: left, top, width, optional height and rotation.
function box(left: number, top: number, width: number, height?: number, rotate?: number): CSSProperties {
  return {
    left: u(left),
    top: u(top),
    width: u(width),
    ...(height !== undefined ? { height: u(height) } : {}),
    ...(rotate ? { transform: `rotate(${rotate}deg)` } : {}),
  };
}

// "17.8.2027" — the source's date style, from the time the host typed.
function shortDate(eventDate: string | null): string | null {
  const t = parseWallClock(eventDate);
  return t ? `${t.day}.${t.month}.${t.year}` : null;
}

// Scroll reveal: the same IntersectionObserver idiom as the other templates.
// Hidden only once the page's JavaScript runs (.ra-js), so the invitation
// never stays invisible without it.
function Rv({
  kind = "rise",
  delay = 0,
  style,
  className = "",
  children,
}: {
  kind?: "rise" | "fade" | "pop";
  delay?: number;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}) {
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
    <div
      ref={ref}
      className={`ra-rv ra-rv-${kind}${inView ? " in" : ""}${className ? ` ${className}` : ""}`}
      style={{ ...style, ...(delay ? { transitionDelay: `${delay}ms` } : {}) }}
    >
      {children}
    </div>
  );
}

// The two hands, tied to scrolling: they start pushed apart and close in as
// the page scrolls — from when they rise into view at the bottom of the screen
// until they're centred in it, where their fingertips touch.
// No timer or easing: position follows the scroll, so it pauses when the
// scroll does and reverses on the way back up. Progress goes into one CSS
// variable (--ra-hands, 0 apart → 1 together), so scrolling never re-renders.
function ScrollHands() {
  const wrap = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = wrap.current;
    const hand = band.current;
    if (!el || !hand || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = hand.getBoundingClientRect();
      const vh = window.innerHeight;
      // Starts where the hands enter at the bottom of the screen — or, if the
      // page opens with them already in view (short pages, phones), where
      // they are at the very top of the page, so the whole movement is seen.
      const start = Math.min(vh, r.top + window.scrollY);
      const end = vh / 2 - r.height / 2;
      const p = start > end ? (start - r.top) / (start - end) : 1;
      el.style.setProperty("--ra-hands", String(Math.min(1, Math.max(0, p))));
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
  }, []);
  return (
    <div ref={wrap} className="ra-hands">
      <div ref={band} className="ra-abs ra-hand-left" style={box(-14.66, 1280.95, 979.43, 342.8)}>
        <img src={`${A}/hand-left.webp`} alt="" className="ra-fill" />
      </div>
      <div className="ra-abs ra-hand-right" style={box(376.18, 1204.43, 1008.78, 355.19)}>
        <img src={`${A}/hand-right.webp`} alt="" className="ra-fill" />
      </div>
    </div>
  );
}

// The letter's message, typed out a character at a time once it's on screen
// (the TypewriterText idea, for several hard lines). Every line keeps its full
// width from the start — the untyped rest is there but invisible — so the
// centred lines never shift while they're typed. Without JavaScript, and with
// reduced motion, the whole message simply shows.
const LETTER_LINES = [
  "...and it would mean the world to",
  "us if you joined our special day.",
  "Join us as we celebrate the start",
  "of our forever together.",
];
// Where each line starts, counting characters through the whole message.
const LETTER_STARTS = LETTER_LINES.map((_, i) => LETTER_LINES.slice(0, i).reduce((n, line) => n + line.length, 0));
const LETTER_TOTAL = LETTER_LINES.reduce((n, line) => n + line.length, 0);

function LetterTyping({ speed = 38 }: { speed?: number }) {
  const hydrated = useHydrated();
  const ref = useRef<HTMLParagraphElement>(null);
  const [started, setStarted] = useState(false);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let delay = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setTyped(LETTER_TOTAL);
        // a beat after the letter itself has risen into place
        else delay = window.setTimeout(() => setStarted(true), 600);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(delay);
    };
  }, []);

  useEffect(() => {
    if (!started || typed >= LETTER_TOTAL) return;
    const t = setTimeout(() => setTyped((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [started, typed, speed]);

  const shown = hydrated ? typed : LETTER_TOTAL;
  const done = shown >= LETTER_TOTAL;
  return (
    <p ref={ref} className="ra-letter-text" aria-label={LETTER_LINES.join(" ")}>
      {LETTER_LINES.map((line, i) => {
        const start = LETTER_STARTS[i];
        const n = Math.min(line.length, Math.max(0, shown - start));
        const caretHere = started && !done && shown >= start && shown < start + line.length;
        return (
          <span key={line} aria-hidden="true">
            {line.slice(0, n)}
            {caretHere && <i className="ra-caret" />}
            <span className="ra-untyped">{line.slice(n)}</span>
          </span>
        );
      })}
    </p>
  );
}

function Photo({ url, alt, mono }: { url: string | undefined; alt: string; mono?: boolean }) {
  return url ? (
    <img src={url} alt={alt} className={`ra-photo-img${mono ? " ra-mono" : ""}`} />
  ) : (
    <div className="ra-photo-empty">No photo yet</div>
  );
}

// Text set along an arch, as the source's "curved" text effect.
function ArcText({
  width,
  height,
  d,
  className,
  children,
}: {
  width: number;
  height: number;
  d: string;
  className: string;
  children: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={children}>
      <defs>
        <path id={`arc-${id}`} d={d} fill="none" />
      </defs>
      <text>
        <textPath href={`#arc-${id}`} startOffset="50%" textAnchor="middle">
          {children}
        </textPath>
      </text>
    </svg>
  );
}

// The five stripes behind the ticket, from the source's own vector shapes (SVG
// export units: 0.75 per canvas unit). Each is a 30.52-high horizontal bar on
// the left that, from x 749.44 (behind the ticket), fans out into a wedge
// reaching the right edge (x 1038.38) between yTop and yBottom. Drawn in code
// rather than as artwork so both ends can run on past the canvas, along their
// own lines, to the edges of any screen.
const RAYS = [
  { fill: "#fdf4d4", bar: 274.98, yTop: 0.27, yBottom: 120.37 },
  { fill: "#2d53c8", bar: 314.15, yTop: 154.39, yBottom: 274.5 },
  { fill: "#c44d48", bar: 353.31, yTop: 308.52, yBottom: 428.63 },
  { fill: "#ac9f97", bar: 392.47, yTop: 462.65, yBottom: 582.75 },
  { fill: "#566e99", bar: 431.64, yTop: 616.77, yBottom: 736.88 },
];
const RAY_BAR = 30.52;
const RAY_FAN = 749.44;
const RAY_EDGE = 1038.38;
const RAY_FAR = 4000; // well past the widest screen, in both directions

function Rays() {
  const at = (y0: number, y1: number, x: number) => y0 + ((y1 - y0) * (x - RAY_FAN)) / (RAY_EDGE - RAY_FAN);
  const far = RAY_EDGE + RAY_FAR;
  return (
    <svg viewBox="0 0 1038.75 1069.5" className="ra-fill ra-rays" aria-hidden="true">
      {RAYS.map((r) => {
        const top = r.bar;
        const bottom = r.bar + RAY_BAR;
        const points = [
          [-RAY_FAR, top],
          [RAY_FAN, top],
          [far, at(top, r.yTop, far)],
          [far, at(bottom, r.yBottom, far)],
          [RAY_FAN, bottom],
          [-RAY_FAR, bottom],
        ];
        return <polygon key={r.fill} fill={r.fill} points={points.map((pt) => pt.join(",")).join(" ")} />;
      })}
    </svg>
  );
}

// The postmark that lands on the RSVP card once it's sent: a double ring
// with the couple's names around the top and the date around the bottom,
// "SENT" in the middle, and the wavy cancellation lines beside it.
function Postmark({ names, date }: { names: string; date: string | null }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 260 140" className="ra-rsvp-postmark" aria-hidden="true">
      <defs>
        <path id={`pm-top-${id}`} d="M 68 70 a 44 44 0 1 1 88 0" fill="none" />
        <path id={`pm-bot-${id}`} d="M 62 70 a 50 50 0 0 0 100 0" fill="none" />
      </defs>
      <circle cx="112" cy="70" r="62" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="112" cy="70" r="36" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text className="ra-rsvp-postmark-ring">
        <textPath href={`#pm-top-${id}`} startOffset="50%" textAnchor="middle">
          {names.toUpperCase()}
        </textPath>
      </text>
      {date && (
        <text className="ra-rsvp-postmark-ring">
          <textPath href={`#pm-bot-${id}`} startOffset="50%" textAnchor="middle">
            {date}
          </textPath>
        </text>
      )}
      <text x="112" y="78" textAnchor="middle" className="ra-rsvp-postmark-sent">
        SENT
      </text>
      {[52, 70, 88].map((y) => (
        <path
          key={y}
          d={`M 180 ${y} q 10 -8 20 0 t 20 0 t 20 0`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

// RSVP, as a reply postcard in the design's airmail language: cream card in
// an airmail-striped frame, a "message" side (an optional note for the
// couple) and an "address" side (name, two perforated stamps to accept or
// decline, a postmark-style guest counter). Saves through the same
// submitRsvp server action as every other template, plus the note, which the
// action and the host's dashboard already support.
const MAX_GUESTS = 10; // the server's own limit (app/i/[slug]/actions.ts)

function RetroRsvp({ invite, date }: { invite: Invite; date: string | null }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      message: message.trim() || null,
    });
    setLoading(false);
    if (insertError) {
      setError("Something went wrong — please try again.");
      return;
    }
    setSubmitted(true);
  }

  const firstName = name.trim().split(/\s+/)[0] || "friend";
  const waMessage = encodeURIComponent(
    `Hi! It's ${name.trim() || "Friend"} — ${
      attending === "yes"
        ? `we are beyond excited and wouldn't miss it for the world! We'll be there${guestCount > 1 ? ` with ${guestCount} of us` : ""}.`
        : "I'm so sorry we won't be able to make it this time. Sending all our love on your special day."
    }`
  );
  const waLink = invite.whatsapp_number ? `https://wa.me/${invite.whatsapp_number}?text=${waMessage}` : null;

  return (
    <section id="rsvp" className="ra-rsvp">
      <Rv kind="rise" className="ra-rsvp-card">
        <header className="ra-rsvp-head">
          <div className="ra-rsvp-arc">
            <ArcText width={222.74} height={64.87} d="M 6 62 A 170 170 0 0 1 216.74 62" className="ra-arc ra-arc-std">
              R.S.V.P.
            </ArcText>
          </div>
          <h2 className="ra-rsvp-title">Kindly reply</h2>
        </header>

        {submitted ? (
          <div className="ra-rsvp-done" role="status">
            <Postmark names={invite.host_names} date={date} />
            <p className="ra-rsvp-done-script">{attending === "yes" ? `Yay, ${firstName}!` : `We'll miss you, ${firstName}.`}</p>
            <p className="ra-rsvp-done-text">
              {attending === "yes" ? "We can't wait to celebrate with you." : "Thank you for letting us know."}
            </p>
            {waLink && (
              <WhatsappConfirmLink href={waLink} demo={invite.is_demo} className="ra-rsvp-send">
                Confirm on WhatsApp too
              </WhatsappConfirmLink>
            )}
          </div>
        ) : (
          <form className="ra-rsvp-form" onSubmit={handleSubmit}>
            <div className="ra-rsvp-side ra-rsvp-message">
              <p className="ra-rsvp-lead">We&rsquo;d love to know if you can make it.</p>
              <label className="ra-rsvp-label" htmlFor="ra-rsvp-note">
                A note for the couple <span>(optional)</span>
              </label>
              <textarea
                id="ra-rsvp-note"
                className="ra-rsvp-note"
                rows={5}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="ra-rsvp-divider" aria-hidden="true" />

            <div className="ra-rsvp-side ra-rsvp-address">
              <p className="ra-rsvp-airmail" aria-hidden="true">
                Par avion · By air mail
              </p>
              <label className="ra-rsvp-label" htmlFor="ra-rsvp-name">
                Your name
              </label>
              <input
                id="ra-rsvp-name"
                className="ra-rsvp-name"
                required
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <fieldset className="ra-rsvp-stamps">
                <legend className="ra-rsvp-label">Will you be there?</legend>
                <Rv kind="fade" delay={200} className="ra-rsvp-stamp-row">
                  {(
                    [
                      ["yes", "Joyfully accepts"],
                      ["no", "Regretfully declines"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`ra-rsvp-stamp${attending === value ? " on" : ""}`}
                      aria-pressed={attending === value}
                      onClick={() => setAttending(value)}
                    >
                      <span>{label}</span>
                    </button>
                  ))}
                </Rv>
              </fieldset>

              {attending === "yes" && (
                <div className="ra-rsvp-count">
                  <span className="ra-rsvp-label" id="ra-rsvp-count-label">
                    Guests, you included
                  </span>
                  <div className="ra-rsvp-counter" role="group" aria-labelledby="ra-rsvp-count-label">
                    <button
                      type="button"
                      className="ra-rsvp-step"
                      aria-label="One guest fewer"
                      disabled={guestCount <= 1}
                      onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                    >
                      −
                    </button>
                    <output className="ra-rsvp-count-value" aria-live="polite">
                      <span className="ra-rsvp-count-num">{guestCount}</span>
                      <span className="ra-rsvp-count-word">{guestCount === 1 ? "guest" : "guests"}</span>
                    </output>
                    <button
                      type="button"
                      className="ra-rsvp-step"
                      aria-label="One guest more"
                      disabled={guestCount >= MAX_GUESTS}
                      onClick={() => setGuestCount((c) => Math.min(MAX_GUESTS, c + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="ra-rsvp-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="ra-rsvp-send" disabled={loading}>
                {loading ? "Sending…" : "Send by airmail"}
              </button>
            </div>
          </form>
        )}
      </Rv>
    </section>
  );
}

export default function WeddingRetroAirmail({ invite }: { invite: Invite }) {
  const hydrated = useHydrated();
  const names = invite.host_names;
  const date = shortDate(invite.event_date);
  // The names were set for "Jad & Mariana" (13 characters): longer names shrink
  // to stay inside the ticket instead of running off it. (Source size 133.33;
  // Sacramento runs ~10% wider than Adventures Unlimited, hence 120.)
  const nameScale = Math.min(1, 13 / Math.max(names.length, 1));

  return (
    <div className={`ra${hydrated ? " ra-js" : ""}`}>
      <style>{CSS}</style>

      {/* ---------- Hero: envelope with photo 1, disco balls ---------- */}
      <section className="ra-sec" style={{ height: u(768) }}>
        <div className="ra-canvas">
          <div className="ra-abs ra-disco ra-disco-small" style={box(914.34, -26.9, 228.05)}>
            <img src={`${A}/disco-ball.webp`} alt="" />
          </div>
          <Rv kind="rise" className="ra-abs" style={box(272.84, 158.41, 820.33, 451.18)}>
            <img src={`${A}/envelope.webp`} alt="" className="ra-fill" />
            <div className="ra-frame" style={box(310.06, 89.06, 356.56, 237.11)}>
              <Photo url={invite.photo_urls?.[0]} alt={names} />
            </div>
          </Rv>
          <div className="ra-abs ra-disco ra-disco-big" style={box(1028.37, -26.9, 456)}>
            <img src={`${A}/disco-ball.webp`} alt="" />
          </div>
        </div>
      </section>

      {/* ---------- Main ---------- */}
      <section className="ra-sec ra-sec-main">
        {/* The details sunburst, behind everything: full screen width (see .ra-burst). */}
        <Rv kind="fade" className="ra-burst">
          <img src={`${A}/details.webp`} alt="" />
        </Rv>

        <div className="ra-canvas">
          {/* Stripes and rays, then the stamp ticket and the small disco ball. */}
          <Rv kind="fade" className="ra-abs" style={box(0, 47.46, 1384.96, 1425.18)}>
            <Rays />
            <img src={`${A}/stamp.webp`} alt="" className="ra-fill" />
          </Rv>

          <Rv kind="fade" delay={250} className="ra-abs ra-small-text" style={box(650.27, 319.87, 222.74, 64.87, 22.82)}>
            <ArcText width={222.74} height={64.87} d="M 6 62 A 170 170 0 0 1 216.74 62" className="ra-arc ra-arc-std">
              Save the date
            </ArcText>
          </Rv>
          <Rv kind="fade" delay={400} className="ra-abs ra-center" style={box(375.74, 398.73, 671.58, 159.33, 19.16)}>
            <h1 className="ra-names" style={{ fontSize: u(120 * nameScale) }}>
              {names}
            </h1>
          </Rv>
          <Rv kind="fade" delay={550} className="ra-abs ra-center" style={box(338.56, 665.58, 567.75, 79.67, 20.62)}>
            <p className="ra-date">{date ?? "Date coming soon"}</p>
          </Rv>

          {/* The two hands, closing in on each other as the page scrolls. */}
          <ScrollHands />

          {/* Photo 2, where the source had its demo couple's cut-out. */}
          <Rv kind="rise" className="ra-abs ra-frame ra-frame-tilt" style={box(96, 1786, 430, 538)}>
            <Photo url={invite.photo_urls?.[1]} alt={names} mono />
          </Rv>

          {/* The airmail letter and its message. */}
          <Rv kind="rise" className="ra-abs" style={box(547.46, 1702.8, 1145.62, 788.6)}>
            <img src={`${A}/letter.webp`} alt="" className="ra-fill" />
          </Rv>
          <Rv kind="fade" delay={200} className="ra-abs ra-center" style={box(683, 1826.09, 609.92, 55.67)}>
            <p className="ra-love">We love you so much,</p>
          </Rv>
          <Rv kind="fade" delay={350} className="ra-abs" style={box(592.06, 1945.85, 791.79, 358.67)}>
            <LetterTyping />
          </Rv>

          {/* The details: white bordered box, WHEN / WHERE. */}
          <Rv kind="rise" delay={150} className="ra-abs ra-details-box" style={box(200.84, 2796.39, 964.31, 981.77)}>
            {/* The source's own title artwork (Roca One lettering and its red
                shadow, from the owner's export): fixed text, so it's the exact
                piece rather than a stand-in font. */}
            <h2 className="ra-abs ra-title" style={box(87.74, 108.41, 792.8, 204.95)}>
              <img src={`${A}/details-title.webp`} alt="The details" className="ra-fill" />
            </h2>
            <p className="ra-abs ra-label" style={box(167.36, 435.22, 145.78)}>
              WHEN
            </p>
            <p className="ra-abs ra-label" style={box(591.56, 435.22, 219.49)}>
              WHERE
            </p>
            <div className="ra-abs ra-divider" style={box(491.64, 435.22, 2, 329.68)} />
            <div className="ra-abs ra-detail" style={box(80.84, 545.82, 318.81)}>
              <p>{date ?? "Date coming soon"}</p>
              {date && (
                <p>
                  <SaveTheDate invite={invite} triggerClassName="ra-link" triggerLabel="Save the date on your calendar" />
                </p>
              )}
            </div>
            <div className="ra-abs ra-detail" style={box(583.82, 542.09, 234.98)}>
              <p>{invite.venue_name ?? "Venue coming soon"}</p>
              {invite.venue_map_url && (
                <p>
                  <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="ra-link">
                    View map
                  </a>
                </p>
              )}
            </div>
          </Rv>
        </div>
      </section>

      <RetroRsvp invite={invite} date={date} />
    </div>
  );
}

const CSS = `
.ra {
  container-type: inline-size;
  background: #ffffff; color: #566e99; overflow-x: hidden;
  /* The calendar menu (SaveTheDate) in this palette. */
  --std-paper: #fffaf0; --std-accent: #fdf4d4; --std-ink: #2d53c8;
  --std-script: 'Sacramento', cursive; --std-sans: 'Hanken Grotesk', sans-serif;
}
/* One canvas unit: the source canvas is 1366 wide, scaled to the page
   (never wider than 1055px — the Canva site's own maximum, where it
   scales its 1366-unit canvas by 0.7723). cqw = the page width without the scrollbar. */
/* The section spans the whole screen and clips there; the canvas inside it is
   centred and doesn't clip, so artwork that runs past the canvas in the design
   (letter, disco ball, stripes) carries on to the screen edges. */
.ra-sec { --ra-u: calc(min(100cqw, 1055px) / 1366); position: relative; width: 100%; overflow: hidden; }
.ra-canvas { position: relative; width: calc(var(--ra-u) * 1366); height: 100%; margin: 0 auto; }
.ra-rays { overflow: visible; }
/* The details sunburst (source box: left -31.84, top 2538.39, 1448.63 wide;
   its hub at 49.93% / 52.06% of the image, behind the white box). It's at
   least as wide as the screen, grown around its hub (a burst looks the same
   at any size around its centre), and clipped at its original top line so it
   never reaches into the letter above. */
.ra-burst { position: absolute; left: 0; right: 0; top: calc(var(--ra-u) * 2538.39); bottom: 0; overflow: hidden; }
.ra-burst img {
  --bw: max(calc(var(--ra-u) * 1448.63), calc(100cqw * 1.004 + var(--ra-u) * 24));
  position: absolute; display: block; width: var(--bw); max-width: none; height: auto;
  left: calc(50% + var(--ra-u) * 8.47 - var(--bw) * 0.4993);
  top: calc(var(--ra-u) * 811.47 - var(--bw) * 0.5602);
}
.ra-abs { position: absolute; }
.ra-fill { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.ra-center { display: flex; align-items: center; justify-content: center; }
.ra p, .ra h1 { margin: 0; }

/* Disco balls, hanging from the top edge and swaying very slightly. */
.ra-disco img { width: 100%; display: block; transform-origin: 50% 0; animation: ra-sway 7s ease-in-out infinite; }
.ra-disco-big img { animation-duration: 8.5s; animation-delay: -2s; }
@keyframes ra-sway { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }

/* Photo frames: rounded, with the source's thin red border. */
.ra-frame { position: absolute; overflow: hidden; border-radius: calc(var(--ra-u) * 12); border: calc(var(--ra-u) * 2.6) solid #c44d48; background: #f3efe6; }
.ra-frame-tilt { border: 0; box-shadow: none; transform: rotate(-3deg); }
.ra-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ra-mono { filter: grayscale(1) contrast(1.05); }
.ra-photo-empty {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-family: 'Hanken Grotesk', sans-serif; font-size: max(calc(var(--ra-u) * 20), 10px); color: rgba(86, 110, 153, 0.55);
  background: repeating-linear-gradient(-45deg, #fdf4d4 0 calc(var(--ra-u) * 14), #f6ecc6 0 calc(var(--ra-u) * 28));
}

/* Type */
.ra-arc { width: 100%; height: 100%; overflow: visible; display: block; }
.ra-arc-std text { font-family: 'Hanken Grotesk', sans-serif; font-size: 25.73px; letter-spacing: 0.217em; fill: #566e99; }
.ra-title { margin: 0; }
.ra-names { font-family: 'Sacramento', cursive; font-weight: 400; color: #566e99; white-space: nowrap; line-height: 1.4; text-align: center; }
.ra-date { font-family: 'Sacramento', cursive; font-size: calc(var(--ra-u) * 66.67); letter-spacing: 0.182em; color: #566e99; white-space: nowrap; line-height: 1.4; }
.ra-love { font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: calc(var(--ra-u) * 46.67); text-transform: uppercase; letter-spacing: 0.04em; color: #566e99; white-space: nowrap; line-height: 1.4; }
.ra-letter-text { font-family: 'Sacramento', cursive; font-size: calc(var(--ra-u) * 66.67); line-height: 1.395; text-align: center; color: #566e99; }
.ra-letter-text > span { display: block; white-space: nowrap; }
.ra-untyped { visibility: hidden; }
/* Typing caret: takes no width (negative margin), so nothing shifts as it moves. */
.ra-caret {
  display: inline-block; width: 2px; height: 0.8em; margin-right: -2px; vertical-align: -0.05em;
  background: currentColor; animation: ra-blink 0.9s step-end infinite;
}
@keyframes ra-blink { 50% { opacity: 0; } }

.ra-details-box { background: #ffffff; border: calc(var(--ra-u) * 2) solid #000; box-sizing: border-box; transform-origin: 50% 0; }
.ra-sec-main { height: calc(var(--ra-u) * 4006); }
/* Beyond phones, the details box at full canvas size dominates the screen:
   it's drawn at 80% from its top edge, and the section ends sooner by the
   same amount (981.77 x 0.2 = 196 units), keeping the source's padding
   below it. Phones keep it full size, where its text is already small. */
@media (min-width: 641px) {
  .ra-details-box { scale: 0.8; }
  .ra-sec-main { height: calc(var(--ra-u) * 3810); }
}
.ra-label { font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: calc(var(--ra-u) * 46.67); letter-spacing: 0.02em; color: #000; text-align: center; line-height: 1.4; }
.ra-divider { background: #000; }
.ra-detail { font-family: 'Hanken Grotesk', sans-serif; font-size: max(calc(var(--ra-u) * 24), 10.5px); line-height: 1.4; color: #000; text-align: center; }
.ra-link {
  font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer;
  text-decoration: underline; text-underline-offset: 0.18em; text-decoration-thickness: 1px;
}
.ra-link:hover { color: #2d53c8; }
/* The menu opens upwards and centred: below the link it would run past the
   bottom of the section (which clips) on phones. */
.ra-detail .std-menu { top: auto; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); animation: none; text-align: center; }

/* On phones the canvas is ~375px wide, so the tiniest text gets a floor and
   the small arched "Save the date" is drawn a little larger around its centre. */
@media (max-width: 640px) {
  .ra-small-text svg { transform: scale(1.45); }
}

/* ---------- RSVP: a reply postcard ---------- */
.ra-rsvp { padding: clamp(64px, 9vw, 120px) 16px clamp(72px, 10vw, 130px); background: #ffffff; }
.ra-rsvp-card {
  position: relative; max-width: 860px; margin: 0 auto; box-sizing: border-box;
  padding: clamp(28px, 5vw, 52px) clamp(20px, 4.5vw, 52px);
  /* cream card inside the letter's red/blue diagonal airmail stripes */
  border: 12px solid transparent;
  background:
    linear-gradient(#fdf4d4, #fdf4d4) padding-box,
    repeating-linear-gradient(-45deg, #c44d48 0 16px, #fffdf6 16px 24px, #566e99 24px 40px, #fffdf6 40px 48px) border-box;
  box-shadow: 0 18px 40px rgba(30, 40, 70, 0.10);
  color: #566e99;
}
.ra-rsvp-head { text-align: center; margin-bottom: clamp(20px, 4vw, 36px); }
.ra-rsvp-arc { width: clamp(170px, 24vw, 230px); aspect-ratio: 222.74 / 64.87; margin: 0 auto -6px; }
.ra-rsvp-title { font-family: 'Sacramento', cursive; font-weight: 400; font-size: clamp(48px, 7vw, 76px); line-height: 1.1; color: #566e99; margin: 0; }

.ra-rsvp-form { display: grid; grid-template-columns: 1fr; gap: 28px; }
.ra-rsvp-divider { display: none; }
@media (min-width: 720px) {
  .ra-rsvp-form { grid-template-columns: 1fr 2px 1fr; gap: clamp(24px, 4vw, 44px); }
  .ra-rsvp-divider { display: block; background: repeating-linear-gradient(#566e99 0 10px, transparent 10px 18px); opacity: .45; }
}
.ra-rsvp-side { display: flex; flex-direction: column; gap: 12px; min-width: 0; }

.ra-rsvp-label { font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: #566e99; padding: 0; }
.ra-rsvp-label span { font-weight: 400; letter-spacing: 0.06em; text-transform: none; }
.ra-rsvp-lead { font-family: 'Sacramento', cursive; font-size: clamp(28px, 3.4vw, 34px); line-height: 1.3; color: #566e99; }

/* Postcard writing lines */
.ra-rsvp-note {
  font: 16px/32px 'Hanken Grotesk', sans-serif; color: #2d3e66; width: 100%; box-sizing: border-box;
  resize: vertical; min-height: 160px; padding: 0 2px; border: 0; border-radius: 0;
  background: transparent repeating-linear-gradient(transparent 0 31px, rgba(86, 110, 153, 0.38) 31px 32px);
}
.ra-rsvp-name {
  font: 17px/1.4 'Hanken Grotesk', sans-serif; color: #2d3e66; width: 100%; box-sizing: border-box;
  padding: 8px 2px; min-height: 44px; border: 0; border-bottom: 1.5px solid rgba(86, 110, 153, 0.6); border-radius: 0; background: transparent;
}
.ra-rsvp-note:focus-visible, .ra-rsvp-name:focus-visible { outline: 2px solid #566e99; outline-offset: 4px; }

/* "Par avion" label, like the blue airmail sticker */
.ra-rsvp-airmail {
  align-self: flex-end; margin-bottom: 6px; padding: 6px 12px; border: 1.5px solid #566e99; border-radius: 3px;
  font-family: 'Hanken Grotesk', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #566e99;
}

/* Perforated stamps: the edge holes are a mask, like the ticket's perforation */
.ra-rsvp-stamps { border: 0; margin: 10px 0 0; padding: 0; min-width: 0; }
.ra-rsvp-stamps legend { margin-bottom: 12px; }
.ra-rsvp-stamp-row { display: flex; gap: 14px; }
.ra-rsvp-stamp {
  --r: 4px; flex: 1; min-height: 92px; padding: calc(2.4 * var(--r)); border: 0; cursor: pointer;
  background: #fffdf6; font: inherit;
  -webkit-mask: radial-gradient(var(--r), #0000 97%, #000) round calc(-1.5 * var(--r)) calc(-1.5 * var(--r)) / calc(3 * var(--r)) calc(3 * var(--r)), linear-gradient(#000 0 0) no-repeat 50% / calc(100% - 3 * var(--r)) calc(100% - 3 * var(--r));
          mask: radial-gradient(var(--r), #0000 97%, #000) round calc(-1.5 * var(--r)) calc(-1.5 * var(--r)) / calc(3 * var(--r)) calc(3 * var(--r)), linear-gradient(#000 0 0) no-repeat 50% / calc(100% - 3 * var(--r)) calc(100% - 3 * var(--r));
  filter: drop-shadow(0 4px 8px rgba(30, 40, 70, 0.10));
  transform: rotate(-2deg); opacity: 0.62;
  transition: transform .25s cubic-bezier(.22, 1, .36, 1), opacity .25s ease;
}
.ra-rsvp-stamp + .ra-rsvp-stamp { transform: rotate(2deg); }
.ra-rsvp-stamp span {
  display: flex; align-items: center; justify-content: center; height: 100%; min-height: 72px; padding: 8px; box-sizing: border-box;
  border: 1.5px solid #566e99; font-family: 'Sacramento', cursive; font-size: 26px; line-height: 1.1; color: #566e99; text-align: center;
}
.ra-rsvp-stamp.on { opacity: 1; transform: none; }
.ra-rsvp-stamp.on span { background: #566e99; border-color: #566e99; color: #fdf4d4; }
.ra-rsvp-stamp:active { transform: scale(0.97); }
.ra-rsvp-stamp:focus-visible { outline: none; }
.ra-rsvp-stamp:focus-visible span { outline: 2px solid #c44d48; outline-offset: -6px; }
@media (hover: hover) and (pointer: fine) { .ra-rsvp-stamp:not(.on):hover { opacity: 0.85; } }

/* Guest counter: one flat label in the "Par avion" style — square − and +
   either side of the count, split by the dashed rules of the postcard. */
.ra-rsvp-count { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.ra-rsvp-counter {
  display: inline-flex; align-self: flex-start; align-items: stretch; height: 52px;
  border: 1.5px solid #566e99; border-radius: 4px; background: #fffdf6; color: #566e99;
}
.ra-rsvp-step {
  width: 52px; border: 0; background: transparent; color: #566e99; padding: 0;
  font: 400 22px/1 'Hanken Grotesk', sans-serif; cursor: pointer; transition: background .15s ease;
}
.ra-rsvp-step:first-child { border-radius: 3px 0 0 3px; }
.ra-rsvp-step:last-child { border-radius: 0 3px 3px 0; }
.ra-rsvp-step:active:not(:disabled) { background: #fdf4d4; }
.ra-rsvp-step:disabled { opacity: 0.3; cursor: default; }
.ra-rsvp-step:focus-visible { outline: 2px solid #566e99; outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) { .ra-rsvp-step:not(:disabled):hover { background: #fdf4d4; } }
/* "1 GUEST" as one label: the number shares the word's font, size and
   tracking (digits are cap height, so they match the capitals). Centred in a
   fixed-width cell that fills the box's height, so the dashed rules run edge
   to edge and nothing moves between 1, 9 and 10 or guest and guests. The
   word's last-letter tracking is cancelled so the visible text is centred;
   text-box trims the lines to the capitals so they sit at the true middle.
   The 1.2px right padding is an optical nudge: Hanken's digits carry their
   own space on the left, which otherwise sits the label ~0.6px right of
   centre (measured for 1, 9 and 10). */
.ra-rsvp-count-value {
  display: flex; align-items: center; justify-content: center; gap: 0.45em; width: 150px; box-sizing: border-box; align-self: stretch; padding-right: 1.2px;
  border-left: 1.5px dashed rgba(86, 110, 153, 0.55); border-right: 1.5px dashed rgba(86, 110, 153, 0.55);
  font: 700 15px/1 'Hanken Grotesk', sans-serif; letter-spacing: 0.14em; text-transform: uppercase; color: #566e99;
}
.ra-rsvp-count-num, .ra-rsvp-count-word { text-box: trim-both cap alphabetic; }
.ra-rsvp-count-num { font-variant-numeric: tabular-nums lining-nums; }
.ra-rsvp-count-word { margin-right: -0.14em; }

.ra-rsvp-error { font: 600 14px 'Hanken Grotesk', sans-serif; color: #c44d48; }
.ra-rsvp-send {
  align-self: stretch; margin-top: 10px; min-height: 52px; padding: 12px 26px; cursor: pointer; text-decoration: none; text-align: center;
  font: 700 14px 'Hanken Grotesk', sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: #fdf4d4;
  display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;
  border: 3px solid transparent; border-radius: 999px;
  background:
    linear-gradient(#566e99, #566e99) padding-box,
    repeating-linear-gradient(-45deg, #c44d48 0 6px, #fffdf6 6px 9px, #566e99 9px 15px, #fffdf6 15px 18px) border-box;
  transition: transform .15s ease, filter .15s ease;
}
.ra-rsvp-send:active:not(:disabled) { transform: scale(0.97); }
.ra-rsvp-send:disabled { filter: saturate(0.6) brightness(1.1); cursor: default; }
.ra-rsvp-send:focus-visible { outline: 2px solid #566e99; outline-offset: 4px; }
@media (hover: hover) and (pointer: fine) { .ra-rsvp-send:not(:disabled):hover { filter: brightness(1.08); } }

/* Sent: the postmark lands on the card */
.ra-rsvp-done { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 8px 0 4px; }
.ra-rsvp-postmark {
  width: min(300px, 80%); color: #566e99; opacity: 0.85; transform: rotate(-10deg);
  animation: ra-postmark .55s cubic-bezier(.2, .9, .3, 1.2) both;
}
.ra-rsvp-postmark-ring { font: 700 11px 'Hanken Grotesk', sans-serif; letter-spacing: 0.16em; fill: currentColor; }
.ra-rsvp-postmark-sent { font: 900 22px 'Hanken Grotesk', sans-serif; letter-spacing: 0.12em; fill: currentColor; }
@keyframes ra-postmark { from { opacity: 0; transform: rotate(-4deg) scale(1.5); } to { opacity: 0.85; transform: rotate(-10deg) scale(1); } }
.ra-rsvp-done-script { font-family: 'Sacramento', cursive; font-size: clamp(40px, 6vw, 60px); line-height: 1.2; color: #566e99; }
.ra-rsvp-done-text { font: 17px/1.5 'Hanken Grotesk', sans-serif; color: #2d3e66; margin-bottom: 8px; }
.ra-rsvp-done .ra-rsvp-send { align-self: center; }

/* Scroll reveals (transform + opacity only). */
.ra-js .ra-rv { transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform .9s cubic-bezier(.22, 1, .36, 1); }
.ra-js .ra-rv:not(.in) { opacity: 0; }
.ra-js .ra-rv-rise:not(.in) { translate: 0 calc(var(--ra-u) * 40); }
.ra-js .ra-rv { transition-property: opacity, translate; }

/* Scroll-linked hands, in canvas units. At 0 each is pushed 460 out toward its
   own side of the design position; at 1 the index fingertips touch, in front
   of the disco ball. The tips (measured from the images) sit at 462.8,1452.4
   (left) and 904.5,1382.0 (right) in the design; they meet halfway, 6 apart
   so the hands' white outlines overlap: left +217.85 / -35.2, right mirrored.
   1 is also the default before the script runs, and with reduced motion. */
.ra-hands { --ra-hands: 1; position: absolute; inset: 0; pointer-events: none; }
.ra-hand-left, .ra-hand-right { will-change: translate; }
.ra-hand-left { translate: calc(var(--ra-u) * (-460 + 677.85 * var(--ra-hands))) calc(var(--ra-u) * -35.2 * var(--ra-hands)); }
.ra-hand-right { translate: calc(var(--ra-u) * (460 - 677.85 * var(--ra-hands))) calc(var(--ra-u) * 35.2 * var(--ra-hands)); }

@keyframes ra-postmark-fade { from { opacity: 0; } to { opacity: 0.85; } }
@media (prefers-reduced-motion: reduce) {
  .ra-disco img { animation: none; }
  .ra-rsvp-postmark { animation: ra-postmark-fade .4s ease both; }
  .ra-rsvp-stamp, .ra-rsvp-stamp + .ra-rsvp-stamp { transition: opacity .25s ease; }
  .ra-js .ra-rv:not(.in) { translate: none; }
  .ra-js .ra-rv { transition: opacity .6s ease; }
}
`;
