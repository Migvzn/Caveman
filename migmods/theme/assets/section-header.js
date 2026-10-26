/* section-header.js — <mig-header> : en-tête fixe, annonce, navigation, méga-menu, menu mobile (DESIGN-SYSTEM.md §8.2 à 8.4).
   Le défilement (écouteur passif, regroupé par rAF) n'écrit que des classes sur .site-header, jamais de variable sur :root.
   Dialogue du menu : Mig.dialog.open / Mig.dialog.close (focus retenu, fond inerte, Échap, retour arrière de Safari). */
(function () {
  'use strict';
  if (!window.customElements || customElements.get('mig-header')) return;

  var root = document.documentElement;
  var mqPhone = matchMedia('(max-width: 899px)');
  var mqDesk = matchMedia('(min-width: 1280px)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  function Mig() { return window.Mig || {}; }
  function still() { var M = Mig(); return M.isStill ? M.isStill() : matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function onMq(mq, fn, signal) {
    if (mq.addEventListener) mq.addEventListener('change', fn, { signal: signal });
    else if (mq.addListener) mq.addListener(fn);
  }

  customElements.define('mig-header', class extends HTMLElement {
    connectedCallback() {
      this.header = this.querySelector('[data-header]');
      if (!this.header) return;
      this.ac = new AbortController();
      this.timers = [];
      this.compact = this.header.classList.contains('site-header--compact');
      this.initScroll();
      this.initNav();
      this.initMega();
      this.initMenu();
      this.initAnnouncement();
      this.initCart();
      this.initSolo();
    }

    disconnectedCallback() {
      if (this.ac) this.ac.abort();
      (this.timers || []).forEach(clearTimeout);
      clearInterval(this.annTimer);
      if (this.soloIO) this.soloIO.disconnect();
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    on(target, type, fn, opts) {
      var o = Object.assign({ signal: this.ac.signal }, opts || {});
      target.addEventListener(type, fn, o);
    }

    /* ---------- défilement : .is-scrolled (> 24 px), .is-hidden (téléphone, en descendant au-delà de 400 px) */
    initScroll() {
      var self = this, h = this.header, lastY = Math.max(0, scrollY), up = 0;
      var keyboardFocus = function () {
        var a = document.activeElement;
        if (!a || a === document.body || !h.contains(a)) return false;
        try { return a.matches(':focus-visible'); } catch (e) { return false; }
      };
      var locked = function () {
        return self.compact || h.classList.contains('is-mega-open') || root.classList.contains('has-dialog') || keyboardFocus();
      };
      var update = function () {
        self.raf = 0;
        var y = Math.max(0, scrollY);
        h.classList.toggle('is-scrolled', y > 24);
        if (!mqPhone.matches || locked()) {
          h.classList.remove('is-hidden');
        } else if (y > lastY) {
          up = 0;
          if (y > 400) h.classList.add('is-hidden');
        } else if (y < lastY) {
          up += lastY - y;
          if (up >= 2 || y <= 400) h.classList.remove('is-hidden');
        }
        lastY = y;
      };
      this.on(window, 'scroll', function () { if (!self.raf) self.raf = requestAnimationFrame(update); }, { passive: true });
      onMq(mqPhone, function () { h.classList.remove('is-hidden'); }, this.ac.signal);
      this.on(h, 'focusin', function () { if (keyboardFocus()) h.classList.remove('is-hidden'); });
      update();
    }

    /* ---------- navigation d'ordinateur : trait chromé qui glisse ; mesures de mise en page (au chargement, au redimensionnement) */
    initNav() {
      var self = this, h = this.header, nav = this.querySelector('.site-nav'), ink = nav && nav.querySelector('.site-nav__ink');
      if (nav && ink) {
        var current = function () { return nav.querySelector('[aria-expanded="true"]') || nav.querySelector('.site-nav__link.is-active'); };
        this.moveInk = function (el) {
          if (!el || !el.offsetWidth) { ink.classList.remove('is-active'); return; }
          var nr = nav.getBoundingClientRect(), label = el.querySelector('.site-nav__label') || el, r = label.getBoundingClientRect();
          var jump = !ink.classList.contains('is-active');
          ink.classList.toggle('is-jump', jump);
          ink.style.setProperty('--ink-x', (r.left - nr.left).toFixed(1) + 'px');
          ink.style.setProperty('--ink-s', (r.width / 100).toFixed(4));
          if (jump) void ink.offsetWidth;
          ink.classList.add('is-active');
          if (jump) requestAnimationFrame(function () { ink.classList.remove('is-jump'); });
        };
        this.restInk = function () { self.moveInk(current()); };
        Array.prototype.forEach.call(nav.querySelectorAll('.site-nav__link'), function (a) {
          self.on(a, 'pointerenter', function (e) { if (e.pointerType === 'mouse') self.moveInk(a); });
          self.on(a, 'focus', function () { self.moveInk(a); });
        });
        this.on(nav, 'pointerleave', function () { self.restInk(); });
        this.on(nav, 'focusout', function (e) { if (!nav.contains(e.relatedTarget)) self.restInk(); });
      }

      var logo = this.querySelector('.site-header__logo'), cta = this.querySelector('.site-header__cta');
      var layout = function () {
        // largeur du bouton (+ son écart) : les icônes glissent à sa place tant que le héros de l'accueil le masque
        if (cta) {
          var w = cta.offsetWidth ? cta.offsetWidth + (parseFloat(getComputedStyle(cta.parentNode).columnGap) || 0) : 0;
          h.style.setProperty('--site-header-cta-w', w + 'px');
        }
        // au moins 48 px entre le dernier lien et le logo (§8.2) ; sinon, le menu mobile prend le relais
        h.classList.remove('is-nav-collapsed');
        if (!nav || !mqDesk.matches) return;
        var list = nav.querySelector('.site-nav__list');
        if (list && logo && logo.getBoundingClientRect().left - list.getBoundingClientRect().right < 48) h.classList.add('is-nav-collapsed');
        if (self.restInk) self.restInk();
      };
      var t = 0;
      this.on(window, 'resize', function () { clearTimeout(t); t = setTimeout(layout, 150); self.timers.push(t); }, { passive: true });
      onMq(mqDesk, layout, this.ac.signal);
      layout();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (self.isConnected) layout(); });
    }

    /* ---------- méga-menu : survol avec intention (120 ms), fermeture après 240 ms, clic, Entrée, Échap */
    initMega() {
      var self = this, h = this.header, trigger = this.querySelector('[data-mega-trigger]');
      var mega = trigger && document.getElementById(trigger.getAttribute('aria-controls'));
      if (!trigger || !mega) return;
      var item = trigger.closest('.site-nav__item') || trigger;
      var openT = 0, closeT = 0, hideT = 0, pointerIn = false;
      var isOpen = function () { return trigger.getAttribute('aria-expanded') === 'true'; };
      var clear = function () { clearTimeout(openT); clearTimeout(closeT); };

      var open = function () {
        clear();
        if (isOpen()) return;
        clearTimeout(hideT);
        var M = Mig();
        if (M.reveal) M.reveal(mega);          // cadran à l'heure, images différées, apparitions
        mega.hidden = false;
        void mega.offsetHeight;
        mega.classList.add('is-open');
        h.classList.add('is-mega-open');
        h.classList.remove('is-hidden');
        trigger.setAttribute('aria-expanded', 'true');
        if (self.moveInk) self.moveInk(trigger);
      };
      var close = function (focusBack) {
        clear();
        if (!isOpen()) return;
        mega.classList.remove('is-open');
        h.classList.remove('is-mega-open');
        trigger.setAttribute('aria-expanded', 'false');
        if (focusBack) trigger.focus({ preventScroll: true });
        if (self.restInk) self.restInk();
        hideT = setTimeout(function () { if (!isOpen()) mega.hidden = true; }, 480);
        self.timers.push(hideT);
      };
      this.closeMega = close;

      this.on(trigger, 'click', function (e) { e.preventDefault(); if (isOpen()) close(false); else open(); });
      var enter = function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(closeT); if (!isOpen()) { clearTimeout(openT); openT = setTimeout(open, 120); self.timers.push(openT); } };
      var leave = function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(openT); closeT = setTimeout(function () { close(false); }, 240); self.timers.push(closeT); };
      this.on(item, 'pointerenter', enter);
      this.on(item, 'pointerleave', leave);
      this.on(mega, 'pointerenter', function (e) { if (e.pointerType === 'mouse') clearTimeout(closeT); });
      this.on(mega, 'pointerleave', leave);

      this.on(h, 'keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) { e.stopPropagation(); close(true); }
      });
      // clavier : le panneau suit son déclencheur dans l'ordre de tabulation (il est placé après la barre dans le DOM)
      var focusables = function () { return Array.prototype.slice.call(mega.querySelectorAll('a[href], button:not([disabled])')); };
      var afterTrigger = function () {
        var all = Array.prototype.slice.call(h.querySelectorAll('.site-header__inner a[href], .site-header__inner button:not([disabled])'))
          .filter(function (el) { return el.offsetWidth > 0; });
        return all[all.indexOf(trigger) + 1];
      };
      this.on(trigger, 'keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); open(); var f = focusables()[0]; if (f) f.focus(); }
        else if (e.key === 'Tab' && !e.shiftKey && isOpen()) { var first = focusables()[0]; if (first) { e.preventDefault(); first.focus(); } }
      });
      this.on(mega, 'keydown', function (e) {
        if (e.key !== 'Tab') return;
        var f = focusables(), i = f.indexOf(document.activeElement);
        if (e.shiftKey && i === 0) { e.preventDefault(); trigger.focus(); }
        else if (!e.shiftKey && i === f.length - 1) { var next = afterTrigger(); if (next) { e.preventDefault(); close(false); next.focus(); } }
      });
      // un clic à l'intérieur du panneau ne le ferme pas ; une sortie du focus hors du déclencheur et du panneau, si
      this.on(mega, 'pointerdown', function () { pointerIn = true; setTimeout(function () { pointerIn = false; }, 0); });
      this.on(h, 'focusout', function (e) {
        if (!isOpen() || pointerIn) return;
        var to = e.relatedTarget;
        if (to && (mega.contains(to) || item.contains(to))) return;
        if (!to) return;
        close(false);
      });
      this.on(document, 'click', function (e) {
        if (isOpen() && !mega.contains(e.target) && !item.contains(e.target)) close(false);
      });
      onMq(mqDesk, function () { if (!mqDesk.matches) close(false); }, this.ac.signal);

      // visuel de la collection survolée ou focalisée
      var visuals = Array.prototype.slice.call(mega.querySelectorAll('[data-mega-visual]'));
      var items = Array.prototype.slice.call(mega.querySelectorAll('[data-mega-item]'));
      var show = function (n) {
        if (!visuals.some(function (v) { return v.getAttribute('data-mega-visual') === n; })) return;
        visuals.forEach(function (v) { v.classList.toggle('is-active', v.getAttribute('data-mega-visual') === n); });
        items.forEach(function (it) { it.classList.toggle('is-active', it.getAttribute('data-mega-item') === n); });
      };
      var pick = function (e) { var it = e.target.closest && e.target.closest('[data-mega-item]'); if (it) show(it.getAttribute('data-mega-item')); };
      this.on(mega, 'pointerover', pick);
      this.on(mega, 'focusin', pick);
      if (items[0]) show(items[0].getAttribute('data-mega-item'));
    }

    /* ---------- menu mobile : cercle qui s'ouvre depuis le burger, accordéon « Collections » */
    initMenu() {
      var self = this, burger = this.querySelector('[data-menu-open]'), sheet = this.querySelector('[data-menu-sheet]');
      if (!burger || !sheet) return;
      var close = function () { var M = Mig(); if (sheet.open && M.dialog) M.dialog.close(sheet); };
      this.on(burger, 'click', function () {
        var r = burger.getBoundingClientRect(), M = Mig();
        sheet.style.setProperty('--menu-x', Math.round(r.left + r.width / 2) + 'px');
        sheet.style.setProperty('--menu-y', Math.round(r.top + r.height / 2) + 'px');
        if (self.closeMega) self.closeMega(false);
        if (M.dialog) M.dialog.open(sheet, burger);
        else if (sheet.showModal) { sheet.showModal(); burger.setAttribute('aria-expanded', 'true'); }
      });
      // un lien choisi ferme le menu (la page suivante, ou l'ancre, s'affiche aussitôt)
      this.on(sheet, 'click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (a && !e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && a.target !== '_blank') close();
      });
      Array.prototype.forEach.call(sheet.querySelectorAll('[data-menu-toggle]'), function (btn) {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (!panel) return;
        self.on(btn, 'click', function () {
          var on = btn.getAttribute('aria-expanded') !== 'true';
          btn.setAttribute('aria-expanded', on ? 'true' : 'false');
          panel.classList.toggle('is-open', on);
        });
      });
      onMq(mqDesk, function () { if (mqDesk.matches && !self.header.classList.contains('is-nav-collapsed')) close(); }, this.ac.signal);
      // retour arrière de Safari (bfcache) : menu fermé, accordéon replié
      this.on(window, 'pageshow', function (e) {
        if (!e.persisted) return;
        if (sheet.open) { sheet.classList.remove('is-closing'); sheet.close(); }
        burger.setAttribute('aria-expanded', 'false');
      });
    }

    /* ---------- annonce : trois messages en fondu toutes les 5 s, en pause au survol et au focus, premier seul sous is-still */
    initAnnouncement() {
      var self = this, bar = this.querySelector('[data-announcement]');
      if (!bar) return;
      var items = Array.prototype.slice.call(bar.querySelectorAll('.announcement__item'));
      if (items.length < 2) return;
      var i = Math.max(0, items.findIndex(function (it) { return it.classList.contains('is-active'); }));
      var hover = false, focus = false, pinned = false;
      var show = function (n) {
        i = (n + items.length) % items.length;
        items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
      };
      var tick = function () {
        if (hover || focus || pinned || still() || document.hidden || self.header.classList.contains('is-scrolled')) return;
        show(i + 1);
      };
      this.annTimer = setInterval(tick, 5000);
      this.on(bar, 'pointerenter', function () { hover = true; });
      this.on(bar, 'pointerleave', function () { hover = false; });
      this.on(bar, 'focusin', function (e) {
        focus = true;
        var it = e.target.closest('.announcement__item');
        if (it) show(items.indexOf(it));
      });
      this.on(bar, 'focusout', function (e) { if (!bar.contains(e.relatedTarget)) focus = false; });
      this.on(document, 'mig:still', function (e) { if (e.detail && e.detail.still) show(0); });
      if (still()) show(0);
      // éditeur de thème : le bloc sélectionné s'affiche et reste en place
      this.on(document, 'shopify:block:select', function (e) {
        var it = e.target && e.target.closest && e.target.closest('.announcement__item');
        if (it && bar.contains(it)) { pinned = true; show(items.indexOf(it)); }
      });
      this.on(document, 'shopify:block:deselect', function () { pinned = false; });
    }

    /* ---------- un seul bouton chromé par écran (§1.2) : le bouton de l'en-tête s'efface quand un autre est visible */
    initSolo() {
      var h = this.header, cta = this.querySelector('.site-header__cta');
      if (!cta || this.compact || !('IntersectionObserver' in window)) return;
      var seen = new Set(), top = parseFloat(getComputedStyle(document.body).getPropertyValue('--header-h')) || 0;
      var io = this.soloIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
        h.classList.toggle('is-cta-hidden', seen.size > 0);
      }, { rootMargin: '-' + Math.round(top) + 'px 0px 0px 0px' });
      var scan = function (scope) {
        Array.prototype.forEach.call((scope || document).querySelectorAll('.btn--chrome'), function (b) {
          if (!h.contains(b) && !b.closest('dialog')) io.observe(b);
        });
      };
      scan(document);
      this.on(document, 'shopify:section:load', function (e) { scan(e.target); });
    }

    /* ---------- panier : pastille et libellé suivent mig:cart (les composants d'une montre configurée ne comptent pas) */
    initCart() {
      var self = this;
      this.on(document, 'mig:cart', function (e) {
        var cart = e.detail;
        if (!cart || !Array.isArray(cart.items)) return;
        var n = cart.items.reduce(function (sum, it) {
          return sum + ((it.properties && it.properties._role === 'composant') ? 0 : (it.quantity || 0));
        }, 0);
        var label = 'Panier, ' + n + (n > 1 ? ' articles' : ' article');
        Array.prototype.forEach.call(self.querySelectorAll('[data-cart-count]'), function (c) { c.textContent = n; c.hidden = n === 0; });
        Array.prototype.forEach.call(self.querySelectorAll('[data-cart-link]'), function (a) { a.setAttribute('aria-label', label); });
      });
    }
  });
})();
