"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Info } from "@phosphor-icons/react";

// A small ⓘ that explains a number in plain words. Opens on hover with a
// mouse, on focus from the keyboard, and on tap on a touch screen (where
// there's no hover); closes on leave/blur, an outside tap or Escape.
export default function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  // How far to nudge the popover left so it keeps a 16px gutter from the
  // right edge of the screen (the ⓘ can sit far right on a narrow phone).
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    if (!open || !tip) return;
    function place() {
      // Measured against the un-nudged position (the current nudge comes off
      // first), and against clientWidth rather than innerWidth, which
      // includes the scrollbar and would let the popover slide under it.
      tip!.style.marginLeft = "0px";
      const overflow = tip!.getBoundingClientRect().right - (document.documentElement.clientWidth - 16);
      const next = Math.max(0, overflow);
      tip!.style.marginLeft = `${-next}px`;
      setShift(next);
    }
    place();
    // A phone rotating (or the window resizing) while it's open moves the ⓘ.
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
        // A tap also focuses the button, so this only ever opens, never
        // toggles — otherwise focus-then-click would open and shut at once.
        // Tapping anywhere else closes it (see the pointerdown listener).
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="-m-1 flex items-center justify-center rounded-full p-1 text-[var(--ink)]/35 transition hover:text-[var(--ink)]/70 focus-visible:text-[var(--ink)]/70 focus-visible:outline-2 focus-visible:outline-[var(--blue-dark)]"
      >
        <Info size={14} weight="bold" />
      </button>

      {/* Always rendered so it can fade out as well as in. Left-aligned to
          the icon, nudged left by `shift` when that would run off screen. */}
      <span
        ref={tipRef}
        id={id}
        role="tooltip"
        style={{ marginLeft: -shift }}
        className={`pointer-events-none absolute left-[-10px] top-full z-20 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-left text-[12.5px] font-normal leading-relaxed text-[var(--cream)] shadow-[0_12px_32px_-8px_rgba(44,37,29,0.35)] transition duration-150 ease-out motion-reduce:transition-none ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        {/* The arrow moves back by the same amount so it stays under the ⓘ. */}
        <span
          className="absolute -top-1 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-[var(--ink)]"
          style={{ left: 14 + shift }}
          aria-hidden="true"
        />
        {children}
      </span>
    </span>
  );
}
