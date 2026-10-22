#!/usr/bin/env node
// MIGMODS — contrôle avant/après du fond animé .site-bg (DESIGN-SYSTEM.md §7.10).
// Usage (depuis migmods/) : node tools/check-site-bg.mjs
// Rend, figés au même instant, l'ancien fond (deux dégradés coniques flous, migmods-ui.css) et le nouveau
// (texture migmods-glow.webp × 4 + grain migmods-grain.png), sur iPhone 15 Pro et ordinateur 1440 × 900.
// Écrit tools/out/site-bg-<mob|desk>.png (ancien | nouveau, luminosité × 4) et affiche les écarts.
// Échec si l'écart moyen dépasse 2 niveaux : « le rendu doit rester le même à l'œil ».
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.mjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tools/out');
fs.mkdirSync(out, { recursive: true });
const asset = (f) => pathToFileURL(path.join(root, 'theme/assets', f)).href;

const OLD = `.site-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; background: radial-gradient(circle, rgba(255,255,255,.035), rgba(0,0,0,.5)), #000; }
.site-bg::before, .site-bg::after { content: ""; position: absolute; top: 50%; left: 50%; width: 200vmax; height: 200vmax; background: conic-gradient(from 0deg, #000, #3a3a3a, #0b0b0b, #8c8c8c, #151515, #d6d6d6, #1e1e1e, #000); transform: translate(-50%, -50%); filter: blur(60px); opacity: .2; }
.site-bg::after { width: 180vmax; height: 180vmax; opacity: .12; transform: translate(-50%, -50%) rotate(180deg); }`;
const NEW = `.site-bg { position: fixed; inset: 0; z-index: -1; background: #000; pointer-events: none; contain: strict; overflow: hidden; }
.site-bg::before { content: ""; position: absolute; top: 50%; left: 50%; width: 36vmax; height: 36vmax; background: url("${asset('migmods-glow.webp')}") center / cover; transform: translate(-50%, -50%) scale(4); opacity: .9; }
.site-bg::after { content: ""; position: absolute; inset: 0; background: url("${asset('migmods-grain.png')}"); opacity: .035; }`;
const page = (css) => `<!doctype html><style>html{background:#000}body{margin:0;height:100vh}${css}</style><div class="site-bg"></div>`;

const browser = await chromium.launch();
let fail = false;
for (const [name, viewport] of [['mob', { width: 393, height: 852 }], ['desk', { width: 1440, height: 900 }]]) {
  const p = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const shots = {};
  for (const [k, css] of [['old', OLD], ['new', NEW]]) {
    const f = path.join(out, `site-bg-${k}.html`);
    fs.writeFileSync(f, page(css));
    await p.goto(pathToFileURL(f).href);
    await p.waitForTimeout(300);
    shots[k] = await p.screenshot();
    fs.unlinkSync(f);
  }
  // Mesure et planche dans le navigateur (aucune dépendance) : luminance moyenne, écart, côte à côte × 4.
  const res = await p.evaluate(async ({ a, b }) => {
    const load = (b64) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + b64; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = ia.width, h = ia.height, c = document.createElement('canvas'); c.width = w * 2 + 8; c.height = h;
    const x = c.getContext('2d'); x.drawImage(ia, 0, 0); x.drawImage(ib, w + 8, 0);
    const da = x.getImageData(0, 0, w, h).data, db = x.getImageData(w + 8, 0, w, h).data;
    let sa = 0, sb = 0, sd = 0; const n = w * h;
    for (let i = 0; i < da.length; i += 4) { sa += da[i]; sb += db[i]; sd += Math.abs(da[i] - db[i]); }
    const all = x.getImageData(0, 0, c.width, h);
    for (let i = 0; i < all.data.length; i += 4) for (let k = 0; k < 3; k++) all.data[i + k] = Math.min(255, all.data[i + k] * 4);
    x.putImageData(all, 0, 0); x.fillStyle = '#fff'; x.fillRect(w, 0, 8, h);
    return { old: sa / n, now: sb / n, diff: sd / n, png: c.toDataURL('image/png').split(',')[1] };
  }, { a: shots.old.toString('base64'), b: shots.new.toString('base64') });
  fs.writeFileSync(path.join(out, `site-bg-${name}.png`), Buffer.from(res.png, 'base64'));
  const ok = res.diff <= 2;
  fail ||= !ok;
  console.log(`${ok ? '✔' : '✘'} ${name} ${viewport.width}×${viewport.height} : luminance moyenne ancien ${res.old.toFixed(2)}, nouveau ${res.now.toFixed(2)}, écart moyen ${res.diff.toFixed(2)} niveau(x) → tools/out/site-bg-${name}.png`);
  await p.close();
}
await browser.close();
if (fail) process.exit(1);
