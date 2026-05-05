/* ============================================================
   CAVEMAN — Configurator engine
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* ---------- Palettes & data ---------- */
  const CASES = {
    gold:     { label: 'Or jaune',  price: 60, c1:'#f0dc92', c2:'#c9a55a', c3:'#7d5c28', bezelLight:'#f0dc92', bezelDark:'#7d5c28', crown:'gold' },
    silver:   { label: 'Acier',     price: 0,  c1:'#f5f5f5', c2:'#b8b8b8', c3:'#5a5a5a', bezelLight:'#f5f5f5', bezelDark:'#5a5a5a', crown:'silver' },
    rosegold: { label: 'Or rose',   price: 60, c1:'#f7d4be', c2:'#d49880', c3:'#7c4a36', bezelLight:'#f7d4be', bezelDark:'#7c4a36', crown:'rosegold' },
    black:    { label: 'PVD noir',  price: 40, c1:'#3a3a3d', c2:'#1c1c1f', c3:'#000000', bezelLight:'#3a3a3d', bezelDark:'#000000', crown:'black' },
    twotone:  { label: 'Two-tone',  price: 50, c1:'#f5f5f5', c2:'#b8b8b8', c3:'#5a5a5a', bezelLight:'#f0dc92', bezelDark:'#7d5c28', crown:'gold' }
  };
  const BEZEL = {
    cannelee: { label: 'Cannelée', price: 30 },
    lisse:    { label: 'Lisse',    price: 0  },
    plongee:  { label: 'Plongée',  price: 25 },
    sertie:   { label: 'Sertie',   price: 220 }
  };
  const DIALS = {
    champagne:{ label: 'Champagne',  price: 0,  c1:'#f5e6b8', c2:'#d4b677', c3:'#8c6f33', text:'#3a2a10' },
    argente:  { label: 'Argenté',   price: 0,  c1:'#f8f8f8', c2:'#cfcfcf', c3:'#7a7a7a', text:'#1a1a1a' },
    bleu:     { label: 'Bleu nuit', price: 20, c1:'#3e72c8', c2:'#1a3d80', c3:'#0a1a40', text:'#f5f5f5' },
    vert:     { label: 'Vert palm', price: 25, c1:'#4a9b6e', c2:'#1f5638', c3:'#0a2a18', text:'#f5f5f5' },
    noir:     { label: 'Noir',      price: 0,  c1:'#3a3a3a', c2:'#1a1a1a', c3:'#000',    text:'#f5f5f5' },
    rhodium:  { label: 'Rhodium',   price: 15, c1:'#dadce0', c2:'#90939a', c3:'#3f4148', text:'#1a1a1a' },
    chocolat: { label: 'Chocolat',  price: 30, c1:'#a06d4a', c2:'#5a3a22', c3:'#2a1810', text:'#f5e6b8' },
    nacre:    { label: 'Nacre',     price: 50, c1:'#ffffff', c2:'#e6dee8', c3:'#b8b8c8', text:'#1a1a1a' },
    tahiti:   { label: 'Tahiti',    price: 60, c1:'#6a7a8c', c2:'#2a3a4a', c3:'#0a1620', text:'#f5f5f5' },
    rouge:    { label: 'Rouge',     price: 35, c1:'#c44040', c2:'#7a1818', c3:'#2a0a0a', text:'#f5e6b8' }
  };
  const HANDS = {
    dauphine: { label: 'Dauphine', price: 0  },
    mercedes: { label: 'Mercedes', price: 15 },
    baton:    { label: 'Bâton',    price: 0  },
    glaive:   { label: 'Glaive',   price: 20 }
  };
  const INDICES = {
    batons:   { label: 'Bâtons appliqués', price: 0   },
    romains:  { label: 'Chiffres romains', price: 25  },
    arabes:   { label: 'Chiffres arabes',  price: 10  },
    diamants: { label: 'Index diamants',   price: 120 }
  };
  const STRAPS = {
    jubilee:   { label: 'Jubilé',     price: 40, pat: 'p_jubilee'   },
    oyster:    { label: 'Oyster',     price: 0,  pat: 'p_oyster'    },
    president: { label: 'Président',  price: 60, pat: 'p_president' },
    leather:   { label: 'Cuir',       price: 20, pat: 'p_leather'   },
    rubber:    { label: 'Caoutchouc', price: 0,  pat: 'p_rubber'    }
  };
  const BASE_PRICE = 490;
  const ENGRAVE_PRICE = 30;

  /* ---------- State ---------- */
  const state = {
    case:    'gold',
    bezel:   'cannelee',
    dial:    'champagne',
    hands:   'dauphine',
    indices: 'batons',
    strap:   'jubilee',
    engrave: ''
  };

  /* ---------- SVG generation ---------- */
  function buildBezelCannelee() {
    const g = $('#bezel-cannelee');
    if (!g) return;
    g.innerHTML = '';
    const cx = 200, cy = 235, rOut = 148, rIn = 132;
    const teeth = 60;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const x1 = cx + Math.cos(a) * rOut;
      const y1 = cy + Math.sin(a) * rOut;
      const x2 = cx + Math.cos(a) * rIn;
      const y2 = cy + Math.sin(a) * rIn;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', 'rgba(0,0,0,.45)');
      line.setAttribute('stroke-width', '1.6');
      line.setAttribute('stroke-linecap', 'round');
      g.appendChild(line);
    }
    // outer + inner contour
    const ringO = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ringO.setAttribute('cx', cx); ringO.setAttribute('cy', cy); ringO.setAttribute('r', 148);
    ringO.setAttribute('fill','none'); ringO.setAttribute('stroke','rgba(255,255,255,.18)'); ringO.setAttribute('stroke-width','.8');
    g.appendChild(ringO);
    const ringI = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ringI.setAttribute('cx', cx); ringI.setAttribute('cy', cy); ringI.setAttribute('r', 132);
    ringI.setAttribute('fill','none'); ringI.setAttribute('stroke','rgba(0,0,0,.35)'); ringI.setAttribute('stroke-width','.6');
    g.appendChild(ringI);
  }

  function buildBezelPlongee() {
    const g = $('#bezel-plongee');
    if (!g) return;
    g.innerHTML = '';
    const cx = 200, cy = 235;
    // Triangle at 12
    const tri = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    tri.setAttribute('points', `${cx-6},${cy-138} ${cx+6},${cy-138} ${cx},${cy-128}`);
    tri.setAttribute('fill', '#fff');
    g.appendChild(tri);
    // Numbers every 10 minutes
    const labels = [{a: 0, t:'10'},{a: 60, t:'20'},{a: 120, t:'30'},{a: 180, t:'40'},{a: 240, t:'50'}];
    for (let i = 0; i < 60; i++) {
      const ang = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const r = 140;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      dot.setAttribute('r', i % 5 === 0 ? 1.8 : 1);
      dot.setAttribute('fill', '#fff');
      g.appendChild(dot);
    }
  }

  function buildBezelSertie() {
    const g = $('#bezel-sertie');
    if (!g) return;
    g.innerHTML = '';
    const cx = 200, cy = 235, r = 140;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y);
      c.setAttribute('r', 2.4);
      c.setAttribute('fill', '#fff');
      c.setAttribute('opacity', '.95');
      g.appendChild(c);
      const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      sparkle.setAttribute('cx', x - 0.6); sparkle.setAttribute('cy', y - 0.6);
      sparkle.setAttribute('r', 0.7);
      sparkle.setAttribute('fill', 'rgba(255,255,255,1)');
      g.appendChild(sparkle);
    }
  }

  function indicesPosition(i) {
    const cx = 200, cy = 235, r = 100;
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, ang: (i / 12) * 360 };
  }

  function buildIndicesBatons() {
    const g = $('#idx-batons');
    g.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue; // date window at 3
      const { x, y, ang } = indicesPosition(i);
      const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      grp.setAttribute('transform', `translate(${x} ${y}) rotate(${ang})`);
      const w = (i === 0 || i === 6) ? 5 : 3.2;
      const h = (i === 0 || i === 6) ? 14 : 12;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', -w/2); r.setAttribute('y', -h/2);
      r.setAttribute('width', w); r.setAttribute('height', h);
      r.setAttribute('fill', 'var(--c-indices, #c9a55a)');
      r.setAttribute('rx', '.5');
      grp.appendChild(r);
      // gem highlight
      const high = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      high.setAttribute('x', -w/2); high.setAttribute('y', -h/2);
      high.setAttribute('width', w * .4); high.setAttribute('height', h);
      high.setAttribute('fill', 'rgba(255,255,255,.25)');
      grp.appendChild(high);
      g.appendChild(grp);
    }
  }

  function buildIndicesRomains() {
    const g = $('#idx-romains');
    g.innerHTML = '';
    const map = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue;
      const { x, y } = indicesPosition(i);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', x); t.setAttribute('y', y + 4);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-family', 'Cormorant Garamond, serif');
      t.setAttribute('font-weight', '500');
      t.setAttribute('font-size', i === 0 ? '14' : '12');
      t.setAttribute('fill', 'var(--c-indices, #c9a55a)');
      t.textContent = map[i];
      g.appendChild(t);
    }
  }

  function buildIndicesArabes() {
    const g = $('#idx-arabes');
    g.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue;
      const { x, y } = indicesPosition(i);
      const num = i === 0 ? 12 : i;
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', x); t.setAttribute('y', y + 4);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-family', 'Cormorant Garamond, serif');
      t.setAttribute('font-weight', '500');
      t.setAttribute('font-size', '14');
      t.setAttribute('fill', 'var(--c-indices, #c9a55a)');
      t.textContent = num;
      g.appendChild(t);
    }
  }

  function buildIndicesDiamants() {
    const g = $('#idx-diamants');
    g.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue;
      const { x, y, ang } = indicesPosition(i);
      const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      grp.setAttribute('transform', `translate(${x} ${y}) rotate(${ang})`);
      const d = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const s = (i === 0 || i === 6) ? 5 : 4;
      d.setAttribute('points', `0,${-s} ${s*0.7},0 0,${s} ${-s*0.7},0`);
      d.setAttribute('fill', '#ffffff');
      d.setAttribute('stroke', 'rgba(255,255,255,.6)');
      d.setAttribute('stroke-width', '.4');
      grp.appendChild(d);
      const high = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      high.setAttribute('points', `${-s*0.3},${-s*0.5} ${s*0.2},0 ${-s*0.3},${s*0.5}`);
      high.setAttribute('fill', 'rgba(255,255,255,1)');
      grp.appendChild(high);
      g.appendChild(grp);
    }
  }

  function buildHandsShape(kind) {
    const hour = $('#hand-hour');
    const min  = $('#hand-min');
    hour.innerHTML = '';
    min.innerHTML = '';
    const cx = 200, cy = 235;
    const ns = 'http://www.w3.org/2000/svg';

    function poly(parent, points, fill=null) {
      const p = document.createElementNS(ns, 'polygon');
      p.setAttribute('points', points);
      if (fill) p.setAttribute('style', 'fill:' + fill);
      parent.appendChild(p);
    }
    function line(parent, x1,y1,x2,y2, w) {
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y1);
      l.setAttribute('x2', x2); l.setAttribute('y2', y2);
      l.setAttribute('stroke', 'var(--c-hands, #c9a55a)');
      l.setAttribute('stroke-width', w);
      l.setAttribute('stroke-linecap', 'round');
      parent.appendChild(l);
    }
    function circle(parent, cx, cy, r, fill='none', strokeW=2) {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      c.setAttribute('fill', fill);
      if (fill === 'none') {
        c.setAttribute('stroke', 'var(--c-hands, #c9a55a)');
        c.setAttribute('stroke-width', strokeW);
      }
      parent.appendChild(c);
    }

    if (kind === 'dauphine') {
      // Hour: tapered diamond shape
      poly(hour, `${cx},${cy-78} ${cx+5},${cy-30} ${cx},${cy-25} ${cx-5},${cy-30}`);
      poly(hour, `${cx},${cy-78} ${cx+1.5},${cy-30} ${cx-1.5},${cy-30}`, 'rgba(255,255,255,.35)');
      // Minute
      poly(min, `${cx},${cy-110} ${cx+4},${cy-30} ${cx},${cy-25} ${cx-4},${cy-30}`);
      poly(min, `${cx},${cy-110} ${cx+1},${cy-30} ${cx-1},${cy-30}`, 'rgba(255,255,255,.35)');
    } else if (kind === 'mercedes') {
      line(hour, cx, cy-25, cx, cy-72, 4.5);
      circle(hour, cx, cy-58, 7, 'none', 2);
      line(hour, cx, cy-65, cx-5, cy-55, 1.5);
      line(hour, cx, cy-65, cx+5, cy-55, 1.5);
      line(min, cx, cy-25, cx, cy-108, 3.5);
      poly(min, `${cx},${cy-114} ${cx+3},${cy-104} ${cx-3},${cy-104}`);
    } else if (kind === 'baton') {
      const h1 = document.createElementNS(ns, 'rect');
      h1.setAttribute('x', cx-2.5); h1.setAttribute('y', cy-78);
      h1.setAttribute('width', 5); h1.setAttribute('height', 55);
      h1.setAttribute('fill', 'var(--c-hands, #c9a55a)');
      h1.setAttribute('rx', '1');
      hour.appendChild(h1);
      const m1 = document.createElementNS(ns, 'rect');
      m1.setAttribute('x', cx-2); m1.setAttribute('y', cy-110);
      m1.setAttribute('width', 4); m1.setAttribute('height', 88);
      m1.setAttribute('fill', 'var(--c-hands, #c9a55a)');
      m1.setAttribute('rx', '1');
      min.appendChild(m1);
    } else if (kind === 'glaive') {
      poly(hour, `${cx},${cy-80} ${cx+4},${cy-50} ${cx+2.5},${cy-25} ${cx-2.5},${cy-25} ${cx-4},${cy-50}`);
      poly(min, `${cx},${cy-112} ${cx+3.5},${cy-60} ${cx+2},${cy-25} ${cx-2},${cy-25} ${cx-3.5},${cy-60}`);
    }
  }

  /* ---------- Apply state to SVG ---------- */
  function applyCase() {
    const c = CASES[state.case];
    const r = document.documentElement.style;
    r.setProperty('--c-case-1', c.c1);
    r.setProperty('--c-case-2', c.c2);
    r.setProperty('--c-case-3', c.c3);
    // Two-tone: case body silver, bezel gold (overridden by applyBezel below if needed)
    if (state.case === 'twotone') {
      r.setProperty('--c-bezel-1', '#f0dc92');
      r.setProperty('--c-bezel-2', '#c9a55a');
      r.setProperty('--c-bezel-3', '#7d5c28');
    } else {
      r.setProperty('--c-bezel-1', c.bezelLight);
      r.setProperty('--c-bezel-2', c.c2);
      r.setProperty('--c-bezel-3', c.bezelDark);
    }
  }

  function applyBezel() {
    ['cannelee','lisse','plongee','sertie'].forEach(k => {
      const g = document.getElementById('bezel-' + k);
      if (g) g.setAttribute('opacity', state.bezel === k ? '1' : '0');
    });
  }

  function applyDial() {
    const d = DIALS[state.dial];
    const r = document.documentElement.style;
    r.setProperty('--c-dial-1', d.c1);
    r.setProperty('--c-dial-2', d.c2);
    r.setProperty('--c-dial-3', d.c3);
    r.setProperty('--c-indices', d.text);
    r.setProperty('--c-hands',   d.text);
  }

  function applyHands() {
    buildHandsShape(state.hands);
  }

  function applyIndices() {
    ['batons','romains','arabes','diamants'].forEach(k => {
      const g = document.getElementById('idx-' + k);
      if (g) g.setAttribute('opacity', state.indices === k ? '1' : '0');
    });
  }

  function applyStrap() {
    const s = STRAPS[state.strap];
    const r = document.documentElement.style;
    if (state.strap === 'leather') {
      r.setProperty('--c-strap-1', '#2a1810');
      r.setProperty('--c-strap-2', '#3a2418');
      r.setProperty('--c-strap-3', '#4a3220');
    } else if (state.strap === 'rubber') {
      r.setProperty('--c-strap-1', '#1a1a1a');
      r.setProperty('--c-strap-2', '#2a2a2a');
      r.setProperty('--c-strap-3', '#0a0a0a');
    } else {
      // metal strap matches case
      const c = CASES[state.case];
      r.setProperty('--c-strap-1', c.c2);
      r.setProperty('--c-strap-2', c.c3);
      r.setProperty('--c-strap-3', c.c1);
    }
    const url = `url(#${s.pat})`;
    $('#strapTopFill').setAttribute('fill', url);
    $('#strapBotFill').setAttribute('fill', url);
  }

  /* ---------- Price + labels ---------- */
  function totalPrice() {
    let p = BASE_PRICE
      + CASES[state.case].price
      + BEZEL[state.bezel].price
      + DIALS[state.dial].price
      + HANDS[state.hands].price
      + INDICES[state.indices].price
      + STRAPS[state.strap].price;
    if (state.engrave.trim().length > 0) p += ENGRAVE_PRICE;
    return p;
  }

  function fmtPrice(n) {
    return n.toLocaleString('fr-FR') + ' €';
  }

  function updateUI() {
    $('[data-selected="case"]').textContent     = CASES[state.case].label;
    $('[data-selected="bezel"]').textContent    = BEZEL[state.bezel].label;
    $('[data-selected="dial"]').textContent     = DIALS[state.dial].label;
    $('[data-selected="hands"]').textContent    = HANDS[state.hands].label;
    $('[data-selected="indices"]').textContent  = INDICES[state.indices].label;
    $('[data-selected="strap"]').textContent    = STRAPS[state.strap].label;
    $('[data-selected="engrave"]').textContent  = state.engrave.trim() ? `« ${state.engrave.trim()} »` : 'Aucune';
    $('#totalPrice').textContent = fmtPrice(totalPrice());
  }

  /* ---------- Wiring ---------- */
  function bindRadios() {
    $$('.opt input[type="radio"]').forEach(input => {
      input.addEventListener('change', () => {
        const name = input.name;
        const val  = input.value;
        if (state[name] === undefined) return;
        state[name] = val;
        switch (name) {
          case 'case':    applyCase(); applyStrap(); break;
          case 'bezel':   applyBezel(); break;
          case 'dial':    applyDial(); break;
          case 'hands':   applyHands(); break;
          case 'indices': applyIndices(); break;
          case 'strap':   applyStrap(); break;
        }
        updateUI();
        markActiveStep(input.closest('.step'));
      });
    });

    const eng = $('#engrave-input');
    const cnt = $('#engraveCount');
    eng.addEventListener('input', () => {
      state.engrave = eng.value;
      cnt.textContent = eng.value.length;
      updateUI();
      markActiveStep(eng.closest('.step'));
    });
  }

  function markActiveStep(stepEl) {
    if (!stepEl) return;
    $$('.step').forEach(s => s.classList.remove('active'));
    stepEl.classList.add('active');
  }

  function bindReset() {
    $('#btnReset').addEventListener('click', () => {
      Object.assign(state, { case:'gold', bezel:'cannelee', dial:'champagne', hands:'dauphine', indices:'batons', strap:'jubilee', engrave:'' });
      $$('.opt input[type="radio"]').forEach(i => { i.checked = i.value === state[i.name]; });
      $('#engrave-input').value = '';
      $('#engraveCount').textContent = '0';
      applyCase(); applyBezel(); applyDial(); applyHands(); applyIndices(); applyStrap();
      updateUI();
    });
  }

  function bindOrder() {
    $('#btnOrder').addEventListener('click', () => {
      const summary = `Datejust Mod\n` +
        `· Boîtier : ${CASES[state.case].label}\n` +
        `· Lunette : ${BEZEL[state.bezel].label}\n` +
        `· Cadran : ${DIALS[state.dial].label}\n` +
        `· Aiguilles : ${HANDS[state.hands].label}\n` +
        `· Index : ${INDICES[state.indices].label}\n` +
        `· Bracelet : ${STRAPS[state.strap].label}\n` +
        (state.engrave.trim() ? `· Gravure : « ${state.engrave.trim()} »\n` : '') +
        `\nTotal : ${fmtPrice(totalPrice())}`;
      alert(summary);
    });
  }

  function bindShare() {
    $('#btnShare').addEventListener('click', async () => {
      const params = new URLSearchParams(state);
      const url = `${location.origin}${location.pathname}?${params}`;
      try { await navigator.clipboard.writeText(url); $('#btnShare').setAttribute('title','Lien copié'); }
      catch { /* noop */ }
    });
  }

  function loadFromQuery() {
    const p = new URLSearchParams(location.search);
    ['case','bezel','dial','hands','indices','strap','engrave'].forEach(k => {
      const v = p.get(k);
      if (v != null) state[k] = v;
    });
    // Sync radios
    $$('.opt input[type="radio"]').forEach(i => { i.checked = i.value === state[i.name]; });
    $('#engrave-input').value = state.engrave;
    $('#engraveCount').textContent = state.engrave.length;
  }

  /* ---------- Animate seconds hand ---------- */
  function animateSeconds() {
    const sec = $('#hand-sec');
    if (!sec) return;
    let angle = parseFloat((sec.getAttribute('transform').match(/rotate\(([-\d.]+)/) || [,0])[1]) || 0;
    setInterval(() => {
      angle = (angle + 6) % 360;
      sec.setAttribute('transform', `rotate(${angle} 200 235)`);
    }, 1000);
  }

  /* ---------- Init ---------- */
  function init() {
    buildBezelCannelee();
    buildBezelPlongee();
    buildBezelSertie();
    buildIndicesBatons();
    buildIndicesRomains();
    buildIndicesArabes();
    buildIndicesDiamants();

    loadFromQuery();

    applyCase();
    applyBezel();
    applyDial();
    applyHands();
    applyIndices();
    applyStrap();
    updateUI();

    bindRadios();
    bindReset();
    bindOrder();
    bindShare();
    animateSeconds();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
