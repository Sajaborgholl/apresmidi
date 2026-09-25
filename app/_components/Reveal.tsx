"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

// Lightweight scroll-reveal: fades + lifts content in once it enters the
// viewport. Deliberately IntersectionObserver + CSS transition (no motion
// library) since this is the only scroll effect on the page — pulling in a
// whole animation package for one fade would be overkill. Reduced-motion
// fallback lives in globals.css (.reveal), not here, so it applies even if
// JS is slow to hydrate.
export default function Reveal({
  children,
  className = "",
  delay = 0,
  rootMargin,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  // Shrinks the area that counts as "on screen", so the reveal can be held
  // until the content is properly in view rather than firing the moment it
  // clears the bottom edge. A fraction of the screen, unlike threshold, which
  // is a fraction of the element and so means something different for a short
  // caption and a tall collage. Optional: omitted, this behaves exactly as it
  // always has, so existing callers are untouched.
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold: 0.15, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // rootMargin is part of how the observer is built, so a change to it has
    // to rebuild the observer rather than be silently ignored.
  }, [rootMargin]);

  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {};

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}
