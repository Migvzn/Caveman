#!/usr/bin/env python3
"""MIGMODS — affine les calques de bracelets.

Les photos de bracelets ne font qu'environ 100 px de large : dans l'aperçu elles
sont agrandies plus de 3 fois par le navigateur, ce qui les rend floues.
Ce script recadre chaque bracelet, l'agrandit 3 fois (Lanczos, couleurs
prémultipliées pour ne pas baver sur les bords), accentue légèrement le détail,
compresse en palette 256 couleurs et met à jour son calage dans data/calages-manuels.json.

Un bracelet déjà traité (image qui ne fait plus 400×400) est ignoré.
Usage : python3 tools/affiner_bracelets.py   (puis generer_catalogue.py et convertir.mjs)
"""
import glob, json, os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'configurator')
SCALE, PAD = 3, 4


def upscale(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255
    rgb, al = a[..., :3] * a[..., 3:], a[..., 3]
    w, h = im.size[0] * SCALE, im.size[1] * SCALE
    up = lambda ch: np.asarray(Image.fromarray(ch).resize((w, h), Image.LANCZOS), dtype=np.float32)
    al2 = np.clip(up(al), 0, 1)
    rgb2 = np.stack([up(np.ascontiguousarray(rgb[..., i])) for i in range(3)], -1)
    rgb2 = np.where(al2[..., None] > 1e-3, rgb2 / np.maximum(al2[..., None], 1e-3), 0)
    out = Image.fromarray((np.clip(np.dstack([rgb2, al2]), 0, 1) * 255).astype(np.uint8), 'RGBA')
    r, g, b, alpha = out.split()
    sharp = Image.merge('RGB', (r, g, b)).filter(ImageFilter.UnsharpMask(radius=2, percent=70, threshold=2))
    alpha = alpha.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=0))
    return Image.merge('RGBA', (*sharp.split(), alpha))


def main():
    auto = json.load(open(os.path.join(ROOT, 'data/calages-auto.json')))
    man_p = os.path.join(ROOT, 'data/calages-manuels.json')
    man = json.load(open(man_p))
    done = 0
    for p in sorted(glob.glob(os.path.join(ROOT, 'assets/strap/*.png'))):
        key = 'assets/strap/' + os.path.basename(p)
        im = Image.open(p)
        fit = man.get(key) or auto.get(key)
        if im.size != (400, 400) or not fit:
            continue
        cx, cy, d = [float(v) for v in fit.split(',')[:3]]
        x0, y0, x1, y1 = im.getbbox()
        x0, y0, x1, y1 = max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD)
        out = upscale(im.crop((x0, y0, x1, y1)))
        # palette 256 couleurs : 7 fois plus léger, sans différence visible à l'écran
        out.quantize(256, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG).save(p, optimize=True)
        man[key] = f"{(cx - x0) * SCALE:.1f},{(cy - y0) * SCALE:.1f},{d * SCALE:.1f}"
        done += 1
        print(key, out.size, man[key])
    json.dump(man, open(man_p, 'w'), indent=1, ensure_ascii=False)
    print(done, 'bracelets affinés')


if __name__ == '__main__':
    main()
