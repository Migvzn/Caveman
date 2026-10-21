/* MIGMODS — scripts du thème (sans dépendance) */
(function () {
  'use strict';

  // Collection : les filtres et le tri se soumettent tout seuls.
  document.querySelectorAll('form[data-auto-submit]').forEach(function (f) {
    f.addEventListener('change', function () {
      var params = new URLSearchParams(new FormData(f));
      [].slice.call(params.keys()).forEach(function (k) { if (!params.get(k)) params.delete(k); });
      location.search = params.toString();
    });
  });

  // Fiche produit : prix et disponibilité suivent la variante choisie.
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

  // Panier : retirer une montre configurée retire aussi ses composants (même _config_id).
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

  // Panier : la quantité se met à jour sans bouton.
  var t;
  document.querySelectorAll('[data-auto-update]').forEach(function (input) {
    input.addEventListener('change', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var form = input.form, fd = new FormData(form);
        fd.append('update', '1');
        fetch(form.action, { method: 'POST', body: fd }).then(function () { location.reload(); });
      }, 400);
    });
  });

  // Menu mobile : fermer avec Échap.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-menu-drawer][open]').forEach(function (d) { d.removeAttribute('open'); d.querySelector('summary').focus(); });
  });
})();
