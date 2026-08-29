"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Invite } from "@/lib/types";

type IconKey = "heart" | "star" | "rings";

type StickerDef = {
  icon?: IconKey;
  color: "sage" | "olive" | "moss";
  torn?: "torn-a" | "torn-b" | "torn-c" | "torn-d";
  top: string;
  left: string;
  rot: number;
  washi?: boolean;
  hide?: boolean;
};

/* =====================================================================
   ICON LIBRARY
   Single-stroke, ink-colored (#4A3F35) SVG doodles, reused identically
   wherever they appear so every instance of e.g. the heart looks the same.
===================================================================== */
const ICONS: Record<IconKey, string> = {
  heart: `<svg viewBox="0 0 40 40" fill="none" stroke="#4A3F35" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 33 C20 33 6 24 6 14.5 C6 8.5 11 5.5 15 6.5 C18 7.3 20 10.5 20 10.5 C20 10.5 22 7.3 25 6.5 C29 5.5 34 8.5 34 14.5 C34 24 20 33 20 33 Z"/>
  </svg>`,
  star: `<svg viewBox="0 0 40 40" fill="none" stroke="#4A3F35" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M20 4 L24.7 15.2 L36.5 15.8 L27.3 23.3 L30.6 34.8 L20 28.2 L9.4 34.8 L12.7 23.3 L3.5 15.8 L15.3 15.2 Z"/>
  </svg>`,
  rings: `<svg viewBox="0 0 40 40" fill="none" stroke="#4A3F35" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="15.5" cy="23" r="9"/>
    <circle cx="25.5" cy="18.5" r="9"/>
  </svg>`,
};

const HERO_STICKERS: StickerDef[] = [
  { icon: "heart", color: "olive", torn: "torn-a", top: "5%", left: "6%", rot: -10 },
  { icon: "star", color: "sage", torn: "torn-b", top: "5%", left: "80%", rot: 12 },
  { icon: "rings", color: "moss", torn: "torn-c", top: "18%", left: "88%", rot: -8, hide: true },
  { icon: "heart", color: "sage", torn: "torn-d", top: "20%", left: "3%", rot: 8, hide: true },
  { icon: "star", color: "olive", torn: "torn-a", top: "40%", left: "90%", rot: -14, hide: true },
  { icon: "rings", color: "moss", torn: "torn-b", top: "42%", left: "2%", rot: 10, hide: true },
  { icon: "heart", color: "moss", torn: "torn-c", top: "94%", left: "88%", rot: -6, hide: true },
  { icon: "star", color: "sage", torn: "torn-d", top: "94%", left: "4%", rot: 9, hide: true },
  { washi: true, color: "olive", top: "10%", left: "42%", rot: -12 },
  { washi: true, color: "moss", top: "32%", left: "60%", rot: 9, hide: true },
];

const RSVP_STICKERS: StickerDef[] = [
  { icon: "heart", color: "moss", torn: "torn-d", top: "5%", left: "88%", rot: 11 },
  { icon: "rings", color: "sage", torn: "torn-a", top: "6%", left: "6%", rot: -13 },
  { icon: "star", color: "olive", torn: "torn-b", top: "92%", left: "86%", rot: 9, hide: true },
  { icon: "heart", color: "moss", torn: "torn-c", top: "90%", left: "4%", rot: -7, hide: true },
  { icon: "star", color: "sage", torn: "torn-a", top: "46%", left: "94%", rot: 8, hide: true },
  { washi: true, color: "olive", top: "50%", left: "1%", rot: -15, hide: true },
];

function StickerLayer({ stickers }: { stickers: StickerDef[] }) {
  return (
    <div className="stickers-layer">
      {stickers.map((s, i) => (
        <div
          key={i}
          className={`sticker ${s.color} ${s.washi ? "washi" : s.torn} ${s.hide ? "hide-mobile" : ""}`}
          style={{ top: s.top, left: s.left, transform: `rotate(${s.rot}deg)` }}
          dangerouslySetInnerHTML={{ __html: !s.washi && s.icon ? ICONS[s.icon] : "" }}
        />
      ))}
    </div>
  );
}

export default function WeddingScrapbook({ invite }: { invite: Invite }) {
  const [revealed, setRevealed] = useState(false);
  const [attending, setAttending] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [warning, setWarning] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [thankYouMsg, setThankYouMsg] = useState("");

  const photo = invite.photo_urls?.[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (attending === null) {
      setWarning("Please let us know if you can make it.");
      return;
    }
    const finalName = name.trim() || "Friend";

    const { error: insertError } = await supabase.from("rsvps").insert({
      invite_id: invite.id,
      guest_name: finalName,
      attending,
      guest_count: attending ? guestCount : 0,
    });

    if (insertError) {
      setWarning("Something went wrong — please try again.");
      return;
    }

    setThankYouMsg(
      attending
        ? `Yay, ${finalName}! 🎉<br/>We can't wait to celebrate with you${guestCount > 1 ? ` and your ${guestCount - 1} guest(s)` : ""}.`
        : `We'll miss you, ${finalName}.<br/>Thank you for letting us know — sending you our love.`
    );
    setSubmitted(true);
  }

  const waText = encodeURIComponent(
    attending
      ? `Hi! It's ${name.trim() || "Friend"} — we are beyond excited and wouldn't miss it for the world! We'll be there${guestCount > 1 ? ` with ${guestCount} of us` : ""}, counting down the days already. Can't wait to celebrate this special day with you both! 🎉`
      : `Hi! It's ${name.trim() || "Friend"} — I'm so sorry we won't be able to make it this time. We're truly disappointed to miss it, but we'll be thinking of you and sending all our love on your special day 💔`
  );
  const waLink = invite.whatsapp_number ? `https://wa.me/${invite.whatsapp_number}?text=${waText}` : null;

  return (
    <>
      <style>{CSS}</style>

      <section id="hero">
        <div
          id="heroGroup"
          className={revealed ? "revealed" : ""}
          style={{ cursor: revealed ? "default" : "pointer" }}
          onClick={() => setRevealed(true)}
        >
          <StickerLayer stickers={HERO_STICKERS} />

          <div className="section-content">
            <div className="polaroid">
              <div className="polaroid-photo">
                {!revealed && (
                  <div className="tap-indicator">
                    <svg viewBox="0 0 40 40" fill="none" stroke="#4A3F35" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="20" cy="20" r="10" />
                      <circle cx="20" cy="20" r="3" fill="#4A3F35" stroke="none" />
                    </svg>
                  </div>
                )}
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={`${invite.host_names} as children`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
              </div>
              <p className="polaroid-caption">{invite.host_names}, once upon a time</p>
            </div>

            <p className={`tap-hint ${revealed ? "hidden" : ""}`}>go on, tap the photo</p>
            <p className={`reveal-message ${revealed ? "visible" : ""}`}>
              Just like this photo, you make our life colorful.
            </p>

            <h1 className="names script">{invite.host_names}</h1>
            <p className="tagline serif-caps">are getting married</p>

            <div className="scroll-hint">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#8B6B43" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8 L11 15 L18 8" />
              </svg>
              <span>scroll</span>
            </div>
          </div>
        </div>
      </section>

      <section id="rsvp">
        <StickerLayer stickers={RSVP_STICKERS} />
        <div className="section-content">
          <div className="card">
            <h2 className="script">RSVP</h2>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div className="rsvp-field">
                  <label htmlFor="guestName">Full name</label>
                  <input
                    type="text"
                    id="guestName"
                    required
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="toggle-row">
                  <button
                    type="button"
                    className={`toggle-btn ${attending === true ? "active" : ""}`}
                    onClick={() => {
                      setAttending(true);
                      setWarning("");
                    }}
                  >
                    Joyfully accept
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${attending === false ? "active" : ""}`}
                    onClick={() => {
                      setAttending(false);
                      setWarning("");
                    }}
                  >
                    Regretfully decline
                  </button>
                </div>

                <p className="rsvp-warning">{warning}</p>

                {attending && (
                  <div className="rsvp-field guest-field" style={{ display: "block" }}>
                    <label htmlFor="guestCount">Number of guests</label>
                    <input
                      type="number"
                      id="guestCount"
                      min={1}
                      max={10}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                    />
                  </div>
                )}

                <button type="submit" className="submit-btn">
                  Submit
                </button>
              </form>
            ) : (
              <div className="thank-you" style={{ display: "block" }}>
                <p dangerouslySetInnerHTML={{ __html: thankYouMsg }} />
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submit-btn"
                    style={{ display: "inline-block", textDecoration: "none", marginTop: "18px", background: "#25D366" }}
                  >
                    Confirm on WhatsApp too
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer>Invitation crafted with love</footer>
    </>
  );
}

const CSS = `
:root{
  --paper:        #EFE6D6;
  --paper-card:   #FBF6EC;
  --ink:          #4A3F35;
  --accent:       #8B6B43;
  --sage:         #8FA377;
  --olive:        #5F6B42;
  --moss:         #B7C08D;
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
*{ box-sizing: border-box; }
html{ scroll-behavior: smooth; }
body{
  margin: 0;
  background-color: var(--paper);
  background-image: var(--grain);
  background-attachment: fixed;
  color: var(--ink);
  font-family: 'Cormorant Garamond', serif;
  overflow-x: hidden;
  position: relative;
}
.script{ font-family: 'Caveat', cursive; font-weight: 700; color: var(--ink); line-height: 1; }
.serif-caps{ font-family: 'Cormorant Garamond', serif; letter-spacing: 0.35em; text-transform: uppercase; color: var(--accent); }
section{ position: relative; width: 100%; padding: 90px 24px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
#hero{ min-height: 100vh; padding-top: 60px; }
.stickers-layer{ position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.section-content{ position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; text-align: center; }
#heroGroup{
  filter: grayscale(1) sepia(0.35);
  transition: filter 0.9s ease;
  width: 100%; display: flex; flex-direction: column; align-items: center; cursor: pointer;
}
#heroGroup.revealed{ filter: grayscale(0) sepia(0); }
.polaroid{ background: #fff; padding: 8px 8px 46px; box-shadow: 0 14px 30px rgba(74,63,53,0.28); transform: rotate(-3deg); width: min(78vw, 340px); }
.polaroid-photo{ width: 100%; aspect-ratio: 1 / 1; background: var(--sage); display: block; position: relative; overflow: hidden; }
.tap-indicator{
  position: absolute; bottom: 10px; right: 10px; width: 56px; height: 56px; border-radius: 50%;
  background: var(--moss); display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(74,63,53,0.35); z-index: 3; animation: tap-pulse 1.5s ease-in-out infinite;
}
.tap-indicator svg{ width: 58%; height: 58%; }
.tap-indicator::after{
  content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 2px solid var(--ink);
  opacity: 0; animation: tap-ripple 1.5s ease-out infinite;
}
@keyframes tap-pulse{ 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes tap-ripple{ 0% { transform: scale(0.85); opacity: 0.55; } 100% { transform: scale(1.7); opacity: 0; } }
.polaroid-caption{ margin-top: 12px; text-align: center; font-family: 'Caveat', cursive; font-size: 1.3rem; color: var(--ink); }
.tap-hint{
  margin-top: 10px; text-align: center; font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 600;
  font-size: 1.05rem; letter-spacing: 0.02em; color: var(--ink); opacity: 1; animation: hint-pulse 1.8s ease-in-out infinite;
  transition: opacity 0.5s ease;
}
.tap-hint.hidden{ opacity: 0; animation: none; }
@keyframes hint-pulse{ 0%, 100% { opacity: 0.65; } 50% { opacity: 1; } }
.reveal-message{
  margin-top: 6px; max-width: 320px; text-align: center; font-family: 'Caveat', cursive; font-weight: 700;
  font-size: clamp(1.5rem, 4.5vw, 2rem); color: var(--ink); opacity: 0; transition: opacity 0.9s ease 0.25s;
}
.reveal-message.visible{ opacity: 1; }
.names{ font-size: clamp(3rem, 11vw, 5.5rem); margin: 34px 0 4px; }
.tagline{ font-size: clamp(0.75rem, 2.4vw, 1rem); margin: 0; }
.scroll-hint{ margin-top: 46px; display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--accent); animation: bob 2.2s ease-in-out infinite; }
.scroll-hint span{ font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.95rem; letter-spacing: 0.15em; }
@keyframes bob{ 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
.card{
  background-color: var(--paper-card); background-image: var(--grain); border-radius: 8px;
  box-shadow: 0 16px 34px rgba(74,63,53,0.18); padding: 46px 40px; width: min(90vw, 440px);
  transform: rotate(-0.6deg); border: 1px solid rgba(139,107,67,0.25);
}
.card h2{ font-family: 'Caveat', cursive; font-weight: 700; font-size: 3rem; margin: 0 0 22px; color: var(--ink); }
.detail-row{ margin-bottom: 18px; text-align: center; }
.detail-label{ font-family: 'Cormorant Garamond', serif; text-transform: uppercase; letter-spacing: 0.25em; font-size: 0.72rem; color: var(--accent); margin: 0 0 2px; }
.detail-value{ font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.4rem; margin: 0; color: var(--ink); }
.divider{ width: 70px; height: 1px; background: var(--accent); opacity: 0.5; margin: 22px auto; }
.map-button{
  display: inline-block; margin-top: 12px; padding: 12px 26px; border: 1.5px solid var(--ink); border-radius: 30px;
  color: var(--ink); text-decoration: none; font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 1.05rem; letter-spacing: 0.03em; transition: background 0.2s ease, color 0.2s ease;
}
.map-button:hover{ background: var(--ink); color: var(--paper-card); }
.rsvp-field{ margin-bottom: 20px; text-align: left; }
.rsvp-field label{ display: block; font-size: 0.78rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.rsvp-field input[type="text"], .rsvp-field input[type="number"]{
  width: 100%; padding: 10px 12px; font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-style: italic;
  color: var(--ink); background: transparent; border: none; border-bottom: 1.5px solid var(--accent); outline: none;
}
.rsvp-field input:focus{ border-bottom-color: var(--ink); }
.toggle-row{ display: flex; gap: 10px; margin-bottom: 20px; }
.toggle-btn{
  flex: 1; padding: 12px 8px; border: 1.5px solid var(--ink); border-radius: 30px; background: transparent;
  color: var(--ink); font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.95rem; cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.toggle-btn.active{ background: var(--ink); color: var(--paper-card); }
.rsvp-warning{ font-size: 0.85rem; font-style: italic; color: var(--accent); margin: -8px 0 16px; min-height: 1em; }
.submit-btn{
  width: 100%; padding: 14px; border: none; border-radius: 30px; background: var(--ink); color: var(--paper-card);
  font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.1rem; letter-spacing: 0.03em; cursor: pointer;
  transition: opacity 0.2s ease;
}
.submit-btn:hover{ opacity: 0.85; }
.thank-you{ font-family: 'Caveat', cursive; font-size: 2.1rem; line-height: 1.3; color: var(--ink); }
footer{ text-align: center; padding: 34px 20px 50px; font-style: italic; font-size: 0.85rem; color: var(--accent); }
.sticker{
  position: absolute; width: 74px; height: 74px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 14px rgba(74,63,53,0.22); pointer-events: none;
}
.sticker::after{
  content: ""; position: absolute; inset: 0; background-image: var(--grain); border-radius: inherit;
  mix-blend-mode: multiply; opacity: 0.5;
}
.sticker svg{ width: 62%; height: 62%; position: relative; z-index: 1; }
.sticker.sage{ background-color: var(--sage); }
.sticker.olive{ background-color: var(--olive); }
.sticker.moss{ background-color: var(--moss); }
.sticker.olive svg{ stroke: var(--paper-card); }
.sticker.torn-a{ border-radius: 42% 58% 61% 39% / 47% 44% 56% 53%; }
.sticker.torn-b{ border-radius: 58% 42% 47% 53% / 40% 62% 38% 60%; }
.sticker.torn-c{ border-radius: 50% 50% 38% 62% / 60% 40% 60% 40%; }
.sticker.torn-d{ border-radius: 63% 37% 55% 45% / 50% 55% 45% 50%; }
.sticker.washi{ width: 96px; height: 34px; border-radius: 4px; box-shadow: 0 4px 10px rgba(74,63,53,0.2); opacity: 0.92; }
@media (max-width: 640px){
  .sticker{ width: 52px; height: 52px; }
  .sticker.washi{ width: 72px; height: 26px; }
  .sticker.hide-mobile{ display: none; }
}
`;
