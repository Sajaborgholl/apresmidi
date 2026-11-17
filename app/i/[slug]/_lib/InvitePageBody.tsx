import Link from "next/link";
import type { TemplateEntry } from "@/lib/templates/registry";
import type { Invite } from "@/lib/types";
import type { InviteGuest } from "@/lib/guestRules";

// The invitation page's body: the template plus the page's own credit line.
// Shared by the general link (/i/<slug>), a guest's personal link and the
// customize preview of templates whose preview is the full guest page
// (TemplateEntry.fullPreview). Kept free of server-only imports so the
// customize preview (a client page) can use it.

export function InvitePageBody({
  invite,
  template,
  embedded,
  guest,
}: {
  invite: Invite;
  template: TemplateEntry;
  embedded: boolean;
  guest: InviteGuest | null;
}) {
  const TemplateComponent = template.component;
  // min-height: 100vh + the template's own background color, so if the
  // rendered page is shorter than the viewport it's embedded in (e.g. the
  // homepage's scaled-up preview iframe), the leftover space blends with
  // this template instead of showing the site's own (dark-mode-capable)
  // background.
  return (
    <div style={{ minHeight: "100vh", background: template.previewBackground }}>
      {/* Demos are public showcases: stop phone browsers (iPhone Safari above
          all) from turning numbers on the page into tappable call links.
          React hoists this into <head>. Real invites are left as they are. */}
      {invite.is_demo && <meta name="format-detection" content="telephone=no" />}
      <TemplateComponent invite={invite} embedded={embedded} guest={guest} />
      {/* One small credit, the same on every design (the designs no longer
          have their own footers). Not inside previews (dashboard phone,
          homepage cards). A <p>, not <footer>: some designs style bare
          footer tags. Inline styles so no design's CSS can reach it. */}
      {!embedded && (
        <p
          style={{
            margin: 0,
            padding: "28px 16px 36px",
            textAlign: "center",
            font: "500 11px/1.4 Inter, system-ui, sans-serif",
            letterSpacing: "0.04em",
            color: "rgba(44,37,29,0.55)",
          }}
        >
          Made with{" "}
          <Link href="/" style={{ color: "inherit", fontWeight: 700, textDecoration: "none" }}>
            Après-midi
          </Link>
        </p>
      )}
    </div>
  );
}
