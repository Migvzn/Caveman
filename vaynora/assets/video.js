/* VAYNORA — lecteur de la vidéo de présentation (accueil) : affiche et gros bouton avant la lecture,
   contrôles natifs ensuite, chapitres, bouton « Voir la vidéo » du hero. Rien n'est chargé avant le clic. */
(function(){
  "use strict";
  const v = document.getElementById('pres'); if (!v) return;
  const stage = v.closest('.vstage'), big = stage.querySelector('.vplay');
  const chaps = [...document.querySelectorAll('.chapters [data-t]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  v.controls = false; big.hidden = false;
  function seek(t){ if (v.readyState >= 1) v.currentTime = t; else v.addEventListener('loadedmetadata', () => { v.currentTime = t; }, {once:true}); }
  function play(t){
    if (t != null) seek(t);
    v.controls = true; big.hidden = true; stage.classList.add('on');
    const p = v.play(); if (p) p.catch(() => { big.hidden = false; });
  }
  big.addEventListener('click', () => { play(); v.focus({preventScroll:true}); });
  v.addEventListener('play', () => { v.controls = true; big.hidden = true; stage.classList.add('on'); });
  chaps.forEach(b => b.addEventListener('click', () => play(+b.dataset.t)));

  /* Chapitre en cours */
  let cur = -1;
  v.addEventListener('timeupdate', () => {
    let i = -1; chaps.forEach((b, k) => { if (v.currentTime + 0.05 >= +b.dataset.t) i = k; });
    if (i === cur) return; cur = i;
    chaps.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
    const li = chaps[i] && chaps[i].parentElement, list = li && li.parentElement;
    if (li && list.scrollWidth > list.clientWidth) list.scrollTo({left: li.offsetLeft - 8, behavior: reduce ? 'auto' : 'smooth'});
  });

  /* Bouton « Voir la vidéo » du hero : descend jusqu'au lecteur et lance la lecture */
  document.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () => {
    stage.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
    play(); v.focus({preventScroll:true});
  }));

  /* Pause quand on quitte l'accueil */
  const view = v.closest('[data-view]');
  if (view) new MutationObserver(() => { if (view.hidden && !v.paused) v.pause(); }).observe(view, {attributes:true, attributeFilter:['hidden']});
})();
