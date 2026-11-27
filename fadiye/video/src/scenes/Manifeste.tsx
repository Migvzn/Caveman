import React from "react";
import {
  AbsoluteFill,
  AnimatedImage,
  Easing,
  Img,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Dust,
  Grain,
  Petals,
  RedGlow,
  Vignette,
} from "../components/Atmosphere";
import { StaggerText } from "../components/Editorial";

// 3 panneaux de 4,2 s : la révélation tombe sur le temps fort de la musique (≈ 17 s)
export const PANEL = 126;
export const MANIFESTE_DURATION = PANEL * 3;

/** Mot du manifeste + phrase, animation commune (flou → net, interlettrage). */
const Word: React.FC<{
  index: string;
  word: string;
  line: string;
  top: number;
}> = ({ index, word, line, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Interactive.Div
        name="Numéro"
        style={{
          position: "absolute",
          top: top - 70,
          width: "100%",
          textAlign: "center",
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 34,
          letterSpacing: "0.5em",
          color: "#c8101c",
          opacity: interpolate(
            frame,
            [0.1 * fps, 0.6 * fps, PANEL - 10, PANEL],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {index}
      </Interactive.Div>
      <Interactive.Div
        name="Mot"
        style={{
          position: "absolute",
          top,
          width: "100%",
          textAlign: "center",
          fontFamily: "Cormorant",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 176,
          lineHeight: 1,
          color: "#efe8e1",
          textShadow: "0 0 50px rgba(0,0,0,0.9)",
          letterSpacing: interpolate(
            frame,
            [0.2 * fps, 2.2 * fps],
            ["0.05em", "0.01em"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          opacity: interpolate(frame, [PANEL - 10, PANEL], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <StaggerText text={word} start={0.15 * fps} stagger={2.4} dur={20} />
      </Interactive.Div>
      <Interactive.Div
        name="Phrase"
        style={{
          position: "absolute",
          top: top + 215,
          left: 110,
          right: 110,
          textAlign: "center",
          fontFamily: "Cormorant",
          fontWeight: 400,
          fontSize: 50,
          lineHeight: 1.25,
          color: "rgba(239,232,225,0.8)",
          textShadow: "0 0 30px rgba(0,0,0,0.9)",
          translate: interpolate(
            frame,
            [0.9 * fps, 1.9 * fps],
            ["0px 24px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
          opacity: interpolate(
            frame,
            [0.9 * fps, 1.7 * fps, PANEL - 10, PANEL],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {line}
      </Interactive.Div>
    </>
  );
};

/** Fenêtre "souvenir" : un GIF net au centre, sa version floue en fond. */
const MemoryWindow: React.FC<{
  src: string;
  ratio: number;
  top: number;
  tint?: boolean;
}> = ({ src, ratio, top, tint }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = 920;
  const h = Math.round(w / ratio);
  return (
    <>
      <AnimatedImage
        src={src}
        width={1080 * 2.2}
        height={(1080 * 2.2) / ratio}
        fit="cover"
        style={{
          position: "absolute",
          left: 540 - 1080 * 1.1,
          top: top + h / 2 - (1080 * 1.1) / ratio,
          filter: `blur(46px) brightness(${tint ? 0.16 : 0.45}) saturate(1.3)`,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - w / 2,
          top,
          width: w,
          height: h,
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.85)",
          clipPath: `inset(${interpolate(frame, [0, 0.9 * fps], [50, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}% 0 ${interpolate(frame, [0, 0.9 * fps], [50, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}% 0)`,
        }}
      >
        <AnimatedImage
          src={src}
          width={w}
          height={h}
          fit="cover"
          style={{
            scale: interpolate(frame, [0, PANEL], [1.12, 1.0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            filter: tint
              ? "saturate(0.85) contrast(1.05)"
              : "saturate(1.1) contrast(1.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 90px rgba(0,0,0,0.55)",
          }}
        />
      </div>
    </>
  );
};

/** Scène 2 — Élégance. Floral. Mélancolie. */
export const Manifeste: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050303" }}>
      <Sequence name="Élégance" durationInFrames={PANEL}>
        <ElegancePanel />
      </Sequence>
      <Sequence name="Floral" from={PANEL} durationInFrames={PANEL}>
        <AbsoluteFill>
          <MemoryWindow
            src={staticFile("images/lycoris_coucher.gif")}
            ratio={600 / 338}
            top={400}
          />
          <Petals count={14} seed="floral" opacity={0.6} />
          <Word
            index="II"
            word="Floral."
            line="Le lycoris, notre emblème."
            top={1120}
          />
        </AbsoluteFill>
      </Sequence>
      <Sequence name="Mélancolie" from={2 * PANEL} durationInFrames={PANEL}>
        <AbsoluteFill>
          <MemoryWindow
            src={staticFile("images/lycoris_blanc.gif")}
            ratio={500 / 280}
            top={400}
            tint
          />
          <Word
            index="III"
            word="Mélancolie."
            line="Une fleur qui éclot quand tout s'éteint."
            top={1120}
          />
        </AbsoluteFill>
      </Sequence>
      <Vignette strength={0.8} />
      <Grain />
    </AbsoluteFill>
  );
};

const ElegancePanel: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Img
        name="Champ de lycoris"
        src={staticFile("images/lycoris_noir.jpg")}
        style={{
          position: "absolute",
          height: 1920,
          left: -600,
          top: 0,
          filter: `brightness(0.55) blur(${interpolate(
            frame,
            [0, 40],
            [8, 1.5],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )}px)`,
          scale: interpolate(frame, [0, PANEL], [1.14, 1.04], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0, PANEL], ["0px 0px", "60px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(5,3,3,0.2) 0%, rgba(5,3,3,0.15) 40%, rgba(5,3,3,0.85) 75%, #050303 100%)",
        }}
      />
      <RedGlow y="70%" size={700} intensity={0.25} />
      <Dust count={30} seed="eleg" />
      <Word
        index="I"
        word="Élégance."
        line="La ligne juste, sans un mot de trop."
        top={1060}
      />
    </AbsoluteFill>
  );
};
