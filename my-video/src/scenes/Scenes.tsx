import { Audio } from "@remotion/media";
import type { CSSProperties } from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { BACK, between, EASE, SMOOTH, useT } from "../components/anim";
import { SceneStart, useG } from "../components/Clock";
import { Browser, FloatCard, Phone, type ShotKey } from "../components/Frames";
import { Logo3D, Points, SceneTitle, Subtitles } from "../components/Overlays";
import shots from "../shots.json";
import { barPulse, beatPulse, type SceneInfo } from "../timeline";
import { C, FONT } from "../theme";

type P = { info: SceneInfo };
const SITE = "VAYNORA House";
const TEAM = "Espace équipe";
const B = 0.534; // un temps
const onBeat = (s: number) => Math.round(s / B) * B;

// Entrée 3D d'un élément : arrive de loin, se redresse, puis flotte doucement.
type E = { at: number; from?: "bottom" | "left" | "right" | "back"; ry?: number; rx?: number; z?: number; rz?: number; float?: number };
const use3D = ({ at, from = "bottom", ry = 0, rx = 0, z = 0, rz = 0, float = 1 }: E): CSSProperties => {
  const t = useT();
  const p = between(t, [at, at + 0.8], [0, 1], EASE);
  const dx = from === "right" ? 320 : from === "left" ? -320 : 0;
  const dy = from === "bottom" ? 240 : 0;
  const turn = from === "right" ? -40 : from === "left" ? 40 : 0;
  const fy = Math.sin((t + at) * 1.25) * 7 * float;
  return {
    opacity: between(t, [at, at + 0.22], [0, 1]),
    transform: `translate3d(${(1 - p) * dx}px, ${(1 - p) * dy + fy}px, ${z - (1 - p) * (from === "back" ? 1100 : 420)}px) rotateY(${ry + (1 - p) * turn}deg) rotateX(${rx + (1 - p) * 20}deg) rotateZ(${rz}deg)`,
  };
};

// Caméra 3D : léger mouvement orbital continu et poussée sur chaque mesure.
const Stage: React.FC<{ children: React.ReactNode; orbit?: number; tilt?: number }> = ({ children, orbit = 1, tilt = 2.5 }) => {
  const t = useT();
  const g = useG();
  const bp = barPulse(g, 0.45);
  return (
    <AbsoluteFill style={{ perspective: 2000, perspectiveOrigin: "50% 42%" }}>
      <AbsoluteFill
        style={{
          transformStyle: "preserve-3d",
          transform: `translateZ(${bp * 18}px) rotateX(${tilt + Math.cos(t * 0.5) * 1.6 * orbit}deg) rotateY(${Math.sin(t * 0.42) * 3.6 * orbit}deg)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Voice: React.FC<P> = ({ info }) => {
  const { fps } = useVideoConfig();
  return <Audio src={staticFile(info.file)} from={Math.round(info.lead * fps)} name={"Voix · " + info.title} />;
};

const Base: React.FC<P & { eyebrow: string; children: React.ReactNode; orbit?: number }> = ({ info, eyebrow, children, orbit }) => (
  <SceneStart.Provider value={info.start}>
    <AbsoluteFill>
      <Stage orbit={orbit}>{children}</Stage>
      <SceneTitle eyebrow={eyebrow} title={info.title} />
      <Subtitles text={info.text} lead={info.lead} voice={info.voice} />
      <Voice info={info} />
    </AbsoluteFill>
  </SceneStart.Provider>
);

// Carte chiffrée qui surgit au premier plan sur un temps et rebondit sur les temps suivants.
const Pop: React.FC<{ at: number; value: string; label: string; x: number; y: number; z?: number; ry?: number }> = ({ at, value, label, x, y, z = 240, ry = 0 }) => {
  const t = useT();
  const g = useG();
  const p = between(t, [at, at + 0.5], [0, 1], BACK);
  const bp = t > at + 0.5 ? beatPulse(g, 0.18) : 0;
  return (
    <FloatCard
      value={value}
      label={label}
      style={{
        left: x,
        top: y,
        opacity: between(t, [at, at + 0.15], [0, 1]),
        transform: `translate3d(0, ${Math.sin((t + at) * 1.6) * 8}px, ${z * p}px) rotateY(${ry}deg) scale(${(0.4 + 0.6 * p) * (1 + bp * 0.035)})`,
      }}
    />
  );
};

/* 1 — Intro : carrousel 3D du site pendant la montée, puis le logo explose sur le drop */
const TILES: ShotKey[] = ["p-home-view", "e-home", "p-formules-view", "e-finance", "p-createurs-view", "e-recrutement", "p-formation-view", "e-candidatures", "p-methode-view", "e-modeles"];
export const Intro: React.FC<P> = ({ info }) => {
  const t = useT();
  const slam = info.slam ?? 8.67;
  const R = 1450 + between(t, [slam, slam + 0.6], [0, 2600], EASE);
  const spin = 18 * t + between(t, [slam - 3, slam], [0, 55], (x) => x * x * x);
  const carousel = Math.min(between(t, [0, 1.4], [0, 1]), between(t, [slam, slam + 0.45], [1, 0]));
  const letters = "VAYNORA".split("");
  return (
    <SceneStart.Provider value={info.start}>
      <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "50% 45%" }}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 520,
            transformStyle: "preserve-3d",
            opacity: carousel,
            transform: `translateZ(${-R - 380 + between(t, [0, slam], [-500, 120], SMOOTH)}px) rotateX(-6deg) rotateY(${-spin}deg)`,
          }}
        >
          {TILES.map((s, i) => (
            <Img
              key={s}
              src={staticFile(shots[s].file)}
              style={{
                position: "absolute",
                width: 780,
                height: 487,
                left: -390,
                top: -244,
                borderRadius: 22,
                objectFit: "cover",
                objectPosition: "top",
                boxShadow: "0 0 60px rgba(47,91,255,.35)",
                transform: `rotateY(${i * 36}deg) translateZ(${R}px)`,
                backfaceVisibility: "hidden",
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(27,16,54,.15) 30%, rgba(27,16,54,.85) 85%)", opacity: carousel }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, marginTop: -40 }}>
          <Logo3D size={220} at={slam} />
          <div style={{ display: "flex", gap: 8, perspective: 800 }}>
            {letters.map((l, i) => {
              const s = slam + 0.3 + (i * B) / 2;
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 124,
                    letterSpacing: "0.1em",
                    opacity: between(t, [s, s + 0.12], [0, 1]),
                    transform: `rotateX(${between(t, [s, s + 0.45], [-100, 0], BACK)}deg) translateZ(${between(t, [s, s + 0.45], [200, 0])}px)`,
                    textShadow: "0 0 40px rgba(127,162,255,.55)",
                  }}
                >
                  {l}
                </span>
              );
            })}
          </div>
          <div style={{ color: C.sky, fontWeight: 800, fontSize: 30, letterSpacing: "0.62em", marginTop: -26, opacity: between(t, [slam + 2.2, slam + 2.5], [0, 1]), translate: `0 ${between(t, [slam + 2.2, slam + 2.7], [16, 0])}px` }}>HOUSE</div>
          <div style={{ color: C.muted, fontWeight: 600, fontSize: 38, opacity: between(t, [slam + 2.75, slam + 3.1], [0, 1]), translate: `0 ${between(t, [slam + 2.75, slam + 3.3], [20, 0])}px` }}>
            Présentation du site · Agence & Espace équipe
          </div>
        </div>
      </AbsoluteFill>
      <Subtitles text={info.text} lead={info.lead} voice={info.voice} />
      <Voice info={info} />
    </SceneStart.Provider>
  );
};

/* 2 — Accueil */
export const Accueil: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Site public · 01">
      <Points x={110} y={330} items={["Design clair et moderne", "Promesses concrètes", "Aperçu du tableau de bord"]} />
      <Browser shot="p-home-full" width={1120} url={SITE + " — Accueil"} scroll={{ from: 0, to: 2300, start: d * 0.5, end: d - 0.3 }} style={{ left: 700, top: 215, ...use3D({ at: 0.3, from: "right", ry: -16 }) }} />
      <Pop at={onBeat(2.6)} value="48 h" label="pour répondre" x={560} y={660} />
      <Pop at={onBeat(3.2)} value="0 €" label="de frais d'entrée" x={820} y={770} z={300} />
    </Base>
  );
};

/* 3 — Services & méthode : deux pages ouvertes comme un livre */
export const Services: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Site public · 02">
      <Browser shot="p-services-full" width={830} url={SITE + " — Services"} scroll={{ from: 0, to: 2600, start: 1.2, end: d - 0.3 }} style={{ left: 110, top: 290, ...use3D({ at: 0.35, from: "left", ry: 17 }) }} />
      <Browser shot="p-methode-full" width={830} url={SITE + " — Méthode"} scroll={{ from: 0, to: 2400, start: 1.8, end: d - 0.3 }} style={{ left: 980, top: 290, ...use3D({ at: 0.35 + B * 2, from: "right", ry: -17, z: -40 }) }} />
      <Pop at={onBeat(4)} value="6" label="métiers, une équipe" x={760} y={690} z={320} />
      <Pop at={onBeat(7.5)} value="5" label="étapes de méthode" x={1000} y={720} z={300} />
    </Base>
  );
};

/* 4 — Formules */
export const Formules: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Site public · 03">
      <Browser shot="p-formules-full" width={1240} url={SITE + " — Formules"} scroll={{ from: 300, to: 1700, start: 1.1, end: d - 0.3 }} style={{ left: 340, top: 240, ...use3D({ at: 0.3, from: "back", rx: 5 }) }} />
      <Pop at={onBeat(2.2)} value="3" label="formules claires" x={150} y={520} z={260} ry={14} />
      <Pop at={onBeat(4.3)} value="0 €" label="de frais d'entrée" x={1540} y={430} z={260} ry={-14} />
    </Base>
  );
};

/* 5 — Créatrices & candidature */
export const Createurs: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Site public · 04">
      <Browser shot="p-createurs-full" width={1060} url={SITE + " — Créatrices"} scroll={{ from: 0, to: 2900, start: 0.8, end: d * 0.6 }} style={{ left: 110, top: 270, ...use3D({ at: 0.3, from: "left", ry: 13 }) }} />
      <Browser shot="p-candidature-view" width={820} url={SITE + " — Candidature"} style={{ left: 990, top: 340, ...use3D({ at: onBeat(d * 0.45), from: "right", ry: -18, z: 150 }) }} />
    </Base>
  );
};

/* 6 — Formation */
const Count: React.FC<{ at: number; to: number; label: string; x: number; y: number; ry?: number }> = ({ at, to, label, x, y, ry = 0 }) => {
  const t = useT();
  const v = Math.round(between(t, [at, at + 0.9], [0, to], SMOOTH));
  return <Pop at={at} value={String(v)} label={label} x={x} y={y} ry={ry} />;
};
export const Formation: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Site public · 05">
      <Browser shot="p-formation-full" width={1240} url={SITE + " — Formation OFM"} scroll={{ from: 0, to: 3300, start: 0.9, end: d - 0.3 }} style={{ left: 340, top: 240, ...use3D({ at: 0.3, from: "bottom", rx: 6 }) }} />
      <Count at={onBeat(2.1)} to={19} label="modules" x={140} y={430} ry={14} />
      <Count at={onBeat(3.2)} to={156} label="leçons" x={1530} y={330} ry={-14} />
      <Count at={onBeat(4.3)} to={13} label="ateliers pratiques" x={1530} y={620} ry={-14} />
    </Base>
  );
};

/* 7 — Espace équipe : connexion qui pivote vers le tableau de bord */
export const Dashboard: React.FC<P> = ({ info }) => {
  const t = useT();
  const d = info.dur;
  const flip = onBeat(2.2);
  const box = use3D({ at: 0.3, from: "back" });
  return (
    <Base info={info} eyebrow="Espace équipe · 01">
      <div style={{ position: "absolute", left: 340, top: 240, width: 1240, height: 840, transformStyle: "preserve-3d", ...box }}>
        <Browser
          shot="e-login"
          width={1240}
          url={TEAM + " — Connexion"}
          reflect={false}
          style={{ left: 0, top: 0, opacity: between(t, [flip + 0.2, flip + 0.35], [1, 0]), transform: `rotateY(${between(t, [flip, flip + 0.35], [0, 90], SMOOTH)}deg)` }}
        />
        <Browser
          shot="e-home-full"
          width={1240}
          url={TEAM + " — Vue d'ensemble"}
          scroll={{ from: 0, to: 1050, start: d * 0.62, end: d - 0.3 }}
          highlights={[
            { x: 280, y: 256, w: 322, h: 262, from: flip + 1.0, to: flip + 3.2 },
            { x: 614, y: 256, w: 800, h: 262, from: flip + 3.2, to: d * 0.6 },
            { x: 280, y: 538, w: 744, h: 520, from: d * 0.7, to: d - 0.2 },
          ]}
          style={{ left: 0, top: 0, opacity: between(t, [flip + 0.35, flip + 0.45], [0, 1]), transform: `rotateY(${between(t, [flip + 0.35, flip + 0.75], [-90, 0], EASE)}deg)` }}
        />
      </div>
      <Pop at={onBeat(flip + 1.1)} value="17 760 €" label="CA net du mois" x={190} y={560} z={300} ry={16} />
      <Pop at={onBeat(d * 0.7)} value="74 %" label="de l'objectif" x={1560} y={470} z={300} ry={-16} />
    </Base>
  );
};

/* 8 — Modèles : trois écrans en arc */
export const Modeles: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Espace équipe · 02" orbit={1.4}>
      <Browser shot="e-modeles" width={780} url={TEAM + " — Modèles"} style={{ left: 60, top: 330, ...use3D({ at: 0.3, from: "left", ry: 30, z: -230 }) }} />
      <Browser shot="e-modele-full" width={1000} url={TEAM + " — Fiche modèle"} scroll={{ from: 0, to: 1500, start: 1.2, end: d * 0.62 }} style={{ left: 460, top: 250, ...use3D({ at: 0.3 + B, from: "back", z: 60 }) }} />
      <Browser shot="e-saisie" width={780} url={TEAM + " — Saisie des revenus"} style={{ left: 1080, top: 360, ...use3D({ at: onBeat(d * 0.5), from: "right", ry: -30, z: -230 }) }} />
    </Base>
  );
};

/* 9 — Chatters & finance */
export const Finance: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Espace équipe · 03">
      <Browser shot="e-chatters" width={960} url={TEAM + " — Chatters"} style={{ left: 110, top: 290, ...use3D({ at: 0.3, from: "left", ry: 14 }) }} />
      <Browser shot="e-finance-full" width={1000} url={TEAM + " — Finance"} scroll={{ from: 0, to: 1200, start: d * 0.5, end: d - 0.3 }} style={{ left: 830, top: 250, ...use3D({ at: onBeat(d * 0.42), from: "right", ry: -12, z: 140 }) }} />
    </Base>
  );
};

/* 10 — Recrutement & candidatures */
export const Recrutement: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Espace équipe · 04">
      <Browser shot="e-recrutement" width={1150} url={TEAM + " — Recrutement"} style={{ left: 110, top: 270, ...use3D({ at: 0.3, from: "bottom", ry: 10 }) }} />
      <Browser shot="e-candidatures" width={840} url={TEAM + " — Candidatures"} style={{ left: 980, top: 350, ...use3D({ at: onBeat(d * 0.45), from: "right", ry: -16, z: 170 }) }} />
    </Base>
  );
};

/* 11 — Formation en ligne & comptes */
export const Lecture: React.FC<P> = ({ info }) => {
  const d = info.dur;
  return (
    <Base info={info} eyebrow="Espace équipe · 05">
      <Browser shot="e-lecon" width={1080} url={TEAM + " — Formation"} style={{ left: 110, top: 260, ...use3D({ at: 0.3, from: "left", ry: 12 }) }} />
      <Browser shot="e-users" width={800} url={TEAM + " — Utilisateurs"} style={{ left: 1000, top: 380, ...use3D({ at: onBeat(d * 0.5), from: "right", ry: -16, z: 150 }) }} />
    </Base>
  );
};

/* 12 — Mobile : téléphones sur un plateau tournant */
export const Mobile: React.FC<P> = ({ info }) => {
  const t = useT();
  const d = info.dur;
  const turn = between(t, [0, d], [26, -26], (x) => x);
  return (
    <Base info={info} eyebrow="Partout" orbit={0.6}>
      <Phone shot="m-home-full" width={290} scroll={{ from: 0, to: 2600, start: 0.4, end: d }} style={{ left: 540, top: 245, ...use3D({ at: B, from: "bottom", ry: turn + 8, z: -60 }) }} />
      <Phone shot="m-dash-full" width={300} scroll={{ from: 0, to: 1500, start: 0.6, end: d }} style={{ left: 815, top: 215, ...use3D({ at: B * 2, from: "bottom", ry: turn, z: 90 }) }} />
      <Phone shot="m-formules-full" width={290} scroll={{ from: 600, to: 2200, start: 0.8, end: d }} style={{ left: 1090, top: 245, ...use3D({ at: B * 3, from: "bottom", ry: turn - 8, z: -60 }) }} />
    </Base>
  );
};

/* 13 — Outro : silence, puis le logo frappe sur le drop */
export const Outro: React.FC<P> = ({ info }) => {
  const t = useT();
  const g = useG();
  const slam = info.slam ?? 1.56;
  const ring = between(t, [0, slam], [3.2, 0.25], (x) => x * x);
  const bp = t > slam ? beatPulse(g, 0.2) : 0;
  return (
    <SceneStart.Provider value={info.start}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", border: "3px solid rgba(127,162,255,.7)", boxShadow: "0 0 80px rgba(47,91,255,.6)", scale: ring, opacity: t < slam ? between(t, [0, 0.4], [0, 1]) : 0 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <Logo3D size={180} at={slam} />
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 108, letterSpacing: "-0.03em", textAlign: "center", lineHeight: 1.04, perspective: 900 }}>
            {["Votre talent.", "Notre maison."].map((l, i) => {
              const s = slam + B * (1 + i);
              return (
                <div key={l} style={{ color: i ? C.sky : "#fff", opacity: between(t, [s, s + 0.15], [0, 1]), transform: `rotateX(${between(t, [s, s + 0.5], [-90, 0], BACK)}deg)`, transformOrigin: "50% 100%", textShadow: "0 0 50px rgba(47,91,255,.5)" }}>
                  {l}
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 14,
              padding: "24px 46px",
              borderRadius: 18,
              background: C.blue,
              color: "#fff",
              fontWeight: 800,
              fontSize: 40,
              boxShadow: `0 20px ${50 + bp * 40}px -16px rgba(47,91,255,${0.8 + bp * 0.2})`,
              opacity: between(t, [slam + B * 3, slam + B * 3 + 0.15], [0, 1]),
              scale: between(t, [slam + B * 3, slam + B * 3 + 0.5], [0.6, 1], BACK) * (1 + bp * 0.04),
            }}
          >
            Rejoindre la House
          </div>
          <div style={{ color: C.muted, fontWeight: 600, fontSize: 30, opacity: between(t, [slam + B * 4, slam + B * 4 + 0.3], [0, 1]) }}>Site public · Espace équipe · Formation OFM</div>
        </div>
      </AbsoluteFill>
      <Voice info={info} />
    </SceneStart.Provider>
  );
};
