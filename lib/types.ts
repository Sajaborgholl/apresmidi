// Shared data shape for an invite, used by every template component.
// This is the one place the field names are defined — templates import
// this instead of each declaring their own version, so they can never
// silently disagree about what a field is called.
export type Invite = {
  id: string;
  host_names: string;
  event_date: string | null;
  venue_name: string | null;
  venue_map_url: string | null;
  primary_color: string | null;
  photo_urls: string[] | null;
  music_url: string | null;
  whatsapp_number: string | null;
  age: number | null; // used by the Disco Birthday template's hero number
};

// A row from the `templates` table, joined with its category name.
// This is what the gallery (TemplateCard, category pages, detail pages)
// reads — it's metadata for BROWSING templates, separate from the
// `TemplateEntry` in lib/templates/registry.ts (which maps a slug to
// actual React code). A TemplateCard needs both: the DB row for
// name/thumbnail, and the registry only if it needs to render a live
// preview. Pricing now lives entirely in the Standard/Premium plans
// section (app/_components/Pricing.tsx), not per category/template.
export type TemplateMeta = {
  id: string;
  slug: string;
  name: string;
  description: string | null; // per-template, from templates.description
  thumbnail_url: string | null;
  category_slug: string;
  category_name: string;
};
