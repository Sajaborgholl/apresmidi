// Renders the Watercolor Riad scene (app/i/[slug]/_designs/riadArt.tsx) to
// two transparent WebP layers in public/templates/wedding-watercolor-riad/.
// The watercolor look comes from heavy SVG filters — far too slow to run
// live on a phone, so they're painted once here instead.
// Run: npx -y tsx scripts/render-riad-art.tsx
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { RiadBack, RiadFront, RiadGarden, RIAD_W, GARDEN_W } from "../app/i/[slug]/_designs/riadArt";

const OUT = "public/templates/wedding-watercolor-riad";
const WIDTH = RIAD_W * 2;

async function render(name: string, el: React.ReactElement, width = WIDTH, srcW = RIAD_W) {
  const svg = renderToStaticMarkup(el);
  await sharp(Buffer.from(svg), { density: 72 * (width / srcW) })
    .resize({ width })
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(`${OUT}/${name}.webp`);
  console.log("wrote", name);
}

(async () => {
  await render("scene-back", <RiadBack id="b" />);
  await render("scene-front", <RiadFront id="f" />);
  await render("garden", <RiadGarden id="g" />, 2100, GARDEN_W);
})();
