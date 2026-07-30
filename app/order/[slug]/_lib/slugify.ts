// Turns "Sarah & Karim" into "sarah-karim" for use in invite URLs
// (yourbrand.com/i/sarah-karim).
export function slugify(input: string): string {
  const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
