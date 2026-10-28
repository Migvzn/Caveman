import music from "./music.json";
import sched from "./schedule.json";
import voice from "./voiceover.json";

// 120 images par seconde. Tous les minutages sont en secondes (voir scripts/schedule.py).
export const FPS = 120;
export const T = sched.T;                 // durée d'une transition = 1 temps
export const TF = Math.round(T * FPS);

export type SceneInfo = {
  id: string;
  title: string;
  text: string;
  file: string;
  start: number;   // début (s) dans la vidéo
  dur: number;     // durée (s), transition incluse
  lead: number;    // décalage de la voix (s) dans la scène
  voice: number;   // durée de la voix (s)
  slam?: number;   // instant du drop (s) dans la scène
};

export const SCENES: SceneInfo[] = sched.scenes.map((s) => {
  const v = voice.find((x) => x.id === s.id)!;
  return { ...s, title: v.title, text: v.text, file: v.file };
});
const startF = SCENES.map((s) => Math.round(s.start * FPS));
export const FRAMES = SCENES.map((s, i) => (i < SCENES.length - 1 ? startF[i + 1] - startF[i] + TF : Math.round(s.dur * FPS)));
export const TOTAL = startF[startF.length - 1] + FRAMES[FRAMES.length - 1];
export const TOTAL_S = TOTAL / FPS;

/* Synchronisation avec la musique */
const lastBefore = (arr: number[], t: number) => {
  let lo = 0, hi = arr.length - 1, r = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (arr[mid] <= t) { r = mid; lo = mid + 1; } else hi = mid - 1; }
  return r < 0 ? null : arr[r];
};
export const BEATS = music.beats;
export const DOWNBEATS = music.downbeats;
export const DROPS = [8.67, 19.57, 28.35, 55.92, 89.08, 107.08, 125.95, 136.85];
const decay = (t: number, arr: number[], k: number) => { const b = lastBefore(arr, t); return b === null ? 0 : Math.exp(-(t - b) / k); };
export const beatPulse = (t: number, k = 0.16) => decay(t, BEATS, k);
export const barPulse = (t: number, k = 0.4) => decay(t, DOWNBEATS, k);
export const dropPulse = (t: number, k = 0.55) => decay(t, DROPS, k);
export const sinceBar = (t: number) => { const b = lastBefore(DOWNBEATS, t); return b === null ? 99 : t - b; };
export const barIndex = (t: number) => DOWNBEATS.filter((d) => d <= t).length;
export const energy = (t: number) => music.energy[Math.max(0, Math.min(music.energy.length - 1, Math.round(t * music.rate)))] ?? 0;
export const bass = (t: number) => music.bass[Math.max(0, Math.min(music.bass.length - 1, Math.round(t * music.rate)))] ?? 0;
