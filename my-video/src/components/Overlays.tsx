import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SCENES, TOTAL } from "../timeline";
import { C, FONT } from "../theme";
import { between, EASE } from "./anim";

// Titre de scène en haut à gauche : pastille + grand titre.
export const SceneTitle: React.FC<{ eyebrow: string; title: string }> = ({ eyebrow, title }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 110, top: 78, fontFamily: FONT }}>
      <div
        style={{
          display: "inline-flex",
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(127,162,255,.16)",
          color: "#C9D6FF",
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: between(frame, [0, 14], [0, 1]),
          translate: `${between(frame, [0, 18], [-30, 0])}px 0`,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          marginTop: 18,
          color: C.white,
          fontWeight: 800,
          fontSize: 76,
          letterSpacing: "-0.03em",
          lineHeight: 1.02,
          opacity: between(frame, [4, 20], [0, 1]),
          translate: `0 ${between(frame, [4, 24], [30, 0])}px`,
        }}
      >
        {title}
      </div>
    </div>
  );
};

// Pastilles de points clés qui apparaissent l'une après l'autre.
export const Points: React.FC<{ items: string[]; x: number; y: number; delay?: number; step?: number }> = ({ items, x, y, delay = 18, step = 14 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "grid", gap: 18, fontFamily: FONT }}>
      {items.map((t, i) => {
        const f0 = delay + i * step;
        return (
          <div
            key={t}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 24px 16px 18px",
              borderRadius: 18,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.14)",
              color: C.onNight,
              fontSize: 32,
              fontWeight: 700,
              opacity: between(frame, [f0, f0 + 12], [0, 1]),
              translate: `${between(frame, [f0, f0 + 20], [-40, 0])}px 0`,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.blue, display: "grid", placeItems: "center", flex: "none" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </div>
            {t}
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
    const words = p.split(" ");
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length > 52 && cur) { out.push(cur.trim()); cur = w; } else cur += " " + w;
    });
    if (cur.trim()) out.push(cur.trim());
  });
  return out;
};
export const Subtitles: React.FC<{ text: string; lead: number; voice: number }> = ({ text, lead, voice }) => {
  const frame = useCurrentFrame();
  const list = chunks(text.replace(/Vaïnora Haouce/g, "VAYNORA House").replace("O F M", "OFM").replace(/tchatteurs/g, "chatters").replace(/Tchatteurs/g, "Chatters"));
  const total = list.reduce((a, c) => a + c.length, 0);
  let acc = 0;
  const timed = list.map((c) => { const s = lead + (acc / total) * voice; acc += c.length; return { c, s, e: lead + (acc / total) * voice }; });
  const cur = timed.find((t) => frame >= t.s && frame < t.e + 6);
  if (!cur) return null;
  const o = Math.min(between(frame, [cur.s, cur.s + 5], [0, 1]), between(frame, [cur.e + 1, cur.e + 6], [1, 0]));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", fontFamily: FONT }}>
      <div
        style={{
          maxWidth: 1500,
          padding: "14px 30px",
          borderRadius: 18,
          background: "rgba(14,8,32,.78)",
          color: "#fff",
          fontSize: 38,
          fontWeight: 600,
          textAlign: "center",
          opacity: o,
          translate: `0 ${(1 - o) * 10}px`,
        }}
      >
        {cur.c}
      </div>
    </div>
  );
};

// Logo VAYNORA animé (carré arrondi, V qui se dessine, point bleu).
export const Logo: React.FC<{ size: number; delay?: number }> = ({ size, delay = 0 }) => {
  const frame = useCurrentFrame() - delay;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ overflow: "visible" }}>
      <rect
        width="40"
        height="40"
        rx="11"
        fill={C.blue}
        style={{ transformBox: "fill-box", transformOrigin: "center", scale: interpolate(frame, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }) }}
      />
      <path
        d="M12.5 13 20 28.5 27.5 13"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={interpolate(frame, [12, 36], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE })}
      />
      <circle
        cx="20"
        cy="10"
        r="2.4"
        fill={C.night}
        style={{ transformBox: "fill-box", transformOrigin: "center", scale: interpolate(frame, [32, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }) }}
      />
    </svg>
  );
};

// Petit logo permanent + barre de progression globale.
export const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const show = interpolate(frame, [SCENES[1].start, SCENES[1].start + 15, SCENES[SCENES.length - 1].start, SCENES[SCENES.length - 1].start + 12], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", right: 96, top: 82, display: "flex", alignItems: "center", gap: 14, opacity: show * 0.92, fontFamily: FONT }}>
        <svg width="46" height="46" viewBox="0 0 40 40"><rect width="40" height="40" rx="11" fill={C.blue} /><path d="M12.5 13 20 28.5 27.5 13" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="20" cy="10" r="2.4" fill={C.night} /></svg>
        <div style={{ lineHeight: 1 }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "0.14em" }}>VAYNORA</div>
          <div style={{ color: C.sky, fontWeight: 700, fontSize: 11, letterSpacing: "0.42em", marginTop: 5 }}>HOUSE</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: `${(frame / durationInFrames) * 100}%`, background: "linear-gradient(90deg,#2F5BFF,#9D84FF)", opacity: show }} />
    </AbsoluteFill>
  );
};

// Musique de fond : baisse automatiquement pendant la voix off, fondu au début et à la fin.
export const Music: React.FC = () => {
  return (
    <Audio
      src={staticFile("music/background.mp3")}
      volume={(f) => {
        const inVoice = Math.max(0, ...SCENES.map((s) => {
          const a = s.start + s.lead, b = a + s.voice;
          return Math.min(1, Math.max(0, Math.min((f - a + 12) / 12, (b + 14 - f) / 14)));
        }));
        const fade = Math.min(1, f / 20, (TOTAL - f) / 75);
        return Math.max(0, fade) * (0.34 - 0.2 * inVoice);
      }}
      name="Musique de fond"
    />
  );
};
