#!/usr/bin/env node
// MIGMODS — assemble le thème Shopify et produit migmods-theme.zip
// Usage (depuis le dossier migmods/) : node tools/build-theme.mjs [--skip-render] [--no-zip]
//   --skip-render : ne relance pas les rendus des Créations signature (navigateur) ; les snippets générés
//                   (signature-list, catalogue-facts) sont tout de même réécrits, sans navigateur.
//   --no-zip      : contrôles seulement, le zip n'est pas réécrit.
// 1. copie le configurateur (JS, CSS) dans theme/assets
// 2. aplatit les images (Shopify n'accepte pas de sous-dossiers dans assets/) : assets/case/x.png -> mm-case-x.png ;
//    les calques de l'aperçu partent en WebP (tools/to-webp.py, Pillow : environ −85 % par cadran, §18.2), les PNG restent
//    la source ; un PNG cité en dur par le thème (family-visual, image-with-text…) est aussi copié tel quel
// 3. écrit theme/assets/migmods-components.json avec ces nouveaux noms
// 4. génère shopify-setup/produits-a-importer.csv (produit « Montre sur-mesure » + « Composants MigMods »)
// 5. contrôle les schémas et les templates JSON (DESIGN-SYSTEM.md §2.4 et §17.2)
// 6. rendus des Créations signature et calques de la vue éclatée (tools/render-signatures.mjs, §10.1)
// 7. contrôle les budgets des assets générés (§10.7, §14.1)
// 8. zippe le thème
// Sortie non nulle au premier problème bloquant (tous les problèmes sont listés).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const SKIP_RENDER = args.includes('--skip-render');
const NO_ZIP = args.includes('--no-zip');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conf = path.join(root, 'configurator');
const theme = path.join(root, 'theme');
const out = path.join(theme, 'assets');
const errors = [];
const warnings = [];

execFileSync(process.execPath, [path.join(conf, 'tools/convertir.mjs')], { stdio: 'inherit' });
const data = JSON.parse(fs.readFileSync(path.join(conf, 'components.json'), 'utf8'));

// Les assets mm-* ne sont plus effacés d'avance (le thème resterait sans images pendant la copie) : copiés s'ils ont changé,
// puis les anciens fichiers mm-* qui ne servent plus sont supprimés à la fin de la copie.
const keep = new Set();
const put = (from, name) => {
  keep.add(name);
  const to = path.join(out, name);
  if (fs.existsSync(to) && fs.statSync(to).size === fs.statSync(from).size && fs.statSync(to).mtimeMs >= fs.statSync(from).mtimeMs) return;
  fs.copyFileSync(from, to); copied++;
};
fs.copyFileSync(path.join(conf, 'configurator.js'), path.join(out, 'migmods-configurator.js'));
fs.copyFileSync(path.join(conf, 'configurator.css'), path.join(out, 'migmods-configurator.css'));

const flat = (p) => 'mm-' + p.replace(/^assets\//, '').replace(/[\/\\]/g, '-').toLowerCase();
// Fichiers mm-* cités en dur par le thème (hors fichiers générés par ce script) : ils doivent exister après le build.
const themeRefs = new Set();
for (const dir of ['layout', 'sections', 'snippets', 'templates']) {
  for (const f of fs.readdirSync(path.join(theme, dir))) {
    for (const m of fs.readFileSync(path.join(theme, dir, f), 'utf8').matchAll(/['"](mm-[a-z0-9-]+\.(?:png|webp))['"]/g)) themeRefs.add(m[1]);
  }
}
const WEBP_CACHE = path.join(root, 'tools/out/webp-cache');
const layers = [];   // calques à convertir : [source, cache]
for (const s of data.steps) for (const o of s.options) {
  if (o.image && !/^(https?:|data:|\/\/)/.test(o.image) && /\.png$/i.test(o.image) && fs.existsSync(path.join(conf, o.image))) layers.push([path.join(conf, o.image), path.join(WEBP_CACHE, flat(o.image).replace(/\.png$/, '.webp'))]);
}
let webpOk = new Map(), webpSaved = 0;
try {
  const res = JSON.parse(execFileSync('python3', [path.join(root, 'tools/to-webp.py')], { input: JSON.stringify(layers), maxBuffer: 64 * 1024 * 1024 }).toString());
  for (const r of res) if (r.webp) { webpOk.set(r.src, r.dst); webpSaved += r.png - r.webp; }
} catch (e) {
  warnings.push(`calques WebP non produits (python3 + Pillow requis : ${String(e.message).split('\n')[0]}) : les PNG sont publiés tels quels`);
}
let copied = 0;
for (const s of data.steps) {
  for (const o of s.options) {
    for (const k of ['image', 'thumb']) {
      if (!o[k] || /^(https?:|data:|\/\/)/.test(o[k])) continue;
      const src = path.join(conf, o[k]);
      let name = flat(o[k]);
      const webp = k === 'image' && webpOk.get(src);
      if (webp) {
        if (themeRefs.has(name)) put(src, name);
        name = name.replace(/\.png$/, '.webp');
        put(webp, name);
      } else if (fs.existsSync(src)) put(src, name);
      o[k] = name;
    }
  }
}
fs.writeFileSync(path.join(out, 'migmods-components.json'), JSON.stringify(data));
let removed = 0;
for (const f of fs.readdirSync(out)) if (f.startsWith('mm-') && !keep.has(f)) { fs.unlinkSync(path.join(out, f)); removed++; }
for (const ref of themeRefs) if (!fs.existsSync(path.join(out, ref))) errors.push(`le thème cite assets/${ref}, absent après la copie du configurateur`);

// Import produits Shopify (Produits > Importer). Seuls les composants payants deviennent des variantes.
const esc = (v) => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
const cols = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Requires Shipping', 'Variant Taxable', 'Gift Card', 'Status'];
const rows = [cols];
rows.push(['montre-sur-mesure-migmods', 'Montre sur-mesure MigMods', '<p>Montre configurée sur mesure, assemblée à la main en Normandie. Le détail de la configuration figure sur la commande.</p>', 'MigMods', 'Montre sur-mesure', 'configurateur', 'TRUE', 'Title', 'Default Title', 'MM-SUR-MESURE', 'continue', 'manual', '0.00', 'TRUE', 'TRUE', 'FALSE', 'active']);
let first = true, priced = 0;
for (const s of data.steps) {
  for (const o of s.options) {
    if (!o.price) continue;
    priced++;
    rows.push([
      'composants-migmods',
      first ? 'Composants MigMods' : '',
      first ? '<p>Produit technique utilisé par le configurateur. Ne pas mettre dans une collection.</p>' : '',
      first ? 'MigMods' : '', first ? 'Composant' : '', first ? 'composant, masque' : '', first ? 'TRUE' : '',
      first ? 'Composant' : '', `${s.label} · ${o.label}`, `${s.id}/${o.id}`, 'continue', 'manual', o.price.toFixed(2), 'TRUE', 'TRUE', first ? 'FALSE' : '', first ? 'active' : ''
    ]);
    first = false;
  }
}
fs.mkdirSync(path.join(root, 'shopify-setup'), { recursive: true });
fs.writeFileSync(path.join(root, 'shopify-setup/produits-a-importer.csv'), '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n') + '\n');

// ------------------------------------------------------------------ schémas et templates (§2.4, §17.2)
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));
const schemas = {};
for (const f of fs.readdirSync(path.join(theme, 'sections')).filter((f) => f.endsWith('.liquid'))) {
  const raw = (fs.readFileSync(path.join(theme, 'sections', f), 'utf8').match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/) || [])[1];
  if (!raw) continue;
  let all;
  try { all = JSON.parse(raw); } catch (e) { errors.push(`sections/${f} : schéma JSON invalide (${e.message})`); continue; }
  const name = f.replace(/\.liquid$/, '');
  schemas[name] = all;
  const check = (list, where) => {
    const ids = new Set();
    for (const st of list || []) {
      if (!st.id) continue;
      if (ids.has(st.id)) errors.push(`sections/${f}${where} : identifiant de réglage en double « ${st.id} »`);
      ids.add(st.id);
      if ('default' in st && st.default === null) errors.push(`sections/${f}${where} : « ${st.id} » a "default": null`);
      // Shopify refuse à l'import tout réglage « url » dont la valeur par défaut n'est pas /collections(/all).
      if (st.type === 'url' && st.default && !/^\/collections(\/all)?$/.test(st.default)) errors.push(`sections/${f}${where} : le réglage url « ${st.id} » a une valeur par défaut refusée par Shopify (${st.default})`);
      // Shopify écarte en silence à l'import une section dont une option dépasse 50 caractères (et les templates qui l'utilisent)
      for (const o of st.options || []) if (o.label && o.label.length > 50) errors.push(`sections/${f}${where} : option « ${o.label} » de « ${st.id} » trop longue (${o.label.length} > 50 caractères)`);
    }
  };
  if (all.name && all.name.length > 25) errors.push(`sections/${f} : nom de section trop long (${all.name.length} > 25 caractères)`);
  for (const b of all.blocks || []) if (b.name && b.name.length > 25) errors.push(`sections/${f} : nom du bloc « ${b.name} » trop long (> 25 caractères)`);
  check(all.settings, '');
  for (const b of all.blocks || []) check(b.settings, ` › bloc ${b.type}`);
}
try {
  for (const g of readJson(path.join(theme, 'config/settings_schema.json'))) for (const st of g.settings || []) {
    if (st.id && 'default' in st && st.default === null) errors.push(`config/settings_schema.json : « ${st.id} » a "default": null`);
    if (st.type === 'url' && st.default && !/^\/collections(\/all)?$/.test(st.default)) errors.push(`config/settings_schema.json : le réglage url « ${st.id} » a une valeur par défaut refusée par Shopify`);
  }
} catch (e) { errors.push(`config/settings_schema.json illisible (${e.message})`); }

function checkTemplate(file, label) {
  let t;
  try { t = readJson(file); } catch (e) { errors.push(`${label} : JSON invalide (${e.message})`); return; }
  const keys = Object.keys(t.sections || {}), order = t.order || [];
  for (const k of keys) if (!order.includes(k)) errors.push(`${label} : la section « ${k} » est absente de "order"`);
  for (const k of order) if (!keys.includes(k)) errors.push(`${label} : "order" cite « ${k} », absente de "sections"`);
  for (const [k, sec] of Object.entries(t.sections || {})) {
    const sc = schemas[sec.type];
    if (!sc) { if (!fs.existsSync(path.join(theme, 'sections', sec.type + '.liquid'))) errors.push(`${label} › ${k} : section « ${sec.type} » inexistante`); continue; }
    const known = new Set((sc.settings || []).map((s) => s.id).filter(Boolean));
    for (const id of Object.keys(sec.settings || {})) if (!known.has(id)) errors.push(`${label} › ${k} : réglage « ${id} » absent du schéma de ${sec.type}`);
    const bkeys = Object.keys(sec.blocks || {});
    if (sec.block_order) {
      for (const b of bkeys) if (!sec.block_order.includes(b)) errors.push(`${label} › ${k} : bloc « ${b} » absent de "block_order"`);
      for (const b of sec.block_order) if (!bkeys.includes(b)) errors.push(`${label} › ${k} : "block_order" cite « ${b} », absent de "blocks"`);
    }
    for (const [bk, blk] of Object.entries(sec.blocks || {})) {
      if (/^@/.test(blk.type)) continue;
      const bs = (sc.blocks || []).find((b) => b.type === blk.type);
      if (!bs) { errors.push(`${label} › ${k} › ${bk} : type de bloc « ${blk.type} » absent du schéma de ${sec.type}`); continue; }
      const bknown = new Set((bs.settings || []).map((s) => s.id).filter(Boolean));
      for (const id of Object.keys(blk.settings || {})) if (!bknown.has(id)) errors.push(`${label} › ${k} › ${bk} : réglage « ${id} » absent du bloc ${blk.type}`);
    }
  }
}
for (const f of fs.readdirSync(path.join(theme, 'templates')).filter((f) => f.endsWith('.json'))) checkTemplate(path.join(theme, 'templates', f), `templates/${f}`);
for (const f of fs.readdirSync(path.join(theme, 'sections')).filter((f) => f.endsWith('.json'))) checkTemplate(path.join(theme, 'sections', f), `sections/${f}`);

// ------------------------------------------------------------------ Créations signature (§10.1)
// Toujours lancé : sans navigateur avec --skip-render (snippets générés seulement), sinon rendus + calques.
try {
  execFileSync(process.execPath, [path.join(root, 'tools/render-signatures.mjs'), ...(SKIP_RENDER ? ['--no-render'] : ['--layers', 'abysse'])], { stdio: 'inherit', cwd: root });
} catch (e) {
  errors.push('tools/render-signatures.mjs a échoué (voir ci-dessus)');
}

// ------------------------------------------------------------------ budgets des assets générés (§10.7, §14.1)
const KB = 1024;
const BUDGETS = [
  [/^sig-layer-[a-z]+\.webp$/, 60], [/^sig-[a-z0-9-]+-800\.webp$/, 90], [/^sig-[a-z0-9-]+-480\.webp$/, 35],
  [/^logo-migmods-320\.webp$/, 30], [/^logo-migmods-640\.webp$/, 80], [/^logo-migmods-1100\.webp$/, 200],
  [/^migmods-og\.jpg$/, 150], [/^apple-touch-icon\.png$/, 20], [/^favicon-32\.png$/, 5],
  [/^migmods-glow\.webp$/, 6], [/^migmods-grain\.png$/, 3], [/^migmods-hero-poster-land\.jpg$/, 150],
  [/^cormorant-garamond-(300|500|400-italic)\.woff2$/, 26]
];
const REQUIRED = ['logo-migmods-320.webp', 'logo-migmods-640.webp', 'logo-migmods-1100.webp', 'migmods-og.jpg', 'apple-touch-icon.png', 'favicon-32.png', 'migmods-glow.webp', 'migmods-grain.png', 'migmods-hero-poster-land.jpg', 'cormorant-garamond-300.woff2', 'cormorant-garamond-500.woff2', 'cormorant-garamond-400-italic.woff2'];
// Fichiers conservés (sources) : non soumis au plafond des fichiers ajoutés.
const KEPT = new Set(['logo-migmods.png', 'logo-migmods-480.png', 'migmods-hero-poster.jpg']);
for (const f of REQUIRED) if (!fs.existsSync(path.join(out, f))) errors.push(`assets/${f} absent (tools/make-brand-assets.py ou tools/patch-fonts.py)`);
let checked = 0;
for (const f of fs.readdirSync(out)) {
  const size = fs.statSync(path.join(out, f)).size;
  const b = BUDGETS.find(([re]) => re.test(f));
  if (b) { checked++; if (size > b[1] * KB) errors.push(`assets/${f} : ${(size / KB).toFixed(1)} Ko > budget ${b[1]} Ko`); }
  if (!KEPT.has(f) && /^(sig-|logo-migmods-|migmods-|cormorant-garamond-|apple-touch-icon|favicon-)/.test(f) && /\.(webp|png|jpe?g|woff2|svg)$/.test(f) && size > 300 * KB) errors.push(`assets/${f} : ${(size / KB).toFixed(0)} Ko, au-delà du plafond de 300 Ko par fichier ajouté`);
}
// logo-migmods.png (609 Ko) ne doit plus jamais être référencé par une page (§8.7, §17.7).
for (const dir of ['layout', 'sections', 'snippets', 'templates']) {
  for (const f of fs.readdirSync(path.join(theme, dir))) {
    const txt = fs.readFileSync(path.join(theme, dir, f), 'utf8');
    if (/['"\/]logo-migmods\.png/.test(txt)) warnings.push(`${dir}/${f} référence encore logo-migmods.png (609 Ko)`);
    // Le découpeur de Liquid ferme une balise {{ … }} à la première accolade fermante : '{seuil}' dans un filtre
    // y casse le fichier, et Shopify refuse alors tout le thème (« Liquid templates that can't be parsed »).
    // Theme Check ne le voit pas. Hors {% schema %}, dont le JSON est brut.
    const body = txt.replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/g, '');
    for (const m of body.matchAll(/\{\{[^}]*\}(?!\})/g)) {
      const line = body.slice(0, m.index).split('\n').length;
      errors.push(`${dir}/${f}:${line} : accolade fermante dans une balise {{ }} (passer la chaîne par un assign)`);
    }
  }
}

for (const w of warnings) console.warn('⚠ ' + w);
if (errors.length) {
  console.error(`✖ thème refusé : ${errors.length} problème(s)\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`✔ contrôles : ${Object.keys(schemas).length} schémas, templates et groupes cohérents, ${checked} assets générés dans leur budget`);
console.log(`✔ calques de l'aperçu : ${webpOk.size} en WebP (−${(webpSaved / 1024 / 1024).toFixed(1)} Mo), ${themeRefs.size} fichiers mm-* cités par le thème présents`);

if (NO_ZIP) { console.log(`✔ thème : ${copied} images copiées (${removed} anciennes retirées), ${priced} composants payants dans l'import produits (zip non réécrit : --no-zip)`); process.exit(0); }
const zip = path.join(root, 'migmods-theme.zip');
if (fs.existsSync(zip)) fs.unlinkSync(zip);
execFileSync('zip', ['-qr', zip, 'assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates', '-x', '*.DS_Store'], { cwd: theme });
console.log(`✔ thème : ${copied} images copiées (${removed} anciennes retirées), ${priced} composants payants dans l'import produits`);
console.log(`✔ ${path.relative(process.cwd(), zip)} (${(fs.statSync(zip).size / 1024 / 1024).toFixed(1)} Mo)`);
