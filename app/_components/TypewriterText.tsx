"use client";

import { useEffect, useRef, useState } from "react";

// Types `text` out character-by-character once it scrolls into view, using
// the same IntersectionObserver approach as Reveal. Screen readers get the
// full text immediately via a visually-hidden duplicate; prefers-reduced-motion
// skips the animation and shows the full text right away.
export default function TypewriterText({
  text,
  className = "",
  speed = 28,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  speed?: number;
  startDelay?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        let i = 0;
        const tick = () => {
          i += 1;
          setDisplayed(text.slice(0, i));
          if (i < text.length) {
            timeoutRef.current = window.setTimeout(tick, speed);
          } else {
            setDone(true);
          }
        };
        timeoutRef.current = window.setTimeout(tick, startDelay);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutRef.current);
    };
  }, [text, speed, startDelay]);

  return (
    <p ref={ref} className={className}>
      <span aria-hidden="true">
        {displayed}
        <span className={`typewriter-cursor ${done ? "typewriter-cursor-done" : ""}`}>|</span>
      </span>
      <span className="sr-only">{text}</span>
    </p>
  );
}
