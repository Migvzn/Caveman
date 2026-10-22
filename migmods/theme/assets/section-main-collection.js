/* section-main-collection.js — filtres et tri, déplacé tel quel de l'ancien theme.js (phase 0).
   Seul changement : Array.from(params.keys()) (l'ancien [].slice.call ne nettoyait aucun paramètre vide, §9.3).
   À réécrire par le lot commerce en <mig-facets>. */
(function () {
  'use strict';
  // ---------- collection : les filtres et le tri se soumettent tout seuls
  document.querySelectorAll('form[data-auto-submit]').forEach(function (f) {
    f.addEventListener('change', function () {
      var params = new URLSearchParams(new FormData(f));
      Array.from(params.keys()).forEach(function (k) { if (!params.get(k)) params.delete(k); });
      location.search = params.toString();
    });
  });
})();
