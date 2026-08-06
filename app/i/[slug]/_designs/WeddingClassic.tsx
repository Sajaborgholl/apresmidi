"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Invite } from "@/lib/types";

// Wedding Classic — replaced with the black-and-white editorial design
// (script headline + photo banner + Where/When + RSVP), matching the
// prototype approved in template-wedding-modern-mono-prototype.html.
// Same slug/registry entry as before, so existing orders and links to
// "wedding-classic" keep working — only what renders has changed.

function PhotoSlot({ url, alt }: { url: string | undefined; alt: string }) {
  return (
    <div className="wc-photo">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} />
      ) : (
        <span className="wc-photo-placeholder">No photo yet</span>
      )}
    </div>
  );
}

export default function WeddingClassic({ invite }: { invite: Invite }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<"accept" | "decline">("accept");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eventDate = invite.event_date ? new Date(invite.event_date) : null;

  // Matches the reference design's compact "10.22.22" numeric date.
  const shortDate = eventDate
    ? `${String(eventDate.getMonth() + 1).padStart(2, "0")}.${String(eventDate.getDate()).padStart(2, "0")}.${String(
        eventDate.getFullYear() % 100
      ).padStart(2, "0")}`
    : null;

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
        ? `we are so happy for you and wouldn't miss it! We'll be there${guestCount > 1 ? ` with ${guestCount} of us` : ""}.`
        : "I'm sorry we won't be able to make it. Sending our love!"
    }`
  );
  const waLink = invite.whatsapp_number ? `https://wa.me/${invite.whatsapp_number}?text=${waMessage}` : null;

  return (
    <>
      <style>{CSS}</style>

      <div className="wc-page">
        <header className="wc-header">
          <div>
            <h1 className="wc-script">we&apos;re getting married</h1>
            <p className="wc-names">{invite.host_names}</p>
          </div>
          <div className="wc-date">{shortDate ?? "Date coming soon"}</div>
        </header>

        <div className="wc-photo-row">
          <PhotoSlot url={invite.photo_urls?.[0]} alt={invite.host_names} />
          <PhotoSlot url={invite.photo_urls?.[1]} alt={invite.host_names} />
          <PhotoSlot url={invite.photo_urls?.[2]} alt={invite.host_names} />
        </div>

        <section className="wc-details">
          <div className="wc-details-grid">
            <div className="wc-detail-col">
              <div className="wc-detail-script">Where</div>
              <div className="wc-detail-heading">Venue</div>
              <div className="wc-detail-body">
                {invite.venue_name ?? "Venue coming soon"}
              </div>
              {invite.venue_map_url && (
                <a href={invite.venue_map_url} target="_blank" rel="noopener noreferrer" className="wc-detail-link">
                  View map
                </a>
              )}
            </div>

            <div className="wc-details-rule" />

            <div className="wc-detail-col">
              <div className="wc-detail-script">When</div>
              <div className="wc-detail-heading">Date &amp; Time</div>
              <div className="wc-detail-body">
                {dateFormatted ?? "Date coming soon"}
                {timeFormatted && (
                  <>
                    <br />
                    Ceremony at {timeFormatted}
                    <br />
                    Reception to follow
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="wc-rsvp">
          <h2 className="wc-script wc-rsvp-script">RSVP</h2>
          {!submitted && <p className="wc-rsvp-sub">We can&apos;t wait to celebrate with you</p>}

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </label>

              <div className="wc-attend-row">
                <button
                  type="button"
                  className={`wc-attend-btn ${attending === "accept" ? "active" : ""}`}
                  onClick={() => setAttending("accept")}
                >
                  Joyfully accept
                </button>
                <button
                  type="button"
                  className={`wc-attend-btn ${attending === "decline" ? "active" : ""}`}
                  onClick={() => setAttending("decline")}
                >
                  Regretfully decline
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

              {error && <p className="wc-error">{error}</p>}

              <button type="submit" className="wc-submit-btn" disabled={loading}>
                {loading ? "Sending..." : "Send RSVP"}
              </button>
            </form>
          ) : (
            <div className="wc-thank-you">
              <div className="wc-script">{attending === "accept" ? "Yay!" : "We'll miss you"}</div>
              <p>
                {attending === "accept"
                  ? `We can't wait to celebrate with you, ${name.trim() || "friend"}.`
                  : `Thank you for letting us know, ${name.trim() || "friend"}.`}
              </p>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="wc-submit-btn wc-wa-btn">
                  Confirm on WhatsApp too
                </a>
              )}
            </div>
          )}
        </section>

        <footer className="wc-footer">Invitation crafted with love — order yours</footer>
      </div>
    </>
  );
}

const CSS = `
.wc-page {
  background: #fff;
  color: #111;
  font-family: 'Cinzel', serif;
}
.wc-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 46px 5vw 6px;
  gap: 20px;
  flex-wrap: wrap;
}
.wc-script {
  font-family: 'BD Script', cursive;
  font-weight: 400;
  font-size: clamp(40px, 7vw, 92px);
  line-height: 0.9;
  margin: 0;
}
.wc-names {
  margin: 8px 0 0;
  font-family: 'Cinzel', serif;
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(17,17,17,0.6);
}
.wc-date {
  font-family: 'Cinzel', serif;
  font-weight: 400;
  font-size: clamp(20px, 3vw, 36px);
  letter-spacing: 3px;
  white-space: nowrap;
  padding-bottom: 10px;
}
.wc-photo-row { display: flex; width: 100%; }
.wc-photo {
  height: 42vw;
  min-height: 260px;
  max-height: 560px;
  flex: 1;
  background: #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}
.wc-photo:first-child { flex: 1.05; margin-right: 22px; }
.wc-photo:last-child { flex: 1.08; }
.wc-photo img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); display: block; }
.wc-photo-placeholder {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(17,17,17,0.35);
}
.wc-details { padding: 100px 8vw; border-top: 1px solid rgba(17,17,17,0.12); }
.wc-details-grid { display: grid; grid-template-columns: 1fr 1px 1fr; gap: 60px; max-width: 920px; margin: 0 auto; }
.wc-details-rule { background: rgba(17,17,17,0.12); }
.wc-detail-col { text-align: center; }
.wc-detail-script { font-family: 'BD Script', cursive; font-weight: 400; font-size: clamp(36px, 5.5vw, 56px); margin: 0 0 22px; }
.wc-detail-heading { font-family: 'Cinzel', serif; font-weight: 600; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 16px; }
.wc-detail-body { font-family: 'Cinzel', serif; font-size: 15.5px; line-height: 1.9; color: #333; }
.wc-detail-link {
  display: inline-block; margin-top: 16px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
  color: #111; text-decoration: none; border-bottom: 1px solid #111; padding-bottom: 2px;
}
.wc-rsvp { padding: 100px 8vw 120px; border-top: 1px solid rgba(17,17,17,0.12); text-align: center; }
.wc-rsvp-script { font-size: clamp(48px, 8vw, 84px); margin-bottom: 12px; }
.wc-rsvp-sub { font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: rgba(17,17,17,0.6); margin-bottom: 46px; }
.wc-rsvp form { max-width: 380px; margin: 0 auto; display: flex; flex-direction: column; gap: 26px; text-align: left; }
.wc-rsvp label { display: block; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(17,17,17,0.55); margin-bottom: 8px; }
.wc-rsvp input {
  width: 100%; border: none; border-bottom: 1px solid rgba(17,17,17,0.35); background: transparent;
  font-family: 'Cinzel', serif; font-size: 15px; padding: 6px 2px 10px; color: #111; outline: none;
}
.wc-rsvp input:focus { border-bottom-color: #111; }
.wc-attend-row { display: flex; gap: 10px; }
.wc-attend-btn {
  flex: 1; padding: 12px 8px; border: 1px solid rgba(17,17,17,0.35); background: transparent;
  font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #111; cursor: pointer;
}
.wc-attend-btn.active { background: #111; color: #fff; border-color: #111; }
.wc-error { font-size: 11.5px; color: #b23; margin: -10px 0 0; }
.wc-submit-btn {
  margin-top: 6px; padding: 15px; border: none; background: #111; color: #fff; text-decoration: none;
  display: block; text-align: center; font-family: 'Cinzel', serif; font-size: 12px; letter-spacing: 3px;
  text-transform: uppercase; cursor: pointer;
}
.wc-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.wc-submit-btn:hover { opacity: 0.85; }
.wc-wa-btn { margin-top: 14px; background: #25D366; }
.wc-thank-you { max-width: 380px; margin: 0 auto; font-family: 'Cinzel', serif; font-size: 15px; line-height: 1.8; color: #333; }
.wc-thank-you .wc-script { font-size: clamp(40px, 6vw, 64px); margin-bottom: 10px; }
.wc-footer { text-align: center; font-size: 11px; letter-spacing: 1px; color: rgba(17,17,17,0.4); padding: 30px 20px 50px; font-family: 'Cinzel', serif; }
@media (max-width: 720px) {
  .wc-header { flex-direction: column; align-items: flex-start; gap: 6px; padding-top: 32px; }
  .wc-photo-row { flex-direction: column; }
  .wc-photo { height: 260px; }
  .wc-photo:first-child { margin-right: 0; margin-bottom: 10px; }
  .wc-details { padding: 70px 8vw; }
  .wc-details-grid { grid-template-columns: 1fr; gap: 46px; }
  .wc-details-rule { display: none; }
}
`;
