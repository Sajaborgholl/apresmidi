"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Invite } from "@/lib/types";

// Birthday Cream & Pink — ported from the approved static mockup
// (template-birthday-cream-pink-prototype.html): recreates a Canva
// "Birthday Event Website in Cream and Pink Illustrative Style" design.
// The prototype's hardcoded "Rebecca"/"Becca" copy and its client-only
// fake RSVP form are replaced with real invite data and a real Supabase
// insert, matching every other template's data-binding + RSVP pattern
// (see BirthdayDisco.tsx). The prototype's age-specific framing ("Rebecca
// Turns 7") is dropped entirely — same reasoning as BirthdayDisco's own
// age removal note: there's no `age` field on Invite, so the hero now
// reads "{name}'s Birthday" instead.
//
// Two decorative shapes are exact cropped PNG assets (not hand-built
// CSS/SVG), because the customer explicitly asked for pixel-identical
// shapes from the reference design during prototyping:
// public/templates/birthday-cream-pink/what-to-expect-badge.png (the
// ticket ribbon) and name-ribbon-badge.png (the wavy ribbon behind the
// host's first name). Both are this template's fixed design, same on
// every invite — only the name text overlaid on the ribbon changes, from
// invite.host_names.
//
// Everything else (photo frames, star/outline badges, sparkle corners,
// icons) is plain CSS: clip-path polygons for the starburst/scalloped
// shapes, an organic border-radius blob for the portrait frames — same
// "no CSS-in-JS library, just a template literal" approach every other
// template in this folder uses.

function firstName(hostNames: string): string {
  return hostNames.split(/[\s&]+/)[0] || hostNames;
}

// Scroll-reveal wrapper: fades + slides content up once it scrolls
// ~20% into view, then disconnects — a one-time reveal, not something
// that re-hides as you scroll back up past it. Same IntersectionObserver
// idiom as TypewriterText.tsx (the only other scroll-triggered animation
// in this codebase), generalized here to wrap any block instead of
// typing out text one character at a time. `delay` lets sibling
// Reveals stagger instead of all fading in at once.
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
      className={`cp-reveal${visible ? " visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

// A customer's own uploaded photo, or a soft placeholder card before
// they've added one — same role as every other template's PhotoSlot,
// just shaped to fit this template's organic/circle frames (the frame
// itself supplies the border-radius via `border-radius: inherit`).
function PhotoSlot({ url, alt }: { url: string | undefined; alt: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} />
  ) : (
    <span className="cp-photo-placeholder">Photo coming soon</span>
  );
}

export default function BirthdayCreamPink({ invite }: { invite: Invite }) {
  const name = firstName(invite.host_names);

  const [guestName, setGuestName] = useState("");
  const [attending, setAttending] = useState<"accept" | "decline">("accept");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eventDate = invite.event_date ? new Date(invite.event_date) : null;
  const dateFormatted = eventDate
    ? eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;
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

  function scrollToNext() {
    document.getElementById("cp-when-where")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <style>{CSS}</style>

      {/* ============ HOME / HERO ============ */}
      <section className="cp-section" id="cp-hero">
        <div className="cp-inner cp-hero-flex">
          <Reveal className="cp-hero-photo-wrap">
            <div className="cp-photo-frame">
              <div className="cp-frame-inner">
                <PhotoSlot url={invite.photo_urls?.[0]} alt={invite.host_names} />
              </div>
            </div>
          </Reveal>

          <Reveal className="cp-hero-copy-wrap" delay={100}>
            <div className="cp-circle-badge">You&apos;re<br />Invited</div>
            <div className="cp-outline-badge">
              <span className="cp-spark cp-tl">✦</span>
              <span className="cp-spark cp-br">✦</span>
              <p className="cp-badge-text">{name}&apos;s<br />Birthday</p>
            </div>
            <button type="button" className="cp-seal-btn" aria-label="Scroll to when &amp; where" onClick={scrollToNext}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v16M6 14l6 6 6-6" />
              </svg>
            </button>
          </Reveal>
        </div>
      </section>

      {/* ============ WHEN & WHERE ============ */}
      <section className="cp-section" id="cp-when-where">
        <div className="cp-inner cp-ww-flex">
          <Reveal className="cp-ww-copy">
            <div className="cp-star-badge">
              <p className="cp-badge-text">When &amp;<br />Where</p>
            </div>
            <p className="cp-ww-details">
              <span className="cp-ww-date">
                {dateFormatted ?? "Date coming soon"}
                {timeFormatted ? `, ${timeFormatted}` : ""}
              </span>
              <br />
              <br />
              <span className="cp-ww-place">{invite.venue_name ?? "Venue coming soon"}</span>
              {invite.venue_map_url && (
                <>
                  <br />
                  <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="cp-ww-map-link">
                    View map
                  </a>
                </>
              )}
            </p>
          </Reveal>

          <Reveal className="cp-ww-photo-wrap" delay={100}>
            <div className="cp-photo-frame">
              <div className="cp-frame-inner">
                <PhotoSlot url={invite.photo_urls?.[1]} alt={invite.host_names} />
              </div>
            </div>
            <div className="cp-pennant-tag">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/templates/birthday-cream-pink/name-ribbon-badge.png" alt="" aria-hidden="true" />
              <span className="cp-pennant-label">{name.toUpperCase()}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ DETAILS ============ */}
      <section className="cp-section" id="cp-details">
        <div className="cp-inner">
          <Reveal className="cp-details-heading-wrap">
            <div className="cp-outline-badge">
              <span className="cp-spark cp-tl">✦</span>
              <span className="cp-spark cp-tr">✦</span>
              <span className="cp-spark cp-bl">✦</span>
              <span className="cp-spark cp-br">✦</span>
              <p className="cp-badge-text">Celebrate<br />with {name}</p>
            </div>
          </Reveal>

          <div className="cp-details-grid">
            <Reveal className="cp-details-card">
              <div className="cp-details-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20.5s-7.2-4.4-9.6-8.9C.9 8.2 2.6 4.5 6 4.5c2 0 3.6 1.1 4.5 2.7.9-1.6 2.5-2.7 4.5-2.7 3.4 0 5.1 3.7 3.6 7.1-2.4 4.5-9.6 8.9-9.6 8.9z" />
                </svg>
              </div>
              <h3>{name}&apos;s Wishlist</h3>
              <p>Ask {name} for ideas</p>
            </Reveal>

            <Reveal className="cp-details-card" delay={80}>
              <div className="cp-details-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3.2a1.8 1.8 0 1 1-1.8 1.8" />
                  <path d="M12 5v2.2" />
                  <path d="M2.5 20l8-6.4a2.3 2.3 0 0 1 3 0l8 6.4" />
                </svg>
              </div>
              <h3>Outfit Suggestions</h3>
              <p>Wear something comfortable — it&apos;s going to be an afternoon of games and prizes!</p>
            </Reveal>

            <Reveal className="cp-details-card" delay={160}>
              <div className="cp-details-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3.2 19 20H5L12 3.2z" />
                  <circle cx="12" cy="3.2" r="1.2" fill="currentColor" stroke="none" />
                  <path d="M8.2 14.5h7.6M9.4 17.3h5.2" />
                </svg>
              </div>
              <h3>Party Theme</h3>
              <p>It&apos;s a Pink and White party — {name}&apos;s favorite colors!</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ WHAT TO EXPECT ============ */}
      <section className="cp-section" id="cp-expect">
        <div className="cp-inner">
          <Reveal className="cp-expect-heading-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cp-ribbon-badge-img" src="/templates/birthday-cream-pink/what-to-expect-badge.png" alt="What to Expect" />
          </Reveal>

          <div className="cp-expect-grid">
            <Reveal className="cp-expect-card">
              <div className="cp-circle-frame">
                <div className="cp-frame-inner">
                  <PhotoSlot url={invite.photo_urls?.[2]} alt="Snacks" />
                </div>
              </div>
              <h3>Afternoon Snacks<br />and Early Dinner</h3>
            </Reveal>

            <Reveal className="cp-expect-card" delay={80}>
              <div className="cp-circle-frame">
                <div className="cp-frame-inner">
                  <PhotoSlot url={invite.photo_urls?.[3]} alt="Garden games" />
                </div>
              </div>
              <h3>Garden Games<br />and Fun Prizes</h3>
            </Reveal>

            <Reveal className="cp-expect-card" delay={160}>
              <div className="cp-circle-frame">
                <div className="cp-frame-inner">
                  <PhotoSlot url={invite.photo_urls?.[4]} alt="Dancing" />
                </div>
              </div>
              <h3>Lots of Dancing<br />and Singing</h3>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ CONTACT / RSVP ============ */}
      <section className="cp-section" id="cp-contact">
        <div className="cp-inner cp-contact-flex">
          <Reveal className="cp-contact-left">
            <div className="cp-star-badge cp-small">
              <p className="cp-badge-text">Count<br />you in?</p>
            </div>
            <div className="cp-photo-frame">
              <div className="cp-frame-inner">
                <PhotoSlot url={invite.photo_urls?.[5]} alt={invite.host_names} />
              </div>
            </div>
          </Reveal>

          <Reveal className="cp-contact-right" delay={100}>
            <h3 className="cp-rsvp-heading">RSVP</h3>
            <p className="cp-rsvp-sub">Let us know if you&apos;ll be celebrating with {name}!</p>

            {!submitted ? (
              <form className="cp-rsvp-form" onSubmit={handleSubmit}>
                <label className="cp-rsvp-field">
                  <span>Guest Name</span>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </label>

                <div className="cp-rsvp-attend-row" role="group" aria-label="Attending">
                  <button
                    type="button"
                    className={`cp-rsvp-attend-btn ${attending === "accept" ? "active" : ""}`}
                    onClick={() => setAttending("accept")}
                  >
                    Count me in
                  </button>
                  <button
                    type="button"
                    className={`cp-rsvp-attend-btn ${attending === "decline" ? "active" : ""}`}
                    onClick={() => setAttending("decline")}
                  >
                    Can&apos;t make it
                  </button>
                </div>

                {attending === "accept" && (
                  <label className="cp-rsvp-field">
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

                {error && <p className="cp-rsvp-error">{error}</p>}

                <button type="submit" className="cp-rsvp-submit-btn" disabled={loading}>
                  {loading ? "Sending…" : "Send RSVP"}
                </button>
              </form>
            ) : (
              <div className="cp-rsvp-thanks">
                <p className="cp-rsvp-thanks-title">{attending === "accept" ? "Yay!" : "We'll miss you"}</p>
                <p className="cp-rsvp-thanks-body">
                  {attending === "accept"
                    ? `Can't wait to celebrate with you, ${guestName.trim() || "friend"}!`
                    : `Thanks for letting us know, ${guestName.trim() || "friend"}.`}
                </p>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="cp-rsvp-submit-btn cp-wa-btn">
                    Confirm on WhatsApp too
                  </a>
                )}
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}

const CSS = `
* { box-sizing: border-box; }

:root {
  --cp-cream: #f9f7ec;
  --cp-blush: #ffdede;
  --cp-pink: #fe9c9c;
  --cp-pink-deep: #cf2025;
  --cp-ink: #2b2320;
  --cp-ink-soft: #4a3f3b;
  --cp-white: #ffffff;
  --cp-font-display: 'Fraunces', serif;
  --cp-font-body: 'Quicksand', sans-serif;
  /* Strong ease-out / ease-in-out — the built-in CSS easings are too
     weak to feel intentional at these durations. */
  --cp-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --cp-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

.cp-section, .cp-section * { font-family: var(--cp-font-body); }

.cp-section {
  position: relative;
  background: var(--cp-cream);
  color: var(--cp-ink);
  padding: 90px 24px;
  overflow: hidden;
}

.cp-inner { max-width: 1040px; margin: 0 auto; position: relative; }

img { max-width: 100%; display: block; }

/* ---------- Scroll reveal ---------- */

.cp-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 700ms var(--cp-ease-out), transform 700ms var(--cp-ease-out);
}
.cp-reveal.visible { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .cp-reveal { transform: none; transition: opacity 300ms ease; }
}

/* ---------- Photo placeholder (no upload yet) ---------- */

.cp-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--cp-blush);
  color: var(--cp-ink-soft);
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
  padding: 0 12%;
}

/* ---------- Photo frame (organic super-rounded rect with a thin coral
   outline peeking from behind, bottom-right) ---------- */

.cp-photo-frame {
  position: relative;
  width: 100%;
  max-width: 300px;
}

.cp-photo-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translate(12px, 12px);
  border: 2.5px solid var(--cp-pink);
  border-radius: inherit;
  z-index: 0;
}

.cp-photo-frame .cp-frame-inner {
  position: relative;
  z-index: 1;
  aspect-ratio: 3 / 3.6;
  border-radius: inherit;
  overflow: hidden;
  border: 5px solid var(--cp-cream);
  background: var(--cp-cream);
}

.cp-photo-frame .cp-frame-inner img { border-radius: inherit; width: 100%; height: 100%; object-fit: cover; object-position: top center; }

.cp-photo-frame,
.cp-photo-frame .cp-frame-inner {
  border-radius: 46% 46% 38% 38% / 58% 58% 24% 24%;
}

/* Circle photo variant (What to Expect row) */
.cp-circle-frame {
  position: relative;
  width: 100%;
  max-width: 180px;
  margin: 0 auto;
}

.cp-circle-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translate(8px, 8px);
  border: 2.5px solid var(--cp-pink-deep);
  border-radius: 50%;
  z-index: 0;
}

.cp-circle-frame .cp-frame-inner {
  position: relative;
  z-index: 1;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--cp-cream);
  background: var(--cp-cream);
}

.cp-circle-frame .cp-frame-inner img { border-radius: 50%; width: 100%; height: 100%; object-fit: cover; }

@media (hover: hover) and (pointer: fine) {
  .cp-circle-frame { transition: transform 200ms var(--cp-ease-out); }
  .cp-expect-card:hover .cp-circle-frame { transform: scale(1.04); }
}

/* ---------- Outline badge (thin coral border, no fill, sparkle
   corners) — "{name}'s Birthday" / "Celebrate with {name}" ---------- */

.cp-outline-badge {
  position: relative;
  display: inline-block;
  border: 2.5px solid var(--cp-pink);
  border-radius: 20px;
  padding: 22px 46px;
  transform: rotate(-4deg);
}

.cp-outline-badge .cp-badge-text {
  font-family: var(--cp-font-display);
  color: var(--cp-pink);
  font-weight: 700;
  font-size: clamp(1.7rem, 3.4vw, 2.5rem);
  line-height: 1.08;
  text-align: center;
  margin: 0;
}

.cp-outline-badge .cp-spark {
  position: absolute;
  color: var(--cp-pink);
  font-size: 0.85rem;
  line-height: 1;
}

.cp-outline-badge .cp-spark.cp-tl { top: -8px; left: -8px; }
.cp-outline-badge .cp-spark.cp-tr { top: -8px; right: -8px; }
.cp-outline-badge .cp-spark.cp-bl { bottom: -8px; left: -8px; }
.cp-outline-badge .cp-spark.cp-br { bottom: -8px; right: -8px; }

/* ---------- Solid circle badge — "You're Invited" ---------- */

.cp-circle-badge {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: var(--cp-pink);
  color: var(--cp-white);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: var(--cp-font-display);
  font-weight: 700;
  font-size: 0.98rem;
  letter-spacing: 0.01em;
  line-height: 1.25;
  transform: rotate(-8deg);
  box-shadow: 0 8px 18px rgba(254, 156, 156, 0.4);
}

/* ---------- 12-point starburst badge — "When & Where" / "Count you in?" ---------- */

.cp-star-badge {
  position: relative;
  width: min(230px, 62vw);
  aspect-ratio: 1 / 1;
  background: var(--cp-pink);
  clip-path: polygon(50% 0%, 59.6% 14.3%, 75% 6.7%, 76.2% 23.8%, 93.3% 25%, 85.7% 40.4%, 100% 50%, 85.7% 59.6%, 93.3% 75%, 76.2% 76.2%, 75% 93.3%, 59.6% 85.7%, 50% 100%, 40.4% 85.7%, 25% 93.3%, 23.8% 76.2%, 6.7% 75%, 14.3% 59.6%, 0% 50%, 14.3% 40.4%, 6.7% 25%, 23.8% 23.8%, 25% 6.7%, 40.4% 14.3%);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 0 auto;
}

.cp-star-badge .cp-badge-text {
  font-family: var(--cp-font-display);
  color: var(--cp-white);
  font-weight: 700;
  font-size: clamp(1.15rem, 2vw, 1.5rem);
  line-height: 1.15;
  max-width: 78%;
}

.cp-star-badge.cp-small { width: min(150px, 45vw); }
.cp-star-badge.cp-small .cp-badge-text { font-size: 1rem; }

/* ---------- Scroll-hint seal button ---------- */

.cp-seal-btn {
  width: 62px;
  height: 62px;
  background: var(--cp-pink);
  clip-path: polygon(50% 0%, 59.6% 14.3%, 75% 6.7%, 76.2% 23.8%, 93.3% 25%, 85.7% 40.4%, 100% 50%, 85.7% 59.6%, 93.3% 75%, 76.2% 76.2%, 75% 93.3%, 59.6% 85.7%, 50% 100%, 40.4% 85.7%, 25% 93.3%, 23.8% 76.2%, 6.7% 75%, 14.3% 59.6%, 0% 50%, 14.3% 40.4%, 6.7% 25%, 23.8% 23.8%, 25% 6.7%, 40.4% 14.3%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  margin: 30px auto 0;
  animation: cp-bob 2.4s ease-in-out infinite;
}

.cp-seal-btn svg { width: 20px; height: 20px; stroke: var(--cp-white); }

@keyframes cp-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

@media (prefers-reduced-motion: reduce) {
  .cp-seal-btn { animation: none; }
}

/* ---------- "What to Expect" ticket badge — exact source asset ---------- */

.cp-ribbon-badge-img {
  width: min(420px, 78vw);
  height: auto;
  margin: 0 auto;
}

/* ---------- Name tag — exact wavy ribbon source asset ---------- */

.cp-pennant-tag {
  position: relative;
  display: inline-block;
  width: 150px;
}

.cp-pennant-tag img { width: 100%; height: auto; display: block; }

.cp-pennant-tag .cp-pennant-label {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(14deg);
  font-family: var(--cp-font-display);
  font-weight: 700;
  color: var(--cp-white);
  font-size: 0.85rem;
  letter-spacing: 0.16em;
  white-space: nowrap;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- HERO ---------- */

#cp-hero { padding-top: 60px; }

.cp-hero-flex {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 64px;
  flex-wrap: wrap;
}

.cp-hero-photo-wrap { flex: 0 1 300px; }

.cp-hero-copy-wrap { position: relative; flex: 0 1 320px; padding-top: 30px; text-align: center; }

.cp-hero-copy-wrap .cp-circle-badge { position: absolute; top: -54px; right: -18px; z-index: 2; }

/* ---------- WHEN & WHERE ---------- */

.cp-ww-flex {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 64px;
  flex-wrap: wrap-reverse;
}

.cp-ww-copy { flex: 1 1 320px; max-width: 360px; text-align: center; }

.cp-ww-details {
  margin: 30px 0 0;
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.75;
  color: var(--cp-pink);
}

.cp-ww-details .cp-ww-place { color: var(--cp-pink); font-weight: 600; }

.cp-ww-map-link {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--cp-ink);
  text-decoration: underline;
}

.cp-ww-photo-wrap { position: relative; flex: 0 1 300px; }

.cp-ww-photo-wrap .cp-pennant-tag { position: absolute; bottom: 22px; right: -30px; z-index: 2; }

/* ---------- DETAILS ---------- */

#cp-details { background: var(--cp-blush); }

.cp-details-heading-wrap { display: flex; justify-content: center; margin-bottom: 60px; }

.cp-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  text-align: center;
}

.cp-details-card { display: flex; flex-direction: column; align-items: center; gap: 14px; }

.cp-details-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cp-pink);
  border-radius: 50%;
  color: var(--cp-white);
  box-shadow: 0 8px 18px rgba(254, 156, 156, 0.35);
}

.cp-details-icon svg { width: 30px; height: 30px; }

@media (hover: hover) and (pointer: fine) {
  .cp-details-icon { transition: transform 200ms var(--cp-ease-out), box-shadow 200ms var(--cp-ease-out); }
  .cp-details-card:hover .cp-details-icon { transform: translateY(-4px); box-shadow: 0 12px 22px rgba(254, 156, 156, 0.45); }
}

.cp-details-card h3 {
  text-transform: uppercase;
  color: var(--cp-pink);
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: 0.02em;
  margin: 0;
}

.cp-details-card p { margin: 0; font-weight: 600; line-height: 1.5; color: var(--cp-ink-soft); font-size: 0.92rem; }

/* ---------- WHAT TO EXPECT ---------- */

.cp-expect-heading-wrap { display: flex; justify-content: center; margin-bottom: 64px; }

.cp-expect-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.cp-expect-card { text-align: center; }

.cp-expect-card h3 {
  text-transform: uppercase;
  color: var(--cp-pink);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  margin: 18px 0 0;
  line-height: 1.4;
}

/* ---------- CONTACT / RSVP ---------- */

#cp-contact { background: var(--cp-blush); }

.cp-contact-flex {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 64px;
  flex-wrap: wrap;
}

.cp-contact-left { position: relative; flex: 0 1 300px; padding-top: 40px; }

.cp-contact-left .cp-star-badge { position: absolute; top: 0; left: -30px; z-index: 2; }

.cp-contact-right { flex: 1 1 300px; max-width: 360px; text-align: left; }

.cp-rsvp-heading {
  font-family: var(--cp-font-display);
  color: var(--cp-pink);
  font-weight: 700;
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  margin: 0 0 8px;
}

.cp-rsvp-sub { margin: 0 0 28px; font-weight: 600; color: var(--cp-ink-soft); font-size: 0.95rem; }

.cp-rsvp-form { display: flex; flex-direction: column; gap: 22px; }

.cp-rsvp-field { display: flex; flex-direction: column; gap: 8px; }

.cp-rsvp-field span {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--cp-pink);
}

.cp-rsvp-field input {
  border: none;
  border-bottom: 2px solid rgba(43, 35, 32, 0.18);
  background: transparent;
  padding: 6px 2px 10px;
  font-family: var(--cp-font-body);
  font-weight: 600;
  font-size: 1rem;
  color: var(--cp-ink);
  outline: none;
  transition: border-color 200ms ease;
}

.cp-rsvp-field input:focus { border-bottom-color: var(--cp-pink); }

.cp-rsvp-attend-row { display: flex; gap: 10px; }

.cp-rsvp-attend-btn {
  flex: 1;
  padding: 12px 14px;
  border-radius: 999px;
  border: 2px solid var(--cp-pink);
  background: transparent;
  color: var(--cp-pink);
  font-family: var(--cp-font-body);
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, transform 160ms var(--cp-ease-out);
}

.cp-rsvp-attend-btn.active { background: var(--cp-pink); color: var(--cp-white); }
.cp-rsvp-attend-btn:active { transform: scale(0.97); }

.cp-rsvp-error { font-size: 0.85rem; color: var(--cp-pink-deep); margin: -8px 0 0; font-weight: 600; }

.cp-rsvp-submit-btn {
  margin-top: 4px;
  padding: 15px 20px;
  border-radius: 999px;
  border: none;
  background: var(--cp-pink);
  color: var(--cp-white);
  font-family: var(--cp-font-display);
  font-weight: 700;
  font-size: 1.05rem;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  display: block;
  box-shadow: 0 8px 18px rgba(254, 156, 156, 0.4);
  transition: transform 160ms var(--cp-ease-out), opacity 160ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .cp-rsvp-submit-btn:hover { transform: translateY(-2px); }
}
.cp-rsvp-submit-btn:active { transform: scale(0.97); }
.cp-rsvp-submit-btn:disabled { opacity: 0.6; cursor: default; }

.cp-wa-btn { margin-top: 16px; background: #25D366; box-shadow: 0 8px 18px rgba(37, 211, 102, 0.35); }

.cp-rsvp-thanks {
  animation: cp-fade-up 500ms var(--cp-ease-out) both;
}

.cp-rsvp-thanks-title {
  font-family: var(--cp-font-display);
  color: var(--cp-pink);
  font-weight: 700;
  font-size: 1.9rem;
  margin: 0 0 10px;
}

.cp-rsvp-thanks-body { margin: 0; font-weight: 600; color: var(--cp-ink-soft); }

@keyframes cp-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .cp-rsvp-thanks { animation: none; }
}

/* ---------- Responsive ---------- */

@media (max-width: 720px) {
  .cp-section { padding: 60px 20px; }
  .cp-hero-copy-wrap { padding-top: 60px; }
  .cp-ww-photo-wrap .cp-pennant-tag { right: 0; }
  .cp-details-grid, .cp-expect-grid { grid-template-columns: 1fr; gap: 48px; }
  .cp-contact-left { margin: 0 auto; padding-top: 60px; }
}
`;
