"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Monitor, DeviceMobile, Lock, Eye, X } from "@phosphor-icons/react";
import type { TemplateFieldManifest } from "@/lib/templates/registry";
import type { Invite } from "@/lib/types";
import { slugify } from "../_lib/slugify";
import CustomizeForm, { EMPTY_VALUES, type CustomizeValues } from "./CustomizeForm";
import { createOrder } from "../actions";
import ReloadOnBfcacheRestore from "@/app/_components/ReloadOnBfcacheRestore";

const FORM_ID = "customize-form";

// Derived from the same NEXT_PUBLIC_SITE_URL that already drives every real
// link this app generates (actions.ts, confirmation/page.tsx, dashboard) —
// this is only ever a display preview of what the guest link will look
// like, but it must track the real domain, not a second hardcoded one that
// can silently drift out of sync when the domain changes (as the old
// literal "apresmidi.com" did once the real site moved to apresmidi.app).
const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://apresmidi.app").replace(/^https?:\/\//, "");

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
  // isPending covers the whole round trip — photo uploads to Supabase plus
  // the invite insert — which can take a few seconds now that photos can
  // be up to MAX_PHOTO_SIZE_MB each; both "Continue to payment" buttons
  // below (desktop top chrome + mobile sticky bar) read it to disable
  // themselves and show they're working instead of sitting there looking
  // clickable while nothing visibly happens.
  const [, formAction, isPending] = useActionState(createOrder.bind(null, slug), null);
  const [values, setValues] = useState<CustomizeValues>(EMPTY_VALUES);
  const [photoPreviews, setPhotoPreviews] = useState<(string | undefined)[]>(
    Array.from({ length: fields.photoCount }, () => undefined)
  );
  const [previewReady, setPreviewReady] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // Mobile only (see the `md:` overrides below, which put the preview back
  // into its normal docked position and ignore this entirely on larger
  // screens) — the live preview renders as a bottom sheet the customer
  // opens on demand, rather than a large fixed-height box sitting above
  // the form. Real device widths are already "mobile", so there's nothing
  // for the desktop/mobile preview toggle to do there either.
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
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
      className="rounded-2xl overflow-hidden bg-white"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)" }}
    >
      <ReloadOnBfcacheRestore />
      {/* ---------- Top chrome ---------- */}
      <div className="flex items-center justify-between gap-4 px-6 py-3.5">
        <Link href={`/#occasion-${category}`} className="text-sm font-semibold transition hover:opacity-70">
          &#8592; Back
        </Link>

        {/* Device toggle only makes sense on desktop — a real phone is
            already "mobile", so there's nothing for it to switch. */}
        <div className="hidden gap-1 rounded-full bg-black/[0.05] p-1 md:flex">
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

        {/* On mobile this moves into the sticky bottom bar instead (see
            below), alongside a "Preview" button — no room for it up here
            next to "Back" on a narrow screen. */}
        <button
          type="submit"
          form={FORM_ID}
          disabled={isPending}
          className="hidden rounded-full px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97] disabled:opacity-60 md:inline-flex"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          {isPending ? "Creating your invite…" : "Continue to payment"}
        </button>
      </div>

      {/* ---------- Live URL strip ---------- */}
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] text-[var(--ink)]/70 bg-[var(--blue-light)]/40">
        <Lock size={13} weight="regular" className="opacity-55" />
        <span>Nothing&apos;s saved yet. Your link will be</span>
        <strong
          className="font-semibold text-[var(--ink)]"
          title="A few random characters are added when your invite is created, so guests can't guess someone else's link."
        >
          {SITE_HOST}/{baseSlugPreview}-••••••
        </strong>
      </div>

      {/* ---------- Main layout ---------- */}
      <div className="grid md:grid-cols-[minmax(0,2.3fr)_minmax(340px,1fr)]">
        {/* Backdrop for the mobile preview sheet — desktop never shows it
            (the preview is always visible there, docked in its own
            column), so this only renders/matters below md. */}
        {previewSheetOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setPreviewSheetOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Docked side-by-side panel on desktop; a bottom sheet the
            customer opens on demand on mobile (see previewSheetOpen) —
            same iframe/ref either way, just repositioned by breakpoint, so
            there's only ever one live preview instance to keep in sync. */}
        <div
          className={`order-preview-sheet fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col rounded-t-3xl bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out ${
            previewSheetOpen ? "is-open" : ""
          } md:relative md:z-auto md:flex md:h-auto md:min-h-[600px] md:flex-row md:items-center md:justify-center md:rounded-none md:bg-[rgba(31,36,48,0.05)] md:p-8 md:shadow-none md:transition-none`}
        >
          {/* Mobile-only sheet header (close button) — desktop shows the
              "Updating live" badge as a floating pill instead, below. */}
          <div className="flex items-center justify-between px-5 py-4 md:hidden">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--yellow-dark)]" />
              Updating live
            </span>
            <button
              type="button"
              onClick={() => setPreviewSheetOpen(false)}
              aria-label="Close preview"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] transition active:scale-90"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <span className="absolute left-5 top-5 hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold shadow md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--yellow-dark)]" />
            Updating live
          </span>

          <div
            className={`flex-1 overflow-hidden bg-white transition-all md:flex-none md:rounded-2xl md:shadow-[0_30px_70px_rgba(0,0,0,0.18)] ${
              device === "mobile" ? "md:w-[390px] md:h-[720px] md:max-h-[75vh]" : "md:w-full md:h-[75vh] md:max-w-[720px]"
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

        <form id={FORM_ID} action={formAction} className="p-7 pb-28 md:pb-7">
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

      {/* Sticky mobile action bar — replaces the top chrome's "Continue"
          button (hidden below md) and gives the on-demand preview sheet
          its entry point. Sits at the same fixed bottom edge as the sheet
          above; opening the sheet visually covers this since the sheet is
          both taller and higher z-index. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 flex gap-2 bg-white p-3 md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => setPreviewSheetOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black/5 py-3 text-sm font-semibold transition active:scale-[0.97]"
        >
          <Eye size={16} weight="regular" />
          Preview
        </button>
        <button
          type="submit"
          form={FORM_ID}
          disabled={isPending}
          className="flex-[1.4] rounded-full py-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          {isPending ? "Creating…" : "Continue to payment"}
        </button>
      </div>
    </div>
  );
}
