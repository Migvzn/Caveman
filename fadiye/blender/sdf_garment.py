"""Forme volumique du cardigan Fadiye (taille M) décrite comme un champ de distance signée.

Unités : mètres. Z vers le haut, l'avant du vêtement regarde vers -Y, +X = droite de l'image
(= côté gauche de la personne qui le porte, celui de la broderie).
Hauteur totale 66 cm (bas de l'ourlet z=0, haut du col au dos z≈0.66).
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
N_SLEEVE = FNoise(3, 10, 1.5, 4.0, seed=9)
N_SLEEVE2 = FNoise(3, 8, 2, 6, seed=11)

# ---------------------------------------------------------------- dimensions
# Profil du buste (demi-largeur W, demi-profondeur D) en fonction de la hauteur
Z_TAB = [0.000, 0.035, 0.060, 0.085, 0.120, 0.200, 0.320, 0.450, 0.560, 0.660]
W_TAB = [0.240, 0.243, 0.250, 0.263, 0.272, 0.276, 0.275, 0.272, 0.262, 0.245]
D_TAB = [0.100, 0.103, 0.108, 0.117, 0.121, 0.122, 0.122, 0.120, 0.116, 0.112]
P_BOX = 2.6  # super-ellipse : coupe "boxy"

# Encolure (ellipse) et col
NECK_RX, NECK_RY, NECK_CY = 0.088, 0.074, 0.008

# Manche (côté +X, l'autre est le miroir)
SLV_A = np.array([0.222, 0.000, 0.455])
SLV_B = np.array([0.362, -0.014, 0.080])
SLV_U = (SLV_B - SLV_A) / np.linalg.norm(SLV_B - SLV_A)
SLV_L = float(np.linalg.norm(SLV_B - SLV_A))
_ey = np.array([0.0, 1.0, 0.0])
SLV_V1 = np.cross(SLV_U, _ey); SLV_V1 /= np.linalg.norm(SLV_V1)
SLV_V2 = np.cross(SLV_U, SLV_V1)
SLV_T = [0.00, 0.12, 0.35, 0.60, 0.80, 0.90, 0.955, 1.00]
SLV_R = [0.098, 0.095, 0.089, 0.085, 0.081, 0.073, 0.058, 0.047]
SLV_FLAT = 0.88  # aplatissement avant/arrière de la manche
SLV_BOW = 0.018  # léger galbe vers l'avant (coude)

# Bord-côtes
HEM_TOP = 0.065
CUFF_LEN = 0.068


def torso_sdf(X, Y, Z):
    W = np.interp(Z, Z_TAB, W_TAB)
    D = np.interp(Z, Z_TAB, D_TAB)
    p = P_BOX
    ax, ay = np.abs(X) / W, np.abs(Y) / D
    f = (ax ** p + ay ** p + 1e-12) ** (1.0 / p)
    gx = f ** (1 - p) * ax ** (p - 1) / W
    gy = f ** (1 - p) * ay ** (p - 1) / D
    d = (f - 1.0) / np.sqrt(gx * gx + gy * gy + 1e-9)

    # plis de fronces au-dessus de l'ourlet + ondulation douce du tissu
    phi = np.arctan2(Y, X)
    amp = 0.0034 * (1 - smoothstep(0.07, 0.30, Z)) * smoothstep(0.035, 0.075, Z)
    wave = np.sin(17 * phi + 1.7 * N_HEM(np.cos(phi) * 2, np.sin(phi) * 2, Z * 7))
    d = d - amp * wave
    d = d - 0.0016 * N_TORSO(X, Y, Z)

    # épaules (pente) + haut arrondi
    ax_ = np.clip(np.abs(X) - 0.06, 0, None)
    ztop = (0.636 - 0.19 * ax_ - 0.9 * np.clip(ax_ - 0.14, 0, None) ** 1.5
            - 0.25 * np.clip(-Y - 0.02, 0, None) - 0.08 * np.clip(Y - 0.03, 0, None))
    d = smax(d, (Z - ztop) * 0.98, 0.06)
    d = smax(d, 0.035 - Z, 0.008)

    # encolure : trou profond (intérieur du vêtement)
    e = np.sqrt((X / NECK_RX) ** 2 + ((Y - NECK_CY) / NECK_RY) ** 2) - 1.0
    hole = smax(e * NECK_RY, 0.50 - Z, 0.01)
    d = smax(d, -hole, 0.006)
    return d


def sleeve_sdf(X, Y, Z):
    """Manche miroir (évalue |X|). Renvoie (distance, t le long de la manche)."""
    side = np.sign(X + 1e-9)
    Xa = np.abs(X)
    px, py, pz = Xa - SLV_A[0], Y - SLV_A[1], Z - SLV_A[2]
    t = (px * SLV_U[0] + py * SLV_U[1] + pz * SLV_U[2]) / SLV_L
    tc = np.clip(t, 0.0, 1.0)
    bow = SLV_BOW * np.sin(np.pi * tc)
    qx = px - SLV_U[0] * SLV_L * tc
    qy = py - SLV_U[1] * SLV_L * tc + bow
    qz = pz - SLV_U[2] * SLV_L * tc
    along = qx * SLV_U[0] + qy * SLV_U[1] + qz * SLV_U[2]
    a1 = qx * SLV_V1[0] + qy * SLV_V1[1] + qz * SLV_V1[2]
    a2 = (qx * SLV_V2[0] + qy * SLV_V2[1] + qz * SLV_V2[2]) / SLV_FLAT
    rho = np.sqrt(a1 * a1 + a2 * a2 + along * along)
    r = np.interp(tc, SLV_T, SLV_R)
    d = rho - r

    # plis : anneaux de "tassement" vers le poignet + plis longs
    th = np.arctan2(a2, a1)
    c, s = np.cos(th), np.sin(th)
    ph_side = 1.3 * (side < 0)
    ring_amp = (0.0008 + 0.0030 * smoothstep(0.50, 0.93, tc) * (1 - smoothstep(0.95, 1.0, tc)))
    ring_amp = ring_amp * np.clip(0.55 + 0.6 * N_SLEEVE2(c * 0.8, s * 0.8, tc * 4 + 7 + ph_side), 0, 1.2)
    ring = np.sin(2 * np.pi * tc * SLV_L / 0.05 + 0.9 * s + 3.0 * N_SLEEVE(c * 0.9, s * 0.9, tc * 2.2 + ph_side) + ph_side)
    long_ = np.sin(4 * th + 0.7 * tc * 6 + 1.5 * N_SLEEVE2(c, s, tc * 2 + ph_side))
    d = d - ring_amp * ring - 0.0014 * long_ * (1 - smoothstep(0.85, 1.0, tc))

    # coupe nette au poignet (le bord-côte vient par-dessus)
    cut = (Xa - SLV_B[0]) * SLV_U[0] + (Y - SLV_B[1]) * SLV_U[1] + (Z - SLV_B[2]) * SLV_U[2]
    d = smax(d, cut, 0.006)
    return d, t


def garment_sdf(X, Y, Z, parts=False):
    dt = torso_sdf(X, Y, Z)
    ds, _ = sleeve_sdf(X, Y, Z)
    d = smin(dt, ds, 0.016)
    if parts:
        return d, dt, ds
    return d


def sleeve_frame(side):
    """Repère (A, B, U, V1, V2) d'une manche, côté +1 ou -1."""
    m = np.array([side, 1.0, 1.0])
    U = SLV_U * m
    V1 = SLV_V1 * m
    V2 = np.cross(U, V1)
    if V2[1] < 0:
        V2 = -V2
    return SLV_A * m, SLV_B * m, U, V1, V2
