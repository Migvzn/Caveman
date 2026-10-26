/* section-main-collection.js — <mig-facets> : filtres, tri et « Voir plus de montres » sans rechargement (DESIGN-SYSTEM.md §9.3).
   Soumission automatique, paramètres vides retirés (Array.from(params.keys())), mise à jour par la Section Rendering API
   (Mig.sections), annonce « 8 montres ». Toute erreur réseau retombe sur une navigation classique : rien n'est bloqué.
   Sans JS : formulaires GET et pagination numérotée. */
if (!customElements.get('mig-facets')) {
  customElements.define('mig-facets', class extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.section = this.dataset.section;
      this._onChange = this.onChange.bind(this);
      this._onSubmit = this.onSubmit.bind(this);
      this._onClick = this.onClick.bind(this);
      this._onPop = this.onPop.bind(this);
      this.addEventListener('change', this._onChange);
      this.addEventListener('submit', this._onSubmit);
      this.addEventListener('click', this._onClick);
      window.addEventListener('popstate', this._onPop);
    }

    disconnectedCallback() {
      this._ready = false;
      this.removeEventListener('change', this._onChange);
      this.removeEventListener('submit', this._onSubmit);
      this.removeEventListener('click', this._onClick);
      window.removeEventListener('popstate', this._onPop);
      clearTimeout(this._timer);
      if (this._ctrl) this._ctrl.abort();
    }

    get sheet() { return this.querySelector('.facets-sheet'); }

    /* URL de la collection à partir d'un formulaire : paramètres vides retirés, page remise à 1 */
    urlFrom(form) {
      const params = new URLSearchParams(new FormData(form));
      Array.from(params.keys()).forEach((k) => { if (!params.getAll(k).some((v) => String(v).trim() !== '')) params.delete(k); });
      params.delete('page');
      const url = new URL(form.getAttribute('action') || location.pathname, location.href);
      url.search = params.toString();
      return url.toString();
    }

    onChange(e) {
      const form = e.target.closest('form[data-facets-form]');
      if (!form) return;
      clearTimeout(this._timer);
      // les champs de prix attendent un peu (saisie au clavier), le reste part tout de suite
      const delay = e.target.type === 'number' ? 500 : 0;
      this._waiting = form;
      this._timer = setTimeout(() => { this._waiting = null; this.render(this.urlFrom(form)); }, delay);
    }

    onSubmit(e) {
      const form = e.target.closest('form[data-facets-form]');
      if (!form) return;
      e.preventDefault();
      this.render(this.urlFrom(form)).then(() => { if (form.hasAttribute('data-facets-sheet')) this.closeSheet(); });
    }

    onClick(e) {
      const open = e.target.closest('[data-facets-open]');
      if (open) { e.preventDefault(); if (this.sheet && window.Mig) Mig.dialog.open(this.sheet, open); return; }
      const apply = e.target.closest('[data-facets-apply]');
      if (apply) {
        e.preventDefault();
        let job = this._pending || Promise.resolve();
        if (this._waiting) { clearTimeout(this._timer); job = this.render(this.urlFrom(this._waiting)); this._waiting = null; }
        job.then(() => this.closeSheet());
        return;
      }
      const link = e.target.closest('a[data-facets-link]');
      if (link) { e.preventDefault(); this.render(link.href); return; }
      const more = e.target.closest('a[data-load-more]');
      if (more) { e.preventDefault(); this.loadMore(more); }
    }

    onPop() { this.render(location.href, { history: false }); }

    closeSheet() { const s = this.sheet; if (s && s.open && window.Mig) Mig.dialog.close(s); }

    fetchSection(url) {
      if (this._ctrl) this._ctrl.abort();
      this._ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const u = new URL(url, location.href);
      u.searchParams.set('sections', this.section);
      return fetch(u.toString(), { headers: { Accept: 'application/json' }, signal: this._ctrl ? this._ctrl.signal : undefined })
        .then((r) => { if (!r.ok) { const err = new Error('HTTP ' + r.status); err.status = r.status; throw err; } return r.json(); })
        .then((data) => {
          const html = data && data[this.section];
          if (!html) throw new Error('Section absente');
          return new DOMParser().parseFromString(html, 'text/html');
        });
    }

    /* remplace une zone en gardant le focus sur le champ de même id */
    swap(doc, selector) {
      const fresh = doc.querySelector(selector), current = this.querySelector(selector);
      if (!fresh || !current) return;
      const active = document.activeElement, id = active && current.contains(active) ? active.id : '';
      current.replaceWith(fresh);
      if (id) { const again = document.getElementById(id); if (again) again.focus({ preventScroll: true }); }
    }

    render(url, opts) {
      opts = opts || {};
      const results = this.querySelector('[data-facets-results]');
      if (results) results.setAttribute('aria-busy', 'true');
      const job = this.fetchSection(url).then((doc) => {
        const sheetOpen = this.sheet && this.sheet.open;
        this.swap(doc, '[data-facets-results]');
        this.swap(doc, '[data-facets-active]');
        this.querySelectorAll('[data-facets-count]').forEach((el, i) => { const n = doc.querySelectorAll('[data-facets-count]')[i]; if (n) el.textContent = n.textContent; });
        ['[data-facets-badge]', '[data-facets-apply]'].forEach((sel) => { const a = this.querySelector(sel), b = doc.querySelector(sel); if (a && b) a.textContent = b.textContent; });
        // les formulaires sont rafraîchis (nombres par valeur, valeurs désactivées) ; le focus revient au même champ
        this.swap(doc, 'form.facets__bar');
        if (sheetOpen) {
          const body = this.querySelector('form[data-facets-sheet]'), fresh = doc.querySelector('form[data-facets-sheet]');
          if (body && fresh) {
            const active = document.activeElement, id = active && body.contains(active) ? active.id : '';
            const top = body.scrollTop;
            body.innerHTML = fresh.innerHTML;
            body.scrollTop = top;
            if (id) { const again = document.getElementById(id); if (again) again.focus({ preventScroll: true }); }
          }
        } else {
          this.swap(doc, 'form[data-facets-sheet]');
        }
        if (opts.history !== false) history.replaceState(history.state, '', url);
        const fresh = this.querySelector('[data-facets-results]');
        if (window.Mig) {
          Mig.reveal(this);
          const n = fresh ? parseInt(fresh.getAttribute('data-count'), 10) || 0 : 0;
          Mig.announce(n === 0 ? 'Aucune montre avec ces filtres.' : n + (n > 1 ? ' montres' : ' montre'));
        }
      }).catch((err) => {
        if (err && err.name === 'AbortError') return;
        location.assign(url); // repli : navigation classique, la page reste utilisable
      }).finally(() => {
        const r = this.querySelector('[data-facets-results]');
        if (r) r.removeAttribute('aria-busy');
        if (this._pending === job) this._pending = null;
      });
      this._pending = job;
      return job;
    }

    loadMore(btn) {
      if (btn.classList.contains('is-loading')) return;
      btn.style.minWidth = btn.offsetWidth + 'px';
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      const hadFocus = document.activeElement === btn;
      this.fetchSection(btn.href).then((doc) => {
        const grid = this.querySelector('[data-facets-grid]'), next = doc.querySelector('[data-facets-grid]');
        if (!grid || !next) throw new Error('Grille absente');
        const added = Array.from(next.children);
        added.forEach((card) => grid.appendChild(card));
        this.swap(doc, '[data-facets-more]');
        if (window.Mig) { Mig.reveal(grid); Mig.announce(added.length + ' montres de plus'); }
        if (hadFocus && added[0]) { const a = added[0].querySelector('a'); if (a) a.focus({ preventScroll: true }); }
      }).catch((err) => {
        if (err && err.name === 'AbortError') return;
        location.assign(btn.href);
      }).finally(() => {
        btn.classList.remove('is-loading');
        btn.removeAttribute('aria-busy');
        btn.style.minWidth = '';
      });
    }
  });
}
