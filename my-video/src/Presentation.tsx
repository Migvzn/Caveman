import { linearTiming, TransitionSeries, type TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, Easing } from "remotion";
import { Background, DropFlash } from "./components/Background";
import { Chrome, Music } from "./components/Overlays";
import * as S from "./scenes/Scenes";
import { FRAMES, SCENES, TF } from "./timeline";
import "./theme";

const VIEWS: Record<string, React.FC<{ info: (typeof SCENES)[number] }>> = {
  intro: S.Intro, accueil: S.Accueil, services: S.Services, formules: S.Formules, createurs: S.Createurs, formation: S.Formation,
  dashboard: S.Dashboard, modeles: S.Modeles, finance: S.Finance, recrutement: S.Recrutement, lecture: S.Lecture, mobile: S.Mobile, outro: S.Outro,
};

// Transitions 3D : la scène pivote comme un carrousel, ou on « traverse » l'écran.
type TP = { mode: "turn" | "zoom"; dir: number };
const Trans: React.FC<TransitionPresentationComponentProps<TP>> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const { mode, dir } = passedProps;
  const out = presentationDirection === "exiting";
  const style =
    mode === "turn"
      ? out
        ? { opacity: 1 - p, transform: `translateZ(${-520 * p}px) rotateY(${-48 * p * dir}deg)` }
        : { opacity: p, transform: `translateZ(${-520 * (1 - p)}px) rotateY(${48 * (1 - p) * dir}deg)` }
      : out
        ? { opacity: 1 - p, transform: `translateZ(${700 * p}px)` }
        : { opacity: p, transform: `translateZ(${-900 * (1 - p)}px)` };
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <AbsoluteFill style={{ ...style, transformStyle: "preserve-3d" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
const presentation = (i: number) => ({ component: Trans, props: { mode: i % 2 ? "turn" : "zoom", dir: i % 4 === 1 ? 1 : -1 } as TP });

export const Presentation: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#1B1036" }}>
    <Background />
    <TransitionSeries>
      {SCENES.flatMap((s, i) => {
        const View = VIEWS[s.id];
        const seq = (
          <TransitionSeries.Sequence key={s.id} name={s.title} durationInFrames={FRAMES[i]}>
            <View info={s} />
          </TransitionSeries.Sequence>
        );
        if (i === 0) return [seq];
        return [
          <TransitionSeries.Transition key={s.id + "-t"} presentation={presentation(i)} timing={linearTiming({ durationInFrames: TF, easing: Easing.bezier(0.65, 0, 0.35, 1) })} />,
          seq,
        ];
      })}
    </TransitionSeries>
    <DropFlash />
    <Chrome />
    <Music />
  </AbsoluteFill>
);
