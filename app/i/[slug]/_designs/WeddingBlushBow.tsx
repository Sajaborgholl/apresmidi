"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Invite } from "@/lib/types";
import TypewriterText from "./TypewriterText";

// Small hand-drawn-style SVG bow, reused at three sizes (hero, card corner,
// rounded photo frame). size controls both the viewport and stroke weight
// so it still reads as a "drawing" rather than a thin scaled-down line.
function Bow({ size = 160 }: { size?: number }) {
  const height = size / 2;
  return (
    <svg width={size} height={height} viewBox="0 0 200 100" aria-hidden="true">
      <path
        d="M100,55 C85,35 55,32 40,45 C28,55 35,68 52,64"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth={size / 24}
        strokeLinecap="round"
      />
      <path
        d="M100,55 C115,35 145,32 160,45 C172,55 165,68 148,64"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth={size / 24}
        strokeLinecap="round"
      />
      <circle cx="100" cy="55" r={size / 24} fill="#1c1c1c" />
    </svg>
  );
}

function Cupid({ mirror = false }: { mirror?: boolean }) {
  return (
    <svg
      width="70"
      height="70"
      viewBox="0 0 120 120"
      aria-hidden="true"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <circle cx="55" cy="28" r="13" fill="none" stroke="#1c1c1c" strokeWidth={2.4} />
      <path d="M55,41 C50,58 50,74 60,86" fill="none" stroke="#1c1c1c" strokeWidth={2.4} strokeLinecap="round" />
      <path
        d="M40,50 C24,44 12,54 16,68 C28,64 37,58 42,52"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d="M70,52 C86,46 98,56 94,70 C82,66 73,60 68,54"
        fill="none"
        stroke="#1c1c1c"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path d="M46,58 C34,55 22,60 18,70" fill="none" stroke="#1c1c1c" strokeWidth={2} strokeLinecap="round" />
      <line x1="18" y1="70" x2="6" y2="76" stroke="#1c1c1c" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function AngularFrame() {
  return (
    <svg className="frame-svg" viewBox="0 0 320 400" preserveAspectRatio="none" aria-hidden="true">
      <polygon points="10,10 310,10 310,390 10,390" fill="none" stroke="#1c1c1c" strokeWidth={3} />
      <polygon points="42,42 278,42 278,358 42,358" fill="none" stroke="#1c1c1c" strokeWidth={3} />
      <line x1="10" y1="10" x2="42" y2="42" stroke="#1c1c1c" strokeWidth={3} />
      <line x1="310" y1="10" x2="278" y2="42" stroke="#1c1c1c" strokeWidth={3} />
      <line x1="10" y1="390" x2="42" y2="358" stroke="#1c1c1c" strokeWidth={3} />
      <line x1="310" y1="390" x2="278" y2="358" stroke="#1c1c1c" strokeWidth={3} />
    </svg>
  );
}

export default function WeddingBlushBow({ invite }: { invite: Invite }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dateFormatted = invite.event_date
    ? new Date(invite.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const photo1 = invite.photo_urls?.[0];
  const photo2 = invite.photo_urls?.[1];

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

  const waMessage = encodeURIComponent(
    `Hi! It's ${name.trim() || "Friend"} — ${
      attending === "yes"
        ? `we are beyond excited and wouldn't miss it for the world! We'll be there${guestCount > 1 ? ` with ${guestCount} of us` : ""}.`
        : "I'm so sorry we won't be able to make it this time. Sending all our love on your special day."
    }`
  );
  const waLink = invite.whatsapp_number ? `https://wa.me/${invite.whatsapp_number}?text=${waMessage}` : null;

  return (
    <>
      <style>{CSS}</style>

      <section className="hero">
        <div className="hero-left">
          <Bow size={160} />
          <h1 className="script"><TypewriterText text={invite.host_names} /></h1>
          <p className="label">are getting married on</p>
          <span className="script date">{dateFormatted ?? "Date coming soon"}</span>
          <a href="#rsvp" className="pill">Save the date</a>
        </div>

        <div className="frame-wrap angular">
          <AngularFrame />
          {photo1 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo1} alt={invite.host_names} className="photo" />
          ) : (
            <div className="photo-placeholder">No photo yet</div>
          )}
        </div>
      </section>

      <section className="details">
        <div className="details-heading">
          <Cupid />
          <h2 className="script"><TypewriterText text="The details so far" /></h2>
          <Cupid mirror />
        </div>

        <div className="details-cards">
          <div className="card">
            <div className="card-bow"><Bow size={70} /></div>
            <h3 className="script">When</h3>
            <p>
              {dateFormatted
                ? `We've booked ${dateFormatted} as our wedding date, so please mark your calendars!`
                : "We haven't locked in a date yet — check back soon!"}
            </p>
          </div>
          <div className="card">
            <div className="card-bow"><Bow size={70} /></div>
            <h3 className="script">Where</h3>
            <p>
              {invite.venue_name
                ? `We'll be celebrating at ${invite.venue_name}.`
                : "No venue has been decided yet, but we'll share it here as soon as it's booked."}
            </p>
            {invite.venue_map_url && (
              <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="map-link">
                View map
              </a>
            )}
          </div>
          <div className="card">
            <div className="card-bow"><Bow size={70} /></div>
            <h3 className="script">Wear</h3>
            <p>We want to keep things formal but comfortable! Smart casual or cocktail attire.</p>
          </div>
        </div>
      </section>

      <section id="rsvp" className="rsvp-section">
        <div className="frame-wrap rounded">
          <div className="rounded-bow"><Bow size={90} /></div>
          {photo2 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo2} alt={invite.host_names} className="photo" />
          ) : (
            <div className="photo-placeholder">No photo yet</div>
          )}
        </div>

        <div className="rsvp-content">
          <h2 className="script">
            <TypewriterText text="RSVP with us before our big day!" />
          </h2>

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <label>
                <span className="label">Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </label>

              <div className="toggle-row">
                <button
                  type="button"
                  className={`toggle ${attending === "yes" ? "active" : ""}`}
                  onClick={() => setAttending("yes")}
                >
                  Joyfully accept
                </button>
                <button
                  type="button"
                  className={`toggle ${attending === "no" ? "active" : ""}`}
                  onClick={() => setAttending("no")}
                >
                  Regretfully decline
                </button>
              </div>

              {attending === "yes" && (
                <label>
                  <span className="label">Number of guests</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
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
              <p>
                {attending === "yes"
                  ? `Yay, ${name.trim() || "Friend"}! We can't wait to celebrate with you.`
                  : `We'll miss you, ${name.trim() || "Friend"}. Thank you for letting us know.`}
              </p>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="submit-btn wa-btn">
                  Confirm on WhatsApp too
                </a>
              )}
            </div>
          )}

          {invite.whatsapp_number && (
            <div className="contact">
              <p>
                <span className="script">Phone</span>
                <span className="pill-tag">{invite.whatsapp_number}</span>
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">Invitation crafted with love — order yours</footer>
    </>
  );
}

const CSS = `
body {
  margin: 0;
  background: #F6C9D3;
  color: #1c1c1c;
  font-family: 'Space Grotesk', sans-serif;
}
.script { font-family: 'Caveat', cursive; font-weight: 700; color: #1c1c1c; }
.typewriter-cursor {
  display: inline-block;
  width: 3px;
  height: 0.85em;
  margin-left: 3px;
  background: #1c1c1c;
  vertical-align: text-bottom;
  animation: typewriter-blink 0.9s steps(1) infinite;
}
.typewriter-cursor.done { animation: none; opacity: 0; }
@keyframes typewriter-blink { 50% { opacity: 0; } }
.label {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 12px;
}
.hero, .details, .rsvp-section { padding: 60px 8vw; }
.hero { display: flex; align-items: center; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
.hero-left { max-width: 480px; }
.hero-left h1 { font-size: clamp(2.8rem, 6vw, 4.2rem); margin: 12px 0 20px; line-height: 1; }
.hero-left .label { font-size: 13px; margin: 0 0 6px; display: block; }
.hero-left .date { font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 0 0 28px; display: block; }
.pill {
  display: inline-block;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 12px;
  background: #FBF1DE;
  color: #1c1c1c;
  text-decoration: none;
  border: 1.5px solid #1c1c1c;
  border-radius: 999px;
  padding: 14px 26px;
  cursor: pointer;
}
.frame-wrap { position: relative; width: 320px; max-width: 100%; }
.frame-wrap.angular { height: 400px; }
.frame-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.photo { position: absolute; inset: 30px; width: calc(100% - 60px); height: calc(100% - 60px); object-fit: cover; }
.frame-wrap.rounded .photo { inset: 0; width: 100%; height: 100%; border-radius: 26px; }
.photo-placeholder {
  position: absolute; inset: 30px;
  background: #d9d0c8;
  display: flex; align-items: center; justify-content: center;
  color: rgba(28,28,28,0.4);
  font-size: 13px;
}
.frame-wrap.rounded .photo-placeholder { inset: 0; border-radius: 26px; }
.details-heading { text-align: center; display: flex; align-items: center; justify-content: center; gap: 24px; padding-bottom: 20px; }
.details-heading h2 { font-size: clamp(2.2rem, 5vw, 3.2rem); margin: 0; }
.details-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; padding-top: 20px; max-width: 1100px; margin: 0 auto; }
.card { position: relative; background: #FBF1DE; border: 1.5px solid #1c1c1c; border-radius: 10px; padding: 32px 20px 24px; text-align: center; }
.card-bow { position: absolute; top: -22px; left: 16px; }
.card h3 { font-size: 1.8rem; margin: 6px 0 10px; }
.card p { font-size: 11px; line-height: 1.6; margin: 0; }
.map-link { display: inline-block; margin-top: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #1c1c1c; }
.rsvp-section { display: flex; gap: 60px; flex-wrap: wrap; align-items: flex-start; }
.frame-wrap.rounded { height: 380px; border: 2px solid #1c1c1c; border-radius: 28px; overflow: hidden; }
.rounded-bow { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); z-index: 2; }
.rsvp-content { flex: 1; min-width: 280px; }
.rsvp-content h2 { font-size: clamp(2rem, 4.5vw, 2.8rem); margin: 0 0 28px; line-height: 1.05; max-width: 380px; }
form { display: flex; flex-direction: column; gap: 16px; max-width: 360px; margin-bottom: 24px; }
form label { display: flex; flex-direction: column; gap: 6px; }
form input {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  padding: 10px 12px;
  border: 1.5px solid #1c1c1c;
  border-radius: 8px;
  background: #FBF1DE;
  color: #1c1c1c;
}
.toggle-row { display: flex; gap: 10px; }
.toggle {
  flex: 1;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 12px 8px;
  border: 1.5px solid #1c1c1c;
  border-radius: 999px;
  background: #FBF1DE;
  color: #1c1c1c;
  cursor: pointer;
}
.toggle.active { background: #1c1c1c; color: #FBF1DE; }
.error-text { font-size: 12px; color: #a83232; margin: -6px 0 0; }
.submit-btn {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 13px;
  background: #1c1c1c;
  color: #FBF1DE;
  border: none;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  border-radius: 999px;
  padding: 14px 26px;
  cursor: pointer;
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.wa-btn { margin-top: 12px; background: #25D366; }
.thank-you { font-family: 'Caveat', cursive; font-weight: 700; font-size: 1.8rem; max-width: 360px; margin-bottom: 24px; line-height: 1.3; }
.contact p { display: flex; align-items: baseline; gap: 14px; margin: 0; }
.contact .script { font-size: 1.5rem; min-width: 70px; }
.contact .pill-tag {
  font-size: 12px; font-weight: 700; letter-spacing: 0.03em;
  background: #FBF1DE; border: 1.5px solid #1c1c1c; border-radius: 999px;
  padding: 8px 16px;
}
.footer { text-align: center; padding: 34px 20px 50px; font-size: 12px; color: rgba(28,28,28,0.5); }
@media (max-width: 640px) {
  .hero, .details, .rsvp-section { padding: 40px 6vw; }
  .details-heading { gap: 8px; }
  .details-heading svg { width: 46px; height: 46px; }
}
`;
