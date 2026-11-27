"""Forme volumique du cardigan Fadiye (taille M), calée sur la photo produit.

La photo de référence (assets/source/cardigan_photo.png) est une vue de face en présentation
« ghost mannequin ». Échelle relevée : 1132 px = 1 m (longueur 66 cm du point haut d'épaule à
l'ourlet), milieu devant à x = 539 px, bas de l'ourlet à y = 1097 px. Toutes les cotes
ci-dessous (ligne d'épaule, largeurs, axe et largeur des manches, bord-côtes) en sont tirées.

Le vêtement est décrit comme un champ de distance signée : un buste boxy (super-ellipse),
des épaules tombantes, des manches amples légèrement écartées qui blousent au-dessus des
poignets côtelés. Plis, fronces et coutures sont ajoutés comme de petites déformations.

Unités : mètres. Z vers le haut, l'avant du vêtement regarde vers -Y, +X = droite de l'image
(= côté gauche de la personne qui le porte, celui de la broderie). Bas de l'ourlet z = 0.
"""
import numpy as np

# ---------------------------------------------------------------- helpers

def smin(a, b, k):
    h = np.clip(k - np.abs(a - b), 0.0, None) / k
    return np.minimum(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


class FNoise:
    """Bruit lisse : somme de sinusoïdes de directions aléatoires (déterministe)."""

    def __init__(self, dims, n=10, fmin=1.0, fmax=3.0, seed=0):
        r = np.random.default_rng(seed)
        d = r.normal(size=(n, dims))
        d /= np.linalg.norm(d, axis=1, keepdims=True)
        self.k = d * r.uniform(fmin, fmax, (n, 1))
        self.ph = r.uniform(0, 2 * np.pi, n)
        self.norm = np.sqrt(2.0 / n)

    def __call__(self, *c):
        s = 0.0
        for i in range(len(self.ph)):
            arg = self.ph[i]
            for j, cj in enumerate(c):
                arg = arg + self.k[i, j] * cj
            s = s + np.sin(arg)
        return s * self.norm


N_TORSO = FNoise(3, 12, 5, 14, seed=3)
N_DRAPE = FNoise(3, 8, 3.0, 7.0, seed=21)
N_DRAPE_A = FNoise(3, 6, 2.0, 5.0, seed=22)
N_HEM = FNoise(3, 8, 1, 3, seed=5)
N_SLEEVE = FNoise(3, 10, 1.5, 4.0, seed=9)
N_SLEEVE2 = FNoise(3, 8, 2, 6, seed=11)
N_FINE = FNoise(3, 14, 14, 30, seed=31)
N_MED = FNoise(3, 18, 55, 140, seed=41)

# ---------------------------------------------------------------- dimensions (photo)
PX_PER_M = 1132.0
PHOTO_CX, PHOTO_HEM_Y = 539.0, 1097.0

HPS = 0.668  # point haut d'épaule (pied de col sur l'épaule)

# Ligne d'épaule = sommet de la silhouette de face, |x| -> z (moyenne gauche / droite)
SH_X = [0.000, 0.060, 0.090, 0.120, 0.150, 0.180, 0.210, 0.240, 0.270, 0.300, 0.330]
SH_Z = [0.660, 0.659, 0.657, 0.655, 0.648, 0.636, 0.622, 0.603, 0.582, 0.558, 0.528]

# Buste : demi-largeur W, profondeurs avant / arrière (présentation ghost mannequin)
Z_TAB = [0.000, 0.050, 0.077, 0.098, 0.140, 0.250, 0.350, 0.450, 0.520, 0.580, 0.640, 0.700]
W_TAB = [0.250, 0.261, 0.278, 0.282, 0.283, 0.284, 0.284, 0.285, 0.286, 0.287, 0.285, 0.280]
DF_TAB = [0.068, 0.075, 0.086, 0.090, 0.094, 0.097, 0.099, 0.101, 0.101, 0.097, 0.087, 0.075]
DB_TAB = [0.070, 0.077, 0.088, 0.092, 0.096, 0.099, 0.101, 0.103, 0.105, 0.102, 0.093, 0.082]
P_BOX = 3.0   # coupe boxy
R_SHOULDER = 0.048  # arrondi de l'épaule (de l'avant vers le dos)

# Encolure (ellipse du pied de col) ; le col descend devant
NECK_RX, NECK_RY, NECK_CY = 0.074, 0.064, 0.008
NECK_FRONT_Z = 0.602

# Bord-côtes
HEM_TOP = 0.077
HEM_W = (0.266, 0.275)   # bas, haut
HEM_D = (0.080, 0.085)
CUFF_LEN = 0.080
CUFF_R = (0.058, 0.052)  # haut, bas (le poignet se resserre)
COLLAR_H = 0.030

# Manche droite (+X) ; l'autre est le miroir. Axe (vue de face) + demi-largeur.
SLV_CTRL = np.array([
    [0.205, 0.004, 0.532],
    [0.291, -0.002, 0.440],
    [0.325, -0.006, 0.351],
    [0.347, -0.008, 0.262],
    [0.363, -0.009, 0.174],
    [0.384, -0.010, 0.121],
    [0.397, -0.010, 0.092],
    [0.401, -0.010, 0.068],
])
SLV_RAD = np.array([0.080, 0.083, 0.086, 0.091, 0.095, 0.083, 0.068, 0.050])
SLV_FLAT = 0.58
SLV_P = 3.0       # section en super-ellipse : faces avant / arrière plus plates (tissu)   # section un peu aplatie d'avant en arrière
CUFF_TOP = np.array([0.400, -0.010, 0.078])
CUFF_BOT = np.array([0.413, -0.010, 0.000])

# Boutonnage (hauteurs relevées sur la photo)
BTN_Z = [0.591, 0.297, 0.184, 0.062]
CLASP_Z = [0.508, 0.406]
BTN_R = 0.0125
PLACKET_HALF = 0.021

# Broderie (boîte englobante dans la photo -> mètres, vue de face)
EMB_BOX_PX = (576, 800, 419, 1006)


def photo_to_m(px, py):
    return (px - PHOTO_CX) / PX_PER_M, (PHOTO_HEM_Y - py) / PX_PER_M


# ---------------------------------------------------------------- spline de la manche

def _catmull(P, n_per=8):
    P = np.asarray(P, float)
    ext = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        for k in range(n_per):
            t = k / n_per
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1])
    return np.array(out)


_ey = np.array([0.0, 1.0, 0.0])
SLV_PTS = _catmull(SLV_CTRL, 8)
_ctrl_t = np.linspace(0, 1, len(SLV_CTRL))
_pts_t = np.linspace(0, 1, len(SLV_PTS))
SLV_PTS_R = np.interp(_pts_t, _ctrl_t, SLV_RAD)
SEGS = []
_acc = 0.0
for _i in range(len(SLV_PTS) - 1):
    a, b = SLV_PTS[_i], SLV_PTS[_i + 1]
    L = float(np.linalg.norm(b - a))
    u = (b - a) / L
    v1 = np.cross(u, _ey)
    v1 /= np.linalg.norm(v1)
    v2 = np.cross(u, v1)
    SEGS.append((a, b, u, v1, v2, L, _acc, SLV_PTS_R[_i], SLV_PTS_R[_i + 1]))
    _acc += L
SLV_LEN = _acc


# ---------------------------------------------------------------- buste

def _superellipse_d(X, Y, W, D, p):
    ax, ay = np.abs(X) / W, np.abs(Y) / D
    f = (ax ** p + ay ** p + 1e-12) ** (1.0 / p)
    gx = f ** (1 - p) * ax ** (p - 1) / W
    gy = f ** (1 - p) * ay ** (p - 1) / D
    return (f - 1.0) / np.sqrt(gx * gx + gy * gy + 1e-9)


def torso_dims(Z, Y=None):
    W = np.interp(Z, Z_TAB, W_TAB)
    DF = np.interp(Z, Z_TAB, DF_TAB)
    DB = np.interp(Z, Z_TAB, DB_TAB)
    if Y is None:
        return W, DF, DB
    return W, np.where(Y < 0, DF, DB)


def neck_scoop(X, Y):
    """Abaissement de l'encolure devant (le col descend jusqu'au premier bouton)."""
    # encolure en U : profondeur selon l'angle autour du cou, douce sur les côtés
    yy = Y - NECK_CY
    rho = np.sqrt((X / NECK_RX) ** 2 + (yy / NECK_RY) ** 2)
    sphi = yy / (np.hypot(X, yy) + 1e-9)
    front = np.clip(-sphi, 0, 1) ** 1.25
    back = np.clip(sphi, 0, 1) ** 2
    fall = 1 - smoothstep(1.45, 2.4, rho)
    return ((SH_Z[0] - NECK_FRONT_Z) * front + 0.010 * back) * fall


def shoulder_top(X, Y):
    return np.interp(np.abs(X), SH_X, SH_Z) - neck_scoop(X, Y)


def torso_sdf(X, Y, Z):
    W, D = torso_dims(Z, Y)
    d = _superellipse_d(X, Y, W, D, P_BOX)
    ax_ = np.abs(X)
    phi = np.arctan2(Y, X)
    cphi, sphi = np.cos(phi), np.sin(phi)

    # légères fronces juste au-dessus du bord-côte
    amp = 0.0016 * smoothstep(0.075, 0.09, Z) * (1 - smoothstep(0.10, 0.20, Z))
    wave = np.sin(46 * phi + 2.0 * N_HEM(cphi * 2, sphi * 2, Z * 7))
    d = d - amp * wave

    # tombé de la maille : ondulations verticales douces, plus présentes sur les côtés
    side = 0.35 + 0.65 * smoothstep(0.12, 0.27, ax_)
    damp = 0.0018 * side * smoothstep(0.62, 0.40, Z) * np.clip(0.7 + 0.6 * N_DRAPE_A(X * 2, Y * 2, Z * 1.5), 0.15, 1.3)
    dwave = np.sin(X * 52 + 2.2 * N_DRAPE(X * 1.2, Y * 1.2, Z * 1.6) + 1.7 * np.sign(Y))
    d = d - damp * dwave

    # plis de tension partant de l'aisselle (sous la manche)
    reg = np.exp(-(((ax_ - 0.24) / 0.05) ** 2 + ((Z - 0.40) / 0.09) ** 2))
    diag = np.sin((ax_ * 0.55 - Z * 0.83) / 0.034 * 2 * np.pi + 1.1 * np.sign(Y))
    d = d - 0.0012 * reg * diag

    # irrégularités fines de la maille (le tissu n'est jamais parfaitement tendu)
    d = d - 0.0007 * N_TORSO(X, Y, Z) - 0.00025 * N_FINE(X, Y, Z) - 0.0009 * N_MED(X, Y, Z)

    # dessus : épaules (arrondi avant -> dos) + encolure plus basse devant
    zt = shoulder_top(X, Y)
    yc = 0.5 * (np.interp(Z, Z_TAB, DB_TAB) - np.interp(Z, Z_TAB, DF_TAB))
    hd = 0.5 * (np.interp(Z, Z_TAB, DB_TAB) + np.interp(Z, Z_TAB, DF_TAB))
    qy = np.abs(Y - yc) - (hd - R_SHOULDER)
    qz = Z - (zt - R_SHOULDER)
    d_top = np.sqrt(np.maximum(qy, 0) ** 2 + np.maximum(qz, 0) ** 2) + np.minimum(np.maximum(qy, qz), 0) - R_SHOULDER
    d = smax(d, d_top, 0.012)
    # bas du buste, rentré dans le bord-côte
    d = smax(d, 0.060 - Z, 0.004)

    # encolure : trou profond (intérieur du vêtement, le mannequin est invisible)
    e = np.sqrt((X / NECK_RX) ** 2 + ((Y - NECK_CY) / NECK_RY) ** 2) - 1.0
    hole = smax(e * NECK_RY, 0.50 - Z, 0.01)
    d = smax(d, -hole, 0.006)
    return d


# ---------------------------------------------------------------- manches

def sleeve_local(X, Y, Z):
    """Coordonnées locales de la manche (miroir |X|) : rho, t (0 épaule -> 1 poignet), a1, a2, r."""
    Xa = np.abs(X)
    best = None
    for (a, b, u, v1, v2, L, acc, r0, r1) in SEGS:
        px, py, pz = Xa - a[0], Y - a[1], Z - a[2]
        t = (px * u[0] + py * u[1] + pz * u[2]) / L
        tc = np.clip(t, 0.0, 1.0)
        qx = px - u[0] * L * tc
        qy = py - u[1] * L * tc
        qz = pz - u[2] * L * tc
        along = qx * u[0] + qy * u[1] + qz * u[2]
        a1 = qx * v1[0] + qy * v1[1] + qz * v1[2]
        a2 = (qx * v2[0] + qy * v2[1] + qz * v2[2]) / SLV_FLAT
        xs_ = (np.abs(a1) ** SLV_P + np.abs(a2) ** SLV_P + 1e-15) ** (1.0 / SLV_P)
        rho = np.sqrt(xs_ * xs_ + along * along)
        r = r0 + (r1 - r0) * tc
        dd = rho - r
        tg = (acc + L * tc) / SLV_LEN
        if best is None:
            best = [dd, tg, a1, a2, r]
        else:
            m = dd < best[0]
            best = [np.where(m, dd, best[0]), np.where(m, tg, best[1]),
                    np.where(m, a1, best[2]), np.where(m, a2, best[3]), np.where(m, r, best[4])]
    return best


def sleeve_sdf(X, Y, Z):
    side = np.sign(X + 1e-9)
    d, tg, a1, a2, r = sleeve_local(X, Y, Z)
    th = np.arctan2(a2, a1)
    c, s = np.cos(th), np.sin(th)
    ph_side = 1.3 * (side < 0)

    # fronces : la manche ample est resserrée dans le poignet
    g = smoothstep(0.80, 0.985, tg)
    gather = np.sin(13 * th + 2.2 * N_SLEEVE(c, s, tg * 3 + ph_side) + ph_side)
    d = d - (0.0034 * g) * gather
    # plis souples de la maille qui tombe (longs plis en biais, un peu au coude)
    long_ = np.sin(3 * th + 5.0 * tg + 1.6 * N_SLEEVE2(c, s, tg * 2 + ph_side))
    d = d - 0.0042 * long_ * smoothstep(0.10, 0.35, tg) * (1 - smoothstep(0.80, 0.92, tg))
    # plis de tombé le long de la manche (le tissu pend depuis l'épaule)
    drape = np.sin(6 * th + 2.0 * N_SLEEVE(c * 0.7, s * 0.7, tg * 1.5 + 3 + ph_side))
    d = d - 0.0024 * drape * smoothstep(0.05, 0.3, tg) * (1 - smoothstep(0.8, 0.9, tg))
    d = d - 0.0011 * N_MED(X, Y, Z)
    ring = np.sin(2 * np.pi * tg * SLV_LEN / 0.11 + 1.1 * s + 2.4 * N_SLEEVE(c * 0.9, s * 0.9, tg * 2.2 + ph_side))
    d = d - 0.0016 * ring * smoothstep(0.35, 0.6, tg) * (1 - smoothstep(0.85, 0.95, tg))
    d = d - 0.0005 * N_FINE(X, Y, Z)

    # coupe nette au poignet (le bord-côte vient par-dessus)
    a, b = SLV_CTRL[-2], SLV_CTRL[-1]
    u = (b - a) / np.linalg.norm(b - a)
    cut = (np.abs(X) - b[0]) * u[0] + (Y - b[1]) * u[1] + (Z - b[2]) * u[2]
    d = smax(d, cut, 0.004)
    return d, tg


SEAM_K = 0.016


def garment_sdf(X, Y, Z, parts=False):
    dt = torso_sdf(X, Y, Z)
    ds, _ = sleeve_sdf(X, Y, Z)
    d = smin(dt, ds, SEAM_K)
    # couture d'emmanchure : léger creux là où la manche rejoint le buste
    seam = np.exp(-((dt - ds) / 0.0035) ** 2) * (np.abs(X) > 0.15)
    d = d + 0.0010 * seam
    if parts:
        return d, dt, ds
    return d


def cuff_frame(side):
    """Repère du poignet (C0 haut, C1 bas, U axe, V1, V2) d'une manche, côté +1 ou -1."""
    m = np.array([side, 1.0, 1.0])
    C0, C1 = CUFF_TOP * m, CUFF_BOT * m
    U = (C1 - C0) / np.linalg.norm(C1 - C0)
    V2 = np.array([0.0, 1.0, 0.0])
    V1 = np.cross(V2, U)
    V1 /= np.linalg.norm(V1)
    V2 = np.cross(U, V1)
    if V2[1] < 0:
        V2 = -V2
    return C0, C1, U, V1, V2


# ---------------------------------------------------------------- UV (maille)

def torso_uv(X, Y, Z, front=None, n=40):
    """u = abscisse curviligne depuis le milieu devant (devant) ou milieu dos (dos), v = z."""
    W, DF, DB = torso_dims(Z)
    if front is None:
        front = Y < 0
    D = np.where(front, DF, DB)
    p = P_BOX
    cx = np.sign(X) * np.abs(np.clip(X / W, -1, 1)) ** (p / 2)
    cy = np.sign(Y) * np.abs(np.clip(Y / D, -1, 1)) ** (p / 2)
    cy = np.where(front, np.minimum(cy, 0.02), np.maximum(cy, -0.02))
    phi = np.arctan2(cy, cx)
    start = np.where(front, -np.pi / 2, np.pi / 2)
    s = np.zeros_like(X)
    prev_x, prev_y = np.zeros_like(X), np.where(front, -D, D)
    for k in range(1, n + 1):
        f = start + (phi - start) * k / n
        c, sn = np.cos(f), np.sin(f)
        xk = W * np.sign(c) * np.abs(c) ** (2 / p)
        yk = D * np.sign(sn) * np.abs(sn) ** (2 / p)
        s = s + np.hypot(xk - prev_x, yk - prev_y)
        prev_x, prev_y = xk, yk
    u = np.where(front, np.sign(X) * s, -np.sign(X) * s + 2.0)  # dos décalé dans l'espace UV
    return u, Z


def sleeve_uv(X, Y, Z):
    """u = tour de manche (couture sous le bras), v = longueur depuis l'épaule."""
    d, tg, a1, a2, r = sleeve_local(X, Y, Z)
    side = np.sign(X + 1e-9)
    th = np.arctan2(a2, a1)  # 0 = côté extérieur, ±pi = dessous du bras (couture)
    u = th * 0.085 + np.where(side > 0, 4.0, 6.0)
    v = tg * SLV_LEN
    return u, v
