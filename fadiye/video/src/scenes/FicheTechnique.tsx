import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Grain, RedGlow, Vignette } from "../components/Atmosphere";

export const FICHE_DURATION = 200;

const SIZES = ["S", "M", "L", "XL", "XXL"];
const ROWS: [string, string, number[]][] = [
  ["A", "Longueur totale", [64, 66, 68, 70, 72]],
  ["B", "Largeur poitrine", [58, 60, 62, 64, 66]],
  ["C", "Longueur manche", [55, 56, 57, 58, 59]],
  ["D", "Largeur épaules", [56, 58, 60, 62, 64]],
];

const appear = (frame: number, start: number, dur = 14) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

/** Scène 5 — fiche technique animée (vues 3D devant / dos, mesures, matière, coloris). */
export const FicheTechnique: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const TABLE_TOP = 1010;
  const ROW_H = 76;
  const LABEL_W = 400;
  const COL_W = 104;
  const LEFT = 70;

  return (
    <AbsoluteFill style={{ backgroundColor: "#060404" }}>
      <RedGlow y="28%" size={700} intensity={0.22} />

      <Interactive.Div
        name="Sur-titre"
        style={{
          position: "absolute",
          top: 120,
          width: "100%",
          textAlign: "center",
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 34,
          letterSpacing: "0.55em",
          color: "#c8101c",
          opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        FICHE TECHNIQUE
      </Interactive.Div>
      <Interactive.Div
        name="Titre"
        style={{
          position: "absolute",
          top: 172,
          width: "100%",
          textAlign: "center",
          fontFamily: "Cormorant",
          fontWeight: 400,
          fontSize: 84,
          color: "#efe8e1",
          opacity: interpolate(frame, [0.2 * fps, 0.9 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Cardigan <span style={{ fontStyle: "italic" }}>« Fadiye »</span>
      </Interactive.Div>

      {/* Vues devant / dos */}
      {[
        { src: "renders/face_still_0000.png", label: "DEVANT", x: -60, d: 8 },
        { src: "renders/dos_still_0000.png", label: "DOS", x: 500, d: 16 },
      ].map((v) => (
        <div key={v.label}>
          <Img
            src={staticFile(v.src)}
            style={{
              position: "absolute",
              left: v.x,
              top: 255,
              width: 640,
              height: 640,
              opacity: appear(frame, v.d, 20),
              translate: `0px ${(1 - appear(frame, v.d, 24)) * 40}px`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: v.x,
              width: 640,
              top: 790,
              textAlign: "center",
              fontFamily: "Jost",
              fontWeight: 300,
              fontSize: 30,
              letterSpacing: "0.45em",
              color: "rgba(239,232,225,0.7)",
              opacity: appear(frame, v.d + 14),
            }}
          >
            {v.label}
          </div>
        </div>
      ))}

      {/* Tableau des mesures */}
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: TABLE_TOP - 70,
          fontFamily: "Jost",
          fontWeight: 300,
          fontSize: 32,
          letterSpacing: "0.4em",
          color: "#c8101c",
          opacity: appear(frame, 30),
        }}
      >
        MESURES (CM)
      </div>
      {/* surbrillance taille M */}
      <div
        style={{
          position: "absolute",
          left: LEFT + LABEL_W + COL_W,
          top: TABLE_TOP - 6,
          width: COL_W,
          height: ROW_H * 5 + 4,
          border: "2px solid #c8101c",
          backgroundColor: "rgba(200,16,28,0.12)",
          opacity: appear(frame, 95, 18),
        }}
      />
      {SIZES.map((s, i) => (
        <div
          key={s}
          style={{
            position: "absolute",
            left: LEFT + LABEL_W + i * COL_W,
            width: COL_W,
            top: TABLE_TOP + 14,
            textAlign: "center",
            fontFamily: "Jost",
            fontWeight: 400,
            fontSize: 34,
            color: s === "M" ? "#ff3a40" : "#efe8e1",
            opacity: appear(frame, 36 + i * 3),
          }}
        >
          {s}
        </div>
      ))}
      {ROWS.map(([k, label, vals], r) => {
        const y = TABLE_TOP + ROW_H * (r + 1);
        const start = 46 + r * 9;
        return (
          <div key={k}>
            <div
              style={{
                position: "absolute",
                left: LEFT,
                top: y,
                width: LABEL_W + COL_W * 5,
                height: 1,
                backgroundColor: "rgba(239,232,225,0.22)",
                transformOrigin: "0% 50%",
                scale: `${appear(frame, start - 4, 20)} 1`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: LEFT,
                top: y + 16,
                fontFamily: "Jost",
                fontWeight: 300,
                fontSize: 34,
                color: "#efe8e1",
                opacity: appear(frame, start),
              }}
            >
              <span style={{ color: "#c8101c", marginRight: 22 }}>{k}</span>
              {label}
            </div>
            {vals.map((v, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: LEFT + LABEL_W + i * COL_W,
                  width: COL_W,
                  top: y + 16,
                  textAlign: "center",
                  fontFamily: "Jost",
                  fontWeight: i === 1 ? 400 : 300,
                  fontSize: 34,
                  color: i === 1 ? "#ffffff" : "rgba(239,232,225,0.75)",
                  opacity: appear(frame, start + 3 + i * 2),
                }}
              >
                {v}
              </div>
            ))}
          </div>
        );
      })}

      {/* Matière */}
      <div style={{ position: "absolute", left: LEFT, top: 1460, opacity: appear(frame, 105, 18) }}>
        <div
          style={{
            fontFamily: "Jost",
            fontWeight: 300,
            fontSize: 32,
            letterSpacing: "0.4em",
            color: "#c8101c",
          }}
        >
          MATIÈRE
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: "Cormorant",
            fontStyle: "italic",
            fontSize: 58,
            color: "#efe8e1",
          }}
        >
          Maille tricotée premium
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: "Jost",
            fontWeight: 300,
            fontSize: 38,
            color: "rgba(239,232,225,0.78)",
          }}
        >
          60 % coton · 40 % acrylique · 450 g/m²
        </div>
      </div>

      {/* Coloris */}
      <div style={{ position: "absolute", left: LEFT, top: 1690, opacity: appear(frame, 120, 18) }}>
        <div
          style={{
            fontFamily: "Jost",
            fontWeight: 300,
            fontSize: 32,
            letterSpacing: "0.4em",
            color: "#c8101c",
          }}
        >
          COLORIS
        </div>
      </div>
      {[
        { c: "#0a0808", b: "rgba(239,232,225,0.35)", l: "Noir profond" },
        { c: "#c8101c", b: "#c8101c", l: "Rouge intense" },
        { c: "linear-gradient(135deg,#f4f5f7,#8d9096 55%,#e3e5e8)", b: "#c9ccd1", l: "Argenté" },
      ].map((sw, i) => (
        <div
          key={sw.l}
          style={{
            position: "absolute",
            left: LEFT + i * 320,
            top: 1752,
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: appear(frame, 126 + i * 6),
            translate: `0px ${(1 - appear(frame, 126 + i * 6, 18)) * 20}px`,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: sw.c,
              border: `2px solid ${sw.b}`,
            }}
          />
          <div style={{ fontFamily: "Jost", fontWeight: 300, fontSize: 34, color: "#efe8e1" }}>{sw.l}</div>
        </div>
      ))}
      <Vignette strength={0.5} />
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
