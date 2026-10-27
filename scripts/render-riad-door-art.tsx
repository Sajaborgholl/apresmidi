// Renders the Riad Door collage pieces (app/i/[slug]/_designs/riadDoorArt.tsx)
// to images in public/templates/wedding-riad-door/. Their SVG filters are far
// too slow to run live on a phone, so they're painted once here.
// Run: npx -y tsx scripts/render-riad-door-art.tsx [piece ...]
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import {
  DoorFrame, DoorLeaf, FlowersSticker, LinenTile, Mat, PalmSticker, PotsSticker,
  FRAME, FRAME_PAD, LEAF_W, LINEN_TILE, PALM_VB, POTS_VB, FLOWERS_VB,
} from "../app/i/[slug]/_designs/riadDoorArt";

const OUT = "public/templates/wedding-riad-door";

// scale: output pixels per SVG unit
async function render(name: string, el: React.ReactElement, srcW: number, scale: number, jpeg = false) {
  const svg = renderToStaticMarkup(el);
  const width = Math.round(srcW * scale);
  const img = sharp(Buffer.from(svg), { density: 72 * scale }).resize({ width });
  if (jpeg) await img.flatten({ background: "#ece6dc" }).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}/${name}.jpg`);
  else await img.webp({ quality: 88, alphaQuality: 92 }).toFile(`${OUT}/${name}.webp`);
  console.log("wrote", name);
}

const only = process.argv.slice(2);
const want = (n: string) => only.length === 0 || only.includes(n);
(async () => {
  if (want("linen")) await render("linen", <LinenTile />, LINEN_TILE, 1, true);
  if (want("door")) {
    // the door is what we walk through, so it gets the most pixels
    await render("leaf-l", <DoorLeaf side="l" id="l" />, LEAF_W, 5);
    await render("leaf-r", <DoorLeaf side="r" id="r" />, LEAF_W, 5);
    await render("frame", <DoorFrame id="fr" />, FRAME.w + FRAME_PAD * 2, 5);
  }
  if (want("mat")) await render("mat", <Mat id="m" />, 220, 3);
  if (want("palm")) await render("palm", <PalmSticker id="p" />, PALM_VB.w, 3);
  if (want("pots")) await render("pots", <PotsSticker id="po" />, POTS_VB.w, 3);
  if (want("flowers")) await render("flowers", <FlowersSticker id="fl" />, FLOWERS_VB.w, 3);
})();
