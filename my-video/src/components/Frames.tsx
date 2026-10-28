import type { CSSProperties } from "react";
import { Img, staticFile } from "remotion";
import shots from "../shots.json";
import { barIndex, sinceBar } from "../timeline";
import { FONT } from "../theme";
import { between, SMOOTH, useT } from "./anim";
import { useG } from "./Clock";

export type ShotKey = keyof typeof shots;
type Scroll = { from: number; to: number; start: number; end: number }; // secondes
export type Highlight = { x: number; y: number; w: number; h: number; from: number; to: number };

const scrollOf = (t: number, key: ShotKey, viewH: number, s?: Scroll) => {
  if (!s) return 0;
  const max = Math.max(0, shots[key].h - viewH);
  return between(t, [s.start, s.end], [Math.min(s.from, max), Math.min(s.to, max)], SMOOTH);
};
const REFLECT = "below 16px linear-gradient(transparent 74%, rgba(255,255,255,.16))";

// Reflet lumineux qui traverse l'écran sur une mesure sur deux.
const Shine: React.FC = () => {
  const g = useG();
  const s = sinceBar(g);
  if (barIndex(g) % 2 !== 0 || s > 0.9) return null;
  const x = between(s, [0, 0.9], [-40, 140], SMOOTH);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `linear-gradient(105deg, transparent ${x - 18}%, rgba(255,255,255,.34) ${x}%, transparent ${x + 18}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

// Fenêtre de navigateur affichant une capture (page de 1440 px CSS, 900 px visibles).
export const Browser: React.FC<{
  shot: ShotKey;
  width: number;
  url: string;
  scroll?: Scroll;
  highlights?: Highlight[];
  reflect?: boolean;
  style?: CSSProperties;
}> = ({ shot, width, url, scroll, highlights = [], reflect = true, style }) => {
  const t = useT();
  const k = width / 1440;
  const top = scrollOf(t, shot, 900, scroll);
  const bar = Math.round(46 * (width / 1300));
  return (
    <div
      style={{
        position: "absolute",
        width,
        borderRadius: 22 * (width / 1300),
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 60px 140px -40px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.1), 0 0 80px -20px rgba(47,91,255,.35)",
        WebkitBoxReflect: reflect ? REFLECT : undefined,
        backfaceVisibility: "hidden",
        ...style,
      }}
    >
      <div style={{ height: bar, background: "#F2F0F8", display: "flex", alignItems: "center", gap: bar * 0.18, padding: `0 ${bar * 0.4}px`, borderBottom: "1px solid #E6E2F2" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <div key={c} style={{ width: bar * 0.26, height: bar * 0.26, borderRadius: "50%", background: c }} />
        ))}
        <div
          style={{
            marginLeft: bar * 0.3,
            flex: 1,
            maxWidth: width * 0.5,
            height: bar * 0.56,
            borderRadius: bar,
            background: "#fff",
            border: "1px solid #E6E2F2",
            display: "flex",
            alignItems: "center",
            padding: `0 ${bar * 0.35}px`,
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: bar * 0.3,
            color: "#625D79",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: "relative", height: 900 * k, overflow: "hidden" }}>
        <Img src={staticFile(shots[shot].file)} style={{ position: "absolute", left: 0, width: "100%", top: -top * k }} />
        {highlights.map((h, i) => {
          const o = Math.min(between(t, [h.from, h.from + 0.3], [0, 1]), between(t, [h.to - 0.3, h.to], [1, 0]));
          if (o <= 0) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: h.x * k,
                top: (h.y - top) * k,
                width: h.w * k,
                height: h.h * k,
                borderRadius: 18 * k,
                border: `${Math.max(3, 5 * k)}px solid #2F5BFF`,
                boxShadow: "0 0 0 9999px rgba(27,16,54,.42), 0 0 50px rgba(47,91,255,.7)",
                opacity: o,
                scale: between(t, [h.from, h.from + 0.45], [1.08, 1]),
              }}
            />
          );
        })}
        <Shine />
      </div>
    </div>
  );
};

// Téléphone (écran 390 × 844 px CSS).
export const Phone: React.FC<{ shot: ShotKey; width: number; scroll?: Scroll; style?: CSSProperties }> = ({ shot, width, scroll, style }) => {
  const t = useT();
  const k = width / 390;
  const top = scrollOf(t, shot, 844, scroll);
  const bezel = 13;
  return (
    <div
      style={{
        position: "absolute",
        width: width + bezel * 2,
        padding: bezel,
        borderRadius: 58,
        background: "linear-gradient(145deg,#2A1D52,#0E0820 40%,#0E0820 70%,#3A2A70)",
        boxShadow: "0 60px 120px -40px rgba(0,0,0,.85), inset 0 0 0 2px rgba(255,255,255,.14), 0 0 70px -20px rgba(47,91,255,.4)",
        WebkitBoxReflect: REFLECT,
        ...style,
      }}
    >
      <div style={{ position: "relative", height: 844 * k, borderRadius: 46, overflow: "hidden", background: "#fff" }}>
        <Img src={staticFile(shots[shot].file)} style={{ position: "absolute", left: 0, width: "100%", top: -top * k }} />
        <div style={{ position: "absolute", top: 10, left: "50%", translate: "-50% 0", width: width * 0.3, height: 26, borderRadius: 20, background: "#0E0820" }} />
        <Shine />
      </div>
    </div>
  );
};

// Petite carte flottante (chiffre clé) devant les fenêtres.
export const FloatCard: React.FC<{ value: string; label: string; style?: CSSProperties }> = ({ value, label, style }) => (
  <div
    style={{
      position: "absolute",
      padding: "20px 26px",
      borderRadius: 22,
      background: "rgba(255,255,255,.96)",
      boxShadow: "0 30px 70px -24px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.6), 0 0 60px -10px rgba(47,91,255,.55)",
      fontFamily: FONT,
      minWidth: 210,
      ...style,
    }}
  >
    <div style={{ color: "#2F5BFF", fontWeight: 800, fontSize: 48, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
    <div style={{ color: "#625D79", fontWeight: 600, fontSize: 20, marginTop: 8 }}>{label}</div>
  </div>
);
