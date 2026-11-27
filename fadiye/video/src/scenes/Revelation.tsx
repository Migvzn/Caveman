import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Dust, Grain, Petals, RedGlow, Vignette } from "../components/Atmosphere";
import { LoopSequence, RenderSequence } from "../components/RenderSequence";

export const REVELATION_DURATION = 270;
const HERO = 104;

/** Légende basse qui apparaît puis disparaît. */
const Caption: React.FC<{ children: React.ReactNode; dur: number }> = ({ children, dur }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="Légende"
      style={{
        position: "absolute",
        top: 1585,
        width: "100%",
        textAlign: "center",
        fontFamily: "Jost",
        fontWeight: 300,
        fontSize: 44,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: "#efe8e1",
        opacity: interpolate(frame, [0, 10, dur - 10, dur], [0, 0.92, 0.92, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [0, 14], ["0px 18px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

/** Scène 3 — le cardigan apparaît (contre-plongée) puis tourne sur lui-même. */
export const Revelation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#050303" }}>
      {/* Fond : champ de lycoris ancré en bas, comme une scène */}
      <Img
        name="Fond lycoris"
        src={staticFile("images/lycoris_noir.jpg")}
        style={{
          position: "absolute",
          width: 1800,
          left: -360,
          top: 1920 - 1115,
          filter: `brightness(${interpolate(frame, [0, 2 * fps], [0.2, 0.62], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}) blur(3px)`,
          scale: interpolate(frame, [0, REVELATION_DURATION], [1.0, 1.08], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transformOrigin: "50% 100%",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #050303 0%, rgba(5,3,3,0.92) 40%, rgba(5,3,3,0.35) 70%, rgba(5,3,3,0.75) 100%)",
        }}
      />
      <RedGlow y="47%" size={820} intensity={0.5} />
      <Petals count={16} seed="revelation" opacity={0.5} />
      <Dust count={36} seed="rev" />

      {/* 1. Plan héros en contre-plongée */}
      <Sequence name="Plan héros" durationInFrames={HERO + 16}>
        <HeroShot />
      </Sequence>

      {/* 2. Rotation 360° */}
      <Sequence name="Rotation 360" from={HERO - 8}>
        <TurntableShot />
      </Sequence>

      {/* Titre */}
      <Interactive.Div
        name="Collection"
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          textAlign: "center",
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 36,
          letterSpacing: "0.55em",
          color: "#c8101c",
          opacity: interpolate(frame, [0.4 * fps, 1.2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        COLLECTION 01
      </Interactive.Div>
      <Interactive.Div
        name="Titre"
        style={{
          position: "absolute",
          top: 212,
          width: "100%",
          textAlign: "center",
          fontFamily: "Cormorant",
          fontWeight: 400,
          fontSize: 112,
          lineHeight: 1,
          color: "#efe8e1",
          opacity: interpolate(frame, [0.8 * fps, 1.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          filter: `blur(${interpolate(frame, [0.8 * fps, 1.8 * fps], [12, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
          translate: interpolate(frame, [0.8 * fps, 2 * fps], ["0px 30px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Cardigan <span style={{ fontStyle: "italic" }}>« Fadiye »</span>
      </Interactive.Div>
      <Interactive.Div
        name="Saison"
        style={{
          position: "absolute",
          top: 345,
          width: "100%",
          textAlign: "center",
          fontFamily: "Cormorant",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 52,
          color: "rgba(239,232,225,0.75)",
          opacity: interpolate(frame, [1.4 * fps, 2.3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Automne — Hiver
      </Interactive.Div>

      <Sequence name="Légende 1" from={50} durationInFrames={70}>
        <Caption dur={70}>Noir profond · Rouge intense</Caption>
      </Sequence>
      <Sequence name="Légende 2" from={124} durationInFrames={48}>
        <Caption dur={48}>Coupe oversize · boxy</Caption>
      </Sequence>
      <Sequence name="Légende 3" from={174} durationInFrames={48}>
        <Caption dur={48}>Épaules tombantes</Caption>
      </Sequence>
      <Sequence name="Légende 4" from={224} durationInFrames={46}>
        <Caption dur={46}>Maille 450 g/m²</Caption>
      </Sequence>

      <Vignette strength={0.75} />
      <Grain />
    </AbsoluteFill>
  );
};

const HeroShot: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(frame, [0, 14, HERO - 8, HERO + 8], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <RenderSequence
        shot="hero"
        frames={96}
        step={2}
        speed={96 / (HERO + 8)}
        style={{
          left: 0,
          top: 420,
          width: 1080,
          height: 1350,
          filter: `brightness(${interpolate(frame, [0, 30], [0.2, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}) drop-shadow(0 30px 60px rgba(0,0,0,0.8))`,
        }}
      />
    </AbsoluteFill>
  );
};

const TurntableShot: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(frame, [0, 16], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <LoopSequence
        shot="turntable"
        frames={150}
        speed={0.92}
        style={{
          left: -110,
          top: 360,
          width: 1300,
          height: 1300,
          filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.8))",
        }}
      />
    </AbsoluteFill>
  );
};
