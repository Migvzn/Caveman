import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Grain argentique animé (bruit SVG dont la graine change à chaque image). */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const frame = useCurrentFrame();
  const id = `grain-${frame % 24}`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed={frame % 24}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Vignettage sombre sur les bords. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.85 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/** Halo rouge qui "respire" lentement derrière le sujet. */
export const RedGlow: React.FC<{
  x?: string;
  y?: string;
  size?: number;
  intensity?: number;
}> = ({ x = "50%", y = "46%", size = 900, intensity = 0.55 }) => {
  const frame = useCurrentFrame();
  const breathe = 0.85 + 0.15 * Math.sin(frame / 22);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(circle ${size}px at ${x} ${y}, rgba(200,16,28,${(intensity * breathe).toFixed(3)}) 0%, rgba(120,6,14,${(intensity * 0.45 * breathe).toFixed(3)}) 38%, rgba(0,0,0,0) 72%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

/** Éclat rouge (fuite de lumière) utilisé aux coupes. progress 0→1. */
export const RedFlare: React.FC<{ seed?: number }> = ({ seed = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const a = Math.sin(Math.PI * p);
  const ox = 20 + random(`fx${seed}`) * 60 + p * 25;
  const oy = 15 + random(`fy${seed}`) * 40 + p * 30;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: a,
        background: [
          `radial-gradient(ellipse 70% 45% at ${ox}% ${oy}%, rgba(255,70,50,0.75) 0%, rgba(200,16,28,0.45) 35%, rgba(0,0,0,0) 70%)`,
          `radial-gradient(ellipse 55% 35% at ${100 - ox}% ${100 - oy}%, rgba(255,140,90,0.35) 0%, rgba(140,8,16,0.3) 40%, rgba(0,0,0,0) 75%)`,
        ].join(","),
      }}
    />
  );
};

type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  depth: number;
  sway: number;
  phase: number;
};

const makePetals = (count: number, seed: string): Petal[] =>
  new Array(count).fill(0).map((_, i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const depth = r("d");
    return {
      x: r("x"),
      y: r("y"),
      vx: (r("vx") - 0.5) * 0.0009,
      vy: 0.0006 + r("vy") * 0.0012,
      rot: r("r") * 360,
      vr: (r("vr") - 0.5) * 2.2,
      size: 18 + depth * 46,
      depth,
      sway: 10 + r("s") * 40,
      phase: r("p") * Math.PI * 2,
    };
  });

/** Pétales de lycoris qui dérivent lentement (déterministe). */
export const Petals: React.FC<{
  count?: number;
  seed?: string;
  opacity?: number;
  direction?: 1 | -1;
}> = ({ count = 26, seed = "petales", opacity = 0.8, direction = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const petals = React.useMemo(() => makePetals(count, seed), [count, seed]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {petals.map((p, i) => {
        const yy = ((p.y + direction * p.vy * frame) % 1 + 1) % 1;
        const xx = p.x + p.vx * frame;
        const px = xx * width + Math.sin(frame / 40 + p.phase) * p.sway;
        const py = yy * (height + 200) - 100;
        const blur = (1 - p.depth) * 5;
        return (
          <svg
            key={i}
            width={p.size * 2}
            height={p.size * 2}
            viewBox="-60 -60 120 120"
            style={{
              position: "absolute",
              left: px,
              top: py,
              rotate: `${p.rot + p.vr * frame}deg`,
              filter: `blur(${blur.toFixed(2)}px)`,
              opacity: 0.35 + p.depth * 0.6,
            }}
          >
            <path
              d="M-48,22 C-30,-8 -2,-34 40,-40 C18,-30 -6,-10 -20,14 C-30,30 -44,34 -48,22 Z"
              fill={i % 3 === 0 ? "#e0222e" : "#a80c16"}
            />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

/** Poussière lumineuse très fine. */
export const Dust: React.FC<{ count?: number; seed?: string }> = ({
  count = 50,
  seed = "dust",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const x = (r("x") * width + Math.sin(frame / 50 + r("p") * 6) * 30) % width;
        const y = ((r("y") * height - frame * (0.2 + r("v") * 0.6)) % height + height) % height;
        const s = 1.5 + r("s") * 3.5;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / (12 + r("t") * 20) + r("p") * 9));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: "50%",
              background: r("c") > 0.6 ? "#ff6a5a" : "#f4e7dc",
              opacity: 0.55 * tw,
              boxShadow: `0 0 ${s * 3}px rgba(255,90,80,0.6)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
