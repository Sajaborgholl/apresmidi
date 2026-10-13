"use client";

import { useEffect, useRef, useState } from "react";
import { BOW_VIEWBOX, KNOT_X, LOOPS_PATH, RIBBON_CLIP, RIBBON_PATH } from "./bowGateArt";

// Blush Bow's opening: guests land on the invitation blurred, with the bow
// artwork (bowGateArt.ts) across the screen. Tapping it cuts the ribbon at
// the knot: the two halves — each one unbroken piece of loop + ribbon +
// extension — slowly droop from their outer ends and fall away, while the
// blur fades out, bringing the invitation into focus. onOpen fires once
// it's fully clear.
//
// Smoothness: only transform and opacity animate. The blur itself is a
// fixed backdrop-filter on one layer; fading that layer's opacity is what
// "un-blurs" the page, instead of re-blurring the whole page every frame.

// The blur layer finishes fading at ~2.4s. onOpen normally fires from its
// transitionend; this is the fallback if that event never arrives (e.g.
// reduced motion, a hidden tab).
const OPEN_FALLBACK_MS = 2800;

// One half of the bow: the artwork clipped to its side of the knot (its
// ribbon and its loop together), plus the ink line carrying the ribbon on to
// that screen edge. The whole half moves as one piece.
function BowHalf({ side, onOpen }: { side: "l" | "r"; onOpen: () => void }) {
  const clipId = `bg-clip-${side}`;
  const ribbonClipId = `bg-clip-ribbon-${side}`;
  return (
    <div className={`bg-half bg-half-${side}`} aria-hidden="true">
      {side === "l" ? (
        <svg className="bg-ext bg-ext-l" viewBox="0 0 100 40" preserveAspectRatio="none" onClick={onOpen}>
          <path d="M100,10 C97,22 90,30 75,30 C50,30 28,26 0,28" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        <svg className="bg-ext bg-ext-r" viewBox="0 0 100 24" preserveAspectRatio="none" onClick={onOpen}>
          <path d="M0,12 C20,12.5 45,15 70,13 C85,12 95,11 100,11.5" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <svg className="bg-art" viewBox={BOW_VIEWBOX}>
        <defs>
          <clipPath id={clipId}>
            {side === "l" ? (
              <rect x="0" y="0" width={KNOT_X} height="85.5" />
            ) : (
              <rect x={KNOT_X} y="0" width={291.75 - KNOT_X} height="85.5" />
            )}
          </clipPath>
          <clipPath id={ribbonClipId}>
            <path d={RIBBON_CLIP} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <path d={RIBBON_PATH} clipPath={`url(#${ribbonClipId})`} />
          <g className="bg-loop">
            <path d={LOOPS_PATH} />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function BowGate({ hostNames, onOpen }: { hostNames: string; onOpen: () => void }) {
  const [opening, setOpening] = useState(false);
  const bowRef = useRef<HTMLButtonElement>(null);
  const done = useRef(false);

  function finish() {
    if (done.current) return;
    done.current = true;
    onOpen();
  }

  function untie() {
    if (opening) return;
    setOpening(true);
    setTimeout(finish, OPEN_FALLBACK_MS);
  }

  // While the gate is up: no scrolling the page behind it, the bow has
  // keyboard focus (Enter/Space press it), and Escape opens it too.
  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    bowRef.current?.focus({ preventScroll: true });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") bowRef.current?.click();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      className={`bg-gate${opening ? " bg-opening" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Invitation from ${hostNames} — untie the bow to open`}
    >
      <style>{CSS}</style>
      {/* Without JavaScript the bow can't be untied, so don't show the gate. */}
      <noscript>
        <style>{".bg-gate{display:none!important}"}</style>
      </noscript>

      <div
        className="bg-blur"
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "opacity") finish();
        }}
      />

      <BowHalf side="l" onOpen={untie} />
      <BowHalf side="r" onOpen={untie} />

      {/* An invisible button over the bow: the click/tap and keyboard target
          (focused on load, so Enter/Space/Escape open it). */}
      <button ref={bowRef} type="button" className="bg-bow" onClick={untie} aria-label="Untie the bow to open the invitation" />
    </div>
  );
}

const CSS = `
/* --bow-w: the artwork's width. Everything that has to line up with the
   artwork (the ribbon extensions) is worked out from it, in the artwork's
   own 291.75 x 85.5 units. */
.bg-gate { position: fixed; inset: 0; z-index: 1000; --bow-w: min(640px, 86vw); }

/* The blur over the invitation, with a light blush tint. Fading this layer's
   opacity is the "un-blur". */
.bg-blur {
  position: absolute; inset: 0;
  background: rgba(246, 201, 211, 0.35);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  transition: opacity 1.9s ease .5s;
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .bg-blur { background: rgba(246, 201, 211, 0.96); }
}
.bg-opening .bg-blur { opacity: 0; }

/* Shared geometry, all from --bow-w (W): the artwork sits centred, its
   top-left corner at (50% - W/2, 50% - H/2) with H = W x 85.5/291.75. */
.bg-art, .bg-bow {
  position: absolute; left: 50%; top: 50%;
  width: var(--bow-w); aspect-ratio: 291.75 / 85.5;
  transform: translate(-50%, -50%);
}
.bg-art { overflow: visible; }
.bg-art path { fill: #1c1c1c; }

/* The click/focus target over the bow — invisible, no focus box. */
.bg-bow {
  z-index: 2; padding: 0; border: 0; background: none; cursor: pointer;
  outline: none; -webkit-tap-highlight-color: transparent;
}

/* The loops breathe very gently while waiting. Once tapped, each loop moves
   with its half — never on its own. */
.bg-loop { transform-box: view-box; transform-origin: ${KNOT_X}px 20px; animation: bg-breathe 3.2s ease-in-out infinite; }
.bg-opening .bg-loop { animation: none; }

/* Each half is a full-screen layer pivoting from its outer end — where the
   ribbon meets the screen edge — at the ribbon's height. */
.bg-half { position: absolute; inset: 0; pointer-events: none; }
.bg-half-l { transform-origin: 0 calc(50% - var(--bow-w) * 85.5 / 291.75 / 2 + var(--bow-w) * 42.3 / 291.75); }
.bg-half-r { transform-origin: 100% calc(50% - var(--bow-w) * 85.5 / 291.75 / 2 + var(--bow-w) * 48.1 / 291.75); }
.bg-half .bg-ext { pointer-events: auto; }

/* Ribbon extensions out to the screen edges. Left tail tip: (2.4, 42.3)
   units, curling down-left; right tail tip: (289.4, 48.1), running flat.
   Each strip overlaps its tip by 1.5 units so the join is seamless, and the
   stroke matches the tails' thickness (~2.2 units). */
.bg-ext { position: absolute; overflow: visible; cursor: pointer; }
.bg-ext path { fill: none; stroke: #1c1c1c; stroke-linecap: round; stroke-width: calc(var(--bow-w) * 0.0075); }
.bg-ext-l {
  left: 0; height: 40px;
  width: calc(50% - var(--bow-w) / 2 + var(--bow-w) * 3.9 / 291.75);
  /* the tip sits at y=10 of this 40px strip */
  top: calc(50% - var(--bow-w) * 85.5 / 291.75 / 2 + var(--bow-w) * 42.3 / 291.75 - 10px);
}
.bg-ext-r {
  right: 0; height: 24px;
  width: calc(50% - var(--bow-w) / 2 + var(--bow-w) * 3.85 / 291.75);
  /* the tip sits at y=11.5 of this 24px strip */
  top: calc(50% - var(--bow-w) * 85.5 / 291.75 / 2 + var(--bow-w) * 48.1 / 291.75 - 11.5px);
}
/* Phones: the artwork itself spans the screen (102%, so both tips sit just
   past the edges) — no extensions needed. */
@media (max-width: 640px) {
  .bg-gate { --bow-w: 102vw; }
  .bg-ext { display: none; }
}

/* The cut: each half slowly droops from its outer end, then drifts down and
   away, fading — mirror images, one smooth movement. */
.bg-opening .bg-half-l { animation: bg-fall-l 2.4s cubic-bezier(.45, 0, .25, 1) forwards; }
.bg-opening .bg-half-r { animation: bg-fall-r 2.4s cubic-bezier(.45, 0, .25, 1) forwards; }

@keyframes bg-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
@keyframes bg-fall-l {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  35% { transform: translateY(2vh) rotate(14deg); opacity: 1; }
  100% { transform: translateY(70vh) rotate(22deg); opacity: 0; }
}
@keyframes bg-fall-r {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  35% { transform: translateY(2vh) rotate(-14deg); opacity: 1; }
  100% { transform: translateY(70vh) rotate(-22deg); opacity: 0; }
}

/* Reduced motion: no droop or fall — both halves and the blur just fade. */
@media (prefers-reduced-motion: reduce) {
  .bg-loop { animation: none; }
  .bg-opening .bg-half-l, .bg-opening .bg-half-r { animation: none; }
  .bg-half { transition: opacity .5s ease; }
  .bg-opening .bg-half { opacity: 0; }
  .bg-blur { transition: opacity .5s ease; }
}
`;
