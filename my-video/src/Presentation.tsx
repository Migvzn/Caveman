import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { AbsoluteFill } from "remotion";
import { Background } from "./components/Background";
import { Chrome, Music } from "./components/Overlays";
import * as S from "./scenes/Scenes";
import { SCENES, TRANSITION } from "./timeline";
import "./theme";

const VIEWS: Record<string, React.FC<{ info: (typeof SCENES)[number] }>> = {
  intro: S.Intro,
  accueil: S.Accueil,
  services: S.Services,
  formules: S.Formules,
  createurs: S.Createurs,
  formation: S.Formation,
  dashboard: S.Dashboard,
  modeles: S.Modeles,
  finance: S.Finance,
  recrutement: S.Recrutement,
  lecture: S.Lecture,
  mobile: S.Mobile,
  outro: S.Outro,
};

export const Presentation: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#1B1036" }}>
    <Background />
    <TransitionSeries>
      {SCENES.flatMap((s, i) => {
        const View = VIEWS[s.id];
        const seq = (
          <TransitionSeries.Sequence key={s.id} name={s.title} durationInFrames={s.duration}>
            <View info={s} />
          </TransitionSeries.Sequence>
        );
        if (i === 0) return [seq];
        return [
          <TransitionSeries.Transition
            key={s.id + "-t"}
            presentation={i % 3 === 0 ? slide({ direction: "from-right" }) : fade()}
            timing={linearTiming({ durationInFrames: TRANSITION })}
          />,
          seq,
        ];
      })}
    </TransitionSeries>
    <Chrome />
    <Music />
  </AbsoluteFill>
);
