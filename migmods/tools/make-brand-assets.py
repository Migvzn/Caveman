#!/usr/bin/env python3
"""MIGMODS — assets de marque générés (DESIGN-SYSTEM.md §10.7, §7.10, §8.7, §9.1.1, §15).

Usage (depuis migmods/) :
  python3 tools/make-brand-assets.py                 # tout, puis planche tools/out/brand-sheet.png
  python3 tools/make-brand-assets.py --only og,glow  # une partie (noms ci-dessous)
  python3 tools/make-brand-assets.py --video chemin/vers/video.mp4   # réextrait l'image du héros

Produit dans theme/assets (fichiers GÉNÉRÉS, jamais édités à la main) :
  logos   logo-migmods-320.webp, -640.webp, -1100.webp   mot-symbole chromé, alpha, ratio 1109/394
  og      migmods-og.jpg (1200 × 630)                   logo sur noir, vagues douces du héros
  touch   apple-touch-icon.png (180 × 180)              poinçon : M italique chromé dans un anneau
  favicon favicon-32.png (32 × 32)                      même M sur un jeton noir cerclé de chrome
  glow    migmods-glow.webp (256 × 256)                 lueur conique actuelle du fond, pré-floutée
  grain   migmods-grain.png (64 × 64)                   grain anti-bandes, neutre en moyenne
  poster  migmods-hero-poster-land.jpg (1600 × 900)     image de la vidéo du héros, cadrée paysage

Sources versionnées :
  theme/assets/logo-migmods.png                         mot-symbole d'origine (1109 × 394)
  tools/brand-src/hero-frame-0015.png                   image n° 15 de la vidéo du héros, lignes 480–1439
                                                        (celle du poster portrait), extraite sans perte
  tools/fonts-src/cormorant-garamond-latin-600-italic.woff2, -700-italic.woff2 (OFL) : M du poinçon

Dépendances : Pillow (avec WebP), numpy, fontTools ; ffmpeg seulement avec --video.
Sortie reproductible (graine fixe). Code de sortie 1 si un budget est dépassé (aucun fichier > 300 Ko).
"""
import argparse
import io
import os
import subprocess
import sys

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont, features

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                      # migmods/
ASSETS = os.path.join(ROOT, 'theme', 'assets')
SRC = os.path.join(HERE, 'brand-src')
FONTS = os.path.join(HERE, 'fonts-src')
OUT = os.path.join(HERE, 'out')

LOGO_SRC = os.path.join(ASSETS, 'logo-migmods.png')
FRAME_SRC = os.path.join(SRC, 'hero-frame-0015.png')
FRAME_INDEX, FRAME_TOP, FRAME_ROWS = 15, 480, 960  # image du poster portrait (migmods-hero-poster.jpg)
LOGO_RATIO = 394 / 1109

KB = 1024
BUDGETS = {                                       # §10.7 (octets)
    'logo-migmods-320.webp': 30 * KB,
    'logo-migmods-640.webp': 80 * KB,
    'logo-migmods-1100.webp': 200 * KB,
    'migmods-og.jpg': 150 * KB,
    'apple-touch-icon.png': 20 * KB,
    'favicon-32.png': 5 * KB,
    'migmods-glow.webp': 6 * KB,
    'migmods-grain.png': 3 * KB,
    'migmods-hero-poster-land.jpg': 150 * KB,
}
HARD_LIMIT = 300 * KB

# Lumière de la maison (§3) : teinte froide et direction 110°.
COOL = np.array([200, 220, 255.0])


def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


# « Studio » du chrome : ciel clair, horizon sombre, sol qui remonte (même famille que --chrome-text).
CHROME_ENV = [(0, '#ffffff'), (.28, '#e9eef5'), (.45, '#a7adb6'), (.53, '#3d424a'),
              (.60, '#8e959f'), (.78, '#f2f4f7'), (1, '#c7ccd3')]
CHROME_ENV = [(p, hexc(c)) for p, c in CHROME_ENV]


# ——— Outils ————————————————————————————————————————————————————————————————

def gblur(a, sigma):
    """Flou gaussien séparable en flottants (bords en miroir)."""
    r = int(3 * sigma) + 1
    k = np.exp(-.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    p = np.pad(a, r, mode='reflect')
    p = np.apply_along_axis(lambda v: np.convolve(v, k, 'valid'), 1, p)
    return np.apply_along_axis(lambda v: np.convolve(v, k, 'valid'), 0, p)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def ramp(stops, t):
    pos = np.array([p for p, _ in stops])
    cols = np.array([c for _, c in stops], float)
    return np.stack([np.interp(t, pos, cols[:, i]) for i in range(3)], axis=-1)


def resize_alpha(im, size):
    """Redimensionne une image RGBA en alpha prémultiplié (pas de franges sombres)."""
    return im.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')


def to_u8(a):
    return np.clip(np.round(a), 0, 255).astype('uint8')


def cormorant_italic(weight, px):
    font = TTFont(os.path.join(FONTS, f'cormorant-garamond-latin-{weight}-italic.woff2'))
    font.flavor = None
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, px)


def save(im, name, **opts):
    path = os.path.join(ASSETS, name)
    im.save(path, **opts)
    return path


# ——— Logos ——————————————————————————————————————————————————————————————————

def make_logos():
    src = Image.open(LOGO_SRC).convert('RGBA')
    out = []
    # alpha_quality 75 : −10 à −15 % pour une perte invisible (PSNR sur noir −0,1 dB) ; marge ≥ 12 % sous le budget
    for w, q in ((320, 90), (640, 88), (1100, 88)):
        h = round(w * LOGO_RATIO)
        im = resize_alpha(src, (w, h))
        if w < src.width * .7:                     # réduction forte : on rend le piqué des reflets du chrome
            rgb, a = im.convert('RGB'), im.getchannel('A')
            rgb = rgb.filter(ImageFilter.UnsharpMask(radius=.8, percent=35, threshold=2))
            im = Image.merge('RGBA', (*rgb.split(), a))
        out.append(save(im, f'logo-migmods-{w}.webp', format='WEBP', quality=q, alpha_quality=75, method=6))
    return out


# ——— Vagues du héros (portage numpy du shader de migmods-waves.js) ———————————————

def waves(W, H, t, gain=.6, dim=1.0, ss=2):
    w, h = W * ss, H * ss
    y, x = np.mgrid[0:h, 0:w].astype(np.float64) + .5
    y = h - y                                       # repère GL : y vers le haut
    m = min(w, h)
    ux, uy = (2 * x - w) / m, (2 * y - h) / m
    dist = np.hypot(x - w / 2, y - h / 2)
    cd = 1 + (smoothstep(m / 2 * .3, m / 2 * .5, dist) - 1) * dim
    for i in range(1, 10):
        ux = ux + .6 / i * np.cos(i * 2.5 * uy + t)
        uy = uy + .6 / i * np.cos(i * 1.5 * ux + t)
    c = .1 / np.maximum(np.abs(np.sin(t - uy - ux)), 1e-4)
    c = np.minimum(c * gain, 1.0)
    c = c * .3 + (c - c * .3) * (1 + (cd - 1) * dim)
    return c.reshape(H, ss, W, ss).mean(axis=(1, 3))


def make_og():
    W, H, LW = 1200, 630, 600                      # logo à 50 % : il tient aussi dans un recadrage carré central
    a = waves(W, H, 1.2)                           # t = 1,2 : les vagues encadrent, le centre reste noir
    y, x = np.mgrid[0:H, 0:W] + .5
    lh = round(LW * LOGO_RATIO)
    e = np.hypot((x - W / 2) / (LW * .62), (y - H / 2) / (lh * 1.18))
    a = a * .5 * (.12 + .88 * smoothstep(.55, 1.0, e))   # « douces » : moitié de l'intensité, rien sous le logo
    bg = Image.fromarray(to_u8(a * 255)).filter(ImageFilter.GaussianBlur(1.2)).convert('RGBA')
    bg.alpha_composite(resize_alpha(Image.open(LOGO_SRC), (LW, lh)), ((W - LW) // 2, (H - lh) // 2))
    return [save(bg.convert('RGB'), 'migmods-og.jpg', format='JPEG', quality=92, subsampling=0,
                 progressive=True, optimize=True)]


# ——— Poinçon : M italique chromé ——————————————————————————————————————————————

def glyph_mask(S, weight, frac):
    m = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(m)
    f = cormorant_italic(weight, int(S * frac))
    x0, y0, x1, y1 = d.textbbox((0, 0), 'M', font=f)
    d.text(((S - (x1 - x0)) / 2 - x0, (S - (y1 - y0)) / 2 - y0), 'M', font=f, fill=255)
    top = (S - (y1 - y0)) / 2 / S
    return np.asarray(m, float) / 255, top, top + (y1 - y0) / S


def chrome_shade(mask, bevel, ys, ye, tilt=.6, rimk=.5, specp=18, speck=.9):
    """Matière chrome : relief tiré du masque, reflet d'un studio (ciel, horizon sombre, sol),
    reflet froid venu du haut à gauche (110°), bords assombris comme le mot-symbole."""
    H, W = mask.shape
    h = np.sqrt(np.clip(gblur(mask, bevel) * 1.8, 0, 1)) * mask
    gy, gx = np.gradient(h)
    k = bevel * 1.1
    nx, ny, nz = -gx * k, -gy * k, np.ones_like(h)
    n = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / n, ny / n, nz / n
    yn = np.clip(((np.mgrid[0:H, 0:W][0] + .5) / H - ys) / (ye - ys), 0, 1)
    col = ramp(CHROME_ENV, np.clip(yn * .85 + .08 + tilt * 2 * nz * ny, 0, 1))
    L = np.array([-.5, -.72, .48])
    L /= np.linalg.norm(L)
    spec = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1) ** specp
    col = col + spec[..., None] * COOL * speck
    rim = np.clip((1 - nz) * 1.5, 0, 1)
    return np.clip(col * (1 - rimk * rim[..., None]), 0, 255)


def chrome_ring(S, radius, half_width):
    """Anneau chromé éclairé du côté de la lumière (110°)."""
    y, x = np.mgrid[0:S, 0:S] + .5
    rr = np.hypot(x - S / 2, y - S / 2) / (S / 2)
    m = np.clip(1 - np.abs(rr - radius) / half_width, 0, 1)
    ang = np.arctan2(y - S / 2, x - S / 2)
    return m, ramp(CHROME_ENV, np.clip(.5 - .42 * np.cos(ang + np.radians(70)), 0, 1))


def glint(S, cx, cy, length, core):
    """Éclat en croix, comme ceux du mot-symbole."""
    y, x = np.mgrid[0:S, 0:S] + .5
    dx, dy = x - cx, y - cy
    w = S * .004
    a = np.exp(-.5 * (dy / w) ** 2) * np.exp(-np.abs(dx) / (length * .35))
    a += np.exp(-.5 * (dx / w) ** 2) * np.exp(-np.abs(dy) / (length * .35)) * .8
    a += np.exp(-.5 * (np.hypot(dx, dy) / core) ** 2) * 1.2
    return np.clip(a, 0, 1.5)


def make_touch_icon():
    size, ss = 180, 4
    S = size * ss
    mask, ys, ye = glyph_mask(S, '600', .72)
    col = chrome_shade(mask, S * .022, ys, ye)
    y, x = np.mgrid[0:S, 0:S] + .5
    r = np.hypot(x - S / 2, y - S * .48) / (S / 2)
    base = np.array([4, 4, 5.0]) + 255 * .09 * (np.clip(1 - r / .9, 0, 1) ** 1.8)[..., None]   # halo d'écrin
    rm, rc = chrome_ring(S, .9, ss / (S / 2))
    base = base * (1 - rm[..., None]) + rc * rm[..., None]
    out = base * (1 - mask[..., None]) + col * mask[..., None]
    rows = np.nonzero(mask.max(axis=1) > .5)[0]
    top = rows[0] + int(S * .012)
    xs = np.nonzero(mask[top] > .5)[0]
    out = out + glint(S, xs[0] + (xs[-1] - xs[0]) * .15, top, S * .11, S * .008)[..., None] * np.array([215, 230, 255.0])
    im = Image.fromarray(to_u8(out)).resize((size, size), Image.LANCZOS)
    # iOS n'affiche pas la transparence : image opaque, palette de 256 tons pour tenir le budget
    im = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    return [save(im, 'apple-touch-icon.png', format='PNG', optimize=True)]


def make_favicon():
    size, ss = 32, 8
    S = size * ss
    mask, ys, ye = glyph_mask(S, '700', .78)        # 700 : lisible à 32 px
    col = chrome_shade(mask, S * .02, ys, ye, rimk=.35)
    y, x = np.mgrid[0:S, 0:S] + .5
    rr = np.hypot(x - S / 2, y - S / 2) / (S / 2)
    disc = np.clip((1 - rr) * S / 2 / ss + .5, 0, 1)            # jeton rond, bord d'un pixel adouci
    base = np.zeros((S, S, 3)) + np.array([5, 5, 6.0])
    rm, rc = chrome_ring(S, 1 - 1.1 * ss / (S / 2), .9 * ss / (S / 2))
    base = base * (1 - rm[..., None]) + rc * .8 * rm[..., None]
    rgb = base * (1 - mask[..., None]) + col * mask[..., None]
    rgba = np.dstack([rgb * disc[..., None], disc * 255])          # prémultiplié pour la réduction
    im = Image.fromarray(to_u8(rgba), 'RGBa').resize((size, size), Image.LANCZOS).convert('RGBA')
    return [save(im, 'favicon-32.png', format='PNG', optimize=True)]


# ——— Fond animé (§7.10) ————————————————————————————————————————————————————————

BG_STOPS = [0x00, 0x3a, 0x0b, 0x8c, 0x15, 0xd6, 0x1e, 0x00]   # conic-gradient actuel de .site-bg


def conic(N, rot_deg=0.0):
    y, x = np.mgrid[0:N, 0:N] + .5
    th = (np.degrees(np.arctan2(x - N / 2, -(y - N / 2))) - rot_deg) % 360   # 0° en haut, sens horaire
    t = th / 360 * (len(BG_STOPS) - 1)
    i = np.clip(np.floor(t).astype(int), 0, len(BG_STOPS) - 2)
    f = t - i
    s = np.array(BG_STOPS, float)
    return s[i] * (1 - f) + s[i + 1] * f


def make_glow():
    """Rend en une texture l'ancien fond : deux dégradés coniques flous (opacités .2 et .12, le second
    décalé d'un demi-tour) sur le voile radial, divisé par l'opacité .9 du nouveau calque.
    Le calque fait 36vmax × 4 = 144vmax : le flou CSS de 60 px vaut ≈ 9,5 texels (7,4 sur ordinateur,
    12,5 sur iPhone) ; la partie visible tient dans un rayon de 0,40 de la texture."""
    size, ss, sigma, delta, opacity, R = 256, 4, 9.5, 180.0, .9, .40
    N = size * ss
    m = int(3 * sigma * ss) + 2
    L1 = gblur(conic(N + 2 * m, 0.0), sigma * ss)[m:m + N, m:m + N]
    L2 = gblur(conic(N + 2 * m, delta), sigma * ss)[m:m + N, m:m + N]
    y, x = np.mgrid[0:N, 0:N] + .5
    base = 255 * .035 * np.clip(1 - np.hypot(x - N / 2, y - N / 2) / (R * N), 0, 1)
    out = (base * .8 + .2 * L1) * .88 + .12 * L2
    tex = (out / opacity).reshape(size, ss, size, ss).mean(axis=(1, 3))
    im = Image.fromarray(to_u8(tex)).convert('RGB')
    return [save(im, 'migmods-glow.webp', format='WEBP', lossless=True, quality=100, method=6)]


def make_grain():
    """Bruit blanc 64 × 64 à 6 niveaux (PNG 4 bits). Moyenne ≈ 24, celle du fond : à l'opacité .035,
    il fait varier chaque pixel de ±1 niveau environ (assez pour casser les bandes) sans éclaircir les noirs."""
    rng = np.random.default_rng(2026)
    levels = np.array([0, 17, 34, 51, 68, 85])
    p = np.array([.30, .28, .22, .12, .06, .02])
    idx = rng.choice(len(levels), size=(64, 64), p=p)
    im = Image.fromarray(idx.astype('uint8'), 'P')
    pal = []
    for v in levels:
        pal += [int(v)] * 3
    im.putpalette(pal + [0] * (768 - len(pal)))
    return [save(im, 'migmods-grain.png', format='PNG', bits=4, optimize=True)]


# ——— Poster paysage (§9.1.1) ——————————————————————————————————————————————————

def extract_frame(video):
    """Image n° 15 de la vidéo (celle du poster portrait), lignes 480–1439, sans perte."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'select=eq(n\\,{FRAME_INDEX})',
                          '-vframes', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    w, h = 1080, 1920
    if len(raw) != w * h * 3:
        sys.exit('✘ vidéo inattendue : 1080 × 1920 attendu (vidéo portrait du héros)')
    frame = Image.frombytes('RGB', (w, h), raw)
    os.makedirs(SRC, exist_ok=True)
    frame.crop((0, FRAME_TOP, w, FRAME_TOP + FRAME_ROWS)).save(FRAME_SRC, optimize=True)
    print('✔ ' + os.path.relpath(FRAME_SRC, ROOT) + ' réextraite de ' + video)


def make_poster():
    """Cadrage identique à la vidéo portrait affichée en object-fit: cover, object-position 50 % 50 %,
    dans le média du héros sur ordinateur (1200 px de large au plus, 900 px de haut) : la vidéo peut
    apparaître par-dessus le poster sans saut. Le reste de la largeur est noir (fusion screen)."""
    W, H, box = 1600, 900, 1200
    band = Image.open(FRAME_SRC).convert('RGB')
    s = box / band.width
    scaled = band.resize((box, round(band.height * s)), Image.LANCZOS)
    cy = (960 - FRAME_TOP) * s                       # centre de la vidéo dans la bande agrandie
    top = round(cy - H / 2)
    canvas = Image.new('RGB', (W, H), (0, 0, 0))
    canvas.paste(scaled.crop((0, top, box, top + H)), ((W - box) // 2, 0))
    # point noir à 3 : efface les résidus de macroblocs H.264 (niveaux 1–2) sans toucher au chrome
    canvas = canvas.point([round(max(0, v - 3) * 255 / 252) for v in range(256)] * 3)
    return [save(canvas, 'migmods-hero-poster-land.jpg', format='JPEG', quality=88, subsampling=0,
                 progressive=True, optimize=True)]


# ——— Planche de contrôle ————————————————————————————————————————————————————————

def contact_sheet():
    os.makedirs(OUT, exist_ok=True)
    sheet = Image.new('RGB', (1600, 1110), (5, 5, 5))
    d = ImageDraw.Draw(sheet)
    inter = TTFont(os.path.join(ASSETS, 'inter.woff2'))
    inter.flavor = None
    buf = io.BytesIO()
    inter.save(buf)
    buf.seek(0)
    label_font = ImageFont.truetype(buf, 13)
    stone = (156, 160, 167)

    def label(xy, text):
        d.text(xy, text, fill=stone, font=label_font)

    def put(name, xy, scale=1.0, note=''):
        im = Image.open(os.path.join(ASSETS, name)).convert('RGBA')
        if scale != 1.0:
            im = im.resize((round(im.width * scale), round(im.height * scale)),
                           Image.NEAREST if scale > 1 else Image.LANCZOS)
        sheet.paste(im, xy, im)
        size = os.path.getsize(os.path.join(ASSETS, name))
        label((xy[0], xy[1] + im.height + 10), f'{name} · {size / KB:.1f} Ko (budget {BUDGETS[name] / KB:.0f}){note}')

    put('migmods-og.jpg', (40, 40), .5, ' · ½')
    put('migmods-hero-poster-land.jpg', (700, 40), .5, ' · ½')
    put('logo-migmods-1100.webp', (40, 560), .5, ' · ½')
    put('logo-migmods-640.webp', (680, 560), .5, ' · ½')
    put('logo-migmods-320.webp', (1100, 560))
    put('apple-touch-icon.png', (40, 800))
    put('favicon-32.png', (330, 800), 4, ' · ×4')
    for k, bg in enumerate([(232, 232, 234), (53, 54, 58)]):         # onglets clair et sombre, taille réelle
        d.rectangle([330 + k * 64, 960, 330 + k * 64 + 48, 1008], fill=bg)
        fav = Image.open(os.path.join(ASSETS, 'favicon-32.png')).convert('RGBA')
        sheet.paste(fav, (338 + k * 64, 968), fav)
    glow = Image.open(os.path.join(ASSETS, 'migmods-glow.webp'))
    sheet.paste(Image.fromarray(to_u8(np.asarray(glow, float) * 3)).resize((256, 256)), (700, 800))
    label((700, 1066), 'migmods-glow.webp · luminosité ×3')
    grain = Image.open(os.path.join(ASSETS, 'migmods-grain.png')).convert('L')
    sheet.paste(grain.resize((256, 256), Image.NEAREST).convert('RGB'), (1000, 800))
    label((1000, 1066), 'migmods-grain.png · ×4')
    path = os.path.join(OUT, 'brand-sheet.png')
    sheet.save(path)
    return path


# ——— Programme ——————————————————————————————————————————————————————————————————

JOBS = {'logos': make_logos, 'og': make_og, 'touch': make_touch_icon, 'favicon': make_favicon,
        'glow': make_glow, 'grain': make_grain, 'poster': make_poster}


def main():
    ap = argparse.ArgumentParser(description='Assets de marque MigMods (§10.7).')
    ap.add_argument('--only', help='liste séparée par des virgules : ' + ', '.join(JOBS))
    ap.add_argument('--video', help='vidéo portrait du héros (1080 × 1920) dont réextraire l’image n° 15')
    ap.add_argument('--no-sheet', action='store_true', help='sans planche de contrôle')
    args = ap.parse_args()
    if not features.check('webp'):
        sys.exit('✘ Pillow sans WebP')
    names = args.only.split(',') if args.only else list(JOBS)
    unknown = [n for n in names if n not in JOBS]
    if unknown:
        sys.exit('✘ inconnu : ' + ', '.join(unknown))
    if args.video:
        extract_frame(args.video)

    over = False
    for n in names:
        for path in JOBS[n]():
            name = os.path.basename(path)
            size = os.path.getsize(path)
            with Image.open(path) as im:
                dims = f'{im.width} × {im.height}'
            budget = BUDGETS[name]
            ok = size <= budget and size <= HARD_LIMIT
            over |= not ok
            print(f'{"✔" if ok else "✘"} theme/assets/{name} : {dims}, {size / KB:.1f} Ko (budget {budget / KB:.0f} Ko)')
    if not args.no_sheet and not args.only:
        print('✔ ' + os.path.relpath(contact_sheet(), ROOT))
    if over:
        sys.exit('✘ budget dépassé')


if __name__ == '__main__':
    main()
