"use client";

import { useRef, useState } from "react";
import HeroPreview from "./HeroPreview";

export type CarouselTemplate = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  // Real pre-recorded clip, e.g. "/videos/wedding-classic.mp4". Takes
  // priority over demoSlug below when both exist.
  video_url: string | null;
  // Same "is_demo" live invite the template detail page and the occasion
  // cards use — fallback for templates that don't have a real video file
  // yet, so playing still embeds something real via HeroPreview.
  demoSlug: string | null;
};

const CARD_COLORS = ["var(--blue)", "var(--yellow)", "var(--blue-light)"];

export default function HeroCarousel({ templates }: { templates: CarouselTemplate[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (templates.length === 0) {
    return (
      <div
        className="flex h-56 items-center justify-center rounded-3xl md:h-72"
        style={{ background: "rgba(31,36,48,0.06)", border: "1px dashed rgba(31,36,48,0.25)" }}
      >
        <span className="text-sm font-medium opacity-50">Templates coming soon</span>
      </div>
    );
  }

  const n = templates.length;
  const prevIndex = (currentIndex - 1 + n) % n;
  const nextIndex = (currentIndex + 1) % n;
  const center = templates[currentIndex];
  const canPlay = Boolean(center.video_url || center.demoSlug);

  function goTo(index: number) {
    setCurrentIndex(index);
    setPlaying(false);
  }

  function togglePlay() {
    if (center.video_url) {
      const el = videoRef.current;
      if (!el) return;
      if (playing) {
        el.pause();
      } else {
        el.play();
      }
    }
    setPlaying((p) => !p);
  }

  return (
    <div className="relative h-56 overflow-hidden md:h-72">
      <div className="absolute inset-0 flex items-center justify-center gap-4">
        {n > 1 && (
          <CarouselSide template={templates[prevIndex]} color={CARD_COLORS[prevIndex % CARD_COLORS.length]} />
        )}

        <div
          className="relative h-56 w-96 flex-shrink-0 overflow-hidden rounded-3xl md:h-72 md:w-[32rem]"
          style={{ background: CARD_COLORS[currentIndex % CARD_COLORS.length] }}
          // While playing, the round play/pause button is hidden entirely
          // (see below) so it doesn't sit over the preview — the whole
          // card becomes the tap target to pause instead.
          onClick={canPlay && playing ? togglePlay : undefined}
        >
          {center.video_url ? (
            <video
              key={center.id}
              ref={videoRef}
              src={center.video_url}
              poster={center.thumbnail_url ?? undefined}
              loop
              playsInline
              onEnded={() => setPlaying(false)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : playing && center.demoSlug ? (
            <HeroPreview slug={center.demoSlug} />
          ) : (
            center.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={center.thumbnail_url}
                alt={center.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )
          )}

          {canPlay && !playing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label="Play preview"
              className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition hover:scale-105"
              style={{ background: "var(--ink)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--cream)">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>

        {n > 1 && (
          <CarouselSide template={templates[nextIndex]} color={CARD_COLORS[nextIndex % CARD_COLORS.length]} />
        )}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(prevIndex)}
            aria-label="Previous template"
            className="absolute top-1/2 left-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition hover:scale-105 active:scale-95"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={() => goTo(nextIndex)}
            aria-label="Next template"
            className="absolute top-1/2 right-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition hover:scale-105 active:scale-95"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            &#8250;
          </button>
        </>
      )}
    </div>
  );
}

function CarouselSide({ template, color }: { template: CarouselTemplate; color: string }) {
  return (
    <div
      className="relative hidden h-44 w-20 flex-shrink-0 overflow-hidden rounded-3xl sm:block md:h-56 md:w-28"
      style={{ background: color }}
    >
      {template.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={template.thumbnail_url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
