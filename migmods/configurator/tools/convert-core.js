// MIGMODS — cœur du convertisseur catalogue (CSV / Excel / JSON) -> components.json
// Utilisé par tools/convertir.mjs (Node) et tools/convertisseur.html (navigateur).

const COLS = {
  etape: ['etape', 'étape', 'step'],
  groupe: ['groupe', 'group', 'categorie', 'catégorie'],
  id: ['id', 'reference', 'référence'],
  nom: ['nom', 'label', 'name'],
  prix: ['prix', 'price', 'supplement', 'supplément'],
  image: ['image', 'calque'],
  thumb: ['vignette', 'thumb'],
  famille: ['famille', 'family'],
  mouvement: ['mouvement', 'movement'],
  date: ['date'],
  requiert: ['requiert', 'requires', 'condition'],
  exclut: ['exclut', 'excludes'],
  couleur: ['couleur', 'color'],
  specs: ['specs', 'caracteristiques', 'caractéristiques'],
  description: ['description'],
  stock: ['stock'],
  calage: ['calage', 'fit'],
  badge: ['badge'],
  conseil: ['conseil', 'hint'],
  conseil_si: ['conseil_si', 'hint_if'],
};

const norm = (s) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export function slug(s) {
  return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// CSV avec détection du séparateur (; , ou tabulation) et gestion des guillemets.
export function parseCSV(text) {
  text = String(text).replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const count = (c) => first.split(c).length;
  const sep = [';', '\t', ','].sort((a, b) => count(b) - count(a))[0];
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift() || [];
  return rows
    .filter((r) => r.some((c) => String(c).trim() !== ''))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// Ramène des lignes aux noms de colonnes canoniques (tolère majuscules / accents / synonymes).
function canonical(raw) {
  const out = {};
  const keys = Object.keys(raw);
  for (const [k, names] of Object.entries(COLS)) {
    const found = keys.find((x) => names.includes(norm(x)));
    out[k] = found === undefined ? '' : String(raw[found] ?? '').trim();
  }
  return out;
}

const truthy = (v) => ['oui', 'o', 'yes', 'y', 'true', '1', 'vrai', 'x'].includes(norm(v));
const falsy = (v) => ['non', 'n', 'no', 'false', '0', 'faux'].includes(norm(v));

function parsePrice(v) {
  if (v === '' || v == null) return { value: 0, empty: true };
  const n = Number(String(v).replace(/[€\s+]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? { value: n, empty: false } : { value: 0, empty: true, bad: true };
}

function parseSpecs(v) {
  if (!v) return {};
  return Object.fromEntries(
    v.split('|').map((p) => p.split('=')).filter((p) => p.length >= 2).map(([k, ...r]) => [k.trim(), r.join('=').trim()])
  );
}

function parseFit(v) {
  if (!v) return null;
  const n = v.split(/[,\s]+/).map(Number);
  if (n.length < 3 || n.some((x) => !Number.isFinite(x))) return { bad: true };
  return { cx: n[0], cy: n[1], d: n[2], ...(n[3] ? { angle: n[3] } : {}) };
}

// Syntaxe des conditions : "case.family=sub,kx & dial.date=oui", "caseback=plein", "gmt_hand", "!gmt_hand"
export function conditionSteps(cond) {
  if (!cond) return [];
  return cond.split('&').map((t) => t.trim().replace(/^!/, '').split(/!=|=/)[0].split('.')[0].trim()).filter(Boolean);
}

export function buildComponents(rawRows, config) {
  const issues = [];
  const add = (level, step, id, msg) => issues.push({ level, step, id, msg });
  const steps = config.steps.map((s) => ({ ...s, groups: [], options: [] }));
  const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
  const families = config.families || {};
  const seen = new Set();
  let emptyPrices = [];

  rawRows.map(canonical).forEach((r, i) => {
    const line = i + 2;
    if (r.etape.startsWith('#')) return;            // ligne en réserve (désactivée)
    const step = byId[r.etape];
    if (!step) { add('erreur', r.etape || '?', r.id || `ligne ${line}`, `Étape inconnue « ${r.etape} » (ligne ${line}). Étapes possibles : ${steps.map((s) => s.id).join(', ')}`); return; }
    const id = r.id || slug(r.nom);
    if (!r.nom) add('erreur', step.id, id, `Nom vide (ligne ${line})`);
    if (!r.id) add('attention', step.id, id, `Id vide, généré automatiquement : « ${id} » (ligne ${line})`);
    if (seen.has(step.id + '/' + id)) { add('erreur', step.id, id, `Id en double dans l'étape (ligne ${line}) : ligne ignorée`); return; }
    seen.add(step.id + '/' + id);

    const price = parsePrice(r.prix);
    if (price.bad) add('erreur', step.id, id, `Prix illisible « ${r.prix} » (ligne ${line}) : mis à 0 €`);
    else if (price.empty) emptyPrices.push(`${step.id}/${id}`);

    const opt = { id, label: r.nom || id, price: price.value };
    if (r.groupe) {
      opt.group = r.groupe;
      if (!step.groups.includes(r.groupe)) step.groups.push(r.groupe);
    }
    if (r.image) opt.image = r.image;
    if (r.thumb) opt.thumb = r.thumb;
    const fit = parseFit(r.calage);
    if (fit?.bad) add('erreur', step.id, id, `Calage illisible « ${r.calage} » (attendu : cx,cy,taille)`);
    else if (fit) opt.fit = fit;
    if (r.image && !fit && step.slot !== 'none') add('attention', step.id, id, 'Image sans calage : centrée et mise à l\'échelle par défaut (vérifier avec ?calibrer=1)');
    if (r.famille) opt.family = r.famille;
    if (r.mouvement) {
      opt.movement = r.mouvement.toUpperCase();
      if (!config.movements?.[opt.movement]) add('erreur', step.id, id, `Mouvement inconnu « ${r.mouvement} »`);
    }
    if (r.date) {
      if (truthy(r.date)) opt.date = true;
      else if (falsy(r.date)) opt.date = false;
      else add('erreur', step.id, id, `Valeur « date » illisible « ${r.date} » (oui / non)`);
    }
    if (r.requiert) opt.requires = r.requiert;
    if (r.exclut) opt.excludes = r.exclut;
    if (r.couleur) opt.color = r.couleur;
    const specs = parseSpecs(r.specs);
    if (Object.keys(specs).length) opt.specs = specs;
    if (r.description) opt.description = r.description;
    if (r.badge) opt.badge = r.badge;
    if (r.conseil) opt.hint = r.conseil;
    if (r.conseil_si) opt.hintIf = r.conseil_si;
    opt.stock = r.stock ? !falsy(r.stock) : true;
    if (!opt.stock) add('info', step.id, id, 'Hors stock : affiché mais non sélectionnable');

    // Contrôles métier
    if (step.id === 'case') {
      if (!opt.family) add('erreur', step.id, id, 'Boîtier sans famille : compatibilités impossibles (bracelet, lunette…)');
      else if (!families[opt.family]) add('erreur', step.id, id, `Famille « ${opt.family} » absente de config.json`);
    }
    if (step.id === 'dial' && opt.date === undefined) { opt.date = true; add('attention', step.id, id, 'Cadran sans info « date » (oui / non) : considéré avec date, la loupe sera proposée'); }
    if (step.id === 'strap' && !opt.requires) add('erreur', step.id, id, 'Bracelet sans compatibilité (colonne « requiert », ex. case.strap=20mm) : proposé avec tous les boîtiers');
    for (const c of ['requires', 'excludes']) {
      for (const ref of conditionSteps(opt[c])) if (!byId[ref]) add('erreur', step.id, id, `Condition « ${opt[c]} » : étape « ${ref} » inconnue`);
    }
    if (!opt.image && step.slot !== 'none' && step.type !== 'logo') add('info', step.id, id, 'Pas d\'image : image de substitution générée');
    step.options.push(opt);
  });

  for (const s of steps) {
    if (!s.groups.length) delete s.groups;
    if (!s.options.length && s.type !== 'logo') add('attention', s.id, '-', 'Étape sans aucun composant : elle sera masquée');
  }
  for (const [k, v] of Object.entries(config.default || {})) {
    if (!byId[k]?.options.some((o) => o.id === v)) add('erreur', k, v, 'Composant par défaut (config.json > default) introuvable');
  }
  if (emptyPrices.length) add('info', 'tous', `${emptyPrices.length} composants`, 'Prix vide = inclus (0 €). À confirmer : ' + emptyPrices.slice(0, 12).join(', ') + (emptyPrices.length > 12 ? '…' : ''));

  const { steps: _s, _lisezmoi, ...rest } = config;
  return { json: { ...rest, steps }, issues };
}

export function expectedImages(json) {
  const list = [];
  for (const s of json.steps) {
    if (s.slot === 'none' || s.type === 'logo') continue;
    for (const o of s.options) list.push({ step: s.id, stepLabel: s.label, id: o.id, label: o.label, file: o.image || `assets/${s.id}/${o.id}.png`, provided: !!o.image });
  }
  return list;
}

export function reportMarkdown(issues, images, imageChecks = {}) {
  const lv = { erreur: '🔴 Erreurs (à corriger)', attention: '🟠 Attention', info: '🔵 Informations' };
  let md = '# Rapport du catalogue MigMods\n\n';
  const provided = images.filter((i) => i.provided).length;
  md += `- Composants : **${images.length}** avec aperçu · images fournies : **${provided}** · manquantes : **${images.length - provided}**\n`;
  md += `- Erreurs : **${issues.filter((i) => i.level === 'erreur').length}** · Avertissements : **${issues.filter((i) => i.level === 'attention').length}**\n\n`;
  const lowres = Object.entries(imageChecks).filter(([, v]) => v.some((p) => p.startsWith('petite')));
  const checks = Object.entries(imageChecks).map(([f, v]) => [f, v.filter((p) => !p.startsWith('petite'))]).filter(([, v]) => v.length);
  if (checks.length || lowres.length) {
    md += '## 🖼️ Contrôle des fichiers images\n\n';
    if (lowres.length) md += `- **${lowres.length} images en basse résolution** (moins de 600 px, idéal 1200×1200) : nettes sur mobile, un peu douces en zoom. Exemples : ${lowres.slice(0, 4).map(([f]) => '`' + f + '`').join(', ')}\n\n`;
    if (checks.length) {
      md += '| Fichier | Problème |\n|---|---|\n';
      for (const [f, probs] of checks) md += `| \`${f}\` | ${probs.join(' ; ')} |\n`;
      md += '\n';
    }
  }
  for (const level of ['erreur', 'attention']) {
    const list = issues.filter((i) => i.level === level);
    if (!list.length) continue;
    md += `## ${lv[level]}\n\n| Étape | Composant | Problème |\n|---|---|---|\n`;
    for (const i of list) md += `| ${i.step} | ${i.id} | ${i.msg} |\n`;
    md += '\n';
  }
  const infos = issues.filter((i) => i.level === 'info');
  const noImg = infos.filter((i) => i.msg.startsWith('Pas d\'image'));
  const other = infos.filter((i) => !i.msg.startsWith('Pas d\'image'));
  if (other.length || noImg.length) {
    md += `## ${lv.info}\n\n`;
    for (const i of other) md += `- **${i.step} / ${i.id}** : ${i.msg}\n`;
    if (noImg.length) md += `- **${noImg.length} composants sans image** (substitution générée) : voir \`images-attendues.md\`\n`;
  }
  return md;
}

export function imagesMarkdown(images) {
  let md = '# Images attendues — MigMods\n\n';
  md += 'Format : **PNG fond transparent**, carré, la pièce **centrée** et vue de face (même angle pour toutes). ';
  md += 'Idéal : 1200×1200 px. Le chemin ci-dessous est le nom exact à donner au fichier.\n\n';
  md += 'Après ajout d\'une photo : mettre le chemin dans la colonne `image` du catalogue, puis la caler avec `index.html?calibrer=1`.\n\n';
  let cur = '';
  for (const i of images) {
    if (i.step !== cur) { cur = i.step; md += `\n## ${i.stepLabel} (\`${i.step}\`)\n\n| Statut | Composant | Fichier |\n|---|---|---|\n`; }
    md += `| ${i.provided ? '✅ fournie' : '⬜ à faire'} | ${i.label} | \`${i.file}\` |\n`;
  }
  return md;
}
