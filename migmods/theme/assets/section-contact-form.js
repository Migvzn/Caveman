/* section-contact-form.js — <mig-contact-form> (DESIGN-SYSTEM.md §9.11, §11.14) :
   pré-remplissage par l'URL (?sujet=<clé>&config=<composition ou lien>), validation en français (aria-invalid,
   aria-describedby), état « Envoi… » du bouton, focus sur le message de succès. */
if (!customElements.get('mig-contact-form')) {
  customElements.define('mig-contact-form', class extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      const success = this.querySelector('[data-contact-success]');
      if (success) {
        requestAnimationFrame(() => success.focus({ preventScroll: false }));
        if (window.Mig) Mig.announce(success.textContent.replace(/\s+/g, ' ').trim());
        return;
      }
      if (!this.form) return;
      this.prefill();
      this.form.setAttribute('novalidate', '');
      this.onSubmit = (e) => this.submit(e);
      this.onInput = (e) => { if (e.target.getAttribute('aria-invalid') === 'true') this.check(e.target); };
      this.form.addEventListener('submit', this.onSubmit);
      this.form.addEventListener('input', this.onInput);
      this.form.addEventListener('focusout', this.onInput);
    }

    disconnectedCallback() {
      if (!this.form || !this.onSubmit) return;
      this.form.removeEventListener('submit', this.onSubmit);
      this.form.removeEventListener('input', this.onInput);
      this.form.removeEventListener('focusout', this.onInput);
    }

    prefill() {
      let params;
      try { params = new URLSearchParams(location.search); } catch (e) { return; }
      const key = (params.get('sujet') || '').toLowerCase();
      if (key) {
        const radio = Array.from(this.form.querySelectorAll('input[type="radio"][data-key]')).find((r) => r.dataset.key === key);
        if (radio) radio.checked = true;
      }
      let config = (params.get('config') || params.get('c') || '').trim();
      if (!config) return;
      if (!/^https?:\/\//i.test(config)) config = location.origin + '/pages/configurateur?c=' + encodeURIComponent(config);
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'contact[Configuration]';
      hidden.value = config;
      this.form.appendChild(hidden);
      const note = this.querySelector('[data-contact-attached]');
      if (note) note.hidden = false;
    }

    check(field) {
      const err = field.id && document.getElementById(field.id + '-error');
      const value = field.value.trim();
      let ok = true;
      if (field.required && !value) ok = false;
      else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) ok = false;
      if (err) {
        const text = err.querySelector('span');
        if (text) text.textContent = (field.type === 'email' && value) ? 'Adresse e-mail incomplète\u00a0: il manque le @ ou le domaine.' : 'Ce champ est nécessaire.';
        err.hidden = ok;
      }
      if (ok) field.removeAttribute('aria-invalid'); else field.setAttribute('aria-invalid', 'true');
      return ok;
    }

    submit(e) {
      const fields = Array.from(this.form.querySelectorAll('.input[required]'));
      const bad = fields.filter((f) => !this.check(f));
      if (bad.length) {
        e.preventDefault();
        bad[0].focus();
        if (window.Mig) Mig.announce(bad.length > 1 ? bad.length + ' champs à compléter.' : 'Un champ à compléter.');
        return;
      }
      const btn = this.form.querySelector('[data-contact-submit]');
      if (btn) {
        btn.style.minWidth = btn.getBoundingClientRect().width + 'px';
        btn.classList.add('is-loading');
        btn.setAttribute('aria-busy', 'true');
        const label = btn.querySelector('.btn__label');
        if (label) label.textContent = 'Envoi…';
        /* retour arrière (bfcache) : le bouton ne reste jamais bloqué */
        window.addEventListener('pageshow', () => {
          btn.classList.remove('is-loading');
          btn.removeAttribute('aria-busy');
          if (label) label.textContent = 'Envoyer';
        }, { once: true });
      }
    }
  });
}
