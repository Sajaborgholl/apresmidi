import type { ComponentType } from "react";
import type { Invite } from "@/lib/types";
import WeddingClassic from "./WeddingClassic";
import WeddingScrapbook from "./WeddingScrapbook";
import WeddingBlushBow from "./WeddingBlushBow";

// The single source of truth for "what templates exist." Anything that
// needs to know about templates (routing today; the gallery, the intake
// form, and the order flow later) reads from this list instead of having
// its own separate knowledge of individual templates.
export type TemplateEntry = {
  slug: string; // must match the `slug` column on the `templates` table
  name: string;
  category: string; // matches a `categories.slug`
  component: ComponentType<{ invite: Invite }>;
};

export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  {
    slug: "wedding-classic",
    name: "Classic Wedding",
    category: "wedding",
    component: WeddingClassic,
  },
  {
    slug: "wedding-scrapbook",
    name: "Scrapbook Wedding",
    category: "wedding",
    component: WeddingScrapbook,
  },
  {
    slug: "wedding-blush-bow",
    name: "Blush Bow Wedding",
    category: "wedding",
    component: WeddingBlushBow,
  },
];

export function getTemplateBySlug(slug: string | undefined | null): TemplateEntry | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.slug === slug);
}
