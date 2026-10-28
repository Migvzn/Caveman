// Rend des images de contrôle : node scripts/stills.mjs <dossier> <frame> [frame…]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [out, ...frames] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), rspack: true });
const composition = await selectComposition({ serveUrl, id: "Presentation", browserExecutable });
for (const f of frames) {
  await renderStill({ composition, serveUrl, frame: +f, output: path.join(out, `f${String(f).padStart(4, "0")}.jpg`), imageFormat: "jpeg", jpegQuality: 85, browserExecutable, scale: 0.5 });
  console.log("✓", f);
}
