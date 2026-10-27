/* section-main-product.js — fiche produit (DESIGN-SYSTEM.md §9.2).
   <mig-gallery>      : carrousel du téléphone (compteur, points), vignettes de l'ordinateur (défilement sans ancre),
                        plein écran (.sheet--full) ; suit la variante choisie (événement mig:variant-media).
   <mig-product-form> : variantes en puces (prix, prix barré, badge, disponibilité, libellés, URL, annonce),
                        quantité, ajout au panier (Mig.cart.add) avec états is-loading / is-done, confirmation
                        (.sheet--center), erreurs visibles, barre d'achat .buybar (téléphone). */
(function () {
  'use strict';
  var NBSP = ' ';
  function money(c) { return window.Mig && Mig.money ? Mig.money(c) : (c / 100).toFixed(0) + NBSP + '€'; }
  function reduced() { return !!(window.Mig && Mig.reduced) || matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ===================================================================== galerie */
  if (!customElements.get('mig-gallery')) {
    customElements.define('mig-gallery', class extends HTMLElement {
      connectedCallback() {
        if (this._ready) return;
        this._ready = true;
        this.track = this.querySelector('[data-track]');
        this.items = Array.prototype.slice.call(this.querySelectorAll('.gallery__item'));
        this.viewer = this.querySelector('[data-viewer]');
        this.vtrack = this.querySelector('[data-viewer-track]');
        this.index = 0;
        this._onClick = this.onClick.bind(this);
        this._onMedia = this.onMedia.bind(this);
        this.addEventListener('click', this._onClick);
        document.addEventListener('mig:variant-media', this._onMedia);
        if (!this.track || this.items.length < 2 || !('IntersectionObserver' in window)) return;

        // élément visible : par la piste (téléphone, défilement horizontal) ou par la fenêtre (ordinateur, pile verticale)
        var ratios = this.items.map(function () { return 0; });
        var pick = () => {
          if (this._lock && Date.now() < this._lock) return; // défilement demandé : la vue choisie reste active
          var best = 0;
          ratios.forEach(function (r, i) { if (r > ratios[best] + 0.01) best = i; });
          this.setCurrent(best);
        };
        this.io = new IntersectionObserver((es) => {
          es.forEach((e) => { ratios[this.items.indexOf(e.target)] = e.intersectionRatio; });
          pick();
        }, { root: null, threshold: [0, 0.25, 0.5, 0.75, 1] });
        this.items.forEach((it) => this.io.observe(it));

        if (this.vtrack) {
          var vitems = Array.prototype.slice.call(this.vtrack.children), vr = vitems.map(function () { return 0; });
          this.vio = new IntersectionObserver((es) => {
            es.forEach(function (e) { vr[vitems.indexOf(e.target)] = e.intersectionRatio; });
            var best = 0; vr.forEach(function (r, i) { if (r > vr[best] + 0.01) best = i; });
            var now = this.querySelector('[data-viewer-now]');
            if (now) now.textContent = best + 1;
          }, { root: this.vtrack, threshold: [0, 0.5, 1] });
          vitems.forEach((it) => this.vio.observe(it));
        }
      }

      disconnectedCallback() {
        this._ready = false;
        this.removeEventListener('click', this._onClick);
        document.removeEventListener('mig:variant-media', this._onMedia);
        if (this.io) this.io.disconnect();
        if (this.vio) this.vio.disconnect();
      }

      desktop() { return matchMedia('(min-width: 900px)').matches; }

      setCurrent(i) {
        if (i === this.index && this._set) return;
        this._set = true;
        this.index = i;
        this.querySelectorAll('[data-dot]').forEach(function (d) { d.setAttribute('aria-current', +d.getAttribute('data-dot') === i ? 'true' : 'false'); });
        this.querySelectorAll('[data-thumb]').forEach(function (d) { d.setAttribute('aria-current', +d.getAttribute('data-thumb') === i ? 'true' : 'false'); });
        var now = this.querySelector('[data-count-now]');
        if (now) now.textContent = i + 1;
      }

      go(i) {
        var it = this.items[i];
        if (!it) return;
        var behavior = reduced() ? 'auto' : 'smooth';
        this._lock = Date.now() + 900;
        if (this.desktop()) {
          it.scrollIntoView({ behavior: behavior, block: 'start' });
        } else if (this.track) {
          this.track.scrollTo({ left: it.offsetLeft - this.track.offsetLeft, behavior: behavior });
        }
        this.setCurrent(i);
      }

      onClick(e) {
        var t = e.target.closest('[data-dot],[data-thumb],[data-zoom]');
        if (!t) return;
        if (t.hasAttribute('data-zoom')) { this.openViewer(+t.getAttribute('data-zoom'), t); return; }
        this.go(+(t.getAttribute('data-dot') || t.getAttribute('data-thumb')));
      }

      onMedia(e) {
        var id = e.detail && String(e.detail.media);
        if (!id || id === '0') return;
        var i = this.items.findIndex(function (it) { return it.getAttribute('data-media') === id; });
        if (i < 0) return;
        // sur ordinateur, on ne fait défiler la page que si la vue n'est pas déjà à l'écran
        if (this.desktop()) {
          var r = this.items[i].getBoundingClientRect();
          if (r.top >= 0 && r.bottom <= innerHeight) { this.setCurrent(i); return; }
        }
        this.go(i);
      }

      openViewer(i, opener) {
        if (!this.viewer || !window.Mig) return;
        Mig.dialog.open(this.viewer, opener);
        var vt = this.vtrack, target = vt && vt.children[i];
        if (!target) return;
        requestAnimationFrame(function () { vt.scrollLeft = target.offsetLeft; vt.focus({ preventScroll: true }); });
        var now = this.querySelector('[data-viewer-now]');
        if (now) now.textContent = i + 1;
      }
    });
  }

  /* ===================================================================== formulaire d'achat */
  if (!customElements.get('mig-product-form')) {
    customElements.define('mig-product-form', class extends HTMLElement {
      connectedCallback() {
        if (this._ready) return;
        this._ready = true;
        this.section = this.closest('.main-product');
        this.form = this.querySelector('form[action*="/cart/add"]') || this.querySelector('form');
        this.button = this.querySelector('[data-add-button]');
        this.label = this.querySelector('[data-add-label]');
        this.error = this.querySelector('[data-add-error]');
        this.idInput = this.querySelector('[data-variant-id]');
        this.threshold = parseInt(this.getAttribute('data-threshold'), 10) || 30000;
        try { this.variants = JSON.parse((this.querySelector('[data-variants]') || {}).textContent || '[]'); } catch (err) { this.variants = []; }
        this.current = this.variants.find((v) => String(v.id) === String(this.idInput && this.idInput.value)) || this.variants[0] || null;
        this.buybar = this.section && this.section.querySelector('[data-buybar]');
        this.added = this.section && this.section.querySelector('[data-added]');

        this._onChange = this.onChange.bind(this);
        this._onSubmit = this.onSubmit.bind(this);
        this._onClick = this.onClick.bind(this);
        this.addEventListener('change', this._onChange);
        this.addEventListener('click', this._onClick);
        if (this.form) this.form.addEventListener('submit', this._onSubmit);
        this.watchBuybar();
      }

      disconnectedCallback() {
        this._ready = false;
        this.removeEventListener('change', this._onChange);
        this.removeEventListener('click', this._onClick);
        if (this.form) this.form.removeEventListener('submit', this._onSubmit);
        if (this.bio) this.bio.disconnect();
        clearTimeout(this._doneTimer);
      }

      /* ---------- barre d'achat : visible quand l'action principale n'est pas à l'écran */
      watchBuybar() {
        if (!this.buybar || !('IntersectionObserver' in window)) return;
        var bar = this.buybar;
        var set = (on) => {
          bar.classList.toggle('is-in', on);
          if (on) { bar.removeAttribute('inert'); bar.removeAttribute('aria-hidden'); }
          else { bar.setAttribute('inert', ''); bar.setAttribute('aria-hidden', 'true'); }
        };
        var seen = new Map();
        // le pied (et sa bande « Créer ma montre », bouton chromé) : la barre s'efface quand il arrive à l'écran (§1.2)
        var band = document.querySelector('.site-footer');
        this.bio = new IntersectionObserver((es) => {
          es.forEach(function (e) { seen.set(e.target, e.isIntersecting); });
          var visible = false;
          seen.forEach(function (v, el) { if (v && (el === band || el.offsetParent !== null)) visible = true; });
          set(!visible && matchMedia('(max-width: 899px)').matches);
        }, { threshold: 0 });
        ['[data-add-button]', '[data-soldout] .btn'].forEach((sel) => { var el = this.querySelector(sel); if (el) this.bio.observe(el); });
        if (band) this.bio.observe(band);
      }

      /* ---------- variantes */
      selectedOptions() {
        var out = [];
        this.querySelectorAll('input[data-option]:checked').forEach(function (r) { out[+r.getAttribute('data-option')] = r.value; });
        return out;
      }

      onChange(e) {
        if (e.target.matches('input[data-option]')) {
          var opts = this.selectedOptions();
          var v = this.variants.find(function (x) { return x.options.every(function (o, i) { return opts[i] === undefined || o === opts[i]; }); });
          if (v) this.setVariant(v);
        } else if (e.target.matches('.qty__input')) {
          this.clampQty(e.target);
        }
      }

      onClick(e) {
        var step = e.target.closest('[data-qty-step]');
        if (!step) return;
        var input = this.querySelector('.qty__input');
        if (!input) return;
        input.value = (parseInt(input.value, 10) || 1) + parseInt(step.getAttribute('data-qty-step'), 10);
        this.clampQty(input);
      }

      clampQty(input) {
        var max = parseInt(input.max, 10) || 99, n = parseInt(input.value, 10) || 1;
        input.value = Math.max(1, Math.min(max, n));
      }

      priceHtml(v, ctx) {
        var sale = v.compare > v.price;
        var h = '<span class="price__now" data-price-now>' + money(v.price) + '</span>';
        if (ctx !== 'bar') h += '<span class="price__tax">TTC</span>';
        if (sale) {
          h += '<span class="visually-hidden">Prix habituel</span><s class="price__was" data-price-was>' + money(v.compare) + '</s>';
          if (ctx === 'product') h += '<span class="badge badge--edge price__off" data-price-off>−' + Math.round((v.compare - v.price) * 100 / v.compare) + NBSP + '%</span>';
        }
        return h;
      }

      setVariant(v) {
        this.current = v;
        if (this.idInput) this.idInput.value = v.id;
        var s = this.section || document;

        var price = s.querySelector('[data-price-wrap] .price');
        if (price) price.innerHTML = this.priceHtml(v, 'product');
        var barPrice = s.querySelector('[data-buybar-price] .price');
        if (barPrice) barPrice.innerHTML = this.priceHtml(v, 'bar');
        var local = s.querySelector('[data-local]');
        if (local) local.hidden = v.price < this.threshold || !v.available;

        var p = money(v.price);
        if (this.label && !this.button.classList.contains('is-done')) this.label.textContent = 'Ajouter au panier —' + NBSP + p;
        var barLabel = s.querySelector('[data-buybar-label]');
        if (barLabel) barLabel.textContent = 'Ajouter —' + NBSP + p;

        var buy = this.querySelector('[data-buy]'), sold = this.querySelector('[data-soldout]');
        if (buy) buy.hidden = !v.available;
        if (sold) sold.hidden = v.available;
        var badge = s.querySelector('[data-sold-badge]');
        if (badge) badge.hidden = v.available;
        var ready = s.querySelector('[data-ready]');
        if (ready) ready.hidden = !v.available;
        var barAdd = s.querySelector('[data-buybar-add]'), barSim = s.querySelector('[data-buybar-similar]');
        if (barAdd) barAdd.hidden = !v.available;
        if (barSim) barSim.hidden = v.available;

        var qtyWrap = this.querySelector('[data-qty]'), qty = this.querySelector('.qty__input');
        if (qty) { qty.max = v.qty; this.clampQty(qty); }
        if (qtyWrap) qtyWrap.hidden = v.qty <= 1;
        if (this.error) this.error.hidden = true;

        var variantName = s.querySelector('[data-added-variant]');
        if (variantName) variantName.textContent = v.options.join(' · ');

        try {
          var url = new URL(location.href);
          url.searchParams.set('variant', v.id);
          history.replaceState(history.state, '', url.toString());
        } catch (err) { /* URL inchangée */ }

        if (v.media) document.dispatchEvent(new CustomEvent('mig:variant-media', { detail: { media: v.media } }));
        if (window.Mig) Mig.announce(v.available ? 'Prix : ' + p : 'Cette variante est vendue.');
        // observe de nouveau l'action visible (ajout ou « Créer une montre similaire »)
        if (this.bio) { this.bio.disconnect(); this.watchBuybar(); }
      }

      /* ---------- ajout au panier */
      onSubmit(e) {
        e.preventDefault();
        if (!window.Mig || !Mig.cart) { this.form.submit(); return; }
        var btn = this.button;
        if (!btn || btn.classList.contains('is-loading') || !this.current || !this.current.available) return;
        clearTimeout(this._doneTimer);
        btn.classList.remove('is-done');
        btn.style.minWidth = btn.offsetWidth + 'px';
        btn.classList.add('is-loading');
        btn.setAttribute('aria-busy', 'true');
        if (this.error) this.error.hidden = true;
        var barBtn = this.section && this.section.querySelector('[data-buybar-add]');
        if (barBtn) { barBtn.classList.add('is-loading'); barBtn.setAttribute('aria-busy', 'true'); }
        if (window.Mig) Mig.announce('Ajout…');

        Mig.cart.add(new FormData(this.form)).then((cart) => {
          this.done(btn);
          this.openAdded(cart);
          Mig.announce('Ajoutée à votre panier');
        }).catch((err) => {
          var msg = err && err.status === 422 && err.message && !/^HTTP/.test(err.message)
            ? err.message
            : 'Impossible d’ajouter cette montre pour le moment. Réessayez dans un instant.';
          if (this.error) {
            var txt = this.error.querySelector('[data-add-error-text]');
            if (txt) txt.textContent = msg; else this.error.textContent = msg;
            this.error.hidden = false;
          }
          Mig.announce(msg);
        }).finally(() => {
          btn.classList.remove('is-loading');
          btn.removeAttribute('aria-busy');
          btn.style.minWidth = '';
          if (barBtn) { barBtn.classList.remove('is-loading'); barBtn.removeAttribute('aria-busy'); }
        });
      }

      done(btn) {
        var label = this.label, prev = label ? label.textContent : '';
        btn.classList.add('is-done');
        if (label) label.textContent = 'Ajoutée';
        this._doneTimer = setTimeout(() => {
          btn.classList.remove('is-done');
          if (label) label.textContent = this.current ? 'Ajouter au panier —' + NBSP + money(this.current.price) : prev;
        }, 1600);
      }

      openAdded(cart) {
        var dlg = this.added;
        if (!dlg) return;
        var total = dlg.querySelector('[data-added-total]');
        if (total && cart) total.textContent = money(cart.total_price);
        var added = cart && cart.added && cart.added.items && cart.added.items[0];
        if (added && added.featured_image && added.featured_image.url) {
          var img = dlg.querySelector('[data-added-media] img');
          if (img) { img.removeAttribute('srcset'); img.src = added.featured_image.url + (added.featured_image.url.indexOf('?') < 0 ? '?' : '&') + 'width=240'; }
        }
        Mig.dialog.open(dlg, this.button);
      }
    });
  }
})();
