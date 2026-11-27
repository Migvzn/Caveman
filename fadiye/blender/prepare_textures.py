"""Prépare toutes les textures et visuels dérivés des images fournies (assets/source).

  - broderie "Fadiye" extraite de la photo produit -> masque, relief, fils du point satin,
    sens des fils (pour le reflet anisotrope)                   -> textures/emb_*.png
  - logo + fleur Lycoris extraits de l'étiquette               -> video/public/images/*.png
  - relief du bouton signature, redessiné d'après la photo HD
    (étamines tracées en tubes lisses, boules, pétales, ornements, listel) -> textures/button_*.png
  - maille jersey (points en V, fils retors, irrégularités)    -> textures/knit_*.png
  - côtes 2x2 (bord-côtes, patte)                              -> textures/rib_*.png
  - étiquette tissée                                           -> textures/etiquette_crop.png

    python prepare_textures.py
"""
import json
import os

import cv2
import numpy as np
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "assets", "source")
TEX = os.environ.get("FADIYE_TEX", os.path.join(HERE, "textures"))
IMG_OUT = os.environ.get("FADIYE_IMG", os.path.join(HERE, "..", "video", "public", "images"))
os.makedirs(TEX, exist_ok=True)
os.makedirs(IMG_OUT, exist_ok=True)
RNG = np.random.default_rng(7)

import sys  # noqa: E402
sys.path.insert(0, HERE)
import sdf_garment as G  # noqa: E402


def redness(img):
    im = img.astype(np.float32) / 255
    b, g, r = im[..., 0], im[..., 1], im[..., 2]
    return np.clip(r - np.maximum(g, b), 0, 1)


def save16(name, a):
    cv2.imwrite(os.path.join(TEX, name), (np.clip(a, 0, 1) * 65535).astype(np.uint16))


def save8(name, a):
    cv2.imwrite(os.path.join(TEX, name), (np.clip(a, 0, 1) * 255).astype(np.uint8))


def signed_dist(b):
    return ndi.distance_transform_edt(b) - ndi.distance_transform_edt(~b)


# ============================================================ broderie (photo produit)
photo = cv2.imread(os.path.join(SRC, "cardigan_photo.png"))
red = redness(photo)
m0 = np.clip((red - 0.08) / 0.35, 0, 1)
ys, xs = np.where(m0 > 0.5)
PAD = 8
x0, x1, y0, y1 = xs.min() - PAD, xs.max() + PAD + 1, ys.min() - PAD, ys.max() + PAD + 1
UP = 8  # 1 px = 0.11 mm
crop = m0[y0:y1, x0:x1]
up = np.clip(cv2.resize(crop, (crop.shape[1] * UP, crop.shape[0] * UP), interpolation=cv2.INTER_CUBIC), 0, 1)
sd = signed_dist(up > 0.5).astype(np.float32)
sd = cv2.GaussianBlur(sd, (0, 0), UP * 0.30)           # contours lisses, sans escalier
mask = np.clip(0.5 + sd / 1.6, 0, 1)
px_mm = 1000.0 / (G.PX_PER_M * UP)
dt_mm = np.clip(sd, 0, None) * px_mm
height = np.sqrt(np.clip(dt_mm / 0.75, 0, 1))          # bourrelet du point satin (plein à 0,75 mm du bord)

# sens des fils : perpendiculaire au tracé (direction du gradient), légèrement incliné
gx = cv2.Sobel(cv2.GaussianBlur(sd, (0, 0), 2.0), cv2.CV_32F, 1, 0, ksize=3)
gy = cv2.Sobel(cv2.GaussianBlur(sd, (0, 0), 2.0), cv2.CV_32F, 0, 1, ksize=3)
J = [cv2.GaussianBlur(a, (0, 0), UP * 0.7) for a in (gx * gx, gx * gy, gy * gy)]
theta = 0.5 * np.arctan2(2 * J[1], J[0] - J[2]) + np.deg2rad(14)  # angle image (x droite, y bas)
# points satin : bruit filtré puis intégré le long du fil (LIC) -> stries des fils
noise = RNG.normal(size=up.shape).astype(np.float32)
noise = cv2.GaussianBlur(noise, (0, 0), 0.9) - cv2.GaussianBlur(noise, (0, 0), 3.0)
dx, dy = np.cos(theta).astype(np.float32), np.sin(theta).astype(np.float32)
H_, W_ = up.shape
gy_, gx_ = np.mgrid[0:H_, 0:W_].astype(np.float32)
acc = noise.copy()
for sgn in (1, -1):
    px, py = gx_.copy(), gy_.copy()
    for k in range(16):
        ix = np.clip(px.astype(np.int32), 0, W_ - 1)
        iy = np.clip(py.astype(np.int32), 0, H_ - 1)
        px += sgn * dx[iy, ix]
        py += sgn * dy[iy, ix]
        acc += cv2.remap(noise, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
acc /= acc[mask > 0.5].std() + 1e-6
thread = 0.5 + 0.5 * np.tanh(acc * 0.9)
emb_h = np.clip(height * (0.82 + 0.18 * thread), 0, 1) * (mask > 0.02)
# angle du fil dans l'espace UV (u = x image, v = vers le haut) -> tangente (cos, sin)
tu, tv = np.cos(theta), -np.sin(theta)
flip = tu < 0
tu, tv = np.where(flip, -tu, tu), np.where(flip, -tv, tv)
tang = np.dstack([np.full_like(tu, 0.5), 0.5 + 0.5 * tv, 0.5 + 0.5 * tu])  # BGR -> R=cos, G=sin
save8("emb_mask.png", mask)
save16("emb_height.png", emb_h)
save8("emb_thread.png", thread * (mask > 0.02))
cv2.imwrite(os.path.join(TEX, "emb_tangent.png"), (np.clip(tang, 0, 1) * 255).astype(np.uint8))
bx0, bz1 = G.photo_to_m(x0, y0)
bx1, bz0 = G.photo_to_m(x1, y1)
json.dump({"x0": bx0, "x1": bx1, "z0": bz0, "z1": bz1, "px_mm": px_mm},
          open(os.path.join(TEX, "embroidery_box.json"), "w"), indent=1)
print("broderie :", up.shape, "boîte (m)", (round(bx0, 4), round(bx1, 4), round(bz0, 4), round(bz1, 4)))

# ============================================================ logo + fleur (étiquette)
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
save_rgba(flower, "lycoris_icone")
crop_l = cv2.imread(os.path.join(SRC, "etiquette.png"))[130:760, 190:1700]
cv2.imwrite(os.path.join(TEX, "etiquette_crop.png"), crop_l)

# ============================================================ bouton signature (photo HD)
from skimage.graph import MCP_Geometric  # noqa: E402

bim = cv2.imread(os.path.join(SRC, "bouton_lycoris.png"))
bg = cv2.cvtColor(bim, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
BCX, BCY, BR = 765.0, 500.0, 460.0  # face du bouton dans la photo
S = 2048
sc = S / (2 * BR)                    # px sortie / px photo
oy, ox = np.mgrid[0:S, 0:S].astype(np.float32)
srcx = BCX + (ox - S / 2) / sc
srcy = BCY + (oy - S / 2) / sc
rho = np.hypot(ox - S / 2, oy - S / 2) / (S / 2)
gb = cv2.remap(bg, srcx, srcy, cv2.INTER_CUBIC)

# énergie de contours (sur la photo d'origine) pour suivre les étamines
s1 = cv2.GaussianBlur(bg, (0, 0), 1.0)
gm = np.hypot(cv2.Sobel(s1, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(s1, cv2.CV_32F, 0, 1, ksize=3))
E = cv2.GaussianBlur(gm, (0, 0), 1.6)
yy0, xx0 = np.mgrid[0:bg.shape[0], 0:bg.shape[1]].astype(np.float32)
rho0 = np.hypot(xx0 - BCX, yy0 - BCY) / BR
E /= np.percentile(E[rho0 < 0.84], 99)
head0 = ((xx0 - 782) / 150) ** 2 + ((yy0 - 452) / 112) ** 2 < 1
BALLS = [(772, 204), (698, 226), (640, 240), (578, 262), (534, 311), (586, 322), (573, 344), (491, 348),
         (504, 375), (431, 433), (491, 450), (491, 495), (853, 217), (905, 260), (957, 265), (1017, 311),
         (962, 340), (1012, 352), (1055, 370), (1058, 425), (1090, 425), (1110, 480)]
cost = 1.0 / (np.clip(E, 0, 1.5) + 0.06) ** 2
cost[head0] = 0.5
mcp = MCP_Geometric(cost)
mcp.find_costs(np.argwhere(head0 & ~ndi.binary_erosion(head0)))


def bezier_fit(P):
    """Courbe de Bézier cubique (extrémités fixées) ajustée aux moindres carrés."""
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    t = d / d[-1]
    b0, b1, b2, b3 = (1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3
    A = np.stack([b1, b2], 1)
    rhs = P - np.outer(b0, P[0]) - np.outer(b3, P[-1])
    C, *_ = np.linalg.lstsq(A, rhs, rcond=None)
    tt = np.linspace(0, 1, 200)[:, None]
    return ((1 - tt) ** 3 * P[0] + 3 * tt * (1 - tt) ** 2 * C[0] + 3 * tt * tt * (1 - tt) * C[1] + tt ** 3 * P[-1])


def to_out(p):
    return (p - np.array([BCX, BCY])) * sc + S / 2


lines = np.full((S, S), 255, np.uint8)      # tubes (distance aux axes)
tube_r = np.zeros((S, S), np.float32)
SSF = 4
for bx, by in BALLS:
    path = np.array(mcp.traceback((by, bx)))[:, ::-1].astype(np.float64)
    c = bezier_fit(path)
    d0 = c[0] - c[6]
    d0 /= np.linalg.norm(d0) + 1e-9
    c = np.vstack([[c[0] + d0 * 26], c])        # prolongé sous les pétales
    co = to_out(c)
    cv2.polylines(lines, [np.round(co * SSF).astype(np.int32).reshape(-1, 1, 2)], False, 0, 1,
                  cv2.LINE_8, shift=2)
dist_l = ndi.distance_transform_edt(lines > 0).astype(np.float32)
TR = 3.3 * sc  # rayon des étamines
h_st = np.sqrt(np.clip(1 - (dist_l / TR) ** 2, 0, 1)) * 0.80
h_ball = np.zeros((S, S), np.float32)
for bx, by in BALLS:
    cx_, cy_ = to_out(np.array([bx, by], float))
    d = np.hypot(ox - cx_, oy - cy_)
    h_ball = np.maximum(h_ball, np.sqrt(np.clip(1 - (d / (8.6 * sc)) ** 2, 0, 1)) * 1.0)
# tige
s0, s1_ = to_out(np.array([776.0, 515.0])), to_out(np.array([771.0, 893.0]))
tdir = (s1_ - s0) / np.linalg.norm(s1_ - s0)
rel = np.stack([ox - s0[0], oy - s0[1]], -1)
tpar = rel @ tdir
dperp = np.abs(rel @ np.array([-tdir[1], tdir[0]]))
h_stem = np.where((tpar > 0) & (tpar < np.linalg.norm(s1_ - s0)),
                  np.sqrt(np.clip(1 - (dperp / (4.4 * sc)) ** 2, 0, 1)) * 0.85, 0)
# coeur de fleur + ornements art nouveau : régions denses de la photo, relief d'après la photo
E_o = cv2.remap(E, srcx, srcy, cv2.INTER_LINEAR)
E5 = cv2.GaussianBlur(E_o, (0, 0), 4 * sc)
xs_, ys_ = srcx, srcy
head = ((xs_ - 782) / 172) ** 2 + ((ys_ - 452) / 132) ** 2 < 1
ang = np.degrees(np.arctan2(oy - S / 2, ox - S / 2))


def sector(a0, a1, r0, r1):
    return (ang >= a0) & (ang <= a1) & (rho >= r0) & (rho <= r1)


orn = (sector(-150, -108, 0.55, 0.87) | sector(-72, -30, 0.55, 0.87) | sector(25, 68, 0.5, 0.87)
       | sector(112, 155, 0.5, 0.87) | sector(62, 118, 0.70, 0.87))
reg = (E5 > 0.40) & (head | orn)
reg = ndi.binary_closing(reg, np.ones((5, 5)), iterations=3)
reg = ndi.binary_fill_holes(reg)
lab, n = ndi.label(reg)
sz = ndi.sum(reg, lab, range(1, n + 1))
keep = np.zeros(n + 1, bool); keep[1:] = sz >= 400 * sc * sc
reg = keep[lab]
sdr = cv2.GaussianBlur(signed_dist(reg).astype(np.float32), (0, 0), 3.0 * sc)
h_reg = np.sqrt(np.clip(sdr / (9.0 * sc), 0, 1))
hp = gb - cv2.GaussianBlur(gb, (0, 0), 6 * sc)
hp = cv2.bilateralFilter(hp.astype(np.float32), 0, 0.08, 2.0 * sc)
hp = cv2.GaussianBlur(hp, (0, 0), 2.1 * sc)
h_reg = h_reg * (0.66 + 0.55 * np.clip(hp, -0.35, 0.35)) * (sdr > 0)
h_rel = np.maximum.reduce([h_st, h_ball, h_stem, h_reg * 0.95])
h_rel = cv2.GaussianBlur(h_rel, (0, 0), 0.6 * sc)
listel = np.exp(-((rho - 0.862) / 0.0085) ** 2) * 0.72
field = 0.30 * (1 - np.clip(rho / 0.86, 0, 1) ** 2)
bh = np.where(rho < 0.875, field + h_rel * (rho < 0.857) + listel, 0).astype(np.float32)
bh /= 1.15
save16("button_height.png", bh)
# patine : creux légèrement plus sombres (cavité = relief local moins sa moyenne)
cav = bh - cv2.GaussianBlur(bh, (0, 0), 5)
cav = np.clip(0.5 + cav * 6, 0, 1)
save8("button_cavity.png", cav)
print("bouton : relief", S, "px")

# ============================================================ maille jersey (raccordable)
WALES, COURSES, WPX = 16, 18, 64
TW, TH = WALES * WPX, 1024
CPX = TH / COURSES
canvas_h = np.zeros((3 * TH, 3 * TW), np.float32)
canvas_c = np.zeros((3 * TH, 3 * TW), np.float32)
jit = RNG.normal(size=(COURSES, WALES, 6))


def draw_leg(cv_h, cv_c, p0, p1, r, amp, shade, twist_phase):
    xmin = int(max(min(p0[0], p1[0]) - r - 2, 0)); xmax = int(min(max(p0[0], p1[0]) + r + 3, cv_h.shape[1]))
    ymin = int(max(min(p0[1], p1[1]) - r - 2, 0)); ymax = int(min(max(p0[1], p1[1]) + r + 3, cv_h.shape[0]))
    if xmax <= xmin or ymax <= ymin:
        return
    yy, xx = np.mgrid[ymin:ymax, xmin:xmax].astype(np.float32)
    d = p1 - p0
    L = np.linalg.norm(d)
    u = d / L
    rx, ry = xx - p0[0], yy - p0[1]
    t = np.clip((rx * u[0] + ry * u[1]) / L, 0, 1)
    qx, qy = rx - t * L * u[0], ry - t * L * u[1]
    dist = np.hypot(qx, qy)
    across = (qx * -u[1] + qy * u[0]) / r
    prof = np.sqrt(np.clip(1 - (dist / r) ** 2, 0, 1))
    bulge = 0.62 + 0.38 * np.sin(np.pi * t)
    ply = 0.90 + 0.10 * np.cos(2 * np.pi * (t * L / (0.42 * WPX) + across * 0.55) + twist_phase)
    h = amp * prof * bulge * ply
    sl = (slice(ymin, ymax), slice(xmin, xmax))
    upd = h > cv_h[sl]
    cv_h[sl] = np.where(upd, h, cv_h[sl])
    cv_c[sl] = np.where(upd, shade, cv_c[sl])


for j in range(COURSES):
    for i in range(WALES):
        jt = jit[j, i]
        cx = (i + 0.5) * WPX + jt[0] * 0.035 * WPX
        cy = (j + 0.5) * CPX + jt[1] * 0.035 * CPX
        r = 0.26 * WPX * (1 + 0.06 * jt[2])
        amp = 1.0 + 0.07 * jt[3]
        shade = float(np.clip(1.0 + 0.10 * jt[4], 0.75, 1.25))
        for side in (-1, 1):
            tilt = np.deg2rad(2.5 * jt[5])
            top = np.array([cx + side * 0.27 * WPX, cy - 0.62 * CPX])
            bot = np.array([cx + side * 0.03 * WPX, cy + 0.52 * CPX])
            c, s_ = np.cos(tilt), np.sin(tilt)
            ctr = 0.5 * (top + bot)
            rot = lambda p: ctr + np.array([[c, -s_], [s_, c]]) @ (p - ctr)
            for oyy in (0, 1, 2):
                for oxx in (0, 1, 2):
                    off = np.array([oxx * TW, oyy * TH])
                    draw_leg(canvas_h, canvas_c, rot(top) + off, rot(bot) + off, r, amp, shade,
                             twist_phase=side * 1.3 + jt[2])
kh = canvas_h[TH:2 * TH, TW:2 * TW]
kc = canvas_c[TH:2 * TH, TW:2 * TW]
# duvet : fines fibres qui débordent des mailles
fib = np.zeros((TH, TW), np.float32)
for _ in range(500):
    x, y = RNG.uniform(0, TW), RNG.uniform(0, TH)
    a = RNG.uniform(0, np.pi)
    L = RNG.uniform(10, 46)
    p1 = (int(x), int(y)); p2 = (int(x + L * np.cos(a)), int(y + L * np.sin(a)))
    cv2.line(fib, p1, p2, float(RNG.uniform(0.3, 1.0)), 1, cv2.LINE_AA)
kh = cv2.GaussianBlur(kh, (0, 0), 0.8)
kh = np.clip(kh * 0.96 + 0.04 * fib, 0, 1)
save16("knit_height.png", kh / kh.max())
save8("knit_color.png", np.clip(0.5 + (kc - 1.0) * 2.0, 0, 1) * (kh > 0.05) + 0.5 * (kh <= 0.05))
print("maille :", WALES, "x", COURSES, "mailles par tuile")

# ============================================================ côtes 2x2 (4 côtes par tuile)
RIBS, RCOURSES = 4, 20
RP = 128                      # px par côte
RW, RH = RIBS * RP, 1024
RC = RH / RCOURSES
can_h = np.zeros((3 * RH, 3 * RW), np.float32)
can_c = np.zeros((3 * RH, 3 * RW), np.float32)
jr = RNG.normal(size=(RCOURSES, RIBS * 2, 6))
for j in range(RCOURSES):
    for k in range(RIBS):
        for w_ in (-1, 1):          # deux colonnes endroit sur la crête (centrée en x = k*RP)
            jt = jr[j, 2 * k + (w_ > 0)]
            cx = k * RP + w_ * 0.17 * RP + jt[0] * 0.02 * RP
            cy = (j + 0.5) * RC + jt[1] * 0.03 * RC
            r = 0.085 * RP * (1 + 0.05 * jt[2])
            for side in (-1, 1):
                top = np.array([cx + side * 0.11 * RP, cy - 0.62 * RC])
                bot = np.array([cx + side * 0.015 * RP, cy + 0.52 * RC])
                for oyy in (0, 1, 2):
                    for oxx in (0, 1, 2):
                        off = np.array([oxx * RW, oyy * RH])
                        draw_leg(can_h, can_c, top + off, bot + off, r, 1.0, 1.0 + 0.08 * jt[3], side + jt[4])
        # mailles envers au fond du creux (petites boucles horizontales)
        cxv = k * RP + RP / 2
        for oyy in (0, 1, 2):
            for oxx in (0, 1, 2):
                off = np.array([oxx * RW, oyy * RH])
                p0 = np.array([cxv - 0.10 * RP, (j + 0.5) * RC]) + off
                p1 = np.array([cxv + 0.10 * RP, (j + 0.5) * RC]) + off
                draw_leg(can_h, can_c, p0, p1, 0.30 * RC, 0.45, 0.9, 0.0)
rh = cv2.GaussianBlur(can_h[RH:2 * RH, RW:2 * RW], (0, 0), 0.8)
save16("rib_height.png", rh / rh.max())
print("côtes : tuile", RW, "x", RH)
print("textures prêtes dans", TEX)
