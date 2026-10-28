/* VAYNORA OS — Espace équipe : pilotage de l'agence (revenus, modèles, chatters, finance, recrutement) et Formation OFM.
   Les données du tableau de bord restent dans ce navigateur (localStorage) : exportez une sauvegarde régulièrement. */
(function(){
  "use strict";
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const fr = s => String(s ?? '').replace(/ ([:;!?»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const STORE = 'vaynora-os-v1', CODEKEY = 'vaynora-academy-code', OLDKEY = 'vaynora-academy-v1';
  const ls = {
    get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
    set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ return false; } },
    del(k){ try { localStorage.removeItem(k); } catch(e){} }
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const num = v => { const n = parseFloat(String(v ?? '').replace(/[\s  €$£]/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
  const today = () => new Date().toISOString().slice(0, 10);
  function toast(m){ const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2800); }

  /* ── Données ─────────────────────────────────────────── */
  const LISTS = ['models','revenue','chatters','cmonths','expenses','recruits'];
  const blank = () => ({v:1, demo:false, settings:{agency:'VAYNORA House', user:'', currency:'EUR', goal:0, fixed:0, defCommission:40}, models:[], revenue:[], chatters:[], cmonths:[], expenses:[], recruits:[], lessons:{}, path:''});
  function normalize(x){
    const d = blank();
    if (!x || typeof x !== 'object') return d;
    LISTS.forEach(k => { if (Array.isArray(x[k])) d[k] = x[k].filter(o => o && typeof o === 'object'); });
    if (x.settings && typeof x.settings === 'object') Object.assign(d.settings, x.settings);
    if (!['EUR','USD','GBP','CHF','CAD'].includes(d.settings.currency)) d.settings.currency = 'EUR';
    if (x.lessons && typeof x.lessons === 'object') d.lessons = x.lessons;
    d.demo = !!x.demo; d.path = typeof x.path === 'string' ? x.path : '';
    return d;
  }
  let D = normalize(ls.get(STORE));
  (function migrate(){
    const old = ls.get(OLDKEY);
    if (old && old.lessons && !Object.keys(D.lessons).length) { D.lessons = Object.assign({}, old.lessons); if (!D.settings.user && old.name) D.settings.user = old.name; }
  })();
  let MEMO = new Map();
  /* Mode « local » : données dans ce navigateur. Mode « server » : comptes équipe et données partagées via /api/vaynora. */
  let MODE = 'local', ME = null, NEWSUBS = 0, FCODE = '';
  function save(){ MEMO = new Map(); if (MODE === 'server') { queueSync(); return; } if (!ls.set(STORE, D)) toast('Stockage du navigateur indisponible : exportez vos données.'); }

  /* ── Serveur : API, synchronisation, rafraîchissement ── */
  const API = '/api/vaynora';
  async function api(a, body){
    let r;
    try {
      r = await fetch(API + '?a=' + a, body === undefined ? {credentials:'same-origin', cache:'no-store', headers:{'X-Requested-With':'vaynora'}} : {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json', 'X-Requested-With':'vaynora'}, body:JSON.stringify(body)});
    } catch(e) { throw Object.assign(new Error('Connexion impossible : vérifiez votre réseau.'), {status:0}); }
    let j = null; try { j = await r.json(); } catch(e) {}
    if (!r.ok || !j) throw Object.assign(new Error((j && j.error) || 'Erreur ' + r.status), {status:r.status});
    return j;
  }
  const isStaff = () => MODE !== 'server' || ME.role === 'owner' || ME.role === 'manager';
  const ROLE_LABEL = {owner:'Propriétaire', manager:'Manager', chatter:'Chatter'};
  let SNAP = null, syncing = false, syncAgain = false, syncT = 0, retryT = 0;
  const snapOf = d => ({cols:Object.fromEntries(LISTS.map(c => [c, new Map(d[c].map(o => [o.id, JSON.stringify(o)]))])), settings:JSON.stringify(d.settings), demo:!!d.demo, lessons:Object.assign({}, d.lessons), path:d.path});
  function diff(){
    const ops = [];
    if (!SNAP) return ops;
    if (isStaff()) {
      LISTS.forEach(c => {
        const prev = SNAP.cols[c], cur = new Map(D[c].map(o => [o.id, JSON.stringify(o)]));
        cur.forEach((js, id) => { if (prev.get(id) !== js) ops.push({c, put:JSON.parse(js)}); });
        prev.forEach((_, id) => { if (!cur.has(id)) ops.push({c, del:id}); });
      });
      if (JSON.stringify(D.settings) !== SNAP.settings) ops.push({settings:D.settings});
      if (!!D.demo !== SNAP.demo) ops.push({meta:{demo:!!D.demo}});
    }
    const put = {}, del = [];
    Object.keys(D.lessons).forEach(k => { if (SNAP.lessons[k] !== D.lessons[k]) put[k] = D.lessons[k]; });
    Object.keys(SNAP.lessons).forEach(k => { if (!(k in D.lessons)) del.push(k); });
    if (Object.keys(put).length || del.length) ops.push({lessons:{put, del}});
    if (D.path !== SNAP.path) ops.push({path:D.path});
    return ops;
  }
  function setSync(st){
    const el = $('#syncState'); if (!el) return;
    el.hidden = MODE !== 'server'; el.dataset.s = st;
    el.textContent = st === 'ok' ? 'Enregistré · partagé avec l\'équipe' : st === 'saving' ? 'Enregistrement…' : 'Hors ligne · nouvel essai…';
  }
  function queueSync(){ clearTimeout(syncT); setSync('saving'); syncT = setTimeout(flush, 250); }
  async function flush(){
    if (MODE !== 'server') return;
    if (syncing) { syncAgain = true; return; }
    const ops = diff(); if (!ops.length) { setSync('ok'); return; }
    const next = snapOf(D); syncing = true; setSync('saving');
    try { await api('sync', {ops}); SNAP = next; setSync('ok'); }
    catch(e) {
      if (e.status === 401) { toast('Session expirée : reconnectez-vous.'); setTimeout(() => location.reload(), 1500); }
      else if (e.status >= 400 && e.status < 500) { toast(e.message); try { applyServer(await api('data')); route(true); } catch(x) {} setSync('ok'); }
      else { setSync('err'); clearTimeout(retryT); retryT = setTimeout(flush, 5000); }
    } finally { syncing = false; if (syncAgain) { syncAgain = false; flush(); } }
  }
  function applyServer(d){
    if (d.me) ME = d.me;
    D = normalize(Object.assign({}, d.cols || {}, {settings:d.settings || {}, lessons:d.lessons || {}, path:d.path || '', demo:!!(d.meta && d.meta.demo)}));
    MEMO = new Map(); SNAP = snapOf(D); NEWSUBS = d.newSubs || 0; FCODE = d.fcode || '';
  }
  async function refresh(){
    if (MODE !== 'server' || syncing || !SNAP || diff().length || mdl.open || document.hidden) return;
    const ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.id !== 'mSel') return;
    try {
      const d = await api('data'), before = JSON.stringify([D, NEWSUBS, ME]);
      applyServer(d);
      if (JSON.stringify([D, NEWSUBS, ME]) !== before) route(true);
    } catch(e) { if (e.status === 401) location.reload(); }
  }
  const userName = () => MODE === 'server' ? String(ME.name || '').split(' ')[0] : D.settings.user;

  /* ── Mois & formats ──────────────────────────────────── */
  const pad = n => String(n).padStart(2, '0');
  const curMonth = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
  const isMonth = s => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(s || ''));
  const addM = (m, k) => { let [y, mo] = m.split('-').map(Number); mo += k; y += Math.floor((mo - 1) / 12); mo = ((mo - 1) % 12 + 12) % 12 + 1; return y + '-' + pad(mo); };
  const range = (end, n) => Array.from({length:n}, (_, i) => addM(end, i - n + 1));
  const mDate = m => new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1);
  const FL = new Intl.DateTimeFormat('fr-FR', {month:'long', year:'numeric'}), FS = new Intl.DateTimeFormat('fr-FR', {month:'short'}), FM = new Intl.DateTimeFormat('fr-FR', {month:'long'});
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const mLong = m => cap(FL.format(mDate(m)));
  const mName = m => FM.format(mDate(m));
  const mShort = m => FS.format(mDate(m)).replace('.', '') + ' ' + m.slice(2, 4);
  const NF = {};
  function money(v, dec){
    const c = D.settings.currency || 'EUR', k = c + (dec ? 2 : 0);
    if (!NF[k]) NF[k] = new Intl.NumberFormat('fr-FR', {style:'currency', currency:c, minimumFractionDigits:dec ? 2 : 0, maximumFractionDigits:dec ? 2 : 0});
    return NF[k].format(v || 0);
  }
  const SYM = {EUR:'€', USD:'$', GBP:'£', CHF:'CHF', CAD:'$'};
  function compact(v){
    const s = SYM[D.settings.currency] || '€', a = Math.abs(v), f = (x, d) => x.toLocaleString('fr-FR', {maximumFractionDigits:d});
    if (a >= 1e6) return f(v / 1e6, 1) + ' M' + s;
    if (a >= 1e3) return f(v / 1e3, a >= 1e4 ? 0 : 1) + ' k' + s;
    return f(v, 0) + ' ' + s;
  }
  const int = v => Math.round(v || 0).toLocaleString('fr-FR');
  const pct = (v, d=0) => v == null || !isFinite(v) ? '—' : (v * 100).toLocaleString('fr-FR', {maximumFractionDigits:d}) + ' %';
  /* Variation : la flèche dit le sens, la couleur dit si c'est bon (vert) ou mauvais (orange). */
  function dv(cur, prev, goodUp=true, points=false){
    if (cur == null || prev == null || !isFinite(cur) || !isFinite(prev) || (!points && prev === 0)) return null;
    const d = points ? cur - prev : (cur - prev) / Math.abs(prev);
    const dir = d > 0.0005 ? 1 : d < -0.0005 ? -1 : 0;
    const val = points ? (Math.abs(d) * 100).toLocaleString('fr-FR', {maximumFractionDigits:1}) + ' pt' : pct(Math.abs(d), Math.abs(d) < 0.1 ? 1 : 0);
    return {dir, cls: dir === 0 ? '' : ((dir > 0) === goodUp ? 'pos' : 'neg'), txt: (dir > 0 ? '+' : dir < 0 ? '−' : '') + val, arrow: dir > 0 ? '▲' : dir < 0 ? '▼' : '■'};
  }
  function dTile(cur, prev, vs, goodUp=true, points=false){
    const x = dv(cur, prev, goodUp, points);
    if (!x) return `<span class="d"><small>Pas de comparaison</small></span>`;
    return `<span class="d ${x.cls}"><span aria-hidden="true">${x.arrow}</span>${x.txt} <small>vs ${esc(vs)}</small></span>`;
  }
  function dInline(cur, prev, goodUp=true){
    const x = dv(cur, prev, goodUp);
    return x ? `<small class="${x.cls}"><span aria-hidden="true">${x.arrow}</span> ${x.txt}</small>` : '<small class="muted">—</small>';
  }

  /* ── Référentiels ────────────────────────────────────── */
  const SRC = [['subs','Abonnements'],['ppv','Messages payants'],['tips','Pourboires'],['customs','Personnalisés'],['other','Autres']];
  const COL = ['#2F5BFF','#eb6834','#1baf7a','#eda100','#e87ba4'], NEG = '#e34948';
  const STATUS = {onboarding:['Lancement','blue'], active:['Active','green'], pause:['En pause','amber'], ended:['Terminée','']};
  const CSTATUS = {active:['Actif','green'], training:['En formation','blue'], pause:['En pause','amber'], left:['Parti','']};
  const ROLES = ['Chatter','Chatter senior','Team lead','Account manager'];
  const STAGES = ['Repérée','Contactée','Appel','Proposition','Signée'];
  const SOURCES = ['Instagram','TikTok','X (Twitter)','Reddit','Recommandation','Candidature site','Autre'];
  const ECATS = ['Outils & logiciels','Publicité','Contenu & shootings','Rémunérations (hors chatters)','Juridique & comptabilité','Locaux','Autre'];
  const chip = (pair) => `<span class="chip ${pair[1]}"><i></i>${esc(pair[0])}</span>`;
  const opts = (list, sel) => list.map(v => `<option${v === sel ? ' selected' : ''}>${esc(v)}</option>`).join('');
  const optsKV = (obj, sel) => Object.entries(obj).map(([k, v]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(v[0])}</option>`).join('');
  const initial = s => (String(s || '?').trim()[0] || '?').toUpperCase();

  const netOf = e => e ? SRC.reduce((a, [k]) => a + num(e[k]), 0) : 0;
  const modelById = id => D.models.find(x => x.id === id);
  const chatterById = id => D.chatters.find(x => x.id === id);
  const entry = (mid, m) => D.revenue.find(e => e.model === mid && e.month === m);
  const cmonth = (cid, m) => D.cmonths.find(r => r.chatter === cid && r.month === m);
  const payOf = (c, r) => r ? num(r.hours) * num(c.rate) + num(r.sales) * num(c.pct) / 100 + num(r.bonus) : 0;
  const commOf = md => md && md.commission !== '' && md.commission != null ? num(md.commission) : num(D.settings.defCommission);

  function stats(m){
    if (MEMO.has(m)) return MEMO.get(m);
    const src = {}; SRC.forEach(([k]) => src[k] = 0);
    let net = 0, com = 0, fans = 0, newFans = 0, ads = 0, n = 0, top = null;
    D.revenue.forEach(e => {
      if (e.month !== m) return;
      const md = modelById(e.model); if (!md) return;
      const v = netOf(e);
      net += v; com += v * commOf(md) / 100; fans += num(e.fans); newFans += num(e.newFans); ads += num(e.ads);
      SRC.forEach(([k]) => src[k] += num(e[k]));
      if (v > 0) n++;
      if (!top || v > top.v) top = {md, v};
    });
    let pay = 0, hours = 0, sales = 0;
    D.cmonths.forEach(r => { if (r.month !== m) return; const c = chatterById(r.chatter); if (!c) return; pay += payOf(c, r); hours += num(r.hours); sales += num(r.sales); });
    const exp = D.expenses.reduce((a, x) => a + (x.month === m ? num(x.amount) : 0), 0);
    const hasData = D.revenue.some(e => e.month === m && modelById(e.model));
    const active = hasData || pay > 0 || exp > 0;
    const fixed = active ? num(D.settings.fixed) : 0;
    const costs = pay + exp + fixed + ads, profit = com - costs;
    const s = {m, net, com, fans, newFans, ads, src, n, top, pay, hours, sales, exp, fixed, costs, profit, hasData, active,
      margin: com ? profit / com : null, arpu: fans ? net / fans : null, ppv: net ? src.ppv / net : null, eph: hours ? sales / hours : null};
    MEMO.set(m, s); return s;
  }
  function econ(md, m){
    const e = entry(md.id, m), net = netOf(e), com = net * commOf(md) / 100, ads = e ? num(e.ads) : 0;
    let chat = 0;
    D.chatters.forEach(c => { const list = (c.models || []).filter(modelById); if (!list.includes(md.id)) return; const r = cmonth(c.id, m); if (r) chat += payOf(c, r) / list.length; });
    const contrib = com - ads - chat;
    return {e, net, com, ads, chat, contrib, payout: net - com, margin: com ? contrib / com : null};
  }
  function latestMonth(){ const now = curMonth(); let best = ''; (D.revenue.length ? D.revenue : D.cmonths).forEach(e => { if (e.month > best && e.month <= now) best = e.month; }); return best || now; }
  let M = latestMonth();

  /* ── Icônes ──────────────────────────────────────────── */
  const P = {
    home:'<path d="M3.5 10.5 12 4l8.5 6.5V19a1 1 0 0 1-1 1H15v-5.5H9V20H4.5a1 1 0 0 1-1-1z"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.8 3.1 2.6 3.5 5.2"/>',
    edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
    chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    wallet:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9"/>',
    book:'<path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12H8.5A3.5 3.5 0 0 1 5 16.5z"/><path d="M5 16.5A3.5 3.5 0 0 1 8.5 13H19"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    down:'<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    up:'<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>',
    critical:'<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>',
    serious:'<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
    warning:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.2v.3"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.7v.3"/>',
    good:'<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8 5.4-5.6"/>',
    lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    inbox:'<path d="M3.5 13.5 6 5h12l2.5 8.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/><path d="M3.5 13.5H9l1 2h4l1-2h5.5"/>',
    left:'<path d="M15 5l-7 7 7 7"/>', right:'<path d="m9 5 7 7-7 7"/>'
  };
  const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ── Graphiques (SVG faits main) ─────────────────────── */
  const tip = $('#tip');
  function showTip(x, y, title, rows){
    tip.replaceChildren();
    const t = document.createElement('div'); t.className = 't'; t.textContent = title; tip.append(t);
    rows.forEach(r => {
      const d = document.createElement('div'); d.className = 'r' + (r.tot ? ' tot' : '');
      if (r.color) { const i = document.createElement('i'); i.style.background = r.color; d.append(i); }
      const b = document.createElement('b'); b.textContent = r.value;
      const s = document.createElement('span'); s.textContent = r.name;
      d.append(b, s); tip.append(d);
    });
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + 14, top = y + 14;
    if (left + w > innerWidth - 8) left = x - w - 14;
    if (top + h > innerHeight - 8) top = y - h - 14;
    tip.style.left = Math.max(8, left) + 'px'; tip.style.top = Math.max(8, top) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };
  let CHARTS = [];
  function draw(el, fn){ if (!el) return; const run = () => fn(el); CHARTS.push(run); run(); }
  let rsz; window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { hideTip(); CHARTS.forEach(f => f()); }, 120); });

  function scale(maxV, minV=0){
    const span = Math.max(maxV - minV, 1), raw = span / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
    const min = Math.floor(minV / step) * step; let max = Math.ceil(maxV / step) * step; if (max <= min) max = min + step;
    const ticks = []; for (let v = min; v <= max + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
    return {min, max, ticks};
  }
  function frame(el, H, L, sc, labels, center){
    const W = Math.max(260, el.clientWidth), R = 12, T = 14, B = 30, pw = W - L - R, ph = H - T - B, n = labels.length;
    const Y = v => T + (sc.max - v) / (sc.max - sc.min) * ph;
    const X = center ? (i => L + pw / n * (i + .5)) : (i => L + (n === 1 ? pw / 2 : i * pw / (n - 1)));
    let g = '';
    sc.ticks.forEach(v => { g += `<line class="${v === 0 ? 'bl' : 'gl'}" x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="ax" x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${esc(compact(v))}</text>`; });
    const every = Math.max(1, Math.ceil(n * 52 / pw));
    labels.forEach((lb, i) => { if ((n - 1 - i) % every) return; g += `<text class="ax" x="${X(i).toFixed(1)}" y="${H - 9}" text-anchor="middle">${esc(lb)}</text>`; });
    return {W, R, T, B, pw, ph, n, X, Y, g};
  }
  function lineChart(el, o){
    const {labels, long, series, fmt = money, H = 260, aria = ''} = o;
    const vals = series.flatMap(s => s.values.filter(v => v != null));
    const sc = scale(Math.max(0, ...vals), Math.min(0, ...vals));
    const f = frame(el, H, 58, sc, labels, false), {W, T, pw, ph, n, X, Y} = f;
    let g = f.g;
    series.forEach((s, k) => {
      const pts = s.values.map((v, i) => v == null ? null : [X(i), Y(v)]);
      let d = '', on = false;
      pts.forEach(p => { if (!p) { on = false; return; } d += (on ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); on = true; });
      if (k === 0 && pts.length > 1 && pts.every(Boolean)) { const b = Y(Math.max(0, sc.min)).toFixed(1); g += `<path d="${d}L${pts[n - 1][0].toFixed(1)} ${b}L${pts[0][0].toFixed(1)} ${b}Z" fill="${s.color}" fill-opacity=".1"/>`; }
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      const last = [...pts].reverse().find(Boolean);
      if (last) g += `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4" fill="${s.color}" stroke="#fff" stroke-width="2"/>`;
    });
    g += `<line class="cross" x1="0" x2="0" y1="${T}" y2="${T + ph}" visibility="hidden"/>` + series.map(s => `<circle class="hd" r="4.5" fill="${s.color}" stroke="#fff" stroke-width="2" visibility="hidden"/>`).join('');
    g += `<rect class="hit" x="58" y="${T}" width="${pw}" height="${ph}" tabindex="0" role="img" aria-label="${esc(aria)} — utilisez les flèches pour lire les valeurs"/>`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="${esc(aria)}">${g}</svg>`;
    const svg = el.firstChild, hit = svg.querySelector('.hit'), cross = svg.querySelector('.cross'), dots = [...svg.querySelectorAll('.hd')];
    let cur = n - 1;
    const show = (i, cx, cy) => {
      cur = i; const x = X(i);
      cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('visibility', 'visible');
      series.forEach((s, k) => { const v = s.values[i]; if (v == null) { dots[k].setAttribute('visibility', 'hidden'); return; } dots[k].setAttribute('cx', x); dots[k].setAttribute('cy', Y(v)); dots[k].setAttribute('visibility', 'visible'); });
      const r = svg.getBoundingClientRect();
      showTip(cx ?? r.left + x, cy ?? r.top + T + 10, (long || labels)[i], series.map(s => ({color:s.color, name:s.name, value: s.values[i] == null ? '—' : fmt(s.values[i])})));
    };
    const off = () => { cross.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); hideTip(); };
    const at = e => { const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * (W / r.width); show(n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((px - 58) / (pw / (n - 1))))), e.clientX, e.clientY); };
    hit.addEventListener('pointermove', at); hit.addEventListener('pointerdown', at);
    hit.addEventListener('pointerleave', off); hit.addEventListener('blur', off);
    hit.addEventListener('focus', () => show(cur));
    hit.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(Math.max(0, Math.min(n - 1, cur + (e.key === 'ArrowLeft' ? -1 : 1)))); } });
  }
  const topRound = (x, y, w, h, r) => { r = Math.min(r, h, w / 2); return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`; };
  const botRound = (x, y, w, h, r) => { r = Math.min(r, h, w / 2); return `M${x} ${y}H${x + w}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}Z`; };
  function bindCols(el, rowsFor, titleFor){
    $$('.col', el).forEach(g => {
      const i = +g.dataset.i;
      const show = (x, y) => showTip(x, y, titleFor(i), rowsFor(i));
      g.addEventListener('pointermove', e => show(e.clientX, e.clientY));
      g.addEventListener('pointerdown', e => show(e.clientX, e.clientY));
      g.addEventListener('pointerleave', hideTip); g.addEventListener('blur', hideTip);
      g.addEventListener('focus', () => { const r = g.getBoundingClientRect(); show(r.left + r.width / 2, r.top + 10); });
    });
  }
  function stackChart(el, o){
    const {labels, long, series, fmt = money, H = 260, aria = ''} = o, n = labels.length;
    const tot = labels.map((_, i) => series.reduce((a, s) => a + Math.max(0, s.values[i] || 0), 0));
    const sc = scale(Math.max(0, ...tot));
    const f = frame(el, H, 58, sc, labels, true), {W, T, pw, ph, Y} = f;
    const band = pw / n, bw = Math.min(24, band * .62);
    let g = f.g;
    for (let i = 0; i < n; i++) {
      const x0 = 58 + band * i, bx = x0 + (band - bw) / 2;
      const segs = series.map((s, k) => ({k, v: Math.max(0, s.values[i] || 0)})).filter(z => z.v > 0);
      g += `<g class="col" data-i="${i}" tabindex="0" role="img" aria-label="${esc((long || labels)[i])} : ${esc(fmt(tot[i]))}"><rect x="${x0.toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${ph}" fill="transparent"/>`;
      let base = 0;
      segs.forEach((z, j) => {
        const yTop = Y(base + z.v), yBot = Y(base) - (j > 0 ? 2 : 0); base += z.v;
        const h = yBot - yTop; if (h <= .4) return;
        g += j === segs.length - 1 ? `<path class="bar" d="${topRound(+bx.toFixed(1), +yTop.toFixed(1), +bw.toFixed(1), +h.toFixed(1), 4)}" fill="${series[z.k].color}"/>` : `<rect class="bar" x="${bx.toFixed(1)}" y="${yTop.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${series[z.k].color}"/>`;
      });
      g += '</g>';
    }
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="${esc(aria)}">${g}</svg>`;
    bindCols(el, i => series.filter(s => s.values[i] > 0).map(s => ({color:s.color, name:s.name, value:fmt(s.values[i])})).reverse().concat([{tot:true, name:'Total', value:fmt(tot[i])}]), i => (long || labels)[i]);
  }
  function barChart(el, o){
    const {labels, long, values, fmt = money, H = 240, name = '', aria = ''} = o, n = labels.length;
    const sc = scale(Math.max(0, ...values), Math.min(0, ...values));
    const f = frame(el, H, 58, sc, labels, true), {W, T, pw, ph, Y} = f;
    const band = pw / n, bw = Math.min(24, band * .62);
    let g = f.g;
    values.forEach((v, i) => {
      const x0 = 58 + band * i, bx = +(x0 + (band - bw) / 2).toFixed(1);
      g += `<g class="col" data-i="${i}" tabindex="0" role="img" aria-label="${esc((long || labels)[i])} : ${esc(fmt(v))}"><rect x="${x0.toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${ph}" fill="transparent"/>`;
      if (v > 0) { const y = +Y(v).toFixed(1), h = +(Y(0) - Y(v)).toFixed(1); if (h > .4) g += `<path class="bar" d="${topRound(bx, y, +bw.toFixed(1), h, 4)}" fill="${COL[0]}"/>`; }
      else if (v < 0) { const y = +Y(0).toFixed(1), h = +(Y(v) - Y(0)).toFixed(1); if (h > .4) g += `<path class="bar" d="${botRound(bx, y, +bw.toFixed(1), h, 4)}" fill="${NEG}"/>`; }
      g += '</g>';
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="${esc(aria)}">${g}</svg>`;
    bindCols(el, i => [{color: values[i] < 0 ? NEG : COL[0], name, value: fmt(values[i])}], i => (long || labels)[i]);
  }
  const legend = (series, line) => `<div class="legend">${series.map(s => `<span><i class="${line ? 'ln' : ''}" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  const tableView = (labels, series, fmt = money, total = false) => `<details class="tv"><summary>Voir les données</summary><div class="tw"><table class="t"><thead><tr><th>Mois</th>${series.map(s => `<th class="r">${esc(s.name)}</th>`).join('')}${total ? '<th class="r">Total</th>' : ''}</tr></thead><tbody>${labels.map((lb, i) => `<tr><td>${esc(lb)}</td>${series.map(s => `<td class="r">${s.values[i] == null ? '—' : esc(fmt(s.values[i]))}</td>`).join('')}${total ? `<td class="r">${esc(fmt(series.reduce((a, s) => a + (s.values[i] || 0), 0)))}</td>` : ''}</tr>`).join('')}</tbody></table></div></details>`;
  function spark(values){
    const v = values.map(x => x || 0), mx = Math.max(...v, 1), mn = Math.min(...v, 0), n = v.length;
    const pts = v.map((x, i) => [(i / (n - 1 || 1) * 100).toFixed(2), (30 - (x - mn) / (mx - mn || 1) * 26).toFixed(2)]);
    const d = 'M' + pts.map(p => p.join(' ')).join('L');
    return `<svg class="spark" viewBox="0 0 100 32" preserveAspectRatio="none" style="width:100%;height:44px" aria-hidden="true"><path class="a" d="${d}L100 32L0 32Z" stroke="none"/><path class="l" d="${d}" fill="none" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
  }
  function hbars(rows, fmt = money){
    const mx = Math.max(...rows.map(r => r.value), 0) || 1;
    return `<div class="hb">${rows.map(r => `<div class="row"${r.av ? '' : ' style="grid-template-columns:minmax(0,1fr) auto"'}>${r.av ? `<span class="av">${esc(r.av)}</span>` : ''}<div><div class="nm"><span>${esc(r.label)}</span>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</div><div class="track"><div class="fill" style="width:${Math.max(0, r.value / mx * 100).toFixed(1)}%"></div></div></div><div class="val">${esc(fmt(r.value))}${r.extra || ''}</div></div>`).join('')}</div>`;
  }
  const emptyChart = msg => `<div class="empty-chart">${esc(msg)}</div>`;

  /* ── Modale ──────────────────────────────────────────── */
  const mdl = $('#mdl');
  function modal(title, body, o = {}){
    mdl.innerHTML = `<form novalidate><div class="mh"><h2 id="mdlT">${esc(title)}</h2><button type="button" class="btn btn-ghost btn-icon" data-x aria-label="Fermer">✕</button></div>${body}<div class="mf">${o.danger ? `<button type="button" class="btn btn-danger" data-del>${esc(o.danger)}</button>` : ''}<button type="button" class="btn btn-ghost" data-x>Annuler</button><button class="btn btn-primary" type="submit">${esc(o.submit || 'Enregistrer')}</button></div></form>`;
    const form = $('form', mdl);
    $$('[data-x]', form).forEach(b => b.addEventListener('click', () => mdl.close()));
    if (o.danger) $('[data-del]', form).addEventListener('click', () => { if (o.onDanger() !== false) mdl.close(); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const fd = Object.fromEntries(new FormData(form));
      if (o.onSubmit(fd, form) !== false) mdl.close();
    });
    mdl.showModal();
    const first = $('input:not([type=checkbox]),select,textarea', form); if (first) first.focus();
  }

  /* ── Coquille & navigation ───────────────────────────── */
  const NAV = [
    ['Pilotage', [['', "Vue d'ensemble", 'home'], ['modeles', 'Modèles', 'users'], ['saisie', 'Saisie des revenus', 'edit'], ['chatters', 'Chatters', 'chat'], ['finance', 'Finance', 'wallet'], ['recrutement', 'Recrutement', 'target']]],
    ['Apprendre', [['formation', 'Formation OFM', 'book'], ['recherche', 'Rechercher', 'search']]],
    ['Agence', [['donnees', 'Données & réglages', 'gear']]]
  ];
  function navFor(){
    if (MODE !== 'server') return NAV;
    if (ME.role === 'chatter') return [['Mon espace', [['', 'Mes chiffres', 'home']]], NAV[1], ['Compte', [['compte', 'Mon compte', 'lock']]]];
    const ag = [['donnees', 'Données & réglages', 'gear']];
    if (ME.role === 'owner') ag.push(['utilisateurs', 'Utilisateurs', 'users']);
    ag.push(['compte', 'Mon compte', 'lock']);
    return [['Pilotage', NAV[0][1].concat([['candidatures', 'Candidatures', 'inbox']])], NAV[1], ['Agence', ag]];
  }
  function renderNav(active){
    const cnt = {modeles: D.models.filter(x => x.status === 'active' || x.status === 'onboarding').length, recrutement: D.recruits.filter(r => !r.lost && r.stage < 4).length, candidatures: NEWSUBS};
    if (MODE === 'server' && ME.role === 'chatter') cnt.modeles = 0;
    $('#nav').innerHTML = navFor().map(([g, items]) => `<div class="grp">${esc(g)}</div>` + items.map(([k, t, i]) => `<a class="it" href="#/${k}"${k === active ? ' aria-current="page"' : ''}>${ico(i)}<span>${esc(t)}</span>${cnt[k] ? `<span class="cnt">${cnt[k]}</span>` : ''}</a>`).join('')).join('');
    const nm = MODE === 'server' ? ME.name : (D.settings.user || 'Équipe');
    $('#whoName').textContent = nm;
    $('#whoAv').textContent = initial(nm || D.settings.agency);
    $('#whoAg').textContent = MODE === 'server' ? ROLE_LABEL[ME.role] + ' · ' + (D.settings.agency || '') : (D.settings.agency || '');
    $('#lockBtn').textContent = MODE === 'server' ? 'Se déconnecter' : 'Verrouiller';
  }
  const side = $('#side'), scrim = $('#scrim'), burger = $('#burger');
  function openSide(){ side.classList.add('open'); scrim.hidden = false; burger.setAttribute('aria-expanded', 'true'); }
  function closeSide(){ side.classList.remove('open'); scrim.hidden = true; burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', openSide); scrim.addEventListener('click', closeSide);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSide(); hideTip(); } });
  $('#lockBtn').addEventListener('click', async () => {
    if (MODE === 'server') { try { await flush(); await api('logout', {}); } catch(e) {} }
    else ls.del(CODEKEY);
    location.hash = ''; location.reload();
  });

  function monthSelect(){
    const now = curMonth(); let earliest = addM(now, -23);
    D.revenue.forEach(e => { if (isMonth(e.month) && e.month < earliest) earliest = e.month; });
    const list = []; for (let m = now; m >= earliest; m = addM(m, -1)) list.push(m);
    if (!list.includes(M)) list.unshift(M);
    return `<label for="mSel" class="hide-s" style="font-size:.78rem;font-weight:700;color:var(--muted)">Mois</label><select id="mSel">${list.map(m => `<option value="${m}"${m === M ? ' selected' : ''}>${esc(mLong(m))}</option>`).join('')}</select>`;
  }
  function setView(title, html, o = {}){
    CHARTS = []; hideTip();
    $('#ttl').textContent = title;
    document.title = title + ' — Espace équipe VAYNORA';
    $('#tools').innerHTML = (o.month ? monthSelect() : '') + (o.tools || '');
    const sel = $('#mSel'); if (sel) sel.addEventListener('change', () => { M = sel.value; route(true); });
    $('#view').innerHTML = (D.demo && o.demo !== false && isStaff() ? `<div class="demo">${ico('info').replace('<svg', '<svg style="width:18px;height:18px"')}<span>Données d'exemple affichées : remplacez-les par vos vrais chiffres.</span><button class="btn btn-sm btn-ghost" type="button" data-act="clear-demo">Effacer l'exemple</button></div>` : '') + html;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'clear-demo') { if (confirm("Effacer toutes les données d'exemple ? Votre progression de formation est conservée.")) { const keep = {lessons: D.lessons, path: D.path}; D = Object.assign(blank(), keep); save(); M = latestMonth(); toast('Exemple effacé. À vous de jouer.'); route(); } }
    if (act === 'add-model') modelForm();
    if (act === 'add-chatter') chatterForm();
    if (act === 'add-recruit') recruitForm();
    if (act === 'load-demo') loadDemo();
  });

  function route(keepScroll){
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const key = parts[0] || '';
    closeSide();
    const nav = {modele:'modeles'}[key] ?? key;
    renderNav(nav);
    let views = {'':vHome, modeles:vModels, modele:vModel, saisie:vEntry, chatters:vChatters, finance:vFinance, recrutement:vRecruit, formation:vFormation, recherche:vSearch, donnees:vData};
    if (MODE === 'server') {
      if (ME.role === 'chatter') views = {'':vMe, formation:vFormation, recherche:vSearch, compte:vAccount};
      else Object.assign(views, {candidatures:vSubs, compte:vAccount}, ME.role === 'owner' ? {utilisateurs:vUsers} : {});
    }
    if (!views[key]) renderNav('');
    (views[key] || views[''])(parts.slice(1), new URLSearchParams(qs || ''));
    if (keepScroll !== true) { window.scrollTo(0, 0); $('#view').focus({preventScroll:true}); }
  }

  /* ── Alertes ─────────────────────────────────────────── */
  const SEV = {critical:['critical','Critique'], serious:['serious','Important'], warning:['warning','À surveiller'], info:['info','À faire'], good:['good','Bonne nouvelle']};
  function alerts(m){
    const out = [], prev = addM(m, -1), s = stats(m);
    D.models.filter(x => x.status === 'active' || x.status === 'onboarding').forEach(md => {
      if (isMonth(md.start) && md.start > m) return;
      const e = entry(md.id, m);
      if (!e) { out.push(['info', `Revenus de ${md.name} non saisis`, `Ajoutez les chiffres de ${mName(m)} dans la saisie des revenus.`, '#/saisie']); return; }
      const p = entry(md.id, prev), a = netOf(e), b = netOf(p);
      if (p && b > 0 && (a - b) / b <= -0.15) out.push(['serious', `${md.name} : ${pct((a - b) / b)} vs ${mName(prev)}`, 'Diagnostiquez trafic, conversion, messages et rétention (module 13.4).', '#/modele/' + md.id]);
      if (num(md.goal) > 0 && a >= num(md.goal)) out.push(['good', `${md.name} a atteint son objectif`, `${money(a)} pour un objectif de ${money(num(md.goal))}.`, '#/modele/' + md.id]);
    });
    if (s.active && s.profit < 0) out.push(['critical', `Résultat négatif : ${money(s.profit)}`, 'Vérifiez les charges et la rentabilité par modèle.', '#/finance']);
    if (s.net > 0 && s.top && s.n > 1 && s.top.v / s.net > 0.5) out.push(['warning', `${s.top.md.name} pèse ${pct(s.top.v / s.net)} du chiffre d'affaires`, "Diversifiez : le départ d'une modèle ne doit pas mettre l'agence en danger (module 15.9).", '#/modeles']);
    const team = s.eph;
    D.chatters.filter(c => c.status !== 'left').forEach(c => {
      const r = cmonth(c.id, m); if (!r) return;
      if (r.qa !== '' && r.qa != null && num(r.qa) > 0 && num(r.qa) < 70) out.push(['warning', `${c.name} : qualité ${int(num(r.qa))}/100`, 'Prévoyez un point coaching et une relecture de conversations (module 12.4).', '#/chatters']);
      const eph = num(r.hours) ? num(r.sales) / num(r.hours) : null;
      if (team && eph != null && eph < team * 0.6) out.push(['warning', `${c.name} : ${money(eph)}/h`, `Nettement sous la moyenne de l'équipe (${money(team)}/h).`, '#/chatters']);
    });
    const stale = D.recruits.filter(r => !r.lost && r.stage > 0 && r.stage < 4 && r.moved && (Date.now() - Date.parse(r.moved)) / 864e5 > 7);
    if (MODE === 'server' && NEWSUBS) out.push(['info', `${NEWSUBS} nouvelle${NEWSUBS > 1 ? 's' : ''} candidature${NEWSUBS > 1 ? 's' : ''} reçue${NEWSUBS > 1 ? 's' : ''} depuis le site`, 'Répondez sous 48 h, comme promis sur le site.', '#/candidatures']);
    if (stale.length) out.push(['info', `${stale.length} prospect${stale.length > 1 ? 's' : ''} sans action depuis plus de 7 jours`, 'Une relance courte et respectueuse suffit (module 5.5).', '#/recrutement']);
    const goal = num(D.settings.goal);
    if (goal > 0 && s.com >= goal) out.push(['good', 'Objectif du mois atteint', `${money(s.com)} de commission pour un objectif de ${money(goal)}.`, '#/']);
    const order = ['critical', 'serious', 'warning', 'info', 'good'];
    return out.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }
  const alertHTML = list => list.length ? `<div class="alerts">${list.map(([k, t, d, href]) => `<a class="al ${k}" href="${href}" style="text-decoration:none">${ico(k)}<div><b><span class="lbl">${esc(SEV[k][1])}</span>${esc(t)}</b><span>${esc(d)}</span></div></a>`).join('')}</div>` : `<div class="al good">${ico('good')}<div><b><span class="lbl">RAS</span>Aucune alerte ce mois-ci</b><span>Tout est saisi et rien ne décroche.</span></div></div>`;

  /* ── Vue d'ensemble ──────────────────────────────────── */
  function vHome(){
    const hello = userName() ? `Bonjour ${userName()}` : "Vue d'ensemble";
    if (!D.models.length) {
      setView("Vue d'ensemble", `
        <div class="ph"><div><h1>${esc(hello)}</h1><p>Le tableau de bord de ${esc(D.settings.agency || 'votre agence')} : revenus, modèles, chatters, finance et recrutement, au même endroit.</p></div></div>
        <div class="card"><div class="card-h"><div><h2>Démarrer en trois étapes</h2><p>Comptez dix minutes. Tout reste enregistré sur cet appareil.</p></div><button class="btn btn-soft" type="button" data-act="load-demo">Voir avec des données d'exemple</button></div>
          <div class="steps-start">
            <a class="s" href="#/donnees" style="text-decoration:none"><b>1</b><h3>Réglez l'agence</h3><p class="muted small">Nom, devise, objectif du mois et charges fixes.</p></a>
            <a class="s" href="#/modeles" style="text-decoration:none"><b>2</b><h3>Ajoutez vos modèles</h3><p class="muted small">Nom de scène, plateforme, commission, statut.</p></a>
            <a class="s" href="#/saisie" style="text-decoration:none"><b>3</b><h3>Saisissez les revenus</h3><p class="muted small">Une fois par mois, depuis les relevés de la plateforme.</p></a>
          </div>
        </div>
        <div class="grid g2">${formationCard()}${recruitCard()}</div>`, {demo:false});
      return;
    }
    const prev = addM(M, -1), s = stats(M), p = stats(prev), months = range(M, 12), ST = months.map(stats), labels = months.map(mShort), long = months.map(mLong);
    const vs = mName(prev), goal = num(D.settings.goal);
    const ranking = D.models.map(md => ({md, v: netOf(entry(md.id, M)), pv: netOf(entry(md.id, prev))})).filter(r => r.v > 0 || r.pv > 0).sort((a, b) => b.v - a.v);
    const chat = D.chatters.filter(c => cmonth(c.id, M)).map(c => { const r = cmonth(c.id, M); return {c, eph: num(r.hours) ? num(r.sales) / num(r.hours) : 0, sales: num(r.sales)}; }).sort((a, b) => b.eph - a.eph);
    const al = alerts(M);
    setView("Vue d'ensemble", `
      <div class="ph"><div><h1>${esc(hello)}</h1><p>Les chiffres de ${esc(mLong(M))} pour ${esc(D.settings.agency || "l'agence")}. Comparaison avec ${esc(vs)}.</p></div>
        <div class="acts"><a class="btn btn-primary" href="#/saisie">${ico('edit')}Saisir les revenus</a><button class="btn btn-ghost" type="button" data-act="add-model">${ico('plus')}Ajouter une modèle</button></div></div>
      ${s.hasData ? '' : `<div class="al info">${ico('info')}<div><b><span class="lbl">À faire</span>Aucun revenu saisi pour ${esc(mLong(M))}</b><span>Choisissez un autre mois en haut à droite ou <a href="#/saisie">saisissez ce mois</a>.</span></div></div>`}
      <div class="kpis">
        <div class="kpi hero"><div style="display:grid;gap:8px"><span class="lb">Chiffre d'affaires net des modèles</span><span class="v">${esc(money(s.net))}</span>${dTile(s.net, p.hasData ? p.net : null, vs)}</div>${spark(ST.map(x => x.net))}<span class="lb" style="font-size:.74rem">12 derniers mois · net après la part de la plateforme</span></div>
        <div class="kpi"><span class="lb">Commission agence</span><span class="v">${esc(money(s.com))}</span>${dTile(s.com, p.hasData ? p.com : null, vs)}</div>
        <div class="kpi"><span class="lb">Bénéfice net de l'agence</span><span class="v">${esc(money(s.profit))}</span><span class="d"><small>Marge ${esc(pct(s.margin))} de la commission</small></span></div>
        <div class="kpi"><span class="lb">Modèles qui génèrent</span><span class="v">${s.n}</span><span class="d"><small>${D.models.filter(x => x.status === 'active').length} actives · ${D.models.filter(x => x.status === 'onboarding').length} en lancement</small></span></div>
        <div class="kpi"><span class="lb">Abonnés actifs</span><span class="v">${esc(int(s.fans))}</span>${dTile(s.fans, p.hasData ? p.fans : null, vs)}</div>
        <div class="kpi"><span class="lb">Revenu par abonné</span><span class="v">${esc(s.arpu == null ? '—' : money(s.arpu, true))}</span>${dTile(s.arpu, p.arpu, vs)}</div>
        <div class="kpi"><span class="lb">Part des messages payants</span><span class="v">${esc(pct(s.ppv))}</span>${dTile(s.ppv, p.ppv, vs, true, true)}</div>
      </div>
      <div class="grid g21">
        <div class="card"><div class="card-h"><div><h2>Évolution sur 12 mois</h2><p>Chiffre d'affaires net des modèles et commission de l'agence.</p></div></div>
          ${legend([{name:"CA net des modèles", color:COL[0]}, {name:'Commission agence', color:COL[1]}], true)}<div class="chart" id="cLine"></div>
          ${tableView(long, [{name:'CA net', values:ST.map(x => x.net)}, {name:'Commission', values:ST.map(x => x.com)}, {name:'Bénéfice', values:ST.map(x => x.profit)}])}</div>
        <div class="grid" style="align-content:start">
          <div class="card"><div class="card-h"><div><h2>Objectif du mois</h2><p>Commission agence visée.</p></div></div>
            ${goal > 0 ? `<div class="meter"><span class="big">${esc(pct(s.com / goal))}</span><div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Math.min(1, s.com / goal) * 100)}"><div class="fill${s.com >= goal ? ' ok' : ''}" style="width:${Math.min(100, s.com / goal * 100).toFixed(1)}%"></div></div><span class="muted small">${esc(money(s.com))} sur ${esc(money(goal))}${s.com < goal ? ' · reste ' + esc(money(goal - s.com)) : ' · objectif atteint'}</span></div>` : `<p class="muted small">Aucun objectif fixé. <a href="#/donnees">Définir un objectif mensuel</a>.</p>`}
          </div>
          <div class="card"><div class="card-h"><div><h2>Alertes</h2><p>Ce qui demande votre attention.</p></div></div>${alertHTML(al.slice(0, 6))}${al.length > 6 ? `<p class="muted small" style="margin-top:8px">+ ${al.length - 6} autre${al.length - 6 > 1 ? 's' : ''}</p>` : ''}</div>
        </div>
      </div>
      <div class="grid g2">
        <div class="card"><div class="card-h"><div><h2>Revenus par source</h2><p>D'où vient l'argent, mois par mois.</p></div></div>
          ${legend(SRC.map(([, t], k) => ({name:t, color:COL[k]})))}<div class="chart" id="cStack"></div>
          ${tableView(long, SRC.map(([k, t]) => ({name:t, values:ST.map(x => x.src[k])})), money, true)}</div>
        <div class="card"><div class="card-h"><div><h2>Classement des modèles</h2><p>CA net de ${esc(mName(M))} et variation vs ${esc(vs)}.</p></div><a class="link" href="#/modeles">Toutes les modèles →</a></div>
          ${ranking.length ? hbars(ranking.slice(0, 8).map(r => ({label:r.md.name, sub:r.md.platform || '', av:initial(r.md.name), value:r.v, extra: entry(r.md.id, M) ? dInline(r.v, r.pv || null) : '<small class="muted">non saisi</small>'}))) : emptyChart('Aucun revenu pour ce mois.')}</div>
      </div>
      <div class="grid g3">
        <div class="card"><div class="card-h"><div><h2>Équipe chatting</h2><p>${esc(mLong(M))}</p></div><a class="link" href="#/chatters">Détail →</a></div>
          <div class="mini"><div class="row"><span>Heures travaillées</span><b>${esc(int(s.hours))} h</b></div><div class="row"><span>Ventes générées</span><b>${esc(money(s.sales))}</b></div><div class="row"><span>Ventes par heure</span><b>${esc(s.eph == null ? '—' : money(s.eph, true))}</b></div><div class="row"><span>Coût de l'équipe</span><b>${esc(money(s.pay))}</b></div></div>
          ${chat.length ? `<p class="muted small" style="margin:14px 0 8px">Meilleur ratio ventes/heure</p>${hbars(chat.slice(0, 3).map(x => ({label:x.c.name, sub:x.c.role || '', value:x.eph})), v => money(v) + '/h')}` : ''}</div>
        ${recruitCard()}
        ${formationCard()}
      </div>`, {month:true});
    draw($('#cLine'), el => lineChart(el, {H:330, labels, long, aria:"Évolution du chiffre d'affaires net et de la commission sur 12 mois", series:[{name:'CA net des modèles', color:COL[0], values:ST.map(x => x.hasData ? x.net : null)}, {name:'Commission agence', color:COL[1], values:ST.map(x => x.hasData ? x.com : null)}]}));
    draw($('#cStack'), el => ST.some(x => x.net > 0) ? stackChart(el, {labels, long, aria:'Revenus par source sur 12 mois', series:SRC.map(([k, t], i) => ({name:t, color:COL[i], values:ST.map(x => x.src[k])}))}) : (el.innerHTML = emptyChart('Pas encore de revenus saisis.')));
  }
  function recruitCard(){
    const live = D.recruits.filter(r => !r.lost);
    const signedM = D.recruits.filter(r => r.stage === 4 && String(r.signedAt || '').slice(0, 7) === M).length;
    return `<div class="card"><div class="card-h"><div><h2>Recrutement de modèles</h2><p>Votre pipeline en cours.</p></div><a class="link" href="#/recrutement">Pipeline →</a></div>
      <div class="mini">${STAGES.map((st, i) => `<div class="row"><span>${esc(st)}</span><b>${live.filter(r => r.stage === i).length}</b></div>`).join('')}<div class="row"><span>Signées en ${esc(mName(M))}</span><b>${signedM}</b></div></div></div>`;
  }
  function formationCard(){
    if (!PACK) return '';
    const done = ALL.filter(lessonDone).length, nx = nextLesson();
    return `<div class="card"><div class="card-h"><div><h2>Formation OFM</h2><p>${ALL.length} leçons · ${ORDER.length} modules</p></div><a class="link" href="#/formation">Ouvrir →</a></div>
      <div class="meter"><span class="big">${esc(pct(done / (ALL.length || 1)))}</span><div class="prog-bar"><i style="width:${(done / (ALL.length || 1) * 100).toFixed(1)}%"></i></div><span class="muted small">${done} leçon${done > 1 ? 's' : ''} lue${done > 1 ? 's' : ''} sur ${ALL.length}</span></div>
      ${nx ? `<a class="btn btn-soft" style="margin-top:14px;width:100%" href="${lessonHref(nx)}">Continuer : ${esc(nx.number_label)} ${esc(fr(nx.title))}</a>` : `<p class="muted small" style="margin-top:12px">Formation terminée. Bravo !</p>`}</div>`;
  }

  /* ── Modèles ─────────────────────────────────────────── */
  let MF = 'all';
  function vModels(){
    const prev = addM(M, -1);
    const list = D.models.filter(md => MF === 'all' || md.status === MF).map(md => ({md, x: econ(md, M), pv: netOf(entry(md.id, prev)), e: entry(md.id, M)})).sort((a, b) => b.x.net - a.x.net || a.md.name.localeCompare(b.md.name));
    const tot = list.reduce((a, r) => ({net: a.net + r.x.net, com: a.com + r.x.com, contrib: a.contrib + r.x.contrib, fans: a.fans + (r.e ? num(r.e.fans) : 0)}), {net:0, com:0, contrib:0, fans:0});
    const count = k => D.models.filter(md => k === 'all' || md.status === k).length;
    setView('Modèles', `
      <div class="ph"><div><h1>Modèles</h1><p>Toutes les créatrices accompagnées, leurs chiffres de ${esc(mLong(M))} et leur rentabilité pour l'agence.</p></div>
        <div class="acts"><button class="btn btn-primary" type="button" data-act="add-model">${ico('plus')}Ajouter une modèle</button></div></div>
      <div class="seg" role="group" aria-label="Filtrer par statut">${[['all', 'Toutes'], ...Object.entries(STATUS).map(([k, v]) => [k, v[0]])].map(([k, t]) => `<button type="button" data-f="${k}" aria-pressed="${MF === k}">${esc(t)} · ${count(k)}</button>`).join('')}</div>
      ${D.models.length ? `<div class="card pad0"><div class="tw"><table class="t"><thead><tr><th>Modèle</th><th>Statut</th><th class="r">CA net</th><th class="r">Variation</th><th class="r">Abonnés actifs</th><th class="r">Revenu / abonné</th><th class="r">Commission</th><th class="r">Pour l'agence</th><th class="r">Contribution</th></tr></thead>
        <tbody>${list.map(({md, x, pv, e}) => `<tr class="click" data-id="${esc(md.id)}" tabindex="0"><td><div class="who"><span class="av">${esc(initial(md.name))}</span><div>${esc(md.name)}<small>${esc([md.platform, md.niche].filter(Boolean).join(' · '))}</small></div></div></td><td>${chip(STATUS[md.status] || STATUS.active)}</td><td class="r"><b>${esc(money(x.net))}</b></td><td class="r">${dInline(x.net, pv || null)}</td><td class="r">${e ? esc(int(e.fans)) : '—'}</td><td class="r">${e && num(e.fans) ? esc(money(x.net / num(e.fans), true)) : '—'}</td><td class="r">${esc(int(commOf(md)))} %</td><td class="r">${esc(money(x.com))}</td><td class="r ${x.contrib < 0 ? 'neg' : ''}">${esc(money(x.contrib))}</td></tr>`).join('') || `<tr><td colspan="9" class="muted">Aucune modèle avec ce statut.</td></tr>`}</tbody>
        <tfoot><tr><td colspan="2">Total</td><td class="r">${esc(money(tot.net))}</td><td></td><td class="r">${esc(int(tot.fans))}</td><td class="r">${tot.fans ? esc(money(tot.net / tot.fans, true)) : '—'}</td><td></td><td class="r">${esc(money(tot.com))}</td><td class="r">${esc(money(tot.contrib))}</td></tr></tfoot></table></div></div>
        <p class="note">${ico('info')}<span>« Contribution » = commission de l'agence − publicité − coût des chatters affectés (réparti entre leurs modèles). C'est ce que chaque modèle rapporte vraiment à l'agence.</span></p>`
      : `<div class="card"><div class="empty-chart">Aucune modèle pour l'instant. Ajoutez votre première créatrice pour commencer le suivi.</div></div>`}`, {month:true});
    $$('.seg [data-f]').forEach(b => b.addEventListener('click', () => { MF = b.dataset.f; route(true); }));
    $$('tr.click').forEach(tr => { const go = () => location.hash = '#/modele/' + tr.dataset.id; tr.addEventListener('click', go); tr.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); });
  }
  function modelForm(md){
    const isNew = !md;
    const v = md || {status:'onboarding', platform:'OnlyFans', page:'Payante', commission:D.settings.defCommission, start:curMonth()};
    modal(isNew ? 'Ajouter une modèle' : 'Modifier ' + v.name, `<div class="fg">
      <label class="f">Nom de scène<input name="name" required maxlength="60" value="${esc(v.name || '')}"></label>
      <label class="f">Plateforme principale<select name="platform">${opts(['OnlyFans', 'Fansly', 'MYM', 'Fanvue', 'Autre'], v.platform)}</select></label>
      <label class="f">Statut<select name="status">${optsKV(STATUS, v.status)}</select></label>
      <label class="f">Début de la collaboration<input name="start" type="month" value="${esc(v.start || '')}" placeholder="AAAA-MM"></label>
      <label class="f">Commission de l'agence (%)<input name="commission" inputmode="decimal" required value="${esc(v.commission ?? '')}"></label>
      <label class="f">Type de page<select name="page">${opts(['Payante', 'Gratuite', 'Hybride'], v.page)}</select></label>
      <label class="f">Niche / positionnement<input name="niche" maxlength="80" value="${esc(v.niche || '')}"></label>
      <label class="f">Account manager<input name="manager" maxlength="60" value="${esc(v.manager || '')}"></label>
      <label class="f">Objectif mensuel de CA net<input name="goal" inputmode="decimal" value="${esc(v.goal || '')}"><small>Facultatif.</small></label>
      <label class="f full">Notes internes<textarea name="notes" maxlength="2000">${esc(v.notes || '')}</textarea><small>N'enregistrez ici ni identité civile, ni adresse, ni pièce d'identité.</small></label>
    </div>`, {danger: isNew ? null : 'Supprimer', onSubmit: f => {
      const c = num(f.commission); if (c < 0 || c > 100) { toast('La commission doit être comprise entre 0 et 100 %.'); return false; }
      const o = {name:f.name.trim(), platform:f.platform, status:f.status, start:isMonth(f.start) ? f.start : '', commission:c, page:f.page, niche:f.niche.trim(), manager:f.manager.trim(), goal:num(f.goal), notes:f.notes.trim()};
      if (isNew) { const id = uid(); D.models.push(Object.assign({id, created:today()}, o)); save(); toast(o.name + ' ajoutée.'); location.hash = '#/modele/' + id; }
      else { Object.assign(md, o); save(); toast('Fiche mise à jour.'); route(true); }
    }, onDanger: () => {
      if (!confirm(`Supprimer ${md.name} et tout son historique de revenus ? Cette action est définitive.`)) return false;
      D.models = D.models.filter(x => x.id !== md.id); D.revenue = D.revenue.filter(e => e.model !== md.id);
      D.chatters.forEach(c => c.models = (c.models || []).filter(id => id !== md.id));
      D.recruits.forEach(r => { if (r.model === md.id) r.model = ''; });
      save(); toast('Modèle supprimée.'); location.hash = '#/modeles';
    }});
  }
  function vModel(parts){
    const md = modelById(parts[0]);
    if (!md) { setView('Modèle introuvable', `<div class="card"><p>Cette fiche n'existe plus. <a href="#/modeles">Retour aux modèles</a></p></div>`); return; }
    const prev = addM(M, -1), x = econ(md, M), e = x.e, pe = entry(md.id, prev), months = range(M, 12), labels = months.map(mShort), long = months.map(mLong);
    const vals = months.map(m => { const r = entry(md.id, m); return r ? netOf(r) : null; });
    const hist = D.revenue.filter(r => r.model === md.id).sort((a, b) => b.month.localeCompare(a.month));
    const chs = D.chatters.filter(c => (c.models || []).includes(md.id));
    const since = isMonth(md.start) ? Math.max(0, (mDate(curMonth()) - mDate(md.start)) / (864e5 * 30.44) | 0) : null;
    const goal = num(md.goal);
    setView(md.name, `
      <div class="crumbs"><a href="#/modeles">Modèles</a><span>/</span><span>${esc(md.name)}</span></div>
      <div class="ph"><div style="display:flex;gap:14px;align-items:center"><span class="av lg">${esc(initial(md.name))}</span><div><h1>${esc(md.name)}</h1><div class="chips" style="margin-top:8px">${chip(STATUS[md.status] || STATUS.active)}<span class="chip violet">${esc(md.platform || '—')}</span><span class="chip">Page ${esc((md.page || '').toLowerCase())}</span><span class="chip">Commission ${esc(int(commOf(md)))} %</span></div></div></div>
        <div class="acts"><a class="btn btn-primary" href="#/saisie">${ico('edit')}Saisir ${esc(mName(M))}</a><button class="btn btn-ghost" type="button" id="editM">Modifier la fiche</button></div></div>
      <div class="grid g4">
        <div class="kpi"><span class="lb">CA net · ${esc(mName(M))}</span><span class="v">${esc(money(x.net))}</span>${dTile(x.net, pe ? netOf(pe) : null, mName(prev))}</div>
        <div class="kpi"><span class="lb">Commission agence</span><span class="v">${esc(money(x.com))}</span><span class="d"><small>Part de la créatrice : ${esc(money(x.payout))}</small></span></div>
        <div class="kpi"><span class="lb">Abonnés actifs</span><span class="v">${e ? esc(int(e.fans)) : '—'}</span><span class="d"><small>${e ? '+' + esc(int(e.newFans)) + ' nouveaux ce mois' : 'Non saisi'}</small></span></div>
        <div class="kpi"><span class="lb">Revenu par abonné</span><span class="v">${e && num(e.fans) ? esc(money(x.net / num(e.fans), true)) : '—'}</span>${dTile(e && num(e.fans) ? x.net / num(e.fans) : null, pe && num(pe.fans) ? netOf(pe) / num(pe.fans) : null, mName(prev))}</div>
      </div>
      <div class="grid g21">
        <div class="card"><div class="card-h"><div><h2>CA net sur 12 mois</h2><p>Après la part de la plateforme.</p></div></div><div class="chart" id="cM"></div>${tableView(long, [{name:'CA net', values:vals}])}</div>
        <div class="card"><div class="card-h"><div><h2>Rentabilité · ${esc(mName(M))}</h2><p>Ce que la modèle rapporte à l'agence.</p></div></div>
          <div class="mini"><div class="row"><span>CA net</span><b>${esc(money(x.net))}</b></div><div class="row"><span>Part de la créatrice</span><b>${esc(money(x.payout))}</b></div><div class="row"><span>Commission agence</span><b>${esc(money(x.com))}</b></div><div class="row"><span>Publicité / trafic</span><b>− ${esc(money(x.ads))}</b></div><div class="row"><span>Coût chatting réparti</span><b>− ${esc(money(x.chat))}</b></div><div class="row"><span><b style="color:var(--ink)">Contribution</b></span><b class="${x.contrib < 0 ? 'neg' : ''}">${esc(money(x.contrib))}</b></div><div class="row"><span>Marge sur commission</span><b>${esc(pct(x.margin))}</b></div></div>
          ${goal > 0 ? `<div class="meter" style="margin-top:16px"><span class="muted small">Objectif mensuel : ${esc(money(goal))}</span><div class="track"><div class="fill${x.net >= goal ? ' ok' : ''}" style="width:${Math.min(100, x.net / goal * 100).toFixed(1)}%"></div></div><span class="muted small">${esc(pct(x.net / goal))} atteint</span></div>` : ''}</div>
      </div>
      <div class="grid g2">
        <div class="card"><div class="card-h"><div><h2>Revenus par source</h2><p>12 derniers mois.</p></div></div>${legend(SRC.map(([, t], k) => ({name:t, color:COL[k]})))}<div class="chart" id="cMS"></div></div>
        <div class="card"><div class="card-h"><div><h2>Fiche</h2></div></div><div class="mini">
          <div class="row"><span>Début</span><b>${md.start ? esc(mLong(md.start)) : '—'}${since != null ? ` · ${since} mois` : ''}</b></div>
          <div class="row"><span>Niche</span><b>${esc(md.niche || '—')}</b></div>
          <div class="row"><span>Account manager</span><b>${esc(md.manager || '—')}</b></div>
          <div class="row"><span>Chatters affectés</span><b>${chs.length ? esc(chs.map(c => c.name).join(', ')) : '—'}</b></div>
          <div class="row"><span>Meilleur mois</span><b>${hist.length ? (() => { const b = hist.reduce((a, r) => netOf(r) > netOf(a) ? r : a); return esc(mLong(b.month) + ' · ' + money(netOf(b))); })() : '—'}</b></div>
        </div>${md.notes ? `<p class="small" style="margin-top:14px;white-space:pre-wrap;color:var(--text)">${esc(md.notes)}</p>` : ''}</div>
      </div>
      <div class="card pad0"><div class="card-h" style="padding:18px 20px 0"><div><h2>Historique</h2><p>Tous les mois saisis.</p></div></div><div class="tw"><table class="t"><thead><tr><th>Mois</th>${SRC.map(([, t]) => `<th class="r">${esc(t)}</th>`).join('')}<th class="r">Total net</th><th class="r">Abonnés</th><th class="r">Nouveaux</th><th class="r">Pub</th></tr></thead>
        <tbody>${hist.map(r => `<tr><td>${esc(mLong(r.month))}</td>${SRC.map(([k]) => `<td class="r">${esc(money(num(r[k])))}</td>`).join('')}<td class="r"><b>${esc(money(netOf(r)))}</b></td><td class="r">${esc(int(r.fans))}</td><td class="r">${esc(int(r.newFans))}</td><td class="r">${esc(money(num(r.ads)))}</td></tr>`).join('') || `<tr><td colspan="10" class="muted">Aucun mois saisi.</td></tr>`}</tbody></table></div></div>`, {month:true});
    $('#editM').addEventListener('click', () => modelForm(md));
    draw($('#cM'), el => vals.some(v => v) ? lineChart(el, {labels, long, aria:'CA net de ' + md.name + ' sur 12 mois', series:[{name:'CA net', color:COL[0], values:vals}]}) : (el.innerHTML = emptyChart('Aucun revenu saisi sur la période.')));
    draw($('#cMS'), el => vals.some(v => v) ? stackChart(el, {labels, long, aria:'Revenus par source', series:SRC.map(([k, t], i) => ({name:t, color:COL[i], values:months.map(m => num((entry(md.id, m) || {})[k]))}))}) : (el.innerHTML = emptyChart('Aucun revenu saisi sur la période.')));
  }

  /* ── Saisie des revenus ──────────────────────────────── */
  function vEntry(){
    const rows = D.models.filter(md => entry(md.id, M) || (md.status !== 'ended' && !(isMonth(md.start) && md.start > M))).sort((a, b) => a.name.localeCompare(b.name));
    const F = [...SRC, ['fans', 'Abonnés actifs'], ['newFans', 'Nouveaux abonnés'], ['ads', 'Pub / trafic']];
    const cell = (md, k) => { const e = entry(md.id, M); const v = e && e[k] !== '' && e[k] != null ? e[k] : ''; return `<td><input name="${esc(md.id)}|${k}" inputmode="decimal" value="${esc(v)}" aria-label="${esc(md.name)} — ${esc(F.find(f => f[0] === k)[1])}"></td>`; };
    setView('Saisie des revenus', `
      <div class="ph"><div><h1>Saisie des revenus · ${esc(mLong(M))}</h1><p>Une ligne par modèle. Montants <b>nets</b>, c'est-à-dire après la part de la plateforme (20 % sur OnlyFans), tels qu'ils apparaissent dans les relevés.</p></div>
        <div class="acts"><button class="btn btn-ghost" type="button" id="copyFans">Reprendre les abonnés de ${esc(mName(addM(M, -1)))}</button></div></div>
      ${rows.length ? `<form id="entryForm" class="card pad0"><div class="tw"><table class="t entry"><thead><tr><th>Modèle</th>${F.map(([, t]) => `<th class="r">${esc(t)}</th>`).join('')}<th class="r">Total net</th></tr></thead>
        <tbody>${rows.map(md => `<tr data-id="${esc(md.id)}"><td><div class="who"><span class="av">${esc(initial(md.name))}</span><div>${esc(md.name)}<small>${esc(md.platform || '')}</small></div></div></td>${F.map(([k]) => cell(md, k)).join('')}<td class="r"><b data-tot>${esc(money(netOf(entry(md.id, M))))}</b></td></tr>`).join('')}</tbody>
        <tfoot><tr><td>Total</td>${F.map(([k]) => `<td class="r" data-ft="${k}"></td>`).join('')}<td class="r" data-ft="net"></td></tr></tfoot></table></div>
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;padding:16px 20px;border-top:1px solid var(--line)"><span class="muted small">Laissez une ligne vide pour ne rien enregistrer pour cette modèle.</span><button class="btn btn-primary" type="submit">${ico('check')}Enregistrer ${esc(mName(M))}</button></div></form>`
      : `<div class="card"><div class="empty-chart">Ajoutez d'abord une modèle pour saisir ses revenus.</div><div style="margin-top:14px"><button class="btn btn-primary" type="button" data-act="add-model">${ico('plus')}Ajouter une modèle</button></div></div>`}
      <div class="grid g2">
        <div class="card"><h2>Où trouver ces chiffres sur OnlyFans</h2><ul class="small" style="margin:12px 0 0;padding-left:18px;display:grid;gap:6px">
          <li><b>Statistiques → Relevés → Revenus</b> : filtrez sur le mois, lisez les montants nets par catégorie.</li>
          <li><b>Abonnements</b> = abonnements et renouvellements. <b>Messages payants</b> = messages et contenus débloqués en privé.</li>
          <li><b>Pourboires</b> = tips. <b>Personnalisés</b> = demandes sur mesure facturées. <b>Autres</b> = publications payantes, lives, parrainages.</li>
          <li><b>Abonnés actifs</b> : nombre d'abonnés en fin de mois. <b>Nouveaux</b> : abonnés gagnés dans le mois.</li>
          <li><b>Pub / trafic</b> : ce que l'agence a dépensé pour faire venir des abonnés à cette modèle.</li></ul></div>
        <div class="card"><h2>La routine de clôture</h2><ol class="small" style="margin:12px 0 0;padding-left:18px;display:grid;gap:6px">
          <li>Le 1er du mois, exportez les relevés de chaque compte.</li><li>Saisissez ici une ligne par modèle, puis enregistrez.</li><li>Complétez les heures et ventes des chatters.</li><li>Ajoutez les dépenses du mois dans Finance.</li><li>Envoyez à chaque créatrice son relevé (Finance → Relevés).</li><li>Exportez une sauvegarde (Données & réglages).</li></ol></div>
      </div>`, {month:true});
    const form = $('#entryForm'); if (!form) return;
    const recalc = () => {
      const ft = {}; F.forEach(([k]) => ft[k] = 0); ft.net = 0;
      $$('tbody tr', form).forEach(tr => { let t = 0; SRC.forEach(([k]) => t += num($(`[name$="|${k}"]`, tr).value)); F.forEach(([k]) => ft[k] += num($(`[name$="|${k}"]`, tr).value)); ft.net += t; $('[data-tot]', tr).textContent = money(t); });
      F.forEach(([k]) => $(`[data-ft="${k}"]`, form).textContent = ['fans', 'newFans'].includes(k) ? int(ft[k]) : money(ft[k]));
      $('[data-ft="net"]', form).textContent = money(ft.net);
    };
    form.addEventListener('input', recalc); recalc();
    $('#copyFans').addEventListener('click', () => { let n = 0; $$('tbody tr', form).forEach(tr => { const p = entry(tr.dataset.id, addM(M, -1)); const inp = $('[name$="|fans"]', tr); if (p && !inp.value) { inp.value = p.fans; n++; } }); recalc(); toast(n ? `${n} ligne${n > 1 ? 's' : ''} pré-remplie${n > 1 ? 's' : ''}.` : 'Rien à reprendre.'); });
    form.addEventListener('submit', ev => {
      ev.preventDefault(); let saved = 0;
      $$('tbody tr', form).forEach(tr => {
        const id = tr.dataset.id, vals = {}; let any = false;
        F.forEach(([k]) => { const raw = $(`[name$="|${k}"]`, tr).value.trim(); vals[k] = raw === '' ? '' : num(raw); if (raw !== '') any = true; });
        const ex = entry(id, M);
        if (!any) { if (ex) D.revenue = D.revenue.filter(e => e !== ex); return; }
        if (ex) Object.assign(ex, vals); else D.revenue.push(Object.assign({id:uid(), model:id, month:M}, vals));
        saved++;
      });
      save(); toast(`Revenus de ${mLong(M)} enregistrés (${saved} modèle${saved > 1 ? 's' : ''}).`); route(true);
    });
  }

  /* ── Chatters ────────────────────────────────────────── */
  function vChatters(){
    const s = stats(M), p = stats(addM(M, -1)), vs = mName(addM(M, -1));
    const list = D.chatters.slice().sort((a, b) => (a.status === 'left') - (b.status === 'left') || a.name.localeCompare(b.name));
    const ephRows = list.map(c => { const r = cmonth(c.id, M); return r && num(r.hours) ? {label:c.name, sub:c.role || '', value:num(r.sales) / num(r.hours)} : null; }).filter(Boolean).sort((a, b) => b.value - a.value);
    setView('Chatters', `
      <div class="ph"><div><h1>Chatters</h1><p>Heures, ventes, qualité et rémunération de l'équipe pour ${esc(mLong(M))}.</p></div>
        <div class="acts"><button class="btn btn-primary" type="button" data-act="add-chatter">${ico('plus')}Ajouter un chatter</button></div></div>
      <div class="grid g4">
        <div class="kpi"><span class="lb">Heures travaillées</span><span class="v">${esc(int(s.hours))} h</span>${dTile(s.hours, p.hours || null, vs)}</div>
        <div class="kpi"><span class="lb">Ventes générées</span><span class="v">${esc(money(s.sales))}</span>${dTile(s.sales, p.sales || null, vs)}</div>
        <div class="kpi"><span class="lb">Ventes par heure</span><span class="v">${esc(s.eph == null ? '—' : money(s.eph, true))}</span>${dTile(s.eph, p.eph, vs)}</div>
        <div class="kpi"><span class="lb">Coût de l'équipe</span><span class="v">${esc(money(s.pay))}</span><span class="d"><small>${s.sales ? esc(pct(s.pay / s.sales, 1)) + ' des ventes générées' : '—'}</small></span></div>
      </div>
      ${list.length ? `<div class="card pad0"><div class="tw"><table class="t"><thead><tr><th>Chatter</th><th>Statut</th><th>Modèles</th><th class="r">Heures</th><th class="r">Ventes</th><th class="r">€ / heure</th><th class="r">Qualité</th><th class="r">Rémunération</th><th class="r">Coût / ventes</th><th></th></tr></thead>
        <tbody>${list.map(c => { const r = cmonth(c.id, M), pay = payOf(c, r), h = r ? num(r.hours) : 0, sa = r ? num(r.sales) : 0; const ms = (c.models || []).map(modelById).filter(Boolean).map(x => x.name);
          return `<tr><td><div class="who"><span class="av">${esc(initial(c.name))}</span><div>${esc(c.name)}<small>${esc([c.role, c.lang].filter(Boolean).join(' · '))} · ${esc(money(num(c.rate), true))}/h + ${esc(int(num(c.pct)))} %</small></div></div></td><td>${chip(CSTATUS[c.status] || CSTATUS.active)}</td><td class="small">${esc(ms.join(', ') || '—')}</td><td class="r">${r ? esc(int(h)) + ' h' : '—'}</td><td class="r">${r ? esc(money(sa)) : '—'}</td><td class="r">${h ? esc(money(sa / h, true)) : '—'}</td><td class="r">${r && num(r.qa) ? `<span class="${num(r.qa) < 70 ? 'neg' : ''}">${esc(int(num(r.qa)))}/100</span>` : '—'}</td><td class="r"><b>${r ? esc(money(pay)) : '—'}</b></td><td class="r">${sa ? esc(pct(pay / sa, 1)) : '—'}</td><td class="r" style="white-space:nowrap"><button class="btn btn-soft btn-sm" type="button" data-cm="${esc(c.id)}">${r ? 'Modifier le mois' : 'Saisir le mois'}</button> <button class="btn btn-ghost btn-sm" type="button" data-ce="${esc(c.id)}">Fiche</button></td></tr>`; }).join('')}</tbody></table></div></div>`
      : `<div class="card"><div class="empty-chart">Aucun chatter enregistré. Ajoutez votre équipe pour suivre heures, ventes et rémunérations.</div></div>`}
      <div class="grid g2">
        <div class="card"><div class="card-h"><div><h2>Ventes par heure</h2><p>${esc(mLong(M))} · l'indicateur clé d'un chatter.</p></div></div>${ephRows.length ? hbars(ephRows, v => money(v, true) + '/h') : emptyChart('Saisissez les heures et ventes du mois.')}</div>
        <div class="card"><h2>Comment c'est calculé</h2><div class="mini" style="margin-top:12px">
          <div class="row"><span>Rémunération</span><b>heures × taux + ventes × commission + prime</b></div>
          <div class="row"><span>Ventes par heure</span><b>ventes générées ÷ heures</b></div>
          <div class="row"><span>Coût / ventes</span><b>rémunération ÷ ventes</b></div>
          <div class="row"><span>Qualité</span><b>grille QA sur 100 (module 17.6)</b></div></div>
          <p class="note" style="margin-top:12px">${ico('info')}<span>Suivez le coût / ventes mois après mois : s'il monte, les ventes par heure baissent ou les heures tombent aux mauvais moments. Visez une qualité d'au moins 80/100 (module 12).</span></p></div>
      </div>`, {month:true});
    $$('[data-cm]').forEach(b => b.addEventListener('click', () => chatterMonthForm(chatterById(b.dataset.cm))));
    $$('[data-ce]').forEach(b => b.addEventListener('click', () => chatterForm(chatterById(b.dataset.ce))));
  }
  function chatterForm(c){
    const isNew = !c, v = c || {role:'Chatter', status:'active', rate:'', pct:'', lang:'Français', models:[]};
    modal(isNew ? 'Ajouter un chatter' : 'Modifier ' + v.name, `<div class="fg">
      <label class="f">Nom ou pseudo<input name="name" required maxlength="60" value="${esc(v.name || '')}"></label>
      <label class="f">Rôle<select name="role">${opts(ROLES, v.role)}</select></label>
      <label class="f">Statut<select name="status">${optsKV(CSTATUS, v.status)}</select></label>
      <label class="f">Langue<select name="lang">${opts(['Français', 'Anglais', 'Bilingue', 'Autre'], v.lang)}</select></label>
      <label class="f">Taux horaire<input name="rate" inputmode="decimal" value="${esc(v.rate)}"><small>Dans la devise de l'agence.</small></label>
      <label class="f">Commission sur ventes (%)<input name="pct" inputmode="decimal" value="${esc(v.pct)}"></label>
      <div class="f full"><span style="font-size:.8rem;font-weight:700;color:var(--ink)">Modèles affectées</span><div class="chips" style="margin-top:6px">${D.models.filter(m => m.status !== 'ended' || (v.models || []).includes(m.id)).map(m => `<label class="chk" style="background:var(--lav);padding:8px 10px;border-radius:10px"><input type="checkbox" name="models" value="${esc(m.id)}"${(v.models || []).includes(m.id) ? ' checked' : ''}> ${esc(m.name)}</label>`).join('') || '<span class="muted small">Aucune modèle pour l\'instant.</span>'}</div></div>
      <label class="f full">Notes<textarea name="notes" maxlength="1500">${esc(v.notes || '')}</textarea></label></div>`,
    {danger: isNew ? null : 'Supprimer', onSubmit: (f, form) => {
      const o = {name:f.name.trim(), role:f.role, status:f.status, lang:f.lang, rate:num(f.rate), pct:num(f.pct), models:$$('[name=models]:checked', form).map(i => i.value), notes:(f.notes || '').trim()};
      if (isNew) D.chatters.push(Object.assign({id:uid()}, o)); else Object.assign(c, o);
      save(); toast(isNew ? o.name + ' ajouté·e.' : 'Fiche mise à jour.'); route(true);
    }, onDanger: () => {
      if (!confirm(`Supprimer ${c.name} et ses mois saisis ?`)) return false;
      D.chatters = D.chatters.filter(x => x.id !== c.id); D.cmonths = D.cmonths.filter(r => r.chatter !== c.id); save(); route(true);
    }});
  }
  function chatterMonthForm(c){
    const r = cmonth(c.id, M) || {};
    modal(`${c.name} · ${mLong(M)}`, `<div class="fg">
      <label class="f">Heures travaillées<input name="hours" inputmode="decimal" required value="${esc(r.hours ?? '')}"></label>
      <label class="f">Ventes générées (nettes)<input name="sales" inputmode="decimal" value="${esc(r.sales ?? '')}"><small>Messages payants, pourboires et personnalisés obtenus par ce chatter.</small></label>
      <label class="f">Score qualité (sur 100)<input name="qa" inputmode="numeric" value="${esc(r.qa ?? '')}"></label>
      <label class="f">Prime (montant)<input name="bonus" inputmode="decimal" value="${esc(r.bonus ?? '')}"></label></div>
      <p class="note">${ico('info')}<span>Rémunération estimée : heures × ${esc(money(num(c.rate), true))} + ventes × ${esc(int(num(c.pct)))} % + prime.</span></p>`,
    {danger: cmonth(c.id, M) ? 'Effacer ce mois' : null, onSubmit: f => {
      const qa = f.qa.trim() === '' ? '' : Math.max(0, Math.min(100, num(f.qa)));
      const o = {hours:num(f.hours), sales:num(f.sales), qa, bonus:num(f.bonus)};
      const ex = cmonth(c.id, M); if (ex) Object.assign(ex, o); else D.cmonths.push(Object.assign({id:uid(), chatter:c.id, month:M}, o));
      save(); toast('Mois enregistré.'); route(true);
    }, onDanger: () => { D.cmonths = D.cmonths.filter(x => !(x.chatter === c.id && x.month === M)); save(); route(true); }});
  }

  /* ── Finance ─────────────────────────────────────────── */
  function vFinance(){
    const s = stats(M), p = stats(addM(M, -1)), vs = mName(addM(M, -1)), months = range(M, 12), ST = months.map(stats), labels = months.map(mShort), long = months.map(mLong);
    const exps = D.expenses.filter(x => x.month === M);
    const byCat = {}; exps.forEach(x => byCat[x.category] = (byCat[x.category] || 0) + num(x.amount));
    const mods = D.models.map(md => ({md, x:econ(md, M)})).filter(r => r.x.net > 0 || r.x.chat > 0 || r.x.ads > 0).sort((a, b) => b.x.contrib - a.x.contrib);
    const activeMods = mods.filter(r => r.x.net > 0);
    const avgContrib = activeMods.length ? activeMods.reduce((a, r) => a + r.x.contrib, 0) / activeMods.length : 0;
    const overhead = num(D.settings.fixed) + s.exp;
    const be = avgContrib > 0 ? Math.ceil(overhead / avgContrib) : null;
    setView('Finance', `
      <div class="ph"><div><h1>Finance</h1><p>Compte de résultat, dépenses, rentabilité par modèle et relevés pour ${esc(mLong(M))}.</p></div>
        <div class="acts"><button class="btn btn-ghost" type="button" id="csvStm">${ico('down')}Exporter les relevés (CSV)</button></div></div>
      <div class="grid g4">
        <div class="kpi"><span class="lb">Revenus de l'agence</span><span class="v">${esc(money(s.com))}</span>${dTile(s.com, p.active ? p.com : null, vs)}</div>
        <div class="kpi"><span class="lb">Charges totales</span><span class="v">${esc(money(s.costs))}</span>${dTile(s.costs, p.active ? p.costs : null, vs, false)}</div>
        <div class="kpi"><span class="lb">Bénéfice net</span><span class="v ${s.profit < 0 ? 'neg' : ''}">${esc(money(s.profit))}</span>${dTile(s.profit, p.active ? p.profit : null, vs)}</div>
        <div class="kpi"><span class="lb">Marge nette</span><span class="v">${esc(pct(s.margin))}</span>${dTile(s.margin, p.margin, vs, true, true)}</div>
      </div>
      <div class="grid g21">
        <div class="card"><div class="card-h"><div><h2>Résultat sur 12 mois</h2><p>Bénéfice (bleu) ou perte (rouge) de l'agence, mois par mois.</p></div></div>
          ${legend([{name:'Bénéfice', color:COL[0]}, {name:'Perte', color:NEG}])}<div class="chart" id="cRes"></div>
          ${tableView(long, [{name:'Commission', values:ST.map(x => x.com)}, {name:'Charges', values:ST.map(x => x.costs)}, {name:'Résultat', values:ST.map(x => x.profit)}])}</div>
        <div class="card"><div class="card-h"><div><h2>Compte de résultat</h2><p>${esc(mLong(M))}</p></div></div>
          <table class="t pl"><tbody>
            <tr><td><b>Commission agence</b></td><td class="r"><b>${esc(money(s.com))}</b></td></tr>
            <tr class="sub"><td>sur ${esc(money(s.net))} de CA net des modèles</td><td class="r">${esc(pct(s.net ? s.com / s.net : null, 1))}</td></tr>
            <tr><td>Rémunération des chatters</td><td class="r">− ${esc(money(s.pay))}</td></tr>
            <tr><td>Publicité / trafic (par modèle)</td><td class="r">− ${esc(money(s.ads))}</td></tr>
            <tr><td>Dépenses du mois</td><td class="r">− ${esc(money(s.exp))}</td></tr>
            ${Object.entries(byCat).map(([k, v]) => `<tr class="sub"><td>${esc(k)}</td><td class="r">${esc(money(v))}</td></tr>`).join('')}
            <tr><td>Charges fixes mensuelles</td><td class="r">− ${esc(money(s.fixed))}</td></tr>
            <tr class="res"><td>Résultat</td><td class="r ${s.profit < 0 ? 'neg' : ''}">${esc(money(s.profit))}</td></tr>
          </tbody></table>
          <div class="mini" style="margin-top:14px"><div class="row"><span>Point mort</span><b>${be != null ? `${be} modèle${be > 1 ? 's' : ''} au niveau moyen` : (activeMods.length ? 'non atteint au niveau actuel' : '—')}</b></div><div class="row"><span>Réserve conseillée (3 mois de charges)</span><b>${esc(money(3 * s.costs))}</b></div></div></div>
      </div>
      <div class="grid g2">
        <div class="card"><div class="card-h"><div><h2>Dépenses de ${esc(mName(M))}</h2><p>Hors chatters et publicité par modèle, déjà comptés.</p></div><button class="btn btn-ghost btn-sm" type="button" id="copyExp">Reprendre ${esc(mName(addM(M, -1)))}</button></div>
          <form id="expForm" class="fg" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,.8fr) auto;align-items:end">
            <label class="f">Libellé<input name="label" required maxlength="80" placeholder="Ex. logiciel CRM"></label>
            <label class="f">Catégorie<select name="category">${opts(ECATS, ECATS[0])}</select></label>
            <label class="f">Montant<input name="amount" required inputmode="decimal"></label>
            <button class="btn btn-primary" type="submit" aria-label="Ajouter la dépense">${ico('plus')}</button></form>
          <div class="tw" style="margin-top:12px"><table class="t"><tbody>${exps.map(x => `<tr><td>${esc(x.label)}<br><small class="muted">${esc(x.category)}</small></td><td class="r"><b>${esc(money(num(x.amount)))}</b></td><td class="r" style="width:1%"><button class="btn btn-ghost btn-icon" type="button" data-dx="${esc(x.id)}" aria-label="Supprimer ${esc(x.label)}">✕</button></td></tr>`).join('') || '<tr><td class="muted">Aucune dépense saisie pour ce mois.</td></tr>'}</tbody>${exps.length ? `<tfoot><tr><td>Total</td><td class="r">${esc(money(s.exp))}</td><td></td></tr></tfoot>` : ''}</table></div>
          <p class="note" style="margin-top:10px">${ico('info')}<span>Charges fixes mensuelles (${esc(money(num(D.settings.fixed)))}) réglables dans <a href="#/donnees">Données & réglages</a>.</span></p></div>
        <div class="card pad0"><div class="card-h" style="padding:18px 20px 0"><div><h2>Rentabilité par modèle</h2><p>Commission − publicité − chatting réparti.</p></div></div>
          <div class="tw"><table class="t"><thead><tr><th>Modèle</th><th class="r">Commission</th><th class="r">Pub</th><th class="r">Chatting</th><th class="r">Contribution</th><th class="r">Marge</th></tr></thead><tbody>
          ${mods.map(({md, x}) => `<tr><td><b>${esc(md.name)}</b></td><td class="r">${esc(money(x.com))}</td><td class="r">${esc(money(x.ads))}</td><td class="r">${esc(money(x.chat))}</td><td class="r ${x.contrib < 0 ? 'neg' : ''}"><b>${esc(money(x.contrib))}</b></td><td class="r">${esc(pct(x.margin))}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Aucun revenu ce mois-ci.</td></tr>'}</tbody></table></div></div>
      </div>
      <div class="card pad0"><div class="card-h" style="padding:18px 20px 0"><div><h2>Relevés créatrices · ${esc(mLong(M))}</h2><p>À envoyer à chaque créatrice : même chiffres que son tableau de bord, en toute transparence.</p></div></div>
        <div class="tw"><table class="t"><thead><tr><th>Modèle</th>${SRC.map(([, t]) => `<th class="r">${esc(t)}</th>`).join('')}<th class="r">CA net</th><th class="r">Taux</th><th class="r">Commission due</th><th class="r">Part créatrice</th></tr></thead><tbody>
        ${D.models.filter(md => entry(md.id, M)).map(md => { const e = entry(md.id, M), x = econ(md, M); return `<tr><td><b>${esc(md.name)}</b></td>${SRC.map(([k]) => `<td class="r">${esc(money(num(e[k])))}</td>`).join('')}<td class="r"><b>${esc(money(x.net))}</b></td><td class="r">${esc(int(commOf(md)))} %</td><td class="r">${esc(money(x.com, true))}</td><td class="r">${esc(money(x.payout, true))}</td></tr>`; }).join('') || `<tr><td colspan="${SRC.length + 5}" class="muted">Aucun revenu saisi pour ce mois.</td></tr>`}</tbody></table></div></div>`, {month:true});
    draw($('#cRes'), el => ST.some(x => x.active) ? barChart(el, {H:300, labels, long, name:'Résultat', aria:"Résultat de l'agence sur 12 mois", values:ST.map(x => x.active ? x.profit : 0)}) : (el.innerHTML = emptyChart('Pas encore de données.')));
    $('#expForm').addEventListener('submit', e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (!f.label.trim() || !num(f.amount)) { toast('Indiquez un libellé et un montant.'); return; } D.expenses.push({id:uid(), month:M, label:f.label.trim(), category:f.category, amount:num(f.amount)}); save(); route(true); });
    $$('[data-dx]').forEach(b => b.addEventListener('click', () => { D.expenses = D.expenses.filter(x => x.id !== b.dataset.dx); save(); route(true); }));
    $('#copyExp').addEventListener('click', () => { const src = D.expenses.filter(x => x.month === addM(M, -1)); if (!src.length) { toast('Aucune dépense le mois précédent.'); return; } src.forEach(x => D.expenses.push(Object.assign({}, x, {id:uid(), month:M}))); save(); toast(src.length + ' dépense(s) reprise(s).'); route(true); });
    $('#csvStm').addEventListener('click', () => {
      const rows = [['Mois', 'Modèle', ...SRC.map(([, t]) => t), 'CA net', 'Taux de commission (%)', 'Commission due', 'Part créatrice']];
      D.models.forEach(md => { const e = entry(md.id, M); if (!e) return; const x = econ(md, M); rows.push([M, md.name, ...SRC.map(([k]) => num(e[k])), x.net, commOf(md), +x.com.toFixed(2), +x.payout.toFixed(2)]); });
      download(`releves-${M}.csv`, csv(rows), 'text/csv');
    });
  }

  /* ── Recrutement ─────────────────────────────────────── */
  function vRecruit(){
    const live = D.recruits.filter(r => !r.lost), lost = D.recruits.filter(r => r.lost), signed = D.recruits.filter(r => r.stage === 4);
    const decided = signed.length + lost.length;
    const reached = STAGES.map((_, i) => D.recruits.filter(r => (r.lost ? (r.lostAt ?? r.stage) : r.stage) >= i).length);
    const bySrc = SOURCES.map(src => { const l = D.recruits.filter(r => (r.source || 'Autre') === src); return {src, n:l.length, s:l.filter(r => r.stage === 4).length}; }).filter(x => x.n);
    const days = r => r.moved ? Math.floor((Date.now() - Date.parse(r.moved)) / 864e5) : null;
    const card = r => { const d = days(r); return `<div class="pc"><b>${esc(r.name)}</b><span class="meta">${esc([r.source, r.handle].filter(Boolean).join(' · '))}${num(r.potential) ? ' · potentiel ' + esc(money(num(r.potential))) + '/mois' : ''}</span>${r.next ? `<span class="meta">→ ${esc(r.next)}</span>` : ''}${d != null && r.stage < 4 ? `<span class="meta${d > 7 && r.stage > 0 ? ' neg' : ''}">Dans cette étape depuis ${d} j</span>` : ''}
      <div class="acts">${r.stage > 0 ? `<button class="btn btn-ghost btn-icon" type="button" data-mv="${esc(r.id)}" data-d="-1" aria-label="Reculer ${esc(r.name)}">${ico('left')}</button>` : ''}${r.stage < 4 ? `<button class="btn btn-soft btn-icon" type="button" data-mv="${esc(r.id)}" data-d="1" aria-label="Avancer ${esc(r.name)}">${ico('right')}</button>` : ''}<button class="btn btn-ghost btn-sm" type="button" data-re="${esc(r.id)}">Fiche</button>${r.stage === 4 && !modelById(r.model) ? `<button class="btn btn-primary btn-sm" type="button" data-cv="${esc(r.id)}">Créer la fiche modèle</button>` : ''}${r.stage < 4 ? `<button class="btn btn-ghost btn-sm" type="button" data-lost="${esc(r.id)}">Perdue</button>` : ''}</div></div>`; };
    setView('Recrutement', `
      <div class="ph"><div><h1>Recrutement de modèles</h1><p>Du premier repérage à la signature. Respect, honnêteté et vérification de la majorité à chaque étape (modules 3 et 5).</p></div>
        <div class="acts"><button class="btn btn-primary" type="button" data-act="add-recruit">${ico('plus')}Ajouter un prospect</button></div></div>
      <div class="grid g4">
        <div class="kpi"><span class="lb">Prospects en cours</span><span class="v">${live.filter(r => r.stage < 4).length}</span></div>
        <div class="kpi"><span class="lb">Appels et propositions</span><span class="v">${live.filter(r => r.stage === 2 || r.stage === 3).length}</span></div>
        <div class="kpi"><span class="lb">Signées en ${esc(mName(M))}</span><span class="v">${signed.filter(r => String(r.signedAt || '').slice(0, 7) === M).length}</span><span class="d"><small>${signed.length} au total</small></span></div>
        <div class="kpi"><span class="lb">Taux de signature</span><span class="v">${decided ? esc(pct(signed.length / decided)) : '—'}</span><span class="d"><small>signées ÷ (signées + perdues)</small></span></div>
      </div>
      <div class="kanban">${STAGES.map((st, i) => { const l = live.filter(r => r.stage === i); return `<section class="col-k" aria-label="${esc(st)}"><h3>${esc(st)}<span>${l.length}</span></h3>${l.map(card).join('') || '<p class="muted small">—</p>'}</section>`; }).join('')}</div>
      <div class="grid g2">
        <div class="card"><div class="card-h"><div><h2>Entonnoir</h2><p>Combien de prospects atteignent chaque étape.</p></div></div>
          ${D.recruits.length ? hbars(STAGES.map((st, i) => ({label:st, sub: i ? 'conversion ' + pct(reached[i - 1] ? reached[i] / reached[i - 1] : null) : '', value:reached[i]})), v => int(v)) : emptyChart('Ajoutez vos premiers prospects.')}</div>
        <div class="card pad0"><div class="card-h" style="padding:18px 20px 0"><div><h2>Par source</h2><p>Où trouver les bonnes modèles.</p></div></div>
          <div class="tw"><table class="t"><thead><tr><th>Source</th><th class="r">Prospects</th><th class="r">Signées</th><th class="r">Taux</th></tr></thead><tbody>${bySrc.map(x => `<tr><td>${esc(x.src)}</td><td class="r">${x.n}</td><td class="r">${x.s}</td><td class="r">${esc(pct(x.s / x.n))}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">—</td></tr>'}</tbody></table></div></div>
      </div>
      ${lost.length ? `<details class="card"><summary style="cursor:pointer;font-weight:700;color:var(--ink)">Prospects perdus (${lost.length})</summary><div class="tw" style="margin-top:12px"><table class="t"><tbody>${lost.map(r => `<tr><td><b>${esc(r.name)}</b><br><small class="muted">${esc(r.source || '')} · perdue à l'étape « ${esc(STAGES[r.lostAt ?? r.stage] || '')} »</small></td><td class="r"><button class="btn btn-ghost btn-sm" type="button" data-rs="${esc(r.id)}">Réactiver</button></td></tr>`).join('')}</tbody></table></div></details>` : ''}`);
    const find = id => D.recruits.find(r => r.id === id);
    $$('[data-mv]').forEach(b => b.addEventListener('click', () => { const r = find(b.dataset.mv); r.stage = Math.max(0, Math.min(4, r.stage + +b.dataset.d)); r.moved = today(); if (r.stage === 4) r.signedAt = today(); save(); route(true); if (r.stage === 4) toast(`${r.name} signée. Pensez à créer sa fiche modèle.`); }));
    $$('[data-re]').forEach(b => b.addEventListener('click', () => recruitForm(find(b.dataset.re))));
    $$('[data-lost]').forEach(b => b.addEventListener('click', () => { const r = find(b.dataset.lost); r.lost = true; r.lostAt = r.stage; r.moved = today(); save(); route(true); }));
    $$('[data-rs]').forEach(b => b.addEventListener('click', () => { const r = find(b.dataset.rs); r.lost = false; r.stage = r.lostAt ?? r.stage; r.moved = today(); save(); route(true); }));
    $$('[data-cv]').forEach(b => b.addEventListener('click', () => { const r = find(b.dataset.cv); const id = uid(); D.models.push({id, name:r.name, platform:'OnlyFans', status:'onboarding', start:curMonth(), commission:num(D.settings.defCommission), page:'Payante', niche:'', manager:'', goal:0, notes:r.notes || '', created:today()}); r.model = id; save(); toast('Fiche modèle créée.'); location.hash = '#/modele/' + id; }));
  }
  function recruitForm(r){
    const isNew = !r, v = r || {stage:0, source:'Instagram'};
    modal(isNew ? 'Ajouter un prospect' : v.name, `<div class="fg">
      <label class="f">Nom ou pseudo<input name="name" required maxlength="60" value="${esc(v.name || '')}"></label>
      <label class="f">Source<select name="source">${opts(SOURCES, v.source)}</select></label>
      <label class="f">Compte / lien<input name="handle" maxlength="120" value="${esc(v.handle || '')}" placeholder="@compte"></label>
      <label class="f">Étape<select name="stage">${STAGES.map((s, i) => `<option value="${i}"${i === v.stage ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
      <label class="f">Audience estimée<input name="audience" inputmode="numeric" value="${esc(v.audience || '')}"></label>
      <label class="f">Potentiel mensuel estimé<input name="potential" inputmode="decimal" value="${esc(v.potential || '')}"></label>
      <label class="f full">Prochaine action<input name="next" maxlength="120" value="${esc(v.next || '')}" placeholder="Ex. rappeler jeudi, envoyer la proposition"></label>
      <label class="f full">Notes<textarea name="notes" maxlength="1500">${esc(v.notes || '')}</textarea><small>Majorité vérifiée avant toute signature. Pas de données sensibles ici.</small></label></div>`,
    {danger: isNew ? null : 'Supprimer', onSubmit: f => {
      const st = Math.max(0, Math.min(4, parseInt(f.stage, 10) || 0));
      const o = {name:f.name.trim(), source:f.source, handle:f.handle.trim(), audience:num(f.audience), potential:num(f.potential), next:f.next.trim(), notes:f.notes.trim()};
      if (isNew) D.recruits.push(Object.assign({id:uid(), stage:st, moved:today(), created:today(), signedAt: st === 4 ? today() : ''}, o));
      else { if (st !== r.stage) { r.moved = today(); if (st === 4) r.signedAt = today(); } Object.assign(r, o, {stage:st}); }
      save(); route(true);
    }, onDanger: () => { if (!confirm(`Supprimer ${r.name} ?`)) return false; D.recruits = D.recruits.filter(x => x.id !== r.id); save(); route(true); }});
  }

  /* ── Formation OFM ───────────────────────────────────── */
  let PACK = null, MODS = {}, ORDER = [], PATHS = [], ALL = [];
  function prep(){
    PACK.modules.sort((a, b) => a.order - b.order);
    PACK.modules.forEach(m => { MODS[m.number] = m; m.lessons.sort((a, b) => a.order - b.order); m.lessons.forEach(l => { l.id = m.number + '-' + l.order; l.mod = m; ALL.push(l); }); });
    ORDER = PACK.modules.map(m => m.number);
    PATHS = PACK.learning_paths || [];
  }
  const lessonDone = l => !!D.lessons[l.id];
  const lessonHref = l => `#/formation/l/${l.mod.number}/${l.order}`;
  const activePath = () => PATHS.find(p => p.slug === D.path) || null;
  const seqOf = p => p ? p.module_numbers.filter(n => MODS[n]).flatMap(n => MODS[n].lessons) : ALL;
  const nextLesson = () => seqOf(activePath()).find(l => !lessonDone(l)) || ALL.find(l => !lessonDone(l)) || null;
  const pctOf = list => list.length ? list.filter(lessonDone).length / list.length : 0;
  const bar = v => `<div class="prog-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v * 100)}"><i style="width:${(v * 100).toFixed(1)}%"></i></div>`;
  function vFormation(parts){
    if (!PACK) { setView('Formation OFM', `<div class="card"><p>La formation n'a pas pu être ouverte.${MODE === 'server' ? (ME.role === 'owner' ? ' Renseignez le code d\'accès de la formation dans <a href="#/donnees">Données & réglages</a>.' : ' Le responsable de l\'agence doit renseigner le code de la formation.') : ''}</p></div>`, {demo:false}); return; }
    if (parts[0] === 'm' && MODS[parts[1]]) return vModule(MODS[parts[1]]);
    if (parts[0] === 'l' && MODS[parts[1]]) { const l = MODS[parts[1]].lessons.find(x => String(x.order) === parts[2]); if (l) return vLesson(l); }
    const ap = activePath(), mods = ap ? ap.module_numbers.map(n => MODS[n]).filter(Boolean) : ORDER.map(n => MODS[n]);
    const done = ALL.filter(lessonDone).length, nx = nextLesson(), mins = ALL.reduce((a, l) => a + (l.duration_min || 0), 0);
    setView('Formation OFM', `
      <div class="ph"><div><h1>Formation OFM</h1><p>OnlyFans, structure d'agence, recherche de modèles, chatting, finance et scale : ${ORDER.length} modules, ${ALL.length} leçons, environ ${Math.round(mins / 60)} h de lecture. Votre progression est enregistrée sur cet appareil.</p></div>
        <div class="acts"><a class="btn btn-ghost" href="#/recherche">${ico('search')}Rechercher</a></div></div>
      <div class="card" style="display:grid;gap:12px"><div class="card-h" style="margin:0"><div><h2>Votre progression</h2><p>${done} leçon${done > 1 ? 's' : ''} lue${done > 1 ? 's' : ''} sur ${ALL.length}${ap ? ` · parcours « ${esc(ap.title)} » : ${esc(pct(pctOf(seqOf(ap))))}` : ''}</p></div>${nx ? `<a class="btn btn-primary" href="${lessonHref(nx)}">${done ? 'Continuer' : 'Commencer'} : ${esc(nx.number_label)} ${esc(fr(nx.title))}</a>` : '<span class="chip green"><i></i>Formation terminée</span>'}</div>${bar(done / (ALL.length || 1))}</div>
      <div><div class="card-h"><div><h2>Parcours</h2><p>Choisissez un parcours selon votre rôle : la page n'affiche alors que ses modules. Tout reste accessible.</p></div>${ap ? '<button class="btn btn-ghost btn-sm" type="button" data-path="">Tout afficher</button>' : ''}</div>
        <div class="paths">${PATHS.map(p => { const v = pctOf(seqOf(p)); return `<button type="button" class="path${p.slug === D.path ? ' on' : ''}" data-path="${esc(p.slug)}" style="text-align:left;font:inherit;cursor:pointer"><b style="color:var(--ink)">${esc(p.title)}</b><span class="muted small">${esc(p.description || '')}</span><span class="small" style="color:var(--faint)">${p.module_numbers.length} modules · ${esc(pct(v))}</span>${bar(v)}</button>`; }).join('')}</div></div>
      <div><div class="card-h"><div><h2>${ap ? 'Modules du parcours' : 'Tous les modules'}</h2></div></div>
        <div class="mods">${mods.map(m => { const v = pctOf(m.lessons); return `<a class="mod${v === 1 ? ' done' : ''}" href="#/formation/m/${m.number}"><span class="n">${v === 1 ? ico('check').replace('<svg', '<svg style="width:18px;height:18px"') : m.number}</span><h3>${esc(fr(m.title))}</h3><p>${esc(m.meta || '')}</p><span class="small" style="color:var(--faint)">${m.lessons.filter(lessonDone).length}/${m.lessons.length} leçons</span>${bar(v)}</a>`; }).join('')}</div></div>`);
    $$('[data-path]').forEach(b => b.addEventListener('click', () => { D.path = b.dataset.path; save(); route(true); }));
  }
  function vModule(m){
    const v = pctOf(m.lessons), nx = m.lessons.find(l => !lessonDone(l)) || m.lessons[0];
    setView('Module ' + m.number, `
      <div class="crumbs"><a href="#/formation">Formation OFM</a><span>/</span><span>Module ${m.number}</span></div>
      <div class="card" style="display:grid;gap:14px">
        <div class="ph" style="align-items:flex-start"><div><span class="chip blue">Module ${m.number}</span><h1 style="margin-top:10px">${esc(fr(m.title))}</h1><p>${esc(m.meta || '')}</p></div>${nx ? `<a class="btn btn-primary" href="${lessonHref(nx)}">${v ? 'Reprendre' : 'Commencer'}</a>` : ''}</div>
        ${m.description ? `<p style="max-width:75ch">${esc(m.description)}</p>` : ''}
        ${(m.objectives || []).length ? `<div class="takeaways" style="margin:0"><h3>Ce que vous saurez faire</h3><ul>${m.objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}
        ${bar(v)}<span class="muted small">${m.lessons.filter(lessonDone).length} leçon(s) lue(s) sur ${m.lessons.length}</span>
      </div>
      <div class="card pad0"><div class="lessons">${m.lessons.map(l => `<a href="${lessonHref(l)}"><span class="ck${lessonDone(l) ? ' on' : ''}">${lessonDone(l) ? ico('check') : ''}</span><span class="t"><span class="lb">${esc(l.number_label)}</span>${esc(fr(l.title))}</span><span class="du">${l.duration_min ? l.duration_min + ' min' : ''}</span></a>`).join('')}</div></div>
      <div class="lnav">${MODS[m.number - 1] ? `<a class="btn btn-ghost" href="#/formation/m/${m.number - 1}">${ico('left')}Module ${m.number - 1}</a>` : '<span></span>'}${MODS[m.number + 1] ? `<a class="btn btn-ghost" href="#/formation/m/${m.number + 1}">Module ${m.number + 1}${ico('right')}</a>` : ''}</div>`);
  }
  function vLesson(l){
    const ap = activePath(); let seq = seqOf(ap); if (!seq.includes(l)) seq = ALL;
    const i = seq.indexOf(l), prev = seq[i - 1], next = seq[i + 1], m = l.mod;
    let html = ''; try { html = window.marked ? marked.parse(l.content_md || '') : '<pre>' + esc(l.content_md || '') + '</pre>'; } catch(e) { html = '<pre>' + esc(l.content_md || '') + '</pre>'; }
    setView(l.number_label + ' ' + l.title, `
      <article class="reader">
        <div class="crumbs"><a href="#/formation">Formation OFM</a><span>/</span><a href="#/formation/m/${m.number}">Module ${m.number}</a><span>/</span><span>${esc(l.number_label)}</span></div>
        <div style="margin:16px 0 22px;display:grid;gap:10px"><span class="chip blue" style="justify-self:start">Leçon ${esc(l.number_label)}${l.duration_min ? ' · ' + l.duration_min + ' min' : ''}</span><h1 style="font-size:clamp(1.6rem,3vw,2.2rem)">${esc(fr(l.title))}</h1><p class="muted small">${esc(fr(m.title))}</p></div>
        <div class="prose">${html}</div>
        ${(l.key_takeaways || []).length && !/#+\s*À retenir/i.test(l.content_md || '') ? `<div class="takeaways"><h3>À retenir</h3><ul>${l.key_takeaways.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
        <div class="lnav">
          <button class="btn ${lessonDone(l) ? 'btn-soft' : 'btn-ghost'}" type="button" id="markL">${lessonDone(l) ? ico('check') + 'Lue' : 'Marquer comme lue'}</button>
          <div style="display:flex;gap:8px;flex-wrap:wrap">${prev ? `<a class="btn btn-ghost" href="${lessonHref(prev)}">${ico('left')}Précédente</a>` : ''}${next ? `<a class="btn btn-primary" href="${lessonHref(next)}" id="nextL">Leçon suivante${ico('right')}</a>` : `<a class="btn btn-primary" href="#/formation" id="nextL">Terminer</a>`}</div>
        </div>
      </article>`, {demo:false});
    $('#markL').addEventListener('click', () => { if (lessonDone(l)) delete D.lessons[l.id]; else D.lessons[l.id] = today(); save(); route(true); });
    $('#nextL').addEventListener('click', () => { if (!lessonDone(l)) { D.lessons[l.id] = today(); save(); } });
  }
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const plain = md => String(md || '').replace(/[#*_>`|]/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/-{3,}/g, ' ').replace(/\s+/g, ' ').trim();
  function hl(text, terms){
    const f = fold(text); if (f.length !== text.length) return esc(text);
    const marks = []; terms.forEach(t => { let i = 0; while ((i = f.indexOf(t, i)) >= 0) { marks.push([i, i + t.length]); i += t.length; } });
    marks.sort((a, b) => a[0] - b[0]); let out = '', p = 0;
    marks.forEach(([a, b]) => { if (a < p) return; out += esc(text.slice(p, a)) + '<mark class="hl">' + esc(text.slice(a, b)) + '</mark>'; p = b; });
    return out + esc(text.slice(p));
  }
  function vSearch(_, q){
    const query = q.get('q') || '';
    setView('Rechercher', `
      <div class="ph"><div><h1>Rechercher dans la formation</h1><p>Un mot, une notion, un outil : « bundle », « point mort », « sextorsion »…</p></div></div>
      <form class="card" id="sForm" role="search" style="display:flex;gap:10px"><input id="sq" type="search" placeholder="Rechercher…" value="${esc(query)}" aria-label="Rechercher dans la formation" autocomplete="off"><button class="btn btn-primary" type="submit">${ico('search')}Chercher</button></form>
      <div class="card pad0" id="sRes"></div>`, {demo:false});
    const run = () => {
      const raw = $('#sq').value.trim(), terms = fold(raw).split(/\s+/).filter(t => t.length > 1), box = $('#sRes');
      if (!terms.length) { box.innerHTML = `<p class="muted" style="padding:16px">Tapez au moins deux lettres.</p>`; return; }
      const res = [];
      ALL.forEach(l => {
        const body = plain(l.content_md), hay = fold(l.title + ' ' + body);
        if (!terms.every(t => hay.includes(t))) return;
        const fb = fold(body), at = fb.indexOf(terms[0]);
        const snip = at >= 0 ? (at > 70 ? '…' : '') + body.slice(Math.max(0, at - 70), at + 150) + '…' : body.slice(0, 200) + '…';
        res.push({l, snip, score: terms.filter(t => fold(l.title).includes(t)).length});
      });
      res.sort((a, b) => b.score - a.score);
      box.innerHTML = res.length ? `<p class="muted small" style="padding:14px 16px 0">${res.length} résultat${res.length > 1 ? 's' : ''}</p>` + res.slice(0, 50).map(r => `<a class="sr" href="${lessonHref(r.l)}"><b>${esc(r.l.number_label)} · ${hl(r.l.title, terms)}</b><span>${hl(r.snip, terms)}</span><span class="small" style="color:var(--faint)">Module ${r.l.mod.number} · ${esc(r.l.mod.title)}</span></a>`).join('') : `<p class="muted" style="padding:16px">Aucun résultat pour « ${esc(raw)} ».</p>`;
    };
    let t; $('#sq').addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 160); });
    $('#sForm').addEventListener('submit', e => { e.preventDefault(); run(); });
    run(); $('#sq').focus();
  }


  /* ── Espace équipe partagé : candidatures, comptes, mon compte, espace chatter ── */
  const loading = t => `<div class="ph"><div><h1>${esc(t)}</h1></div></div><div class="card"><p class="muted">Chargement…</p></div>`;
  const errCard = e => `<div class="card"><p>${esc(e.message)}</p><p style="margin-top:10px"><button class="btn btn-ghost btn-sm" type="button" onclick="location.reload()">Réessayer</button></p></div>`;
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('fr-FR', {dateStyle:'medium', timeStyle:'short'}); };
  const SUBT = {creatrice:['Créatrice', 'violet'], equipe:['Équipe', 'blue'], contact:['Contact', '']};
  let SF = {type:'all', status:'new'};
  async function vSubs(){
    setView('Candidatures', loading('Candidatures'), {demo:false});
    let subs; try { subs = (await api('subs')).subs; } catch(e) { $('#view').innerHTML = errCard(e); return; }
    if (!/^#\/candidatures/.test(location.hash)) return;
    NEWSUBS = subs.filter(x => x.status === 'new').length; renderNav('candidatures');
    const list = subs.filter(x => (SF.type === 'all' || x.type === SF.type) && (SF.status === 'all' || x.status === SF.status));
    const cnt = (k, v) => subs.filter(x => x[k] === v).length;
    const pick = (d, keys) => keys.map(k => d[k]).find(Boolean) || '';
    setView('Candidatures', `
      <div class="ph"><div><h1>Candidatures</h1><p>Tout ce qui arrive des formulaires du site : créatrices, équipe et contact. Répondez sous 48 h, comme promis sur le site.</p></div></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="seg" role="group" aria-label="Type">${[['all', 'Toutes · ' + subs.length], ...Object.entries(SUBT).map(([k, v]) => [k, v[0] + ' · ' + cnt('type', k)])].map(([k, t]) => `<button type="button" data-ft="${k}" aria-pressed="${SF.type === k}">${esc(t)}</button>`).join('')}</div>
        <div class="seg" role="group" aria-label="Statut">${[['new', 'À traiter · ' + cnt('status', 'new')], ['done', 'Traitées · ' + cnt('status', 'done')], ['all', 'Toutes']].map(([k, t]) => `<button type="button" data-fs="${k}" aria-pressed="${SF.status === k}">${esc(t)}</button>`).join('')}</div>
      </div>
      ${list.length ? list.map(x => { const d = x.data || {}, name = pick(d, ['Nom de scène', 'Nom', 'Prénom']) || 'Sans nom', mail = pick(d, ['Email']), inRec = D.recruits.some(r => r.subId === x.id);
        const meta = [mail, pick(d, ['Téléphone']), pick(d, ['Pays']), x.type === 'creatrice' ? pick(d, ['Plateformes']) : x.type === 'equipe' ? pick(d, ['Poste']) : pick(d, ['Sujet'])].filter(Boolean).join(' · ');
        return `<article class="card sub-card"><div class="top-l">${chip(SUBT[x.type] || SUBT.contact)}${x.status === 'new' ? '<span class="chip amber"><i></i>À traiter</span>' : '<span class="chip green"><i></i>Traitée</span>'}${inRec ? '<span class="chip blue"><i></i>Dans le recrutement</span>' : ''}<span class="when">${esc(fmtDate(x.at))}</span></div>
          <h3>${esc(name)}</h3>${meta ? `<p class="meta">${esc(meta)}</p>` : ''}
          <details><summary>Voir toutes les réponses</summary><dl>${Object.entries(d).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>
          <div class="acts">${x.type === 'creatrice' && !inRec ? `<button class="btn btn-primary btn-sm" type="button" data-rec="${esc(x.id)}">Ajouter au recrutement</button>` : ''}${mail ? `<a class="btn btn-ghost btn-sm" href="mailto:${esc(mail)}?subject=${encodeURIComponent('VAYNORA House — votre ' + (x.type === 'contact' ? 'message' : 'candidature'))}">Répondre par email</a>` : ''}<button class="btn btn-ghost btn-sm" type="button" data-st="${esc(x.id)}">${x.status === 'new' ? 'Marquer traitée' : 'Remettre à traiter'}</button><button class="btn btn-danger btn-sm" type="button" data-sd="${esc(x.id)}">Supprimer</button></div></article>`; }).join('')
      : `<div class="card"><div class="empty-chart">${subs.length ? 'Rien dans ce filtre.' : 'Aucune candidature pour le moment. Elles arriveront ici dès qu\'un formulaire du site sera envoyé.'}</div></div>`}`, {demo:false});
    $$('[data-ft]').forEach(b => b.addEventListener('click', () => { SF.type = b.dataset.ft; vSubs(); }));
    $$('[data-fs]').forEach(b => b.addEventListener('click', () => { SF.status = b.dataset.fs; vSubs(); }));
    const find = id => subs.find(x => x.id === id);
    $$('[data-st]').forEach(b => b.addEventListener('click', async () => { const x = find(b.dataset.st); try { await api('subUpdate', {id:x.id, status: x.status === 'new' ? 'done' : 'new'}); vSubs(); } catch(e) { toast(e.message); } }));
    $$('[data-sd]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Supprimer définitivement cette candidature ?')) return; try { await api('subDel', {id:b.dataset.sd}); toast('Supprimée.'); vSubs(); } catch(e) { toast(e.message); } }));
    $$('[data-rec]').forEach(b => b.addEventListener('click', async () => {
      const x = find(b.dataset.rec), d = x.data || {};
      const notes = ['Revenus mensuels', 'Objectifs', 'Temps disponible', 'Visage visible', 'Niveau de contenu', 'Langues', 'Pays', 'Âge déclaré', 'Email', 'Téléphone', 'Messagerie préférée', 'Identifiant messagerie'].filter(k => d[k]).map(k => k + ' : ' + d[k]).join('\n');
      D.recruits.push({id:uid(), subId:x.id, name:pick(d, ['Nom de scène', 'Prénom', 'Nom']) || 'Candidate', source:'Candidature site', handle:String(pick(d, ['Liens', 'Plateformes'])).slice(0, 120), stage:0, moved:today(), created:today(), audience:num(d['Audience totale']), potential:0, next:'Premier contact sous 48 h', notes:notes.slice(0, 1500)});
      save();
      try { if (x.status === 'new') await api('subUpdate', {id:x.id, status:'done'}); } catch(e) {}
      toast('Ajoutée au recrutement (étape « Repérée »).'); vSubs();
    }));
  }
  async function vUsers(){
    setView('Utilisateurs', loading('Utilisateurs'), {demo:false});
    let users; try { users = (await api('users')).users; } catch(e) { $('#view').innerHTML = errCard(e); return; }
    if (!/^#\/utilisateurs/.test(location.hash)) return;
    const chName = id => (chatterById(id) || {}).name || '';
    setView('Utilisateurs', `
      <div class="ph"><div><h1>Utilisateurs</h1><p>Les comptes de votre équipe. Chacun se connecte avec son email et son propre mot de passe.</p></div>
        <div class="acts"><button class="btn btn-primary" type="button" id="addU">${ico('plus')}Ajouter un membre</button></div></div>
      <div class="card pad0"><div class="tw"><table class="t"><thead><tr><th>Membre</th><th>Rôle</th><th>Fiche chatter</th><th>Depuis</th><th></th></tr></thead><tbody>
        ${users.map(u => `<tr><td><div class="who"><span class="av">${esc(initial(u.name))}</span><div>${esc(u.name)}${u.id === ME.id ? ' (vous)' : ''}<small>${esc(u.email)}${u.mustChange ? ' · mot de passe provisoire' : ''}</small></div></div></td><td>${chip([ROLE_LABEL[u.role] || u.role, u.role === 'owner' ? 'violet' : u.role === 'manager' ? 'blue' : ''])}</td><td>${esc(chName(u.chatterId) || '—')}</td><td class="small muted">${u.created ? esc(new Date(u.created).toLocaleDateString('fr-FR')) : ''}</td><td class="r" style="white-space:nowrap"><button class="btn btn-ghost btn-sm" type="button" data-ue="${esc(u.id)}">Modifier</button> <button class="btn btn-ghost btn-sm" type="button" data-ur="${esc(u.id)}">Nouveau mot de passe</button>${u.id !== ME.id ? ` <button class="btn btn-danger btn-sm" type="button" data-ud="${esc(u.id)}">Supprimer</button>` : ''}</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="grid g3">
        <div class="card"><h2>Propriétaire</h2><p class="muted small" style="margin-top:8px">Tout : chiffres, finance, recrutement, candidatures, réglages et comptes de l'équipe.</p></div>
        <div class="card"><h2>Manager</h2><p class="muted small" style="margin-top:8px">Tout le pilotage (modèles, revenus, chatters, finance, recrutement, candidatures), sans la gestion des comptes.</p></div>
        <div class="card"><h2>Chatter</h2><p class="muted small" style="margin-top:8px">La Formation OFM et ses propres chiffres (heures, ventes, qualité, rémunération) une fois relié à sa fiche chatter.</p></div>
      </div>`, {demo:false});
    const find = id => users.find(u => u.id === id);
    $('#addU').addEventListener('click', () => userForm());
    $$('[data-ue]').forEach(b => b.addEventListener('click', () => userForm(find(b.dataset.ue))));
    $$('[data-ur]').forEach(b => b.addEventListener('click', async () => { const u = find(b.dataset.ur); if (!confirm(`Créer un nouveau mot de passe provisoire pour ${u.name} ? L'ancien ne fonctionnera plus.`)) return; try { const r = await api('userReset', {id:u.id}); showTemp(u, r.temp); } catch(e) { toast(e.message); } }));
    $$('[data-ud]').forEach(b => b.addEventListener('click', async () => { const u = find(b.dataset.ud); if (!confirm(`Supprimer le compte de ${u.name} ? Il ne pourra plus se connecter.`)) return; try { await api('userDel', {id:u.id}); toast('Compte supprimé.'); vUsers(); } catch(e) { toast(e.message); } }));
  }
  function userForm(u){
    const v = u || {role:'chatter'};
    modal(u ? 'Modifier ' + u.name : 'Ajouter un membre', `<div class="fg">
      <label class="f">Nom<input name="name" required maxlength="60" value="${esc(v.name || '')}"></label>
      <label class="f">Email de connexion<input name="email" type="email" required maxlength="120" value="${esc(v.email || '')}"></label>
      <label class="f">Rôle<select name="role">${Object.entries(ROLE_LABEL).map(([k, t]) => `<option value="${k}"${k === v.role ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <label class="f">Fiche chatter liée<select name="chatterId"><option value="">Aucune</option>${D.chatters.map(c => `<option value="${esc(c.id)}"${c.id === v.chatterId ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select><small>Pour qu'un chatter voie ses propres chiffres.</small></label></div>
      ${u ? '' : '<p class="note">' + ico('info') + '<span>Un mot de passe provisoire sera créé et affiché une seule fois : transmettez-le au membre, il le changera à sa première connexion.</span></p>'}`,
    {submit: u ? 'Enregistrer' : 'Créer le compte', onSubmit: f => {
      (async () => {
        try { const r = await api('userSave', Object.assign({id: u ? u.id : ''}, f)); mdl.close(); if (r.temp) showTemp(r.user, r.temp); else toast('Compte mis à jour.'); if (u && u.id === ME.id) ME = r.user; vUsers(); }
        catch(e) { toast(e.message); }
      })();
      return false;
    }});
  }
  function showTemp(u, temp){
    modal('Mot de passe provisoire', `<p>Transmettez ces informations à <b>${esc(u.name)}</b> par un canal privé. Le mot de passe ne sera plus affiché ensuite.</p>
      <div class="mini"><div class="row"><span>Adresse</span><b>${esc(location.origin + location.pathname)}</b></div><div class="row"><span>Email</span><b>${esc(u.email)}</b></div></div>
      <div class="temp">${esc(temp)}</div>`, {submit:'Copier et fermer', onSubmit: () => {
        const txt = `Espace équipe VAYNORA : ${location.origin + location.pathname}\nEmail : ${u.email}\nMot de passe provisoire : ${temp}`;
        try { navigator.clipboard.writeText(txt).then(() => toast('Copié.'), () => {}); } catch(e) {}
      }});
  }
  function vAccount(){
    setView('Mon compte', `
      <div class="ph"><div><h1>Mon compte</h1><p>Vos informations et votre mot de passe.</p></div></div>
      ${ME.mustChange ? `<div class="al info">${ico('info')}<div><b><span class="lbl">À faire</span>Choisissez votre mot de passe personnel</b><span>Vous utilisez un mot de passe provisoire : remplacez-le maintenant.</span></div></div>` : ''}
      <div class="grid g2">
        <div class="card"><h2>Profil</h2><div class="mini" style="margin-top:12px"><div class="row"><span>Nom</span><b>${esc(ME.name)}</b></div><div class="row"><span>Email</span><b>${esc(ME.email)}</b></div><div class="row"><span>Rôle</span><b>${esc(ROLE_LABEL[ME.role])}</b></div><div class="row"><span>Agence</span><b>${esc(D.settings.agency || '')}</b></div></div>
          <p style="margin-top:16px"><button class="btn btn-ghost" type="button" id="logout2">Se déconnecter</button></p></div>
        <form class="card" id="pwForm" style="display:grid;gap:14px"><h2>Changer de mot de passe</h2>
          <label class="f">Mot de passe actuel<input name="old" type="password" required autocomplete="current-password"></label>
          <label class="f">Nouveau mot de passe<small>10 caractères minimum</small><input name="password" type="password" required minlength="10" autocomplete="new-password"></label>
          <label class="f">Confirmer<input name="password2" type="password" required minlength="10" autocomplete="new-password"></label>
          <div><button class="btn btn-primary" type="submit">Enregistrer</button></div></form>
      </div>`, {demo:false});
    $('#logout2').addEventListener('click', () => $('#lockBtn').click());
    $('#pwForm').addEventListener('submit', async e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      if (f.password !== f.password2) { toast('Les deux mots de passe ne sont pas identiques.'); return; }
      try { const was = ME.mustChange; const r = await api('password', {old:f.old, password:f.password}); ME = r.user; toast('Mot de passe mis à jour.'); if (was) location.hash = '#/'; else vAccount(); }
      catch(x) { toast(x.message); }
    });
  }
  function vMe(){
    const c = D.chatters[0];
    if (!c) { setView('Mes chiffres', `<div class="ph"><div><h1>Bonjour ${esc(userName())}</h1><p>Votre espace personnel.</p></div></div><div class="card"><p>Votre compte n'est pas encore relié à une fiche chatter. Demandez au responsable de l'agence de le faire dans Utilisateurs.</p></div><div class="grid g2">${formationCard()}</div>`, {demo:false}); return; }
    const prev = addM(M, -1), r = cmonth(c.id, M), p = cmonth(c.id, prev), months = range(M, 12), vs = mName(prev);
    const h = r ? num(r.hours) : 0, sa = r ? num(r.sales) : 0, ph = p ? num(p.hours) : 0, ps = p ? num(p.sales) : 0;
    const sales = months.map(m => { const x = cmonth(c.id, m); return x ? num(x.sales) : null; });
    setView('Mes chiffres', `
      <div class="ph"><div><h1>Bonjour ${esc(userName())}</h1><p>Vos chiffres de ${esc(mLong(M))}, saisis par l'agence. Comparaison avec ${esc(vs)}.</p></div></div>
      <div class="grid g4">
        <div class="kpi"><span class="lb">Heures travaillées</span><span class="v">${esc(int(h))} h</span>${dTile(h, ph || null, vs)}</div>
        <div class="kpi"><span class="lb">Ventes générées</span><span class="v">${esc(money(sa))}</span>${dTile(sa, ps || null, vs)}</div>
        <div class="kpi"><span class="lb">Ventes par heure</span><span class="v">${h ? esc(money(sa / h, true)) : '—'}</span>${dTile(h ? sa / h : null, ph ? ps / ph : null, vs)}</div>
        <div class="kpi"><span class="lb">Rémunération estimée</span><span class="v">${esc(money(payOf(c, r)))}</span><span class="d"><small>Qualité ${r && num(r.qa) ? esc(int(num(r.qa))) + '/100' : '—'}</small></span></div>
      </div>
      <div class="grid g21">
        <div class="card"><div class="card-h"><div><h2>Mes ventes sur 12 mois</h2></div></div><div class="chart" id="cMe"></div>${tableView(months.map(mLong), [{name:'Ventes', values:sales}])}</div>
        <div class="card"><h2>Mes modèles</h2><div class="mini" style="margin-top:12px">${D.models.map(m => `<div class="row"><span>${esc(m.name)}</span><b>${esc(m.platform || '')}</b></div>`).join('') || '<p class="muted small">Aucune modèle affectée.</p>'}</div>
          <p class="note" style="margin-top:14px">${ico('info')}<span>Rémunération = heures × ${esc(money(num(c.rate), true))} + ventes × ${esc(int(num(c.pct)))} % + prime.</span></p></div>
      </div>
      <div class="grid g2">${formationCard()}</div>`, {month:true, demo:false});
    draw($('#cMe'), el => sales.some(v => v) ? lineChart(el, {labels:months.map(mShort), long:months.map(mLong), aria:'Mes ventes sur 12 mois', series:[{name:'Ventes', color:COL[0], values:sales}]}) : (el.innerHTML = emptyChart('Pas encore de chiffres saisis.')));
  }

  /* ── Données & réglages ──────────────────────────────── */
  function csv(rows){ return '﻿' + rows.map(r => r.map(v => { const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n'); }
  function download(name, text, type){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type: type + ';charset=utf-8'})); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function vData(){
    const st = D.settings, sz = (() => { try { return new Blob([JSON.stringify(D)]).size; } catch(e) { return 0; } })();
    setView('Données & réglages', `
      <div class="ph"><div><h1>Données & réglages</h1><p>Réglages de l'agence, sauvegardes et confidentialité.</p></div></div>
      <div class="grid g2">
        <form class="card" id="setForm" style="display:grid;gap:16px"><h2>L'agence</h2><div class="fg">
          <label class="f">Nom de l'agence<input name="agency" maxlength="60" value="${esc(st.agency)}"></label>
          ${MODE === 'server' ? '' : `<label class="f">Votre prénom<input name="user" maxlength="40" value="${esc(st.user)}"></label>`}
          <label class="f">Devise<select name="currency">${[['EUR', 'Euro (€)'], ['USD', 'Dollar US ($)'], ['GBP', 'Livre (£)'], ['CHF', 'Franc suisse (CHF)'], ['CAD', 'Dollar canadien ($)']].map(([k, t]) => `<option value="${k}"${k === st.currency ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
          <label class="f">Commission par défaut (%)<input name="defCommission" inputmode="decimal" value="${esc(st.defCommission)}"></label>
          <label class="f">Objectif mensuel de commission<input name="goal" inputmode="decimal" value="${esc(st.goal || '')}"><small>Affiché sur la vue d'ensemble.</small></label>
          <label class="f">Charges fixes mensuelles<input name="fixed" inputmode="decimal" value="${esc(st.fixed || '')}"><small>Outils, abonnements, locaux… comptés chaque mois actif.</small></label>
        </div><div><button class="btn btn-primary" type="submit">Enregistrer</button></div></form>
        <div class="grid" style="align-content:start">
          <div class="card" style="display:grid;gap:12px"><h2>Sauvegarde</h2><p class="muted small">${MODE === 'server' ? `Les données sont enregistrées <b>sur le serveur de l'agence</b> et partagées avec l'équipe (${esc((sz / 1024).toFixed(1).replace('.', ','))} Ko). Exportez quand même une sauvegarde chaque mois.` : `Les données du tableau de bord sont enregistrées <b>uniquement dans ce navigateur</b> (${esc((sz / 1024).toFixed(1).replace('.', ','))} Ko). Exportez une sauvegarde chaque mois, et importez-la pour retrouver vos chiffres sur un autre appareil.`}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" type="button" id="expJ">${ico('down')}Exporter la sauvegarde (.json)</button><label class="btn btn-ghost" style="cursor:pointer">${ico('up')}Importer une sauvegarde<input type="file" id="impJ" accept="application/json,.json" hidden></label><button class="btn btn-ghost" type="button" id="expC">${ico('down')}Revenus (.csv)</button></div></div>
          <div class="card" style="display:grid;gap:12px"><h2>Données d'exemple</h2><p class="muted small">Pour découvrir le tableau de bord avec une agence fictive de cinq modèles sur douze mois. Elles remplacent les données actuelles et sont signalées par un bandeau.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-soft" type="button" data-act="load-demo">Charger l'exemple</button><button class="btn btn-danger" type="button" id="wipe">Effacer les données du tableau de bord</button></div></div>
          <div class="card" style="display:grid;gap:10px"><h2>Formation</h2><p class="muted small">${ALL.filter(lessonDone).length} leçon(s) marquée(s) comme lue(s).</p><div><button class="btn btn-ghost" type="button" id="wipeL">Réinitialiser ma progression</button></div>
            ${MODE === 'server' && ME.role === 'owner' ? `<form id="fcForm" style="display:grid;gap:10px;margin-top:6px"><label class="f">Code d'accès de la formation<small>À changer seulement si vous rechiffrez la formation avec un nouveau code.</small><input name="fcode" spellcheck="false" autocomplete="off" value="${esc(FCODE)}"></label><div><button class="btn btn-soft btn-sm" type="submit">Enregistrer le code</button></div></form>` : ''}</div>
          ${MODE === 'server' && localData() ? `<div class="card" style="display:grid;gap:10px"><h2>Données de cet appareil</h2><p class="muted small">Ce navigateur contient un tableau de bord enregistré en mode local (${localData().models.length} modèle(s), ${localData().revenue.length} mois saisis). Vous pouvez l'envoyer sur le serveur : il remplacera les données actuelles de l'agence.</p><div><button class="btn btn-soft" type="button" id="pushLocal">Envoyer vers le serveur</button></div></div>` : ''}
          ${MODE === 'local' ? `<div class="card" style="display:grid;gap:10px"><h2>Passer en mode équipe</h2><p class="muted small">Pour partager les chiffres entre plusieurs personnes et appareils, avec un compte par membre : dans Vercel, ouvrez le projet → Storage → créez une base « Upstash for Redis » et connectez-la au projet, puis redéployez. Cette page proposera alors de créer le compte propriétaire.</p></div>` : ''}
          <div class="card" style="display:grid;gap:10px"><h2>Confidentialité</h2><ul class="small muted" style="margin:0;padding-left:18px;display:grid;gap:6px">${MODE === 'server' ? '<li>Les données sont visibles par les comptes de l\'équipe selon leur rôle ; les chatters ne voient que la formation et leurs propres chiffres.</li>' : '<li>Aucune donnée du tableau de bord n\'est envoyée sur internet.</li>'}<li>N'y enregistrez jamais d'identité civile, d'adresse, de pièce d'identité ni de mot de passe.</li><li>Sur un ordinateur partagé, cliquez sur « ${MODE === 'server' ? 'Se déconnecter' : 'Verrouiller'} » en bas du menu.</li><li>Une sauvegarde exportée contient vos chiffres : rangez-la dans un espace sécurisé.</li></ul></div>
        </div>
      </div>`, {demo:false});
    $('#setForm').addEventListener('submit', e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      Object.assign(D.settings, {agency:f.agency.trim() || 'VAYNORA House', user:String(f.user ?? D.settings.user ?? '').trim(), currency:f.currency, defCommission:Math.max(0, Math.min(100, num(f.defCommission))), goal:num(f.goal), fixed:num(f.fixed)});
      save(); toast('Réglages enregistrés.'); route(true);
    });
    $('#expJ').addEventListener('click', () => download(`vaynora-sauvegarde-${today()}.json`, JSON.stringify(Object.assign({format:'vaynora-os', exported:new Date().toISOString()}, D), null, 1), 'application/json'));
    $('#impJ').addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      file.text().then(t => {
        let x; try { x = JSON.parse(t); } catch(err) { toast('Fichier illisible.'); return; }
        if (!x || typeof x !== 'object' || !Array.isArray(x.models)) { toast("Ce fichier n'est pas une sauvegarde VAYNORA."); return; }
        if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
        D = normalize(x); save(); M = latestMonth(); toast('Sauvegarde importée.'); location.hash = '#/';
      });
    });
    $('#expC').addEventListener('click', () => {
      const rows = [['Mois', 'Modèle', ...SRC.map(([, t]) => t), 'CA net', 'Abonnés actifs', 'Nouveaux abonnés', 'Pub / trafic', 'Commission (%)', 'Commission agence']];
      D.revenue.slice().sort((a, b) => a.month.localeCompare(b.month)).forEach(e => { const md = modelById(e.model); if (!md) return; rows.push([e.month, md.name, ...SRC.map(([k]) => num(e[k])), netOf(e), num(e.fans), num(e.newFans), num(e.ads), commOf(md), +(netOf(e) * commOf(md) / 100).toFixed(2)]); });
      download(`revenus-${today()}.csv`, csv(rows), 'text/csv');
    });
    $('#wipe').addEventListener('click', () => { if (!confirm('Effacer définitivement modèles, revenus, chatters, dépenses et prospects de ce navigateur ? Exportez une sauvegarde avant si besoin.')) return; const keep = {lessons:D.lessons, path:D.path, settings:D.settings}; D = Object.assign(blank(), keep); save(); M = latestMonth(); toast('Données effacées.'); route(true); });
    const fc = $('#fcForm'); if (fc) fc.addEventListener('submit', async e => {
      e.preventDefault(); const code = new FormData(fc).get('fcode').trim();
      try { const pk = await unlock(code); await api('fcode', {fcode:code}); FCODE = code; if (!PACK) { PACK = pk; prep(); } toast('Code de la formation enregistré.'); }
      catch(x) { toast(x.message === 'code' ? 'Code incorrect : la formation ne s\'ouvre pas avec ce code.' : x.message); }
    });
    const pl = $('#pushLocal'); if (pl) pl.addEventListener('click', () => {
      if (!confirm("Remplacer les données de l'agence sur le serveur par celles de cet appareil ?")) return;
      const x = localData(); D = normalize(Object.assign({}, x, {lessons:D.lessons, path:D.path})); save(); M = latestMonth(); toast('Données envoyées.'); route(true);
    });
    $('#wipeL').addEventListener('click', () => { if (!confirm('Réinitialiser votre progression de formation ?')) return; D.lessons = {}; save(); route(true); });
  }

  /* ── Données d'exemple (fictives) ────────────────────── */
  function loadDemo(){
    if ((D.models.length || D.revenue.length) && !D.demo && !confirm("Charger l'exemple remplacera vos données actuelles du tableau de bord. Continuer ?")) return;
    let seed = 20261;
    const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const end = curMonth(), months = range(end, 12), last = months[11];
    const x = blank(); x.demo = true; x.lessons = D.lessons; x.path = D.path;
    x.settings = Object.assign({}, D.settings, {goal:9000, fixed:650});
    const spec = [
      ['Luna', 'Lifestyle & fitness', 'Payante', 0, 5200, .045, 'active', 9000, 'Sarah'],
      ['Jade', 'Cosplay & gaming', 'Hybride', 0, 4100, .035, 'active', 0, 'Sarah'],
      ['Mia', 'Girl next door', 'Payante', 3, 1600, .09, 'active', 4000, 'Yanis'],
      ['Nora', 'Alternative', 'Gratuite', 6, 900, .14, 'active', 0, 'Yanis'],
      ['Elsa', 'Mode & lingerie', 'Payante', 9, 450, .3, 'onboarding', 0, 'Sarah']
    ];
    spec.forEach(([name, niche, page, startIdx, base, g, status, goal, manager]) => {
      const id = uid() + name.toLowerCase();
      x.models.push({id, name, platform: name === 'Jade' ? 'Fansly' : 'OnlyFans', status, start:months[startIdx], commission: name === 'Luna' ? 35 : 40, page, niche, manager, goal, notes:'Fiche d\'exemple.', created:today()});
      months.forEach((m, i) => {
        if (i < startIdx) return;
        if (name === 'Elsa' && m === last) return;
        let net = base * Math.pow(1 + g, i - startIdx) * (.95 + rnd() * .1);
        if (name === 'Jade' && m === last) net *= .74;
        const sh = [.32, .45, .09, .09, .05].map(v => v * (.85 + rnd() * .3)), tot = sh.reduce((a, b) => a + b, 0);
        const e = {id:uid(), model:id, month:m};
        SRC.forEach(([k], j) => e[k] = Math.round(net * sh[j] / tot));
        const arpu = page === 'Gratuite' ? 6 + rnd() * 3 : 10 + rnd() * 5;
        e.fans = Math.round(net / arpu); e.newFans = Math.round(e.fans * (.14 + rnd() * .1)); e.ads = Math.round(80 + rnd() * 220 + (i - startIdx < 3 ? 200 : 0));
        x.revenue.push(e);
      });
    });
    const byName = n => x.models.find(m => m.name === n).id;
    const team = [['Inès', 'Chatter senior', 'Français', 5.5, 8, ['Luna', 'Jade']], ['Karim', 'Chatter', 'Français', 4.5, 7, ['Luna', 'Mia']], ['Lou', 'Chatter', 'Bilingue', 4.5, 7, ['Jade', 'Nora']], ['Sam', 'Chatter', 'Anglais', 4, 6, ['Mia', 'Nora', 'Elsa']]];
    team.forEach(([name, role, lang, rate, p, ms]) => {
      const id = uid() + name.toLowerCase(); const mids = ms.map(byName);
      x.chatters.push({id, name, role, status:'active', lang, rate, pct:p, models:mids, notes:''});
      months.forEach((m, i) => {
        let sales = 0;
        mids.forEach(mid => { const e = x.revenue.find(r => r.model === mid && r.month === m); if (!e) return; const share = 1 / team.filter(t => t[5].map(byName).includes(mid)).length; sales += (e.ppv + e.tips + e.customs) * share; });
        if (!sales) return;
        const hours = Math.round(120 + rnd() * 60);
        x.cmonths.push({id:uid(), chatter:id, month:m, hours, sales:Math.round(sales * (name === 'Sam' && m === last ? .55 : 1)), qa: Math.round(name === 'Karim' && m === last ? 66 : 74 + rnd() * 20), bonus: rnd() > .7 ? 100 : 0});
      });
    });
    months.forEach((m, i) => {
      x.expenses.push({id:uid(), month:m, label:'Logiciel CRM & planification', category:'Outils & logiciels', amount:149});
      x.expenses.push({id:uid(), month:m, label:'Expert-comptable', category:'Juridique & comptabilité', amount:180});
      if (i % 2 === 0) x.expenses.push({id:uid(), month:m, label:'Shooting photo', category:'Contenu & shootings', amount:Math.round(300 + rnd() * 250)});
      if (i % 3 === 1) x.expenses.push({id:uid(), month:m, label:'Recrutement chatter', category:'Rémunérations (hors chatters)', amount:250});
    });
    const ago = d => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
    [['Clara', 'Instagram', 0, 3], ['Maëlle', 'TikTok', 0, 1], ['Rose', 'Recommandation', 1, 2], ['Inaya', 'Instagram', 1, 9], ['Zoé', 'Candidature site', 2, 4], ['Léna', 'Reddit', 2, 1], ['Ava', 'Instagram', 3, 11], ['Camille', 'Recommandation', 3, 2], ['Elsa', 'Instagram', 4, 40], ['Nora', 'TikTok', 4, 160], ['Lily', 'Instagram', 1, 30, true], ['Jess', 'X (Twitter)', 2, 20, true], ['Sofia', 'TikTok', 0, 15, true]].forEach(([name, source, stage, d, lost]) => {
      const r = {id:uid(), name, source, handle:'@' + fold(name) + '.exemple', stage, moved:ago(d), created:ago(d + 10), audience:Math.round(8000 + rnd() * 60000), potential:Math.round(800 + rnd() * 3000), next: stage < 4 && !lost ? ['Premier message', 'Relance courte', 'Appel découverte', 'Envoyer la proposition'][stage] : '', notes:''};
      if (stage === 4) { r.signedAt = ago(d); const m = x.models.find(mm => mm.name === name); if (m) r.model = m.id; }
      if (lost) { r.lost = true; r.lostAt = stage; }
      x.recruits.push(r);
    });
    D = x; save(); M = latestMonth(); toast("Données d'exemple chargées."); location.hash = '#/'; route();
  }

  /* ── Accès ───────────────────────────────────────────── */
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function unlock(code){
    const res = await fetch('formation.enc.json', {cache:'no-cache'});
    if (!res.ok) throw new Error('fichier');
    const enc = await res.json();
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code.trim()), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt:b64(enc.salt), iterations:enc.iter, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['decrypt']);
    let plainBuf;
    try { plainBuf = await crypto.subtle.decrypt({name:'AES-GCM', iv:b64(enc.iv)}, key, b64(enc.ct)); }
    catch(e){ throw new Error('code'); }
    const txt = await new Response(new Blob([plainBuf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return JSON.parse(txt);
  }
  function localData(){ const x = ls.get(STORE); return x && Array.isArray(x.models) && x.models.length ? normalize(x) : null; }
  const forms = {login:$('#loginForm'), setup:$('#setupForm'), code:$('#gateForm')};
  function showForm(k){ $('#gateLoading').hidden = true; Object.entries(forms).forEach(([n, f]) => f.hidden = n !== k); const i = $('input', forms[k]); if (i) i.focus(); }
  let started = false;
  function showApp(){
    $('#gate').hidden = true; $('#app').hidden = false;
    if (!started) { started = true; window.addEventListener('hashchange', () => route()); }
    route();
  }
  async function enter(code, remember){
    const btn = $('#gateBtn'); btn.disabled = true; btn.textContent = 'Ouverture…'; $('#gateErr').textContent = '';
    try {
      PACK = await unlock(code); prep();
      if (remember) ls.set(CODEKEY, code);
      showApp();
    } catch(e) {
      $('#gateErr').textContent = e.message === 'code' ? 'Code incorrect. Vérifiez les majuscules et les tirets.' : (e.message === 'fichier' ? "La formation est introuvable sur ce serveur." : "Votre navigateur ne permet pas d'ouvrir l'espace équipe. Mettez-le à jour puis réessayez.");
      ls.del(CODEKEY);
    } finally { btn.disabled = false; btn.textContent = 'Entrer'; }
  }
  async function enterServer(){
    applyServer(await api('data'));
    if (FCODE) { try { PACK = await unlock(FCODE); prep(); } catch(e) { PACK = null; } }
    M = latestMonth(); setSync('ok'); showApp();
    if (ME.mustChange) location.hash = '#/compte';
    setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.addEventListener('beforeunload', e => { if (diff().length) { flush(); e.preventDefault(); e.returnValue = ''; } });
  }
  function busy(form, on){ const b = $('button[type=submit]', form); b.disabled = on; if (on) { b.dataset.t = b.textContent; b.textContent = 'Un instant…'; } else if (b.dataset.t) b.textContent = b.dataset.t; }
  forms.login.addEventListener('submit', async e => {
    e.preventDefault(); const err = $('.err', forms.login); err.textContent = ''; busy(forms.login, true);
    try { await api('login', {email:$('#lEmail').value, password:$('#lPass').value}); await enterServer(); }
    catch(x) { err.textContent = x.message; } finally { busy(forms.login, false); }
  });
  forms.setup.addEventListener('submit', async e => {
    e.preventDefault(); const err = $('.err', forms.setup); err.textContent = '';
    if ($('#sPass').value !== $('#sPass2').value) { err.textContent = 'Les deux mots de passe ne sont pas identiques.'; return; }
    busy(forms.setup, true);
    try {
      const code = $('#sCode').value.trim();
      try { await unlock(code); } catch(x) { throw new Error(x.message === 'code' ? "Code de la formation incorrect. Vérifiez les majuscules et les tirets." : "Impossible d'ouvrir la formation sur ce navigateur."); }
      await api('setup', {name:$('#sName').value, email:$('#sEmail').value, password:$('#sPass').value, fcode:code});
      await enterServer();
      toast('Bienvenue ! Invitez votre équipe depuis Utilisateurs.');
    } catch(x) { err.textContent = x.message; } finally { busy(forms.setup, false); }
  });
  forms.code.addEventListener('submit', e => { e.preventDefault(); enter($('#code').value, $('#remember').checked); });
  (async function start(){
    let st = null;
    try { st = await api('status'); } catch(e) { st = null; }
    if (st && st.db) {
      MODE = 'server';
      if (!st.setup) return showForm('setup');
      if (st.user) { try { return await enterServer(); } catch(e) { if (e.status !== 401) { showForm('login'); $('.err', forms.login).textContent = e.message; return; } } }
      return showForm('login');
    }
    showForm('code');
    const remembered = ls.get(CODEKEY);
    if (remembered) { $('#code').value = remembered; $('#remember').checked = true; enter(remembered, true); }
  })();
})();
