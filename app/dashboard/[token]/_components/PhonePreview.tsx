"use client";

import { useState } from "react";

// The live invitation on a real phone-sized screen, scaled down — same idea
// as the customize page's preview, so the template renders its true mobile
// layout. A soft placeholder shows until the page inside has loaded.
const PHONE = { width: 390, height: 844 };

export default function PhonePreview({ src, scale = 0.66 }: { src: string; scale?: number }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-[34px] border-[7px] border-[var(--ink)] bg-[var(--cream)] shadow-[0_24px_60px_rgba(28,24,19,0.18)]"
      style={{ width: PHONE.width * scale + 14, height: PHONE.height * scale + 14 }}
    >
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[13px] text-[var(--ink)]/65">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--ink)]/15 border-t-[var(--ink)]/50" />
          Loading your invitation…
        </div>
      )}
      <iframe
        src={src}
        title="Live preview of your invitation"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          width: PHONE.width,
          height: PHONE.height,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          border: "none",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      />
    </div>
  );
}
