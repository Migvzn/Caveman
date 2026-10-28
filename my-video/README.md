# Vidéo de présentation VAYNORA House (Remotion)

Vidéo de présentation du site et de l'Espace équipe, en 3D et calée sur la musique : captures réelles du site dans des fenêtres de navigateur et des téléphones en perspective, carrousel 3D d'ouverture, logo 3D qui frappe sur les drops, cartes chiffrées au premier plan, reflets, champ de particules, caméra qui pousse sur chaque mesure, voix off française et sous-titres synchronisés.

- Composition : `Presentation` · 1920 × 1080 · **120 images/s** · environ 2 min 12
- Musique : `public/music/tesla.mp3` (fournie), analysée par `scripts/analyze_music.py`
- Rendu final : `out/vaynora-presentation-120fps.mp4` (non versionné)

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
| Ordre, durées, transitions 3D | `src/timeline.ts`, `src/schedule.json`, `src/Presentation.tsx` |
| Fond 3D (particules, halos), éclairs sur les drops | `src/components/Background.tsx` |
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

### Musique et synchronisation

1. `python3 scripts/analyze_music.py public/music/tesla.mp3` → `src/music.json` (tempo, temps, temps forts, énergie et graves).
2. `python3 scripts/schedule.py` → `src/schedule.json` : chaque coupe tombe sur un temps, le logo de l'intro frappe sur le premier drop et le final sur le drop qui suit le silence.

Après une modification du texte de la voix off, relancez l'étape 2 : tout se recale automatiquement. Pour changer de morceau, remplacez le fichier, mettez à jour `file` et les instants des drops (`DROPS` dans `scripts/schedule.py` et `src/timeline.ts`), puis relancez les deux étapes.

`scripts/music.py` génère toujours le morceau original synthétisé de la première version (`public/music/background.mp3`), utilisable sans aucun droit.

### Refaire les captures

Les captures (`public/shots/`) ont été prises avec Playwright sur le site (`vaynora/`) et l'Espace équipe en mode équipe avec les données d'exemple. Gardez les mêmes noms de fichiers pour qu'elles soient reprises automatiquement ; mettez à jour `src/shots.json` (dimensions) si la hauteur des pages change.
