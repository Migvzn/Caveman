"""Forme volumique du cardigan Fadiye (taille M), PORTÉ par un mannequin fin (invisible).

Le vêtement est décrit comme un champ de distance signée : le tissu repose sur les épaules
et la poitrine d'un mannequin mince, retombe ensuite librement (plis de drapé), et se
resserre sur les hanches dans le bord-côte (effet blouson). Les bras sont légèrement
écartés (pose en A) avec le coude un peu fléchi : la manche suit le bras et l'excédent de
tissu s'empile vers le poignet.

Unités : mètres. Z vers le haut, l'avant du vêtement regarde vers -Y, +X = droite de l'image
(= côté gauche de la personne qui le porte, celui de la broderie).
Bas de l'ourlet z=0, point haut d'épaule ≈ 0.645, haut du col au dos ≈ 0.66.
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


N_TORSO = FNoise(3, 12, 4, 11, seed=3)
N_HEM = FNoise(3, 8, 1, 3, seed=5)
N_DRAPE = FNoise(3, 8, 0.8, 2.5, seed=21)
N_DRAPE_A = FNoise(3, 6, 1.0, 3.0, seed=22)
N_SLEEVE = FNoise(3, 10, 1.5, 4.0, seed=9)
N_SLEEVE2 = FNoise(3, 8, 2, 6, seed=11)

# ---------------------------------------------------------------- dimensions
# Buste porté : demi-largeur W, profondeur avant / arrière (le tissu tombe de la poitrine)
Z_TAB = [0.000, 0.035, 0.060, 0.085, 0.120, 0.200, 0.300, 0.400, 0.480, 0.560, 0.620, 0.680]
W_TAB = [0.180, 0.183, 0.190, 0.212, 0.226, 0.234, 0.240, 0.246, 0.250, 0.248, 0.232, 0.205]
DF_TAB = [0.108, 0.110, 0.114, 0.126, 0.131, 0.132, 0.132, 0.131, 0.123, 0.104, 0.084, 0.072]
DB_TAB = [0.108, 0.110, 0.114, 0.124, 0.128, 0.129, 0.130, 0.131, 0.129, 0.118, 0.098, 0.085]
P_BOX = 2.4  # coupe boxy mais adoucie par le corps

HPS = 0.645  # point haut d'épaule

# Encolure (ellipse) et col
NECK_RX, NECK_RY, NECK_CY = 0.085, 0.072, 0.010

# Bord-côtes
HEM_TOP = 0.065
HEM_W, HEM_D = 0.193, 0.117
CUFF_LEN = 0.068

# Manche (côté +X, l'autre est le miroir) : capuchon d'épaule -> coude -> poignet
SLV_P = np.array([
    [0.205, 0.000, 0.505],
    [0.262, 0.012, 0.290],
    [0.312, -0.036, 0.085],
])
SLV_T = [0.00, 0.10, 0.30, 0.50, 0.70, 0.85, 0.93, 0.975, 1.00]
SLV_R = [0.085, 0.081, 0.074, 0.069, 0.066, 0.063, 0.057, 0.048, 0.042]
SLV_FLAT = 0.90

_ey = np.array([0.0, 1.0, 0.0])


def _frame(u):
    v1 = np.cross(u, _ey)
    v1 /= np.linalg.norm(v1)
    v2 = np.cross(u, v1)
    return v1, v2


SEGS = []
_acc = 0.0
for _i in range(len(SLV_P) - 1):
    a, b = SLV_P[_i], SLV_P[_i + 1]
    L = float(np.linalg.norm(b - a))
    u = (b - a) / L
    v1, v2 = _frame(u)
    SEGS.append((a, b, u, v1, v2, L, _acc))
    _acc += L
SLV_LEN = _acc


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


def torso_sdf(X, Y, Z):
    W, D = torso_dims(Z, Y)
    d = _superellipse_d(X, Y, W, D, P_BOX)

    phi = np.arctan2(Y, X)
    cphi, sphi = np.cos(phi), np.sin(phi)

    # fronces au-dessus du bord-côte (le buste est resserré sur les hanches)
    amp = 0.0036 * (1 - smoothstep(0.075, 0.27, Z)) * smoothstep(0.035, 0.075, Z)
    wave = np.sin(19 * phi + 1.8 * N_HEM(cphi * 2, sphi * 2, Z * 7))
    d = d - amp * wave

    # drapé : le tissu en excès tombe de la poitrine en plis verticaux, plus marqués
    # sur les côtés (sous les bras) qu'au milieu du devant
    side = 0.45 + 0.55 * np.abs(cphi)
    damp = 0.0068 * smoothstep(0.47, 0.17, Z) * side * np.clip(0.75 + 0.5 * N_DRAPE_A(cphi, sphi, Z * 2), 0.2, 1.3)
    dwave = np.sin(7 * phi + 2.4 * N_DRAPE(cphi * 1.5, sphi * 1.5, Z * 3.0))
    d = d - damp * dwave

    # plis de tension en diagonale, de l'aisselle vers la poitrine (bras le long du corps)
    ax_ = np.abs(X)
    reg = np.exp(-(((ax_ - 0.175) / 0.06) ** 2 + ((Z - 0.405) / 0.075) ** 2))
    diag = np.sin((ax_ * 0.74 - Z * 0.67) / 0.028 * 2 * np.pi + 1.3 * np.sign(Y))
    d = d - 0.0034 * reg * diag

    d = d - 0.0014 * N_TORSO(X, Y, Z)

    # épaules naturelles (pente ~20°) puis tombée d'épaule sur le haut du bras
    ax0 = np.clip(ax_ - 0.065, 0, None)
    ztop = (HPS - 0.36 * ax0 - 1.1 * np.clip(ax0 - 0.13, 0, None) ** 1.6
            - 0.26 * np.clip(-Y - 0.03, 0, None) - 0.12 * np.clip(Y - 0.04, 0, None))
    d = smax(d, (Z - ztop) * 0.94, 0.05)
    d = smax(d, 0.035 - Z, 0.008)

    # encolure : trou profond (intérieur du vêtement, le mannequin est invisible)
    e = np.sqrt((X / NECK_RX) ** 2 + ((Y - NECK_CY) / NECK_RY) ** 2) - 1.0
    hole = smax(e * NECK_RY, 0.50 - Z, 0.01)
    d = smax(d, -hole, 0.006)
    return d


def sleeve_sdf(X, Y, Z):
    """Manche miroir (évalue |X|) le long du bras (épaule -> coude -> poignet)."""
    side = np.sign(X + 1e-9)
    Xa = np.abs(X)
    best = None
    for (a, b, u, v1, v2, L, acc) in SEGS:
        px, py, pz = Xa - a[0], Y - a[1], Z - a[2]
        t = (px * u[0] + py * u[1] + pz * u[2]) / L
        tc = np.clip(t, 0.0, 1.0)
        qx = px - u[0] * L * tc
        qy = py - u[1] * L * tc
        qz = pz - u[2] * L * tc
        along = qx * u[0] + qy * u[1] + qz * u[2]
        a1 = qx * v1[0] + qy * v1[1] + qz * v1[2]
        a2 = (qx * v2[0] + qy * v2[1] + qz * v2[2]) / SLV_FLAT
        rho = np.sqrt(a1 * a1 + a2 * a2 + along * along)
        tg = (acc + L * tc) / SLV_LEN
        if best is None:
            best = [rho, tg, a1, a2]
        else:
            m = rho < best[0]
            best = [np.where(m, rho, best[0]), np.where(m, tg, best[1]),
                    np.where(m, a1, best[2]), np.where(m, a2, best[3])]
    rho, tg, a1, a2 = best
    r = np.interp(tg, SLV_T, SLV_R)
    d = rho - r

    th = np.arctan2(a2, a1)
    c, s = np.cos(th), np.sin(th)
    ph_side = 1.3 * (side < 0)
    # tissu qui s'empile sur l'avant-bras + plis souples au pli du coude
    ring_amp = 0.0008 + 0.0042 * smoothstep(0.52, 0.92, tg) * (1 - smoothstep(0.955, 1.0, tg))
    ring_amp = ring_amp + 0.0022 * np.exp(-((tg - 0.5) / 0.07) ** 2)
    ring_amp = ring_amp * np.clip(0.55 + 0.6 * N_SLEEVE2(c * 0.8, s * 0.8, tg * 4 + 7 + ph_side), 0, 1.2)
    ring = np.sin(2 * np.pi * tg * SLV_LEN / 0.038 + 1.1 * s + 3.0 * N_SLEEVE(c * 0.9, s * 0.9, tg * 2.2 + ph_side) + ph_side)
    long_ = np.sin(4 * th + 4.0 * tg + 1.5 * N_SLEEVE2(c, s, tg * 2 + ph_side))
    d = d - ring_amp * ring - 0.0016 * long_ * (1 - smoothstep(0.45, 0.7, tg))

    # coupe nette au poignet (le bord-côte vient par-dessus)
    a, b, u = SEGS[-1][0], SEGS[-1][1], SEGS[-1][2]
    cut = (Xa - b[0]) * u[0] + (Y - b[1]) * u[1] + (Z - b[2]) * u[2]
    d = smax(d, cut, 0.006)
    return d, tg


def garment_sdf(X, Y, Z, parts=False):
    dt = torso_sdf(X, Y, Z)
    ds, _ = sleeve_sdf(X, Y, Z)
    d = smin(dt, ds, 0.018)
    if parts:
        return d, dt, ds
    return d


def sleeve_frame(side):
    """Repère du poignet (A, B, U, V1, V2) d'une manche, côté +1 ou -1 : B = fin de manche."""
    m = np.array([side, 1.0, 1.0])
    a, b, u, v1, v2, L, acc = SEGS[-1]
    U = u * m
    V1 = v1 * m
    V2 = np.cross(U, V1)
    if V2[1] < 0:
        V2 = -V2
    return a * m, b * m, U, V1, V2


def front_arclength(X, Z, n=48):
    """Distance mesurée SUR le tissu depuis le milieu devant (pour poser la broderie
    comme sur le vêtement réel, sans l'étirer quand le devant s'arrondit vers le côté)."""
    W, DF, _ = torso_dims(Z)
    ax = np.clip(np.abs(X), 0, W * 0.999)
    s = np.zeros_like(ax)
    prev_x = np.zeros_like(ax)
    prev_y = -DF
    for k in range(1, n + 1):
        xk = ax * k / n
        yk = -DF * np.clip(1 - (xk / W) ** P_BOX, 0, 1) ** (1 / P_BOX)
        s = s + np.hypot(xk - prev_x, yk - prev_y)
        prev_x, prev_y = xk, yk
    return np.sign(X) * s
