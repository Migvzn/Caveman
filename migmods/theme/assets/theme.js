/* MIGMODS — scripts du thème (sans dépendance) */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- en-tête : état au défilement, masqué en descendant, réaffiché en remontant
  var header = document.querySelector('[data-header]');
  var ann = document.querySelector('.announcement');
  if (header) {
    var lastY = scrollY;
    var setAnn = function () { document.documentElement.style.setProperty('--ann-h', ann && scrollY < ann.offsetHeight ? (ann.offsetHeight - scrollY) + 'px' : '0px'); };
    var onScroll = function () {
      var y = scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      if (!header.querySelector('.is-open')) header.classList.toggle('is-hidden', y > 420 && y > lastY + 2);
      if (y < lastY - 2) header.classList.remove('is-hidden');
      lastY = y;
      setAnn();
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', setAnn);
    onScroll();
  }

  // ---------- méga-menu : survol avec délai, clic et clavier
  document.querySelectorAll('.has-mega').forEach(function (item) {
    var trigger = item.querySelector('[data-mega-trigger]'), t;
    var open = function (on) {
      clearTimeout(t);
      item.classList.toggle('is-open', on);
      trigger.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) header.classList.add('is-scrolled');
      else if (scrollY <= 24) header.classList.remove('is-scrolled');
    };
    item.addEventListener('mouseenter', function () { t = setTimeout(function () { open(true); }, 80); });
    item.addEventListener('mouseleave', function () { clearTimeout(t); t = setTimeout(function () { open(false); }, 160); });
    trigger.addEventListener('click', function (e) { if (!item.classList.contains('is-open')) { e.preventDefault(); open(true); } });
    item.addEventListener('keydown', function (e) { if (e.key === 'Escape') { open(false); trigger.focus(); } });
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) open(false); });
  });

  // ---------- menu mobile plein écran
  var menu = document.querySelector('[data-mobile-menu]');
  var openBtn = document.querySelector('[data-menu-open]');
  if (menu && openBtn) {
    var setMenu = function (on) {
      menu.hidden = !on;
      openBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
      document.documentElement.classList.toggle('menu-open', on);
      (on ? menu.querySelector('[data-menu-close]') : openBtn).focus();
    };
    openBtn.addEventListener('click', function () { setMenu(true); });
    menu.querySelector('[data-menu-close]').addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  }

  // ---------- titres découpés mot à mot
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      var last = i === words.length - 1;
      return '<span class="w" aria-hidden="true" style="--wi:' + i + '"><span>' + (last ? '<em>' + w + '</em>' : w) + '</span></span>';
    }).join(' ');
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-in'); }); });
  });

  // ---------- apparitions au défilement
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -4% 0px' });
    reveals.forEach(function (el) { if (el.closest('[data-hero-video]')) el.classList.add('is-in'); });
    reveals.forEach(function (el) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add('is-in'); });

  // ---------- chiffres qui défilent jusqu'à leur valeur
  if (!reduced && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, raw = el.getAttribute('data-count'), target = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
        if (!isFinite(target)) return;
        var t0 = performance.now(), dur = 1400, fmt = new Intl.NumberFormat('fr-FR');
        (function step(now) {
          var k = Math.min(1, (now - t0) / dur), v = target * (1 - Math.pow(1 - k, 4));
          el.textContent = k < 1 ? fmt.format(Math.round(v)) : raw;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  // ---------- boutons magnétiques
  if (fine && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // ---------- vidéo d'ouverture : son activable, pause hors écran
  document.querySelectorAll('[data-hero-video]').forEach(function (hero) {
    var video = hero.querySelector('video'), btn = hero.querySelector('[data-sound]');
    if (!video) return;
    video.muted = true; video.loop = true; video.playsInline = true;
    var play = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    play();
    if (btn) btn.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted) { video.volume = 1; play(); }
      btn.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
      btn.querySelector('[data-sound-label]').textContent = video.muted ? 'Activer le son' : 'Couper le son';
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) play(); else video.pause(); }, { threshold: 0.05 }).observe(hero);
  });

  // ---------- horloge de l'atelier (heure de Paris)
  var clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    var tick = function () {
      var s = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Paris' }).format(new Date());
      clocks.forEach(function (c) { c.textContent = s; });
    };
    tick(); setInterval(tick, 1000);
  }

  // ---------- collection : les filtres et le tri se soumettent tout seuls
  document.querySelectorAll('form[data-auto-submit]').forEach(function (f) {
    f.addEventListener('change', function () {
      var params = new URLSearchParams(new FormData(f));
      [].slice.call(params.keys()).forEach(function (k) { if (!params.get(k)) params.delete(k); });
      location.search = params.toString();
    });
  });

  // ---------- fiche produit : prix et disponibilité suivent la variante choisie
  document.querySelectorAll('[data-variant-select]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      var opt = sel.options[sel.selectedIndex], form = sel.closest('form');
      var now = document.querySelector('[data-price] .price__now');
      if (now) now.textContent = opt.getAttribute('data-price');
      var btn = form && form.querySelector('[data-add-button]');
      var ok = opt.getAttribute('data-available') === 'true';
      if (btn) { btn.disabled = !ok; btn.textContent = ok ? 'Ajouter au panier' : 'Épuisée'; }
      var url = new URL(location.href);
      url.searchParams.set('variant', sel.value);
      history.replaceState(null, '', url);
    });
  });

  // ---------- panier : retirer une montre configurée retire aussi ses composants (même _config_id)
  document.querySelectorAll('[data-remove-keys]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var updates = {};
      btn.getAttribute('data-remove-keys').split(',').forEach(function (k) { updates[k] = 0; });
      btn.disabled = true;
      fetch(window.Shopify && Shopify.routes ? Shopify.routes.root + 'cart/update.js' : '/cart/update.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ updates: updates })
      }).then(function () { location.reload(); }, function () { btn.disabled = false; });
    });
  });

  // ---------- panier : la quantité se met à jour sans bouton
  var qt;
  document.querySelectorAll('[data-auto-update]').forEach(function (input) {
    input.addEventListener('change', function () {
      clearTimeout(qt);
      qt = setTimeout(function () {
        var form = input.form, fd = new FormData(form);
        fd.append('update', '1');
        fetch(form.action, { method: 'POST', body: fd }).then(function () { location.reload(); });
      }, 400);
    });
  });
})();
