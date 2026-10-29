#!/bin/bash
# Met à jour la vidéo du site (vaynora/assets/video/) à partir d'un rendu Remotion.
#   bash scripts/web_export.sh out/vaynora-presentation-60fps.mp4 [secondes de l'image d'affiche, 16 par défaut]
# Produit : presentation-1080.mp4 (ordinateur), presentation-720.mp4 (mobile), poster.webp.
# Fichiers « faststart » : la lecture démarre avant la fin du téléchargement.
set -euo pipefail
SRC="${1:?rendu MP4 à convertir}"; AT="${2:-16}"
OUT="$(cd "$(dirname "$0")/../.." && pwd)/vaynora/assets/video"; mkdir -p "$OUT"
enc() { ffmpeg -y -loglevel error -i "$SRC" -vf "scale=$1:-2:flags=lanczos" -r 60 -c:v libx264 -preset slow -crf 27 -profile:v high -pix_fmt yuv420p -c:a aac -b:a "$2" -ac 2 -movflags +faststart "$OUT/$3"; }
enc 1920 128k presentation-1080.mp4
enc 1280 96k presentation-720.mp4
ffmpeg -y -loglevel error -ss "$AT" -i "$SRC" -frames:v 1 -vf scale=1600:-2:flags=lanczos -c:v libwebp -quality 82 "$OUT/poster.webp"
ls -lh "$OUT"
