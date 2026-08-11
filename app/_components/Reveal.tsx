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
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
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
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {};

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}
