"""Prépare toutes les textures et visuels dérivés des images fournies (assets/source).

  - broderie "Fadiye" extraite de la photo produit  -> textures/embroidery_mask.png (+ relief)
  - logo + fleur Lycoris extraits de l'étiquette       -> video/public/images/*.png
  - relief du bouton signature (fleur Lycoris)         -> textures/button_relief.png
  - maille jersey (points en V)                        -> textures/knit_height.png
  - étiquette tissée                                   -> textures/etiquette_crop.png

    python prepare_textures.py
"""
import os

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "assets", "source")
TEX = os.environ.get("FADIYE_TEX", os.path.join(HERE, "textures"))
IMG_OUT = os.environ.get("FADIYE_IMG", os.path.join(HERE, "..", "video", "public", "images"))
os.makedirs(TEX, exist_ok=True)
os.makedirs(IMG_OUT, exist_ok=True)


def redness(img):
    im = img.astype(np.float32) / 255
    b, g, r = im[..., 0], im[..., 1], im[..., 2]
    return np.clip(r - np.maximum(g, b), 0, 1)


# ------------------------------------------------------------ broderie (photo produit)
photo = cv2.imread(os.path.join(SRC, "cardigan_photo.png"))
mask = np.clip((redness(photo) - 0.08) / 0.35, 0, 1)
ys, xs = np.where(mask > 0.3)
x0, x1, y0, y1 = xs.min() - 12, xs.max() + 12, ys.min() - 12, ys.max() + 12
m = mask[y0:y1, x0:x1]
up = np.clip(cv2.resize(m, (m.shape[1] * 4, m.shape[0] * 4), interpolation=cv2.INTER_CUBIC), 0, 1)
cv2.imwrite(os.path.join(TEX, "embroidery_mask.png"), (up * 255).astype(np.uint8))
binm = (up * 255 > 110).astype(np.uint8)
d = cv2.distanceTransform(binm, cv2.DIST_L2, 5)
eh = cv2.GaussianBlur(np.sqrt(np.clip(d / 7.0, 0, 1)), (0, 0), 1.0)
cv2.imwrite(os.path.join(TEX, "embroidery_height.png"), (eh * 255).astype(np.uint8))
print("broderie : boîte", (x0, y0, x1, y1), "dans la photo")

# ------------------------------------------------------------ logo + fleur (étiquette)
label = cv2.imread(os.path.join(SRC, "etiquette.png"))
lm = np.clip((redness(label) - 0.10) / 0.30, 0, 1)
lm[600:, :] = 0  # retire le "M" de taille


def save_rgba(alpha, name):
    ys, xs = np.where(alpha > 0.25)
    a = alpha[ys.min() - 8: ys.max() + 8, xs.min() - 8: xs.max() + 8]
    a = np.clip(cv2.resize(a, (a.shape[1] * 2, a.shape[0] * 2), interpolation=cv2.INTER_CUBIC), 0, 1)
    a8 = (a * 255).astype(np.uint8)
    num, lab, st, _ = cv2.connectedComponentsWithStats((a8 > 60).astype(np.uint8), connectivity=8)
    keep = np.zeros(num, bool)
    keep[1:] = st[1:, 4] >= 140  # supprime les poussières du tissage
    a8 = cv2.GaussianBlur(np.where(keep[lab], a8, 0).astype(np.uint8), (0, 0), 0.6)
    for col, suf in [((22, 16, 206), ""), ((255, 255, 255), "_blanc")]:
        out = np.zeros((*a8.shape, 4), np.uint8)
        out[..., 0], out[..., 1], out[..., 2] = col
        out[..., 3] = a8
        cv2.imwrite(os.path.join(IMG_OUT, f"{name}{suf}.png"), out)
    return a8


logo = lm.copy(); logo[:, 1195:] = 0
flower = lm.copy(); flower[:, :1195] = 0
save_rgba(logo, "logo_fadiye")
flower_a = save_rgba(flower, "lycoris_icone")

crop = cv2.imread(os.path.join(SRC, "etiquette.png"))[130:760, 190:1700]
cv2.imwrite(os.path.join(TEX, "etiquette_crop.png"), crop)

# ------------------------------------------------------------ relief du bouton
S = 1024
btn = cv2.imread(os.path.join(SRC, "bouton_lycoris.png"), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
cx, cy, R = 768, 512, 470
bc = cv2.resize(btn[cy - R: cy + R, cx - R: cx + R], (S, S), interpolation=cv2.INTER_AREA)
hp = np.clip((cv2.GaussianBlur(bc - cv2.GaussianBlur(bc, (0, 0), 22), (0, 0), 1.5)) * 3.2, -0.5, 0.5)

fl = flower_a.astype(np.float32) / 255
sc = (S * 0.66) / fl.shape[0]
fl = cv2.resize(fl, (int(fl.shape[1] * sc), int(fl.shape[0] * sc)), interpolation=cv2.INTER_AREA)
canvas = np.zeros((S, S), np.float32)
oy, ox = (S - fl.shape[0]) // 2 + 6, (S - fl.shape[1]) // 2
canvas[oy: oy + fl.shape[0], ox: ox + fl.shape[1]] = fl
d = cv2.distanceTransform((canvas > 0.45).astype(np.uint8), cv2.DIST_L2, 5)
flower_h = cv2.GaussianBlur(np.sqrt(np.clip(d / 5.0, 0, 1)), (0, 0), 1.2)
yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
r = np.hypot(xx - S / 2, yy - S / 2) / (S / 2)
th = np.arctan2(yy - S / 2, xx - S / 2)
corner = np.clip((r - 0.62) / 0.12, 0, 1) * (r < 0.86) * np.clip(np.abs(np.sin(2 * th)) * 2 - 0.6, 0, 1)
h = 0.12 + 0.88 * flower_h + 0.9 * hp * corner  # fleur + ornements art nouveau dans les coins
h = np.maximum(h, np.exp(-((r - 0.92) / 0.04) ** 2) * 0.9)  # listel
cv2.imwrite(os.path.join(TEX, "button_relief.png"), (np.clip(h, 0, 1) * 255).astype(np.uint8))

# ------------------------------------------------------------ maille jersey (8 x 10 mailles, raccordable)
cols, rows, px = 8, 10, 64
W, H = cols * px, rows * int(px * 0.84)
hgt = np.zeros((H, W), np.float32)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
cw, ch = px, H / rows
for cy_ in range(-1, rows + 1):
    for cx_ in range(-1, cols + 1):
        for side in (-1, 1):
            dx = (xx - ((cx_ + 0.5) * cw + side * cw * 0.24) + W / 2) % W - W / 2
            dy = (yy - (cy_ + 0.5) * ch + H / 2) % H - H / 2
            a = np.deg2rad(28 * side)
            u = dx * np.cos(a) - dy * np.sin(a)
            v = dx * np.sin(a) + dy * np.cos(a)
            leg = np.sqrt(np.clip(1 - (u / (cw * 0.27)) ** 2 - (v / (ch * 0.78)) ** 2, 0, 1))
            hgt = np.maximum(hgt, leg * (0.85 + 0.15 * np.cos((u * 0.55 + v * 0.9) / cw * 28)))
hgt = cv2.GaussianBlur(hgt, (0, 0), 1.2)
hgt = (hgt - hgt.min()) / (hgt.max() - hgt.min())
cv2.imwrite(os.path.join(TEX, "knit_height.png"), (hgt * 255).astype(np.uint8))
print("textures prêtes dans", TEX)
