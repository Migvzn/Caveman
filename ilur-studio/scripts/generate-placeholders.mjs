// Génère des images de remplacement (parking béton + silhouettes) dans /public/images.
// Usage : npm run placeholders
// Remplace ensuite chaque fichier par la vraie photo du shooting en gardant le même nom.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/images");
const C = {
  ink: "#0A0A0A",
  concrete: "#D9D7D2",
  asphalt: "#2B2B2B",
  bone: "#F4F2EE",
  pink: "#FF0A8C",
  pinkSoft: "#F7B8D6",
  pinkDeep: "#E0287A",
  denim: "#7E8EA3",
};

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blob(r, cx, cy, size) {
  const n = 7;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rad = size * (0.55 + r() * 0.6);
    pts.push([cx + Math.cos(a) * rad * 1.4, cy + Math.sin(a) * rad]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p1 = pts[(i + 1) % n];
    const p0 = pts[i];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    d += ` Q${p0[0].toFixed(1)},${p0[1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  return d + "Z";
}

function camoPattern(id, seed, scale = 1) {
  const r = rng(seed);
  const w = 240 * scale;
  let blobs = "";
  const colors = [C.pinkDeep, C.bone, C.pinkDeep, "#C9708F", C.bone];
  for (let i = 0; i < 16; i++) {
    blobs += `<path d="${blob(r, r() * w, r() * w, (14 + r() * 22) * scale)}" fill="${colors[i % colors.length]}"/>`;
  }
  return `<pattern id="${id}" width="${w}" height="${w}" patternUnits="userSpaceOnUse"><rect width="${w}" height="${w}" fill="${C.pinkSoft}"/>${blobs}</pattern>`;
}

const defs = (extra = "") => `
<defs>
  <filter id="noise" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" result="n"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="table" tableValues="0 0.22"/></feComponentTransfer>
    <feBlend in2="SourceGraphic" mode="multiply"/>
  </filter>
  <filter id="blur40"><feGaussianBlur stdDeviation="40"/></filter>
  <filter id="blur12"><feGaussianBlur stdDeviation="12"/></filter>
  <linearGradient id="pillar" x1="0" x2="1">
    <stop offset="0" stop-color="#3a3937"/><stop offset="0.45" stop-color="#6d6b67"/><stop offset="1" stop-color="#2a2928"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#2b2b2b"/><stop offset="1" stop-color="#121212"/>
  </linearGradient>
  <radialGradient id="light" cx="0.5" cy="0" r="0.9">
    <stop offset="0" stop-color="#e9f1ff" stop-opacity="0.55"/><stop offset="0.6" stop-color="#9aa3ad" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  ${extra}
</defs>`;

// Silhouette debout en veste coupe-vent oversize + pantalon large.
function figure(x, y, s, jacket, pants, lean = 0) {
  const jf = jacket === "camo" ? "url(#camo)" : jacket === "black" ? "#161616" : jacket;
  const pf = pants === "denim" ? C.denim : "#0f0f0f";
  const panel = jacket === "black" ? `<path d="M-70,40 L-30,40 L-38,250 L-92,250 Z" fill="#2a2a2a"/><path d="M70,40 L30,40 L38,250 L92,250 Z" fill="#2a2a2a"/>` : "";
  const mark =
    jacket === "black"
      ? `<text x="22" y="92" font-family="Arial Black, sans-serif" font-size="13" fill="${C.bone}">ILUR.STUDIO</text>`
      : `<text x="24" y="94" font-family="Arial Black, sans-serif" font-size="18" fill="${C.ink}">ILUR</text>`;
  return `<g transform="translate(${x},${y}) scale(${s}) rotate(${lean})">
    <ellipse cx="0" cy="560" rx="150" ry="18" fill="#000" opacity="0.55"/>
    <path d="M-58,240 L-102,548 L-34,552 L-6,330 L6,330 L34,552 L102,548 L58,240 Z" fill="${pf}"/>
    <path d="M-30,548 l-80,0 l6,18 l78,0 Z M30,548 l80,0 l-6,18 l-78,0 Z" fill="${C.bone}" opacity="0.9"/>
    <path d="M-80,30 Q0,-6 80,30 L120,90 L150,250 L118,262 L96,140 L100,262 L-100,262 L-96,140 L-118,262 L-150,250 L-120,90 Z" fill="${jf}"/>
    ${panel}
    <path d="M-46,30 Q-52,-60 0,-70 Q52,-60 46,30 Q0,10 -46,30 Z" fill="${jf}"/>
    <ellipse cx="0" cy="-22" rx="26" ry="32" fill="#8a7466"/>
    <path d="M-26,-30 Q0,-62 26,-30 Q20,-50 0,-54 Q-20,-50 -26,-30Z" fill="#111"/>
    <line x1="0" y1="24" x2="0" y2="262" stroke="#050505" stroke-width="5"/>
    ${mark}
  </g>`;
}

function parking({ w, h, seed, figures = [], tube = 0.5, label }) {
  const r = rng(seed);
  const horizon = h * 0.58;
  let pillars = "";
  const pcount = 4;
  for (let i = 0; i < pcount; i++) {
    const px = (w / pcount) * i + r() * 80 + 40;
    const pw = 70 + r() * 90;
    pillars += `<rect x="${px}" y="${h * 0.08}" width="${pw}" height="${horizon - h * 0.08 + 20}" fill="url(#pillar)" opacity="${0.35 + r() * 0.4}"/>`;
    pillars += `<rect x="${px}" y="${horizon - 60}" width="${pw}" height="80" fill="#c9b81e" opacity="0.18"/>`;
  }
  let lines = "";
  for (let i = -6; i <= 6; i++) {
    const x2 = w / 2 + i * w * 0.22;
    lines += `<line x1="${w / 2 + i * 40}" y1="${horizon}" x2="${x2}" y2="${h}" stroke="${C.bone}" stroke-opacity="0.18" stroke-width="5"/>`;
  }
  const tx = w * tube;
  const figs = figures.map((f) => figure(f.x * w, f.y * h, (f.s * h) / 1600, f.jacket, f.pants, f.lean ?? 0)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs(camoPattern("camo", seed + 7, 0.6))}
  <rect width="${w}" height="${h}" fill="#171716"/>
  <rect width="${w}" height="${h * 0.1}" fill="#242423"/>
  ${pillars}
  <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#floor)"/>
  ${lines}
  <ellipse cx="${tx}" cy="${h * 0.02}" rx="${w * 0.55}" ry="${h * 0.75}" fill="url(#light)"/>
  <rect x="${tx - w * 0.16}" y="${h * 0.045}" width="${w * 0.32}" height="${Math.max(10, h * 0.012)}" rx="6" fill="#eef6ff" filter="url(#blur12)"/>
  <rect x="${tx - w * 0.15}" y="${h * 0.047}" width="${w * 0.3}" height="${Math.max(6, h * 0.007)}" rx="4" fill="#ffffff"/>
  ${figs}
  <rect width="${w}" height="${h}" fill="#888" filter="url(#noise)" opacity="0.9" style="mix-blend-mode:multiply"/>
  <text x="${w * 0.03}" y="${h * 0.965}" font-family="DejaVu Sans Mono, monospace" font-size="${Math.round(h * 0.018)}" fill="${C.bone}" opacity="0.55" letter-spacing="2">PLACEHOLDER · ${label}</text>
</svg>`;
}

// Packshots ----------------------------------------------------------------
function garment(kind, fill, accent) {
  switch (kind) {
    case "jacket":
      return `<path d="M-170,-210 Q0,-250 170,-210 L250,-90 L300,250 L230,270 L190,-20 L190,300 L-190,300 L-190,-20 L-230,270 L-300,250 L-250,-90 Z" fill="${fill}"/>
        <path d="M-95,-215 Q-110,-360 0,-370 Q110,-360 95,-215 Q0,-240 -95,-215Z" fill="${fill}"/>
        <path d="M-60,-220 Q0,-330 60,-220" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="10"/>
        <line x1="0" y1="-228" x2="0" y2="300" stroke="#070707" stroke-width="9"/>
        <rect x="-190" y="270" width="380" height="30" fill="#000" opacity="0.25"/>
        ${accent}`;
    case "hoodie":
      return `<path d="M-170,-210 Q0,-250 170,-210 L250,-90 L300,250 L230,270 L190,-20 L190,300 L-190,300 L-190,-20 L-230,270 L-300,250 L-250,-90 Z" fill="${fill}"/>
        <path d="M-95,-215 Q-110,-350 0,-360 Q110,-350 95,-215 Q0,-170 -95,-215Z" fill="${fill}"/>
        <path d="M-120,140 L120,140 L150,250 L-150,250 Z" fill="#000" opacity="0.2"/>
        ${accent}`;
    case "tee":
      return `<path d="M-160,-220 Q0,-180 160,-220 L290,-120 L240,-20 L180,-60 L180,300 L-180,300 L-180,-60 L-240,-20 L-290,-120 Z" fill="${fill}"/>
        <path d="M-60,-212 Q0,-160 60,-212" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="10"/>
        ${accent}`;
    case "pants":
      return `<path d="M-170,-300 L170,-300 L230,330 L40,330 L0,-80 L-40,330 L-230,330 Z" fill="${fill}"/>
        <rect x="-170" y="-300" width="340" height="40" fill="#000" opacity="0.3"/>
        ${accent}`;
    case "beanie":
      return `<path d="M-200,60 Q-210,-260 0,-270 Q210,-260 200,60 Z" fill="${fill}"/>
        <rect x="-215" y="40" width="430" height="150" rx="20" fill="${fill}"/>
        <rect x="-215" y="40" width="430" height="150" rx="20" fill="#000" opacity="0.12"/>
        ${accent}`;
  }
}

function packshot({ w, h, kind, fill, accent, label, seed }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs(camoPattern("camo", seed, 1))}
  <rect width="${w}" height="${h}" fill="${C.concrete}"/>
  <ellipse cx="${w / 2}" cy="${h * 0.86}" rx="${w * 0.33}" ry="${h * 0.03}" fill="#000" opacity="0.18" filter="url(#blur40)"/>
  <g transform="translate(${w / 2},${h * 0.5}) scale(${w / 1000})">${garment(kind, fill, accent)}</g>
  <rect width="${w}" height="${h}" fill="#bbb" filter="url(#noise)" opacity="0.6" style="mix-blend-mode:multiply"/>
  <text x="${w * 0.05}" y="${h * 0.955}" font-family="DejaVu Sans Mono, monospace" font-size="${Math.round(h * 0.02)}" fill="${C.ink}" opacity="0.5" letter-spacing="2">PLACEHOLDER · ${label}</text>
</svg>`;
}

const logoSmall = (x, y, color, size = 34) =>
  `<text x="${x}" y="${y}" font-family="Arial Black, sans-serif" font-weight="900" font-size="${size}" fill="${color}">ILUR</text>`;
const studio = (x, y, color, size = 22) =>
  `<text x="${x}" y="${y}" font-family="Arial Black, sans-serif" font-weight="900" font-size="${size}" fill="${color}">ILUR.STUDIO</text>`;

const PRODUCTS = [
  { slug: "coupe-vent-camo-rose", kind: "jacket", fill: "url(#camo)", accent: logoSmall(40, -120, C.ink), worn: { jacket: "camo", pants: "black" } },
  {
    slug: "coupe-vent-noir-ilur-studio",
    kind: "jacket",
    fill: "#151515",
    accent: `<path d="M-190,-20 L-120,-20 L-110,300 L-190,300Z M190,-20 L120,-20 L110,300 L190,300Z" fill="#2c2c2c"/>${studio(28, -120, C.bone)}`,
    worn: { jacket: "black", pants: "denim" },
  },
  {
    slug: "hoodie-bubble-logo",
    kind: "hoodie",
    fill: "#1a1a1a",
    accent: `<text x="0" y="40" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="110" fill="${C.bone}" stroke="${C.pink}" stroke-width="8" paint-order="stroke">ILUR</text>`,
    worn: { jacket: "#1a1a1a", pants: "denim" },
  },
  { slug: "t-shirt-ilur-studio", kind: "tee", fill: C.bone, accent: studio(-70, -60, C.ink, 26), worn: { jacket: C.bone, pants: "black" } },
  { slug: "pantalon-baggy-noir", kind: "pants", fill: "#141414", accent: logoSmall(70, 240, C.pink, 30), worn: { jacket: "black", pants: "black" } },
  { slug: "bonnet-camo-rose", kind: "beanie", fill: "url(#camo)", accent: `<rect x="-70" y="80" width="140" height="60" fill="${C.ink}"/>${logoSmall(-50, 124, C.bone, 34)}`, worn: { jacket: "black", pants: "denim" } },
];

const LOOKS = [
  { file: "shooting-01.jpg", w: 2400, h: 1500, tube: 0.5, figures: [{ x: 0.4, y: 0.33, s: 0.95, jacket: "camo", pants: "black", lean: -2 }, { x: 0.6, y: 0.35, s: 0.92, jacket: "black", pants: "denim", lean: 2 }] },
  { file: "shooting-02.jpg", w: 1400, h: 1900, tube: 0.45, figures: [{ x: 0.5, y: 0.36, s: 1.05, jacket: "camo", pants: "black" }] },
  { file: "shooting-03.jpg", w: 1400, h: 1900, tube: 0.6, figures: [{ x: 0.5, y: 0.37, s: 1.0, jacket: "black", pants: "denim", lean: 3 }] },
  { file: "shooting-04.jpg", w: 2000, h: 1400, tube: 0.3, figures: [{ x: 0.32, y: 0.36, s: 0.9, jacket: "black", pants: "black" }, { x: 0.58, y: 0.36, s: 0.9, jacket: "camo", pants: "denim", lean: -3 }] },
  { file: "shooting-05.jpg", w: 1400, h: 1900, tube: 0.5, figures: [{ x: 0.5, y: 0.37, s: 1.0, jacket: "#1a1a1a", pants: "denim" }] },
  { file: "shooting-06.jpg", w: 1400, h: 1900, tube: 0.4, figures: [{ x: 0.48, y: 0.36, s: 1.0, jacket: "camo", pants: "denim", lean: 2 }] },
];

async function write(svg, file) {
  const target = path.join(OUT, file);
  await mkdir(path.dirname(target), { recursive: true });
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(target);
  console.log("✓", file);
}

for (const [i, l] of LOOKS.entries()) {
  await write(parking({ ...l, seed: 11 + i * 13, label: l.file }), l.file);
}
for (const [i, p] of PRODUCTS.entries()) {
  const f1 = `products/${p.slug}-1.jpg`;
  const f2 = `products/${p.slug}-2.jpg`;
  await write(packshot({ w: 1200, h: 1500, kind: p.kind, fill: p.fill, accent: p.accent, label: f1, seed: 3 + i }), f1);
  await write(
    parking({ w: 1200, h: 1500, seed: 40 + i * 7, tube: 0.5, label: f2, figures: [{ x: 0.5, y: 0.37, s: 1.0, ...p.worn }] }),
    f2,
  );
}
