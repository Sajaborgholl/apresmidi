import type { CSSProperties, ReactNode } from "react";

// The "Confirm on WhatsApp too" button every template shows after an RSVP.
// On a demo invite (public, opened by anyone browsing the site) it's shown
// but does nothing: there's no real host to message, and the demos' number
// isn't one to hand out. Same look, dimmed, with no link behind it.
export default function WhatsappConfirmLink({
  href,
  demo,
  className,
  style,
  children,
}: {
  href: string;
  demo: boolean | null | undefined;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (demo) {
    return (
      <span
        className={className}
        aria-disabled="true"
        title="Not available in the demo"
        style={{ ...style, opacity: 0.55, cursor: "default", pointerEvents: "none" }}
      >
        {children}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
      {children}
    </a>
  );
}
