import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Grain, Vignette } from "../components/Atmosphere";
import { RenderSequence } from "../components/RenderSequence";

// une coupe toutes les ~2,8 s (3 temps à 65 BPM)
const SHOT = 98;
const XFADE = 14;
export const DETAILS_DURATION = SHOT * 4 - XFADE * 3;

type DetailProps = {
  shot: string;
  index: string;
  title: React.ReactNode;
  spec: string;
};

/** Un plan macro plein cadre + sa légende façon fiche technique. */
const Detail: React.FC<DetailProps> = ({ shot, index, title, spec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#050303" }}>
      <RenderSequence
        shot={shot}
        frames={90}
        step={1}
        speed={90 / SHOT}
        style={{
          inset: 0,
          scale: interpolate(frame, [0, SHOT], [1.0, 1.06], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(5,3,3,0.55) 0%, rgba(5,3,3,0) 18%, rgba(5,3,3,0) 58%, rgba(5,3,3,0.92) 84%, #050303 100%)",
        }}
      />
      <Interactive.Div
        name="Index"
        style={{
          position: "absolute",
          left: 96,
          top: 1490,
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 34,
          letterSpacing: "0.4em",
          color: "#c8101c",
          opacity: interpolate(frame, [0.2 * fps, 0.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {index}
      </Interactive.Div>
      <Interactive.Div
        name="Trait"
        style={{
          position: "absolute",
          left: 96,
          top: 1550,
          width: 300,
          height: 2,
          backgroundColor: "#c8101c",
          transformOrigin: "0% 50%",
          scale: interpolate(frame, [0.3 * fps, 1.1 * fps], ["0 1", "1 1"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <Interactive.Div
        name="Titre"
        style={{
          position: "absolute",
          left: 92,
          right: 60,
          top: 1580,
          fontFamily: "Cormorant",
          fontWeight: 400,
          fontSize: 96,
          lineHeight: 1.02,
          color: "#efe8e1",
          opacity: interpolate(frame, [0.35 * fps, 1.1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0.35 * fps, 1.3 * fps],
            ["0px 26px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Spécification"
        style={{
          position: "absolute",
          left: 98,
          right: 60,
          top: 1700,
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 40,
          letterSpacing: "0.04em",
          color: "rgba(239,232,225,0.78)",
          opacity: interpolate(frame, [0.7 * fps, 1.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {spec}
      </Interactive.Div>
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

/** Scène 4 — les détails, comme sur la fiche technique. */
export const Details: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050303" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Bouton signature"
          durationInFrames={SHOT}
        >
          <Detail
            shot="macro_bouton"
            index="01 / 04"
            title={<>Bouton signature</>}
            spec="Fleur Lycoris · métal argenté · Ø 20 mm"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: XFADE })}
        />
        <TransitionSeries.Sequence name="Crochets" durationInFrames={SHOT}>
          <Detail
            shot="boutons"
            index="02 / 04"
            title={<>Crochets métalliques</>}
            spec="Finition polie · maintien renforcé"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: XFADE })}
        />
        <TransitionSeries.Sequence name="Broderie" durationInFrames={SHOT}>
          <Detail
            shot="broderie"
            index="03 / 04"
            title={
              <>
                Broderie <span style={{ fontStyle: "italic" }}>« Fadiye »</span>
              </>
            }
            spec="Relief haute densité · fil rouge"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: XFADE })}
        />
        <TransitionSeries.Sequence name="Col" durationInFrames={SHOT}>
          <Detail
            shot="col"
            index="04 / 04"
            title={<>Col rond côtelé</>}
            spec="Côtelé 2×2 · étiquette tissée"
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Grain />
    </AbsoluteFill>
  );
};
