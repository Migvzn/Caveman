import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";

const pad = (n: number) => String(n).padStart(4, "0");

/**
 * Lit une séquence PNG rendue dans Blender (public/renders/<plan>/0000.png …).
 * `step` = pas de rendu : les images manquantes sont reconstituées par fondu
 * entre les deux rendus voisins (mouvements de caméra lents → invisible).
 */
export const RenderSequence: React.FC<{
  shot: string;
  frames: number; // nombre d'images du plan (en images vidéo)
  step?: number;
  speed?: number;
  offset?: number;
  style?: React.CSSProperties;
}> = ({ shot, frames, step = 1, speed = 1, offset = 0, style }) => {
  const frame = useCurrentFrame();
  const lastRendered = Math.floor((frames - 1) / step) * step;
  const t = Math.min(Math.max((frame + offset) * speed, 0), lastRendered);
  const pos = t / step;
  const i0 = Math.floor(pos);
  const i1 = Math.min(i0 + 1, lastRendered / step);
  const a = pos - i0;
  const src = (i: number) => staticFile(`renders/${shot}/${pad(i * step)}.png`);
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };
  return (
    <div style={{ position: "absolute", ...style }}>
      <Img src={src(i0)} style={base} />
      {a > 0.001 && i1 !== i0 ? (
        <Img src={src(i1)} style={{ ...base, opacity: a }} />
      ) : null}
    </div>
  );
};

/** Rotation à 360° qui boucle (le dernier rendu rejoint le premier). */
export const LoopSequence: React.FC<{
  shot: string;
  frames: number;
  speed?: number;
  offset?: number;
  style?: React.CSSProperties;
}> = ({ shot, frames, speed = 1, offset = 0, style }) => {
  const frame = useCurrentFrame();
  const pos = ((((frame + offset) * speed) % frames) + frames) % frames;
  const i0 = Math.floor(pos);
  const i1 = (i0 + 1) % frames;
  const a = pos - i0;
  const src = (i: number) => staticFile(`renders/${shot}/${pad(i)}.png`);
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };
  return (
    <div style={{ position: "absolute", ...style }}>
      <Img src={src(i0)} style={base} />
      {a > 0.001 ? <Img src={src(i1)} style={{ ...base, opacity: a }} /> : null}
    </div>
  );
};
