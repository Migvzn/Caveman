#!/usr/bin/env node
// MIGMODS — rendus des Créations signature (DESIGN-SYSTEM.md §10.1, §10.3, §10.7)
//
// Usage (depuis migmods/) :
//   node tools/render-signatures.mjs                 rendus + snippets + planche de contrôle
//   node tools/render-signatures.mjs --layers abysse   … et calques de la vue éclatée (§10.3)
//   node tools/render-signatures.mjs --only abysse,lagon   ne refait que ces rendus
//   node tools/render-signatures.mjs --no-render     snippets et contrôles seulement (aucun navigateur)
//
// Source unique : configurator/signatures.json (les entrées « reserve » ne sont ni rendues ni publiées).
// Le moteur est celui du thème : theme/assets/migmods-configurator.js + migmods-components.json + mm-*.png
// (produits par tools/build-theme.mjs, qui appelle cet outil juste avant le zip).
//
// Produit :
//   theme/assets/sig-<id>-800.webp (≤ 90 Ko) et sig-<id>-480.webp (≤ 35 Ko), WebP qualité 82, fond transparent
//   theme/assets/sig-layer-<calque>.webp (≤ 60 Ko, 800 × 800, alignés) avec --layers
//   theme/snippets/signature-list.liquid et theme/snippets/catalogue-facts.liquid (générés, jamais édités)
//   tools/out/signatures-sheet.png (planche à valider à l'œil avant publication)
// Sortie non nulle si une composition est refusée par le moteur ou si un budget est dépassé.
//
// Le module exporte aussi withRenderer() pour les outils de démonstration (simulateur).

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONF = path.join(ROOT, 'configurator');
const THEME = path.join(ROOT, 'theme');
const ASSETS = path.join(THEME, 'assets');
const SNIPPETS = path.join(THEME, 'snippets');
const OUT = path.join(ROOT, 'tools', 'out');
const PLAYWRIGHT = '/opt/node22/lib/node_modules/playwright/index.mjs';

export const BUDGET = { 800: 90 * 1024, 480: 35 * 1024, layer: 60 * 1024 };
const QUALITY = 82;
const HEADER = '{%- comment -%} FICHIER GÉNÉRÉ par migmods/tools/render-signatures.mjs — ne pas éditer. {%- endcomment -%}';
// Calques de la vue éclatée : nom publié → étape du configurateur (de bas en haut).
export const LAYERS = [['strap', 'strap'], ['case', 'case'], ['bezel', 'bezel_insert'], ['dial', 'dial'], ['hands', 'hands'], ['second', 'second_hand']];

// ------------------------------------------------------------------ données
export function loadData() {
  const sigs = JSON.parse(fs.readFileSync(path.join(CONF, 'signatures.json'), 'utf8'));
  const comps = JSON.parse(fs.readFileSync(path.join(CONF, 'components.json'), 'utf8'));
  const byId = {};
  for (const s of comps.steps) { byId[s.id] = {}; for (const o of s.options) byId[s.id][o.id] = o; }
  const errors = [];
  const seen = new Set();
  for (const g of sigs) {
    if (!/^[a-z0-9-]+$/.test(g.id || '')) errors.push(`identifiant invalide : « ${g.id} »`);
    if (seen.has(g.id)) errors.push(`identifiant en double : ${g.id}`);
    seen.add(g.id);
    for (const k of ['name', 'config', 'legend', 'text', 'movement']) if (!g[k]) errors.push(`${g.id} : champ « ${k} » manquant`);
    g.parts = (g.config || '').split('|').map((p) => { const i = p.indexOf(':'); return { step: p.slice(0, i), id: p.slice(i + 1) }; });
    g.total = 0;
    for (const p of g.parts) {
      const o = byId[p.step] && byId[p.step][p.id];
      if (!o) { errors.push(`${g.id} : composant inconnu « ${p.step}:${p.id} »`); continue; }
      if (o.stock === false) errors.push(`${g.id} : « ${p.step}:${p.id} » est hors stock`);
      p.price = o.price || 0;
      p.label = o.label;
      g.total += p.price;
    }
    g.total += comps.basePrice || 0;
    // Le calibre annoncé doit être celui que le moteur déduit du cadran.
    const pr = comps.movementPriority || [];
    let mv = null;
    for (const p of g.parts) { const o = byId[p.step] && byId[p.step][p.id]; if (o && o.movement && (mv == null || pr.indexOf(o.movement) < pr.indexOf(mv))) mv = o.movement; }
    mv = mv || comps.defaultMovement || 'NH35';
    if (g.movement && g.movement !== mv) errors.push(`${g.id} : calibre annoncé ${g.movement}, le moteur déduit ${mv}`);
    for (const k of ['name', 'legend', 'text']) {
      if (/'/.test(g[k] || '')) errors.push(`${g.id} : apostrophe droite dans « ${k} » (utiliser ’)`);
      if (/[ →]/.test(g[k] || '')) errors.push(`${g.id} : caractère absent des polices dans « ${k} » (U+202F ou →)`);
    }
  }
  const published = sigs.filter((g) => !g.reserve);
  return { sigs, published, comps, byId, errors };
}

// Configuration utilisée pour l'image seulement : le fond saphir est incrusté par le moteur
// en bas à droite, où il chevaucherait le filigrane. Le lien ?c= garde la configuration réelle.
export const imageConfig = (config) => config.replace(/(^|\|)caseback:transparent(?=\||$)/, '$1caseback:plein');

// ------------------------------------------------------------------ moteur (Playwright)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>@font-face{font-family:Inter;src:url(/inter.woff2) format("woff2");font-weight:100 900}
@font-face{font-family:"Cormorant Garamond";src:url(/cormorant-garamond-500.woff2) format("woff2");font-weight:500}
html,body{margin:0;background:#050505;color:#eee}</style>
<link rel="stylesheet" href="/migmods-configurator.css">
<script>window.MIGMODS_OPTIONS={assetBase:'/',stage:'none',updateUrl:false,exportStage:['rgba(0,0,0,0)','rgba(0,0,0,0)'],watermarkSrc:'/logo-migmods-480.png',scale:.96};</script>
</head><body><div data-migmods-configurator data-src="/migmods-components.json"></div>
<script src="/migmods-configurator.js" defer></script></body></html>`;

export async function withRenderer(fn) {
  for (const f of ['migmods-configurator.js', 'migmods-configurator.css', 'migmods-components.json', 'logo-migmods-480.png']) {
    if (!fs.existsSync(path.join(ASSETS, f))) throw new Error(`theme/assets/${f} manquant : lancer d'abord node tools/build-theme.mjs`);
  }
  const srv = http.createServer((q, r) => {
    const p = decodeURIComponent(q.url.split('?')[0]);
    if (p === '/__sig.html') { r.writeHead(200, { 'Content-Type': TYPES['.html'] }); return r.end(PAGE); }
    const f = path.join(ASSETS, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
    if (!f.startsWith(ASSETS) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    r.end(fs.readFileSync(f));
  });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const { chromium } = await import(PLAYWRIGHT);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push('erreur JS : ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url().replace(base, '')}`); });

  // Charge une composition et attend que chaque calque soit décodé. Renvoie l'état lu par le moteur.
  async function load(config) {
    problems.length = 0;
    await page.goto(`${base}/__sig.html?c=${encodeURIComponent(config)}`);
    await page.waitForFunction(() => { const r = document.querySelector('[data-migmods-configurator]'); return r && r._mm && r._mm.data && r._mm._wm; }, null, { timeout: 20000 });
    await page.waitForFunction(() => {
      const m = document.querySelector('[data-migmods-configurator]')._mm;
      const ids = Object.keys(m.layers);
      return ids.length && ids.every((id) => m.layers[id].img && !m.layers[id].prev);
    }, null, { timeout: 20000 });
    await page.waitForTimeout(250);
    return page.evaluate(() => {
      const m = document.querySelector('[data-migmods-configurator]')._mm;
      const t = document.querySelector('.mm-toast');
      return { sel: JSON.parse(JSON.stringify(m.sel)), again: m.validate(true), toast: t && t.classList.contains('is-on') ? t.textContent : '', total: m.total(), movement: m.movement(), layers: Object.keys(m.layers), broken: Object.keys(m.layers).filter((id) => !m.layers[id].img.naturalWidth) };
    });
  }
  // Vérifie que le moteur a lu exactement la composition demandée (et rien d'autre).
  function check(config, st) {
    const want = {};
    for (const p of config.split('|')) { const i = p.indexOf(':'); want[p.slice(0, i)] = p.slice(i + 1); }
    const errs = [];
    for (const [k, v] of Object.entries(want)) if (st.sel[k] !== v) errs.push(`${k}:${v} lu « ${st.sel[k] ?? 'rien'} »`);
    for (const k of Object.keys(st.sel)) if (!(k in want)) errs.push(`étape ajoutée par le moteur : ${k}:${st.sel[k]}`);
    if (st.again.length) errs.push('incompatibilités : ' + st.again.join(' / '));
    if (st.toast) errs.push('message du configurateur : ' + st.toast);
    if (st.broken.length) errs.push('images illisibles : ' + st.broken.join(', '));
    errs.push(...problems);
    return errs;
  }
  // PNG 1200 px de la composition chargée, filigrane compris (exportPng du moteur).
  // { watermark: false } : même peinture sans filigrane (images de démonstration du simulateur).
  async function exportPng({ watermark = true } = {}) {
    const url = await page.evaluate((wm) => {
      const m = document.querySelector('[data-migmods-configurator]')._mm;
      if (wm) return m.exportPng().toDataURL('image/png');
      const c = document.createElement('canvas'); c.width = c.height = 1200;
      const ctx = c.getContext('2d'); ctx.scale(1.2, 1.2);
      m.paint(ctx, { instant: true, watermark: false, export: true });
      return c.toDataURL('image/png');
    }, watermark);
    return Buffer.from(url.split(',')[1], 'base64');
  }
  // Chaque calque seul, peint par le moteur sur la même toile (mêmes transformations), sans filigrane.
  // Le boîtier est photographié vide sur fond blanc : sous le cadran (rayon exact du cadran, donc
  // invisible une fois la montre assemblée), son intérieur devient une cavité sombre pour la vue éclatée.
  async function exportLayers(steps) {
    const urls = await page.evaluate((steps) => {
      const m = document.querySelector('[data-migmods-configurator]')._mm, all = m.layers, out = {};
      const g = m.family().geometry, sc = m.o.scale || 1;
      try {
        for (const id of steps) {
          if (!all[id]) { out[id] = null; continue; }
          m.layers = { [id]: all[id] };
          const c = document.createElement('canvas'); c.width = c.height = 1200;
          const ctx = c.getContext('2d'); ctx.scale(1.2, 1.2);
          m.paint(ctx, { instant: true, watermark: false, export: true });
          if (id === 'case' && g.dial) {
            const r = (g.dial / 2 - 1.5) * sc;
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            const grd = ctx.createRadialGradient(500, 470, r * 0.08, 500, 500, r);
            grd.addColorStop(0, '#1c1e22'); grd.addColorStop(0.72, '#0d0e10'); grd.addColorStop(1, '#050506');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(500, 500, r, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
          out[id] = c.toDataURL('image/png');
        }
      } finally { m.layers = all; }
      return out;
    }, steps);
    const res = {};
    for (const [k, v] of Object.entries(urls)) res[k] = v ? Buffer.from(v.split(',')[1], 'base64') : null;
    return res;
  }
  try {
    return await fn({ load, check, exportPng, exportLayers, page, base });
  } finally {
    await browser.close();
    srv.close();
  }
}

// ------------------------------------------------------------------ images (Pillow)
const PY = `
import sys, io, os, json
from PIL import Image
im = Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGBA')
out = []
for s in json.loads(sys.argv[1]):
    x = im
    if s.get('crop'):
        x = x.crop(tuple(s['crop']))
    if x.width != s['w']:
        x = x.resize((s['w'], round(x.height * s['w'] / x.width)), Image.LANCZOS)
    if s.get('flat'):
        bg = Image.new('RGBA', x.size, tuple(s['flat']))
        bg.alpha_composite(x)
        x = bg.convert('RGB')
    x.save(s['path'], 'WEBP', quality=s.get('q', ${QUALITY}), method=6)
    out.append(os.path.getsize(s['path']))
print(json.dumps(out))
`;
// specs : [{ path, w, q?, crop?: [l,t,r,b], flat?: [r,g,b,255] }] → tailles en octets
export function toWebp(png, specs) {
  for (const s of specs) fs.mkdirSync(path.dirname(s.path), { recursive: true });
  const res = execFileSync('python3', ['-c', PY, JSON.stringify(specs)], { input: png, maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(res.toString());
}

// ------------------------------------------------------------------ snippets générés
const lq = (v) => {
  const s = String(v);
  if (!s.includes("'")) return `'${s}'`;
  if (!s.includes('"')) return `"${s}"`;
  throw new Error('valeur impossible à écrire en Liquid (deux types de guillemets) : ' + s);
};

// waiting = vrai tant que snippets/signature-card.liquid (lot accueil) n'existe pas : le snippet est alors
// écrit sans aucun appel (Theme Check refuse un render vers un fichier absent) et ne rend rien.
// Le build régénère toujours ce fichier : la version complète apparaît dès que signature-card existe.
export function signatureListLiquid(published, { waiting = false } = {}) {
  const ids = published.map((g) => g.id).join(',');
  const lines = [];
  lines.push(HEADER);
  if (waiting) {
    lines.push('{%- comment -%}');
    lines.push('  EN ATTENTE : snippets/signature-card.liquid (lot accueil) est absent, ce snippet ne rend donc rien.');
    lines.push('  Après sa création : node migmods/tools/render-signatures.mjs --no-render (ou le build du thème).');
    lines.push(`  Créations : ${ids}.`);
    lines.push('{%- endcomment -%}');
    return lines.join('\n') + '\n';
  }
  lines.push('{%- comment -%}');
  lines.push('  Créations signature (DESIGN-SYSTEM.md §10.1). Source : migmods/configurator/signatures.json.');
  lines.push('  Paramètres : layout (card | row | stage | mini, défaut card), ids (identifiants séparés par des virgules, vide = toutes,');
  lines.push(`  dans l'ordre donné), limit (défaut 6), origin (data-cta-origin), link (défaut vrai ; false = sans lien).`);
  lines.push('  index = numéro de la création au catalogue (1 à ' + published.length + '), number = ce numéro sur deux chiffres (« 01 »),');
  lines.push('  position = rang dans la liste rendue, total = prix du catalogue en euros (le prix affiché passe par config-price).');
  lines.push('  prices = prix du catalogue de chaque composant en euros, dans l’ordre des skus (repli si la variante Shopify manque).');
  lines.push(`  Identifiants : ${ids}.`);
  lines.push('{%- endcomment -%}');
  lines.push('{%- liquid');
  lines.push('  assign sig_limit = limit | default: 6');
  lines.push("  assign sig_layout = layout | default: 'card'");
  lines.push('  assign sig_link = true');
  lines.push('  if link == false');
  lines.push('    assign sig_link = false');
  lines.push('  endif');
  lines.push("  assign sig_ids = ids | default: '' | strip");
  lines.push("  if sig_ids == ''");
  lines.push(`    assign sig_ids = '${ids}'`);
  lines.push('  endif');
  lines.push("  assign sig_ids = sig_ids | remove: ' ' | split: ','");
  lines.push('  assign sig_n = 0');
  lines.push('  for sig_id in sig_ids');
  lines.push('    if sig_n >= sig_limit');
  lines.push('      break');
  lines.push('    endif');
  lines.push('    case sig_id');
  published.forEach((g, i) => {
    const skus = g.parts.map((p) => `${p.step}/${p.id}`).join(',');
    const prices = g.parts.map((p) => p.price).join(',');
    lines.push(`      when '${g.id}'`);
    lines.push('        assign sig_n = sig_n | plus: 1');
    lines.push(`        render 'signature-card', id: '${g.id}', index: ${i + 1}, number: '${String(i + 1).padStart(2, '0')}', position: sig_n, name: ${lq(g.name)}, config: ${lq(g.config)}, legend: ${lq(g.legend)}, text: ${lq(g.text)}, movement: ${lq(g.movement)}, skus: ${lq(skus)}, prices: ${lq(prices)}, total: ${g.total}, layout: sig_layout, origin: origin, link: sig_link`);
  });
  lines.push('    endcase');
  lines.push('  endfor');
  lines.push('-%}');
  return lines.join('\n') + '\n';
}

export function catalogueFactsLiquid(comps) {
  const step = (id) => comps.steps.find((s) => s.id === id) || { options: [] };
  const n = (id) => step(id).options.filter((o) => o.stock !== false).length;
  const caseMin = Math.min(...step('case').options.filter((o) => o.stock !== false).map((o) => o.price || 0));
  const facts = { dials: n('dial'), cases: n('case'), straps: n('strap'), movements: Object.keys(comps.movements || {}).length };
  const L = [];
  L.push(HEADER);
  L.push('{%- comment -%}');
  L.push('  Chiffres du catalogue (DESIGN-SYSTEM.md §10.1, §16.1), comptés dans migmods/configurator/components.json.');
  L.push('  Paramètre fact : from_price (prix d’entrée : minimum des variantes « case/… » du produit composants-migmods,');
  L.push(`  repli ${caseMin} € = boîtier le moins cher du catalogue), dials (${facts.dials}), cases (${facts.cases}), straps (${facts.straps}), movements (${facts.movements}).`);
  L.push('  Sortie : texte seul (prix formaté avec une espace insécable avant « € », ou nombre).');
  L.push('{%- endcomment -%}');
  L.push('{%- liquid');
  L.push('  case fact');
  L.push("    when 'from_price'");
  L.push(`      assign cf_min = ${caseMin * 100}`);
  L.push('      assign cf_found = false');
  L.push("      assign cf_parts = all_products['composants-migmods']");
  L.push('      for cf_v in cf_parts.variants');
  L.push("        assign cf_pre = cf_v.sku | slice: 0, 5");
  L.push("        if cf_pre == 'case/'");
  L.push('          if cf_found == false or cf_v.price < cf_min');
  L.push('            assign cf_min = cf_v.price');
  L.push('            assign cf_found = true');
  L.push('          endif');
  L.push('        endif');
  L.push('      endfor');
  L.push("      assign cf_out = cf_min | money_without_trailing_zeros | replace: ' €', ' €'");
  L.push('      echo cf_out');
  for (const [k, v] of Object.entries(facts)) {
    L.push(`    when '${k}'`);
    L.push(`      echo ${v}`);
  }
  L.push('  endcase');
  L.push('-%}');
  return { text: L.join('\n') + '\n', facts: { ...facts, from_price: caseMin } };
}

// Identifiants cités dans les templates (réglages ids, center, fallback_signature, dials).
export function checkTemplateIds(published, comps) {
  const sigIds = new Set(published.map((g) => g.id));
  const dialStep = comps.steps.find((s) => s.id === 'dial');
  const dialIds = new Set(dialStep.options.map((o) => o.id));
  const warn = [];
  const dir = path.join(THEME, 'templates');
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    let t; try { t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, '').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '')); } catch (e) { warn.push(`templates/${f} : JSON illisible (${e.message})`); continue; }
    for (const [key, sec] of Object.entries(t.sections || {})) {
      const st = sec.settings || {};
      const where = `templates/${f} › ${key}`;
      if (typeof st.ids === 'string' && st.ids.trim()) for (const id of st.ids.split(',').map((x) => x.trim()).filter(Boolean)) if (!sigIds.has(id)) warn.push(`${where} : création inconnue « ${id} » (ids)`);
      for (const k of ['center', 'fallback_signature']) if (typeof st[k] === 'string' && st[k].trim() && !sigIds.has(st[k].trim())) warn.push(`${where} : création inconnue « ${st[k]} » (${k})`);
      if (typeof st.dials === 'string') for (const id of st.dials.split(/[\n,]/).map((x) => x.trim()).filter(Boolean)) {
        if (!dialIds.has(id)) warn.push(`${where} : cadran inconnu « ${id} » (dials)`);
        else if (!fs.existsSync(path.join(ASSETS, `mm-thumbs-dial-${id}.png`))) warn.push(`${where} : vignette mm-thumbs-dial-${id}.png absente (dials)`);
      }
    }
  }
  return warn;
}

// ------------------------------------------------------------------ planche de contrôle
async function contactSheet(published, layersDone, sizes) {
  const { chromium } = await import(PLAYWRIGHT);
  const money = (n) => `${n} €`;
  const cells = published.map((g, i) => {
    const f = path.join(ASSETS, `sig-${g.id}-800.webp`);
    if (!fs.existsSync(f)) return '';
    const s = sizes[g.id] || [fs.statSync(f).size, fs.statSync(path.join(ASSETS, `sig-${g.id}-480.webp`)).size];
    return `<figure><div class="e"><img src="data:image/webp;base64,${fs.readFileSync(f).toString('base64')}"></div>
      <figcaption><p class="n">N° ${String(i + 1).padStart(2, '0')} · ${g.movement}</p><h2>${g.name}</h2><p class="l">${g.legend}</p>
      <p class="p">${money(g.total)} <span>telle que présentée · ${Math.round(s[0] / 1024)} Ko / ${Math.round(s[1] / 1024)} Ko</span></p></figcaption></figure>`;
  }).join('');
  const lay = layersDone ? `<section class="lay">${LAYERS.map(([n]) => { const f = path.join(ASSETS, `sig-layer-${n}.webp`); return fs.existsSync(f) ? `<figure><div class="c"><img src="data:image/webp;base64,${fs.readFileSync(f).toString('base64')}"></div><p class="n">${n} · ${Math.round(fs.statSync(f).size / 1024)} Ko</p></figure>` : ''; }).join('')}</section>` : '';
  const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(ASSETS, f)).toString('base64')}`;
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
    @font-face{font-family:C;src:url(${font('cormorant-garamond-300.woff2')});font-weight:300}
    @font-face{font-family:I;src:url(${font('inter.woff2')});font-weight:100 900}
    body{margin:0;background:#050505;color:#f3f4f6;font:400 14px/1.5 I;padding:48px}
    main{display:grid;grid-template-columns:repeat(3,1fr);gap:40px 32px}
    .e{position:relative;aspect-ratio:1;display:grid;place-items:center}
    .e::before{content:"";position:absolute;inset:6% 10% 18%;border-radius:50%;background:radial-gradient(50% 50% at 50% 45%,rgba(255,255,255,.09),rgba(255,255,255,.03) 45%,transparent 70%);z-index:-1}
    .e::after{content:"";position:absolute;left:24%;right:24%;bottom:10%;height:5%;background:radial-gradient(50% 50% at 50% 50%,rgba(0,0,0,.9),transparent 70%);z-index:-1}
    .e img{width:84%;filter:drop-shadow(0 28px 32px rgba(0,0,0,.7))}
    .n{font:500 12px/1 I;letter-spacing:.16em;text-transform:uppercase;color:#9ca0a7;margin:0 0 10px}
    h2{font:300 40px/1.05 C;margin:0 0 8px}.l{color:#c9cdd3;font-size:13px;margin:0 0 8px}.p{font-weight:500;font-size:15px;margin:0}.p span{font-weight:400;font-size:12px;color:#9ca0a7}
    .lay{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-top:56px}.c{aspect-ratio:1;background:repeating-conic-gradient(#111 0 25%,#1a1a1a 0 50%) 0 0/24px 24px}.c img{width:100%}
  </style><main>${cells}</main>${lay}</html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(OUT, { recursive: true });
  await p.screenshot({ path: path.join(OUT, 'signatures-sheet.png'), fullPage: true });
  await b.close();
}

// ------------------------------------------------------------------ programme
async function main() {
  const args = process.argv.slice(2);
  const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const only = val('--only') ? val('--only').split(',').map((s) => s.trim()) : null;
  const layersOf = val('--layers');
  const noRender = args.includes('--no-render');

  const { published, comps, errors } = loadData();
  if (only) for (const id of only) if (!published.some((g) => g.id === id)) errors.push(`--only : création inconnue ou en réserve « ${id} »`);
  if (layersOf && !published.some((g) => g.id === layersOf)) errors.push(`--layers : création inconnue « ${layersOf} »`);
  if (errors.length) { console.error('✖ signatures.json :\n  ' + errors.join('\n  ')); process.exit(1); }

  const fail = [];
  const sizes = {};
  if (!noRender) {
    const todo = published.filter((g) => !only || only.includes(g.id));
    await withRenderer(async (R) => {
      for (const g of todo) {
        // 1. la composition réelle doit être acceptée telle quelle (c'est elle que le lien ouvrira)
        const real = await R.load(g.config);
        const e1 = R.check(g.config, real);
        if (Math.round(real.total) !== g.total) e1.push(`prix moteur ${real.total} € ≠ catalogue ${g.total} €`);
        // 2. l'image est faite avec le fond plein
        const ic = imageConfig(g.config);
        const st = ic === g.config ? real : await R.load(ic);
        const e2 = ic === g.config ? [] : R.check(ic, st);
        const errs = [...e1, ...e2];
        if (errs.length) { fail.push(`${g.id} : ${errs.join(' ; ')}`); console.error(`✖ ${g.id} : ${errs.join(' ; ')}`); continue; }
        const png = await R.exportPng();
        const [s800, s480] = toWebp(png, [{ path: path.join(ASSETS, `sig-${g.id}-800.webp`), w: 800 }, { path: path.join(ASSETS, `sig-${g.id}-480.webp`), w: 480 }]);
        sizes[g.id] = [s800, s480];
        const over = [s800 > BUDGET[800] && `800 : ${(s800 / 1024).toFixed(1)} Ko > 90 Ko`, s480 > BUDGET[480] && `480 : ${(s480 / 1024).toFixed(1)} Ko > 35 Ko`].filter(Boolean);
        if (over.length) fail.push(`${g.id} : budget dépassé (${over.join(', ')})`);
        console.log(`${over.length ? '✖' : '✔'} sig-${g.id} · ${g.total} € · ${real.movement} · ${(s800 / 1024).toFixed(1)} Ko / ${(s480 / 1024).toFixed(1)} Ko`);
      }
      if (layersOf) {
        const g = published.find((x) => x.id === layersOf);
        const ic = imageConfig(g.config);
        const st = await R.load(ic);
        const errs = R.check(ic, st);
        if (errs.length) fail.push(`calques ${g.id} : ${errs.join(' ; ')}`);
        else {
          const bufs = await R.exportLayers(LAYERS.map(([, s]) => s));
          for (const [name, stepId] of LAYERS) {
            if (!bufs[stepId]) { fail.push(`calque ${name} : l'étape ${stepId} n'a pas de calque dans ${g.id}`); continue; }
            const [sz] = toWebp(bufs[stepId], [{ path: path.join(ASSETS, `sig-layer-${name}.webp`), w: 800 }]);
            const bad = sz > BUDGET.layer;
            if (bad) fail.push(`sig-layer-${name} : ${(sz / 1024).toFixed(1)} Ko > 60 Ko`);
            console.log(`${bad ? '✖' : '✔'} sig-layer-${name} · ${(sz / 1024).toFixed(1)} Ko`);
          }
        }
      }
    });
  }

  // Snippets générés (toujours, même sans rendu)
  const waiting = !fs.existsSync(path.join(SNIPPETS, 'signature-card.liquid'));
  fs.writeFileSync(path.join(SNIPPETS, 'signature-list.liquid'), signatureListLiquid(published, { waiting }));
  if (waiting) console.warn('⚠ snippets/signature-card.liquid absent (lot accueil) : signature-list.liquid écrit EN ATTENTE (ne rend rien). Relancer avec --no-render dès qu’il existe.');
  const cf = catalogueFactsLiquid(comps);
  fs.writeFileSync(path.join(SNIPPETS, 'catalogue-facts.liquid'), cf.text);
  console.log(`✔ snippets/signature-list.liquid (${waiting ? 'en attente' : published.length + ' créations'}) · snippets/catalogue-facts.liquid (dès ${cf.facts.from_price} €, ${cf.facts.dials} cadrans, ${cf.facts.cases} boîtiers, ${cf.facts.straps} bracelets, ${cf.facts.movements} calibres)`);

  // Chaque création publiée doit avoir ses deux rendus, dans les budgets
  for (const g of published) for (const w of [800, 480]) {
    const f = path.join(ASSETS, `sig-${g.id}-${w}.webp`);
    if (!fs.existsSync(f)) fail.push(`assets/sig-${g.id}-${w}.webp absent`);
    else if (fs.statSync(f).size > BUDGET[w]) fail.push(`assets/sig-${g.id}-${w}.webp : ${(fs.statSync(f).size / 1024).toFixed(1)} Ko > budget`);
  }

  for (const w of checkTemplateIds(published, comps)) console.warn('⚠ ' + w);

  if (!noRender) {
    await contactSheet(published, !!layersOf || fs.existsSync(path.join(ASSETS, 'sig-layer-strap.webp')), sizes);
    console.log('✔ planche de contrôle : ' + path.relative(process.cwd(), path.join(OUT, 'signatures-sheet.png')) + ' (à valider à l’œil)');
  }
  if (fail.length) { console.error('✖ ' + fail.length + ' échec(s) :\n  ' + fail.join('\n  ')); process.exit(1); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => { console.error('✖ ' + (e && e.stack || e)); process.exit(1); });
}
