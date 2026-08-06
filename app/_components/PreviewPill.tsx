"use client";

// The "Preview" pill shown on an occasion card's hover overlay. Needs to be
// its own Client Component (like ExpandPreviewButton) because it carries an
// onClick handler — Server Components (page.tsx) can't attach event
// handlers directly to JSX they return. stopPropagation keeps this link's
// click from also triggering the parent ClickableCard's own navigation to
// the customize page.
export default function PreviewPill({ slug }: { slug: string }) {
  return (
    <a
      href={`/i/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="rounded-full px-5 py-2 text-sm font-medium border"
      style={{ borderColor: "var(--cream)", color: "var(--cream)" }}
    >
      Preview
    </a>
  );
}
