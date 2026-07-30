"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

// A card that behaves like a link (click anywhere to navigate) but is NOT
// an <a> itself — needed anywhere a card's contents might include a real
// <a> (e.g. ExpandPreviewButton), since nesting <a> inside <a> is invalid
// HTML and breaks hydration. Clicks on any nested <a>/<button> should call
// stopPropagation so they don't also trigger this card's navigation.
export default function ClickableCard({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(href);
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={handleKeyDown}
      className={className}
      style={{ cursor: "pointer", ...style }}
    >
      {children}
    </div>
  );
}
