#!/usr/bin/env python3
"""MIGMODS — prépare les photos de composants pour le configurateur.

Pour chaque ligne de configurator/data/sources-images.csv (fichier;etape;id) :
  1. retire le fond blanc / uni (remplissage depuis les bords), et pour les cadrans applique un masque rond ;
  2. mesure automatiquement le calage (cx,cy,taille) selon l'étape :
     - boîtier  : centre et diamètre de l'ouverture du cadran ;
     - cadran   : cercle du cadran ;
     - insert   : cercle extérieur ;
     - aiguilles / trotteuse : axe de rotation et longueur de l'aiguille des minutes / de la trotteuse ;
     - bracelet : axe vertical et largeur ;
     - loupe    : centre et largeur ;
  3. écrit configurator/assets/<etape>/<id>.png et configurator/data/calages-auto.json.

Usage : python3 tools/preparer_images.py <dossier photos> [<autre dossier>…]
"""
import csv, json, math, os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'configurator')
SRC_DIRS = sys.argv[1:]


def find(name):
    for d in SRC_DIRS:
        for ext in ('.PNG', '.png', '.jpg', '.JPG'):
            p = os.path.join(d, name + ext)
            if os.path.exists(p):
                return p
    return None


def flood_background(rgba, tol=26):
    """Rend transparent le fond uni connecté aux bords (blanc ou couleur du coin)."""
    a = rgba.copy()
    h, w = a.shape[:2]
    if (a[[0, 0, -1, -1], [0, -1, 0, -1], 3] < 200).sum() >= 3:
        return a, False                                   # déjà détouré
    ref = np.median(np.stack([a[0, :, :3], a[-1, :, :3]]).reshape(-1, 3), axis=0)
    diff = np.abs(a[..., :3].astype(int) - ref).max(axis=2)
    cand = diff <= tol
    seen = np.zeros((h, w), bool)
    stack = [(y, x) for x in range(w) for y in (0, h - 1)] + [(y, x) for y in range(h) for x in (0, w - 1)]
    while stack:
        y, x = stack.pop()
        if seen[y, x] or not cand[y, x]:
            continue
        seen[y, x] = True
        if y > 0: stack.append((y - 1, x))
        if y < h - 1: stack.append((y + 1, x))
        if x > 0: stack.append((y, x - 1))
        if x < w - 1: stack.append((y, x + 1))
    # bord adouci : les pixels proches du fond deviennent semi-transparents
    soft = np.clip(diff / (tol * 2.5), 0, 1)
    ring = np.array(Image.fromarray((seen * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    alpha = a[..., 3].astype(float)
    alpha[seen] = 0
    edge = ring & ~seen
    alpha[edge] = np.minimum(alpha[edge], soft[edge] * 255)
    a[..., 3] = alpha.astype(np.uint8)
    return a, True


def fill_holes(mask):
    h, w = mask.shape
    outside = np.zeros((h, w), bool)
    stack = [(y, x) for x in range(w) for y in (0, h - 1)] + [(y, x) for y in range(h) for x in (0, w - 1)]
    while stack:
        y, x = stack.pop()
        if outside[y, x] or mask[y, x]:
            continue
        outside[y, x] = True
        if y > 0: stack.append((y - 1, x))
        if y < h - 1: stack.append((y + 1, x))
        if x > 0: stack.append((y, x - 1))
        if x < w - 1: stack.append((y, x + 1))
    return ~outside


def circle_of(mask):
    ys, xs = np.nonzero(mask)
    return xs.mean(), ys.mean(), 2 * math.sqrt(len(xs) / math.pi)


def region_from(a, seed, tol=30):
    """Région connexe autour d'un point, de couleur proche (ou transparente comme lui)."""
    h, w = a.shape[:2]
    sy, sx = seed
    transparent = a[..., 3] < 60
    ref = a[sy, sx, :3].astype(int)
    if transparent[sy, sx]:
        cand = transparent
    else:
        cand = (np.abs(a[..., :3].astype(int) - ref).max(axis=2) <= tol) & ~transparent
    seen = np.zeros((h, w), bool)
    stack = [(sy, sx)]
    while stack:
        y, x = stack.pop()
        if seen[y, x] or not cand[y, x]:
            continue
        seen[y, x] = True
        if y > 0: stack.append((y - 1, x))
        if y < h - 1: stack.append((y + 1, x))
        if x > 0: stack.append((y, x - 1))
        if x < w - 1: stack.append((y, x + 1))
    return seen


def fit_case(a):
    """Ouverture du cadran : grande zone ronde au centre (transparente ou claire)."""
    alpha = a[..., 3] > 128
    filled = fill_holes(alpha)
    ys, xs = np.nonzero(filled)
    # centre provisoire : milieu de la boîte, hors couronne (côté droit) — on prend le centre des lignes médianes
    cx0, cy0 = (xs.min() + xs.max()) / 2 - 8, (ys.min() + ys.max()) / 2
    best = None
    for dx in range(-20, 21, 10):
        for dy in range(-20, 21, 10):
            sx, sy = int(cx0 + dx), int(cy0 + dy)
            reg = region_from(a, (sy, sx), tol=34)
            n = reg.sum()
            if n < 2000:
                continue
            cx, cy, d = circle_of(reg)
            # garde la région la plus ronde et la plus grande
            ry, rx = np.nonzero(reg)
            spread = (rx.max() - rx.min() + 1) / max(1, (ry.max() - ry.min() + 1))
            score = n * (1 - min(0.5, abs(1 - spread)))
            if best is None or score > best[0]:
                best = (score, cx, cy, d)
    if best is None:
        cx, cy, d = circle_of(filled)
        return cx, cy, d * 0.62
    _, cx, cy, d = best
    return cx, cy, d


def fit_round(a):
    return circle_of(fill_holes(a[..., 3] > 128))


def pivot_and_length(a, kind):
    alpha = a[..., 3] > 90
    ys, xs = np.nonzero(alpha)
    pts = np.stack([xs, ys], 1).astype(float)
    if kind == 'seconds':
        m = pts.mean(0)
        u = np.linalg.svd(pts - m, full_matrices=False)[2][0]
        if u[0] < 0:
            u = -u                                         # u pointe vers la queue (à droite)
        t = (pts - m) @ u
        tmin, tmax = t.min(), t.max()
        L = tmax - tmin
        bins = np.round(t - tmin).astype(int)
        width = np.bincount(bins, minlength=int(L) + 2).astype(float)
        sm = np.convolve(width, np.ones(5) / 5, mode='same')
        med = np.median(sm[sm > 0])
        peaks = [i for i in range(2, len(sm) - 2) if sm[i] >= sm[i - 1] and sm[i] >= sm[i + 1] and sm[i] > med * 1.9]
        cand = [i for i in peaks if 0.45 <= i / L <= 0.93]
        if cand:
            i = max(cand)
            sel = np.abs(bins - i) <= 4
            p = pts[sel].mean(0)
        else:
            p = m + u * (tmin + 0.76 * L)
        length = np.sqrt(((pts - p) ** 2).sum(1)).max()
        return p[0], p[1], length
    # aiguilles heures + minutes : le moyeu est la partie la plus épaisse du bas de l'image
    filled = fill_holes(alpha)
    # profondeur d'érosion ≈ distance au bord (sans dépendance externe)
    dt = np.zeros(filled.shape, float)
    cur = Image.fromarray((filled * 255).astype(np.uint8))
    for k in range(1, 40):
        cur = cur.filter(ImageFilter.MinFilter(3))
        m = np.array(cur) > 0
        if not m.any():
            break
        dt[m] = k
    y0, y1 = ys.min(), ys.max()
    zone = np.zeros_like(filled)
    zone[int(y0 + (y1 - y0) * 0.62):, :] = True
    dtz = np.where(zone, dt, 0)
    py, px = np.unravel_index(np.argmax(dtz), dtz.shape)
    length = np.sqrt(((pts - [px, py]) ** 2).sum(1)).max()
    return float(px), float(py), length


def fit_strap(a):
    alpha = a[..., 3] > 128
    ys, xs = np.nonzero(alpha)
    rows = np.unique(ys)
    widths = [alpha[y].sum() for y in rows]
    w = float(np.median(widths))
    return (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2, w


def fit_bbox(a):
    alpha = a[..., 3] > 128
    ys, xs = np.nonzero(alpha)
    return (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2, float(xs.max() - xs.min())


def main():
    rows = list(csv.DictReader(open(os.path.join(ROOT, 'data/sources-images.csv'), encoding='utf-8'), delimiter=';'))
    fits, report = {}, []
    for r in rows:
        src = find(r['fichier'])
        if not src:
            report.append(f"introuvable : {r['fichier']}")
            continue
        im = Image.open(src).convert('RGBA')
        a = np.array(im)
        a, cleaned = flood_background(a)
        step = r['etape']
        if step == 'dial':
            cx, cy, d = fit_round(a)
            # masque rond propre, légèrement à l'intérieur du bord
            h, w = a.shape[:2]
            yy, xx = np.mgrid[0:h, 0:w]
            rr = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
            edge = np.clip((d / 2 - 1.0 - rr) / 1.2, 0, 1)
            a[..., 3] = (a[..., 3] * edge).astype(np.uint8)
        if step == 'bezel_insert':
            # fond resté au centre de l'anneau
            hh, ww = a.shape[:2]
            c = a[hh // 2, ww // 2]
            if c[3] > 200 and c[:3].min() > 225:
                hole = region_from(a, (hh // 2, ww // 2), tol=26)
                a[hole, 3] = 0
            cx, cy, d = fit_round(a)
        elif step == 'case':
            cx, cy, d = fit_case(a)
        elif step == 'hands':
            cx, cy, d = pivot_and_length(a, 'hands')
        elif step == 'second_hand':
            cx, cy, d = pivot_and_length(a, 'seconds')
        elif step == 'strap':
            cx, cy, d = fit_strap(a)
        elif step == 'date_magnifier':
            cx, cy, d = fit_bbox(a)
        elif step != 'dial':
            cx, cy, d = fit_bbox(a)
        out = os.path.join(ROOT, 'assets', step, r['id'] + '.png')
        os.makedirs(os.path.dirname(out), exist_ok=True)
        Image.fromarray(a).save(out, optimize=True)
        key = f"assets/{step}/{r['id']}.png"
        fits[key] = f"{cx:.1f},{cy:.1f},{d:.1f}"
        report.append(f"{key} <- {r['fichier']}{' (fond retiré)' if cleaned else ''} calage {fits[key]}")
    json.dump(fits, open(os.path.join(ROOT, 'data/calages-auto.json'), 'w'), indent=1)
    print('\n'.join(report))
    print(f"{len(fits)} images préparées")


if __name__ == '__main__':
    main()
