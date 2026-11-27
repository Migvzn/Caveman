import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const cormorant = [
  ["300", "normal"],
  ["400", "normal"],
  ["500", "normal"],
  ["600", "normal"],
  ["300", "italic"],
  ["400", "italic"],
  ["500", "italic"],
] as const;

const jost = ["200", "300", "400"] as const;

export const fontsLoaded = Promise.all([
  ...cormorant.map(([weight, style]) =>
    loadFont({
      family: "Cormorant",
      url: staticFile(
        `fonts/cormorant-garamond-latin-${weight}-${style}.woff2`,
      ),
      weight,
      style,
    }),
  ),
  ...jost.map((weight) =>
    loadFont({
      family: "Jost",
      url: staticFile(`fonts/jost-latin-${weight}-normal.woff2`),
      weight,
    }),
  ),
]);
