/* section-main-cart.js — <mig-cart> : panier sans rechargement (DESIGN-SYSTEM.md §9.5).
   Quantité (Mig.cart.change), retrait d'une montre prête (change à 0), retrait groupé d'une montre configurée
   (Mig.cart.update sur toutes ses lignes, data-remove-keys), puis rendu de la section par Mig.sections.
   Ligne en chargement : aria-busy (opacité .5). Annonce : « Panier mis à jour : 2 articles, 707 €. »
   Note pour l'atelier enregistrée au fil de la saisie. Barre fixe « Passer commande » sur téléphone.
   Toute erreur affiche un message et laisse le panier utilisable (repli : navigation classique). */
if (!customElements.get('mig-cart')) {
  customElements.define('mig-cart', class extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.section = this.dataset.section;
      this._onClick = this.onClick.bind(this);
      this._onChange = this.onChange.bind(this);
      this._onInput = this.onInput.bind(this);
      this.addEventListener('click', this._onClick);
      this.addEventListener('change', this._onChange);
      this.addEventListener('input', this._onInput);
      this.watchBar();
    }

    disconnectedCallback() {
      this._ready = false;
      this.removeEventListener('click', this._onClick);
      this.removeEventListener('change', this._onChange);
      this.removeEventListener('input', this._onInput);
      if (this.io) this.io.disconnect();
      clearTimeout(this._qtyTimer);
      clearTimeout(this._noteTimer);
    }

    /* barre fixe : visible quand le bouton « Passer commande » du récapitulatif n'est pas à l'écran */
    watchBar() {
      if (this.io) this.io.disconnect();
      const bar = this.querySelector('[data-buybar]'), target = this.querySelector('[data-checkout]');
      if (!bar || !target || !('IntersectionObserver' in window)) return;
      this.io = new IntersectionObserver((es) => {
        const e = es[es.length - 1];
        const on = !e.isIntersecting && e.boundingClientRect.top > 0 && matchMedia('(max-width: 899px)').matches;
        bar.classList.toggle('is-in', on);
        if (on) { bar.removeAttribute('inert'); bar.removeAttribute('aria-hidden'); }
        else { bar.setAttribute('inert', ''); bar.setAttribute('aria-hidden', 'true'); }
      }, { threshold: 0 });
      this.io.observe(target);
    }

    onClick(e) {
      const step = e.target.closest('[data-qty-step]');
      if (step) {
        const input = step.parentElement.querySelector('.qty__input');
        if (!input) return;
        const max = parseInt(input.max, 10) || 99;
        input.value = Math.max(0, Math.min(max, (parseInt(input.value, 10) || 0) + parseInt(step.getAttribute('data-qty-step'), 10)));
        this.queueQty(input);
        return;
      }
      const group = e.target.closest('[data-remove-keys]');
      if (group) {
        e.preventDefault();
        const updates = {};
        group.getAttribute('data-remove-keys').split(',').forEach((k) => { if (k) updates[k] = 0; });
        this.run(group, () => Mig.cart.update(updates));
        return;
      }
      const one = e.target.closest('[data-remove-key]');
      if (one) {
        e.preventDefault();
        this.run(one, () => Mig.cart.change({ id: one.getAttribute('data-remove-key'), quantity: 0 }), one.href);
      }
    }

    onChange(e) {
      if (e.target.matches('.qty__input')) this.queueQty(e.target);
    }

    onInput(e) {
      if (!e.target.matches('[data-cart-note]')) return;
      clearTimeout(this._noteTimer);
      const note = e.target.value;
      this._noteTimer = setTimeout(() => {
        const url = (window.MigConfig && MigConfig.routes && MigConfig.routes.cartUpdate) || '/cart/update.js';
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ note: note }) })
          .catch(() => { /* la note part de toute façon avec « Passer commande » */ });
      }, 600);
    }

    queueQty(input) {
      clearTimeout(this._qtyTimer);
      this._qtyTimer = setTimeout(() => {
        const qty = Math.max(0, parseInt(input.value, 10) || 0);
        this.run(input, () => Mig.cart.change({ id: input.getAttribute('data-qty-key'), quantity: qty }));
      }, 400);
    }

    /* une action sur une ligne : chargement, appel, nouveau rendu de la section, annonce */
    run(trigger, call, fallbackUrl) {
      if (!window.Mig || !Mig.cart) { if (fallbackUrl) location.assign(fallbackUrl); return; }
      const line = trigger.closest('[data-line]');
      if (line) line.setAttribute('aria-busy', 'true');
      this.hideError();
      call()
        .then((cart) => this.refresh(cart))
        .catch((err) => {
          if (line) line.removeAttribute('aria-busy');
          const msg = err && err.status === 422 && err.message && !/^HTTP/.test(err.message)
            ? err.message
            : 'Une erreur est survenue. Rechargez la page ou écrivez-moi.';
          this.showError(msg);
        });
    }

    refresh(cart) {
      return Mig.sections(this.section).then((data) => {
        const html = data && data[this.section];
        if (!html) throw new Error('Section absente');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const fresh = doc.querySelector('mig-cart');
        if (!fresh) throw new Error('Panier absent');
        const focusId = document.activeElement && this.contains(document.activeElement) ? document.activeElement.id : '';
        this.innerHTML = fresh.innerHTML;
        ['data-count', 'data-total'].forEach((a) => { if (fresh.hasAttribute(a)) this.setAttribute(a, fresh.getAttribute(a)); });
        Mig.reveal(this);
        this.watchBar();
        if (focusId && document.getElementById(focusId)) document.getElementById(focusId).focus({ preventScroll: true });
        else { const t = this.querySelector('h1'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } }
        const n = parseInt(this.getAttribute('data-count'), 10) || 0;
        const total = Mig.money(cart && cart.total_price != null ? cart.total_price : parseInt(this.getAttribute('data-total'), 10) || 0);
        Mig.announce(n === 0 ? 'Votre panier est vide.' : 'Panier mis à jour : ' + n + (n > 1 ? ' articles, ' : ' article, ') + total + '.');
      }).catch(() => { location.reload(); });
    }

    showError(msg) {
      const box = this.querySelector('[data-cart-error]');
      if (!box) { Mig.announce(msg); return; }
      const t = box.querySelector('[data-cart-error-text]');
      if (t) t.textContent = msg; else box.textContent = msg;
      box.hidden = false;
      Mig.announce(msg);
    }

    hideError() { const box = this.querySelector('[data-cart-error]'); if (box) box.hidden = true; }
  });
}
