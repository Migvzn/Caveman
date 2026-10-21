#!/usr/bin/env node
// MIGMODS — convertisseur en ligne de commande.
// Usage (depuis le dossier configurator/) :
//   node tools/convertir.mjs                       -> lit data/catalogue.csv
//   node tools/convertir.mjs mon-fichier.csv       -> CSV (; ou ,) ou JSON (tableau de lignes)
// Excel : « Fichier > Enregistrer sous > CSV UTF-8 », ou utiliser tools/convertisseur.html.
// Produit : components.json, data/rapport-donnees.md, data/images-attendues.md

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { parseCSV, buildComponents, expectedImages, reportMarkdown, imagesMarkdown } from './convert-core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(process.argv[2] || path.join(root, 'data/catalogue.csv'));
const config = JSON.parse(fs.readFileSync(path.join(root, 'data/config.json'), 'utf8'));

const text = fs.readFileSync(input, 'utf8');
const rows = input.endsWith('.json') ? JSON.parse(text) : parseCSV(text);
const { json, issues } = buildComponents(rows, config);
const images = expectedImages(json);

// Contrôle des PNG fournis : existence, transparence, coins vides, format carré.
function pngInfo(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) return { error: 'pas un PNG' };
  let off = 8, w, h, depth, type, idat = [], trns = false;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), kind = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; }
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'tRNS') trns = true;
    off += 12 + len;
  }
  const info = { w, h, alpha: type === 6 || type === 4 || trns };
  if ((type === 6 || type === 4) && depth === 8 && !buf.includes('Interlace', 0)) {
    // Décodage complet pour lire les pixels des coins (RGBA / gris+alpha 8 bits).
    const bpp = type === 6 ? 4 : 2, stride = w * bpp;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const px = Buffer.alloc(h * stride);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? px[dst + x - bpp] : 0, b = y ? px[dst - stride + x] : 0, c = x >= bpp && y ? px[dst - stride + x - bpp] : 0;
        let v = raw[src + x];
        if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
        else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        px[dst + x] = v & 255;
      }
    }
    const alphaAt = (x, y) => px[y * stride + x * bpp + bpp - 1];
    info.opaqueCorners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].filter(([x, y]) => alphaAt(x, y) > 200).length;
  }
  return info;
}

const checks = {};
const done = new Set();
for (const img of images.filter((i) => i.provided)) {
  if (done.has(img.file)) continue;
  done.add(img.file);
  const p = path.join(root, img.file), probs = [];
  if (!fs.existsSync(p)) probs.push('fichier introuvable');
  else if (img.file.toLowerCase().endsWith('.png')) {
    const i = pngInfo(p);
    if (i.error) probs.push(i.error);
    else {
      if (!i.alpha) probs.push('pas de transparence (fond opaque)');
      if (i.opaqueCorners >= 3 && img.step !== 'dial') probs.push('coins opaques : fond probablement non détouré');
      if (i.w !== i.h) probs.push(`non carré (${i.w}×${i.h})`);
      if (Math.max(i.w, i.h) < 600) probs.push(`petite résolution (${i.w}×${i.h}, idéal 1200×1200)`);
    }
  }
  checks[img.file] = probs;
}

fs.writeFileSync(path.join(root, 'components.json'), JSON.stringify(json, null, 1));
fs.writeFileSync(path.join(root, 'data/rapport-donnees.md'), reportMarkdown(issues, images, checks));
fs.writeFileSync(path.join(root, 'data/images-attendues.md'), imagesMarkdown(images));

const n = (l) => issues.filter((i) => i.level === l).length;
console.log(`✔ components.json : ${json.steps.reduce((a, s) => a + s.options.length, 0)} composants, ${json.steps.length} étapes`);
console.log(`  ${n('erreur')} erreur(s), ${n('attention')} avertissement(s) -> data/rapport-donnees.md`);
console.log(`  ${images.filter((i) => !i.provided).length} image(s) manquante(s) -> data/images-attendues.md`);
