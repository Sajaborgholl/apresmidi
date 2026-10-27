// Riad Door Wedding — the collage pieces: an old studded wooden double door
// (frame + two leaves that open), round rattan mats, a palm, pink
// bougainvillea and terracotta pots, all as "cut-out stickers" on linen.
// Drawn in SVG with watercolor-style filters and pre-rendered once to
// transparent images by scripts/render-riad-door-art.tsx (live SVG filters
// are far too slow on phones). The string lights stay live SVG so their
// bulbs can twinkle.

const f = (n: number) => n.toFixed(1);

const C = {
  wood: "#7a4a2a",
  woodLight: "#946039",
  woodDark: "#55321c",
  iron: "#2f2520",
  ironHi: "#6b5a4e",
  rattan: "#cfae80",
  rattanDark: "#b38f60",
  rattanLight: "#e2c79d",
  clay: "#c98d68",
  clayLight: "#dcab88",
  clayDark: "#a96d4c",
  frond: "#8fa58a",
  frondDark: "#62806a",
  frondDeep: "#4c6a56",
  trunk: "#a08670",
  stem: "#5f7f45",
  leaf: "#6f9450",
  leafDark: "#4b6d35",
  bract: "#d8317a",
  bractLight: "#ec6aa5",
  bractDark: "#a91f5c",
};

// ---------------------------------------------------------------------------
// Scene layout (one viewBox the gate composes the pieces in)
// ---------------------------------------------------------------------------

export const SCENE_W = 600;
export const SCENE_H = 640;
// Door frame outer box, and the opening inside it.
export const FRAME = { x: 196, y: 222, w: 208, h: 380 };
export const FRAME_T = 13; // frame thickness (top + sides; no sill)
export const OPENING = { x: FRAME.x + FRAME_T, y: FRAME.y + FRAME_T, w: FRAME.w - FRAME_T * 2, h: FRAME.h - FRAME_T };
// Each leaf covers half the opening.
export const LEAF_W = OPENING.w / 2;
export const LEAF_H = OPENING.h;

// Where each sticker sits in the scene (left, top, width; height follows
// the image's own aspect ratio).
export const PLACE = {
  matBig: { x: 66, y: 404, w: 188 },
  matSmall: { x: 104, y: 300, w: 140 },
  palm: { x: 330, y: 70, w: 250 },
  pots: { x: 392, y: 470, w: 170 },
  flowers: { x: 54, y: 392, w: 170 },
};

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}-wc`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="21" result="b" />
        <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.5 1.18" result="bA" />
        <feComposite in="d" in2="bA" operator="in" />
      </filter>
      <filter id={`${id}-leaf`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="5" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* wood grain: long stretched noise used as darker streaks */}
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves="3" seed="4" result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.11  0 0 0 0 0.05  0 0 0 1.6 -0.75" result="streaks" />
        <feComposite in="streaks" in2="SourceAlpha" operator="in" result="s" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="s" />
        </feMerge>
      </filter>
      {/* cut-out sticker: white border + soft drop shadow */}
      <filter id={`${id}-sticker`} x="-15%" y="-15%" width="130%" height="130%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="d" />
        <feFlood floodColor="#fffdf8" />
        <feComposite in2="d" operator="in" result="white" />
        <feGaussianBlur in="d" stdDeviation="4" result="blur" />
        <feOffset in="blur" dx="2" dy="5" result="off" />
        <feColorMatrix in="off" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0.28 0" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="white" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`${id}-shadow`} x="-15%" y="-15%" width="130%" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
        <feOffset in="blur" dx="3" dy="7" result="off" />
        <feColorMatrix in="off" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0.3 0" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Linen (seamless tile)
// ---------------------------------------------------------------------------

export const LINEN_TILE = 480;

export function LinenTile() {
  const S = LINEN_TILE;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${S} ${S}`} width={S} height={S}>
      <defs>
        {/* warp and weft: noise stretched along each axis, tiled seamlessly */}
        <filter id="warp" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75 0.018" numOctaves="2" seed="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.29  0 0 0 0.9 -0.32" />
        </filter>
        <filter id="weft" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.75" numOctaves="2" seed="9" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.29  0 0 0 0.9 -0.32" />
        </filter>
        <filter id="slub" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.004" numOctaves="2" seed="13" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.97  0 0 0 0.9 -0.38" />
        </filter>
        <filter id="speck" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 1.4 -0.92" />
        </filter>
      </defs>
      <rect width={S} height={S} fill="#ece6dc" />
      <rect width={S} height={S} filter="url(#warp)" opacity={0.32} />
      <rect width={S} height={S} filter="url(#weft)" opacity={0.28} />
      <rect width={S} height={S} filter="url(#slub)" opacity={0.5} />
      <rect width={S} height={S} filter="url(#speck)" opacity={0.35} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The door
// ---------------------------------------------------------------------------

function Stud({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.iron} />
      <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.38} fill={C.ironHi} />
    </g>
  );
}

function woodBoards(x: number, y: number, w: number, h: number, boards: number) {
  const bw = w / boards;
  return Array.from({ length: boards }, (_, i) => {
    const tone = [C.wood, C.woodLight, C.wood, "#83502e"][i % 4];
    return <rect key={i} x={x + i * bw} y={y} width={bw + 0.4} height={h} fill={tone} />;
  });
}

// One leaf of the door, in its own viewBox (LEAF_W x LEAF_H).
export function DoorLeaf({ side, id }: { side: "l" | "r"; id: string }) {
  const w = LEAF_W;
  const h = LEAF_H;
  const straps = [h * 0.12, h * 0.5, h * 0.86];
  const studsY: number[] = [];
  for (let y = 22; y < h - 14; y += 21) studsY.push(y);
  const inner = side === "l" ? w - 10 : 10; // the edge where the leaves meet
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <Defs id={id} />
      <g filter={`url(#${id}-wc)`}>
        <g filter={`url(#${id}-grain)`}>{woodBoards(0, 0, w, h, 4)}</g>
        {/* board seams */}
        {[1, 2, 3].map((i) => (
          <line key={i} x1={(w / 4) * i} y1={0} x2={(w / 4) * i} y2={h} stroke={C.woodDark} strokeWidth={1.2} opacity={0.7} />
        ))}
        {/* raised outer border */}
        <rect x={2} y={2} width={w - 4} height={h - 4} fill="none" stroke={C.woodDark} strokeWidth={4} opacity={0.75} />
        <rect x={6} y={6} width={w - 12} height={h - 12} fill="none" stroke="#a87048" strokeWidth={1.2} opacity={0.6} />
        {/* iron straps */}
        {straps.map((y) => (
          <rect key={y} x={4} y={y - 4} width={w - 8} height={8} fill={C.iron} opacity={0.92} />
        ))}
        {straps.map((y) => (
          <line key={`h${y}`} x1={5} y1={y - 3} x2={w - 5} y2={y - 3} stroke={C.ironHi} strokeWidth={1} opacity={0.6} />
        ))}
      </g>
      {/* studs in columns */}
      {[12, w / 2, w - 12].map((x) =>
        studsY.map((y) => (straps.some((s) => Math.abs(s - y) < 9) ? null : <Stud key={`${x}-${y}`} x={x} y={y} r={2.3} />))
      )}
      {straps.map((y) => [10, 24, w - 24, w - 10].map((x) => <Stud key={`s${x}-${y}`} x={x} y={y} r={2.1} />))}
      {side === "l" ? (
        // ring knocker
        <g>
          <circle cx={inner - 8} cy={h * 0.36} r={4.5} fill={C.iron} />
          <path
            d={`M${inner - 8},${h * 0.36 + 3} q-7,5 -6,15 q1,9 6,11 q5,-2 6,-11 q1,-10 -6,-15 Z`}
            fill="none"
            stroke={C.iron}
            strokeWidth={2.6}
          />
          <rect x={inner - 12} y={h * 0.62} width={7} height={14} rx={2} fill={C.iron} />
          <circle cx={inner - 8.5} cy={h * 0.62 + 5} r={1.4} fill={C.woodLight} />
        </g>
      ) : (
        // small iron grille window
        <g>
          <rect x={14} y={h * 0.3} width={30} height={30} fill="#3a2a20" />
          <path
            d={`M14,${h * 0.3 + 10} h30 M14,${h * 0.3 + 20} h30 M24,${h * 0.3} v30 M34,${h * 0.3} v30`}
            stroke={C.ironHi}
            strokeWidth={2}
          />
          <rect x={14} y={h * 0.3} width={30} height={30} fill="none" stroke={C.iron} strokeWidth={3} />
          <path d={`M${inner + 6},${h * 0.6} q-7,6 0,12`} fill="none" stroke={C.iron} strokeWidth={2.4} />
        </g>
      )}
      {/* a little shade on the meeting edge */}
      <rect x={side === "l" ? w - 3 : 0} y={0} width={3} height={h} fill="#000" opacity={0.25} />
    </svg>
  );
}

// The frame around the opening (opening itself transparent).
export function DoorFrame({ id }: { id: string }) {
  const { x, y, w, h } = FRAME;
  const t = FRAME_T;
  const pad = 14; // room for the shadow
  const vb = `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`;
  const outer = `M${x},${y + h} V${y} H${x + w} V${y + h} Z`;
  const hole = `M${x + t},${y + h} V${y + t} H${x + w - t} V${y + h} Z`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={vb} width={w + pad * 2} height={h + pad * 2}>
      <Defs id={id} />
      <g filter={`url(#${id}-shadow)`}>
        <g filter={`url(#${id}-wc)`}>
          <path d={`${outer} ${hole}`} fillRule="evenodd" fill={C.woodDark} />
          <g filter={`url(#${id}-grain)`}>
            <path d={`${outer} ${hole}`} fillRule="evenodd" fill="#6a3f23" opacity={0.85} />
          </g>
          <path d={`M${x + 2},${y + h} V${y + 2} H${x + w - 2}`} fill="none" stroke="#8a5a36" strokeWidth={1.4} opacity={0.7} />
          <path d={`M${x + t - 1},${y + h} V${y + t - 1} H${x + w - t + 1} V${y + h}`} fill="none" stroke="#2c1c12" strokeWidth={2} opacity={0.7} />
        </g>
      </g>
    </svg>
  );
}
export const FRAME_PAD = 14;

// ---------------------------------------------------------------------------
// Rattan mat
// ---------------------------------------------------------------------------

export function Mat({ id }: { id: string }) {
  const R = 100;
  const rings = Array.from({ length: 13 }, (_, i) => 8 + i * 7);
  const spokes = Array.from({ length: 72 }, (_, i) => (i / 72) * Math.PI * 2);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-110 -110 220 220" width={220} height={220}>
      <Defs id={id} />
      <g filter={`url(#${id}-shadow)`}>
        <g filter={`url(#${id}-wc)`}>
          <circle r={R} fill={C.rattan} />
          {rings.map((r, i) => (
            <circle key={r} r={r} fill="none" stroke={i % 2 ? C.rattanDark : C.rattanLight} strokeWidth={2.4} opacity={0.75} />
          ))}
          {/* the weave: tiny dashes along each ring */}
          {rings.map((r, i) => (
            <circle
              key={`w${r}`}
              r={r + 3.5}
              fill="none"
              stroke={C.rattanDark}
              strokeWidth={3}
              strokeDasharray={`2 ${2 + (i % 3)}`}
              opacity={0.45}
            />
          ))}
          {spokes.map((a, i) => (
            <line key={i} x1={Math.cos(a) * 6} y1={Math.sin(a) * 6} x2={Math.cos(a) * R} y2={Math.sin(a) * R} stroke="#a88356" strokeWidth={0.5} opacity={0.35} />
          ))}
          <circle r={R} fill="none" stroke={C.rattanDark} strokeWidth={4} />
          <circle r={R - 4} fill="none" stroke={C.rattanLight} strokeWidth={1.5} opacity={0.8} />
        </g>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Palm (side view)
// ---------------------------------------------------------------------------

function PalmShape({ x, y, h, lean = 0, s = 1 }: { x: number; y: number; h: number; lean?: number; s?: number }) {
  const tx = x + lean;
  const ty = y - h;
  const w0 = 5 * s;
  const w1 = 3.6 * s;
  const cx1 = x + lean * 0.3;
  const cy1 = y - h * 0.5;
  const trunk = `M${f(x - w0)},${f(y)} Q${f(cx1 - w0 * 0.9)},${f(cy1)} ${f(tx - w1)},${f(ty)} L${f(tx + w1)},${f(ty)} Q${f(cx1 + w0 * 0.9)},${f(cy1)} ${f(x + w0)},${f(y)} Z`;
  const rings: string[] = [];
  for (let t = 0.03; t < 0.97; t += 0.035) {
    const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx1 + t * t * tx;
    const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy1 + t * t * ty;
    const w = w0 + (w1 - w0) * t;
    rings.push(`M${f(px - w)},${f(py + 1.2)} L${f(px + w)},${f(py - 1.2)}`);
  }
  const angles = [-176, -158, -140, -122, -104, -88, -72, -55, -38, -20, -2, 168, 14];
  const fronds = angles.map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const L = (72 + ((i * 7) % 13)) * s;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const droop = Math.abs(ca) * L * 0.5 + (sa > 0 ? L * 0.25 : 0);
    const p2x = tx + ca * L;
    const p2y = ty + sa * L + droop;
    const p1x = tx + ca * L * 0.55;
    const p1y = ty + sa * L * 0.55 - L * 0.12;
    const leaflets: string[] = [];
    const n = 15;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const bx = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * p1x + t * t * p2x;
      const by = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * p1y + t * t * p2y;
      const dx = 2 * (1 - t) * (p1x - tx) + 2 * t * (p2x - p1x);
      const dy = 2 * (1 - t) * (p1y - ty) + 2 * t * (p2y - p1y);
      const dl = Math.hypot(dx, dy) || 1;
      const ux = dx / dl;
      const uy = dy / dl;
      const len = (20 - t * 12) * s;
      for (const side of [1, -1]) {
        const nx = -uy * side;
        const ny = ux * side;
        const ex = bx + (nx * 0.75 + ux * 0.6) * len;
        const ey = by + (ny * 0.75 + uy * 0.6) * len + len * 0.5;
        leaflets.push(`M${f(bx)},${f(by)} Q${f((bx + ex) / 2 + nx * 1.5)},${f((by + ey) / 2 + ny * 1.5)} ${f(ex)},${f(ey)}`);
      }
    }
    return { rib: `M${f(tx)},${f(ty)} Q${f(p1x)},${f(p1y)} ${f(p2x)},${f(p2y)}`, leaflets: leaflets.join(" "), i };
  });
  return (
    <g>
      <path d={trunk} fill={C.trunk} />
      <path d={rings.join(" ")} stroke="#7d6551" strokeWidth={1.1 * s} opacity={0.7} />
      <path d={trunk} fill="none" stroke="#6e5644" strokeWidth={0.8} opacity={0.6} />
      {fronds.map(({ rib, leaflets, i }) => (
        <g key={i}>
          <path d={leaflets} fill="none" stroke={i % 3 === 0 ? C.frondDark : i % 3 === 1 ? C.frond : "#a3b79c"} strokeWidth={2.2 * s} strokeLinecap="round" />
          <path d={rib} fill="none" stroke={C.frondDeep} strokeWidth={1.4 * s} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

export const PALM_VB = { w: 250, h: 560 };
export function PalmSticker({ id }: { id: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${PALM_VB.w} ${PALM_VB.h}`} width={PALM_VB.w} height={PALM_VB.h}>
      <Defs id={id} />
      <g filter={`url(#${id}-sticker)`}>
        <g filter={`url(#${id}-leaf)`}>
          <PalmShape x={112} y={548} h={430} lean={14} s={1.25} />
        </g>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Terracotta pots
// ---------------------------------------------------------------------------

function Pot({ x, base, w, h, neck = 0.55, lip = 0.1 }: { x: number; base: number; w: number; h: number; neck?: number; lip?: number }) {
  // an amphora-ish jar: narrow foot, round belly, narrow neck, rolled lip
  const top = base - h;
  const nw = (w * neck) / 2;
  const bw = w / 2;
  const fw = w * 0.28;
  const lipH = h * lip;
  const body = `M${f(x - fw)},${f(base)} C${f(x - bw * 1.15)},${f(base - h * 0.25)} ${f(x - bw * 1.05)},${f(top + h * 0.4)} ${f(x - nw)},${f(top + lipH * 1.6)} L${f(x + nw)},${f(top + lipH * 1.6)} C${f(x + bw * 1.05)},${f(top + h * 0.4)} ${f(x + bw * 1.15)},${f(base - h * 0.25)} ${f(x + fw)},${f(base)} Z`;
  return (
    <g>
      <path d={body} fill={C.clay} />
      {/* light from the left, shade on the right */}
      <path d={`M${f(x - bw * 0.7)},${f(base - h * 0.2)} C${f(x - bw * 0.95)},${f(base - h * 0.45)} ${f(x - bw * 0.8)},${f(top + h * 0.35)} ${f(x - nw * 0.6)},${f(top + h * 0.22)}`} stroke={C.clayLight} strokeWidth={w * 0.12} fill="none" opacity={0.7} strokeLinecap="round" />
      <path d={`M${f(x + bw * 0.75)},${f(base - h * 0.15)} C${f(x + bw * 1.0)},${f(base - h * 0.45)} ${f(x + bw * 0.85)},${f(top + h * 0.35)} ${f(x + nw * 0.8)},${f(top + h * 0.2)}`} stroke={C.clayDark} strokeWidth={w * 0.14} fill="none" opacity={0.55} strokeLinecap="round" />
      <rect x={x - nw * 1.25} y={top} width={nw * 2.5} height={lipH * 1.7} rx={lipH * 0.6} fill={C.clayLight} />
      <rect x={x - nw * 1.25} y={top + lipH * 1.1} width={nw * 2.5} height={lipH * 0.6} rx={lipH * 0.3} fill={C.clayDark} opacity={0.55} />
      <ellipse cx={x} cy={top + lipH * 0.5} rx={nw * 0.95} ry={lipH * 0.45} fill="#7b4a33" />
    </g>
  );
}

export const POTS_VB = { w: 200, h: 180 };
export function PotsSticker({ id }: { id: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${POTS_VB.w} ${POTS_VB.h}`} width={POTS_VB.w} height={POTS_VB.h}>
      <Defs id={id} />
      <g filter={`url(#${id}-sticker)`}>
        <g filter={`url(#${id}-wc)`}>
          <Pot x={120} base={128} w={72} h={112} neck={0.62} />
          <Pot x={62} base={170} w={78} h={92} neck={0.7} lip={0.12} />
          <Pot x={150} base={172} w={56} h={64} neck={0.72} lip={0.14} />
        </g>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Bougainvillea sprig
// ---------------------------------------------------------------------------

export const FLOWERS_VB = { w: 190, h: 300 };
export function FlowersSticker({ id }: { id: string }) {
  // main stem rising, side branches; leaves along them, bract clusters near the top
  const stems = [
    "M96,298 C92,240 102,190 92,130 C86,90 96,50 92,14",
    "M94,210 C76,196 60,180 48,150",
    "M93,150 C112,136 128,118 140,92",
    "M92,96 C76,84 66,66 62,44",
    "M95,250 C114,240 130,228 146,206",
  ];
  const leaves: [number, number, number, number][] = [
    [92, 280, -30, 1], [100, 262, 40, 1.1], [86, 236, -50, 1], [104, 222, 30, 1],
    [66, 186, -60, 0.9], [52, 160, -20, 0.9], [96, 176, 50, 1], [84, 120, -40, 0.9],
    [120, 128, 60, 0.9], [134, 104, 20, 0.8], [98, 70, 30, 0.8], [70, 62, -40, 0.8],
    [118, 236, 70, 0.9], [138, 214, 30, 0.9], [90, 30, 10, 0.7],
  ];
  const clusters: [number, number, number][] = [
    [92, 22, 1], [62, 40, 0.9], [48, 140, 1.05], [142, 84, 1], [146, 196, 0.9], [76, 96, 0.85], [114, 150, 0.8], [56, 176, 0.75],
  ];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${FLOWERS_VB.w} ${FLOWERS_VB.h}`} width={FLOWERS_VB.w} height={FLOWERS_VB.h}>
      <Defs id={id} />
      <g filter={`url(#${id}-sticker)`}>
        <g filter={`url(#${id}-leaf)`}>
          <path d={stems.join(" ")} fill="none" stroke={C.stem} strokeWidth={2.4} strokeLinecap="round" />
          {leaves.map(([x, y, rot, sc], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}>
              <path d="M0,0 C6,-6 16,-6 22,0 C16,6 6,6 0,0 Z" fill={i % 2 ? C.leaf : C.leafDark} />
              <path d="M1,0 L20,0" stroke={C.leafDark} strokeWidth={0.7} opacity={0.6} />
            </g>
          ))}
          {clusters.map(([x, y, sc], i) => (
            <g key={`c${i}`} transform={`translate(${x} ${y}) scale(${sc})`}>
              {/* papery bracts in threes, several heads per cluster */}
              {[
                [0, 0, 0], [-11, 6, 40], [10, 7, -30], [-4, -10, 70], [7, -8, 15], [-14, -4, 100], [13, -2, -60],
              ].map(([dx, dy, r], j) => (
                <g key={j} transform={`translate(${dx} ${dy}) rotate(${r})`}>
                  {[0, 120, 240].map((a) => (
                    <path
                      key={a}
                      transform={`rotate(${a})`}
                      d="M0,0 C-5,-3 -6,-9 0,-11 C6,-9 5,-3 0,0 Z"
                      fill={(j + a / 120) % 3 === 0 ? C.bractDark : (j + a / 120) % 3 === 1 ? C.bract : C.bractLight}
                    />
                  ))}
                  <circle r={1} fill="#f6e7b5" />
                </g>
              ))}
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// String lights (live SVG, in scene units): a sagging cord across the top
// of the door with hanging bulbs that twinkle.
// ---------------------------------------------------------------------------

export function StringLights() {
  const x0 = FRAME.x - 26;
  const x1 = FRAME.x + FRAME.w + 30;
  const y0 = FRAME.y + 54;
  const y1 = FRAME.y + 48;
  const sag = 22;
  // two swags
  const mid = (x0 + x1) / 2;
  const cord = `M${x0},${y0} Q${(x0 + mid) / 2},${y0 + sag * 2} ${mid},${(y0 + y1) / 2 + 2} Q${(mid + x1) / 2},${y1 + sag * 2} ${x1},${y1}`;
  const pt = (t: number) => {
    // point on the two quadratic swags, t in 0..1
    const half = t < 0.5;
    const u = half ? t * 2 : (t - 0.5) * 2;
    const ax = half ? x0 : mid;
    const ay = half ? y0 : (y0 + y1) / 2 + 2;
    const cx = half ? (x0 + mid) / 2 : (mid + x1) / 2;
    const cy = half ? y0 + sag * 2 : y1 + sag * 2;
    const bx = half ? mid : x1;
    const by = half ? (y0 + y1) / 2 + 2 : y1;
    return [(1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by];
  };
  const bulbs = Array.from({ length: 11 }, (_, i) => pt(0.05 + (i / 10) * 0.9));
  return (
    <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="rd-layer rd-lights" aria-hidden="true">
      <defs>
        <radialGradient id="rd-bulb-glow">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={cord} fill="none" stroke="#6f6152" strokeWidth={1.2} />
      {bulbs.map(([x, y], i) => (
        <g key={i} className="rd-bulb" style={{ animationDelay: `${(i * 0.37) % 2.4}s` }}>
          <line x1={x} y1={y} x2={x} y2={y + 6} stroke="#6f6152" strokeWidth={1} />
          <circle cx={x} cy={y + 10} r={9} fill="url(#rd-bulb-glow)" className="rd-glow" />
          <rect x={x - 1.8} y={y + 5} width={3.6} height={2.4} fill="#4b4036" />
          <ellipse cx={x} cy={y + 10.5} rx={2.6} ry={3.6} fill="#fff4cf" stroke="#e7c879" strokeWidth={0.6} />
        </g>
      ))}
    </svg>
  );
}
