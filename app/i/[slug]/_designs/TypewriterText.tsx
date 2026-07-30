"use client";

import { useEffect, useRef, useState } from "react";

// Types `text` out one character at a time, starting once it scrolls into
// view (rather than instantly on page load, since several of this
// template's headings sit below the fold). Renders a blinking cursor while
// typing, which disappears once the text is fully revealed. Wrap it in
// whatever heading tag you want, e.g. <h1><TypewriterText text="..." /></h1>,
// rather than it rendering its own tag.
export default function TypewriterText({
  text,
  speed = 55,
}: {
  text: string;
  speed?: number;
}) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || visibleChars >= text.length) return;
    const timeout = setTimeout(() => setVisibleChars((c) => c + 1), speed);
    return () => clearTimeout(timeout);
  }, [started, visibleChars, text, speed]);

  const done = visibleChars >= text.length;

  return (
    <span ref={ref}>
      {text.slice(0, visibleChars)}
      <span className={`typewriter-cursor${done ? " done" : ""}`} aria-hidden="true" />
    </span>
  );
}
