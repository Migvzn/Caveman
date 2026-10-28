import voice from "./voiceover.json";

export const FPS = 30;
export const TRANSITION = 18;
// Marge avant / après la voix de chaque scène (en images).
const LEAD: Record<string, number> = { intro: 40, outro: 20 };
const TAIL: Record<string, number> = { outro: 110 };

export type SceneInfo = {
  id: string;
  title: string;
  text: string;
  file: string;
  lead: number;
  voice: number;
  duration: number;
  start: number;
};

let cursor = 0;
export const SCENES: SceneInfo[] = voice.map((v, i) => {
  const lead = LEAD[v.id] ?? 14;
  const vf = Math.ceil(v.seconds * FPS);
  const duration = lead + vf + (TAIL[v.id] ?? 22);
  const start = cursor;
  cursor += duration - (i < voice.length - 1 ? TRANSITION : 0);
  return { ...v, lead, voice: vf, duration, start };
});

export const TOTAL = cursor;
export const scene = (id: string) => SCENES.find((s) => s.id === id)!;
