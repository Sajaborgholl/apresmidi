import type { ComponentType } from "react";
import type { Invite } from "@/lib/types";
import WeddingClassic from "@/app/i/[slug]/_designs/WeddingClassic";
import WeddingScrapbook from "@/app/i/[slug]/_designs/WeddingScrapbook";
import WeddingBlushBow from "@/app/i/[slug]/_designs/WeddingBlushBow";
import BacheloretteCoastal from "@/app/i/[slug]/_designs/BacheloretteCoastal";

// Moved here from app/i/[slug]/_designs/registry.ts: this used to be
// "page-only" code for the invite-rendering route, but the customize page
// (app/order/[slug]) now needs to read it too — to know which fields to
// show per template — so it's genuinely cross-page now, same as
// lib/supabase.ts and lib/types.ts. The actual template *components*
// still live under app/i/[slug]/_designs/, since rendering an invite page
// really is that route's own concern; only this lookup table moved.

// Which of the common Invite fields a given template actually reads, plus
// how many photos it needs. This is what drives the customize page: it
// reads a template's fields here and renders only the matching inputs
// (and the right number of photo upload slots) instead of always showing
// every possible field regardless of template.
//
// Verified against each component's actual `invite.*` usage — not guessed —
// so this should stay in sync with reality. If a template component starts
// reading a field it didn't before (or drops one), update its entry here
// too.
export type TemplateFieldManifest = {
  host_names: boolean;
  event_date: boolean;
  venue_name: boolean;
  venue_map_url: boolean;
  whatsapp_number: boolean;
  photoCount: number; // 0 if the template doesn't use photos at all
};

// The single source of truth for "what templates exist." Anything that
// needs to know about templates (routing; the gallery; the customize/order
// flow) reads from this list instead of having its own separate knowledge
// of individual templates.
export type TemplateEntry = {
  slug: string; // must match the `slug` column on the `templates` table
  name: string;
  category: string; // matches a `categories.slug`
  component: ComponentType<{ invite: Invite }>;
  fields: TemplateFieldManifest;
};

export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  {
    slug: "wedding-classic",
    name: "Classic Wedding",
    category: "wedding",
    component: WeddingClassic,
    fields: {
      host_names: true,
      event_date: true,
      venue_name: true,
      venue_map_url: true,
      whatsapp_number: true,
      photoCount: 3,
    },
  },
  {
    slug: "wedding-scrapbook",
    name: "Scrapbook Wedding",
    category: "wedding",
    component: WeddingScrapbook,
    fields: {
      host_names: true,
      event_date: false,
      venue_name: false,
      venue_map_url: false,
      whatsapp_number: true,
      photoCount: 1,
    },
  },
  {
    slug: "wedding-blush-bow",
    name: "Blush Bow Wedding",
    category: "wedding",
    component: WeddingBlushBow,
    fields: {
      host_names: true,
      event_date: true,
      venue_name: true,
      venue_map_url: true,
      whatsapp_number: true,
      photoCount: 2,
    },
  },
  {
    slug: "bachelorette-coastal",
    name: "Coastal Bachelorette",
    category: "bachelorette",
    component: BacheloretteCoastal,
    fields: {
      host_names: true,
      event_date: true,
      venue_name: true,
      venue_map_url: false,
      whatsapp_number: false,
      photoCount: 0,
    },
  },
];

export function getTemplateBySlug(slug: string | undefined | null): TemplateEntry | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.slug === slug);
}
