"use client";

import { useState } from "react";
import HeroPreview from "./HeroPreview";

export type CarouselTemplate = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  // Reuses the same "is_demo" live invite the template detail page and the
  // occasion cards already use — playing a carousel card embeds that real
  // invite (via HeroPreview) instead of a pre-recorded video, since no
  // video_url column/files exist yet. Swapping in a real <video> later only
  // means changing what renders in the "playing" branch below.
  demoSlug: string | null;
};

const CARD_COLORS = ["var(--blue)", "var(--yellow)", "var(--blue-light)"];

export default function HeroCarousel({ templates }: { templates: CarouselTemplate[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

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

  function goTo(index: number) {
    setCurrentIndex(index);
    setPlaying(false);
  }

  return (
    <div className="relative h-56 overflow-hidden md:h-72">
      <div className="absolute inset-0 flex items-center justify-center gap-4">
        {n > 1 && (
          <CarouselSide template={templates[prevIndex]} color={CARD_COLORS[prevIndex % CARD_COLORS.length]} />
        )}

        <div
          className="relative h-56 w-56 flex-shrink-0 overflow-hidden rounded-3xl md:h-72 md:w-72"
          style={{ background: CARD_COLORS[currentIndex % CARD_COLORS.length] }}
        >
          {playing && center.demoSlug ? (
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

          {center.demoSlug && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause preview" : "Play preview"}
              className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition hover:scale-105"
              style={{ background: "var(--ink)" }}
            >
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--cream)">
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--cream)">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}

          <span
            className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium"
            style={{ background: "var(--cream)", color: "var(--ink)" }}
          >
            {center.name}
          </span>
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
            className="absolute top-1/2 left-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition hover:scale-105"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={() => goTo(nextIndex)}
            aria-label="Next template"
            className="absolute top-1/2 right-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition hover:scale-105"
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
        <img src={template.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  );
}
