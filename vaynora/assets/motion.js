/* VAYNORA — animations du site public : apparitions au défilement, compteurs, aperçu du dashboard vivant,
   halo qui suit la souris, transitions entre pages. Rien ne se lance si l'utilisateur préfère moins d'animations. */
(function(){
  "use strict";
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* Barre de progression + en-tête compact */
  const bar = document.createElement('div'); bar.id = 'scrollbar'; bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar);
  const hdr = document.querySelector('.hdr');
  let ticking = false;
  function onScroll(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
      if (hdr) hdr.classList.toggle('scrolled', scrollY > 8);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* Bandeau défilant sous les promesses */
  const pw = document.querySelector('.promises-wrap');
  if (pw && !document.querySelector('.marquee')) {
    const words = ['Stratégie', 'Croissance', 'Monétisation', 'Protection', 'Transparence', 'Anonymat', 'Formation', 'Contrat clair', 'Chiffres réels'];
    const m = document.createElement('div'); m.className = 'marquee'; m.setAttribute('aria-hidden', 'true');
    const line = words.map(w => `<span>${w}</span>`).join('');
    m.innerHTML = `<div class="track">${line}${line}</div>`;
    pw.after(m);
  }

  if (reduce) return;
  document.documentElement.classList.add('mo');

  /* Apparitions au défilement, en cascade dans chaque groupe */
  const SEL = '.sec-head, .card, .promise, .step, .vow, .plan, .post, .svc, .job, .faq details, .prog details, .panel, .tbl, .sim, .narrow > p, .narrow > h2, .narrow > ul, .narrow > ol, .prose > *, .band .wrap > *, .cta-final > *';
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    count(e.target);
  }), {threshold:.12, rootMargin:'0px 0px -6% 0px'});
  function scan(){
    const view = document.querySelector('[data-view]:not([hidden])') || document;
    $$(SEL, view).forEach(el => {
      if (el.dataset.rv !== undefined || el.closest('.hero') || el.closest('.menu')) return;
      const sibs = [...el.parentElement.children].filter(x => x.matches(SEL));
      const i = Math.max(0, sibs.indexOf(el));
      el.dataset.rv = el.matches('.promise, .plan') ? 's' : '';
      el.style.setProperty('--d', Math.min(i, 6) * 0.08 + 's');
      io.observe(el);
    });
  }

  /* Compteurs : « 48 h », « 100 % », « 18 640 € »… comptent depuis zéro */
  const done = new WeakSet();
  function count(root){
    const targets = root.matches && root.matches('.promise') ? [root.querySelector('b')] : [];
    targets.forEach(animateNumber);
  }
  function animateNumber(el){
    if (!el || done.has(el)) return; done.add(el);
    const txt = el.textContent, m = txt.match(/\d(?:[\d\s  ]*\d)?(?:,\d+)?/);
    if (!m) return;
    const raw = m[0], dec = (raw.split(',')[1] || '').length, target = parseFloat(raw.replace(/[\s  ]/g, '').replace(',', '.'));
    if (!target) return;
    const pre = txt.slice(0, m.index), post = txt.slice(m.index + raw.length), t0 = performance.now(), dur = 1300;
    const fmt = v => v.toLocaleString('fr-FR', {minimumFractionDigits:dec, maximumFractionDigits:dec});
    (function step(t){
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + fmt(target * e) + post;
      if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
    })(t0);
  }

  /* Aperçu du tableau de bord : courbe qui se dessine, chiffres qui défilent, inclinaison à la souris */
  const mock = document.querySelector('.mock');
  if (mock) {
    const paths = $$('svg path', mock);
    if (paths[0]) paths[0].classList.add('area');
    if (paths[1]) { paths[1].setAttribute('pathLength', '1'); paths[1].classList.add('ln'); }
    const dot = mock.querySelector('svg circle');
    if (dot) {
      dot.classList.add('dot');
      const ring = dot.cloneNode(); ring.setAttribute('class', 'dot-ring'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#2F5BFF'); ring.setAttribute('stroke-width', '2');
      dot.before(ring);
    }
    setTimeout(() => $$('.mock-kpis b', mock).forEach(animateNumber), 500);
    setTimeout(() => mock.classList.add('float'), 1300);
    const hero = mock.closest('.hero');
    if (fine && hero) {
      hero.addEventListener('pointermove', e => {
        const r = mock.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        mock.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg'); mock.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      });
      hero.addEventListener('pointerleave', () => { mock.style.setProperty('--ry', '0deg'); mock.style.setProperty('--rx', '0deg'); });
    }
  }

  /* Halo lumineux qui suit la souris sur les bandeaux sombres */
  if (fine) $$('.night').forEach(n => {
    const g = document.createElement('span'); g.className = 'glow'; n.prepend(g);
    n.addEventListener('pointermove', e => { const r = n.getBoundingClientRect(); g.style.setProperty('--mx', (e.clientX - r.left) + 'px'); g.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });

  /* Transition entre les pages */
  const mo = new MutationObserver(list => list.forEach(r => {
    const v = r.target;
    if (r.attributeName !== 'hidden' || v.hidden) return;
    v.classList.remove('vin'); void v.offsetWidth; v.classList.add('vin');
    requestAnimationFrame(scan);
  }));
  $$('[data-view]').forEach(v => mo.observe(v, {attributes:true, attributeFilter:['hidden']}));
  scan();
})();
