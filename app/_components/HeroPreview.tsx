// Renders a live, scaled-down preview of a real invite page (/i/[slug])
// inside a small hero box. Uses the "oversized iframe + CSS scale" trick:
// the iframe is rendered at 400% of the box's size, then scaled down by
// 0.25, so the math cancels out and it always fills the box exactly,
// regardless of the box's actual pixel size (which changes per breakpoint).
// pointer-events is disabled so clicks pass through to the wrapping <Link>
// instead of interacting with the embedded page.
export default function HeroPreview({ slug }: { slug: string }) {
  return (
    <iframe
      src={`/i/${slug}`}
      title={`Live preview of the ${slug} invitation`}
      tabIndex={-1}
      scrolling="no"
      loading="lazy"
      style={{
        width: "400%",
        height: "400%",
        transform: "scale(0.25)",
        transformOrigin: "top left",
        border: "none",
        pointerEvents: "none",
      }}
    />
  );
}
