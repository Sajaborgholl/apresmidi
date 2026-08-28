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
// UPDATE (per explicit customer instruction): the hero's disco ball /
// bunting / stars / balloon-cluster / megaphone / cake are now real image
// assets (public/templates/birthday-disco/*.png — background removed,
// each piece isolated), replacing the earlier hand-built SVG versions of
// the same decorations. These images are this template's fixed design,
// same on every invite built on this template — only the photo and the
// name/date/venue text (all still rendered from `invite` below) change
// per customer.
//
// The previously-flagged licensing question (the reference mockup's XMP
// metadata identifies it as a Canva template export, "Pink Silver and
// Black Retro Birthday Invitation") still applies to these cropped assets
// since they're derived from that same file — the customer reviewed this
// and asked to proceed anyway. Confirming actual commercial usage rights
// for that Canva design is still worth doing before this goes live to
// paying customers (same open concern as the hotlinked Canva font in
// WeddingClassic.tsx).
//
// AGE REMOVED (per explicit customer instruction): this template used to
// have a customer-editable "age" field, shown as a number next to the
// cake. That field is gone entirely now — not just hidden here, but
// removed from Invite (lib/types.ts), TemplateFieldManifest and this
// template's registry entry (lib/templates/registry.ts), the customize
// form (CustomizeForm.tsx/CustomizePanel.tsx), and createOrder's insert
// (app/order/[slug]/actions.ts). cake.png stays as pure decoration, same
// as every other Decoration image on this page. The `age` column on the
// `invites` table itself was left in place (unused, nullable) — dropping
// a column is a schema change worth doing deliberately, not as a
// side-effect of a UI cleanup.
//
// ASSET QUALITY UPDATE: the first export pass cropped these as bounding
// boxes off the final flattened mockup rather than as isolated layers, so
// several files originally carried visible fragments of whatever was next
// to them in the original composition (e.g. disco-ball-pink.png had a
// chunk of the bunting hanging off it; megaphone.png had slivers of both
// disco balls and the balloon cluster baked in). All of these have since
// been re-exported/re-processed as properly isolated cutouts (opaque white
// backgrounds removed via a border-flood-fill, not a global brightness
// threshold, so interior highlights and white design elements — e.g. the
// stars' white sticker backing, the bunting flags' white fill — survive
// intact).
//
// PHOTO/HAT UPDATE (per explicit customer instruction): there is no
// separate party-hat decoration image anymore. It's baked directly into
// public/templates/birthday-disco/demo-photo.png (a transparent cutout of
// the reference mockup's sample photo, hat included), which is set as
// this template's demo invite's photo — same `invite.photo_urls?.[0]`
// PhotoSlot every other template uses, just with a hat-wearing image as
// the sample content instead of a plain portrait. A real customer's own
// uploaded photo will NOT have a hat on it — this trades away a
// universal, always-present hat overlay (which would sit at a fixed
// position regardless of what the customer's own photo actually looks
// like) for a demo photo that matches the reference exactly, per what was
// asked. Worth knowing before shipping to real customers.

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

// Fixed decoration images — cropped/cutout from the reference mockup, see
// the file header note above. `alt=""` because these are purely
// decorative; the meaningful content (name/date/venue/photo) is rendered
// separately.
function Decoration({ className, file }: { className: string; file: string }) {
  return (
    <div className={`bd-decoration ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/templates/birthday-disco/${file}`} alt="" aria-hidden="true" />
    </div>
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
          <Decoration className="bd-bunting" file="bunting.png" />
          <Decoration className="bd-disco-a" file="disco-ball-pink.png" />
          <Decoration className="bd-disco-b" file="disco-ball-silver.png" />
          <Decoration className="bd-stars" file="stars.png" />
          <Decoration className="bd-balloons" file="balloon-cluster.png" />
          <Decoration className="bd-megaphone" file="megaphone.png" />
          <Decoration className="bd-cake" file="cake.png" />

          <PhotoSlot url={invite.photo_urls?.[0]} alt={invite.host_names} />

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
  /* Decorations intentionally bleed past .bd-hero-scene's edges (that's the
     look), but their offsets are percentage-based and were sized for
     desktop — on narrow viewports they can push past .bd-hero's own edge,
     which (being full viewport width) means past the viewport itself,
     causing an unwanted horizontal scrollbar. Clip at this boundary so
     that never happens, without affecting how anything looks on desktop. */
  overflow-x: hidden;
}
.bd-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #c23c7b;
  margin: 0 0 10px;
}
/* ---------- Hero scene: fixed decoration + customizable photo/text ----------
   Positions below are converted directly from the reference mockup's own
   layout (a 600.203 x 846 canvas) into percentages of this scene's own
   box, via a fixed aspect-ratio — so every element sits exactly where it
   sits in the reference, just scaled to whatever width the scene renders
   at. Only .bd-photo's image and .bd-hero-note's text come from invite
   data — the disco balls, bunting, stars, balloon cluster, megaphone, and
   cake images are this template's fixed design, same on every invite
   built on this template. */
.bd-hero-scene {
  position: relative;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 600 / 846;
  margin: 70px auto 40px;
}
.bd-decoration { position: absolute; pointer-events: none; }
.bd-decoration img { display: block; width: 100%; height: 100%; object-fit: contain; }

.bd-bunting { left: -3%; top: -6%; width: 74%; height: 24%; }
.bd-disco-a { left: -20%; top: 4%; width: 54%; height: 39%; transform: rotate(20deg); filter: drop-shadow(0 10px 16px rgba(143,45,94,0.3)); }
.bd-disco-b { left: 65%; top: -2%; width: 50%; height: 36%; filter: drop-shadow(0 8px 14px rgba(0,0,0,0.18)); }
.bd-stars { left: -3%; top: 50%; width: 25%; height: 13%; }
.bd-balloons { left: 74%; top: 50%; width: 33%; height: 55%; }
.bd-megaphone { left: 76%; top: 24%; width: 32%; height: 40%; transform: rotate(-20deg); filter: drop-shadow(0 8px 14px rgba(0,0,0,0.25)); }

/* No white card/frame, no fixed hat overlay — the reference has neither;
   demo-photo.png already includes the hat baked in as a transparent
   cutout (see the file header note on why there's no separate hat image
   anymore), so this just floats the photo directly like every other
   decoration, sized to fit hat-through-shoulders. */
.bd-photo {
  position: absolute;
  z-index: 2;
  left: 29%;
  top: 17%;
  width: 38%;
  height: 34%;
  transform: rotate(-5deg);
  filter: drop-shadow(0 10px 20px rgba(26,26,26,0.2));
  display: flex;
  align-items: center;
  justify-content: center;
}
.bd-photo img { display: block; width: 100%; height: 100%; object-fit: contain; }
/* Placeholder still needs *some* visible shape (a customer hasn't
   uploaded a real photo yet) even though the frame itself is gone — a
   soft rounded card, unlike the borderless transparent photo it stands
   in for. */
.bd-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: #f2ece1;
  font-size: 12px;
  font-weight: 500;
  color: #8b8478;
  padding: 0 8%;
  text-align: center;
}

/* Replaces the earlier coded silver-balloon "21" numeral (per explicit
   customer instruction to remove the age feature entirely) — purely
   decorative now, same as every other Decoration image on this page. */
.bd-cake {
  left: -2%;
  top: 58%;
  width: 30%;
  aspect-ratio: 446 / 453;
  filter: drop-shadow(0 8px 14px rgba(26,26,26,0.2));
}

/* Positioned + sized to match the reference exactly (left 30%/top 49%,
   ~43% of the scene wide) instead of flowing under the photo — everything
   in this hero is now placed the same way, by fixed reference coordinates. */
.bd-hero-note {
  position: absolute;
  z-index: 3;
  left: 30%;
  top: 49%;
  width: 43%;
  background-color: #fdf9ef;
  background-image:
    linear-gradient(rgba(26,26,26,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(26,26,26,0.06) 1px, transparent 1px);
  background-size: 14px 14px;
  border: 1px solid rgba(26,26,26,0.08);
  clip-path: polygon(12% 0%, 88% 0%, 100% 58%, 50% 100%, 0% 58%);
  padding: 16% 12% 22%;
  text-align: center;
  transform: rotate(2deg);
  box-shadow: 0 12px 24px rgba(26,26,26,0.1);
}
.bd-hero-note-name {
  font-family: 'Permanent Marker', cursive;
  font-weight: 400;
  font-size: clamp(1.1rem, 4vw, 1.5rem);
  color: #1a1a1a;
  margin: 0 0 6px;
  line-height: 1.15;
}
.bd-hero-note-info {
  font-size: 11.5px;
  font-weight: 500;
  color: #6b7178;
  margin: 0;
  line-height: 1.5;
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
