/* section-main-search.js — <mig-predictive-search> : suggestions en direct (DESIGN-SYSTEM.md §9.6, §13.12).
   GET routes.predictive.json (Predictive Search API), délai 200 ms, combobox ARIA (aria-expanded,
   aria-activedescendant, listbox, flèches, Entrée, Échap), produits techniques filtrés.
   En cas d'erreur, le panneau reste fermé : la recherche classique (formulaire GET) fonctionne toujours. */
if (!customElements.get('mig-predictive-search')) {
  customElements.define('mig-predictive-search', class extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.input = this.querySelector('[data-q]');
      this.panel = this.querySelector('[data-predictive]');
      this.list = this.querySelector('[data-list]');
      this.status = this.querySelector('[data-status]');
      this.limit = parseInt(this.dataset.limit, 10) || 6;
      this.active = -1;
      if (!this.input || !this.panel || !this.list) return;
      this._onInput = this.onInput.bind(this);
      this._onKey = this.onKey.bind(this);
      this._onDoc = this.onDoc.bind(this);
      this._onFocus = () => { if (this.list.children.length && this.input.value.trim().length >= 2) this.open(); };
      this.input.addEventListener('input', this._onInput);
      this.input.addEventListener('keydown', this._onKey);
      this.input.addEventListener('focus', this._onFocus);
      document.addEventListener('pointerdown', this._onDoc);
      document.addEventListener('focusin', this._onDoc);
    }

    disconnectedCallback() {
      this._ready = false;
      clearTimeout(this._timer);
      if (this._ctrl) this._ctrl.abort();
      if (!this.input) return;
      this.input.removeEventListener('input', this._onInput);
      this.input.removeEventListener('keydown', this._onKey);
      this.input.removeEventListener('focus', this._onFocus);
      document.removeEventListener('pointerdown', this._onDoc);
      document.removeEventListener('focusin', this._onDoc);
    }

    onDoc(e) { if (!this.contains(e.target)) this.close(); }

    onInput() {
      clearTimeout(this._timer);
      const q = this.input.value.trim();
      if (q.length < 2) { this.close(); this.list.innerHTML = ''; return; }
      this._timer = setTimeout(() => this.fetch(q), 200);
    }

    technical(p) {
      const tags = (p.tags || []).map((t) => String(t).toLowerCase());
      return p.handle === 'montre-sur-mesure-migmods' || p.handle === 'composants-migmods'
        || p.type === 'Montre sur-mesure' || p.type === 'Composant'
        || tags.indexOf('configurateur') > -1 || tags.indexOf('masque') > -1;
    }

    fetch(q) {
      if (this._ctrl) this._ctrl.abort();
      this._ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const base = (window.MigConfig && MigConfig.routes && MigConfig.routes.predictive) || '/search/suggest';
      const u = new URL(base.replace(/\.json$/, '') + '.json', location.href);
      u.searchParams.set('q', q);
      u.searchParams.set('resources[type]', 'product,collection,page');
      u.searchParams.set('resources[limit]', String(this.limit + 2));
      u.searchParams.set('resources[options][unavailable_products]', 'last');
      window.fetch(u.toString(), { headers: { Accept: 'application/json' }, signal: this._ctrl ? this._ctrl.signal : undefined })
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then((data) => this.render(q, (data && data.resources && data.resources.results) || {}))
        .catch((err) => { if (!err || err.name !== 'AbortError') this.close(); });
    }

    render(q, res) {
      const items = [];
      (res.products || []).filter((p) => !this.technical(p)).forEach((p) => {
        const img = (p.featured_image && p.featured_image.url) || p.image || '';
        const cents = Math.round(parseFloat(p.price) * 100);
        items.push({ url: p.url, title: p.title, kind: p.available === false ? 'Montre · vendue' : 'Montre', img: img, price: isNaN(cents) ? '' : (window.Mig ? Mig.money(cents) : '') });
      });
      (res.collections || []).forEach((c) => {
        const h = String(c.handle || '').toLowerCase(), t = String(c.title || '').toLowerCase();
        if (/composant|technique/.test(h + ' ' + t) || h === 'frontpage' || h === 'all') return;
        items.push({ url: c.url, title: c.title, kind: 'Collection', img: (c.featured_image && c.featured_image.url) || '', price: '' });
      });
      (res.pages || []).forEach((p) => items.push({ url: p.url, title: p.title, kind: 'Page', img: '', price: '' }));
      const shown = items.slice(0, this.limit);

      this.list.innerHTML = '';
      this.active = -1;
      this.input.removeAttribute('aria-activedescendant');
      const id = this.list.id;
      if (!shown.length) {
        const li = document.createElement('li');
        li.className = 'predictive__empty';
        li.setAttribute('role', 'presentation');
        li.textContent = 'Aucune suggestion\u00A0: lancez la recherche pour tout voir.';
        this.list.appendChild(li);
      }
      shown.forEach((it, i) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'presentation');
        const a = document.createElement('a');
        a.className = 'predictive__option';
        a.id = id + '-o' + i;
        a.href = it.url;
        a.setAttribute('role', 'option');
        a.setAttribute('aria-selected', 'false');
        a.tabIndex = -1;
        if (it.img) {
          const im = document.createElement('img');
          im.className = 'predictive__thumb';
          im.src = it.img + (it.img.indexOf('?') < 0 ? '?' : '&') + 'width=120';
          im.width = 48; im.height = 48; im.alt = ''; im.loading = 'lazy';
          a.appendChild(im);
        } else {
          const ph = document.createElement('span');
          ph.className = 'predictive__thumb predictive__thumb--none';
          ph.setAttribute('aria-hidden', 'true');
          a.appendChild(ph);
        }
        const tx = document.createElement('span');
        tx.className = 'predictive__text';
        const nm = document.createElement('span'); nm.className = 'predictive__name'; nm.textContent = it.title;
        const kd = document.createElement('span'); kd.className = 'predictive__kind'; kd.textContent = it.kind;
        tx.appendChild(nm); tx.appendChild(kd); a.appendChild(tx);
        const pr = document.createElement('span'); pr.className = 'predictive__price'; pr.textContent = it.price; a.appendChild(pr);
        li.appendChild(a);
        this.list.appendChild(li);
      });
      if (this.status) this.status.textContent = shown.length ? shown.length + (shown.length > 1 ? ' suggestions' : ' suggestion') : 'Aucune suggestion';
      this.open();
    }

    options() { return Array.prototype.slice.call(this.list.querySelectorAll('[role="option"]')); }

    setActive(i) {
      const opts = this.options();
      if (!opts.length) return;
      this.active = (i + opts.length) % opts.length;
      opts.forEach((o, j) => o.setAttribute('aria-selected', j === this.active ? 'true' : 'false'));
      const cur = opts[this.active];
      this.input.setAttribute('aria-activedescendant', cur.id);
      cur.scrollIntoView({ block: 'nearest' });
    }

    onKey(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (this.panel.hidden) this.open(); this.setActive(this.active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.setActive(this.active - 1); }
      else if (e.key === 'Escape') { if (!this.panel.hidden) { e.preventDefault(); this.close(); } }
      else if (e.key === 'Enter') {
        const cur = this.options()[this.active];
        if (cur && !this.panel.hidden) { e.preventDefault(); location.assign(cur.href); }
      }
    }

    open() { this.panel.hidden = false; this.input.setAttribute('aria-expanded', 'true'); }

    close() {
      this.panel.hidden = true;
      this.input.setAttribute('aria-expanded', 'false');
      this.input.removeAttribute('aria-activedescendant');
      this.active = -1;
    }
  });
}
