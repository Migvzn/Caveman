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

export const SIGNATURE_DURATION = 180;

/** Scène 6 — signature de la marque : fleur, logo, fondateurs. */
export const Signature: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#050303" }}>
      <RedGlow y="40%" size={820} intensity={0.45} />
      <Petals count={22} seed="signature" opacity={0.6} direction={1} />
      <Dust count={46} seed="sig" />

      <Img
        name="Lycoris"
        src={staticFile("images/lycoris_icone.png")}
        style={{
          position: "absolute",
          left: 540 - 150,
          top: 360,
          width: 300,
          maskImage: `linear-gradient(0deg, #000 ${interpolate(frame, [0, 1.6 * fps], [-25, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.15, 1),
          })}%, transparent ${interpolate(frame, [0, 1.6 * fps], [0, 125], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.15, 1),
          })}%)`,
          filter: "drop-shadow(0 0 36px rgba(220,20,30,0.6))",
        }}
      />
      <Img
        name="Logo"
        src={staticFile("images/logo_fadiye.png")}
        style={{
          position: "absolute",
          left: 540 - 400,
          top: 700,
          width: 800,
          opacity: interpolate(frame, [0.8 * fps, 1.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          filter: `blur(${interpolate(frame, [0.8 * fps, 1.8 * fps], [16, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px) drop-shadow(0 0 28px rgba(220,20,30,0.5))`,
        }}
      />
      <Shine
        src="images/logo_fadiye.png"
        start={2.1 * fps}
        dur={32}
        style={{ left: 540 - 400, top: 700, width: 800, height: 341 }}
      />
      <Interactive.Div
        name="Fondateurs"
        style={{
          position: "absolute",
          top: 1120,
          width: "100%",
          textAlign: "center",
          fontFamily: "Cormorant",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 64,
          color: "#efe8e1",
          opacity: interpolate(frame, [1.8 * fps, 2.7 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [1.8 * fps, 2.9 * fps], ["0px 24px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Créée par Mig & Killian
      </Interactive.Div>
      <Interactive.Div
        name="Trait"
        style={{
          position: "absolute",
          top: 1236,
          left: 540 - 60,
          width: 120,
          height: 2,
          backgroundColor: "#c8101c",
          scale: interpolate(frame, [2.3 * fps, 3.2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <Interactive.Div
        name="Maison"
        style={{
          position: "absolute",
          top: 1275,
          width: "100%",
          textAlign: "center",
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 34,
          whiteSpace: "nowrap",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(239,232,225,0.82)",
          opacity: interpolate(frame, [2.5 * fps, 3.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Maison indépendante française
      </Interactive.Div>
      <Interactive.Div
        name="Collection"
        style={{
          position: "absolute",
          top: 1640,
          width: "100%",
          textAlign: "center",
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 32,
          whiteSpace: "nowrap",
          letterSpacing: "0.32em",
          color: "#c8101c",
          opacity: interpolate(frame, [3.2 * fps, 4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        COLLECTION 01 · AUTOMNE-HIVER
      </Interactive.Div>

      {/* fondu au noir final */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: interpolate(frame, [durationInFrames - 0.9 * fps, durationInFrames - 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <Vignette strength={0.85} />
      <Grain />
    </AbsoluteFill>
  );
};
