#!/usr/bin/env node
// MIGMODS — assemble le thème Shopify et produit migmods-theme.zip
// Usage (depuis le dossier migmods/) : node tools/build-theme.mjs
// 1. copie le configurateur (JS, CSS) dans theme/assets
// 2. aplatit les images (Shopify n'accepte pas de sous-dossiers dans assets/) : assets/case/x.png -> mm-case-x.png
// 3. écrit theme/assets/migmods-components.json avec ces nouveaux noms
// 4. génère shopify-setup/produits-a-importer.csv (produit « Montre sur-mesure » + « Composants MigMods »)
// 5. zippe le thème

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conf = path.join(root, 'configurator');
const theme = path.join(root, 'theme');
const out = path.join(theme, 'assets');

execFileSync(process.execPath, [path.join(conf, 'tools/convertir.mjs')], { stdio: 'inherit' });
const data = JSON.parse(fs.readFileSync(path.join(conf, 'components.json'), 'utf8'));

for (const f of fs.readdirSync(out)) if (f.startsWith('mm-')) fs.unlinkSync(path.join(out, f));
fs.copyFileSync(path.join(conf, 'configurator.js'), path.join(out, 'migmods-configurator.js'));
fs.copyFileSync(path.join(conf, 'configurator.css'), path.join(out, 'migmods-configurator.css'));

const flat = (p) => 'mm-' + p.replace(/^assets\//, '').replace(/[\/\\]/g, '-').toLowerCase();
let copied = 0;
for (const s of data.steps) {
  for (const o of s.options) {
    for (const k of ['image', 'thumb']) {
      if (!o[k] || /^(https?:|data:|\/\/)/.test(o[k])) continue;
      const src = path.join(conf, o[k]);
      const name = flat(o[k]);
      if (!fs.existsSync(path.join(out, name)) && fs.existsSync(src)) { fs.copyFileSync(src, path.join(out, name)); copied++; }
      o[k] = name;
    }
  }
}
fs.writeFileSync(path.join(out, 'migmods-components.json'), JSON.stringify(data));

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

const zip = path.join(root, 'migmods-theme.zip');
if (fs.existsSync(zip)) fs.unlinkSync(zip);
execFileSync('zip', ['-qr', zip, 'assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates', '-x', '*.DS_Store'], { cwd: theme });
console.log(`✔ thème : ${copied} images copiées, ${priced} composants payants dans l'import produits`);
console.log(`✔ ${path.relative(process.cwd(), zip)} (${(fs.statSync(zip).size / 1024 / 1024).toFixed(1)} Mo)`);
