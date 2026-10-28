import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import music from "../music.json";
import { barPulse, beatPulse, FPS, SCENES, T, TOTAL_S } from "../timeline";
import { C, FONT } from "../theme";
import { BACK, between, useT } from "./anim";
import { useG } from "./Clock";

const BEAT = 0.534;

// Titre de scène : pastille puis mots qui basculent en 3D, au rythme de la musique (croches).
export const SceneTitle: React.FC<{ eyebrow: string; title: string }> = ({ eyebrow, title }) => {
  const t = useT();
  const t0 = T * 0.6;
  const words = title.split(" ");
  return (
    <div style={{ position: "absolute", left: 110, top: 74, fontFamily: FONT, perspective: 900 }}>
      <div
        style={{
          display: "inline-flex",
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(127,162,255,.16)",
          border: "1px solid rgba(127,162,255,.25)",
          color: "#C9D6FF",
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: between(t, [t0, t0 + 0.3], [0, 1]),
          translate: `${between(t, [t0, t0 + 0.5], [-40, 0])}px 0`,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 20, flexWrap: "wrap", transformStyle: "preserve-3d" }}>
        {words.map((w, i) => {
          const s = t0 + BEAT / 2 + (i * BEAT) / 2;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: C.white,
                fontWeight: 800,
                fontSize: 78,
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
                transformOrigin: "50% 100%",
                opacity: between(t, [s, s + 0.2], [0, 1]),
                transform: `rotateX(${between(t, [s, s + 0.55], [-95, 0], BACK)}deg) translateY(${between(t, [s, s + 0.55], [30, 0])}px)`,
                textShadow: "0 10px 40px rgba(47,91,255,.45)",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Points clés qui basculent en 3D, un par temps.
export const Points: React.FC<{ items: string[]; x: number; y: number; first?: number }> = ({ items, x, y, first = 3 }) => {
  const t = useT();
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "grid", gap: 18, fontFamily: FONT, perspective: 1000 }}>
      {items.map((it, i) => {
        const s = (first + i) * BEAT;
        return (
          <div
            key={it}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 26px 16px 18px",
              borderRadius: 18,
              background: "linear-gradient(135deg, rgba(255,255,255,.13), rgba(255,255,255,.05))",
              border: "1px solid rgba(255,255,255,.16)",
              boxShadow: "0 20px 50px -20px rgba(0,0,0,.6)",
              color: C.onNight,
              fontSize: 32,
              fontWeight: 700,
              transformOrigin: "0% 50%",
              opacity: between(t, [s, s + 0.18], [0, 1]),
              transform: `rotateY(${between(t, [s, s + 0.6], [75, 0], BACK)}deg) translateX(${between(t, [s, s + 0.6], [-50, 0])}px)`,
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, background: C.blue, display: "grid", placeItems: "center", flex: "none", boxShadow: "0 0 24px rgba(47,91,255,.8)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </div>
            {it}
          </div>
        );
      })}
    </div>
  );
};

// Sous-titres de la voix off, découpés en morceaux et synchronisés à la durée de la voix.
const chunks = (text: string) => {
  const parts = text.replace(/ ([:;!?])/g, " $1").split(/(?<=[.,:;!?])\s+/);
  const out: string[] = [];
  parts.forEach((p) => {
    let cur = "";
    p.split(" ").forEach((w) => {
      if ((cur + " " + w).trim().length > 52 && cur) { out.push(cur.trim()); cur = w; } else cur += " " + w;
    });
    if (cur.trim()) out.push(cur.trim());
  });
  return out;
};
const display = (s: string) => s.replace(/Vaïnora Haouce/g, "VAYNORA House").replace("O F M", "OFM").replace(/tchatteurs/g, "chatters").replace(/Tchatteurs/g, "Chatters");
export const Subtitles: React.FC<{ text: string; lead: number; voice: number }> = ({ text, lead, voice }) => {
  const t = useT();
  const list = chunks(display(text));
  const total = list.reduce((a, c) => a + c.length, 0);
  let acc = 0;
  const timed = list.map((c) => { const s = lead + (acc / total) * voice; acc += c.length; return { c, s, e: lead + (acc / total) * voice }; });
  const cur = timed.find((x) => t >= x.s && t < x.e + 0.18);
  if (!cur) return null;
  const o = Math.min(between(t, [cur.s, cur.s + 0.16], [0, 1]), between(t, [cur.e + 0.02, cur.e + 0.18], [1, 0]));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", fontFamily: FONT }}>
      <div
        style={{
          maxWidth: 1500,
          padding: "14px 32px",
          borderRadius: 18,
          background: "rgba(14,8,32,.8)",
          border: "1px solid rgba(255,255,255,.1)",
          boxShadow: "0 20px 50px -20px rgba(0,0,0,.8)",
          color: "#fff",
          fontSize: 38,
          fontWeight: 600,
          textAlign: "center",
          opacity: o,
          translate: `0 ${(1 - o) * 14}px`,
          scale: 0.96 + o * 0.04,
        }}
      >
        {cur.c}
      </div>
    </div>
  );
};

// Logo VAYNORA en 3D : carré épais (couches empilées), V qui se dessine, point bleu.
export const Logo3D: React.FC<{ size: number; at: number; spin?: number }> = ({ size, at, spin = 1 }) => {
  const t = useT();
  const g = useG();
  const p = between(t, [at, at + 0.45], [0, 1], BACK);
  const ry = (1 - between(t, [at, at + 0.7], [0, 1])) * -120 + Math.sin(t * 1.1) * 16 * spin;
  const rx = (1 - p) * 50 + Math.cos(t * 0.9) * 8 * spin;
  const pulse = beatPulse(g, 0.2);
  const layers = 14;
  return (
    <div style={{ width: size, height: size, perspective: 1400, opacity: between(t, [at - 0.05, at + 0.08], [0, 1]) }}>
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          transform: `scale(${interpolate(p, [0, 1], [2.6, 1]) * (1 + pulse * 0.03)}) rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}
      >
        {Array.from({ length: layers }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: size * 0.275,
              background: i === 0 ? "linear-gradient(145deg,#5A7DFF,#2F5BFF 45%,#2447D6)" : `rgb(${30 - i},${50 - i * 2},${170 - i * 6})`,
              transform: `translateZ(${-i * (size / 60)}px)`,
              boxShadow: i === layers - 1 ? `0 ${size * 0.2}px ${size * 0.5}px rgba(0,0,0,.6)` : undefined,
            }}
          />
        ))}
        <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: "absolute", inset: 0, transform: `translateZ(${size / 40}px)`, overflow: "visible" }}>
          <path
            d="M12.5 13 20 28.5 27.5 13"
            fill="none"
            stroke="#fff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={between(t, [at + 0.1, at + 0.6], [1, 0])}
            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,.6))" }}
          />
          <circle cx="20" cy="10" r="2.4" fill={C.night} style={{ transformBox: "fill-box", transformOrigin: "center", scale: between(t, [at + 0.5, at + 0.75], [0, 1], BACK) }} />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: size * 0.275,
            transform: `translateZ(${size / 38}px)`,
            background: `linear-gradient(115deg, transparent ${(t * 40) % 160 - 40}%, rgba(255,255,255,.45) ${(t * 40) % 160 - 20}%, transparent ${(t * 40) % 160}%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
};

// Petit logo permanent + barre de progression globale (qui pulse sur les temps).
export const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const t = frame / fps;
  const s1 = SCENES[1].start, sl = SCENES[SCENES.length - 1].start;
  const show = interpolate(t, [s1, s1 + 0.4, sl, sl + 0.3], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bp = barPulse(t, 0.35);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", right: 96, top: 82, display: "flex", alignItems: "center", gap: 14, opacity: show * 0.92, fontFamily: FONT, scale: 1 + bp * 0.04 }}>
        <svg width="46" height="46" viewBox="0 0 40 40"><rect width="40" height="40" rx="11" fill={C.blue} /><path d="M12.5 13 20 28.5 27.5 13" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="20" cy="10" r="2.4" fill={C.night} /></svg>
        <div style={{ lineHeight: 1 }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "0.14em" }}>VAYNORA</div>
          <div style={{ color: C.sky, fontWeight: 700, fontSize: 11, letterSpacing: "0.42em", marginTop: 5 }}>HOUSE</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 5 + bp * 4, width: `${(frame / durationInFrames) * 100}%`, background: "linear-gradient(90deg,#2F5BFF,#9D84FF)", opacity: show, boxShadow: `0 0 ${10 + bp * 24}px rgba(47,91,255,.9)` }} />
    </AbsoluteFill>
  );
};

// Musique : baisse sous la voix off, pleine puissance sur les drops, fondu final.
const VOICE = SCENES.map((s) => [s.start + s.lead, s.start + s.lead + s.voice]);
export const Music: React.FC = () => (
  <Audio
    src={staticFile(music.file)}
    name="Musique de fond"
    volume={(f) => {
      const t = f / FPS;
      const inVoice = Math.max(0, ...VOICE.map(([a, b]) => Math.min(1, Math.max(0, Math.min((t - a + 0.35) / 0.35, (b + 0.45 - t) / 0.45)))));
      const fade = Math.min(1, t / 0.4, (TOTAL_S - t) / 3.2);
      return Math.max(0, fade) * (0.62 - 0.44 * inVoice);
    }}
  />
);
