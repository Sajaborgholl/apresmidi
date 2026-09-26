"use client";

import { useEffect, useRef, useState } from "react";

export type CarouselTemplate = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  // Pre-recorded clip, e.g. "/videos/wedding-classic.mp4". Required: the
  // homepage only passes templates that have one (see page.tsx).
  video_url: string;
};

const CARD_COLORS = ["var(--blue)", "var(--yellow)", "var(--blue-light)"];

export default function HeroCarousel({ templates }: { templates: CarouselTemplate[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (templates.length === 0) {
    return (
      <div
        className="flex h-56 items-center justify-center rounded-3xl md:h-80"
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

  return (
    <div className="relative h-56 overflow-hidden md:h-80">
      <div className="absolute inset-0 flex items-center justify-center gap-4">
        {n > 1 && (
          <CarouselSide template={templates[prevIndex]} color={CARD_COLORS[prevIndex % CARD_COLORS.length]} />
        )}

        <div
          // w-full below sm: the side cards are hidden there, and a fixed
          // w-96 (384px) was wider than a phone's content area, so about 29px
          // was cut off each side, rounded corners included.
          className="relative h-56 w-full flex-shrink-0 overflow-hidden rounded-3xl sm:w-96 md:h-80 md:w-[36rem]"
          style={{ background: CARD_COLORS[currentIndex % CARD_COLORS.length] }}
        >
          {/* key remounts the clip on every next/previous, so each template
              starts from its first frame and sets up its own playback. */}
          <LoopingVideo
            key={center.id}
            src={center.video_url}
            poster={center.thumbnail_url}
            label={`${center.name} preview`}
          />
        </div>

        {n > 1 && (
          <CarouselSide template={templates[nextIndex]} color={CARD_COLORS[nextIndex % CARD_COLORS.length]} />
        )}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex(prevIndex)}
            aria-label="Previous template"
            className="absolute top-1/2 left-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition hover:scale-105 active:scale-95"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex(nextIndex)}
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

// A template clip that plays on its own and loops like a GIF, with no play
// button — until the carousel moves on and unmounts it.
//
// Playback is started from the effect rather than the autoPlay attribute, on
// purpose:
//  - React does not reliably write `muted` as an attribute on first render,
//    and iOS refuses to autoplay anything it does not see as muted. Setting the
//    property right before play() avoids that.
//  - It lets reduced-motion visitors get the first frame, still. With the
//    attribute, the loop would already be running before JS could stop it.
//
// It also only plays while on screen. A loop nobody can see is decoding for
// nothing, and on phones this card shares the pinned section with the envelope
// scrub, which needs that headroom.
function LoopingVideo({ src, poster, label }: { src: string; poster: string | null; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.muted = true;
    const observer = new IntersectionObserver(([entry]) => {
      // play() rejects if the browser declines; the first frame then stays
      // on screen, which is the right fallback, so the rejection is dropped.
      if (entry.isIntersecting) el.play().catch(() => {});
      else el.pause();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      muted
      loop
      playsInline
      preload="auto"
      aria-label={label}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function CarouselSide({ template, color }: { template: CarouselTemplate; color: string }) {
  return (
    <div
      className="relative hidden h-44 w-20 flex-shrink-0 overflow-hidden rounded-3xl sm:block md:h-64 md:w-32"
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
