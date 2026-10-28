import { Audio } from "@remotion/media";
import type { CSSProperties } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { between, EASE } from "../components/anim";
import { Browser, Phone } from "../components/Frames";
import { Logo, Points, SceneTitle, Subtitles } from "../components/Overlays";
import type { SceneInfo } from "../timeline";
import { C, FONT } from "../theme";

type P = { info: SceneInfo };
const SITE = "VAYNORA House";
const TEAM = "Espace équipe";

// Entrée d'une fenêtre : glisse, se redresse en 3D, apparaît.
const useEnter = (delay: number, from: "bottom" | "right" | "left" = "bottom", tilt = 0): CSSProperties => {
  const f = useCurrentFrame();
  const p = between(f, [delay, delay + 26], [0, 1], EASE);
  const dx = from === "right" ? 180 : from === "left" ? -180 : 0;
  const dy = from === "bottom" ? 140 : 0;
  return {
    opacity: between(f, [delay, delay + 12], [0, 1]),
    translate: `${(1 - p) * dx}px ${(1 - p) * dy}px`,
    transform: `perspective(2200px) rotateY(${tilt * (0.4 + 0.6 * p)}deg) rotateX(${(1 - p) * 8}deg)`,
  };
};
// Léger zoom continu pour donner de la vie aux plans fixes.
const useDrift = (duration: number, a = 1, b = 1.04) => {
  const f = useCurrentFrame();
  return between(f, [0, duration], [a, b], (t) => t);
};

const Voice: React.FC<P> = ({ info }) => <Audio src={staticFile(info.file)} from={info.lead} name={"Voix · " + info.title} />;
const Base: React.FC<P & { eyebrow: string; children: React.ReactNode }> = ({ info, eyebrow, children }) => (
  <AbsoluteFill>
    {children}
    <SceneTitle eyebrow={eyebrow} title={info.title} />
    <Subtitles text={info.text} lead={info.lead} voice={info.voice} />
    <Voice info={info} />
  </AbsoluteFill>
);

/* 1 — Intro */
export const Intro: React.FC<P> = ({ info }) => {
  const f = useCurrentFrame();
  const letters = "VAYNORA".split("");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, scale: between(f, [0, info.duration], [1, 1.06], (t) => t) }}>
        <Logo size={210} delay={4} />
        <div style={{ display: "flex", gap: 6 }}>
          {letters.map((l, i) => (
            <span
              key={i}
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: 120,
                letterSpacing: "0.12em",
                opacity: between(f, [30 + i * 3, 42 + i * 3], [0, 1]),
                translate: `0 ${between(f, [30 + i * 3, 50 + i * 3], [40, 0])}px`,
                display: "inline-block",
              }}
            >
              {l}
            </span>
          ))}
        </div>
        <div style={{ color: C.sky, fontWeight: 800, fontSize: 30, letterSpacing: "0.6em", marginTop: -26, opacity: between(f, [52, 66], [0, 1]) }}>HOUSE</div>
        <div style={{ color: C.muted, fontWeight: 600, fontSize: 40, marginTop: 10, opacity: between(f, [66, 84], [0, 1]), translate: `0 ${between(f, [66, 90], [20, 0])}px` }}>
          Présentation du site · Agence & Espace équipe
        </div>
      </div>
      <Subtitles text={info.text} lead={info.lead} voice={info.voice} />
      <Voice info={info} />
    </AbsoluteFill>
  );
};

/* 2 — Accueil du site */
export const Accueil: React.FC<P> = ({ info }) => {
  const e = useEnter(6, "right", -9);
  return (
    <Base info={info} eyebrow="Site public · 01">
      <Points x={110} y={330} delay={24} items={["Design clair et moderne", "Promesses concrètes", "Aperçu du tableau de bord"]} />
      <Browser shot="p-home-full" width={1100} url={SITE + " — Accueil"} scroll={{ from: 0, to: 2300, start: info.duration * 0.45, end: info.duration - 8 }} style={{ left: 720, top: 210, ...e }} />
    </Base>
  );
};

/* 3 — Services & méthode */
export const Services: React.FC<P> = ({ info }) => {
  const a = useEnter(4, "bottom", 6), b = useEnter(22, "bottom", -6);
  return (
    <Base info={info} eyebrow="Site public · 02">
      <Browser shot="p-services-full" width={820} url={SITE + " — Services"} scroll={{ from: 0, to: 2600, start: 30, end: info.duration - 10 }} style={{ left: 110, top: 300, ...a }} />
      <Browser shot="p-methode-full" width={820} url={SITE + " — Méthode"} scroll={{ from: 0, to: 2400, start: 60, end: info.duration - 10 }} style={{ left: 990, top: 300, ...b }} />
    </Base>
  );
};

/* 4 — Formules */
export const Formules: React.FC<P> = ({ info }) => {
  const e = useEnter(4, "bottom");
  return (
    <Base info={info} eyebrow="Site public · 03">
      <Browser
        shot="p-formules-full"
        width={1240}
        url={SITE + " — Formules"}
        scroll={{ from: 300, to: 1700, start: 40, end: info.duration - 15 }}
        style={{ left: 340, top: 235, ...e }}
      />
    </Base>
  );
};

/* 5 — Créatrices & candidature */
export const Createurs: React.FC<P> = ({ info }) => {
  const a = useEnter(4, "left", 7), b = useEnter(Math.round(info.duration * 0.45), "right", -8);
  return (
    <Base info={info} eyebrow="Site public · 04">
      <Browser shot="p-createurs-full" width={1060} url={SITE + " — Créatrices"} scroll={{ from: 0, to: 2900, start: 20, end: info.duration * 0.6 }} style={{ left: 110, top: 270, ...a }} />
      <Browser shot="p-candidature-view" width={820} url={SITE + " — Candidature"} style={{ left: 990, top: 330, ...b }} />
    </Base>
  );
};

/* 6 — Formation (page publique) */
export const Formation: React.FC<P> = ({ info }) => {
  const e = useEnter(4, "bottom");
  return (
    <Base info={info} eyebrow="Site public · 05">
      <Browser shot="p-formation-full" width={1240} url={SITE + " — Formation OFM"} scroll={{ from: 0, to: 3300, start: 30, end: info.duration - 10 }} style={{ left: 340, top: 235, ...e }} />
    </Base>
  );
};

/* 7 — Espace équipe : connexion puis tableau de bord */
export const Dashboard: React.FC<P> = ({ info }) => {
  const f = useCurrentFrame();
  const e = useEnter(4, "bottom");
  const swap = 62;
  const dash = between(f, [swap, swap + 14], [0, 1]);
  const D = info.duration;
  return (
    <Base info={info} eyebrow="Espace équipe · 01">
      <div style={{ position: "absolute", left: 340, top: 235, width: 1240, height: 860, ...e }}>
        <Browser shot="e-login" width={1240} url={TEAM + " — Connexion"} style={{ left: 0, top: 0, opacity: 1 - dash }} />
        <Browser
          shot="e-home-full"
          width={1240}
          url={TEAM + " — Vue d'ensemble"}
          scroll={{ from: 0, to: 1050, start: D * 0.62, end: D - 12 }}
          highlights={[
            { x: 280, y: 256, w: 322, h: 262, from: swap + 30, to: swap + 105 },
            { x: 614, y: 256, w: 800, h: 262, from: swap + 105, to: Math.round(D * 0.6) },
            { x: 280, y: 538, w: 744, h: 520, from: Math.round(D * 0.7), to: D - 4 },
          ]}
          style={{ left: 0, top: 0, opacity: dash }}
        />
      </div>
    </Base>
  );
};

/* 8 — Modèles & revenus */
export const Modeles: React.FC<P> = ({ info }) => {
  const l = useEnter(4, "left", 6), c = useEnter(18, "bottom"), r = useEnter(Math.round(info.duration * 0.55), "right", -6);
  return (
    <Base info={info} eyebrow="Espace équipe · 02">
      <Browser shot="e-modeles" width={760} url={TEAM + " — Modèles"} style={{ left: 110, top: 330, ...l }} />
      <Browser shot="e-modele-full" width={1000} url={TEAM + " — Fiche modèle"} scroll={{ from: 0, to: 1500, start: 40, end: info.duration * 0.62 }} style={{ left: 460, top: 250, ...c }} />
      <Browser shot="e-saisie" width={820} url={TEAM + " — Saisie des revenus"} style={{ left: 990, top: 360, ...r }} />
    </Base>
  );
};

/* 9 — Chatters & finance */
export const Finance: React.FC<P> = ({ info }) => {
  const a = useEnter(4, "left", 6), b = useEnter(Math.round(info.duration * 0.42), "right", -6);
  return (
    <Base info={info} eyebrow="Espace équipe · 03">
      <Browser shot="e-chatters" width={980} url={TEAM + " — Chatters"} style={{ left: 110, top: 280, scale: useDrift(info.duration, 1, 1.03), ...a }} />
      <Browser
        shot="e-finance-full"
        width={1000}
        url={TEAM + " — Finance"}
        scroll={{ from: 0, to: 1200, start: info.duration * 0.5, end: info.duration - 10 }}
        style={{ left: 820, top: 250, ...b }}
      />
    </Base>
  );
};

/* 10 — Recrutement & candidatures */
export const Recrutement: React.FC<P> = ({ info }) => {
  const a = useEnter(4, "bottom", 5), b = useEnter(Math.round(info.duration * 0.45), "right", -7);
  return (
    <Base info={info} eyebrow="Espace équipe · 04">
      <Browser shot="e-recrutement" width={1150} url={TEAM + " — Recrutement"} style={{ left: 110, top: 270, scale: useDrift(info.duration, 1, 1.03), ...a }} />
      <Browser shot="e-candidatures" width={860} url={TEAM + " — Candidatures"} style={{ left: 950, top: 360, ...b }} />
    </Base>
  );
};

/* 11 — Lecture de la formation & comptes */
export const Lecture: React.FC<P> = ({ info }) => {
  const a = useEnter(4, "left", 6), b = useEnter(Math.round(info.duration * 0.5), "right", -7);
  return (
    <Base info={info} eyebrow="Espace équipe · 05">
      <Browser shot="e-lecon" width={1080} url={TEAM + " — Formation"} style={{ left: 110, top: 260, scale: useDrift(info.duration, 1, 1.04), ...a }} />
      <Browser shot="e-users" width={820} url={TEAM + " — Utilisateurs"} style={{ left: 990, top: 380, ...b }} />
    </Base>
  );
};

/* 12 — Mobile */
export const Mobile: React.FC<P> = ({ info }) => {
  const d = info.duration;
  const s = [useEnter(2, "bottom"), useEnter(10, "bottom"), useEnter(18, "bottom")];
  return (
    <Base info={info} eyebrow="Partout">
      <Phone shot="m-home-full" width={290} scroll={{ from: 0, to: 2600, start: 16, end: d }} style={{ left: 560, top: 250, rotate: "-4deg", ...s[0] }} />
      <Phone shot="m-dash-full" width={300} scroll={{ from: 0, to: 1500, start: 24, end: d }} style={{ left: 815, top: 215, ...s[1] }} />
      <Phone shot="m-formules-full" width={290} scroll={{ from: 600, to: 2200, start: 30, end: d }} style={{ left: 1075, top: 250, rotate: "4deg", ...s[2] }} />
    </Base>
  );
};

/* 13 — Outro */
export const Outro: React.FC<P> = ({ info }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <Logo size={170} />
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 110, letterSpacing: "-0.03em", textAlign: "center", lineHeight: 1.04, opacity: between(f, [20, 36], [0, 1]), translate: `0 ${between(f, [20, 44], [30, 0])}px` }}>
          Votre talent.<br />
          <span style={{ color: C.sky }}>Notre maison.</span>
        </div>
        <div
          style={{
            marginTop: 16,
            padding: "24px 44px",
            borderRadius: 18,
            background: C.blue,
            color: "#fff",
            fontWeight: 800,
            fontSize: 40,
            boxShadow: "0 20px 50px -16px rgba(47,91,255,.9)",
            opacity: between(f, [44, 58], [0, 1]),
            scale: between(f, [44, 64], [0.85, 1]),
          }}
        >
          Rejoindre la House
        </div>
        <div style={{ color: C.muted, fontWeight: 600, fontSize: 30, opacity: between(f, [60, 76], [0, 1]) }}>Site public · Espace équipe · Formation OFM</div>
      </div>
      <Voice info={info} />
    </AbsoluteFill>
  );
};
