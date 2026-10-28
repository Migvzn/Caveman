import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { bass, beatPulse, dropPulse } from "../timeline";
import { C } from "../theme";

// Champ de particules en 3D (projection en perspective) qui avance vers la caméra.
const N = 150, DEPTH = 2400, F = 900;
const P = Array.from({ length: N }, (_, i) => ({
  x: (random("x" + i) - 0.5) * 3200,
  y: (random("y" + i) - 0.5) * 1900,
  z: random("z" + i) * DEPTH,
  s: 0.6 + random("s" + i) * 1.4,
  c: random("c" + i) > 0.7 ? "#9D84FF" : random("c2" + i) > 0.5 ? "#7FA2FF" : "#FFFFFF",
}));

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const b = bass(t), bp = beatPulse(t, 0.22), dp = dropPulse(t);
  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1600,
          height: 1600,
          borderRadius: "50%",
          left: 820 + Math.sin(t / 7) * 180,
          top: -820 + Math.cos(t / 9) * 130,
          scale: 1 + b * 0.16 + dp * 0.12,
          opacity: 0.75 + b * 0.25,
          background: "radial-gradient(circle, rgba(47,91,255,.48), rgba(47,91,255,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          left: -680 + Math.cos(t / 8) * 170,
          top: 380 + Math.sin(t / 6) * 120,
          scale: 1 + b * 0.12,
          opacity: 0.7 + b * 0.3,
          background: "radial-gradient(circle, rgba(124,88,255,.40), rgba(124,88,255,0) 62%)",
        }}
      />
      {P.map((p, i) => {
        const z = (p.z + t * 150) % DEPTH;
        const depth = DEPTH - z;
        const k = F / (F + depth);
        const x = 960 + p.x * k, y = 540 + p.y * k;
        if (x < -20 || x > 1940 || y < -20 || y > 1100) return null;
        const size = p.s * (1.2 + 7 * k) * (1 + bp * 0.35);
        const fade = Math.min(1, z / 300) * Math.min(1, (DEPTH - z) / 200 + 0.2);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: p.c,
              opacity: Math.min(0.85, 0.15 + k * 1.4) * fade * (0.7 + bp * 0.3),
              boxShadow: k > 0.45 ? `0 0 ${size * 2}px ${p.c}` : undefined,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(8,4,20,.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// Éclair lumineux sur les drops de la musique.
export const DropFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dp = dropPulse(frame / fps, 0.35);
  if (dp < 0.01) return null;
  return <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(circle at 50% 45%, rgba(201,214,255,.55), rgba(47,91,255,.18) 45%, transparent 75%)", opacity: dp * 0.55 }} />;
};
