/* section-spec-rail.js — <mig-spec-rail> (DESIGN-SYSTEM.md §9.1.2) : quand la réglette passe sur plusieurs lignes,
   le point qui tomberait en début de ligne est masqué (classe .is-line-start). Lecture seule de la mise en page, regroupée par rAF. */
if (!customElements.get('mig-spec-rail')) {
  customElements.define('mig-spec-rail', class extends HTMLElement {
    connectedCallback() {
      this.items = Array.prototype.slice.call(this.querySelectorAll('.spec-rail__item'));
      if (this.items.length < 2) return;
      this.raf = 0;
      this.measure = () => {
        this.raf = 0;
        let top = null;
        this.items.forEach((li) => {
          const t = li.offsetTop;
          li.classList.toggle('is-line-start', top !== null && t > top + 2);
          top = t;
        });
      };
      this.queue = () => { if (!this.raf) this.raf = requestAnimationFrame(this.measure); };
      if ('ResizeObserver' in window) { this.ro = new ResizeObserver(this.queue); this.ro.observe(this); }
      else addEventListener('resize', this.queue, { passive: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(this.queue);
      this.queue();
    }
    disconnectedCallback() {
      if (this.ro) this.ro.disconnect(); else if (this.queue) removeEventListener('resize', this.queue);
      if (this.raf) cancelAnimationFrame(this.raf);
    }
  });
}
