#!/usr/bin/env bash
# Calcule les images intermédiaires (impaires) des plans rendus 1 image sur 2,
# pour des mouvements de caméra parfaitement nets (les images déjà rendues sont sautées).
cd "$(dirname "$0")"
PY=${PY:-/root/bpyenv/bin/python}
for s in boutons broderie macro_bouton col; do
  $PY render_shots.py $s --res 720 --resy 1280 --samples 18 --frames 1:89 --step 2
done
$PY render_shots.py hero --res 1080 --resy 1350 --samples 24 --frames 1:95 --step 2
echo "INTERMEDIAIRES TERMINES"
