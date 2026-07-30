"use client";

import { useEffect, useState } from "react";
import RsvpForm from "./RsvpForm";
import type { Invite } from "@/lib/types";

function useCountdown(target: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!target) return;
    const targetDate = new Date(target).getTime();

    function tick() {
      const diff = Math.max(0, targetDate - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
}

export default function WeddingClassic({ invite }: { invite: Invite }) {
  const countdown = useCountdown(invite.event_date);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const color = invite.primary_color || "#7A5C3E";
  const dateFormatted = invite.event_date
    ? new Date(invite.event_date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-[#FBF7F2] text-[#3a3a3a]">
      {invite.music_url && <audio id="bg-music" src={invite.music_url} loop />}

      <section className="text-center pt-20 pb-12 px-6">
        <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color }}>
          Together with their families
        </p>
        <h1 className="text-4xl md:text-6xl font-serif mb-4" style={{ color }}>
          {invite.host_names}
        </h1>
        <p className="text-lg">request the pleasure of your company</p>
        {dateFormatted && <p className="mt-2 text-sm text-gray-500">{dateFormatted}</p>}

        {invite.music_url && (
          <button
            onClick={() => {
              const audio = document.getElementById("bg-music") as HTMLAudioElement;
              if (!audio) return;
              if (musicPlaying) audio.pause();
              else audio.play();
              setMusicPlaying(!musicPlaying);
            }}
            className="mt-6 text-sm underline"
            style={{ color }}
          >
            {musicPlaying ? "🔇 Pause music" : "🔊 Play music"}
          </button>
        )}
      </section>

      {invite.event_date && (
        <section className="flex justify-center gap-4 md:gap-8 pb-14 px-4">
          {[
            { label: "Days", value: countdown.days },
            { label: "Hours", value: countdown.hours },
            { label: "Minutes", value: countdown.minutes },
            { label: "Seconds", value: countdown.seconds },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-xl md:text-2xl font-serif text-white"
                style={{ backgroundColor: color }}
              >
                {item.value}
              </div>
              <p className="text-xs mt-2 uppercase tracking-wide text-gray-500">{item.label}</p>
            </div>
          ))}
        </section>
      )}

      {invite.venue_name && (
        <section className="text-center pb-14 px-6">
          <h2 className="text-2xl font-serif mb-2" style={{ color }}>Venue</h2>
          <p className="mb-4">{invite.venue_name}</p>
          {invite.venue_map_url && (
            <div className="max-w-md mx-auto rounded-xl overflow-hidden shadow">
              <iframe
                src={invite.venue_map_url}
                width="100%"
                height="250"
                loading="lazy"
                style={{ border: 0 }}
              />
            </div>
          )}
        </section>
      )}

      {invite.photo_urls && invite.photo_urls.length > 0 && (
        <section className="pb-14 px-6">
          <h2 className="text-2xl font-serif text-center mb-6" style={{ color }}>Our Story</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {invite.photo_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="rounded-lg object-cover w-full h-40" />
            ))}
          </div>
        </section>
      )}

      <section className="pb-20 px-6">
        <h2 className="text-2xl font-serif text-center mb-6" style={{ color }}>RSVP</h2>
        <RsvpForm inviteId={invite.id} whatsappNumber={invite.whatsapp_number} />
      </section>

      <footer className="text-center text-xs text-gray-400 pb-8">
        Invitation crafted with ♥ — order yours
      </footer>
    </main>
  );
}
