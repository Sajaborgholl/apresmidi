"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTemplateBySlug } from "@/lib/templates/registry";
import type { Invite } from "@/lib/types";

// Loaded inside an <iframe> by CustomizePanel, on purpose — it's its own
// separate document, so a template's embedded <style> (which targets bare
// tags like body/input/label, assuming it's the only thing on the page)
// can never leak out and repaint the real customize page around it. This
// page has no data of its own; the parent posts the current draft invite
// into it as the person types, and it just re-renders the real template
// component with whatever it's given.
export default function CustomizePreviewPage() {
  const params = useParams<{ slug: string }>();
  const [invite, setInvite] = useState<Invite | null>(null);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "preview-update") {
        setInvite(e.data.invite as Invite);
      }
    }
    window.addEventListener("message", handleMessage);

    // Tell the parent we're mounted and listening — it waits for this
    // before sending anything, so the very first draft doesn't get sent
    // into the void before this page is ready to receive it.
    window.parent.postMessage({ type: "preview-ready" }, window.location.origin);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const entry = getTemplateBySlug(params.slug as string);
  if (!entry) return null;

  if (!invite) {
    return <p style={{ padding: 24, fontFamily: "sans-serif", color: "#999" }}>Loading preview…</p>;
  }

  const TemplateComponent = entry.component;
  return <TemplateComponent invite={invite} />;
}
