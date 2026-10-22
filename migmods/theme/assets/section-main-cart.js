/* section-main-cart.js — panier, déplacé tel quel de l'ancien theme.js (phase 0).
   À réécrire par le lot commerce en <mig-cart> (§9.5) avec Mig.cart.change() / Mig.cart.update(). */
(function () {
  'use strict';
  // ---------- panier : retirer une montre configurée retire aussi ses composants (même _config_id)
  document.querySelectorAll('[data-remove-keys]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var updates = {};
      btn.getAttribute('data-remove-keys').split(',').forEach(function (k) { updates[k] = 0; });
      btn.disabled = true;
      fetch(window.Shopify && Shopify.routes ? Shopify.routes.root + 'cart/update.js' : '/cart/update.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ updates: updates })
      }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); location.reload(); }).catch(function () { btn.disabled = false; });
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
