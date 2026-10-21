// MIGMODS — montre 3D (Three.js r160), modélisée en code : aucun fichier 3D à charger.
// Usage : import { mountWatch } from './migmods-3d.js'; const w = await mountWatch(canvas, { dial: '#1d3b7a' });
// w.setExplode(0..1) pour la vue éclatée, w.setLume(true) pour voir la lume, w.dispose().
import * as THREE from './three.module.min.js';

const TAU = Math.PI * 2;
const DEFAULTS = {
  mode: 'hero',            // 'hero' | 'anatomy'
  metal: 'steel',          // 'steel' | 'gold'
  dial: '#1d3b7a',         // couleur du cadran soleillé
  insert: '#141414',       // couleur de l'insert céramique
  brand: 'MIGMODS',
  pixelRatio: 2
};

// ------------------------------------------------------------------ environnement studio (reflets du métal)
function studio(renderer) {
  const s = new THREE.Scene();
  const box = new THREE.BoxGeometry();
  const room = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0x222222 }));
  room.scale.set(40, 30, 40);
  s.add(room);
  const panel = (x, y, z, sx, sy, sz, k) => {
    const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial());
    m.material.color.setScalar(k);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); s.add(m);
  };
  panel(0, 13, 6, 14, 0.2, 5, 18);      // softbox haut
  panel(-19, 4, 4, 0.2, 8, 10, 9);      // latérale gauche
  panel(19, 2, -2, 0.2, 6, 14, 5);      // latérale droite
  panel(0, 2, 19, 12, 5, 0.2, 6);       // face
  panel(0, -10, 0, 30, 0.2, 30, 0.6);   // sol
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.035).texture;
  pm.dispose();
  return tex;
}

// ------------------------------------------------------------------ géométries utilitaires
function roundRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function rbox(w, h, d, r = 0.3) {
  const b = Math.min(r, d / 3);
  const g = new THREE.ExtrudeGeometry(roundRect(w - 2 * b, h - 2 * b, r), { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 });
  g.center();
  return g;
}
function lathe(points, seg = 160) {
  const g = new THREE.LatheGeometry(points.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2);
  return g;
}
function canvasTex(size, draw, renderer) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); return k > 0 ? c.lerp(new THREE.Color(1, 1, 1), k) : c.lerp(new THREE.Color(0, 0, 0), -k); };

// ------------------------------------------------------------------ textures
function dialTexture(o, renderer) {
  return canvasTex(1024, (ctx, S) => {
    const c = S / 2, base = new THREE.Color(o.dial);
    // soleillé : dégradé conique + rayons fins
    if (ctx.createConicGradient) {
      const g = ctx.createConicGradient(-Math.PI / 4, c, c);
      for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, '#' + shade(o.dial, i % 2 ? 0.22 : -0.3).getHexString());
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#' + base.getHexString();
    ctx.fillRect(0, 0, S, S);
    ctx.save(); ctx.translate(c, c);
    for (let i = 0; i < 720; i++) {
      ctx.rotate(TAU / 720);
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -c); ctx.stroke();
    }
    const v = ctx.createRadialGradient(0, 0, c * 0.2, 0, 0, c);
    v.addColorStop(0, 'rgba(255,255,255,.06)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = v; ctx.beginPath(); ctx.arc(0, 0, c, 0, TAU); ctx.fill();
    // minuterie
    ctx.fillStyle = 'rgba(240,240,235,.85)';
    for (let i = 0; i < 60; i++) {
      ctx.save(); ctx.rotate(i / 60 * TAU);
      if (i % 5) ctx.fillRect(-2, -c * 0.965, 4, c * 0.045);
      ctx.restore();
    }
    // inscriptions
    ctx.fillStyle = 'rgba(244,244,238,.92)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 40px Inter, Arial, sans-serif';
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '14px';
    ctx.fillText(o.brand, 7, -c * 0.42);
    ctx.font = 'italic 30px "Cormorant Garamond", Georgia, serif';
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '2px';
    ctx.fillText('Automatic', 0, -c * 0.32);
    ctx.font = '500 22px Inter, Arial, sans-serif';
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '6px';
    ctx.fillStyle = 'rgba(244,244,238,.7)';
    ctx.fillText('200 m · SAPHIR', 4, c * 0.36);
    ctx.restore();
  }, renderer);
}

function insertTexture(o, renderer, inner, outer) {
  return canvasTex(1024, (ctx, S) => {
    const c = S / 2, rO = c, rI = c * inner / outer, rm = (rO + rI) / 2;
    ctx.fillStyle = o.insert; ctx.fillRect(0, 0, S, S);
    const sheen = ctx.createLinearGradient(0, 0, S, S);
    sheen.addColorStop(0, 'rgba(255,255,255,.10)'); sheen.addColorStop(.5, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(0,0,0,.25)');
    ctx.fillStyle = sheen; ctx.fillRect(0, 0, S, S);
    ctx.translate(c, c);
    const ink = '#e9dcc0';
    ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let m = 0; m < 60; m++) {
      ctx.save(); ctx.rotate(m / 60 * TAU);
      if (m === 0) { ctx.beginPath(); ctx.moveTo(-26, -rO + 22); ctx.lineTo(26, -rO + 22); ctx.lineTo(0, -rI - 20); ctx.closePath(); ctx.fill(); }
      else if (m % 10 === 0) {
        ctx.font = '600 64px Inter, Arial, sans-serif';
        ctx.translate(0, -rm); ctx.fillText(String(m), 0, 2);
      } else if (m < 15) ctx.fillRect(-3, -rO + 30, 6, (rO - rI) * 0.42);
      else if (m % 5 === 0) ctx.fillRect(-9, -rO + 30, 18, (rO - rI) * 0.5);
      ctx.restore();
    }
  }, renderer);
}

function dateTexture(renderer) {
  return canvasTex(128, (ctx, S) => {
    ctx.fillStyle = '#f7f6f2'; ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#111'; ctx.font = '600 78px Inter, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(new Date().getDate()), S / 2, S / 2 + 4);
  }, renderer);
}

// ------------------------------------------------------------------ montre
function buildWatch(o, renderer) {
  const gold = o.metal === 'gold';
  const metalColor = gold ? 0xe2bf79 : 0xdadde2;
  const polished = new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 1, roughness: 0.14, clearcoat: 0.4 });
  const handsMat = new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 0.85, roughness: 0.22, clearcoat: 0.6 });
  const brushed = new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 1, roughness: 0.32, anisotropy: 0.6, side: THREE.DoubleSide });
  const lume = new THREE.MeshStandardMaterial({ color: 0xeef3ea, roughness: 0.6, emissive: new THREE.Color('#7fd3ff'), emissiveIntensity: 0 });
  const parts = {};
  const root = new THREE.Group();
  const add = (name) => { const g = new THREE.Group(); root.add(g); parts[name] = g; return g; };

  // boîtier
  const caseG = add('case');
  caseG.add(new THREE.Mesh(lathe([[0, -5.6], [12.5, -5.6], [15.6, -5.3], [18, -4.5], [19.7, -3.1], [20.3, -1.4], [20.3, 0.1], [19.6, 0.6], [17.2, 0.6], [16.4, -0.6], [16.4, -3.4], [0, -3.4]]), brushed));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const lug = new THREE.Mesh(rbox(5.4, 13, 4.4, 0.9), brushed);
    lug.position.set(sx * 12.7, sy * 18.9, -1.8);
    lug.rotation.x = sy * -0.12;
    caseG.add(lug);
    const bevel = new THREE.Mesh(rbox(1.1, 12.6, 4.3, 0.45), polished);
    bevel.position.set(sx * 15.25, sy * 18.9, -1.75); bevel.rotation.x = sy * -0.12;
    caseG.add(bevel);
  }
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 3.6, 48), polished);
  crown.rotation.z = Math.PI / 2; crown.position.set(22.4, 0, -1.7);
  caseG.add(crown);
  const knurl = new THREE.InstancedMesh(new THREE.BoxGeometry(3.4, 0.35, 0.35), brushed, 40);
  const tmp = new THREE.Object3D();
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * TAU;
    tmp.position.set(22.4, Math.cos(a) * 3.02, -1.7 + Math.sin(a) * 3.02); tmp.rotation.set(a, 0, 0); tmp.updateMatrix();
    knurl.setMatrixAt(i, tmp.matrix);
  }
  caseG.add(knurl);
  for (const sy of [-1, 1]) {
    const guard = new THREE.Mesh(rbox(3.2, 2.4, 3.8, 0.8), brushed);
    guard.position.set(20.9, sy * 4.6, -1.7); caseG.add(guard);
  }

  // mouvement (visible en vue éclatée)
  const mvt = add('movement');
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(14.8, 14.8, 1.8, 96), new THREE.MeshStandardMaterial({ color: 0x9da3ab, metalness: 1, roughness: 0.42 }));
  plate.rotation.x = Math.PI / 2; mvt.add(plate);
  const rotor = new THREE.Mesh(new THREE.CircleGeometry(14, 64, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xc8a35c, metalness: 1, roughness: 0.28, side: THREE.DoubleSide }));
  rotor.position.z = 1.0; rotor.rotation.z = 0.6; mvt.add(rotor);
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4b06a, metalness: 1, roughness: 0.3 });
  for (const [x, y, r] of [[4, 6, 2.6], [7, -3, 2.0], [-3, 8, 1.6]]) { const gear = new THREE.Mesh(new THREE.TorusGeometry(r, 0.45, 8, 40), brass); gear.position.set(x, y, 1.1); mvt.add(gear); }
  const balance = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 12, 48), polished);
  balance.position.set(-6, -5, 1.4); mvt.add(balance);
  const ruby = new THREE.MeshPhysicalMaterial({ color: 0xb0122a, roughness: 0.05, clearcoat: 1 });
  for (const [x, y] of [[-6, -5], [4, 6], [7, -3], [-3, 8], [0, 0]]) { const j = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), ruby); j.position.set(x, y, 1.0); mvt.add(j); }
  mvt.position.z = -2.4;
  parts.rotor = rotor; parts.balance = balance;

  // cadran
  const dialG = add('dial');
  const dial = new THREE.Mesh(new THREE.CircleGeometry(14.7, 160), new THREE.MeshPhysicalMaterial({ map: dialTexture(o, renderer), metalness: 0.35, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.15 }));
  dial.position.z = 0.25; dialG.add(dial);
  for (let h = 0; h < 12; h++) {
    if (h === 3) continue;
    const a = h / 12 * TAU, long = h % 3 === 0, rr = 11.0;
    const idx = new THREE.Group();
    const w = h === 0 ? 1.1 : 1.35, len = long ? 3.6 : 2.8;
    const frame = new THREE.Mesh(rbox(w + 0.5, len + 0.5, 0.55, 0.25), polished);
    const fill = new THREE.Mesh(rbox(w, len, 0.6, 0.2), lume);
    fill.position.z = 0.05;
    if (h === 0) { const f2 = frame.clone(), l2 = fill.clone(); f2.position.x = l2.position.x = 0.95; frame.position.x = fill.position.x = -0.95; idx.add(f2, l2); }
    idx.add(frame, fill);
    idx.position.set(Math.sin(a) * rr, Math.cos(a) * rr, 0.55);
    idx.rotation.z = -a;
    dialG.add(idx);
  }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.1), new THREE.MeshStandardMaterial({ map: dateTexture(renderer), roughness: 0.6 }));
  win.position.set(10.6, 0, 0.3); dialG.add(win);
  const winFrame = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.22, 8, 4, TAU), polished);
  winFrame.position.set(10.6, 0, 0.45); winFrame.rotation.z = Math.PI / 4; winFrame.scale.set(1.05, 0.85, 1); dialG.add(winFrame);
  const rehaut = new THREE.Mesh(lathe([[14.6, 0.25], [16.4, 2.6]], 160), new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 1, roughness: 0.4 }));
  dialG.add(rehaut);

  // aiguilles (pointent vers +Y, pivot à l'origine)
  const handsG = add('hands');
  const sword = (len, w, tail) => { const s = new THREE.Shape(); s.moveTo(-w * 0.35, -tail); s.lineTo(-w / 2, len * 0.15); s.lineTo(-w * 0.42, len * 0.86); s.lineTo(0, len); s.lineTo(w * 0.42, len * 0.86); s.lineTo(w / 2, len * 0.15); s.lineTo(w * 0.35, -tail); s.closePath(); return s; };
  const handMesh = (len, w, z) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sword(len, w, 1.2), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 2 }), handsMat));
    const l = new THREE.Mesh(new THREE.ExtrudeGeometry(sword(len * 0.78, w * 0.55, -len * 0.18), { depth: 0.1, bevelEnabled: false }), lume);
    l.position.z = 0.25; g.add(l);
    g.position.z = z; handsG.add(g);
    return g;
  };
  parts.hour = handMesh(8.6, 1.9, 0.9);
  parts.minute = handMesh(12.6, 1.35, 1.3);
  const sec = new THREE.Group();
  const secMat = new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 1, roughness: 0.15 });
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 17.2, 0.14), secMat); needle.position.y = 4.8; sec.add(needle);
  const lolly = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.22, 10, 32), secMat); lolly.position.y = 9.6; sec.add(lolly);
  const lollyFill = new THREE.Mesh(new THREE.CircleGeometry(0.66, 24), lume); lollyFill.position.set(0, 9.6, 0.02); sec.add(lollyFill);
  sec.position.z = 1.75; handsG.add(sec); parts.second = sec;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 32), polished);
  cap.rotation.x = Math.PI / 2; cap.position.z = 1.95; handsG.add(cap);

  // lunette + insert céramique
  const bezelG = add('bezel');
  bezelG.add(new THREE.Mesh(lathe([[16.2, 0.6], [16.2, 2.3], [16.7, 2.95], [19.6, 2.95], [20.5, 2.5], [20.75, 1.5], [20.4, 0.6]]), polished));
  const teeth = new THREE.InstancedMesh(rbox(0.7, 1.0, 1.7, 0.2), brushed, 120);
  for (let i = 0; i < 120; i++) {
    const a = i / 120 * TAU;
    tmp.position.set(Math.cos(a) * 20.72, Math.sin(a) * 20.72, 1.55); tmp.rotation.set(0, 0, a); tmp.updateMatrix();
    teeth.setMatrixAt(i, tmp.matrix);
  }
  bezelG.add(teeth);
  const insert = new THREE.Mesh(new THREE.RingGeometry(16.7, 19.55, 160, 1), new THREE.MeshPhysicalMaterial({ map: insertTexture(o, renderer, 16.7, 19.55), metalness: 0.1, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }));
  insert.position.z = 2.97; bezelG.add(insert);

  // verre saphir (légèrement bombé)
  const glassG = add('crystal');
  const glass = new THREE.Mesh(new THREE.SphereGeometry(90, 96, 8, 0, TAU, 0, Math.asin(16.4 / 90)), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.12, envMapIntensity: 2.2, clearcoat: 1, depthWrite: false }));
  glass.rotation.x = Math.PI / 2; glass.position.z = 3.25 - 90;
  glassG.add(glass);

  // bracelet Oyster : maillons qui s'enroulent derrière le poignet
  const strap = add('strap');
  const R = 30, step = 3.35, N = 13;
  const geo = rbox(1, 3.0, 2.6, 0.45);
  const center = new THREE.InstancedMesh(geo, polished, N * 2), sides = new THREE.InstancedMesh(geo, brushed, N * 4);
  let ci = 0, si = 0;
  for (const sy of [1, -1]) for (let i = 0; i < N; i++) {
    const s = 1.7 + i * step, a = s / R;
    const y = sy * (25.4 + R * Math.sin(a)), z = -2.3 - R * (1 - Math.cos(a));
    const W = Math.max(16, 20 - i * 0.32), cw = 6;
    tmp.rotation.set(-sy * a, 0, 0); tmp.position.set(0, y, z + 0.15); tmp.scale.set(cw, 1, 1.05); tmp.updateMatrix(); center.setMatrixAt(ci++, tmp.matrix);
    for (const sx of [-1, 1]) {
      const sw = (W - cw) / 2 - 0.15;
      tmp.position.set(sx * (cw / 2 + 0.15 + sw / 2), y, z); tmp.scale.set(sw, 1, 1); tmp.updateMatrix(); sides.setMatrixAt(si++, tmp.matrix);
    }
  }
  strap.add(center, sides);

  parts.lume = lume;
  return { root, parts };
}

// ------------------------------------------------------------------ montage
export async function mountWatch(canvas, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.pixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = studio(renderer);
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2); key.position.set(-30, 45, 60); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 1.2); rim.position.set(40, -10, -30); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(26, 1, 1, 1000);
  const { root, parts } = buildWatch(o, renderer);
  const pivot = new THREE.Group(); pivot.add(root); scene.add(pivot);

  // explosion : décalage de chaque couche vers l'avant
  const layers = { case: 0, movement: 12, dial: 26, hands: 38, bezel: 52, crystal: 68, strap: -10 };
  const base = {}; for (const k in layers) base[k] = parts[k].position.z;

  const state = { explode: 0, explodeT: 0, rx: 0, ry: 0, trx: 0, try: 0, lume: false, running: true, visible: true, t0: performance.now() };
  let w = 0, h = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    w = r.width; h = r.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const span = o.mode === 'anatomy' ? 40 : 42;                   // demi-hauteur visible en unités (mm)
    const fit = span / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, camera.aspect < 1 ? fit / camera.aspect * 0.9 : fit);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    state.try = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
    state.trx = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
  };
  const host = canvas.closest('[data-watch-host]') || canvas;
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', () => { state.trx = state.try = 0; });

  const io = new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; if (state.visible) loop(); }, { rootMargin: '100px' });
  io.observe(canvas);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setTime(now) {
    const d = new Date(), ms = d.getMilliseconds();
    // mouvement automatique : 6 battements par seconde (21 600 alt/h)
    const s = d.getSeconds() + Math.floor(ms / (1000 / 6)) / 6;
    const m = d.getMinutes() + s / 60, hr = (d.getHours() % 12) + m / 60;
    parts.second.rotation.z = -s / 60 * TAU;
    parts.minute.rotation.z = -m / 60 * TAU;
    parts.hour.rotation.z = -hr / 12 * TAU;
    parts.rotor.rotation.z = 0.6 + Math.sin(now / 2400) * 1.4;
    parts.balance.rotation.z = Math.sin(now / 80) * 2.2;
  }

  function frame(now) {
    const t = (now - state.t0) / 1000;
    state.explode += (state.explodeT - state.explode) * 0.08;
    const e = state.explode;
    for (const k in layers) parts[k].position.z = base[k] + layers[k] * e;
    const idle = reduced ? 0 : 1;
    state.rx += (state.trx - state.rx) * 0.06;
    state.ry += (state.try - state.ry) * 0.06;
    if (o.mode === 'anatomy') {
      pivot.rotation.set(-0.1 - 0.95 * e + state.rx * 0.4, -0.75 * e + state.ry * 0.5, 0.25 * e);
      pivot.position.set(12 * e, 4 * e, -30 * e);
      parts.strap.scale.setScalar(1 - 0.999 * Math.min(1, e * 1.6));
    } else {
      pivot.rotation.set(-0.12 + state.rx + Math.sin(t * 0.6) * 0.03 * idle, -0.32 + state.ry + Math.sin(t * 0.4) * 0.06 * idle, 0.18);
      pivot.position.y = Math.sin(t * 0.8) * 0.6 * idle;
    }
    setTime(now);
    renderer.render(scene, camera);
  }
  function loop() {
    if (state.raf || !state.visible || !state.running) return;
    const tick = (now) => {
      state.raf = 0;
      if (!state.visible || !state.running) return;
      frame(now);
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);
  }
  frame(performance.now());
  loop();

  return {
    setExplode(v) { state.explodeT = Math.max(0, Math.min(1, v)); },
    setLume(on) {
      state.lume = on;
      parts.lume.emissiveIntensity = on ? 3.2 : 0;
      renderer.toneMappingExposure = on ? 0.16 : 1.05;
    },
    get lume() { return state.lume; },
    dispose() { state.running = false; ro.disconnect(); io.disconnect(); renderer.dispose(); }
  };
}
