// Renders the Watercolor Riad scene (app/i/[slug]/_designs/riadArt.tsx) to
// two transparent WebP layers in public/templates/wedding-watercolor-riad/.
// The watercolor look comes from heavy SVG filters — far too slow to run
// live on a phone, so they're painted once here instead.
// Run: npx -y tsx scripts/render-riad-art.tsx
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { RiadBack, RiadFront, RiadVista, RIAD_W, VISTA_W } from "../app/i/[slug]/_designs/riadArt";

const OUT = "public/templates/wedding-watercolor-riad";
const WIDTH = RIAD_W * 2;

// Layers with transparency are WebP; the full-bleed garden view is JPEG,
// which handles the paper-grain texture at a third of WebP's size.
async function render(name: string, el: React.ReactElement, width = WIDTH, srcW = RIAD_W, jpeg = false) {
  const svg = renderToStaticMarkup(el);
  const img = sharp(Buffer.from(svg), { density: 72 * (width / srcW) }).resize({ width });
  if (jpeg) await img.flatten({ background: "#f3ead9" }).jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  else await img.webp({ quality: 86, alphaQuality: 90 }).toFile(`${OUT}/${name}.webp`);
  console.log("wrote", name);
}

// Pass layer names to re-render only those, e.g. `... render-riad-art.tsx vista`.
const only = process.argv.slice(2);
const want = (n: string) => only.length === 0 || only.includes(n);
(async () => {
  if (want("scene-back")) await render("scene-back", <RiadBack id="b" />);
  if (want("scene-front")) await render("scene-front", <RiadFront id="f" />);
  if (want("vista")) await render("vista", <RiadVista id="v" />, 2800, VISTA_W, true);
})();
