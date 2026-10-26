/* section-hero-video.js — <mig-hero-video> (DESIGN-SYSTEM.md §7.8, §9.1.1).
   - Lecture automatique (muette, en boucle) seulement sans mouvement réduit, sans Save-Data et hors pause globale
     (Mig.isStill()) ; la vidéo apparaît par-dessus le poster au premier « playing ».
   - Lecture refusée (économie d'énergie d'iOS) : poster fixe, bouton Pause « pressé » ; un toucher sur ce bouton lance la vidéo.
   - Pause automatique sous 10 % de visibilité ; l'onglet qui revient ne relance la vidéo que si elle est visible et non mise en pause.
   - Son : libellé fixe, aria-pressed ; le volume monte de 0 à 1 en 400 ms.
   - En-tête : .is-logo-hidden sur [data-header] tant que le logo de la vidéo est visible (seuil .35). */
if (!customElements.get('mig-hero-video')) {
  customElements.define('mig-hero-video', class extends HTMLElement {
    connectedCallback() {
      this.hero = this.closest('[data-hero-video]') || this;
      this.media = this.querySelector('.hero-video__media');
      this.video = this.querySelector('[data-hero-el]');
      this.sound = this.querySelector('[data-sound]');
      this.stillBtn = this.querySelector('[data-still-toggle]');
      this.header = document.querySelector('[data-header]');
      this.inView = true;
      this.blocked = false;
      this.rampRaf = 0;

      this.onStill = () => this.sync();
      this.onVisibility = () => this.sync();
      this.onPlaying = () => { this.video.classList.add('is-playing'); this.setBlocked(false); };
      this.onSound = () => this.toggleSound();
      this.onStillClick = (e) => {
        // lecture refusée par le système : le bouton (affiché « pressé ») sert de bouton Lecture, sans toucher à la pause globale
        if (this.blocked && !this.still()) { e.preventDefault(); e.stopPropagation(); this.play(true); }
      };

      if (this.video) {
        this.video.muted = true;
        this.video.addEventListener('playing', this.onPlaying);
      }
      if (this.sound) this.sound.addEventListener('click', this.onSound);
      if (this.stillBtn) this.stillBtn.addEventListener('click', this.onStillClick);
      document.addEventListener('mig:still', this.onStill);
      document.addEventListener('visibilitychange', this.onVisibility);

      if ('IntersectionObserver' in window) {
        this.io = new IntersectionObserver((es) => {
          es.forEach((e) => {
            if (e.target === this.hero) { this.inView = e.intersectionRatio >= 0.1; this.sync(); }
            else if (e.target === this.media && this.header) this.header.classList.toggle('is-logo-hidden', e.intersectionRatio >= 0.35);
          });
        }, { threshold: [0, 0.1, 0.35] });
        this.io.observe(this.hero);
        if (this.media && this.header) this.io.observe(this.media);
      } else if (this.header) {
        this.header.classList.remove('is-logo-hidden');
      }
      this.sync();
    }

    disconnectedCallback() {
      if (this.io) this.io.disconnect();
      if (this.header) this.header.classList.remove('is-logo-hidden');
      if (this.video) { this.video.removeEventListener('playing', this.onPlaying); this.video.pause(); }
      if (this.sound) this.sound.removeEventListener('click', this.onSound);
      if (this.stillBtn) this.stillBtn.removeEventListener('click', this.onStillClick);
      document.removeEventListener('mig:still', this.onStill);
      document.removeEventListener('visibilitychange', this.onVisibility);
      cancelAnimationFrame(this.rampRaf);
    }

    still() { return !!(window.Mig ? window.Mig.isStill() : matchMedia('(prefers-reduced-motion: reduce)').matches); }
    saveData() { const c = navigator.connection; return !!(c && c.saveData); }

    // état voulu : lecture si autorisée, visible et onglet actif ; sinon pause
    sync() {
      if (!this.video) return;
      if (this.still() || this.saveData()) { this.video.pause(); return; }
      if (this.inView && !document.hidden) this.play(false);
      else this.video.pause();
    }

    play(fromUser) {
      const v = this.video;
      if (!v) return;
      if (v.preload === 'none') v.preload = 'auto';
      if (!v.paused && !fromUser) return;
      const p = v.play();
      if (p && p.catch) p.catch(() => { if (!fromUser) this.setBlocked(true); });
    }

    setBlocked(on) {
      this.blocked = on;
      if (this.stillBtn) this.stillBtn.setAttribute('aria-pressed', on || this.still() ? 'true' : 'false');
    }

    toggleSound() {
      const v = this.video;
      if (!v) return;
      const on = this.sound.getAttribute('aria-pressed') !== 'true';
      this.sound.setAttribute('aria-pressed', on ? 'true' : 'false');
      cancelAnimationFrame(this.rampRaf);
      if (!on) { v.muted = true; return; }
      v.volume = 0;
      v.muted = false;
      if (v.paused && !this.still()) this.play(true);
      const t0 = performance.now();
      const ramp = (now) => {
        const k = Math.min(1, (now - t0) / 400);
        v.volume = k;
        if (k < 1) this.rampRaf = requestAnimationFrame(ramp);
      };
      this.rampRaf = requestAnimationFrame(ramp);
    }
  });
}
