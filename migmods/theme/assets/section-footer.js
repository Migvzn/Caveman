/* section-footer.js — <mig-footer> : lettre de l'atelier (validation accessible) et reflet de passage du grand logo
   (une seule fois, à 40 % de visibilité ; jamais en pause globale ni en mouvement réduit). DESIGN-SYSTEM.md §8.5, §7.4, §6.13. */
(function () {
  'use strict';
  if (!window.customElements || customElements.get('mig-footer')) return;

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function still() { var M = window.Mig; return M && M.isStill ? M.isStill() : matchMedia('(prefers-reduced-motion: reduce)').matches; }

  customElements.define('mig-footer', class extends HTMLElement {
    connectedCallback() {
      this.ac = new AbortController();
      this.initNewsletter();
      this.initLogo();
    }

    disconnectedCallback() {
      if (this.ac) this.ac.abort();
      if (this.io) this.io.disconnect();
    }

    initNewsletter() {
      var sig = { signal: this.ac.signal };
      Array.prototype.forEach.call(this.querySelectorAll('form.newsletter__form'), function (form) {
        var input = form.querySelector('input[type="email"]'), error = form.querySelector('[data-newsletter-error]');
        if (!input || !error) return;
        form.noValidate = true;
        var setError = function (on) {
          if (on) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
          error.hidden = !on;
        };
        form.addEventListener('submit', function (e) {
          var value = input.value.trim();
          if (EMAIL.test(value)) { input.value = value; setError(false); return; }
          e.preventDefault();
          setError(true);
          input.focus();
          if (window.Mig && Mig.announce) Mig.announce(error.textContent.trim());
        }, sig);
        input.addEventListener('input', function () {
          if (input.getAttribute('aria-invalid') === 'true' && EMAIL.test(input.value.trim())) setError(false);
        }, sig);
      });
    }

    initLogo() {
      var logo = this.querySelector('[data-footer-logo]');
      if (!logo || !('IntersectionObserver' in window)) return;
      var self = this;
      this.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          self.io.disconnect();
          if (!still()) logo.classList.add('is-swept');
        });
      }, { threshold: 0.4 });
      this.io.observe(logo);
    }
  });
})();
