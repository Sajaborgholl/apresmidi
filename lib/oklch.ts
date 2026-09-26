// Colour blending for the scroll-driven feature section (FeatureScroll.tsx).
//
// Blends run in OKLCH rather than plain sRGB. An sRGB mix between two opposed
// hues averages its channels toward grey: halfway from --blue to --yellow it
// gives #DADDE1 at chroma 0.006, effectively grey, against a soft mint
// #C0E6DC at 0.042 in OKLCH — so an sRGB handoff would pass through a dull
// wash no section has. OKLCH interpolates lightness, chroma and hue
// separately, which keeps the colour in between alive.
//
// Pure functions, no React, no DOM: the scroll engine only supplies numbers.

type Rgb = [number, number, number];
type Lch = [number, number, number];

function hexToRgb(hex: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;
}

function rgbToHex(rgb: Rgb): string {
  return (
    "#" +
    rgb
      .map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

// Björn Ottosson's OKLab matrices, via linear sRGB.
function rgbToOklch(rgb: Rgb): Lch {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

function oklchToRgb([L, C, h]: Lch): Rgb {
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(toGamma) as Rgb;
}

/** Mix two hex colours in OKLCH, taking the shorter way round the hue wheel. */
export function mixOklch(from: string, to: string, t: number): string {
  if (t <= 0) return from.toUpperCase();
  if (t >= 1) return to.toUpperCase();
  const a = rgbToOklch(hexToRgb(from));
  const b = rgbToOklch(hexToRgb(to));
  // A colour with almost no chroma has no meaningful hue; borrowing the other
  // end's stops a near-grey from dragging the blend round the wheel.
  if (a[1] < 0.002) a[2] = b[2];
  if (b[1] < 0.002) b[2] = a[2];
  let dh = b[2] - a[2];
  if (dh > Math.PI) dh -= 2 * Math.PI;
  if (dh < -Math.PI) dh += 2 * Math.PI;
  return rgbToHex(oklchToRgb([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + dh * t]));
}

/** Eases a 0..1 fraction so values near each end are held, and change happens in the middle. */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * Where a point sits across a run of subsection centres, as a continuous
 * index: 2.5 is halfway from the third subsection's centre to the fourth's.
 * Clamped to the first and last, so the ends hold their own colour.
 */
export function progressAt(y: number, centers: number[]): number {
  const last = centers.length - 1;
  if (last < 1 || y <= centers[0]) return 0;
  if (y >= centers[last]) return last;
  let i = 0;
  while (i < last - 1 && y >= centers[i + 1]) i++;
  return i + (y - centers[i]) / (centers[i + 1] - centers[i]);
}

export type ColourStop = { bg: string; fg: string };

/** The panel's background and text colour at a given continuous progress. */
export function blendAt(progress: number, stops: ColourStop[]): ColourStop {
  const last = stops.length - 1;
  const p = Math.min(last, Math.max(0, progress));
  const i = Math.min(Math.floor(p), last);
  if (i >= last) return { bg: stops[last].bg.toUpperCase(), fg: stops[last].fg.toUpperCase() };
  const t = smoothstep(p - i);
  return { bg: mixOklch(stops[i].bg, stops[i + 1].bg, t), fg: mixOklch(stops[i].fg, stops[i + 1].fg, t) };
}
