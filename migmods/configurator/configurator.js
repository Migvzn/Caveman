/* MIGMODS — configurateur Seiko mod (vanilla JS, sans dépendance)
 * Intégration : <div data-migmods-configurator data-src="components.json"></div> + ce script + configurator.css
 * Phase 2 (Shopify) : passer onAddToCart via window.MIGMODS_OPTIONS ou écouter l'événement "migmods:add-to-cart".
 */
(function () {
  'use strict';

  var STAGE = 1000;           // unités internes de l'aperçu (montre centrée en 500,500)
  var PX = 1200;              // résolution du canvas
  var FADE = 150;             // fondu entre deux calques (ms)

  // ---------------------------------------------------------------- utilitaires
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function norm(s) { return String(s == null ? '' : s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  var fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
  function price(n) { return fmt.format(n); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var SPEC_LABELS = { diametre: 'Diamètre', epaisseur: 'Épaisseur', 'entre-cornes': 'Entre-cornes', pompes: 'Pompes', etancheite: 'Étanchéité', verre: 'Verre', couronne: 'Couronne', fond: 'Fond', lunette: 'Lunette', matiere: 'Matière', bracelet: 'Bracelet' };

  // ---------------------------------------------------------------- couleurs (substitutions)
  var COLOR_WORDS = [
    [/or rose/, '#d49a89'], [/bleu ciel/, '#8ecae6'], [/bleu glacier/, '#cfe6ef'], [/turquoise/, '#1fb5b0'], [/petrole/, '#1d4e5f'],
    [/electrique/, '#2f6bff'], [/smurf/, '#2f6fd6'], [/starbucks/, '#0f5f3a'], [/vert d.eau/, '#7fd1c0'], [/vert fonce/, '#163d2a'],
    [/full gold|dore|gold/, '#d4af37'], [/noir mat|blackout|stealth/, '#262626'], [/noir|black|batman|deep/, '#141414'],
    [/blanc|white|ceramique blanche/, '#f2f1ec'], [/argent|silver/, '#d9dadb'], [/acier|steel|metal/, '#c8ccd2'], [/gris/, '#7b7d80'],
    [/bleu/, '#1f3f8f'], [/vert|kaki/, '#1f6b3a'], [/rouge/, '#b3261e'], [/orange/, '#e67e22'], [/jaune/, '#f2c230'],
    [/marron|rootbeer/, '#6b4226'], [/violet/, '#6c3483'], [/rose/, '#eaa7b8'], [/militaire/, '#4b5320'],
    [/carbone/, '#2a2a2a'], [/meteorite/, '#8a8d91']
  ];
  function colorsOf(o, fallback) {
    if (o.color) return o.color.split('/');
    var n = norm(o.label);
    for (var i = 0; i < COLOR_WORDS.length; i++) if (COLOR_WORDS[i][0].test(n)) return [COLOR_WORDS[i][1]];
    return [fallback || '#c8ccd2'];
  }
  function metalOf(o) {
    var n = norm(o.label);
    if (/or rose/.test(n)) return '#d49a89';
    if (/full gold|dore|gold/.test(n)) return '#d4af37';
    if (/noir|pvd/.test(n)) return '#2a2a2a';
    return '#c8ccd2';
  }
  function shade(hex, k) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    var t = k < 0 ? 0 : 255, a = Math.abs(k);
    function m(c) { return Math.round(c + (t - c) * a); }
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  function isLight(hex) {
    var h = hex.replace('#', ''); if (h.length !== 6) return false;
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150;
  }

  // ---------------------------------------------------------------- images de substitution (SVG)
  // Chaque générateur renvoie { svg, fit } : fit = point d'ancrage + taille de référence dans le SVG.
  function svgDoc(w, h, body) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + body + '</svg>'; }
  function grad(id, c) {
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + shade(c, 0.55) + '"/><stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="' + shade(c, -0.35) + '"/></linearGradient></defs>';
  }
  function ticks(cx, cy, r1, r2, n, color, w, skip) {
    var s = '';
    for (var i = 0; i < n; i++) {
      if (skip && skip(i)) continue;
      var a = (i / n) * Math.PI * 2;
      s += '<line x1="' + (cx + Math.sin(a) * r1).toFixed(1) + '" y1="' + (cy - Math.cos(a) * r1).toFixed(1) + '" x2="' + (cx + Math.sin(a) * r2).toFixed(1) + '" y2="' + (cy - Math.cos(a) * r2).toFixed(1) + '" stroke="' + color + '" stroke-width="' + w + '"/>';
    }
    return s;
  }
  function ring(cx, cy, r1, r2, fill) {
    return '<path fill-rule="evenodd" fill="' + fill + '" d="M' + (cx - r1) + ' ' + cy + 'a' + r1 + ' ' + r1 + ' 0 1 0 ' + 2 * r1 + ' 0a' + r1 + ' ' + r1 + ' 0 1 0 ' + -2 * r1 + ' 0zM' + (cx - r2) + ' ' + cy + 'a' + r2 + ' ' + r2 + ' 0 1 0 ' + 2 * r2 + ' 0a' + r2 + ' ' + r2 + ' 0 1 0 ' + -2 * r2 + ' 0z"/>';
  }
  function txt(x, y, s, size, color, extra) {
    return '<text x="' + x + '" y="' + y + '" font-family="Georgia,serif" font-size="' + size + '" fill="' + color + '" text-anchor="middle" dominant-baseline="central" ' + (extra || '') + '>' + esc(s) + '</text>';
  }

  var PH = {
    case: function (o, fam) {
      var m = metalOf(o), shape = (fam && fam.shape) || 'round', integ = fam && fam.strap === 'integre';
      var H = integ ? 700 : 400, cy = H / 2, b = grad('g', m), body = '';
      if (integ) {
        body += '<rect x="110" y="0" width="180" height="' + H + '" rx="18" fill="url(#g)"/>';
        for (var y = 14; y < H; y += 36) if (Math.abs(y - cy) > 160) body += '<line x1="112" x2="288" y1="' + y + '" y2="' + y + '" stroke="' + shade(m, -0.4) + '" stroke-width="2"/>';
      } else {
        [[97, 5, 200 - 95], [275, 5, 200 - 95], [97, 295, 100], [275, 295, 100]].forEach(function (l) {
          body += '<rect x="' + l[0] + '" y="' + l[1] + '" width="28" height="' + l[2] + '" rx="8" fill="url(#g)"/>';
        });
      }
      body += '<rect x="342" y="' + (cy - 24) + '" width="' + (shape === 'thin' ? 34 : 26) + '" height="48" rx="6" fill="url(#g)"/>';
      if (shape === 'octagon') {
        var p = [];
        for (var i = 0; i < 8; i++) { var a = Math.PI / 8 + i * Math.PI / 4; p.push((200 + Math.cos(a) * 160).toFixed(1) + ',' + (cy + Math.sin(a) * 160).toFixed(1)); }
        body += '<polygon points="' + p.join(' ') + '" fill="url(#g)" stroke="' + shade(m, -0.3) + '" stroke-width="3"/>';
        for (i = 0; i < 8; i++) { a = Math.PI / 8 + i * Math.PI / 4; body += '<circle cx="' + (200 + Math.cos(a) * 138) + '" cy="' + (cy + Math.sin(a) * 138) + '" r="5" fill="' + shade(m, -0.45) + '"/>'; }
      } else if (shape === 'naut') {
        body += '<rect x="45" y="' + (cy - 85) + '" width="310" height="170" rx="30" fill="url(#g)"/><rect x="52" y="' + (cy - 150) + '" width="296" height="300" rx="120" fill="url(#g)" stroke="' + shade(m, -0.3) + '" stroke-width="3"/>';
      } else {
        body += '<circle cx="200" cy="' + cy + '" r="150" fill="url(#g)"/>';
        if (shape === 'fluted') body += ticks(200, cy, 128, 150, 72, shade(m, -0.4), 3);
        body += '<circle cx="200" cy="' + cy + '" r="' + (shape === 'thin' ? 140 : 128) + '" fill="' + shade(m, 0.3) + '"/>';
      }
      body += '<circle cx="200" cy="' + cy + '" r="118" fill="#2b2b2b"/>';
      return { svg: svgDoc(400, H, b + body), fit: { cx: 200, cy: cy, d: 300 } };
    },
    dial: function (o, s) {
      var c = colorsOf(o, '#1f3f8f')[0], g = norm(o.group + ' ' + o.label), light = isLight(c), ink = light ? '#222' : '#f2f2f2';
      var b = '<defs><radialGradient id="d" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="' + shade(c, 0.25) + '"/><stop offset="1" stop-color="' + shade(c, -0.35) + '"/></radialGradient>' +
        '<pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10L10 0" stroke="rgba(255,255,255,.12)" stroke-width="3"/></pattern></defs>';
      b += '<circle cx="200" cy="200" r="200" fill="url(#d)"/>';
      if (/carbone/.test(g)) b += '<circle cx="200" cy="200" r="200" fill="url(#p)"/>';
      if (/meteorite/.test(g)) for (var i = 0; i < 40; i++) b += '<path d="M' + (40 + (i * 73) % 320) + ' ' + (40 + (i * 131) % 320) + 'l' + (20 + i % 30) + ' ' + (i % 2 ? 8 : -6) + '" stroke="rgba(255,255,255,.25)" stroke-width="2"/>';
      if (/squelette|open heart/.test(g)) {
        var sk = /squelette/.test(g), cx = sk ? 200 : 115, r = sk ? 150 : 52;
        b += '<circle cx="' + cx + '" cy="200" r="' + r + '" fill="#bfa36a" stroke="#6b5a35" stroke-width="4"/>' + ticks(cx, 200, r * 0.35, r * 0.95, 12, '#6b5a35', 5) + '<circle cx="' + cx + '" cy="200" r="' + r * 0.3 + '" fill="#d9c08a"/>';
      }
      var lume = /california|mk/.test(g) ? '#efe6c8' : '#f4f4ee';
      if (/arabe|california/.test(g)) {
        ['12', '3', '6', '9'].forEach(function (n, k) { var a = k * Math.PI / 2; if (k === 1 && o.date !== false) return; b += txt(200 + Math.sin(a) * 150, 200 - Math.cos(a) * 150, n, 52, lume, 'font-weight="bold"'); });
        b += ticks(200, 200, 170, 190, 12, lume, 10, function (i) { return i % 3 === 0; });
      } else if (/romain/.test(g)) {
        ['XII', 'III', 'VI', 'IX'].forEach(function (n, k) { var a = k * Math.PI / 2; b += txt(200 + Math.sin(a) * 150, 200 - Math.cos(a) * 150, n, 40, lume); });
      } else {
        b += ticks(200, 200, 140, 188, 12, lume, 14, function (i) { return i === 3 && o.date !== false; });
        b += ticks(200, 200, 140, 188, 1, lume, 30);
      }
      b += ticks(200, 200, 190, 198, 60, ink, 2);
      if (/gmt/.test(g)) { b += ring(200, 200, 198, 176, 'rgba(0,0,0,.25)'); for (i = 0; i < 24; i += 2) b += txt(200 + Math.sin(i / 24 * 6.283) * 187, 200 - Math.cos(i / 24 * 6.283) * 187, String(i || 24), 13, ink); }
      if (o.date !== false) b += '<rect x="262" y="183" width="44" height="34" rx="4" fill="#fff" stroke="' + shade(c, -0.5) + '" stroke-width="3"/>' + txt(284, 200, '18', 24, '#111', 'font-family="Arial"');
      if (o.movement === 'NH36') b += '<rect x="160" y="96" width="80" height="32" rx="4" fill="#fff"/>' + txt(200, 112, 'LUN', 20, '#111', 'font-family="Arial"');
      if (/personnalise/.test(g)) b += txt(200, 140, 'VOTRE LOGO', 26, ink, 'letter-spacing="4"');
      else b += txt(200, 270, 'AUTOMATIC', 14, ink, 'letter-spacing="3" font-family="Arial"');
      return { svg: svgDoc(400, 400, b), fit: { cx: 200, cy: 200, d: 400 } };
    },
    insert: function (o) {
      var cs = colorsOf(o, '#141414'), c1 = cs[0], c2 = cs[1] || cs[0], g = norm(o.group + ' ' + o.label);
      var gold = /ym dore|or rose|dore/.test(g) && !/gmt/.test(g), ink = isLight(c1) && !/acier/.test(g) ? '#222' : (gold ? '#2a2a2a' : '#f2f2f2');
      var b = '<defs><clipPath id="t"><rect width="400" height="200"/></clipPath><clipPath id="u"><rect y="200" width="400" height="200"/></clipPath></defs>';
      b += '<g clip-path="url(#t)">' + ring(200, 200, 200, 162, c1) + '</g><g clip-path="url(#u)">' + ring(200, 200, 200, 162, c2) + '</g>';
      var labels = /gmt/.test(g) ? [24, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(String) : /dual time/.test(g) ? ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] : null;
      if (labels) labels.forEach(function (n, i) { if (i) { var a = i / 12 * 6.283; b += txt(200 + Math.sin(a) * 181, 200 - Math.cos(a) * 181, n, 22, ink, 'font-family="Arial" font-weight="bold"'); } });
      else {
        b += ticks(200, 200, 168, 194, 60, ink, 3, function (i) { return i > 15 || i % 10 === 0; }) + ticks(200, 200, 172, 192, 12, ink, 7, function (i) { return i === 0 || i % 2 === 0; });
        ['10', '20', '30', '40', '50'].forEach(function (n, i) { var a = (i + 1) / 6 * 6.283; b += txt(200 + Math.sin(a) * 181, 200 - Math.cos(a) * 181, n, 28, ink, 'font-family="Arial" font-weight="bold"'); });
      }
      b += '<path d="M182 168L218 168L200 196Z" fill="' + (gold ? '#2a2a2a' : '#f4f4ee') + '"/>';
      return { svg: svgDoc(400, 400, b), fit: { cx: 200, cy: 200, d: 400 } };
    },
    bezel: function (o) {
      var m = metalOf(o);
      return { svg: svgDoc(400, 400, grad('g', m) + ring(200, 200, 200, 178, 'url(#g)') + ticks(200, 200, 190, 200, 120, shade(m, -0.4), 3)), fit: { cx: 200, cy: 200, d: 400 } };
    },
    chapter: function (o) {
      var cs = colorsOf(o, '#c8ccd2'), c = cs[0], ink = isLight(c) ? '#222' : '#eee';
      if (/(noir|bleu|vert|rouge|jaune|orange) & noir/.test(norm(o.label))) ink = '#111', c = colorsOf({ label: o.label.split('&')[0] })[0];
      return { svg: svgDoc(400, 400, ring(200, 200, 200, 184, c) + ticks(200, 200, 186, 198, 60, ink, 2)), fit: { cx: 200, cy: 200, d: 400 } };
    },
    hands: function (o) {
      var n = norm(o.label), m = metalOf(o), lume = /patine|vintage/.test(n) ? '#e9d7a8' : /full noir/.test(n) ? '#333' : '#f1f5e6', sq = /squelette/.test(n);
      function hand(len, w, angle, deco) {
        var path = /dolphin|naut/.test(n) ? 'M-' + w + ' 0L0 -' + len + 'L' + w + ' 0Z' : 'M-' + w / 2 + ' 0L-' + w / 2 + ' -' + (len - 14) + 'L0 -' + len + 'L' + w / 2 + ' -' + (len - 14) + 'L' + w / 2 + ' 0Z';
        return '<g transform="translate(200 200) rotate(' + angle + ')"><path d="' + path + '" fill="' + (sq ? 'none' : lume) + '" stroke="' + m + '" stroke-width="5"/>' + (deco || '') + '</g>';
      }
      var benz = /benz/.test(n) ? '<circle cy="-70" r="17" fill="none" stroke="' + m + '" stroke-width="5"/><path d="M0 -70V-87M0 -70L-14 -61M0 -70L14 -61" stroke="' + m + '" stroke-width="4"/>' : '';
      var flake = /snowflake/.test(n) ? '<rect x="-15" y="-90" width="30" height="30" transform="rotate(45 0 -75)" fill="' + lume + '" stroke="' + m + '" stroke-width="4"/>' : '';
      var b = hand(105, /naut|baton/.test(n) ? 16 : 12, -55, benz + flake) + hand(160, /naut|baton/.test(n) ? 13 : 9, 60, '') + '<circle cx="200" cy="200" r="11" fill="' + m + '"/>';
      return { svg: svgDoc(400, 400, b), fit: { cx: 200, cy: 200, d: 160 } };
    },
    seconds: function (o) {
      var n = norm(o.label), c = /flash|orange|rouge|jaune|vert|bleu/.test(n) ? colorsOf(o)[0] : metalOf(o);
      var b = '<g transform="translate(200 200) rotate(210)"><path d="M-2 45L-2 -170L0 -178L2 -170L2 45Z" fill="' + c + '"/>' +
        (/benz|skx|precision/.test(n) ? '<circle cy="-120" r="9" fill="#f1f5e6" stroke="' + c + '" stroke-width="3"/>' : '') +
        (/flash/.test(n) ? '<path d="M-6 -150L6 -150L0 -178Z" fill="' + c + '"/>' : '') + '<circle r="7" fill="' + c + '"/></g>';
      return { svg: svgDoc(400, 400, b), fit: { cx: 200, cy: 200, d: 170 } };
    },
    gmt: function (o) {
      var c = colorsOf(o, '#c8ccd2')[0];
      var b = '<g transform="translate(200 200) rotate(130)"><path d="M-2 0L-2 -120L2 -120L2 0Z" fill="' + c + '"/><path d="M-12 -112L0 -150L12 -112Z" fill="' + c + '" stroke="#111" stroke-width="1"/></g>';
      return { svg: svgDoc(400, 400, b), fit: { cx: 200, cy: 200, d: 150 } };
    },
    magnifier: function () {
      return { svg: svgDoc(160, 120, '<rect x="2" y="2" width="156" height="116" rx="30" fill="rgba(235,240,245,.55)" stroke="#aab" stroke-width="3"/><rect x="38" y="30" width="84" height="60" fill="#fff"/>' + txt(80, 61, '18', 52, '#111', 'font-family="Arial"')), fit: { cx: 80, cy: 60, d: 156 } };
    },
    crown: function (o) {
      var m = metalOf(o);
      return { svg: svgDoc(60, 100, grad('g', m) + '<rect x="4" y="4" width="52" height="92" rx="10" fill="url(#g)"/>' + [20, 32, 44, 56, 68, 80].map(function (y) { return '<line x1="8" x2="52" y1="' + y + '" y2="' + y + '" stroke="' + shade(m, -0.4) + '" stroke-width="3"/>'; }).join('')), fit: { cx: 30, cy: 50, d: 100 } };
    },
    strap: function (o) {
      var n = norm(o.label), cs = colorsOf(o, '#c8ccd2'), c = cs[0], b = '', metal = /oyster|jubilee/.test(n);
      if (metal) {
        var center = /bicolore|acier\/dore|acier\/or/.test(n) ? (/or rose/.test(n) ? '#d49a89' : '#d4af37') : (/poli/.test(n) ? shade(metalOf(o), 0.4) : metalOf(o));
        var side = /full|^.*(oyster|jubilee) (dore|or rose|noir)/.test(n) ? metalOf(o) : '#c8ccd2';
        b += grad('g', side) + '<rect x="150" y="10" width="100" height="380" rx="6" fill="url(#g)"/>';
        var cols = /jubilee/.test(n) ? [[168, 14], [193, 14], [218, 14]] : [[184, 32]];
        for (var y = 14; y < 390; y += /jubilee/.test(n) ? 14 : 26) {
          b += '<line x1="150" x2="250" y1="' + y + '" y2="' + y + '" stroke="' + shade(side, -0.4) + '" stroke-width="1.5"/>';
          cols.forEach(function (k) { b += '<rect x="' + k[0] + '" y="' + (y + 2) + '" width="' + k[1] + '" height="' + (/jubilee/.test(n) ? 10 : 22) + '" rx="3" fill="' + center + '"/>'; });
        }
      } else {
        b += '<rect x="152" y="10" width="96" height="380" rx="20" fill="' + c + '"/>';
        if (/waffle/.test(n)) for (var yy = 20; yy < 380; yy += 12) for (var x = 160; x < 240; x += 12) b += '<rect x="' + x + '" y="' + yy + '" width="8" height="8" fill="' + shade(c, -0.25) + '"/>';
        else if (/nylon/.test(n)) b += '<rect x="185" y="10" width="30" height="380" fill="' + shade(c, 0.15) + '"/>';
        else b += '<rect x="196" y="20" width="8" height="360" rx="4" fill="' + shade(c, -0.25) + '"/>';
      }
      return { svg: svgDoc(400, 400, b), fit: { cx: 200, cy: 200, d: 100 } };
    }
  };

  var imgCache = {};
  function loadImage(src) {
    if (!imgCache[src]) imgCache[src] = new Promise(function (res) {
      var i = new Image();
      i.decoding = 'async';
      if (/^(https?:)?\/\//.test(src)) i.crossOrigin = 'anonymous'; // CDN Shopify : garde l'export PNG possible
      i.onload = function () { res(i); };
      i.onerror = function () { res(null); };
      i.src = src;
    });
    return imgCache[src];
  }
  function svgUrl(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  // ---------------------------------------------------------------- configurateur
  function Configurator(root, options) {
    this.root = root;
    this.o = options || {};
    this.sel = {};
    this.layers = {};
    this.view = { z: 1, x: 0, y: 0, rot: 0 };
    this.logo = null;
    this.memo = {};
    this.openStep = null;
    this.calib = /[?&]calibrer=1/.test(location.search);
  }

  Configurator.prototype.init = function (data) {
    var self = this;
    if (this.o.watermarkSrc) loadImage(this.o.watermarkSrc).then(function (img) { self._wm = img; });
    this.data = data;
    this.steps = data.steps;
    this.byId = {};
    this.steps.forEach(function (s) {
      self.byId[s.id] = s;
      s.index = {};
      s.options.forEach(function (o) { s.index[o.id] = o; o.step = s.id; });
    });
    this.buildUI();
    if (!this.readUrl()) this.sel = JSON.parse(JSON.stringify(data.default || {}));
    this.validate(true);
    this.renderAll();
    this.open(this.visibleSteps()[0].id, false);
  };

  // --- lecture des données / règles
  Configurator.prototype.opt = function (stepId) {
    var s = this.byId[stepId], v = this.sel[stepId];
    if (!s || v == null || Array.isArray(v)) return null;
    return s.index[v] || null;
  };
  Configurator.prototype.family = function () {
    var c = this.opt('case');
    return (c && this.data.families[c.family]) || this.data.families.sub;
  };
  Configurator.prototype.field = function (stepId, f) {
    var v = this.sel[stepId];
    if (v == null) return null;
    if (Array.isArray(v)) return f ? null : v;
    var o = this.opt(stepId);
    if (!o) return null;
    if (!f) return o.id;
    if (o[f] !== undefined) return o[f];
    var fam = o.family && this.data.families[o.family];
    if (fam && fam[f] !== undefined) return fam[f];
    return null;
  };
  // Conditions : "case.lunette=oui & dial.movement!=NH36", "caseback=plein", "gmt_hand", "!gmt_hand"
  Configurator.prototype.test = function (cond) {
    if (!cond) return true;
    var self = this;
    return cond.split('&').every(function (term) {
      term = term.trim();
      var m = term.match(/^([\w.]+)\s*(!=|=)\s*(.*)$/);
      if (!m) {
        var neg = term[0] === '!', id = term.replace(/^!/, '');
        var has = self.sel[id] != null && !(Array.isArray(self.sel[id]) && !self.sel[id].length) && self.isVisible(self.byId[id]);
        return neg ? !has : has;
      }
      var parts = m[1].split('.'), v = self.field(parts[0], parts[1]);
      var vals = m[3].split(',').map(function (x) { x = x.trim(); return x === 'oui' ? true : x === 'non' ? false : x === 'vide' ? null : x; });
      var hit = vals.some(function (x) {
        if (Array.isArray(v)) return v.indexOf(x) >= 0;
        if (v === undefined || v === '') v = null;
        if (x === null || v === null) return x === v;
        return x === v || (typeof x === 'string' && typeof v === 'string' && x.toLowerCase() === v.toLowerCase());
      });
      return m[2] === '=' ? hit : !hit;
    });
  };
  Configurator.prototype.isVisible = function (s) {
    if (!s) return false;
    if (s.visibleIf && !this.test(s.visibleIf)) return false;
    return s.type === 'logo' || s.options.some(function (o) { return !this.isHidden(o); }, this);
  };
  // Une option liée au boîtier (famille, bracelet…) est masquée ; les autres incompatibilités sont grisées.
  Configurator.prototype.isHidden = function (o) { return !!o.requires && /(^|&)\s*!?case\./.test(o.requires) && !this.test(o.requires); };
  Configurator.prototype.isAllowed = function (o) {
    return o.stock !== false && (!o.requires || this.test(o.requires)) && (!o.excludes || !this.test(o.excludes));
  };
  Configurator.prototype.visibleSteps = function () { return this.steps.filter(this.isVisible, this); };
  Configurator.prototype.movement = function () {
    var pr = this.data.movementPriority || [], best = null, self = this;
    this.visibleSteps().forEach(function (s) {
      var o = self.opt(s.id);
      if (o && o.movement && (best == null || pr.indexOf(o.movement) < pr.indexOf(best))) best = o.movement;
    });
    return best || this.data.defaultMovement || 'NH35';
  };
  Configurator.prototype.lines = function () {
    var out = [], self = this;
    this.visibleSteps().forEach(function (s) {
      var v = self.sel[s.id];
      if (s.type === 'logo') { if (self.logo) out.push({ step: s, label: self.logo.kind === 'text' ? 'Texte « ' + self.logo.text + ' »' : 'Logo importé', price: s.price || 0 }); return; }
      (Array.isArray(v) ? v : v != null ? [v] : []).forEach(function (id) { var o = s.index[id]; if (o) out.push({ step: s, opt: o, label: o.label, price: o.price || 0 }); });
    });
    return out;
  };
  Configurator.prototype.total = function () {
    return this.lines().reduce(function (a, l) { return a + l.price; }, this.data.basePrice || 0);
  };

  // Retire ce qui est devenu incompatible, complète les étapes obligatoires. Renvoie les messages.
  Configurator.prototype.validate = function (silent) {
    var msgs = [], self = this, def = this.data.default || {};
    for (var pass = 0; pass < 4; pass++) {
      var changed = false;
      this.steps.forEach(function (s) {
        var v = self.sel[s.id], vis = self.isVisible(s);
        if (s.type === 'logo') return;
        if (!vis) {
          if (v != null && !(Array.isArray(v) && !v.length)) {
            var old = Array.isArray(v) ? null : s.index[v];
            self.memo[s.id] = v;
            delete self.sel[s.id]; changed = true;
            msgs.push(s.label + (old ? ' « ' + old.label + ' »' : '') + ' : retiré, non disponible avec ce choix');
          }
          s._hidden = true;
          return;
        }
        // Une étape qui réapparaît retrouve le choix précédent (ou celui par défaut).
        if (s._hidden && v == null) {
          var back = s.index[self.memo[s.id]] || s.index[def[s.id]];
          if (back && self.isAllowed(back)) { self.sel[s.id] = back.id; v = back.id; changed = true; }
        }
        s._hidden = false;
        if (Array.isArray(v)) {
          var keep = v.filter(function (id) { return s.index[id] && self.isAllowed(s.index[id]); });
          if (keep.length !== v.length) { v.filter(function (id) { return keep.indexOf(id) < 0; }).forEach(function (id) { var x = s.index[id] || { label: id }; msgs.push('« ' + x.label + ' » : retiré' + (x.description ? ' (' + x.description.replace(/\.$/, '') + ')' : ', incompatible avec votre choix')); }); self.sel[s.id] = keep; changed = true; }
          return;
        }
        var o = v != null ? s.index[v] : null;
        if (o && !self.isAllowed(o)) {
          delete self.sel[s.id]; changed = true;
          if (!s.required) msgs.push(s.label + ' « ' + o.label + ' » : retiré. ' + (o.hint || 'Incompatible avec votre nouveau choix.'));
          var was = o;
          o = null;
        }
        if (!o && s.required) {
          var pick = self.bestReplacement(s, was || s.index[self.memo[s.id]]);
          if (pick) {
            self.sel[s.id] = pick.id; changed = true;
            if (v != null) msgs.push(s.label + ' : « ' + pick.label + ' », compatible avec le ' + self.family().label);
          }
        }
      });
      if (!changed) break;
    }
    if (!silent && msgs.length) this.toast(msgs.join('\n'));
    return msgs;
  };

  // Remplaçant le plus proche : même nom dans le nouveau groupe, sinon le défaut, sinon le premier avec photo.
  Configurator.prototype.bestReplacement = function (s, prev) {
    var self = this, ok = s.options.filter(function (x) { return self.isAllowed(x); });
    if (!ok.length) return null;
    var d = s.index[(this.data.default || {})[s.id]];
    if (prev) {
      var words = norm(prev.label).split(/\W+/).filter(function (w) { return w.length > 2; });
      var score = function (x) { var n = norm(x.label); return words.filter(function (w) { return n.indexOf(w) >= 0; }).length + (x.image ? 0.5 : 0); };
      var best = ok.slice().sort(function (a, b) { return score(b) - score(a); })[0];
      if (score(best) >= 1) return best;
    }
    if (d && ok.indexOf(d) >= 0) return d;
    return ok.filter(function (x) { return x.image; })[0] || ok[0];
  };

  Configurator.prototype.choose = function (stepId, optId) {
    var s = this.byId[stepId], o = s.index[optId];
    if (!o || !this.isAllowed(o)) return;
    if (s.multiple) {
      var arr = (this.sel[stepId] || []).slice(), i = arr.indexOf(optId);
      if (i >= 0) arr.splice(i, 1); else arr.push(optId);
      this.sel[stepId] = arr;
    } else this.sel[stepId] = optId;
    var msgs = this.validate(true);
    var on = s.multiple ? this.sel[stepId].indexOf(optId) >= 0 : true;
    if (on && o.hint && o.hintIf && this.test(o.hintIf)) msgs.push(o.hint);
    if (stepId === 'dial' && o.movement) msgs.unshift('Mouvement adapté : ' + this.movementLabel());
    if (stepId === 'gmt_hand') msgs.unshift('Mouvement adapté : ' + this.movementLabel() + '. Les inserts GMT et Dual Time sont maintenant proposés en premier.');
    if (msgs.length) this.toast(msgs.join('\n'));
    this.renderAll();
    this.preloadAround(stepId);
  };
  Configurator.prototype.remove = function (stepId) {
    if (this.byId[stepId].type === 'logo') this.logo = null;
    delete this.sel[stepId];
    this.validate(false);
    this.renderAll();
  };
  Configurator.prototype.movementLabel = function () {
    var m = this.movement(), lab = (this.data.movements || {})[m] || ('Seiko ' + m);
    return lab.replace(/\s*\(.*\)$/, '');
  };

  // --- URL de configuration : ?c=case:sub-acier-40|dial:raye-bleu|engraving:boucle+rotor|logo:t~MIGMODS~0~-0.4~1
  Configurator.prototype.encode = function () {
    var self = this, parts = [];
    this.steps.forEach(function (s) {
      var v = self.sel[s.id];
      if (v == null || (Array.isArray(v) && !v.length)) return;
      parts.push(s.id + ':' + (Array.isArray(v) ? v.join('+') : v));
    });
    if (this.logo && this.logo.kind === 'text') parts.push('logo:' + ['t', encodeURIComponent(this.logo.text), this.logo.font, this.logo.color.replace('#', ''), this.logo.x.toFixed(2), this.logo.y.toFixed(2), this.logo.s.toFixed(2)].join('~'));
    return parts.join('|');
  };
  Configurator.prototype.shareUrl = function () {
    var u = new URL(location.href);
    u.searchParams.delete('calibrer');
    u.searchParams.set('c', this.encode());
    u.hash = '';
    return u.toString();
  };
  Configurator.prototype.readUrl = function () {
    var m = location.search.match(/[?&]c=([^&]*)/) || location.hash.match(/[#&]c=([^&]*)/);
    if (!m) return false;
    var self = this, any = false;
    decodeURIComponent(m[1]).split('|').forEach(function (p) {
      var i = p.indexOf(':'), k = p.slice(0, i), v = p.slice(i + 1);
      if (k === 'logo') {
        var f = v.split('~');
        if (f[0] === 't') self.logo = { kind: 'text', text: decodeURIComponent(f[1] || ''), font: f[2] || 'serif', color: '#' + (f[3] || 'ffffff'), x: +f[4] || 0, y: +f[5] || -0.4, s: +f[6] || 1 };
        return;
      }
      var s = self.byId[k];
      if (!s) return;
      if (s.multiple) self.sel[k] = v.split('+').filter(function (x) { return s.index[x]; });
      else if (s.index[v]) self.sel[k] = v;
      any = true;
    });
    return any;
  };
  Configurator.prototype.syncUrl = function () {
    if (this.o.updateUrl === false) return;
    try { history.replaceState(null, '', this.shareUrl()); } catch (e) { /* iframe / file:// */ }
  };

  // ---------------------------------------------------------------- rendu de l'aperçu
  // Chemins relatifs résolus contre assetBase (CDN des assets du thème Shopify), sinon contre la page.
  Configurator.prototype.resolve = function (src) {
    if (!src || /^(data:|blob:|https?:|\/)/.test(src) || !this.o.assetBase) return src;
    return this.o.assetBase + src;
  };
  Configurator.prototype.imageFor = function (s, o) {
    if (o.image) return { src: this.resolve(o.image), fit: o.fit };
    if (!o._ph) {
      var gen = PH[s.slot];
      if (!gen) return null;
      var r = gen(o, s.id === 'case' ? this.data.families[o.family] : null);
      o._ph = { src: svgUrl(r.svg), fit: r.fit };
    }
    return o._ph;
  };
  Configurator.prototype.thumbFor = function (s, o) {
    if (o.thumb) return this.resolve(o.thumb);
    var i = this.imageFor(s, o);
    return i ? i.src : null;
  };
  // Position / taille cible d'un calque dans l'aperçu, d'après la géométrie de la famille du boîtier.
  Configurator.prototype.placement = function (slot) {
    var g = this.family().geometry, c = STAGE / 2, R = g.dial / 2;
    switch (slot) {
      case 'case': return { x: c, y: c, size: g.open || g.case };   // calage boîtier = ouverture du cadran
      case 'bezel': return { x: c, y: c, size: g.bezel || g.case };
      case 'insert': return { x: c, y: c, size: g.insert || g.case * 0.9 };
      case 'chapter': return { x: c, y: c, size: g.chapter || g.dial * 1.07 };
      case 'dial': return { x: c, y: c, size: g.dial, clip: R };
      case 'magnifier': return { x: c + (g.date || [0.68, 0])[0] * R, y: c + (g.date || [0.68, 0])[1] * R, size: g.dial * 0.23 };
      case 'hands': return { x: c, y: c, size: R * 0.9 };
      case 'seconds': return { x: c, y: c, size: R * 0.95 };
      case 'gmt': return { x: c, y: c, size: R * 0.8 };
      case 'strap': return { x: c, y: c, size: g.lug };
      case 'crown': return { x: c + g.crown[0], y: c + g.crown[1], size: g.crown[3] };
    }
    return null;
  };

  Configurator.prototype.updateLayers = function () {
    var self = this, now = performance.now(), want = {};
    this.visibleSteps().forEach(function (s) {
      if (!s.slot || s.slot === 'none') return;
      var o = self.opt(s.id);
      if (o) want[s.id] = { src: self.imageFor(s, o), s: s };
    });
    Object.keys(this.layers).concat(Object.keys(want)).forEach(function (id) {
      var cur = self.layers[id], w = want[id];
      var key = w && w.src ? w.src.src : null;
      if (cur && cur.key === key) return;
      var layer = { key: key, s: self.byId[id], fit: w && w.src && w.src.fit, img: null, t: now, prev: cur && cur.img ? cur : null };
      if (layer.prev) layer.prev.prev = null;
      self.layers[id] = layer;
      if (key) loadImage(key).then(function (img) { if (self.layers[id] === layer) { layer.img = img; layer.t = performance.now(); self.draw(); } });
      else if (!layer.prev) delete self.layers[id];
    });
    this.draw();
  };

  Configurator.prototype.drawLayer = function (ctx, L, alpha) {
    if (!L.img || alpha <= 0) return;
    var p = this.placement(L.s.slot);
    if (!p) return;
    var f = L.fit || { cx: L.img.naturalWidth / 2, cy: L.img.naturalHeight / 2, d: L.img.naturalWidth };
    if (f.w && f.w !== L.img.naturalWidth) { var r = L.img.naturalWidth / f.w; f = { cx: f.cx * r, cy: f.cy * r, d: f.d * r, angle: f.angle }; }
    var k = p.size / f.d;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.clip) { ctx.beginPath(); ctx.arc(p.x, p.y, p.clip, 0, Math.PI * 2); ctx.clip(); }
    ctx.translate(p.x, p.y);
    if (f.angle) ctx.rotate(f.angle * Math.PI / 180);
    ctx.scale(k, k);
    ctx.drawImage(L.img, -f.cx, -f.cy);
    ctx.restore();
  };

  Configurator.prototype.paint = function (ctx, opts) {
    var self = this, now = performance.now(), busy = false;
    ctx.save();
    var stage = this.o.stage || ['#fbfaf7', '#e9e5de'];
    var bg = ctx.createRadialGradient(500, 430, 60, 500, 500, 720);
    bg.addColorStop(0, stage[0]); bg.addColorStop(1, stage[1]);
    ctx.fillStyle = bg; ctx.fillRect(-STAGE, -STAGE, STAGE * 3, STAGE * 3);
    var order = Object.keys(this.layers).map(function (k) { return self.layers[k]; }).sort(function (a, b) { return a.s.layer - b.s.layer; });
    var logoLayer = this.byId.custom_logo ? this.byId.custom_logo.layer : 12, logoDone = false;
    order.forEach(function (L) {
      if (!logoDone && L.s.layer > logoLayer) { self.drawLogo(ctx); logoDone = true; }
      var k = opts.instant ? 1 : Math.min(1, (now - L.t) / FADE);
      if (k < 1 && L.img) busy = true;
      if (L.prev) { if (k < 1) self.drawLayer(ctx, L.prev, L.img ? 1 - k : 1); else L.prev = null; }
      self.drawLayer(ctx, L, L.img ? k : 0);
    });
    if (!logoDone) this.drawLogo(ctx);
    if (this.sel.caseback === 'transparent') this.drawCaseback(ctx);
    if (opts.watermark) {
      var wm = this._wm;
      if (wm && wm.naturalWidth) {
        var ww = 300, wh = ww * wm.naturalHeight / wm.naturalWidth;
        ctx.drawImage(wm, 975 - ww, 980 - wh, ww, wh);
      } else {
        ctx.fillStyle = 'rgba(17,17,17,.55)'; ctx.font = '600 22px Inter, Arial, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('M I G M O D S', 500, 975);
      }
    }
    ctx.restore();
    return busy;
  };

  Configurator.prototype.draw = function () {
    if (this._raf) return;
    var self = this;
    this._raf = requestAnimationFrame(function () {
      self._raf = null;
      var ctx = self.ctx, v = self.view;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, PX, PX);
      var k = PX / STAGE;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.translate(500, 500); ctx.rotate(v.rot * Math.PI / 180); ctx.scale(v.z, v.z); ctx.translate(-500 + v.x, -500 + v.y);
      var busy = self.paint(ctx, { watermark: !!self.o.watermarkSrc });
      if (self.calib) self.drawGuides(ctx);
      if (busy) self.draw();
    });
  };

  Configurator.prototype.drawCaseback = function (ctx) {
    var x = 850, y = 860, r = 95;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#d7d9dc'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.arc(x, y, r - 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8964f'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 18, -0.6, 1.9); ctx.fill();
    ctx.strokeStyle = '#8a7340'; ctx.lineWidth = 3;
    for (var i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x - 20 + i * 9, y - 18 + (i % 2) * 22, 12, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.arc(x - 22, y + 30, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#555'; ctx.font = '600 18px Inter, Arial'; ctx.textAlign = 'center';
    ctx.fillText('FOND SAPHIR', x, y + r + 26);
    ctx.restore();
  };

  Configurator.prototype.drawLogo = function (ctx) {
    var L = this.logo;
    if (!L) return;
    var g = this.family().geometry, R = g.dial / 2, x = 500 + L.x * R, y = 500 + L.y * R;
    ctx.save();
    ctx.beginPath(); ctx.arc(500, 500, R, 0, 7); ctx.clip();
    if (L.kind === 'text') {
      var size = R * 0.13 * L.s;
      ctx.font = (L.font === 'sans' ? '600 ' + size + 'px Inter, Arial' : L.font === 'script' ? 'italic ' + size * 1.2 + 'px "Cormorant Garamond", Georgia' : '500 ' + size + 'px "Cormorant Garamond", Georgia');
      ctx.fillStyle = L.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (L.font === 'sans' && ctx.letterSpacing !== undefined) ctx.letterSpacing = size * 0.15 + 'px';
      ctx.fillText(L.text, x, y);
      var w = ctx.measureText(L.text).width;
      L.box = [x - w / 2, y - size * 0.6, w, size * 1.2];
    } else if (L.img) {
      var wImg = R * 0.5 * L.s, h = wImg * L.img.naturalHeight / L.img.naturalWidth;
      ctx.drawImage(L.img, x - wImg / 2, y - h / 2, wImg, h);
      L.box = [x - wImg / 2, y - h / 2, wImg, h];
    }
    if (this.openStep === 'custom_logo' && L.box) {
      ctx.strokeStyle = 'rgba(176,141,87,.9)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
      ctx.strokeRect(L.box[0] - 6, L.box[1] - 6, L.box[2] + 12, L.box[3] + 12);
    }
    ctx.restore();
  };

  Configurator.prototype.drawGuides = function (ctx) {
    var g = this.family().geometry;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,0,80,.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(500, 0); ctx.lineTo(500, 1000); ctx.moveTo(0, 500); ctx.lineTo(1000, 500); ctx.stroke();
    [g.dial, g.case, g.insert].forEach(function (d) { if (d) { ctx.beginPath(); ctx.arc(500, 500, d / 2, 0, 7); ctx.stroke(); } });
    ctx.restore();
  };

  Configurator.prototype.exportPng = function () {
    var c = document.createElement('canvas');
    c.width = c.height = PX;
    var ctx = c.getContext('2d');
    ctx.scale(PX / STAGE, PX / STAGE);
    var open = this.openStep; this.openStep = null;
    this.paint(ctx, { instant: true, watermark: true });
    this.openStep = open;
    return c;
  };

  // ---------------------------------------------------------------- interface
  Configurator.prototype.buildUI = function () {
    var self = this, d = this.data, t = d.texts || {};
    this.root.classList.add('mm');
    this.root.innerHTML = '';
    this.canvas = el('canvas', { width: PX, height: PX, class: 'mm-canvas', role: 'img', 'aria-label': 'Aperçu de la montre' });
    this.ctx = this.canvas.getContext('2d');
    var tool = function (label, icon, fn, extra) { return el('button', Object.assign({ type: 'button', class: 'mm-tool', 'aria-label': label, title: label, onclick: fn }, extra || {}), [el('span', { 'aria-hidden': 'true', html: icon }), el('span', { class: 'mm-tool-txt', text: label })]); };
    this.zoomBtn = tool('Zoom', '&#x2295;', function () { self.toggleZoom(); }, { 'aria-pressed': 'false' });
    var tools = el('div', { class: 'mm-tools' }, [
      this.zoomBtn,
      tool('Pivoter', '&#x21bb;', function () { self.view.rot = (self.view.rot + 90) % 360; self.draw(); }),
      tool('Télécharger', '&#x2913;', function () { self.download(); }),
      tool('Partager', '&#x2197;', function () { self.openShare(); })
    ]);
    this.previewEl = el('div', { class: 'mm-preview' }, [el('div', { class: 'mm-stage' }, [this.canvas]), tools]);
    this.progressBar = el('span', { class: 'mm-progress-bar' });
    this.progressTxt = el('span', { class: 'mm-progress-txt' });
    this.stepsEl = el('div', { class: 'mm-steps' });
    this.recapList = el('ul', { class: 'mm-recap-list' });
    this.recapTotal = el('strong');
    var recap = el('details', { class: 'mm-recap' }, [el('summary', {}, [el('span', { text: 'Récapitulatif' }), this.recapTotal]), this.recapList]);
    this.totalEl = el('span', { class: 'mm-total' });
    this.mvtEl = el('span', { class: 'mm-mvt' });
    this.cartBtn = el('button', { type: 'button', class: 'mm-btn mm-btn-primary', text: 'Ajouter au panier', onclick: function () { self.addToCart(); } });
    var bar = el('div', { class: 'mm-bar' }, [
      el('div', { class: 'mm-bar-price' }, [el('span', { class: 'mm-label', text: 'Total TTC' }), this.totalEl, this.mvtEl]),
      this.cartBtn
    ]);
    var panel = el('div', { class: 'mm-panel' }, [
      el('header', { class: 'mm-head' }, [
        el('p', { class: 'mm-kicker', text: 'Configurateur MigMods' }),
        el('h1', { class: 'mm-title', text: t.title || 'Créer ma montre' }),
        el('div', { class: 'mm-progress', role: 'progressbar', 'aria-label': 'Progression' }, [this.progressBar]),
        this.progressTxt
      ]),
      this.stepsEl,
      recap,
      el('ul', { class: 'mm-reassure' }, [
        el('li', { text: t.delivery || '' }),
        el('li', { text: t.lead || '' }),
        el('li', { text: 'Assemblée à la main, testée en étanchéité et réglée au chronocomparateur.' }),
        t.warranty ? el('li', { text: t.warranty }) : null
      ]),
      bar
    ]);
    this.toastEl = el('div', { class: 'mm-toast', role: 'status', 'aria-live': 'polite' });
    this.root.appendChild(el('div', { class: 'mm-layout' }, [this.previewEl, panel]));
    this.root.appendChild(this.toastEl);
    if (this.calib) this.root.appendChild(this.buildCalib());
    this.bindCanvas();
    this.steps.forEach(function (s) { self.stepsEl.appendChild(self.buildStep(s)); });
  };

  Configurator.prototype.buildStep = function (s) {
    var self = this;
    var head = el('button', { type: 'button', class: 'mm-step-head', 'aria-expanded': 'false', id: 'mm-h-' + s.id, 'aria-controls': 'mm-b-' + s.id, onclick: function () { self.open(self.openStep === s.id ? null : s.id, true); } }, [
      el('span', { class: 'mm-step-num' }),
      el('span', { class: 'mm-step-title' }, [el('span', { class: 'mm-step-label', text: s.label }), el('span', { class: 'mm-step-sum' })]),
      el('span', { class: 'mm-step-state', 'aria-hidden': 'true' })
    ]);
    var body = el('div', { class: 'mm-step-body', id: 'mm-b-' + s.id, role: 'region', 'aria-labelledby': 'mm-h-' + s.id, hidden: true });
    var wrap = el('section', { class: 'mm-step', 'data-step': s.id }, [head, body]);
    s._el = { wrap: wrap, head: head, body: body, num: head.querySelector('.mm-step-num'), sum: head.querySelector('.mm-step-sum'), state: head.querySelector('.mm-step-state') };
    return wrap;
  };

  Configurator.prototype.buildStepBody = function (s) {
    var self = this, body = s._el.body;
    body.innerHTML = '';
    if (s.help) body.appendChild(el('p', { class: 'mm-help', text: s.help }));
    if (s.type === 'logo') { body.appendChild(this.buildLogoUI(s)); return; }
    var groups = (s.groups || [null]).slice(), badges = {};
    (s.priorityGroups || []).forEach(function (pg) {
      if (!self.test(pg.if)) return;
      pg.groups.slice().reverse().forEach(function (g) { var i = groups.indexOf(g); if (i >= 0) { groups.splice(i, 1); groups.unshift(g); badges[g] = pg.badge; } });
    });
    var round = ['dial', 'insert', 'bezel', 'chapter'].indexOf(s.slot) >= 0;
    var shown = groups.filter(function (g) { return s.options.some(function (o) { return (o.group || null) === g && !self.isHidden(o); }); });
    // Beaucoup de choix : une famille à la fois, avec des onglets
    if (shown.length > 2 && s.options.length > 16) {
      if (!s._tab || shown.indexOf(s._tab) < 0) { var cur = this.opt(s.id); s._tab = cur && shown.indexOf(cur.group) >= 0 ? cur.group : shown[0]; }
      var tabs = el('div', { class: 'mm-tabs', role: 'tablist', 'aria-label': s.label });
      shown.forEach(function (g) {
        var n = s.options.filter(function (o) { return o.group === g && !self.isHidden(o); }).length;
        tabs.appendChild(el('button', { type: 'button', role: 'tab', class: 'mm-tab', 'aria-selected': g === s._tab ? 'true' : 'false', onclick: function () { s._tab = g; self.buildStepBody(s); self.refreshOptions(); } }, [g, el('span', { class: 'mm-tab-n', text: String(n) }), badges[g] ? el('span', { class: 'mm-badge', text: badges[g] }) : null]));
      });
      body.appendChild(tabs);
      groups = [s._tab];
    }
    groups.forEach(function (g) {
      var opts = s.options.filter(function (o) { return (o.group || null) === g && !self.isHidden(o); });
      if (!opts.length) return;
      if (g && groups.length > 1) body.appendChild(el('h3', { class: 'mm-group' }, [g, badges[g] ? el('span', { class: 'mm-badge', text: badges[g] }) : null]));
      var grid = el('div', { class: 'mm-grid' + (round ? ' mm-round' : ''), role: 'group', 'aria-label': g || s.label });
      opts.forEach(function (o) { grid.appendChild(self.buildOption(s, o)); });
      body.appendChild(grid);
    });
    s._el.detail = el('div', { class: 'mm-detail' });
    body.appendChild(s._el.detail);
    var actions = el('div', { class: 'mm-actions' });
    if (!s.required) actions.appendChild(el('button', { type: 'button', class: 'mm-btn mm-btn-ghost mm-remove', text: 'Retirer', onclick: function () { self.remove(s.id); } }));
    actions.appendChild(el('button', { type: 'button', class: 'mm-btn mm-btn-line', text: 'Étape suivante', onclick: function () { self.next(s.id); } }));
    body.appendChild(actions);
  };

  Configurator.prototype.buildOption = function (s, o) {
    var self = this, src = this.thumbFor(s, o), allowed = this.isAllowed(o);
    var b = el('button', {
      type: 'button', class: 'mm-opt', 'data-id': o.id, 'aria-pressed': 'false', 'aria-disabled': allowed ? null : 'true',
      onclick: function () {
        if (!allowed) { self.toast(o.stock === false ? o.label + ' : bientôt de retour en stock' : (o.hint || o.description || o.label + ' : incompatible avec votre sélection actuelle')); return; }
        self.choose(s.id, o.id);
      },
      onmouseenter: function (e) { self.tip(o, e.currentTarget); }, onmouseleave: function () { self.tip(null); },
      onfocus: function (e) { self.tip(o, e.currentTarget); }, onblur: function () { self.tip(null); }
    }, [
      el('span', { class: 'mm-opt-img' }, [src ? el('img', { src: src, alt: '', loading: 'lazy', decoding: 'async' }) : null]),
      el('span', { class: 'mm-opt-name', text: o.label }),
      o.price ? el('span', { class: 'mm-opt-price', text: (s.priceMode === 'absolute' ? '' : '+ ') + price(o.price) }) : null,
      o.badge ? el('span', { class: 'mm-opt-badge', text: o.badge }) : null,
      o.stock === false ? el('span', { class: 'mm-opt-badge mm-out', text: 'Épuisé' }) : null
    ]);
    return b;
  };

  Configurator.prototype.tip = function (o, anchor) {
    if (!this.tipEl) { this.tipEl = el('div', { class: 'mm-tip', role: 'tooltip' }); document.body.appendChild(this.tipEl); }
    if (!o || !matchMedia('(hover: hover)').matches) { this.tipEl.hidden = true; return; }
    var html = '<strong>' + esc(o.label) + '</strong>' + (o.price ? ' <span>+ ' + price(o.price) + '</span>' : '');
    if (o.description) html += '<p>' + esc(o.description) + '</p>';
    if (o.movement) html += '<p>Mouvement : Seiko ' + esc(o.movement) + '</p>';
    if (o.specs) html += '<dl>' + Object.keys(o.specs).map(function (k) { return '<dt>' + esc(SPEC_LABELS[k] || k) + '</dt><dd>' + esc(o.specs[k]) + '</dd>'; }).join('') + '</dl>';
    if (!this.isAllowed(o) && o.hint) html += '<p class="mm-tip-warn">' + esc(o.hint) + '</p>';
    this.tipEl.innerHTML = html;
    this.tipEl.hidden = false;
    var r = anchor.getBoundingClientRect(), tw = this.tipEl.offsetWidth, th = this.tipEl.offsetHeight;
    var x = Math.max(8, Math.min(innerWidth - tw - 8, r.left + r.width / 2 - tw / 2)), y = r.top - th - 8;
    if (y < 8) y = r.bottom + 8;
    this.tipEl.style.transform = 'translate(' + Math.round(x + scrollX) + 'px,' + Math.round(y + scrollY) + 'px)';
  };

  Configurator.prototype.buildLogoUI = function (s) {
    var self = this, L = function () { return self.logo; };
    var file = el('input', { type: 'file', accept: 'image/png', class: 'mm-file', id: 'mm-logo-file' });
    file.addEventListener('change', function () {
      var f = file.files[0];
      if (!f) return;
      if (f.type !== 'image/png') { self.toast('Format accepté : PNG avec fond transparent.'); return; }
      if (f.size > 2 * 1024 * 1024) { self.toast('Fichier trop lourd (2 Mo maximum).'); return; }
      var rd = new FileReader();
      rd.onload = function () {
        var img = new Image();
        img.onload = function () { self.logo = { kind: 'image', img: img, dataUrl: rd.result, file: f, name: f.name, x: 0, y: 0.3, s: 1 }; self.renderAll(); };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    });
    var text = el('input', { type: 'text', maxlength: '18', class: 'mm-input', placeholder: 'Ex. : MIGMODS, vos initiales…', 'aria-label': 'Texte du cadran', value: L() && L().kind === 'text' ? L().text : '' });
    var font = el('select', { class: 'mm-input', 'aria-label': 'Police' }, [el('option', { value: 'serif', text: 'Serif élégante' }), el('option', { value: 'sans', text: 'Capitales espacées' }), el('option', { value: 'script', text: 'Italique' })]);
    var color = el('select', { class: 'mm-input', 'aria-label': 'Couleur' }, [['#ffffff', 'Blanc'], ['#111111', 'Noir'], ['#c9a45c', 'Doré'], ['#d0d3d8', 'Acier'], ['#d49a89', 'Or rose']].map(function (c) { return el('option', { value: c[0], text: c[1] }); }));
    if (L() && L().kind === 'text') { font.value = L().font; color.value = L().color; }
    function applyText() {
      var v = text.value.trim();
      if (!v) { if (L() && L().kind === 'text') { self.logo = null; self.renderAll(); } return; }
      var cur = L() && L().kind === 'text' ? L() : { kind: 'text', x: 0, y: 0.3, s: 1 };
      cur.text = v; cur.font = font.value; cur.color = color.value;
      self.logo = cur; self.renderAll();
    }
    text.addEventListener('input', applyText); font.addEventListener('change', applyText); color.addEventListener('change', applyText);
    var size = el('input', { type: 'range', min: '0.4', max: '2.2', step: '0.05', value: L() ? L().s : 1, class: 'mm-range', 'aria-label': 'Taille' });
    size.addEventListener('input', function () { if (L()) { L().s = +size.value; self.draw(); self.syncUrl(); } });
    return el('div', { class: 'mm-logo' }, [
      el('div', { class: 'mm-logo-row' }, [el('label', { class: 'mm-btn mm-btn-line', for: 'mm-logo-file', text: 'Importer un PNG' }), file, el('span', { class: 'mm-small', text: 'Fond transparent, 2 Mo max.' })]),
      el('p', { class: 'mm-or', text: 'ou' }),
      text,
      el('div', { class: 'mm-logo-row' }, [font, color]),
      el('label', { class: 'mm-small' }, ['Taille', size]),
      el('p', { class: 'mm-small', text: 'Faites glisser le logo sur l\'aperçu pour le placer. Un seul élément par cadran.' })
    ]);
  };

  Configurator.prototype.open = function (id, scroll) {
    var self = this;
    this.openStep = id;
    this.steps.forEach(function (s) {
      var on = s.id === id;
      s._el.head.setAttribute('aria-expanded', on ? 'true' : 'false');
      s._el.wrap.classList.toggle('is-open', on);
      if (on) self.buildStepBody(s);
      s._el.body.hidden = !on;
    });
    this.refreshOptions();
    if (id) this.preloadAround(id);
    if (this.calib) this.refreshCalib();
    if (scroll && id) {
      var h = this.byId[id]._el.wrap;
      setTimeout(function () {
        var r = h.getBoundingClientRect(), top = matchMedia('(max-width: 899px)').matches ? self.previewEl.offsetHeight + 8 : 16;
        if (r.top < top || r.top > innerHeight * 0.6) scrollTo({ top: scrollY + r.top - top, behavior: 'smooth' });
      }, 30);
    }
    this.draw();
  };
  Configurator.prototype.next = function (id) {
    var vis = this.visibleSteps(), i = vis.map(function (s) { return s.id; }).indexOf(id);
    this.open(vis[i + 1] ? vis[i + 1].id : null, true);
    if (!vis[i + 1]) this.root.querySelector('.mm-recap').open = true;
  };
  Configurator.prototype.preloadAround = function (id) {
    var vis = this.visibleSteps(), i = vis.indexOf(this.byId[id]), self = this;
    vis.slice(i, i + 2).forEach(function (s) {
      s.options.forEach(function (o) { if (!self.isHidden(o)) { var im = self.imageFor(s, o); if (im && o.image) loadImage(im.src); } });
    });
  };

  Configurator.prototype.refreshOptions = function () {
    var s = this.byId[this.openStep], self = this;
    if (!s || s.type === 'logo') return;
    var v = this.sel[s.id];
    s._el.body.querySelectorAll('.mm-opt').forEach(function (b) {
      var id = b.getAttribute('data-id'), on = Array.isArray(v) ? v.indexOf(id) >= 0 : v === id;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-off', !self.isAllowed(s.index[id]));
    });
    var o = this.opt(s.id), det = s._el.detail;
    if (!det) return;
    det.innerHTML = '';
    if (o && (o.specs || o.description || o.movement)) {
      if (o.description) det.appendChild(el('p', { text: o.description }));
      if (o.movement) det.appendChild(el('p', { class: 'mm-small', text: 'Mouvement imposé : Seiko ' + o.movement }));
      if (o.specs) det.appendChild(el('dl', { class: 'mm-specs' }, Object.keys(o.specs).reduce(function (a, k) { a.push(el('dt', { text: SPEC_LABELS[k] || k }), el('dd', { text: o.specs[k] })); return a; }, [])));
    }
    var rem = s._el.body.querySelector('.mm-remove');
    if (rem) rem.disabled = v == null || (Array.isArray(v) && !v.length);
  };

  Configurator.prototype.renderAll = function () {
    var self = this, vis = this.visibleSteps(), n = 0, done = 0, total = 0;
    if (this.openStep && !this.isVisible(this.byId[this.openStep])) this.openStep = null;
    this.steps.forEach(function (s) {
      var on = vis.indexOf(s) >= 0, v = self.sel[s.id];
      s._el.wrap.hidden = !on;
      if (!on) return;
      s._el.num.textContent = String(++n).padStart(2, '0');
      var filled = s.type === 'logo' ? !!self.logo : Array.isArray(v) ? v.length > 0 : v != null;
      var sum = '';
      if (s.type === 'logo') sum = self.logo ? (self.logo.kind === 'text' ? '« ' + self.logo.text + ' »' : 'Logo importé') : 'Facultatif';
      else if (Array.isArray(v)) sum = v.length ? v.map(function (id) { return s.index[id].label.replace(/^Gravure /, ''); }).join(', ') : 'Facultatif';
      else if (v != null) { var o = s.index[v]; sum = o.label + (s.priceMode === 'absolute' ? ' · ' + price(o.price) : o.price ? ' · + ' + price(o.price) : ''); }
      else sum = s.required ? 'À choisir' : s.recommended ? 'Conseillé' : 'Facultatif';
      s._el.sum.textContent = sum;
      s._el.wrap.classList.toggle('is-done', filled);
      if (s.required || s.recommended) { total++; if (filled) done++; }
    });
    if (this.openStep && this.byId[this.openStep]._el.body.hidden === false) {
      var os = this.byId[this.openStep];
      if (os.type !== 'logo') this.buildStepBody(os);
      this.refreshOptions();
    }
    this.progressBar.style.width = (total ? done / total * 100 : 0) + '%';
    this.progressTxt.textContent = done + ' / ' + total + ' étapes essentielles complétées';
    var t = price(this.total());
    this.totalEl.textContent = t;
    this.recapTotal.textContent = t;
    this.mvtEl.textContent = 'Mouvement : ' + this.movementLabel();
    this.recapList.innerHTML = '';
    this.lines().forEach(function (l) {
      self.recapList.appendChild(el('li', {}, [el('span', { class: 'mm-recap-step', text: l.step.label }), el('span', { class: 'mm-recap-name', text: l.label }), el('span', { class: 'mm-recap-price', text: l.price ? price(l.price) : 'Inclus' })]));
    });
    self.recapList.appendChild(el('li', { class: 'mm-recap-mvt' }, [el('span', { class: 'mm-recap-step', text: 'Mouvement' }), el('span', { class: 'mm-recap-name', text: this.movementLabel() }), el('span', { class: 'mm-recap-price', text: 'Inclus' })]));
    this.canvas.setAttribute('aria-label', 'Aperçu : ' + this.lines().map(function (l) { return l.label; }).join(', '));
    this.updateLayers();
    this.syncUrl();
    if (this.calib) this.refreshCalib();
  };

  // --- interactions aperçu : zoom / déplacement / logo
  Configurator.prototype.toggleZoom = function () {
    this.view.z = this.view.z > 1 ? 1 : 2;
    this.view.x = this.view.y = 0;
    this.zoomBtn.setAttribute('aria-pressed', this.view.z > 1 ? 'true' : 'false');
    this.previewEl.classList.toggle('is-zoomed', this.view.z > 1);
    this.draw();
  };
  Configurator.prototype.toStage = function (e) {
    var r = this.canvas.getBoundingClientRect(), v = this.view;
    var x = (e.clientX - r.left) / r.width * STAGE - 500, y = (e.clientY - r.top) / r.height * STAGE - 500;
    var a = -v.rot * Math.PI / 180, rx = x * Math.cos(a) - y * Math.sin(a), ry = x * Math.sin(a) + y * Math.cos(a);
    return { x: rx / v.z + 500 - v.x, y: ry / v.z + 500 - v.y };
  };
  Configurator.prototype.bindCanvas = function () {
    var self = this, drag = null, pts = {};
    var c = this.canvas;
    c.addEventListener('pointerdown', function (e) {
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var p = self.toStage(e), L = self.logo, b = L && L.box;
      if (b && p.x > b[0] - 20 && p.x < b[0] + b[2] + 20 && p.y > b[1] - 20 && p.y < b[1] + b[3] + 20) drag = { kind: 'logo', p: p, x: L.x, y: L.y };
      else if (self.view.z > 1) drag = { kind: 'pan', cx: e.clientX, cy: e.clientY, x: self.view.x, y: self.view.y };
      else return;
      c.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    c.addEventListener('pointermove', function (e) {
      if (pts[e.pointerId]) pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2 && self.logo && drag && drag.kind === 'logo') {
        var a = pts[ids[0]], b = pts[ids[1]], dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (drag.dist) self.logo.s = Math.max(0.4, Math.min(2.2, drag.s * dist / drag.dist)); else { drag.dist = dist; drag.s = self.logo.s; }
        self.draw(); return;
      }
      if (!drag) return;
      if (drag.kind === 'logo') {
        var p = self.toStage(e), R = self.family().geometry.dial / 2;
        var nx = drag.x + (p.x - drag.p.x) / R, ny = drag.y + (p.y - drag.p.y) / R, m = Math.hypot(nx, ny);
        if (m > 0.8) { nx *= 0.8 / m; ny *= 0.8 / m; }
        self.logo.x = nx; self.logo.y = ny;
      } else {
        var r = c.getBoundingClientRect();
        self.view.x = Math.max(-250, Math.min(250, drag.x + (e.clientX - drag.cx) / r.width * STAGE / self.view.z));
        self.view.y = Math.max(-400, Math.min(400, drag.y + (e.clientY - drag.cy) / r.height * STAGE / self.view.z));
      }
      self.draw();
    });
    function end(e) { delete pts[e.pointerId]; if (drag) { drag = null; self.syncUrl(); } }
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', function (e) {
      if (!self.logo || self.openStep !== 'custom_logo') return;
      e.preventDefault();
      self.logo.s = Math.max(0.4, Math.min(2.2, self.logo.s * (e.deltaY < 0 ? 1.06 : 0.94)));
      self.draw();
    }, { passive: false });
    c.addEventListener('dblclick', function () { self.toggleZoom(); });
  };

  // --- export / partage
  Configurator.prototype.download = function () {
    try {
      var url = this.exportPng().toDataURL('image/png');
      var a = el('a', { href: url, download: 'migmods-ma-montre.png' });
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { this.toast('Export impossible dans ce navigateur.'); }
  };
  Configurator.prototype.openShare = function () {
    var self = this, url = this.shareUrl(), msg = 'Ma montre MigMods sur-mesure : ' + url, enc = encodeURIComponent;
    var link = function (label, href) { return el('a', { class: 'mm-share-link', href: href, target: '_blank', rel: 'noopener', text: label }); };
    var box = el('div', { class: 'mm-share' }, [
      el('label', { class: 'mm-small', for: 'mm-share-url', text: 'Lien de votre configuration' }),
      el('div', { class: 'mm-logo-row' }, [
        el('input', { class: 'mm-input', id: 'mm-share-url', value: url, readonly: true, onfocus: function (e) { e.target.select(); } }),
        el('button', { type: 'button', class: 'mm-btn mm-btn-line', text: 'Copier', onclick: function (e) {
          var b = e.currentTarget;
          (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { b.textContent = 'Copié ✓'; }, function () { document.getElementById('mm-share-url').select(); document.execCommand('copy'); b.textContent = 'Copié ✓'; });
        } })
      ]),
      el('div', { class: 'mm-share-grid' }, [
        link('WhatsApp', 'https://wa.me/?text=' + enc(msg)),
        link('Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url)),
        link('Pinterest', 'https://pinterest.com/pin/create/button/?url=' + enc(url) + '&description=' + enc('Montre Seiko mod sur-mesure MigMods')),
        el('button', { type: 'button', class: 'mm-share-link', text: 'Instagram', onclick: function () { self.shareImage(); } })
      ])
    ]);
    this.modal('Partager ma montre', box);
  };
  Configurator.prototype.shareImage = function () {
    var self = this;
    this.exportPng().toBlob(function (blob) {
      var file = blob && new File([blob], 'migmods-ma-montre.png', { type: 'image/png' });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], text: 'Ma montre MigMods', url: self.shareUrl() }).catch(function () {});
      else { self.download(); self.toast('Image téléchargée : publiez-la en story ou en post Instagram.'); }
    });
  };

  // --- panier
  Configurator.prototype.addToCart = function (confirmed) {
    var self = this;
    var missingReq = this.visibleSteps().filter(function (s) { return s.required && s.type !== 'logo' && self.sel[s.id] == null; });
    if (missingReq.length) { this.toast('À choisir : ' + missingReq.map(function (s) { return s.label; }).join(', ')); this.open(missingReq[0].id, true); return; }
    var missing = this.visibleSteps().filter(function (s) { return s.recommended && self.sel[s.id] == null; });
    if (missing.length && !confirmed) {
      var m;
      var list = el('ul', { class: 'mm-reco' }, missing.map(function (s) {
        return el('li', {}, [el('button', { type: 'button', class: 'mm-link', text: s.label, onclick: function () { m.close(); self.open(s.id, true); } }), s.help ? el('span', { class: 'mm-small', text: ' — ' + s.help }) : null]);
      }));
      m = this.modal((this.data.texts || {}).recommendTitle || 'Voici les options que nous vous conseillons de compléter', el('div', {}, [
        list,
        el('div', { class: 'mm-actions' }, [
          el('button', { type: 'button', class: 'mm-btn mm-btn-line', text: 'Non, je complète', onclick: function () { m.close(); self.open(missing[0].id, true); } }),
          el('button', { type: 'button', class: 'mm-btn mm-btn-primary', text: 'Oui, je confirme', onclick: function () { m.close(); self.addToCart(true); } })
        ])
      ]));
      return;
    }
    var payload = this.cartPayload();
    var ev = new CustomEvent('migmods:add-to-cart', { detail: payload, cancelable: true });
    if (!this.root.dispatchEvent(ev)) return;
    if (this.o.onAddToCart) { this.o.onAddToCart(payload, this); return; }
    var pre = el('pre', { class: 'mm-pre', text: JSON.stringify(payload, null, 2) });
    this.modal('Prototype : contenu envoyé au panier', el('div', {}, [
      el('p', { class: 'mm-small', text: 'Phase 1 : pas encore de boutique branchée. En phase 2, ces lignes partent en un seul appel /cart/add.js vers Shopify.' }),
      pre
    ]));
  };
  // Structure prête pour Shopify : 1 ligne « montre » portant toute la configuration + 1 ligne par composant payant.
  Configurator.prototype.cartPayload = function () {
    var self = this, id = 'MM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var props = { _config_id: id, _role: 'montre' };
    this.lines().forEach(function (l) {
      var k = l.step.label;
      props[k] = props[k] ? props[k] + ', ' + l.label : l.label;
    });
    props.Mouvement = this.movementLabel();
    props['Lien de la configuration'] = this.shareUrl();
    var map = this.o.variants || {};
    var items = [{ id: map.base || 'VARIANTE_MONTRE_SUR_MESURE', quantity: 1, properties: props }];
    this.lines().forEach(function (l) {
      if (!l.price) return;
      var key = l.opt ? l.step.id + '/' + l.opt.id : l.step.id;
      items.push({ id: map[key] || 'VARIANTE:' + key, quantity: 1, properties: { _config_id: id, _role: 'composant', _composant: l.step.label + ' : ' + l.label } });
    });
    return { config_id: id, total: this.total(), items: items, logo: this.logo && this.logo.kind === 'image' ? { name: this.logo.name, dataUrl: this.logo.dataUrl } : null };
  };

  // --- modale / toast
  Configurator.prototype.modal = function (title, content) {
    var self = this, prev = document.activeElement;
    var closeBtn = el('button', { type: 'button', class: 'mm-modal-x', 'aria-label': 'Fermer', html: '&times;' });
    var dlg = el('div', { class: 'mm-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
      el('div', { class: 'mm-modal-card' }, [el('h2', { class: 'mm-modal-title', text: title }), closeBtn, content])
    ]);
    var api = { close: function () { dlg.remove(); document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); } };
    function onKey(e) { if (e.key === 'Escape') api.close(); }
    closeBtn.onclick = api.close;
    dlg.addEventListener('click', function (e) { if (e.target === dlg) api.close(); });
    document.addEventListener('keydown', onKey);
    self.root.appendChild(dlg);
    closeBtn.focus();
    return api;
  };
  Configurator.prototype.toast = function (msg) {
    var t = this.toastEl;
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(this._tt);
    this._tt = setTimeout(function () { t.classList.remove('is-on'); }, 2600 + msg.length * 25);
  };

  // --- mode calage (?calibrer=1) : régler cx, cy, taille, angle d'une image et copier la valeur « calage »
  Configurator.prototype.buildCalib = function () {
    var self = this;
    this.calibEl = el('div', { class: 'mm-calib' });
    this.calibEl.addEventListener('input', function (e) {
      var o = self._calibOpt; if (!o) return;
      var f = o.fit || (o.fit = {});
      f[e.target.name] = +e.target.value;
      var L = self.layers[o.step]; if (L) L.fit = f;
      self.calibEl.querySelector('code').textContent = [f.cx, f.cy, f.d].concat(f.angle ? [f.angle] : []).join(',');
      self.draw();
    });
    return this.calibEl;
  };
  Configurator.prototype.refreshCalib = function () {
    var s = this.byId[this.openStep], o = s && this.opt(s.id), box = this.calibEl, self = this;
    box.innerHTML = '';
    if (!o || !o.image) { box.appendChild(el('p', { text: 'Calage : ouvrez une étape dont le composant choisi a une image.' })); this._calibOpt = null; return; }
    this._calibOpt = o;
    loadImage(o.image).then(function (img) {
      if (!img || self._calibOpt !== o) return;
      var f = o.fit || (o.fit = { cx: img.naturalWidth / 2, cy: img.naturalHeight / 2, d: img.naturalWidth });
      box.appendChild(el('p', {}, [el('strong', { text: s.label + ' · ' + o.label })]));
      [['cx', 0, img.naturalWidth], ['cy', 0, img.naturalHeight], ['d', 10, img.naturalWidth * 1.5], ['angle', -180, 180]].forEach(function (r) {
        box.appendChild(el('label', {}, [r[0], el('input', { type: 'range', name: r[0], min: r[1], max: r[2], step: '0.5', value: f[r[0]] || 0 })]));
      });
      box.appendChild(el('p', {}, ['calage = ', el('code', { text: [f.cx, f.cy, f.d].concat(f.angle ? [f.angle] : []).join(',') })]));
      box.appendChild(el('p', { class: 'mm-small', text: 'Copiez cette valeur dans la colonne « calage » du catalogue.' }));
    });
  };

  // ---------------------------------------------------------------- démarrage
  function boot() {
    document.querySelectorAll('[data-migmods-configurator]').forEach(function (root) {
      if (root._mm) return;
      var opts = Object.assign({}, window.MIGMODS_OPTIONS || {});
      var c = new Configurator(root, opts);
      root._mm = c;
      var src = root.getAttribute('data-src') || 'components.json';
      var inline = root.querySelector('script[type="application/json"][data-mm-components]');
      var shop = root.querySelector('script[type="application/json"][data-mm-shopify]');
      var extra = shop ? JSON.parse(shop.textContent) : null;
      (inline ? Promise.resolve(JSON.parse(inline.textContent)) : fetch(src).then(function (r) { return r.json(); }))
        .then(function (data) {
          if (extra) applyShopify(data, extra, c.o);
          c.init(data);
        })
        .catch(function (e) { root.textContent = 'Impossible de charger les composants (' + e.message + '). Ouvrez la page via un serveur local : voir README.'; });
    });
  }
  // ---------------------------------------------------------------- Shopify
  // extra = { assetBase, cartUrl, variants: { base, 'step/id': id }, prices: { 'step/id': 12.5 }, options: [metaobjets] }
  // Les metaobjets « watch_component » modifient (prix, stock, image…) ou ajoutent des composants.
  // Le prix d'une variante Shopify l'emporte toujours : c'est lui qui sera facturé.
  function applyShopify(data, extra, o) {
    var byId = {};
    data.steps.forEach(function (s) { byId[s.id] = s; });
    (extra.options || []).forEach(function (m) {
      var s = byId[m.step];
      if (!s || !m.id) return;
      var cur = s.options.filter(function (x) { return x.id === m.id; })[0];
      if (!cur) {
        if (!m.label) return;
        cur = { id: m.id, label: m.label, price: 0 };
        s.options.push(cur);
        if (m.group && s.groups && s.groups.indexOf(m.group) < 0) s.groups.push(m.group);
      }
      if (typeof m.specs === 'string') m.specs = m.specs.split(/\n|\|/).reduce(function (a, l) { var i = l.indexOf('='); if (i < 0) i = l.indexOf(':'); if (i > 0) a[l.slice(0, i).trim()] = l.slice(i + 1).trim(); return a; }, {});
      if (typeof m.fit === 'string') { var n = m.fit.split(/[,\s]+/).map(Number); m.fit = n.length >= 3 && n.every(isFinite) ? { cx: n[0], cy: n[1], d: n[2], angle: n[3] || 0 } : null; }
      if (m.fit && m.fitW) m.fit.w = m.fitW;
      delete m.fitW;
      Object.keys(m).forEach(function (k) { if (k !== 'step' && m[k] !== null && m[k] !== '') cur[k] = m[k]; });
    });
    var prices = extra.prices || {};
    data.steps.forEach(function (s) {
      s.options.forEach(function (x) { var p = prices[s.id + '/' + x.id]; if (typeof p === 'number') x.price = p; });
    });
    if (extra.texts) Object.keys(extra.texts).forEach(function (k) { if (extra.texts[k]) (data.texts = data.texts || {})[k] = extra.texts[k]; });
    o.assetBase = extra.assetBase;
    o.variants = Object.assign({}, extra.variants || {}, o.variants || {});
    o.updateUrl = o.updateUrl !== false;
    if (!o.onAddToCart) o.onAddToCart = function (payload, c) { shopifyAdd(payload, c, extra); };
  }

  function shopifyAdd(payload, c, extra) {
    var missing = payload.items.filter(function (it) { return typeof it.id !== 'number'; });
    if (missing.length) {
      c.toast('Commande impossible pour le moment : un composant n\'est pas encore relié à la boutique (' + missing.map(function (m) { return String(m.id).replace('VARIANTE:', ''); }).join(', ') + '). Contactez-nous.');
      if (window.console) console.warn('[MigMods] variantes manquantes', missing);
      return;
    }
    c.cartBtn.disabled = true;
    c.cartBtn.textContent = 'Ajout…';
    var done = function () { location.href = extra.cartUrl || '/cart'; };
    var fail = function (msg) { c.cartBtn.disabled = false; c.cartBtn.textContent = 'Ajouter au panier'; c.toast(msg || 'L\'ajout au panier a échoué. Réessayez ou contactez-nous.'); };
    var json = function () {
      if (payload.logo) payload.items[0].properties.Logo = 'Logo importé (' + payload.logo.name + ') : à nous renvoyer par e-mail après la commande';
      return fetch((extra.cartAddUrl || '/cart/add') + '.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: payload.items }) })
        .then(function (r) { return r.ok ? done() : r.json().then(function (e) { fail(e.description); }); });
    };
    // 1er essai : FormData avec l'aperçu et le logo en fichiers (visibles dans la commande).
    c.exportPng().toBlob(function (blob) {
      var fd = new FormData();
      payload.items.forEach(function (it, i) {
        fd.append('items[' + i + '][id]', it.id);
        fd.append('items[' + i + '][quantity]', it.quantity);
        Object.keys(it.properties).forEach(function (k) { fd.append('items[' + i + '][properties][' + k + ']', it.properties[k]); });
      });
      if (blob) fd.append('items[0][properties][Aperçu]', blob, payload.config_id + '.png');
      if (payload.logo && c.logo && c.logo.file) fd.append('items[0][properties][Logo]', c.logo.file, c.logo.file.name);
      fetch((extra.cartAddUrl || '/cart/add') + '.js', { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
        .then(function (r) { return r.ok ? done() : json(); })
        .catch(json);
    }, 'image/png');
  }

  window.MigModsConfigurator = Configurator;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
