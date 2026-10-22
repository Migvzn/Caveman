#!/usr/bin/env node
// MIGMODS — planche de contrôle des polices corrigées (DESIGN-SYSTEM.md §4.1).
// Usage (depuis migmods/) : node tools/fonts-sheet.mjs
// Écrit tools/out/fonts-sheet-<style>.png (romain 300, romain 500, italique 400) :
// la phrase de contrôle en 84, 56, 32 et 20 px, avec la fonte d'origine (« avant », grisée) sous la fonte corrigée.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tools/out');
fs.mkdirSync(out, { recursive: true });
const url = (p) => pathToFileURL(path.join(root, p)).href;

const TEXT = 'vôtre, fenêtre, île, Réserve, Évreux, pièce, à, là, Œuvre, 21 600, NH35';
const STYLES = [
  { id: '300', label: 'Romain 300', after: 'theme/assets/cormorant-garamond-300.woff2', before: 'tools/fonts-src/cormorant-garamond-latin-300-normal.woff2', style: 'normal', weight: 300 },
  { id: '500', label: 'Romain 500', after: 'theme/assets/cormorant-garamond-500.woff2', before: 'tools/fonts-src/cormorant-garamond-latin-500-normal.woff2', style: 'normal', weight: 500 },
  { id: 'italic', label: 'Italique 400', after: 'theme/assets/cormorant-garamond-400-italic.woff2', before: 'tools/fonts-src/cormorant-garamond-latin-400-italic.woff2', style: 'italic', weight: 400 },
];
const SIZES = [84, 56, 32, 20];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 400 }, deviceScaleFactor: 1 });
for (const s of STYLES) {
  const rows = SIZES.map((px) => `
    <div class="row"><span class="tag">${px} px · corrigée</span><p class="after" style="font-size:${px}px">${TEXT}</p></div>
    <div class="row"><span class="tag">${px} px · avant</span><p class="before" style="font-size:${px}px">${TEXT}</p></div>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    @font-face { font-family: After; src: url("${url(s.after)}") format("woff2"); font-weight: ${s.weight}; font-style: ${s.style}; }
    @font-face { font-family: Before; src: url("${url(s.before)}") format("woff2"); font-weight: ${s.weight}; font-style: ${s.style}; }
    html { background: #050505; color: #F3F4F6; -webkit-font-smoothing: antialiased; font-synthesis: none; }
    body { margin: 0; padding: 32px 40px; width: 1520px; }
    h1 { font: 500 12px/1.3 system-ui, sans-serif; letter-spacing: .24em; text-transform: uppercase; color: #9CA0A7; margin: 0 0 24px; }
    .row { display: grid; grid-template-columns: 150px 1fr; align-items: baseline; border-top: 1px solid rgba(255,255,255,.1); padding: 10px 0; }
    .tag { font: 12px/1.2 system-ui, sans-serif; color: #9CA0A7; }
    p { margin: 0; font-weight: ${s.weight}; font-style: ${s.style}; font-variant-numeric: lining-nums; line-height: 1.15; }
    .after { font-family: After; }
    .before { font-family: Before; color: #6E7279; }
  </style><h1>Cormorant Garamond · ${s.label} · planche de contrôle §4.1</h1>${rows}`;
  const file = path.join(out, `fonts-sheet-${s.id}.html`);
  fs.writeFileSync(file, html);
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => [...document.fonts].every((f) => f.status === 'loaded'));
  if (!ok) { console.error(`✘ ${s.label} : une police n’a pas été chargée`); process.exitCode = 1; }
  const png = path.join(out, `fonts-sheet-${s.id}.png`);
  await page.screenshot({ path: png, fullPage: true });
  fs.unlinkSync(file);
  console.log('✔ ' + path.relative(root, png));
}
await browser.close();
