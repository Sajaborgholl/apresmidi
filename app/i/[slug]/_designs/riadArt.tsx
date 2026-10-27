// Watercolor Riad Wedding — the hand-painted-look scene: a terracotta
// Moorish gate in a garden wall, palms behind it and a long pool seen
// through the arch. Drawn entirely in SVG; the "watercolor" is SVG filters
// (wobbly pigment edges, darker drying rims, paper granulation), so it
// stays sharp at any size and costs no image downloads.
//
// The scene is split into two stacked layers that share one viewBox, so the
// opening gate (WatercolorRiadGate.tsx) can slide HTML doors between them:
//   <RiadBack/>  — sky wash, garden, walls, and the view through the arch
//   <RiadFront/> — the gate itself (with the arch cut out), lantern, hedges

export const RIAD_W = 600;
export const RIAD_H = 560;
export const RIAD_VIEWBOX = `0 0 ${RIAD_W} ${RIAD_H}`;

// The arch opening: a horseshoe arch, circle centre (ARCH_CX, ARCH_CY),
// radius ARCH_R, straight sides at ARCH_CX ± ARCH_HALF down to GROUND.
export const ARCH_CX = 300;
export const ARCH_CY = 292;
export const ARCH_R = 78;
export const ARCH_HALF = 62;
export const GROUND = 500;
export const ARCH_TOP = ARCH_CY - ARCH_R;

function archPath(grow = 0): string {
  const r = ARCH_R + grow;
  const half = ARCH_HALF + grow;
  const sideY = ARCH_CY + Math.sqrt(r * r - half * half);
  return `M${ARCH_CX - half},${GROUND} L${ARCH_CX - half},${sideY.toFixed(1)} A${r},${r} 0 1 1 ${ARCH_CX + half},${sideY.toFixed(1)} L${ARCH_CX + half},${GROUND} Z`;
}
export const ARCH_PATH = archPath();

const f = (n: number) => n.toFixed(1);

// Palette
const C = {
  terracotta: "#c27a5c",
  terracottaDeep: "#a65a3f",
  terracottaShade: "#8f4b34",
  sand: "#ead2bd",
  sandShade: "#d9b79c",
  roof: "#88a07a",
  roofDark: "#6c8660",
  leaf: "#7f9a5e",
  leafDark: "#56703f",
  leafDeep: "#3f5631",
  hedge: "#6f8a55",
  water: "#8fbcb4",
  waterDeep: "#5f9a92",
  trunk: "#9a7a5c",
  lantern: "#3b302b",
};

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export function WatercolorDefs({ id }: { id: string }) {
  return (
    <defs>
      {/* Pigment: wobbly edge + darker rim where the paint dried + granulation. */}
      <filter id={`${id}-wc`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feMorphology in="d" operator="erode" radius="1.4" result="e" />
        <feComposite in="d" in2="e" operator="out" result="rim" />
        <feColorMatrix in="rim" type="matrix" values="0.72 0 0 0 0  0 0.72 0 0 0  0 0 0.72 0 0  0 0 0 0.55 0" result="rimDark" />
        {/* blooms: big soft patches where the pigment pooled thicker or thinner */}
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="21" result="b" />
        <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.32" result="bA" />
        <feComposite in="d" in2="bA" operator="in" result="bloomed" />
        {/* very fine paper tooth */}
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="3" result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.35 1.12" result="gA" />
        <feComposite in="bloomed" in2="gA" operator="in" result="tex" />
        <feMerge>
          <feMergeNode in="tex" />
          <feMergeNode in="rimDark" />
        </feMerge>
      </filter>
      {/* Same edge wobble as the pigment filter, but fully opaque: an
          underpaint so nothing behind the gate (the doors) shows through. */}
      <filter id={`${id}-solid`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* Softer version for big washes (sky, ground): no rim, more bleed. */}
      <filter id={`${id}-wash`} x="-10%" y="-20%" width="120%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="11" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feGaussianBlur in="d" stdDeviation="2.2" />
      </filter>
      {/* Leaves: same idea, finer wobble so leaflets stay crisp. */}
      <filter id={`${id}-leaf`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="5" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <clipPath id={`${id}-arch`}>
        <path d={ARCH_PATH} />
      </clipPath>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d5e8ea" />
        <stop offset="1" stopColor="#f3efe2" />
      </linearGradient>
      <linearGradient id={`${id}-gatebg`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={RIAD_H}>
        <stop offset="0" stopColor="#d9eaec" />
        <stop offset="0.55" stopColor="#eef1ea" />
        <stop offset="1" stopColor="#f3ead9" />
      </linearGradient>
      <linearGradient id={`${id}-pool`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.water} />
        <stop offset="1" stopColor={C.waterDeep} />
      </linearGradient>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" stopColor="#f6d79a" stopOpacity="0.9" />
        <stop offset="1" stopColor="#f6d79a" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Plants
// ---------------------------------------------------------------------------

type PalmProps = { x: number; y: number; h: number; lean?: number; s?: number; seed?: number; dark?: boolean };

// A date palm: tapered trunk with ring marks, and a crown of drooping
// fronds drawn as a rib plus many small leaflets (that's what makes it read
// as a palm rather than a blob).
function Palm({ x, y, h, lean = 0, s = 1, seed = 0, dark = false }: PalmProps) {
  const tx = x + lean;
  const ty = y - h;
  const trunkW0 = 6 * s;
  const trunkW1 = 3.4 * s;
  const cx1 = x + lean * 0.35;
  const cy1 = y - h * 0.5;
  const trunk = `M${f(x - trunkW0)},${f(y)} Q${f(cx1 - trunkW0 * 0.8)},${f(cy1)} ${f(tx - trunkW1)},${f(ty)} L${f(tx + trunkW1)},${f(ty)} Q${f(cx1 + trunkW0 * 0.8)},${f(cy1)} ${f(x + trunkW0)},${f(y)} Z`;
  const rings: string[] = [];
  for (let t = 0.08; t < 0.95; t += 0.07) {
    const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx1 + t * t * tx;
    const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy1 + t * t * ty;
    const w = trunkW0 + (trunkW1 - trunkW0) * t;
    rings.push(`M${f(px - w)},${f(py + 1.5)} Q${f(px)},${f(py - 1.2)} ${f(px + w)},${f(py + 1.5)}`);
  }

  const angles = [-172, -150, -128, -108, -90, -72, -52, -30, -8, 160 - 360 + 360, 20];
  const fronds = angles.map((deg, i) => {
    const jitter = (((seed * 31 + i * 17) % 13) - 6) * 1.2;
    const a = ((deg + jitter) * Math.PI) / 180;
    const L = (50 + ((seed + i * 7) % 11)) * s;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const droop = Math.abs(ca) * L * 0.55 + (sa > 0 ? L * 0.2 : 0);
    const p2x = tx + ca * L;
    const p2y = ty + sa * L + droop;
    const p1x = tx + ca * L * 0.55;
    const p1y = ty + sa * L * 0.55 - L * 0.12;
    const rib = `M${f(tx)},${f(ty)} Q${f(p1x)},${f(p1y)} ${f(p2x)},${f(p2y)}`;
    const leaflets: string[] = [];
    const n = 9;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const bx = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * p1x + t * t * p2x;
      const by = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * p1y + t * t * p2y;
      // tangent
      const dx = 2 * (1 - t) * (p1x - tx) + 2 * t * (p2x - p1x);
      const dy = 2 * (1 - t) * (p1y - ty) + 2 * t * (p2y - p1y);
      const dl = Math.hypot(dx, dy) || 1;
      const ux = dx / dl;
      const uy = dy / dl;
      const len = (15 - t * 9) * s;
      for (const side of [1, -1]) {
        // leaflets angle toward the tip and hang down a little
        const nx = -uy * side;
        const ny = ux * side;
        const ex = bx + (nx * 0.8 + ux * 0.55) * len;
        const ey = by + (ny * 0.8 + uy * 0.55) * len + len * 0.45;
        leaflets.push(`M${f(bx)},${f(by)} L${f(ex)},${f(ey)}`);
      }
    }
    return { rib, leaflets: leaflets.join(" "), i };
  });

  const leafA = dark ? C.leafDeep : C.leafDark;
  const leafB = dark ? C.leafDark : C.leaf;
  return (
    <g>
      <path d={trunk} fill={C.trunk} opacity={0.9} />
      <path d={rings.join(" ")} fill="none" stroke="#6e5440" strokeWidth={0.9 * s} opacity={0.55} />
      {fronds.map(({ rib, leaflets, i }) => (
        <g key={i}>
          <path d={leaflets} fill="none" stroke={i % 2 ? leafA : leafB} strokeWidth={1.9 * s} strokeLinecap="round" opacity={0.8} />
          <path d={rib} fill="none" stroke={leafA} strokeWidth={1.3 * s} strokeLinecap="round" opacity={0.9} />
        </g>
      ))}
    </g>
  );
}

// A soft rounded tree / bush: overlapping washes in two greens.
function Bush({ x, y, r, tone = C.hedge, seed = 0 }: { x: number; y: number; r: number; tone?: string; seed?: number }) {
  const blobs = [
    [-0.55, 0.15, 0.62],
    [0.5, 0.18, 0.6],
    [0, -0.25, 0.7],
    [-0.15, 0.3, 0.6],
    [0.25, -0.05, 0.55],
  ];
  return (
    <g>
      {blobs.map(([dx, dy, rr], i) => (
        <circle
          key={i}
          cx={x + dx * r + ((seed + i) % 3) - 1}
          cy={y + dy * r}
          r={rr * r}
          fill={i % 2 ? tone : C.leaf}
          opacity={0.75}
        />
      ))}
      <ellipse cx={x} cy={y + r * 0.55} rx={r * 0.95} ry={r * 0.32} fill={C.leafDeep} opacity={0.35} />
    </g>
  );
}

// A trimmed hedge block (the boxwood in front of the walls).
function Hedge({ x, w, h, y = GROUND }: { x: number; w: number; h: number; y?: number }) {
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h + 4} rx={h * 0.45} fill={C.hedge} opacity={0.92} />
      <rect x={x + 4} y={y - h + 3} width={w - 14} height={h * 0.38} rx={h * 0.2} fill={C.leaf} opacity={0.65} />
      <rect x={x + 2} y={y - h * 0.35} width={w - 4} height={h * 0.38} rx={h * 0.2} fill={C.leafDeep} opacity={0.35} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Walls on both sides of the gate: green tiled roof, terracotta cornice,
// and an arcade gallery in its shade.
// ---------------------------------------------------------------------------

function SideWall({ x0, x1 }: { x0: number; x1: number }) {
  const roofTop = 312;
  const cornice = 334;
  const wallTop = 348;
  const step = 44;
  const colW = 10;
  const bays: number[] = [];
  for (let x = x0 + 6; x < x1 - 20; x += step) bays.push(x);
  return (
    <g>
      {/* roof tiles */}
      <path d={`M${x0},${roofTop + 6} L${x1},${roofTop} L${x1},${cornice} L${x0},${cornice} Z`} fill={C.roof} />
      <path
        d={Array.from({ length: Math.ceil((x1 - x0) / 8) }, (_, i) => {
          const x = x0 + i * 8;
          return `M${x},${roofTop + 5} L${x - 1.5},${cornice - 1}`;
        }).join(" ")}
        stroke={C.roofDark}
        strokeWidth={1.2}
        opacity={0.5}
      />
      {/* cornice + dentils */}
      <rect x={x0} y={cornice} width={x1 - x0} height={wallTop - cornice} fill={C.terracotta} />
      <path
        d={Array.from({ length: Math.ceil((x1 - x0) / 9) }, (_, i) => `M${x0 + i * 9 + 2},${cornice + 7} h5 v6 h-5 Z`).join(" ")}
        fill={C.terracottaShade}
        opacity={0.5}
      />
      {/* wall */}
      <rect x={x0} y={wallTop} width={x1 - x0} height={GROUND - wallTop} fill={C.sand} />
      {/* arched openings of the gallery, in shade */}
      {bays.map((x) => {
        const l = x + colW;
        const r = x + step;
        const w = r - l;
        const top = wallTop + 14 + w / 2;
        return (
          <g key={x}>
            <path d={`M${l},${GROUND} V${top} A${w / 2},${w / 2} 0 0 1 ${r},${top} V${GROUND} Z`} fill="#7d8a62" opacity={0.85} />
            <path d={`M${l},${top} A${w / 2},${w / 2} 0 0 1 ${r},${top} V${top + 18} H${l} Z`} fill="#5d6a48" opacity={0.55} />
          </g>
        );
      })}
      {/* shadow under the cornice */}
      <rect x={x0} y={wallTop} width={x1 - x0} height={6} fill={C.terracottaShade} opacity={0.25} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Back layer
// ---------------------------------------------------------------------------

export function RiadBack({ id }: { id: string }) {
  const wc = `url(#${id}-wc)`;
  const leaf = `url(#${id}-leaf)`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={RIAD_VIEWBOX} width={RIAD_W} height={RIAD_H}>
      <WatercolorDefs id={id} />

      {/* Opaque paper + sky everywhere except the arch opening: the real
          garden view (RiadVista, full screen behind the gate) shows through
          the hole. Grown a little so the gate's painted edge always covers
          the cut. */}
      <path d={`M-40,-40 H${RIAD_W + 40} V${RIAD_H + 40} H-40 Z ${archPath(6)}`} fillRule="evenodd" fill={`url(#${id}-gatebg)`} />

      {/* Sky wash behind everything: a few loose, uneven blue washes. */}
      <g filter={`url(#${id}-wash)`} opacity={0.75}>
        <ellipse cx={120} cy={120} rx={220} ry={90} fill="#cfe3e8" />
        <ellipse cx={470} cy={90} rx={210} ry={80} fill="#d6e8ea" />
        <ellipse cx={300} cy={230} rx={330} ry={70} fill="#e2eeec" />
      </g>

      {/* Garden behind the walls */}
      <g filter={leaf}>
        <Palm x={40} y={336} h={190} lean={-18} s={1.05} seed={1} />
        <Palm x={95} y={336} h={232} lean={10} s={1.15} seed={4} dark />
        <Palm x={150} y={336} h={160} lean={-6} s={0.9} seed={7} />
        <Palm x={455} y={336} h={150} lean={14} s={0.85} seed={9} />
      </g>
      <g filter={wc}>
        <Bush x={520} y={300} r={48} seed={2} />
        <Bush x={585} y={292} r={44} seed={5} tone={C.leafDark} />
        <Bush x={470} y={318} r={26} seed={8} />
        <Bush x={-5} y={322} r={30} seed={3} tone={C.leafDark} />
      </g>

      {/* Walls */}
      <g filter={wc}>
        <SideWall x0={-10} x1={186} />
        <SideWall x0={414} x1={610} />
      </g>

      {/* Ground wash */}
      <g filter={`url(#${id}-wash)`} opacity={0.6}>
        <rect x={-20} y={GROUND - 4} width={640} height={80} fill={C.sand} />
      </g>

    </svg>
  );
}

// ---------------------------------------------------------------------------
// Front layer: the gate (arch cut out), lantern, hedges
// ---------------------------------------------------------------------------

export function RiadFront({ id }: { id: string }) {
  const gate = `M176,140 H424 V${GROUND + 6} H176 Z`;
  const panel = `M204,170 H396 V${GROUND + 6} H204 Z`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={RIAD_VIEWBOX} width={RIAD_W} height={RIAD_H}>
      <WatercolorDefs id={`${id}f`} />
      <g filter={`url(#${id}f-solid)`}>
        <path d={`${gate} ${ARCH_PATH}`} fillRule="evenodd" fill="#d49a7f" />
        <rect x={170} y={134} width={260} height={14} fill="#d49a7f" />
      </g>
      <g filter={`url(#${id}f-wc)`}>
        {/* gate block with the arch cut out (evenodd) */}
        <path d={`${gate} ${ARCH_PATH}`} fillRule="evenodd" fill={C.terracotta} />
        {/* slightly darker recessed panel around the arch */}
        <path d={`${panel} ${ARCH_PATH}`} fillRule="evenodd" fill={C.terracottaDeep} opacity={0.42} />
        {/* top coping */}
        <rect x={170} y={134} width={260} height={14} fill={C.terracottaDeep} />
        {/* shade on the panel's top and left inner edges */}
        <path d="M204,170 H396 V180 H214 V506 H204 Z" fill={C.terracottaShade} opacity={0.4} />
        {/* the arch's thickness: a darker band just inside the opening */}
        <path d={`${archPath(9)} ${ARCH_PATH}`} fillRule="evenodd" fill={C.terracottaShade} opacity={0.55} />
        {/* paint pooling: a few loose darker strokes on the block */}
        <path d="M186,200 Q190,320 184,480" stroke={C.terracottaShade} strokeWidth={5} fill="none" opacity={0.18} />
        <path d="M414,190 Q410,300 416,470" stroke={C.terracottaShade} strokeWidth={5} fill="none" opacity={0.22} />
      </g>

      {/* hedges in front of the walls */}
      <g filter={`url(#${id}f-wc)`}>
        <Hedge x={6} w={92} h={44} />
        <Hedge x={104} w={68} h={38} />
        <Hedge x={428} w={70} h={40} />
        <Hedge x={504} w={96} h={46} />
      </g>
      {/* the gate's shadow on the ground */}
      <g filter={`url(#${id}f-wash)`} opacity={0.35}>
        <rect x={170} y={GROUND + 4} width={262} height={18} fill={C.terracottaShade} />
      </g>
    </svg>
  );
}

// Small spot illustrations for the details section.
export function LanternIcon() {
  return (
    <svg viewBox="0 0 40 70" width="34" height="60" aria-hidden="true" className="riad-icon">
      <line x1="20" y1="0" x2="20" y2="14" stroke={C.lantern} strokeWidth="1.2" />
      <path d="M16,14 h8 l7,9 v26 l-5,7 h-12 l-5,-7 v-26 Z" fill={C.terracottaDeep} opacity="0.9" />
      <path d="M14,26 h3 v18 h-3 Z M18.5,26 h3 v18 h-3 Z M23,26 h3 v18 h-3 Z" fill="#f2d9a6" />
      <path d="M17,56 h6 l-3,7 Z" fill={C.terracottaDeep} />
    </svg>
  );
}

export function ArchIcon() {
  return (
    <svg viewBox="0 0 60 70" width="44" height="52" aria-hidden="true" className="riad-icon">
      <path d="M4,68 V8 H56 V68 Z M16,68 V36 A16,16 0 1 1 44,36 V68 Z" fillRule="evenodd" fill={C.terracotta} opacity="0.9" />
      <path d="M16,68 V36 A16,16 0 1 1 44,36 V68 Z" fill="#cfe3e8" />
      <path d="M27,68 L33,68 L31,48 L29,48 Z" fill={C.water} />
    </svg>
  );
}

export function PalmIcon() {
  return (
    <svg viewBox="0 0 80 90" width="52" height="58" aria-hidden="true" className="riad-icon">
      <Palm x={40} y={88} h={56} lean={4} s={0.42} seed={3} />
    </svg>
  );
}

// The hanging lantern, drawn without filters so it can sway cheaply on top
// of the (pre-rendered) painted scene. Same viewBox as the scene.
export function RiadLantern() {
  const x = ARCH_CX;
  const y = ARCH_TOP;
  return (
    <svg viewBox={RIAD_VIEWBOX} className="riad-layer" aria-hidden="true">
      <defs>
        <radialGradient id="riad-glow">
          <stop offset="0" stopColor="#f6d79a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f6d79a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="riad-lantern">
        <circle cx={x} cy={y + 74} r={30} fill="url(#riad-glow)" className="riad-glow" />
        <line x1={x} y1={y + 2} x2={x} y2={y + 52} stroke={C.lantern} strokeWidth={1.3} />
        <path d={`M${x - 4},${y + 52} h8 l7,9 v26 l-5,7 h-12 l-5,-7 v-26 Z`} fill={C.lantern} />
        <path d={`M${x - 11},${y + 61} h22`} stroke="#6b5a4c" strokeWidth={1.2} />
        <path d={`M${x - 11},${y + 87} h22`} stroke="#6b5a4c" strokeWidth={1.2} />
        <path
          d={`M${x - 6.5},${y + 64} h3 v19 h-3 Z M${x - 1.5},${y + 64} h3 v19 h-3 Z M${x + 3.5},${y + 64} h3 v19 h-3 Z`}
          fill="#efcd8c"
          opacity={0.85}
        />
        <path d={`M${x - 3},${y + 94} h6 l-3,7 Z`} fill={C.lantern} />
      </g>
    </svg>
  );
}


// ---------------------------------------------------------------------------
// The view through the gate, as a wide painting: the long pool running away
// to a little pavilion, palms on both sides, an arcade on the right. Guests
// land on it after the zoom (framed on the pool, exactly what they saw
// through the arch) and it pans to the right as they scroll.
// One-point perspective: everything is placed from (VX, VY), the vanishing
// point, using P(k, d): k = how far out to the side, d = how near.
// ---------------------------------------------------------------------------

export const VISTA_W = 1600;
export const VISTA_H = 1000;
export const VISTA_VX = 544; // 34% across
export const VISTA_VY = 470; // 47% down
const VX = VISTA_VX;
const VY = VISTA_VY;
const px = (k: number, d: number) => VX + k * d;
const py = (d: number) => VY + d;

// A strip on the ground between two side offsets k0..k1, from depth d0 to d1.
function strip(k0: number, k1: number, d0: number, d1: number): string {
  return `M${f(px(k0, d0))},${f(py(d0))} L${f(px(k1, d0))},${f(py(d0))} L${f(px(k1, d1))},${f(py(d1))} L${f(px(k0, d1))},${f(py(d1))} Z`;
}

// An arcade wall running away from us along side offset k: pillars at
// geometric depths, arched openings in shade, tiled roof on top.
function Arcade({ k, dMax }: { k: number; dMax: number }) {
  const depths: number[] = [];
  for (let d = 14; d < dMax * 1.3; d *= 1.3) depths.push(d);
  const H = 1.45; // wall height per unit depth
  const top = (d: number) => py(d) - H * d;
  const d0 = depths[0];
  const dl = depths[depths.length - 1];
  const wall = `M${f(px(k, d0))},${f(py(d0))} L${f(px(k, dl))},${f(py(dl))} L${f(px(k, dl))},${f(top(dl))} L${f(px(k, d0))},${f(top(d0))} Z`;
  const roofT = (d: number) => top(d) - 0.16 * d;
  const roof = `M${f(px(k, d0))},${f(top(d0))} L${f(px(k, dl))},${f(top(dl))} L${f(px(k * 1.08, dl))},${f(roofT(dl))} L${f(px(k * 1.08, d0))},${f(roofT(d0))} Z`;
  const cornice = (d: number) => top(d) + 0.07 * d;
  const bays = depths.slice(0, -1).map((da, i) => {
    const db = depths[i + 1];
    const span = db - da;
    const a = da + span * 0.16;
    const b = db - span * 0.04;
    const xa = px(k, a);
    const xb = px(k, b);
    const ya = py(a);
    const yb = py(b);
    const springA = ya - 0.95 * a;
    const springB = yb - 0.95 * b;
    const crownX = (xa + xb) / 2;
    const crownY = (springA + springB) / 2 - Math.abs(xb - xa) * 0.5;
    const open = `M${f(xa)},${f(ya)} L${f(xa)},${f(springA)} Q${f(xa)},${f(crownY)} ${f(crownX)},${f(crownY)} Q${f(xb)},${f(crownY)} ${f(xb)},${f(springB)} L${f(xb)},${f(yb)} Z`;
    return { open, i, xa, xb, ya, yb, springA, springB };
  });
  const tileLines: string[] = [];
  for (let d = d0; d < dl; d *= 1.06) {
    tileLines.push(`M${f(px(k, d))},${f(top(d))} L${f(px(k * 1.08, d))},${f(roofT(d))}`);
  }
  return (
    <g>
      <path d={wall} fill={C.sand} />
      {bays.map(({ open, i }) => (
        <path key={i} d={open} fill="#7f8c64" opacity={0.88} />
      ))}
      {bays.map(({ i, xa, xb, springA, springB }) => (
        <path key={`s${i}`} d={`M${f(xa)},${f(springA)} L${f(xb)},${f(springB)} L${f(xb)},${f(springB + (springB - springA) * 0 + Math.abs(xb - xa) * 0.35)} L${f(xa)},${f(springA + Math.abs(xb - xa) * 0.35)} Z`} fill="#5d6a48" opacity={0.35} />
      ))}
      <path d={`M${f(px(k, d0))},${f(top(d0))} L${f(px(k, dl))},${f(top(dl))} L${f(px(k, dl))},${f(cornice(dl))} L${f(px(k, d0))},${f(cornice(d0))} Z`} fill={C.terracotta} />
      <path d={roof} fill={C.roof} />
      <path d={tileLines.join(" ")} stroke={C.roofDark} strokeWidth={1.4} opacity={0.5} />
    </g>
  );
}

export function RiadVista({ id }: { id: string }) {
  const W = VISTA_W;
  const H = VISTA_H;
  const wc = `url(#${id}-wc)`;
  const leaf = `url(#${id}-leaf)`;
  const wash = `url(#${id}-wash)`;
  const dEnd = H - VY + 40;

  // floor tiles converging on the vanishing point
  const floor: string[] = [];
  for (let k = -6; k <= 6; k += 0.3) {
    if (Math.abs(k) < 0.4) continue;
    floor.push(`M${f(px(k, 6))},${f(py(6))} L${f(px(k, dEnd))},${f(py(dEnd))}`);
  }
  for (let d = 10; d < dEnd; d *= 1.16) floor.push(`M${f(px(-8, d))},${f(py(d))} L${f(px(8, d))},${f(py(d))}`);

  const palmDepths = [16, 26, 42, 66, 104, 165, 260, 410];
  const orangeDepths = [22, 38, 64, 108, 180, 300];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <WatercolorDefs id={id} />
      <defs>
        <linearGradient id={`${id}-vsky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe4ea" />
          <stop offset="0.75" stopColor="#e6efec" />
          <stop offset="1" stopColor="#f1ece0" />
        </linearGradient>
        <linearGradient id={`${id}-vpool`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9cdc5" />
          <stop offset="0.5" stopColor={C.water} />
          <stop offset="1" stopColor={C.waterDeep} />
        </linearGradient>
      </defs>

      {/* sky */}
      <rect x={0} y={0} width={W} height={VY + 20} fill={`url(#${id}-vsky)`} />
      <g filter={wash} opacity={0.65}>
        <ellipse cx={300} cy={120} rx={360} ry={70} fill="#c4dde4" />
        <ellipse cx={1150} cy={90} rx={420} ry={80} fill="#c9e0e6" />
        <ellipse cx={760} cy={260} rx={520} ry={60} fill="#f6efe2" />
      </g>
      {/* far mountains */}
      <g filter={wash} opacity={0.55}>
        <path d={`M-40,${VY - 6} C120,${VY - 70} 260,${VY - 40} 380,${VY - 82} C470,${VY - 112} 600,${VY - 60} 720,${VY - 90} C860,${VY - 126} 1000,${VY - 70} 1140,${VY - 96} C1280,${VY - 120} 1420,${VY - 70} 1640,${VY - 84} V${VY + 10} H-40 Z`} fill="#a9bfca" />
      </g>

      {/* ground: a solid underpaint first, so the pigment's blooms read as
          tone changes in the stone rather than holes */}
      <rect x={0} y={VY - 2} width={W} height={H - VY + 2} fill="#ead6bf" />
      <g filter={wc} opacity={0.7}>
        <rect x={-20} y={VY - 4} width={W + 40} height={H - VY + 24} fill="#ecd8c2" />
        <path d={floor.join(" ")} stroke="#d4b597" strokeWidth={1.3} fill="none" opacity={0.55} />
      </g>

      {/* far garden: a row of cypress and round trees across the horizon */}
      <g filter={wc}>
        {Array.from({ length: 30 }, (_, i) => {
          const x = -30 + i * 57 + ((i * 29) % 17);
          if (Math.abs(x - VX) < 70) return null;
          const tall = i % 3 === 0;
          const h = tall ? 70 + (i % 4) * 8 : 34 + (i % 5) * 4;
          return tall ? (
            <path key={i} d={`M${x},${VY + 6} Q${x - 9},${VY - h * 0.5} ${x},${VY - h} Q${x + 9},${VY - h * 0.5} ${x},${VY + 6} Z`} fill={i % 2 ? C.leafDeep : C.leafDark} opacity={0.85} />
          ) : (
            <ellipse key={i} cx={x} cy={VY - h * 0.45} rx={h * 0.7} ry={h * 0.55} fill={i % 2 ? C.leafDark : C.hedge} opacity={0.8} />
          );
        })}
      </g>

      {/* pavilion at the end of the pool */}
      <g filter={wc}>
        <rect x={VX - 48} y={VY - 64} width={96} height={72} fill={C.terracotta} />
        <path d={`M${VX - 56},${VY - 64} L${VX},${VY - 92} L${VX + 56},${VY - 64} Z`} fill={C.roof} />
        <rect x={VX - 52} y={VY - 66} width={104} height={6} fill={C.terracottaDeep} />
        <path d={`M${VX - 15},${VY + 8} V${VY - 26} A15,15 0 0 1 ${VX + 15},${VY - 26} V${VY + 8} Z`} fill={C.terracottaShade} />
        <path d={`M${VX - 38},${VY - 6} V${VY - 30} A8,8 0 0 1 ${VX - 22},${VY - 30} V${VY - 6} Z M${VX + 22},${VY - 6} V${VY - 30} A8,8 0 0 1 ${VX + 38},${VY - 30} V${VY - 6} Z`} fill={C.terracottaShade} opacity={0.75} />
      </g>

      {/* arcades on both sides (same solid underpaint for the walls) */}
      <g filter={`url(#${id}-solid)`}>
        <Arcade k={2.6} dMax={480} />
        <Arcade k={-2.6} dMax={240} />
      </g>
      <g filter={wc}>
        <Arcade k={2.6} dMax={480} />
        <Arcade k={-2.6} dMax={240} />
      </g>

      {/* paths, hedges, pool */}
      <g filter={wc}>
        <path d={strip(0.335, 0.52, 6, dEnd)} fill="#f3e8d8" />
        <path d={strip(-0.52, -0.335, 6, dEnd)} fill="#f3e8d8" />
        <path d={strip(0.52, 0.63, 6, dEnd)} fill={C.hedge} />
        <path d={strip(-0.63, -0.52, 6, dEnd)} fill={C.hedge} />
        <path d={strip(0.52, 0.57, 6, dEnd)} fill={C.leaf} opacity={0.6} />
        <path d={strip(-0.57, -0.52, 6, dEnd)} fill={C.leaf} opacity={0.6} />
        <path d={strip(1.95, 2.5, 6, dEnd)} fill={C.hedge} opacity={0.9} />
        <path d={strip(-2.5, -1.95, 6, dEnd)} fill={C.hedge} opacity={0.9} />
        <path d={strip(-0.335, 0.335, 7, dEnd)} fill="#efe3d1" />
        <path d={strip(-0.3, 0.3, 8, dEnd)} fill={`url(#${id}-vpool)`} />
        {/* reflections: pavilion + palms */}
        <path d={`M${VX - 14},${VY + 9} L${VX + 14},${VY + 9} L${VX + 22},${VY + 80} L${VX - 22},${VY + 80} Z`} fill={C.terracotta} opacity={0.3} />
        {palmDepths.slice(0, 6).map((d) => (
          <g key={d}>
            <path d={strip(0.17, 0.3, d, d * 1.45)} fill={C.leafDark} opacity={0.22} />
            <path d={strip(-0.3, -0.17, d, d * 1.45)} fill={C.leafDark} opacity={0.22} />
          </g>
        ))}
        {/* ripples */}
        <path
          d={Array.from({ length: 22 }, (_, i) => {
            const d = 14 * Math.pow(1.17, i);
            const w = 0.09 * d + 4;
            const o = ((i * 37) % 11) / 11 - 0.5;
            const x = VX + o * 0.4 * d;
            return `M${f(x - w / 2)},${f(py(d))} h${f(w)}`;
          }).join(" ")}
          stroke="#eef6f2"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        />
      </g>

      {/* orange trees in pots along the outer paths */}
      <g filter={wc}>
        {orangeDepths.map((d, i) => (
          <OrangeTree key={`r${d}`} x={px(1.6, d)} ground={py(d)} s={d / 95} seed={i} />
        ))}
        {orangeDepths.slice(0, 4).map((d, i) => (
          <OrangeTree key={`l${d}`} x={px(-1.6, d)} ground={py(d)} s={d / 95} seed={i + 5} />
        ))}
      </g>

      {/* two rows of palms along the pool, the nearest cut off by the top */}
      <g filter={leaf}>
        {palmDepths.map((d, i) => (
          <Palm key={`r${d}`} x={px(0.98, d)} y={py(d)} h={d * 2.2} lean={d * 0.1} s={d / 82} seed={i + 1} dark={i % 2 === 1} />
        ))}
        {palmDepths.map((d, i) => (
          <Palm key={`l${d}`} x={px(-0.98, d)} y={py(d)} h={d * 2.2} lean={-d * 0.1} s={d / 82} seed={i + 4} dark={i % 2 === 0} />
        ))}
      </g>
    </svg>
  );
}

// A little orange tree in a terracotta pot.
function OrangeTree({ x, ground, s = 1, seed = 0 }: { x: number; ground: number; s?: number; seed?: number }) {
  const cy = ground - 62 * s;
  const fruits = Array.from({ length: 9 }, (_, i) => {
    const a = ((seed * 37 + i * 71) % 360) * (Math.PI / 180);
    const r = (10 + ((seed + i * 13) % 20)) * s;
    return [x + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8];
  });
  return (
    <g>
      <ellipse cx={x + 14 * s} cy={ground + 2} rx={36 * s} ry={9 * s} fill={C.leafDeep} opacity={0.2} />
      <path d={`M${x - 16 * s},${ground - 30 * s} h${32 * s} l${-5 * s},${30 * s} h${-22 * s} Z`} fill={C.terracotta} />
      <rect x={x - 18 * s} y={ground - 34 * s} width={36 * s} height={6 * s} fill={C.terracottaDeep} />
      <rect x={x - 1.5 * s} y={ground - 56 * s} width={3 * s} height={24 * s} fill={C.trunk} />
      <circle cx={x} cy={cy} r={30 * s} fill={C.leafDark} opacity={0.9} />
      <circle cx={x - 9 * s} cy={cy - 8 * s} r={18 * s} fill={C.leaf} opacity={0.8} />
      {fruits.map(([fx, fy], i) => (
        <circle key={i} cx={fx} cy={fy} r={3.4 * s} fill="#e8913f" />
      ))}
    </g>
  );
}
