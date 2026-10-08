// Petit bus d'événement : le hero attend la fin du preloader pour lancer son entrée.
declare global {
  interface Window {
    __ilurIntroDone?: boolean;
  }
}

export const INTRO_EVENT = "ilur:intro-done";
export const INTRO_KEY = "ilur-intro-seen";

export function markIntroDone() {
  window.__ilurIntroDone = true;
  window.dispatchEvent(new Event(INTRO_EVENT));
}

export function onIntroDone(cb: () => void) {
  if (window.__ilurIntroDone) {
    cb();
    return () => {};
  }
  window.addEventListener(INTRO_EVENT, cb, { once: true });
  return () => window.removeEventListener(INTRO_EVENT, cb);
}
