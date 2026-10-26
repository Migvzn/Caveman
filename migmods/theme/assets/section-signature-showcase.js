/* section-signature-showcase.js — <mig-signature-showcase> (DESIGN-SYSTEM.md §9.1.4).
   Ordinateur : survol ou focus d'une ligne du sommaire → la scène affiche la création (fondu enchaîné A/B, reflet de passage),
   le bouton pointe vers sa composition. Défilement automatique toutes les 6 s uniquement si la section est visible,
   ni survolée ni focalisée, réglage actif, et hors pause globale (Mig.isStill()). Téléphone : rien (rail natif). */
if (!customElements.get('mig-signature-showcase')) {
  customElements.define('mig-signature-showcase', class extends HTMLElement {
    connectedCallback() {
      this.rows = Array.prototype.slice.call(this.querySelectorAll('.sig-card--row'));
      this.stage = this.querySelector('.sig-card--stage');
      if (!this.rows.length || !this.stage) return;
      this.tilt = this.stage.querySelector('.ecrin__tilt');
      this.spec = this.stage.querySelector('.ecrin__spec');
      this.cta = this.querySelector('[data-showcase-cta]');
      this.ticks = Array.prototype.slice.call(this.querySelectorAll('.signature-showcase__ticks > i'));
      this.mq = matchMedia('(min-width: 900px)');
      this.index = 0;
      this.visible = false; this.hovering = false; this.focused = false;
      this.token = 0;

      this.onRowEnter = (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') this.show(this.rows.indexOf(e.currentTarget)); };
      this.onFocusIn = (e) => {
        this.focused = true;
        const row = e.target.closest && e.target.closest('.sig-card--row');
        if (row) this.show(this.rows.indexOf(row));
        this.schedule();
      };
      this.onFocusOut = (e) => { if (!this.contains(e.relatedTarget)) { this.focused = false; this.schedule(); } };
      this.onEnter = (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { this.hovering = true; this.schedule(); } };
      this.onLeave = () => { this.hovering = false; this.schedule(); };
      this.onState = () => this.schedule();

      this.rows.forEach((r) => r.addEventListener('pointerenter', this.onRowEnter));
      this.addEventListener('focusin', this.onFocusIn);
      this.addEventListener('focusout', this.onFocusOut);
      this.addEventListener('pointerenter', this.onEnter);
      this.addEventListener('pointerleave', this.onLeave);
      document.addEventListener('mig:still', this.onState);
      document.addEventListener('visibilitychange', this.onState);
      if (this.mq.addEventListener) this.mq.addEventListener('change', this.onState);

      if ('IntersectionObserver' in window) {
        this.io = new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; this.schedule(); }, { threshold: 0.35 });
        this.io.observe(this);
      }
      this.mark(0);
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      if (this.io) this.io.disconnect();
      if (!this.rows) return;
      this.rows.forEach((r) => r.removeEventListener('pointerenter', this.onRowEnter));
      this.removeEventListener('focusin', this.onFocusIn);
      this.removeEventListener('focusout', this.onFocusOut);
      this.removeEventListener('pointerenter', this.onEnter);
      this.removeEventListener('pointerleave', this.onLeave);
      document.removeEventListener('mig:still', this.onState);
      document.removeEventListener('visibilitychange', this.onState);
      if (this.mq && this.mq.removeEventListener) this.mq.removeEventListener('change', this.onState);
    }

    still() { return !!(window.Mig && window.Mig.isStill()); }

    canAuto() {
      return this.hasAttribute('data-autoplay') && this.visible && !this.hovering && !this.focused
        && this.mq.matches && !this.still() && !document.hidden && this.rows.length > 1;
    }

    schedule() {
      clearTimeout(this.timer);
      if (!this.canAuto()) return;
      this.timer = setTimeout(() => { this.show((this.index + 1) % this.rows.length); this.schedule(); }, 6000);
    }

    mark(i) {
      this.rows.forEach((r, j) => r.classList.toggle('is-active', j === i));
      this.ticks.forEach((t, j) => t.classList.toggle('is-active', j === i));
      const href = this.rows[i].getAttribute('data-sig-href');
      if (this.cta && href) this.cta.setAttribute('href', href);
    }

    show(i) {
      if (i < 0 || i === this.index || !this.mq.matches) return;
      this.index = i;
      this.mark(i);
      const src = this.rows[i].getAttribute('data-sig-src');
      if (!src || !this.tilt) return;
      const cur = this.tilt.querySelector('.sig-card__stage-img.is-current');
      let next = Array.prototype.find.call(this.tilt.querySelectorAll('.sig-card__stage-img'), (img) => img !== cur);
      if (!next) {
        next = cur.cloneNode(false);
        next.classList.remove('is-current');
        next.removeAttribute('srcset'); next.removeAttribute('sizes');
        next.loading = 'eager';
        this.tilt.insertBefore(next, this.spec || null);
      }
      const token = ++this.token;
      const reveal = () => {
        if (token !== this.token) return;
        next.classList.add('is-loaded', 'is-current');
        if (cur) cur.classList.remove('is-current');
        const mask = "url('" + src + "')";
        if (this.spec) this.spec.style.setProperty('--spec-mask', mask);
        this.sweep(mask);
      };
      if (next.getAttribute('src') === src && next.complete) { reveal(); return; }
      next.removeAttribute('srcset'); next.removeAttribute('sizes');
      next.setAttribute('src', src);
      if (next.decode) next.decode().then(reveal, reveal); else next.onload = reveal;
    }

    sweep(mask) {
      if (this.still() || !this.tilt || !this.tilt.animate) return;
      if (!this.shine) {
        this.shine = document.createElement('span');
        this.shine.className = 'signature-showcase__sweep';
        this.shine.setAttribute('aria-hidden', 'true');
        this.tilt.appendChild(this.shine);
      }
      this.shine.style.setProperty('--spec-mask', mask);
      if (this.shineAnim) this.shineAnim.cancel();
      this.shineAnim = this.shine.animate(
        [{ opacity: 0, backgroundPosition: '130% 0' }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0, backgroundPosition: '-30% 0' }],
        { duration: 900, delay: 200, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'none' }
      );
    }
  });
}
