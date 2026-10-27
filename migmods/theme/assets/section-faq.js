/* section-faq.js — <mig-faq> (DESIGN-SYSTEM.md §9.9) : ouvre la question visée par l'ancre (#faq-<id>),
   « Copier le lien » (annonce « Lien copié »), pastille de la catégorie en cours (aria-current), accordéon exclusif
   de repli pour les navigateurs sans l'attribut name sur <details>. */
if (!customElements.get('mig-faq')) {
  customElements.define('mig-faq', class extends HTMLElement {
    connectedCallback() {
      this.onHash = () => this.openFromHash(true);
      this.onClick = (e) => {
        const btn = e.target.closest('[data-faq-copy]');
        if (btn && this.contains(btn)) this.copy(btn);
      };
      this.onToggle = (e) => {
        const d = e.target;
        if (!(d instanceof HTMLDetailsElement) || !d.open || this.nativeName) return;
        this.querySelectorAll('details.faq__item[open]').forEach((o) => { if (o !== d) o.open = false; });
      };
      this.nativeName = 'name' in HTMLDetailsElement.prototype;

      if (navigator.clipboard && window.isSecureContext) {
        this.querySelectorAll('[data-faq-copy]').forEach((b) => { b.hidden = false; });
      }
      this.addEventListener('click', this.onClick);
      this.addEventListener('toggle', this.onToggle, true);
      window.addEventListener('hashchange', this.onHash);
      this.openFromHash(false);
      this.spy();
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.onClick);
      this.removeEventListener('toggle', this.onToggle, true);
      window.removeEventListener('hashchange', this.onHash);
      if (this.io) this.io.disconnect();
      clearTimeout(this.doneTimer);
    }

    openFromHash(scroll) {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id || id.indexOf('faq-') !== 0) return;
      const el = document.getElementById(id);
      if (!el || !this.contains(el)) return;
      if (el.tagName === 'DETAILS') {
        el.open = true;
        if (scroll || !this.nativeName) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
      }
    }

    copy(btn) {
      const item = btn.closest('details');
      if (!item) return;
      const url = location.origin + location.pathname + '#' + item.id;
      navigator.clipboard.writeText(url).then(() => {
        btn.classList.add('is-done');
        if (window.Mig) Mig.announce('Lien copié');
        clearTimeout(this.doneTimer);
        this.doneTimer = setTimeout(() => btn.classList.remove('is-done'), 1600);
      }).catch(() => {
        if (window.Mig) Mig.announce('Copie impossible\u00a0: sélectionnez l’adresse dans la barre du navigateur.');
      });
    }

    /* pastille de la catégorie en cours de lecture */
    spy() {
      const chips = Array.from(this.querySelectorAll('[data-faq-cat]'));
      if (!chips.length || !('IntersectionObserver' in window)) return;
      const set = (id) => chips.forEach((c) => {
        if (c.getAttribute('data-faq-cat') === id) c.setAttribute('aria-current', 'true');
        else c.removeAttribute('aria-current');
      });
      this.io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) set(e.target.id); });
      }, { rootMargin: '-30% 0px -60% 0px' });
      chips.forEach((c) => {
        const g = document.getElementById(c.getAttribute('data-faq-cat'));
        if (g) this.io.observe(g);
      });
    }
  });
}
