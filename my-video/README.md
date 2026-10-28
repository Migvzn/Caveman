# Vidéo de présentation VAYNORA House (Remotion)

Vidéo de présentation du site et de l'Espace équipe : captures réelles du site qui défilent dans des fenêtres de navigateur et des téléphones, voix off française, sous-titres synchronisés et musique de fond originale qui baisse automatiquement sous la voix.

- Composition : `Presentation` · 1920 × 1080 · 30 images/s · environ 1 min 57
- Rendu final : `out/vaynora-presentation.mp4` (non versionné)

## Commandes

```bash
npm install
npm run dev          # Remotion Studio (aperçu interactif)
npx remotion render Presentation out/vaynora-presentation.mp4
```

Sur une machine sans Chrome Headless Shell téléchargeable, ajoutez `--browser-executable=<chemin vers chrome-headless-shell>`.

## Modifier la vidéo

| Élément | Fichier |
|---|---|
| Texte de la voix off et titres des scènes | `scripts/script.json` |
| Ordre, durées, transitions | `src/timeline.ts`, `src/Presentation.tsx` |
| Mise en scène de chaque scène | `src/scenes/Scenes.tsx` |
| Fenêtre de navigateur, téléphone, surlignages | `src/components/Frames.tsx` |
| Titres, sous-titres, logo, musique | `src/components/Overlays.tsx` |
| Couleurs et police | `src/theme.ts` |

### Régénérer la voix off

Voix française neuronale **Kokoro** (`ff_siwis`), calculée en local. Les noms difficiles sont écrits phonétiquement dans le script (« Vaïnora Haouce », « tchatteurs », « O F M ») ; les sous-titres les réécrivent correctement.

```bash
pip install kokoro-onnx soundfile
# modèles : kokoro-v1.0.onnx et voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx, releases « model-files-v1.0 »)
python3 scripts/voiceover.py <dossier des modèles>
```

Le script écrit `public/voiceover/*.mp3` et `src/voiceover.json` (durées) : la vidéo s'adapte automatiquement à la longueur de chaque phrase.

### Régénérer la musique

Morceau original synthétisé (aucun échantillon externe, donc aucun droit à payer) :

```bash
python3 scripts/music.py 125
```

### Refaire les captures

Les captures (`public/shots/`) ont été prises avec Playwright sur le site (`vaynora/`) et l'Espace équipe en mode équipe avec les données d'exemple. Gardez les mêmes noms de fichiers pour qu'elles soient reprises automatiquement ; mettez à jour `src/shots.json` (dimensions) si la hauteur des pages change.
