import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

/** Mot animé lettre par lettre : flou → net, montée légère, interlettrage qui se resserre. */
export const StaggerText: React.FC<{
  text: string;
  start?: number;
  stagger?: number;
  dur?: number;
  style?: React.CSSProperties;
}> = ({ text, start = 0, stagger = 2.2, dur = 18, style }) => {
  const frame = useCurrentFrame();
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", ...style }}>
      {Array.from(text).map((ch, i) => {
        const p = interpolate(frame, [start + i * stagger, start + i * stagger + dur], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const e = 1 - Math.pow(1 - p, 3);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: e,
              filter: `blur(${(1 - e) * 10}px)`,
              translate: `0px ${(1 - e) * 28}px`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** Reflet lumineux qui balaie une image détourée (logo, fleur). */
export const Shine: React.FC<{
  src: string;
  start: number;
  dur?: number;
  style: React.CSSProperties;
}> = ({ src, start, dur = 26, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [-30, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const url = `url(${staticFile(src)})`;
  return (
    <div
      style={{
        position: "absolute",
        ...style,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        background: `linear-gradient(105deg, rgba(255,255,255,0) ${p - 14}%, rgba(255,210,200,0.85) ${p}%, rgba(255,255,255,0) ${p + 14}%)`,
        mixBlendMode: "screen",
        opacity: frame > start && frame < start + dur ? 1 : 0,
      }}
    />
  );
};

/** Habillage éditorial façon lookbook : mentions dans les coins + repères de cadre. */
export const EditorialFrame: React.FC<{ fadeIn?: number; fadeOut?: number; offset?: number }> = ({
  fadeIn = 15,
  fadeOut = 15,
  offset = 0,
}) => {
  const frame = useCurrentFrame();
  const tcFrame = frame + offset;
  const { durationInFrames, fps } = useVideoConfig();
  const o = interpolate(frame, [0, fadeIn, durationInFrames - fadeOut, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const secs = Math.floor(tcFrame / fps);
  const tc = `00:${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}:${String(tcFrame % fps).padStart(2, "0")}`;
  const txt: React.CSSProperties = {
    position: "absolute",
    fontFamily: "Jost",
    fontWeight: 300,
    fontSize: 24,
    letterSpacing: "0.32em",
    color: "rgba(239,232,225,0.55)",
    whiteSpace: "nowrap",
  };
  const corner = (pos: React.CSSProperties, rot: number) => (
    <div
      style={{
        position: "absolute",
        width: 34,
        height: 34,
        borderLeft: "2px solid rgba(200,16,28,0.8)",
        borderTop: "2px solid rgba(200,16,28,0.8)",
        rotate: `${rot}deg`,
        ...pos,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      {corner({ left: 44, top: 44 }, 0)}
      {corner({ right: 44, top: 44 }, 90)}
      {corner({ right: 44, bottom: 44 }, 180)}
      {corner({ left: 44, bottom: 44 }, 270)}
      <div style={{ ...txt, left: 92, top: 52 }}>FADIYE</div>
      <div style={{ ...txt, right: 92, top: 52, textAlign: "right" }}>CO. 01 — AH</div>
      <div style={{ ...txt, left: 92, bottom: 52 }}>MAISON FRANÇAISE</div>
      <div style={{ ...txt, right: 92, bottom: 52, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{tc}</div>
      <Img
        src={staticFile("images/lycoris_icone.png")}
        style={{ position: "absolute", left: 540 - 14, top: 40, width: 28, opacity: 0.8 }}
      />
    </AbsoluteFill>
  );
};
