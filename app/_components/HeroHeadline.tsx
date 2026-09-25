"use client";

import { useEffect, useRef, useState } from "react";

// The homepage headline, with its three words sliding in from alternating
// sides once it scrolls into view: Invitations from the left, worth from the
// right, opening from the left again.
//
// Same mechanism as Reveal — one IntersectionObserver plus a CSS transition,
// no animation library — but it cannot reuse that component. Reveal wraps its
// children in a <div>, and here "worth" and "opening" share a line, so each
// word has to be its own inline-block inside the <h1> rather than a block
// wrapper. The directions and the overshoot live in globals.css (.word-in*),
// which is also where the reduced-motion opt-out is, so it holds even before
// this hydrates.
export default function HeroHeadline() {
  const ref = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // The negative bottom margin is what holds the words back: it trims the
      // observed area up from the foot of the viewport, so the headline has to
      // climb well clear of the bottom edge before it counts as on screen.
      // Done this way rather than by raising the threshold, because a
      // threshold is a fraction of the element — it would mean something
      // different at every breakpoint, since this headline is clamp()ed from
      // 3rem to 9rem — while this is a fraction of the screen and behaves the
      // same everywhere.
      { threshold: 0.15, rootMargin: "0px 0px -28% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Staggered so the three arrivals read as a sequence rather than one move.
  const word = (dir: "left" | "right", delay: number) => ({
    className: `word-in word-in-${dir}${visible ? " word-in-visible" : ""}`,
    style: delay ? { transitionDelay: `${delay}ms` } : undefined,
  });

  const worth = word("right", 110);

  return (
    <h1
      ref={ref}
      className="display font-bold leading-[0.85] tracking-tight select-none"
      style={{ fontSize: "clamp(3rem,10vw,9rem)" }}
    >
      <span className="block">
        <span {...word("left", 0)}>Invitations</span>
      </span>
      <span className="block -mt-2 md:-mt-6" style={{ marginLeft: "8%" }}>
        {/* Set like "included" in FeatureShowcase's "Everything's included":
            Caveat at regular weight, normal tracking, 1.25x its display-face
            neighbour. All four are needed, not just the family — this span
            otherwise inherits the h1's bold and tight tracking, which turn
            Caveat chunky and crowded. The 1.25 is that heading's own measured
            script-to-display ratio; Caveat is a compact handwriting face and
            reads noticeably smaller than Space Grotesk at the same size. In em
            so it tracks the h1's clamp() at every width.

            Line height is deliberately left as the h1's own, and the second
            line grows about 22px to fit the word. That growth is the point:
            Caveat's ascenders run taller than Space Grotesk's, so the "h" and
            "t" need the room. Pinning the line to its old height was tried
            and puts them straight into "Invitations" above — measured at 232
            overlapping pixels, against 26 in the original bold design and 12
            with the natural height. Leaving it to the browser also means the
            clearance comes from the real font metrics at every width, where a
            pinned value would only be right at one. */}
        <span
          {...worth}
          className={`${worth.className} script font-normal tracking-normal`}
          style={{ ...worth.style, color: "var(--blue-dark)", fontSize: "1.25em" }}
        >
          worth
        </span>{" "}
        <span {...word("left", 220)}>opening</span>
      </span>
    </h1>
  );
}
