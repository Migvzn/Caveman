import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Dust, Grain, Petals, RedGlow, Vignette } from "../components/Atmosphere";
import { Shine } from "../components/Editorial";

/** Scène 1 — noir, une fleur de lycoris pousse, puis le logo Fadiye se dessine. */
export const Ouverture: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#050303" }}>
      <RedGlow y="42%" size={760} intensity={interpolate(frame, [0, 2 * fps], [0, 0.42], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Petals count={18} seed="ouverture" opacity={0.55} />
      <Dust count={40} seed="ouv" />

      {/* Fleur : la tige pousse du bas vers le haut */}
      <Img
        name="Lycoris"
        src={staticFile("images/lycoris_icone.png")}
        style={{
          position: "absolute",
          left: 540 - 190,
          top: 470,
          width: 380,
          maskImage: `linear-gradient(0deg, #000 ${interpolate(frame, [0.2 * fps, 2.2 * fps], [-25, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.15, 1),
          })}%, transparent ${interpolate(frame, [0.2 * fps, 2.2 * fps], [0, 125], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.15, 1),
          })}%)`,
          filter: `blur(${interpolate(frame, [0.2 * fps, 2.4 * fps], [10, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px) drop-shadow(0 0 40px rgba(220,20,30,0.55))`,
          scale: interpolate(frame, [0, 5 * fps], [0.94, 1.04], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* Logo calligraphié, révélé de gauche à droite */}
      <Img
        name="Logo Fadiye"
        src={staticFile("images/logo_fadiye.png")}
        style={{
          position: "absolute",
          left: 540 - 430,
          top: 905,
          width: 860,
          WebkitMaskImage: `linear-gradient(90deg, #000 ${interpolate(frame, [1.6 * fps, 3.2 * fps], [-20, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.45, 0, 0.2, 1),
          })}%, transparent ${interpolate(frame, [1.6 * fps, 3.2 * fps], [0, 125], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.45, 0, 0.2, 1),
          })}%)`,
          maskImage: `linear-gradient(90deg, #000 ${interpolate(frame, [1.6 * fps, 3.2 * fps], [-20, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.45, 0, 0.2, 1),
          })}%, transparent ${interpolate(frame, [1.6 * fps, 3.2 * fps], [0, 125], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.45, 0, 0.2, 1),
          })}%)`,
          filter: "drop-shadow(0 0 26px rgba(220,20,30,0.45))",
        }}
      />

      <Shine
        src="images/logo_fadiye.png"
        start={3.4 * fps}
        dur={30}
        style={{ left: 540 - 430, top: 905, width: 860, height: 366 }}
      />
      <Interactive.Div
        name="Signature"
        style={{
          position: "absolute",
          top: 1310,
          width: "100%",
          textAlign: "center",
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 34,
          color: "#efe8e1",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          letterSpacing: interpolate(frame, [2.8 * fps, 4.6 * fps], ["0.48em", "0.3em"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          opacity: interpolate(frame, [2.8 * fps, 3.8 * fps], [0, 0.85], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Maison indépendante française
      </Interactive.Div>
      <Interactive.Div
        name="Ligne"
        style={{
          position: "absolute",
          top: 1395,
          left: 540 - 70,
          width: 140,
          height: 2,
          backgroundColor: "#c8101c",
          scale: interpolate(frame, [3.2 * fps, 4.2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <Vignette strength={0.9} />
      <Grain />
    </AbsoluteFill>
  );
};
