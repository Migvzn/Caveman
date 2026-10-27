#!/usr/bin/env python3
"""MIGMODS — convertit les calques PNG du configurateur en WebP (DESIGN-SYSTEM.md §18.2), appelé par build-theme.mjs.

Entrée (stdin) : liste JSON de [source.png, destination.webp]. Qualité 90, alpha sans perte visible
(contrôlé à l'œil : textes des cadrans et soleillés intacts). Une destination plus récente que sa source est
réutilisée (cache dans tools/out/webp-cache). Sortie (stdout) : liste JSON de { "src", "dst", "png", "webp" }
en octets ; "webp": null si le WebP n'est pas plus léger que le PNG (le PNG est alors gardé).
Dépendance : Pillow (pip install pillow).
"""
import json
import os
import sys

from PIL import Image

QUALITY = 90


def main():
    jobs = json.load(sys.stdin)
    out = []
    for src, dst in jobs:
        png = os.path.getsize(src)
        if not (os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            im = Image.open(src)
            if im.mode not in ('RGB', 'RGBA'):
                im = im.convert('RGBA')
            im.save(dst, 'WEBP', quality=QUALITY, method=6, alpha_quality=100)
        webp = os.path.getsize(dst)
        out.append({'src': src, 'dst': dst, 'png': png, 'webp': webp if webp < png else None})
    json.dump(out, sys.stdout)


if __name__ == '__main__':
    main()
