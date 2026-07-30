"use client";

// Small "view full page" affordance placed in the top-right corner of a
// HeroPreview box. Opens the real invite page in a new tab so visitors can
// look at it in full without losing the homepage. Sits as a sibling of the
// iframe (not the iframe itself), so it stays clickable even though the
// iframe below it has pointer-events disabled. stopPropagation keeps its
// click from also triggering a parent ClickableCard's own navigation.
export default function ExpandPreviewButton({ slug }: { slug: string }) {
  return (
    <a
      href={`/i/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View full invitation"
      onClick={(e) => e.stopPropagation()}
      className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow transition hover:scale-105"
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(2px)" }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--ink)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </a>
  );
}
