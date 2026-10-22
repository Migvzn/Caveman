/* section-hero-video.js — vidéo d'ouverture, déplacé tel quel de l'ancien theme.js (phase 0).
   À réécrire par le lot accueil (§7.8, §9.1.1) : lecture conditionnelle, Pause reliée à Mig.setStill(). */
(function () {
  'use strict';
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
      var label = btn.querySelector('[data-sound-label]');
      if (label) label.textContent = video.muted ? 'Activer le son' : 'Couper le son';
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) play(); else video.pause(); }, { threshold: 0.05 }).observe(hero);
  });
})();
