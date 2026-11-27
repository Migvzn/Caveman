import React from "react";
import {
  AbsoluteFill,
  getStaticFiles,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { RedFlare } from "./components/Atmosphere";
import { EditorialFrame } from "./components/Editorial";
import { MUSIC } from "./music";
import { Ouverture } from "./scenes/Ouverture";
import { Manifeste, MANIFESTE_DURATION } from "./scenes/Manifeste";
import { Revelation } from "./scenes/Revelation";
import { Details, DETAILS_DURATION } from "./scenes/Details";
import { FicheTechnique } from "./scenes/FicheTechnique";
import { Signature } from "./scenes/Signature";

export const DUR = {
  ouverture: 150,
  manifeste: MANIFESTE_DURATION,
  revelation: 270,
  details: DETAILS_DURATION,
  fiche: 200,
  signature: 180,
};
const T = [20, 16, 20, 20];
// Repères du montage (images) : la révélation du cardigan tombe sur le temps fort à ~17 s
export const REVEAL = DUR.ouverture - T[0] + DUR.manifeste;
export const SIGNATURE_START =
  REVEAL + DUR.revelation - T[1] + DUR.details - T[2] + DUR.fiche - T[3];
export const PRESENTATION_DURATION =
  DUR.ouverture +
  DUR.manifeste +
  DUR.revelation +
  DUR.details +
  DUR.fiche +
  DUR.signature -
  T.reduce((a, b) => a + b, 0);

/** Vidéo de présentation Fadiye — format vertical 1080×1920. */
export const Presentation: React.FC = () => {
  const { durationInFrames, fps } = useVideoConfig();
  const hasMusic = getStaticFiles().some((f) => f.name === MUSIC.file);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Ouverture" durationInFrames={150}>
          <Ouverture />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence
          name="Manifeste"
          durationInFrames={DUR.manifeste}
        >
          <Manifeste />
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={34}>
          <RedFlare seed={3} />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence name="Révélation" durationInFrames={270}>
          <Revelation />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />
        <TransitionSeries.Sequence
          name="Détails"
          durationInFrames={DUR.details}
        >
          <Details />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence
          name="Fiche technique"
          durationInFrames={200}
        >
          <FicheTechnique />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence name="Signature" durationInFrames={180}>
          <Signature />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Sequence
        name="Habillage éditorial"
        from={REVEAL}
        durationInFrames={SIGNATURE_START + 10 - REVEAL}
      >
        <EditorialFrame fadeIn={24} fadeOut={20} offset={REVEAL} />
      </Sequence>
      {/* Musique : « Possession » — Sea Oleena, à partir de 3:02 (accord de l'artiste) */}
      {hasMusic ? (
        <Audio
          name="Possession — Sea Oleena"
          src={staticFile(MUSIC.file)}
          trimBefore={Math.round(MUSIC.startSeconds * fps)}
          volume={(f) =>
            interpolate(
              f,
              [0, 0.8 * fps, durationInFrames - 2 * fps, durationInFrames],
              [0, 1, 1, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            )
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
