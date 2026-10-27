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

      {/* The view through the arch */}
      <g clipPath={`url(#${id}-arch)`}>
        <rect x={200} y={200} width={200} height={310} fill={`url(#${id}-sky)`} />
        <g filter={leaf}>
          <Palm x={252} y={430} h={150} lean={-10} s={0.62} seed={2} />
          <Palm x={348} y={430} h={150} lean={10} s={0.62} seed={6} />
          <Palm x={268} y={420} h={112} lean={-4} s={0.48} seed={3} dark />
          <Palm x={332} y={420} h={112} lean={4} s={0.48} seed={8} dark />
          <Palm x={290} y={412} h={70} lean={-2} s={0.3} seed={5} />
          <Palm x={310} y={412} h={70} lean={2} s={0.3} seed={1} />
        </g>
        <g filter={wc}>
          {/* far pavilion */}
          <rect x={290} y={386} width={20} height={26} fill={C.terracotta} />
          <path d="M295,412 V398 A5,5 0 0 1 305,398 V412 Z" fill={C.terracottaShade} />
          {/* side hedges along the pool, converging */}
          <path d="M200,500 L200,452 L286,410 L290,414 L262,500 Z" fill={C.leafDark} opacity={0.85} />
          <path d="M400,500 L400,452 L314,410 L310,414 L338,500 Z" fill={C.leafDark} opacity={0.85} />
          <path d="M200,452 L286,410 L288,404 L200,440 Z" fill={C.leafDeep} opacity={0.6} />
          <path d="M400,452 L314,410 L312,404 L400,440 Z" fill={C.leafDeep} opacity={0.6} />
          {/* path + pool */}
          <path d="M290,414 L310,414 L344,500 L256,500 Z" fill={C.sand} />
          <path d="M295,416 L305,416 L330,500 L270,500 Z" fill={`url(#${id}-pool)`} />
          {/* pavilion reflection + light on the water */}
          <path d="M297,418 L303,418 L306,446 L294,446 Z" fill={C.terracotta} opacity={0.35} />
          <path d="M287,470 L297,470 M302,482 L314,482 M283,492 L292,492" stroke="#e8f3ef" strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
        </g>
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
// The garden, seen from above: where guests "land" after walking through the
// gate. A long courtyard panorama (pool running left to right, palms and
// orange trees on both sides, the far arcade at the top) that the page pans
// across as the guest scrolls.
// ---------------------------------------------------------------------------

export const GARDEN_W = 1400;
export const GARDEN_H = 1000;

// A palm seen from above at an angle: fronds radiating all around, squashed
// vertically for the perspective, over a short visible trunk.
function PalmTop({ x, y, ground, s = 1, seed = 0 }: { x: number; y: number; ground: number; s?: number; seed?: number }) {
  const fronds: { rib: string; leaflets: string; i: number }[] = [];
  const count = 13;
  for (let i = 0; i < count; i++) {
    const deg = (360 / count) * i + ((seed * 23 + i * 11) % 17) - 8;
    const a = (deg * Math.PI) / 180;
    const L = (78 + ((seed + i * 5) % 14)) * s;
    const ca = Math.cos(a);
    const sa = Math.sin(a) * 0.62;
    const p2x = x + ca * L;
    const p2y = y + sa * L + L * 0.12;
    const p1x = x + ca * L * 0.5;
    const p1y = y + sa * L * 0.5 - L * 0.08;
    const leaflets: string[] = [];
    const n = 10;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const bx = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * p1x + t * t * p2x;
      const by = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * p1y + t * t * p2y;
      const dx = 2 * (1 - t) * (p1x - x) + 2 * t * (p2x - p1x);
      const dy = 2 * (1 - t) * (p1y - y) + 2 * t * (p2y - p1y);
      const dl = Math.hypot(dx, dy) || 1;
      const ux = dx / dl;
      const uy = dy / dl;
      const len = (17 - t * 10) * s;
      for (const side of [1, -1]) {
        const nx = -uy * side;
        const ny = ux * side;
        leaflets.push(`M${f(bx)},${f(by)} L${f(bx + (nx * 0.85 + ux * 0.5) * len)},${f(by + (ny * 0.85 + uy * 0.5) * len * 0.75 + len * 0.15)}`);
      }
    }
    fronds.push({ rib: `M${f(x)},${f(y)} Q${f(p1x)},${f(p1y)} ${f(p2x)},${f(p2y)}`, leaflets: leaflets.join(" "), i });
  }
  // draw the back fronds (pointing up/away) first
  fronds.sort((a, b) => Math.sin(((360 / count) * a.i * Math.PI) / 180) - Math.sin(((360 / count) * b.i * Math.PI) / 180));
  const tw = 7 * s;
  return (
    <g>
      <ellipse cx={x + 26 * s} cy={ground + 4} rx={80 * s} ry={20 * s} fill={C.leafDeep} opacity={0.22} />
      <path d={`M${f(x - tw)},${ground} Q${f(x - tw * 0.6)},${f((y + ground) / 2)} ${f(x - tw * 0.5)},${y} L${f(x + tw * 0.5)},${y} Q${f(x + tw * 0.6)},${f((y + ground) / 2)} ${f(x + tw)},${ground} Z`} fill={C.trunk} />
      {fronds.map(({ rib, leaflets, i }) => (
        <g key={i}>
          <path d={leaflets} fill="none" stroke={i % 3 === 0 ? C.leafDeep : i % 2 ? C.leafDark : C.leaf} strokeWidth={2.4 * s} strokeLinecap="round" opacity={0.85} />
          <path d={rib} fill="none" stroke={C.leafDeep} strokeWidth={1.5 * s} strokeLinecap="round" opacity={0.8} />
        </g>
      ))}
      <circle cx={x} cy={y} r={6 * s} fill={C.leafDeep} opacity={0.7} />
    </g>
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

export function RiadGarden({ id }: { id: string }) {
  const W = GARDEN_W;
  const wc = `url(#${id}-wc)`;
  const leaf = `url(#${id}-leaf)`;
  const wash = `url(#${id}-wash)`;
  // far arcade
  const arcTop = 96;
  const roofB = 124;
  const corB = 138;
  const wallB = 262;
  const bays: number[] = [];
  for (let x = -20; x < W + 20; x += 64) bays.push(x);
  // floor tile lines converging to a vanishing point far above
  const vpx = W / 2;
  const vpy = -260;
  const tileLines: string[] = [];
  for (let x = -1600; x <= W + 1600; x += 90) {
    const t = (GARDEN_H - wallB) / (GARDEN_H - vpy);
    const topX = x + (vpx - x) * t;
    tileLines.push(`M${f(topX)},${wallB} L${x},${GARDEN_H}`);
  }
  for (let y = wallB + 18, gap = 18; y < GARDEN_H; gap *= 1.14, y += gap) tileLines.push(`M0,${f(y)} H${W}`);

  const upperPalms = [110, 390, 670, 950, 1230];
  const lowerPalms = [250, 530, 810, 1090, 1370, -30];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${GARDEN_H}`} width={W} height={GARDEN_H}>
      <WatercolorDefs id={id} />
      <rect width={W} height={GARDEN_H} fill="#f3ead9" />
      {/* sky */}
      <g filter={wash} opacity={0.8}>
        <rect x={-40} y={-40} width={W + 80} height={170} fill="#d4e7ea" />
      </g>
      {/* palms beyond the far wall */}
      <g filter={leaf}>
        {[60, 300, 520, 860, 1080, 1330].map((x, i) => (
          <Palm key={x} x={x} y={130} h={70 + (i % 3) * 18} lean={(i % 2 ? 1 : -1) * 8} s={0.7} seed={i + 2} dark={i % 2 === 0} />
        ))}
      </g>
      {/* far arcade */}
      <g filter={wc}>
        <path d={`M0,${arcTop + 6} L${W},${arcTop} V${roofB} H0 Z`} fill={C.roof} />
        <path d={Array.from({ length: W / 8 + 1 }, (_, i) => `M${i * 8},${arcTop + 4} L${i * 8 - 1.5},${roofB - 1}`).join(" ")} stroke={C.roofDark} strokeWidth={1.3} opacity={0.5} />
        <rect x={0} y={roofB} width={W} height={corB - roofB} fill={C.terracotta} />
        <rect x={0} y={corB} width={W} height={wallB - corB} fill={C.sand} />
        {bays.map((x) => {
          const l = x + 12;
          const r = x + 64;
          const w = r - l;
          const top = corB + 16 + w / 2;
          return (
            <g key={x}>
              <path d={`M${l},${wallB} V${top} A${w / 2},${w / 2} 0 0 1 ${r},${top} V${wallB} Z`} fill="#7f8c64" opacity={0.85} />
              <path d={`M${l},${top} A${w / 2},${w / 2} 0 0 1 ${r},${top} V${top + 22} H${l} Z`} fill="#5d6a48" opacity={0.5} />
            </g>
          );
        })}
      </g>
      {/* courtyard floor */}
      <g filter={wc}>
        <rect x={0} y={wallB} width={W} height={GARDEN_H - wallB} fill="#ecd8c2" />
        <path d={tileLines.join(" ")} stroke="#d6b99c" strokeWidth={1.4} opacity={0.6} fill="none" />
      </g>
      {/* paths + low hedges along the pool */}
      <g filter={wc}>
        <rect x={0} y={448} width={W} height={20} fill={C.hedge} />
        <rect x={0} y={448} width={W} height={7} fill={C.leaf} opacity={0.7} />
        <rect x={0} y={468} width={W} height={46} fill="#f2e6d6" />
        <rect x={0} y={652} width={W} height={50} fill="#f2e6d6" />
        <rect x={0} y={702} width={W} height={24} fill={C.hedge} />
        <rect x={0} y={702} width={W} height={8} fill={C.leaf} opacity={0.7} />
      </g>
      {/* pool */}
      <g filter={wc}>
        <rect x={-10} y={514} width={W + 20} height={138} fill="#efe3d1" />
        <rect x={-10} y={526} width={W + 20} height={114} fill={`url(#${id}-pool)`} />
        <rect x={-10} y={526} width={W + 20} height={14} fill={C.waterDeep} opacity={0.45} />
        {/* palm reflections */}
        {upperPalms.map((x) => (
          <ellipse key={x} cx={x + 6} cy={560} rx={60} ry={14} fill={C.leafDark} opacity={0.28} />
        ))}
        {/* fountains */}
        {[250, 700, 1150].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={583} rx={44} ry={20} fill="#efe3d1" />
            <ellipse cx={x} cy={583} rx={36} ry={15} fill={C.water} />
            <ellipse cx={x} cy={578} rx={6} ry={10} fill="#ffffff" opacity={0.7} />
          </g>
        ))}
        <path
          d={Array.from({ length: 24 }, (_, i) => {
            const x = 30 + i * 58 + (i % 3) * 9;
            const y = 548 + ((i * 37) % 80);
            return `M${x},${y} h${14 + (i % 4) * 5}`;
          }).join(" ")}
          stroke="#eef6f2"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.8}
        />
      </g>
      {/* upper row: palms + orange trees on the far side of the pool */}
      <g filter={leaf}>
        {upperPalms.map((x, i) => (
          <PalmTop key={x} x={x} y={380} ground={470} s={0.62} seed={i + 1} />
        ))}
      </g>
      <g filter={wc}>
        {upperPalms.map((x, i) => (
          <OrangeTree key={x} x={x + 140} ground={470} s={0.6} seed={i} />
        ))}
      </g>
      {/* lower row, closer to us */}
      <g filter={wc}>
        {lowerPalms.map((x, i) => (
          <OrangeTree key={x} x={x - 140} ground={736} s={1} seed={i + 4} />
        ))}
      </g>
      <g filter={leaf}>
        {lowerPalms.map((x, i) => (
          <PalmTop key={x} x={x} y={590} ground={736} s={1.2} seed={i + 6} />
        ))}
      </g>
      {/* foreground, right below us: a path, then big palm crowns and potted
          orange trees cut off by the bottom edge — what makes it feel high up */}
      <g filter={wc}>
        <rect x={0} y={736} width={W} height={GARDEN_H - 736} fill="#ead3bc" />
        <rect x={0} y={800} width={W} height={56} fill="#f2e6d6" />
        <rect x={0} y={856} width={W} height={20} fill={C.hedge} />
        <rect x={0} y={856} width={W} height={7} fill={C.leaf} opacity={0.7} />
      </g>
      <g filter={wc}>
        {[110, 390, 670, 950, 1230].map((x, i) => (
          <OrangeTree key={x} x={x} ground={1010} s={1.45} seed={i + 9} />
        ))}
      </g>
      <g filter={leaf}>
        {[250, 530, 810, 1090, 1370, -30].map((x, i) => (
          <PalmTop key={x} x={x} y={960} ground={1080} s={1.75} seed={i + 3} />
        ))}
      </g>
    </svg>
  );
}
