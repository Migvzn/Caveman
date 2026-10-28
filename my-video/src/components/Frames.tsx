import type { CSSProperties } from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import shots from "../shots.json";
import { FONT } from "../theme";
import { between, SMOOTH } from "./anim";

export type ShotKey = keyof typeof shots;

type Scroll = { from: number; to: number; start: number; end: number };

const scrollOf = (frame: number, key: ShotKey, viewH: number, s?: Scroll) => {
  if (!s) return 0;
  const max = Math.max(0, shots[key].h - viewH);
  return between(frame, [s.start, s.end], [Math.min(s.from, max), Math.min(s.to, max)], SMOOTH);
};

export type Highlight = { x: number; y: number; w: number; h: number; from: number; to: number };

// Fenêtre de navigateur affichant une capture (largeur de page : 1440 px CSS, hauteur visible : 900 px).
export const Browser: React.FC<{
  shot: ShotKey;
  width: number;
  url: string;
  scroll?: Scroll;
  highlights?: Highlight[];
  style?: CSSProperties;
}> = ({ shot, width, url, scroll, highlights = [], style }) => {
  const frame = useCurrentFrame();
  const k = width / 1440;
  const viewH = 900;
  const top = scrollOf(frame, shot, viewH, scroll);
  const bar = Math.round(46 * (width / 1300));
  return (
    <div
      style={{
        position: "absolute",
        width,
        borderRadius: 20 * (width / 1300),
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 50px 120px -40px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.08)",
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
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: "relative", height: viewH * k, overflow: "hidden" }}>
        <Img src={staticFile(shots[shot].file)} style={{ position: "absolute", left: 0, width: "100%", top: -top * k }} />
        {highlights.map((h, i) => {
          const o = Math.min(between(frame, [h.from, h.from + 10], [0, 1]), between(frame, [h.to - 10, h.to], [1, 0]));
          const s = between(frame, [h.from, h.from + 14], [1.08, 1]);
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
                boxShadow: "0 0 0 9999px rgba(27,16,54,.38), 0 0 40px rgba(47,91,255,.6)",
                opacity: o,
                scale: s,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// Téléphone (écran 390 × 844 px CSS).
export const Phone: React.FC<{ shot: ShotKey; width: number; scroll?: Scroll; style?: CSSProperties }> = ({ shot, width, scroll, style }) => {
  const frame = useCurrentFrame();
  const k = width / 390;
  const top = scrollOf(frame, shot, 844, scroll);
  const bezel = 13;
  return (
    <div
      style={{
        position: "absolute",
        width: width + bezel * 2,
        padding: bezel,
        borderRadius: 58,
        background: "#0E0820",
        boxShadow: "0 50px 110px -40px rgba(0,0,0,.8), inset 0 0 0 2px rgba(255,255,255,.12)",
        ...style,
      }}
    >
      <div style={{ position: "relative", height: 844 * k, borderRadius: 46, overflow: "hidden", background: "#fff" }}>
        <Img src={staticFile(shots[shot].file)} style={{ position: "absolute", left: 0, width: "100%", top: -top * k }} />
        <div style={{ position: "absolute", top: 10, left: "50%", translate: "-50% 0", width: width * 0.3, height: 26, borderRadius: 20, background: "#0E0820" }} />
      </div>
    </div>
  );
};
