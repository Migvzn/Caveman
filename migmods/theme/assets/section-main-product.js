/* section-main-product.js — variantes de la fiche produit, déplacé tel quel de l'ancien theme.js (phase 0).
   À réécrire par le lot commerce en <mig-product-form> / <mig-gallery> (§9.2). */
(function () {
  'use strict';
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
})();
