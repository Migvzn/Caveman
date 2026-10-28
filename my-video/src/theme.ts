import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Identité VAYNORA : blanc, bleu, violet nuit, une seule police (Plus Jakarta Sans).
export const C = {
  night: "#1B1036",
  night2: "#251548",
  violet: "#3D2A78",
  blue: "#2F5BFF",
  sky: "#7FA2FF",
  lilac: "#9D84FF",
  white: "#FFFFFF",
  onNight: "#F3F1FA",
  muted: "#B9B2D3",
};

export const FONT = "Plus Jakarta Sans";

loadFont({ family: FONT, url: staticFile("fonts/PlusJakartaSans-normal-latin.woff2"), weight: "200 800" });
loadFont({ family: FONT, url: staticFile("fonts/PlusJakartaSans-normal-latin-ext.woff2"), weight: "200 800" });
