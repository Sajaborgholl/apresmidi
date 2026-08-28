"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Monitor, DeviceMobile, Lock } from "@phosphor-icons/react";
import type { TemplateFieldManifest } from "@/lib/templates/registry";
import type { Invite } from "@/lib/types";
import { slugify } from "../_lib/slugify";
import CustomizeForm, { EMPTY_VALUES, type CustomizeValues } from "./CustomizeForm";
import { createOrder } from "../actions";

const FORM_ID = "customize-form";

// Owns the live state for the customize page: whatever's typed or picked
// on the right flows into the real template component on the left — but
// that component now renders inside an <iframe> (pointed at
// /order/[slug]/preview) rather than directly on this page. Templates
// each inject their own global <style> block assuming they're the only
// thing on the page, so rendering one inline here would leak its CSS out
// and repaint the real form and page chrome too — an iframe is its own
// document, so that CSS can't escape it. The draft data gets sent into
// the iframe via postMessage instead of passed as a normal prop.
//
// Submitting the form calls createOrder (a Server Action) directly with
// real, native browser form data — photo <input type="file"> fields
// aren't tracked in React state for submission purposes; the browser
// already holds those files and includes them automatically, the same
// way any plain HTML form works. Text fields are mirrored into React
// state purely so the live preview can react to them as you type.
export default function CustomizePanel({
  slug,
  category,
  fields,
  templateName,
  priceLabel,
}: {
  slug: string;
  category: string;
  fields: TemplateFieldManifest;
  templateName: string;
  priceLabel: string | null;
}) {
  const submitOrder = createOrder.bind(null, slug);
  const [values, setValues] = useState<CustomizeValues>(EMPTY_VALUES);
  const [photoPreviews, setPhotoPreviews] = useState<(string | undefined)[]>(
    Array.from({ length: fields.photoCount }, () => undefined)
  );
  const [previewReady, setPreviewReady] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleValueChange(name: keyof CustomizeValues, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhotoChange(index: number, file: File | null) {
    setPhotoPreviews((prev) => {
      const next = [...prev];
      // Local-only preview via a temporary browser URL — nothing is
      // uploaded anywhere until the form is actually submitted.
      next[index] = file ? URL.createObjectURL(file) : undefined;
      return next;
    });
  }

  // Shaped like a real Invite so the actual template component can render
  // it directly. Falls back to friendly placeholder text for the empty
  // script/heading fields so the preview doesn't look broken before
  // anything's been typed — this is preview-only convenience, not real
  // data, so it doesn't affect what actually gets submitted later.
  const draftInvite: Invite = useMemo(
    () => ({
      id: "preview",
      host_names: values.host_names || "Your Names",
      event_date: values.event_date || null,
      venue_name: values.venue_name || null,
      venue_map_url: values.venue_map_url || null,
      primary_color: null,
      photo_urls: photoPreviews.length > 0 ? photoPreviews.map((p) => p ?? "") : null,
      music_url: null,
      whatsapp_number: values.whatsapp_number || null,
    }),
    [values, photoPreviews]
  );

  // Only the predictable *base* half of the real slug — the server always
  // appends a random suffix (so the guest link can't be guessed from the
  // host names alone), which can't be known until the invite is actually
  // created. Updates live as the host names are typed, same slugify logic
  // the server action uses for the base portion.
  const baseSlugPreview = slugify(values.host_names) || "your-invite";

  // Listens for the preview iframe announcing it's mounted and ready.
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "preview-ready") {
        setPreviewReady(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Sends the latest draft into the iframe — on every change, but only
  // once it's confirmed it's ready to receive it.
  useEffect(() => {
    if (!previewReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "preview-update", invite: draftInvite },
      window.location.origin
    );
  }, [previewReady, draftInvite]);

  return (
    <div
      className="rounded-2xl border border-black/10 overflow-hidden bg-white"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)" }}
    >
      {/* ---------- Top chrome ---------- */}
      <div className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-black/10">
        <Link href={`/#occasion-${category}`} className="text-sm font-semibold transition hover:opacity-70">
          &#8592; Back
        </Link>

        <div className="flex gap-1 rounded-full bg-black/[0.05] p-1">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            title="Desktop preview"
            aria-label="Desktop preview"
            className={`flex h-8 w-9 items-center justify-center rounded-full transition active:scale-90 ${
              device === "desktop" ? "bg-white shadow-sm text-[var(--ink)]" : "text-[var(--ink)]/45"
            }`}
          >
            <Monitor size={17} weight="regular" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            title="Mobile preview"
            aria-label="Mobile preview"
            className={`flex h-8 w-9 items-center justify-center rounded-full transition active:scale-90 ${
              device === "mobile" ? "bg-white shadow-sm text-[var(--ink)]" : "text-[var(--ink)]/45"
            }`}
          >
            <DeviceMobile size={17} weight="regular" />
          </button>
        </div>

        <button
          type="submit"
          form={FORM_ID}
          className="rounded-full px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          Continue to payment
        </button>
      </div>

      {/* ---------- Live URL strip ---------- */}
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] text-[var(--ink)]/70 bg-[var(--blue-light)]/40 border-b border-black/[0.06]">
        <Lock size={13} weight="regular" className="opacity-55" />
        <span>Nothing&apos;s saved yet. Your link will be</span>
        <strong
          className="font-semibold text-[var(--ink)]"
          title="A few random characters are added when your invite is created, so guests can't guess someone else's link."
        >
          apresmidi.com/{baseSlugPreview}-••••••
        </strong>
      </div>

      {/* ---------- Main layout ---------- */}
      <div className="grid md:grid-cols-[minmax(0,2.3fr)_minmax(340px,1fr)]">
        <div className="relative flex items-center justify-center p-8 min-h-[600px]" style={{ background: "rgba(31,36,48,0.05)" }}>
          <span className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--yellow-dark)]" />
            Updating live
          </span>

          <div
            className={`overflow-hidden rounded-2xl bg-white shadow-[0_30px_70px_rgba(0,0,0,0.18)] transition-all ${
              device === "mobile" ? "w-[390px] h-[720px] max-h-[75vh]" : "w-full h-[75vh] max-w-[720px]"
            }`}
          >
            <iframe
              ref={iframeRef}
              src={`/order/${slug}/preview`}
              title="Live invite preview"
              className="h-full w-full"
            />
          </div>
        </div>

        <form id={FORM_ID} action={submitOrder} className="p-7">
          <h2 className="display text-lg font-bold">Customize your invite</h2>
          <p className="mb-6 mt-1 text-[13px] text-[var(--ink)]/55">
            {templateName}
            {priceLabel ? ` · ${priceLabel}` : ""}. Everything updates on the left as you type.
          </p>

          <CustomizeForm
            fields={fields}
            values={values}
            onValueChange={handleValueChange}
            photoPreviews={photoPreviews}
            onPhotoChange={handlePhotoChange}
          />
        </form>
      </div>
    </div>
  );
}
