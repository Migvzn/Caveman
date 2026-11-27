#!/usr/bin/env bash
# Rend toutes les séquences utilisées par la vidéo (PNG transparents) dans blender/renders/
set -e
cd "$(dirname "$0")"
PY=${PY:-/root/bpyenv/bin/python}
$PY render_shots.py face --still 0 --res 1080 --samples 64
$PY render_shots.py dos --still 0 --res 1080 --samples 64
$PY render_shots.py turntable --res 1080 --samples 24
for s in macro_bouton boutons broderie col; do
  $PY render_shots.py $s --res 720 --resy 1280 --samples 18 --step 1
done
$PY render_shots.py hero --res 1080 --resy 1350 --samples 24 --step 1
echo "TOUS LES RENDUS SONT TERMINÉS"
