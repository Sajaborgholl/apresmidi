"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Invite } from "@/lib/types";

// Birthday Disco — ported from the approved static mockup
// (template-disco-birthday-prototype.html): same pink disco look, but the
// hardcoded "Olivia" copy/photo and the fake client-only RSVP toggle are
// replaced with real invite data and a real Supabase insert, matching every
// other template's data-binding + RSVP pattern (see WeddingClassic.tsx).
//
// The hero's disco ball / bunting / stars / balloons below are this
// template's fixed design (hand-built SVG, not a bundled image) — the only
// customer-editable pieces are the photo, the age number, and the
// name/date/venue text. NOTE: public/olivia-birthday-disco.png (the
// original flat mockup this was ported from) is NOT used as an asset
// here — its embedded XMP metadata identifies it as a Canva template
// export ("Pink Silver and Black Retro Birthday Invitation"), and reusing
// a Canva-designed composition as a product asset on a paid commercial
// site is a licensing question worth checking before this ships (same
// concern already flagged for the hotlinked Canva font in
// WeddingClassic.tsx).

function PhotoSlot({ url, alt }: { url: string | undefined; alt: string }) {
  return (
    <div className="bd-photo">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} />
      ) : (
        <span className="bd-photo-placeholder">No photo yet</span>
      )}
    </div>
  );
}

// Fixed decoration — part of the template's design, not something a
// customer edits. Only the photo, the age number, and the name/date/venue
// text (all rendered separately below) change per invite.
function DiscoBall({ className, tone }: { className: string; tone: "pink" | "silver" }) {
  const base = tone === "pink" ? "#e85f9c" : "#c7ccd4";
  const dark = tone === "pink" ? "#a8306c" : "#8b919b";
  return (
    <svg className={`bd-decoration ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill={base} />
      <g stroke={dark} strokeWidth="1.6" opacity="0.55">
        <line x1="4" y1="26" x2="96" y2="26" />
        <line x1="4" y1="50" x2="96" y2="50" />
        <line x1="4" y1="74" x2="96" y2="74" />
        <line x1="26" y1="4" x2="26" y2="96" />
        <line x1="50" y1="4" x2="50" y2="96" />
        <line x1="74" y1="4" x2="74" y2="96" />
      </g>
      <circle cx="30" cy="30" r="3" fill="#fff" opacity="0.85" />
      <circle cx="66" cy="62" r="2.4" fill="#fff" opacity="0.7" />
      <circle cx="70" cy="28" r="2" fill="#fff" opacity="0.6" />
    </svg>
  );
}

function StarShape({ className }: { className: string }) {
  return (
    <svg className={`bd-decoration ${className}`} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M20 4 L24.7 15.2 L36.5 15.8 L27.3 23.3 L30.6 34.8 L20 28.2 L9.4 34.8 L12.7 23.3 L3.5 15.8 L15.3 15.2 Z"
        fill="#e85f9c"
      />
    </svg>
  );
}

function BalloonCluster({ className }: { className: string }) {
  return (
    <svg className={`bd-decoration ${className}`} viewBox="0 0 90 120" aria-hidden="true">
      <ellipse cx="24" cy="34" rx="20" ry="26" fill="#f4a6cf" />
      <ellipse cx="58" cy="26" rx="17" ry="22" fill="#c7ccd4" />
      <ellipse cx="42" cy="52" rx="18" ry="24" fill="#e85f9c" />
      <path d="M24 60 C 20 80, 26 95, 22 112" stroke="#c23c7b" strokeWidth="1.5" fill="none" />
      <path d="M58 48 C 54 68, 60 88, 56 108" stroke="#8b919b" strokeWidth="1.5" fill="none" />
      <path d="M42 76 C 40 92, 44 100, 42 114" stroke="#a8306c" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function Bunting() {
  return (
    <svg className="bd-bunting" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 4 Q 200 34 400 4" stroke="#1a1a1a" strokeWidth="1.5" fill="none" />
      {Array.from({ length: 7 }, (_, i) => {
        const x = 24 + i * 56;
        const y = 6 + Math.sin((i / 6) * Math.PI) * 26;
        const fill = i % 2 === 0 ? "#e85f9c" : "#c7ccd4";
        return <path key={i} d={`M${x - 12} ${y} L${x + 12} ${y} L${x} ${y + 26} Z`} fill={fill} />;
      })}
    </svg>
  );
}

export default function BirthdayDisco({ invite }: { invite: Invite }) {
  const [name, setName] = useState("");
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
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("rsvps").insert({
      invite_id: invite.id,
      guest_name: name.trim(),
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
    `Hi! It's ${name.trim() || "Friend"} — ${
      attending === "accept"
        ? `count me in, can't wait to party${guestCount > 1 ? ` with ${guestCount} of us` : ""}!`
        : "I'm so sorry, I won't be able to make it this time!"
    }`
  );
  const waLink = invite.whatsapp_number ? `https://wa.me/${invite.whatsapp_number}?text=${waMessage}` : null;

  return (
    <>
      <style>{CSS}</style>

      <div className="bd-hero">
        <p className="bd-eyebrow">You&apos;re invited</p>

        <div className="bd-hero-scene">
          <Bunting />
          <DiscoBall className="bd-disco-a" tone="pink" />
          <DiscoBall className="bd-disco-b" tone="silver" />
          <StarShape className="bd-star-1" />
          <StarShape className="bd-star-2" />
          <StarShape className="bd-star-3" />
          <BalloonCluster className="bd-balloons" />

          <div className="bd-photo-frame">
            <PhotoSlot url={invite.photo_urls?.[0]} alt={invite.host_names} />
          </div>

          {invite.age != null && (
            <div className="bd-age-balloon" aria-label={`Turning ${invite.age}`}>
              {invite.age}
            </div>
          )}

          <div className="bd-hero-note">
            <p className="bd-hero-note-name">{invite.host_names}&apos;s Birthday Party</p>
            {(dateFormatted || invite.venue_name) && (
              <p className="bd-hero-note-info">
                {dateFormatted}
                {timeFormatted ? `, ${timeFormatted}` : ""}
                {invite.venue_name && (
                  <>
                    <br />
                    {invite.venue_name}
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="bd-details">
        <div className="bd-details-grid">
          <div className="bd-detail-col">
            <div className="bd-detail-script">When</div>
            <div className="bd-detail-heading">Date &amp; Time</div>
            <div className="bd-detail-body">
              {dateFormatted ?? "Date coming soon"}
              {timeFormatted && (
                <>
                  <br />
                  {timeFormatted}
                </>
              )}
            </div>
          </div>

          <div className="bd-details-rule" />

          <div className="bd-detail-col">
            <div className="bd-detail-script">Where</div>
            <div className="bd-detail-heading">Location</div>
            <div className="bd-detail-body">{invite.venue_name ?? "Venue coming soon"}</div>
            {invite.venue_map_url && (
              <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="bd-detail-link">
                View map
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="bd-rsvp">
        <h2 className="bd-rsvp-script">RSVP</h2>
        <p className="bd-rsvp-sub">Let us know if you&apos;ll be at the disco!</p>

        {!submitted ? (
          <form className="bd-form" onSubmit={handleSubmit}>
            <label>
              Guest name
              <input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <div className="bd-attend-row">
              <button
                type="button"
                className={`bd-attend-btn ${attending === "accept" ? "active" : ""}`}
                onClick={() => setAttending("accept")}
              >
                Count me in
              </button>
              <button
                type="button"
                className={`bd-attend-btn ${attending === "decline" ? "active" : ""}`}
                onClick={() => setAttending("decline")}
              >
                Can&apos;t make it
              </button>
            </div>

            {attending === "accept" && (
              <label>
                Number of guests
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                />
              </label>
            )}

            {error && <p className="bd-error">{error}</p>}

            <button type="submit" className="bd-submit-btn" disabled={loading}>
              {loading ? "Sending…" : "Send RSVP"}
            </button>
          </form>
        ) : (
          <div className="bd-thank-you">
            <div className="bd-rsvp-script">{attending === "accept" ? "Yay!" : "We'll miss you"}</div>
            <p>
              {attending === "accept"
                ? `Can't wait to party with you, ${name.trim() || "friend"}!`
                : `Thanks for letting us know, ${name.trim() || "friend"}.`}
            </p>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="bd-submit-btn bd-wa-btn">
                Confirm on WhatsApp too
              </a>
            )}
          </div>
        )}
      </section>
    </>
  );
}

const CSS = `
* { box-sizing: border-box; }
.bd-hero, .bd-details, .bd-rsvp { font-family: 'Poppins', sans-serif; color: #1a1a1a; }

/* ---------- Hero ---------- */
.bd-hero {
  background: #ffffff;
  padding: 64px 6vw 40px;
  text-align: center;
}
.bd-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #c23c7b;
  margin: 0 0 10px;
}
/* ---------- Hero scene: fixed decoration + customizable photo/age/text ----------
   Only .bd-photo-frame's contents, .bd-age-balloon's number, and
   .bd-hero-note's text come from invite data — the disco balls, bunting,
   stars, and balloons are the template's fixed design, same on every
   invite built on this template. */
.bd-hero-scene {
  position: relative;
  max-width: 460px;
  margin: 56px auto 90px;
  padding: 0 20px;
}
.bd-decoration { position: absolute; pointer-events: none; }
.bd-bunting {
  position: absolute;
  top: -44px;
  left: -10%;
  width: 120%;
  height: 44px;
}
.bd-disco-a { width: 78px; top: -34px; left: -8%; filter: drop-shadow(0 8px 14px rgba(194,60,123,0.3)); }
.bd-disco-b { width: 60px; top: -18px; right: -6%; filter: drop-shadow(0 8px 14px rgba(0,0,0,0.15)); }
.bd-star-1 { width: 26px; top: 46%; left: -9%; transform: rotate(-8deg); }
.bd-star-2 { width: 18px; top: 58%; left: -4%; transform: rotate(10deg); }
.bd-star-3 { width: 22px; top: 6%; right: -10%; transform: rotate(14deg); }
.bd-balloons { width: 78px; bottom: -30px; right: -12%; }

.bd-photo-frame {
  position: relative;
  z-index: 2;
  max-width: 320px;
  margin: 0 auto;
  background: #fffdfb;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 20px 40px rgba(26,26,26,0.12);
}
.bd-photo {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 8px;
  overflow: hidden;
  background: #f6d9e6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bd-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.bd-photo-placeholder { font-size: 13px; font-weight: 500; color: #c23c7b; opacity: 0.6; }

.bd-age-balloon {
  position: absolute;
  z-index: 3;
  bottom: 6%;
  left: -6%;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #e2e6ec, #9aa0ab);
  color: #1a1a1a;
  font-family: 'Permanent Marker', cursive;
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  box-shadow: 0 10px 22px rgba(0,0,0,0.2), inset 0 -6px 10px rgba(0,0,0,0.15);
  transform: rotate(-6deg);
}

.bd-hero-note {
  position: relative;
  z-index: 3;
  max-width: 260px;
  margin: -30px auto 0;
  background: #fffdfb;
  border: 1px solid rgba(26,26,26,0.08);
  border-radius: 10px;
  padding: 14px 18px;
  text-align: center;
  transform: rotate(1.5deg);
  box-shadow: 0 12px 24px rgba(26,26,26,0.1);
}
.bd-hero-note-name {
  font-family: 'Permanent Marker', cursive;
  font-weight: 400;
  font-size: clamp(1.3rem, 4vw, 1.7rem);
  color: #1a1a1a;
  margin: 0 0 6px;
  line-height: 1.15;
}
.bd-hero-note-info {
  font-size: 12.5px;
  font-weight: 500;
  color: #6b7178;
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 480px) {
  .bd-hero-scene { max-width: 340px; margin: 50px auto 70px; }
  .bd-disco-a { width: 56px; }
  .bd-disco-b { width: 44px; }
  .bd-balloons { width: 58px; }
  .bd-age-balloon { width: 64px; height: 64px; }
}

/* ---------- Details ---------- */
.bd-details {
  background: #fbeef2;
  padding: 84px 8vw;
  border-top: 1px solid rgba(26,26,26,0.08);
}
.bd-details-grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 60px;
  max-width: 780px;
  margin: 0 auto;
}
.bd-details-rule { background: rgba(26,26,26,0.1); }
.bd-detail-col { text-align: center; }
.bd-detail-script {
  font-family: 'Permanent Marker', cursive;
  font-weight: 400;
  font-size: clamp(34px, 5vw, 48px);
  color: #c23c7b;
  margin: 0 0 18px;
  transform: rotate(-2deg);
}
.bd-detail-heading {
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #8b9198;
  margin: 0 0 14px;
}
.bd-detail-body { font-weight: 500; font-size: 16px; line-height: 1.9; color: #1a1a1a; }
.bd-detail-link {
  display: inline-block;
  margin-top: 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #e85f9c;
  text-decoration: none;
  border-bottom: 1px solid #e85f9c;
  padding-bottom: 2px;
}
.bd-detail-link:hover { color: #c23c7b; border-color: #c23c7b; }

@media (max-width: 720px) {
  .bd-details-grid { grid-template-columns: 1fr; gap: 46px; }
  .bd-details-rule { display: none; }
  .bd-details { padding: 60px 8vw; }
  .bd-hero { padding: 48px 6vw 32px; }
}

/* ---------- RSVP ---------- */
.bd-rsvp {
  padding: 84px 8vw 110px;
  border-top: 1px solid rgba(26,26,26,0.08);
  text-align: center;
  background: #fffdfb;
}
.bd-rsvp-script {
  font-family: 'Permanent Marker', cursive;
  font-weight: 400;
  font-size: clamp(42px, 7vw, 64px);
  color: #1a1a1a;
  margin: 0 0 10px;
  transform: rotate(-1.5deg);
}
.bd-rsvp-sub {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;
  color: rgba(26,26,26,0.55);
  margin-bottom: 40px;
}
.bd-form { max-width: 380px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; text-align: left; }
.bd-form label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #8b9198;
  margin-bottom: 8px;
}
.bd-form input {
  width: 100%;
  border: none;
  border-bottom: 2px solid rgba(26,26,26,0.15);
  background: transparent;
  font-family: 'Poppins', sans-serif;
  font-size: 15px;
  padding: 6px 2px 10px;
  color: #1a1a1a;
  outline: none;
}
.bd-form input:focus { border-bottom-color: #e85f9c; }
.bd-attend-row { display: flex; gap: 10px; }
.bd-attend-btn {
  flex: 1;
  padding: 13px 8px;
  border: 2px solid rgba(26,26,26,0.15);
  border-radius: 999px;
  background: transparent;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: #1a1a1a;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.bd-attend-btn.active { background: #e85f9c; color: #fff; border-color: #e85f9c; }
.bd-error { font-size: 13px; color: #c23c7b; margin: -8px 0 0; }
.bd-submit-btn {
  margin-top: 4px;
  padding: 15px;
  border: none;
  border-radius: 999px;
  background: #1a1a1a;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  display: block;
}
.bd-submit-btn:hover { opacity: 0.88; }
.bd-submit-btn:disabled { opacity: 0.6; cursor: default; }
.bd-wa-btn { margin-top: 18px; background: #25D366; }
.bd-thank-you { max-width: 380px; margin: 0 auto; font-size: 15px; line-height: 1.8; color: #333; }
.bd-thank-you .bd-rsvp-script { margin-bottom: 8px; }
`;
