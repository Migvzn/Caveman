/* section-local-delivery.js — vérificateur de code postal <mig-postcode-check> (DESIGN-SYSTEM.md §9.1.9, §11.9).
   Le formulaire est rendu masqué (hidden) : sans JS, rien n'est affiché. Données (préfixes, codes, messages) dans le
   <script type="application/json"> de l'élément. Préfixe (ligne « 27* ») → message Eure ; code listé → message Rouen ;
   autre code de 5 chiffres → message France ; sinon → message d'erreur (aria-invalid). Résultat annoncé (aria-live). */
if (!customElements.get('mig-postcode-check')) {
  customElements.define('mig-postcode-check', class extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      const json = this.querySelector('script[type="application/json"]');
      this.form = this.querySelector('form');
      if (!this.form || !json) return;
      try { this.data = JSON.parse(json.textContent); } catch (e) { return; }
      this._ready = true;
      this.form.hidden = false;
      this.input = this.querySelector('.capsule__input');
      this.msg = this.querySelector('.postcode-check__msg');
      this.text = this.querySelector('[data-msg]');
      this.next = this.querySelector('.postcode-check__next');
      this.onSubmit = (e) => { e.preventDefault(); this.check(); };
      this.onInput = () => {
        const clean = this.input.value.replace(/\D/g, '').slice(0, 5);
        if (clean !== this.input.value) this.input.value = clean;
        if (this.input.getAttribute('aria-invalid') === 'true' && clean.length === 5) this.input.removeAttribute('aria-invalid');
      };
      this.form.addEventListener('submit', this.onSubmit);
      this.input.addEventListener('input', this.onInput);
    }

    disconnectedCallback() {
      if (!this._ready) return;
      this._ready = false;
      this.form.removeEventListener('submit', this.onSubmit);
      this.input.removeEventListener('input', this.onInput);
      cancelAnimationFrame(this._raf);
    }

    check() {
      const d = this.data || {}, msg = d.msg || {};
      const code = this.input.value.replace(/\s/g, '');
      let kind = 'france', text = msg.france;
      if (!/^\d{5}$/.test(code)) { kind = 'invalid'; text = msg.invalid; }
      else if ((d.prefix || []).some((p) => p && code.indexOf(p) === 0)) { kind = 'local'; text = msg.eure; }
      else if ((d.codes || []).indexOf(code) !== -1) { kind = 'local'; text = msg.rouen; }
      if (kind === 'invalid') { this.input.setAttribute('aria-invalid', 'true'); this.input.focus(); }
      else this.input.removeAttribute('aria-invalid');
      this.show(kind, text || '');
    }

    show(kind, text) {
      const m = this.msg;
      m.classList.remove('is-in');
      m.hidden = false;
      m.setAttribute('data-kind', kind);
      this.text.textContent = text;
      if (this.next) this.next.hidden = kind === 'invalid';
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => { this._raf = requestAnimationFrame(() => m.classList.add('is-in')); });
    }
  });
}
