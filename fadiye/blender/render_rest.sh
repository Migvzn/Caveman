#!/usr/bin/env bash
# Suite de la file de rendu (plans macro en 720x1280, 1 image sur 2, puis plan héros)
cd "$(dirname "$0")"
PY=${PY:-/root/bpyenv/bin/python}
while pgrep -f "render_shots.py turntable" >/dev/null; do sleep 5; done
$PY render_shots.py turntable --res 1080 --samples 28
for s in macro_bouton boutons broderie col; do
  $PY render_shots.py $s --res 720 --resy 1280 --samples 18 --step 2
done
$PY render_shots.py hero --res 1080 --resy 1350 --samples 24 --step 2
echo "TOUS LES RENDUS SONT TERMINÉS"
