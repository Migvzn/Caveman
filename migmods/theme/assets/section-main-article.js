/* section-main-article.js — <mig-share> : partage natif (Web Share API) si disponible, sinon « Copier le lien »
   (annonce « Lien copié »). Le bouton de copie reste visible : il sert aussi sur ordinateur. */
if (!customElements.get('mig-share')) {
  customElements.define('mig-share', class extends HTMLElement {
    connectedCallback() {
      this.share = this.querySelector('[data-share]');
      this.copy = this.querySelector('[data-share-copy]');
      if (this.share && navigator.share) this.share.hidden = false;
      if (this.copy && !(navigator.clipboard && window.isSecureContext)) this.copy.hidden = true;
      this.onClick = (e) => {
        const b = e.target.closest('[data-share], [data-share-copy]');
        if (!b || !this.contains(b)) return;
        const url = b.dataset.shareUrl || location.href;
        if (b.hasAttribute('data-share')) {
          navigator.share({ title: b.dataset.shareTitle || document.title, url }).catch(() => {});
        } else {
          navigator.clipboard.writeText(url).then(() => {
            const label = b.querySelector('.btn__label');
            if (window.Mig) Mig.announce('Lien copié');
            if (label) { label.textContent = 'Lien copié'; clearTimeout(this.t); this.t = setTimeout(() => { label.textContent = 'Copier le lien'; }, 1600); }
          }).catch(() => { if (window.Mig) Mig.announce('Copie impossible : sélectionnez l’adresse dans la barre du navigateur.'); });
        }
      };
      this.addEventListener('click', this.onClick);
    }
    disconnectedCallback() { this.removeEventListener('click', this.onClick); clearTimeout(this.t); }
  });
}
