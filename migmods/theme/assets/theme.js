/* MIGMODS — theme.js : API commune window.Mig et comportements globaux (DESIGN-SYSTEM.md §2.3 et chap. 7).
   Vanilla, sans dépendance, chargé en defer. Rien de propre à une section : voir assets/section-<nom>.js.
   Mig.reveal(racine) branche aussi, dans la racine donnée, tous les comportements globaux (apparitions, images
   différées, lumière au pointeur, disque de date, cadrans, horloges, rails) : à appeler après tout rendu partiel. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, win = window;
  var cfg = win.MigConfig || {}, routes = cfg.routes || {};
  var mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  var hasIO = 'IntersectionObserver' in win;

  function emit(name, detail) { doc.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  function listen(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(sel)); }
  function within(scope, sel) { var list = $$(sel, scope); if (scope && scope.matches && scope.matches(sel)) list.unshift(scope); return list; }

  var Mig = win.Mig = win.Mig || {};

  /* ---------- préférences de mouvement, pause globale (§7.7) */
  Mig.reduced = mqReduced.matches;
  Mig.fine = mqFine.matches;
  Mig.isStill = function () { return root.classList.contains('is-still') || Mig.reduced; };
  Mig.setStill = function (on) {
    on = !!on;
    root.classList.toggle('is-still', on);
    try { localStorage.setItem('mig-still', on ? '1' : '0'); } catch (e) { /* stockage indisponible */ }
    syncStill();
    emit('mig:still', { still: Mig.isStill() });
  };
  function syncStill() {
    var still = Mig.isStill();
    $$('[data-still-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', still ? 'true' : 'false'); });
  }
  listen(mqReduced, function () { Mig.reduced = mqReduced.matches; syncStill(); emit('mig:still', { still: Mig.isStill() }); });
  listen(mqFine, function () { Mig.fine = mqFine.matches; });
  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-still-toggle]');
    if (t) { e.preventDefault(); Mig.setStill(!root.classList.contains('is-still')); }
  });

  /* ---------- annonces pour lecteurs d'écran */
  Mig.announce = function (text) {
    var live = doc.getElementById('mig-live');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 60);
  };

  /* ---------- prix : format de la boutique, sans zéros inutiles, U+00A0 avant « € » */
  Mig.money = function (cents) {
    var v = (Number(cents) || 0) / 100, whole = Math.round(v * 100) % 100 === 0;
    var format = String(cfg.moneyFormat || '{{amount_with_comma_separator}} €');
    function num(n, dec, thousands, sep) {
      var parts = n.toFixed(dec).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return parts.length > 1 ? parts[0] + sep + parts[1] : parts[0];
    }
    var out = format.replace(/\{\{\s*(\w+)\s*\}\}/, function (m, key) {
      var d = whole ? 0 : 2;
      switch (key) {
        case 'amount_no_decimals': return num(Math.round(v), 0, ',', '.');
        case 'amount_with_comma_separator': return num(v, d, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return num(Math.round(v), 0, '.', ',');
        case 'amount_with_space_separator': return num(v, d, ' ', ',');
        case 'amount_no_decimals_with_space_separator': return num(Math.round(v), 0, ' ', ',');
        case 'amount_with_period_and_space_separator': return num(v, d, ' ', '.');
        case 'amount_with_apostrophe_separator': return num(v, d, '’', '.');
        default: return num(v, d, ',', '.');
      }
    });
    out = out.replace(/<[^>]*>/g, '').replace(/&euro;/g, '€').replace(/&nbsp;/g, ' ');
    return out.replace(/[  ]*€/g, ' €').trim();
  };

  /* ---------- Section Rendering API */
  Mig.sections = function (ids, url) {
    ids = [].concat(ids);
    var u = new URL(url || location.href, location.href);
    u.searchParams.set('sections', ids.join(','));
    return fetch(u.toString(), { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  };

  /* ---------- panier (émet mig:cart avec le panier /cart.js) */
  function request(url, body) {
    var form = typeof FormData !== 'undefined' && body instanceof FormData;
    return fetch(url, {
      method: 'POST',
      headers: form ? { Accept: 'application/json' } : { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: form ? body : JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) {
          var err = new Error(data.description || data.message || ('HTTP ' + r.status));
          err.status = r.status; err.data = data;
          throw err;
        }
        return data;
      });
    });
  }
  function getCart() {
    return fetch((routes.cart || '/cart') + '.js', { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function publish(cart) { emit('mig:cart', cart); return cart; }
  Mig.cart = {
    get: getCart,
    add: function (data) {
      var body = (typeof FormData !== 'undefined' && data instanceof FormData) ? data
        : Array.isArray(data) ? { items: data } : (data && data.items) ? data : { items: [data] };
      return request(routes.cartAdd || '/cart/add.js', body).then(function (added) {
        return getCart().then(function (cart) { cart.added = added; return publish(cart); });
      });
    },
    change: function (o) { return request(routes.cartChange || '/cart/change.js', o).then(publish); },
    update: function (updates) {
      return request(routes.cartUpdate || '/cart/update.js', updates && updates.updates ? updates : { updates: updates }).then(publish);
    }
  };

  /* ---------- dialogues (<dialog> + showModal, §6.15) */
  var openers = new WeakMap();
  function openDialogs() { return $$('dialog[open]'); }
  Mig.dialog = {
    open: function (dlg, opener) {
      if (!dlg || dlg.open) return;
      openers.set(dlg, opener || doc.activeElement);
      dlg.classList.remove('is-closing');
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      root.classList.add('has-dialog');
      if (opener && opener.hasAttribute && opener.hasAttribute('aria-expanded')) opener.setAttribute('aria-expanded', 'true');
    },
    close: function (dlg) {
      if (!dlg || !dlg.open || dlg.classList.contains('is-closing')) return;
      var finish = function () {
        dlg.classList.remove('is-closing');
        dlg.style.transform = '';
        if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else { dlg.removeAttribute('open'); afterClose(dlg); } }
      };
      if (Mig.reduced) return finish();
      dlg.classList.add('is-closing');
      var timer = setTimeout(finish, 320);
      dlg.addEventListener('animationend', function end(e) {
        if (e.target !== dlg) return;
        dlg.removeEventListener('animationend', end);
        clearTimeout(timer);
        finish();
      });
    }
  };
  function afterClose(dlg) {
    if (!openDialogs().length) root.classList.remove('has-dialog');
    var opener = openers.get(dlg);
    if (opener) {
      if (opener.hasAttribute && opener.hasAttribute('aria-expanded')) opener.setAttribute('aria-expanded', 'false');
      if (opener.focus && doc.contains(opener)) opener.focus({ preventScroll: true });
      openers.delete(dlg);
    }
  }
  doc.addEventListener('close', function (e) { if (e.target && e.target.tagName === 'DIALOG') afterClose(e.target); }, true);
  doc.addEventListener('cancel', function (e) {
    var dlg = e.target;
    if (dlg && dlg.tagName === 'DIALOG' && dlg.classList.contains('sheet')) { e.preventDefault(); Mig.dialog.close(dlg); }
  }, true);
  doc.addEventListener('click', function (e) {
    var closer = e.target.closest && e.target.closest('[data-sheet-close]');
    if (closer) { Mig.dialog.close(closer.closest('dialog')); return; }
    var dlg = e.target;
    if (dlg && dlg.tagName === 'DIALOG' && dlg.open && dlg.classList.contains('sheet')) {
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) Mig.dialog.close(dlg);
    }
  });
  /* glisser la poignée vers le bas de plus de 80 px ferme la feuille (téléphone) */
  doc.addEventListener('pointerdown', function (e) {
    var handle = e.target.closest && e.target.closest('.sheet__handle');
    var dlg = handle && handle.closest('dialog');
    if (!dlg || !dlg.open) return;
    var y0 = e.clientY, dy = 0;
    try { handle.setPointerCapture(e.pointerId); } catch (err) { /* sans capture */ }
    function move(ev) { dy = Math.max(0, ev.clientY - y0); dlg.style.transform = 'translateY(' + dy + 'px)'; }
    function up() {
      handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up);
      if (dy > 80) Mig.dialog.close(dlg); else dlg.style.transform = '';
    }
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
  });

  /* ---------- apparitions [data-reveal] (§7.1) : ce qui est déjà à l'écran n'est jamais caché */
  var revealIO = hasIO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && (e.intersectionRatio >= 0.15 || e.intersectionRect.height > innerHeight * 0.25)) {
        e.target.classList.add('is-in'); revealIO.unobserve(e.target);
      }
    });
  }, { threshold: [0, 0.15], rootMargin: '0px 0px -8% 0px' }) : null;

  function wireReveal(scope) {
    within(scope, '[data-reveal]:not(.is-in)').forEach(function (el) {
      if (!revealIO || el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
      else revealIO.observe(el);
    });
  }

  /* ---------- images différées : fondu à l'arrivée (.is-loaded) */
  function wireImages(scope) {
    within(scope, 'img[loading="lazy"]:not(.is-loaded)').forEach(function (img) {
      var ok = function () { img.classList.add('is-loaded'); };
      if (img.complete) ok();
      else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', ok, { once: true }); }
    });
  }

  /* ---------- lumière au pointeur [data-light] (§7.2) : variables écrites sur les éléments visibles seulement */
  var lit = new Set(), px = 0, py = 0, raf = 0;
  var lightIO = hasIO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) lit.add(e.target); else lit.delete(e.target); });
  }, { rootMargin: '10%' }) : null;
  function paint() {
    raf = 0;
    lit.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      el.style.setProperty('--lx', Math.max(-0.5, Math.min(1.5, (px - r.left) / r.width)).toFixed(3));
      el.style.setProperty('--ly', Math.max(-0.5, Math.min(1.5, (py - r.top) / r.height)).toFixed(3));
    });
  }
  addEventListener('pointermove', function (e) {
    if (!Mig.fine || Mig.isStill() || !lit.size) return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  function wireLight(scope) { if (lightIO) within(scope, '[data-light]').forEach(function (el) { lightIO.observe(el); }); }

  /* ---------- disque de date [data-disc] (§7.5) : chaque chiffre glisse dans sa colonne masquée */
  var discIO = hasIO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); discIO.unobserve(e.target); } });
  }, { threshold: 0.4 }) : null;
  function buildDisc(host) {
    if (host.querySelector('.disc')) return;
    var value = (host.getAttribute('data-disc') || host.textContent).trim();
    if (!value) return;
    var cs = getComputedStyle(host), chrome = cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text';
    var label = doc.createElement('span'); label.className = 'visually-hidden'; label.textContent = value;
    var disc = doc.createElement('span'); disc.className = 'disc' + (chrome ? ' disc--chrome' : ''); disc.setAttribute('aria-hidden', 'true');
    var k = 0;
    Array.prototype.forEach.call(value, function (ch) {
      if (/\d/.test(ch)) {
        var col = doc.createElement('span'); col.className = 'disc__col';
        var ghost = doc.createElement('span'); ghost.className = 'disc__ghost'; ghost.textContent = ch; col.appendChild(ghost);
        var strip = doc.createElement('span'); strip.className = 'disc__strip';
        strip.style.setProperty('--n', ch); strip.style.setProperty('--k', k++);
        for (var i = 0; i < 10; i++) { var d = doc.createElement('span'); d.textContent = i; strip.appendChild(d); }
        col.appendChild(strip); disc.appendChild(col);
      } else {
        var sep = doc.createElement('span'); sep.className = 'disc__sep'; sep.textContent = ch; disc.appendChild(sep);
      }
    });
    if (chrome) host.style.background = 'none';
    host.textContent = '';
    host.appendChild(label); host.appendChild(disc);
    if (Mig.isStill() || !discIO || host.getBoundingClientRect().top < innerHeight * 0.85) {
      if (Mig.isStill() || !discIO) disc.classList.add('is-in');
      else requestAnimationFrame(function () { requestAnimationFrame(function () { disc.classList.add('is-in'); }); });
    } else discIO.observe(disc);
  }
  function wireDiscs(scope) { within(scope, '[data-disc]').forEach(buildDisc); }

  /* ---------- heure de Paris : horloges [data-clock] (HH:MM, toutes les 15 s) et cadrans [data-watch] */
  var parisFmt = null;
  function paris() {
    try {
      parisFmt = parisFmt || new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Paris' });
      var p = {}; parisFmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { h: +p.hour % 24, m: +p.minute, s: +p.second };
    } catch (e) { var d = new Date(); return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() }; }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var clockTimer = 0;
  function tickClocks() {
    var t = paris(), txt = pad(t.h) + ':' + pad(t.m);
    $$('[data-clock]').forEach(function (c) { if (c.textContent !== txt) c.textContent = txt; });
  }
  function wireClocks(scope) {
    if (!within(scope, '[data-clock]').length) return;
    tickClocks();
    if (!clockTimer) clockTimer = setInterval(tickClocks, 15000);
  }
  function wireWatches(scope) {
    within(scope, '[data-watch]').forEach(function (w) {
      var t = paris(), ms = new Date().getMilliseconds() / 1000;
      w.style.setProperty('--h', ((t.h % 12) * 3600 + t.m * 60 + t.s + ms).toFixed(2));
      w.style.setProperty('--m', (t.m * 60 + t.s + ms).toFixed(2));
      w.style.setProperty('--s', (t.s + ms).toFixed(2));
      w.classList.add('is-live');
    });
  }

  /* ---------- rails [data-rail] (§6.22) : compteur « 01 / 06 » et points, aucun défilement automatique */
  function wireRails(scope) {
    within(scope, '[data-rail]').forEach(function (rail) {
      if (rail._migRail) return;
      rail._migRail = true;
      var track = rail.querySelector('.rail__track'), items = track ? $$('.rail__item', track) : [];
      if (!items.length) return;
      var count = rail.querySelector('[data-rail-count]'), dots = rail.querySelector('[data-rail-dots]'), n = items.length;
      if (dots && !dots.children.length) items.forEach(function () { dots.appendChild(doc.createElement('i')); });
      var ratios = items.map(function () { return 0; });
      var set = function (i) {
        if (count) count.textContent = pad(i + 1) + ' / ' + pad(n);
        if (dots) Array.prototype.forEach.call(dots.children, function (d, j) { d.classList.toggle('is-active', j === i); });
      };
      set(0);
      if (!hasIO) return;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { ratios[items.indexOf(e.target)] = e.intersectionRatio; });
        var best = 0; ratios.forEach(function (r, i) { if (r > ratios[best] + 0.01) best = i; });
        set(best);
      }, { root: track, threshold: [0, 0.25, 0.5, 0.75, 1] });
      items.forEach(function (it) { io.observe(it); });
    });
  }

  /* ---------- champ de texte : agrandissement sans field-sizing */
  if (!(win.CSS && CSS.supports && CSS.supports('field-sizing', 'content'))) {
    doc.addEventListener('input', function (e) {
      var t = e.target;
      if (t && t.tagName === 'TEXTAREA' && t.classList.contains('input')) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; }
    });
  }

  /* ---------- suivi des chemins vers le configurateur [data-cta-origin] */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cta-origin]');
    if (!a) return;
    try { win.Shopify && Shopify.analytics && Shopify.analytics.publish && Shopify.analytics.publish('migmods:cta_configurateur', { origin: a.getAttribute('data-cta-origin') }); } catch (err) { /* sans analytics */ }
  });

  /* ---------- onglet masqué, retour arrière (bfcache) */
  doc.addEventListener('visibilitychange', function () { root.classList.toggle('tab-hidden', doc.hidden); });
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    openDialogs().forEach(function (d) { d.classList.remove('is-closing'); if (d.close) d.close(); });
    root.classList.remove('has-dialog');
    getCart().then(publish).catch(function () { /* panier inchangé */ });
  });

  /* ---------- branchement */
  Mig.reveal = function (scope) {
    scope = scope || doc;
    wireReveal(scope); wireImages(scope); wireLight(scope); wireDiscs(scope); wireWatches(scope); wireClocks(scope); wireRails(scope);
  };
  root.classList.toggle('tab-hidden', doc.hidden);
  syncStill();
  Mig.reveal(doc);
  root.classList.add('reveal-ready');
})();
