import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { RedFlare } from "./components/Atmosphere";
import { EditorialFrame } from "./components/Editorial";
import { Ouverture } from "./scenes/Ouverture";
import { Manifeste } from "./scenes/Manifeste";
import { Revelation } from "./scenes/Revelation";
import { Details } from "./scenes/Details";
import { FicheTechnique } from "./scenes/FicheTechnique";
import { Signature } from "./scenes/Signature";

export const DUR = {
  ouverture: 150,
  manifeste: 288,
  revelation: 270,
  details: 92 * 4 - 14 * 3,
  fiche: 200,
  signature: 180,
};
const T = [20, 16, 20, 20];
export const PRESENTATION_DURATION =
  DUR.ouverture + DUR.manifeste + DUR.revelation + DUR.details + DUR.fiche + DUR.signature -
  T.reduce((a, b) => a + b, 0);

/** Vidéo de présentation Fadiye — format vertical 1080×1920. */
export const Presentation: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Ouverture" durationInFrames={150}>
          <Ouverture />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />
        <TransitionSeries.Sequence name="Manifeste" durationInFrames={288}>
          <Manifeste />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={34}>
          <RedFlare seed={3} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="Révélation" durationInFrames={270}>
          <Revelation />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 16 })} />
        <TransitionSeries.Sequence name="Détails" durationInFrames={326}>
          <Details />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />
        <TransitionSeries.Sequence name="Fiche technique" durationInFrames={200}>
          <FicheTechnique />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />
        <TransitionSeries.Sequence name="Signature" durationInFrames={180}>
          <Signature />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Sequence name="Habillage éditorial" from={418} durationInFrames={1168 - 418}>
        <EditorialFrame fadeIn={24} fadeOut={20} offset={418} />
      </Sequence>
      <Audio
        name="Ambiance"
        src={staticFile("audio/ambiance.wav")}
        volume={(f) =>
          interpolate(f, [0, 0.6 * fps, durationInFrames - 1.2 * fps, durationInFrames], [0, 0.9, 0.9, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
