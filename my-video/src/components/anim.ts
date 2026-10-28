import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const SMOOTH = Easing.bezier(0.65, 0, 0.35, 1);
export const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

export const between = (t: number, input: [number, number], output: [number, number], easing: (x: number) => number = EASE) =>
  interpolate(t, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Temps local de la scène, en secondes (indépendant du nombre d'images par seconde).
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};
