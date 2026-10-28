import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";

// Fond violet nuit avec deux halos bleu / violet qui dérivent lentement.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const a = frame / 30;
  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          borderRadius: "50%",
          left: 900 + Math.sin(a / 7) * 160,
          top: -760 + Math.cos(a / 9) * 120,
          background: "radial-gradient(circle, rgba(47,91,255,.42), rgba(47,91,255,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          left: -620 + Math.cos(a / 8) * 150,
          top: 420 + Math.sin(a / 6) * 110,
          background: "radial-gradient(circle, rgba(124,88,255,.34), rgba(124,88,255,0) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(Math.sin(a / 3), [-1, 1], [0.04, 0.09]),
          backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};
