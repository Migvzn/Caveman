import { Easing, interpolate } from "remotion";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const SMOOTH = Easing.bezier(0.65, 0, 0.35, 1);

export const between = (frame: number, input: [number, number], output: [number, number], easing = EASE) =>
  interpolate(frame, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
