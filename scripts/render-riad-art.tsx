// Renders the Watercolor Riad scene (app/i/[slug]/_designs/riadArt.tsx) to
// two transparent WebP layers in public/templates/wedding-watercolor-riad/.
// The watercolor look comes from heavy SVG filters — far too slow to run
// live on a phone, so they're painted once here instead.
// Run: npx -y tsx scripts/render-riad-art.tsx
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { RiadBack, RiadFront, RIAD_W } from "../app/i/[slug]/_designs/riadArt";

const OUT = "public/templates/wedding-watercolor-riad";
const WIDTH = RIAD_W * 2;

async function render(name: string, el: React.ReactElement) {
  const svg = renderToStaticMarkup(el);
  await sharp(Buffer.from(svg), { density: 72 * (WIDTH / RIAD_W) })
    .resize({ width: WIDTH })
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(`${OUT}/${name}.webp`);
  console.log("wrote", name);
}

(async () => {
  await render("scene-back", <RiadBack id="b" />);
  await render("scene-front", <RiadFront id="f" />);
})();
