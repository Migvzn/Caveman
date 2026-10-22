/* section-header.js — comportement de l'en-tête, déplacé tel quel de l'ancien theme.js (phase 0).
   Correctif bloquant de la phase 0 : plus aucun calcul de --ann-h en JS (le positionnement est en CSS, section-header.css).
   À réécrire par le lot entete-pied en élément personnalisé <mig-header> (§8.2 à 8.4). */
(function () {
  'use strict';

  // ---------- en-tête : état au défilement, masqué en descendant, réaffiché en remontant (regroupé par rAF)
  var header = document.querySelector('[data-header]');
  if (header) {
    var lastY = scrollY, ticking = false;
    var update = function () {
      ticking = false;
      var y = scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      if (!header.querySelector('.is-open')) header.classList.toggle('is-hidden', y > 420 && y > lastY + 2);
      if (y < lastY - 2) header.classList.remove('is-hidden');
      lastY = y;
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ---------- méga-menu : survol avec délai, clic et clavier
  document.querySelectorAll('.has-mega').forEach(function (item) {
    var trigger = item.querySelector('[data-mega-trigger]'), t;
    if (!trigger) return;
    var open = function (on) {
      clearTimeout(t);
      item.classList.toggle('is-open', on);
      trigger.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (!header) return;
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
    addEventListener('pageshow', function (e) { if (e.persisted && !menu.hidden) setMenu(false); });
  }
})();
