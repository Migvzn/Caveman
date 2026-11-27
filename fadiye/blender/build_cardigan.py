"""Construit la scène Blender du cardigan Fadiye et l'enregistre dans cardigan_fadiye.blend.

Lancer (après prepare_textures.py) :  python build_cardigan.py      (avec le module bpy)

Réalisme :
  - coupe calée sur la photo produit (voir sdf_garment.py) ;
  - maille jersey en vraie texture de points (UV par pièce : devants, dos, manches, avec
    les coutures aux bons endroits) + coutures en léger creux ;
  - bord-côtes 2x2 en vraie géométrie, bords repliés arrondis ;
  - broderie point satin en vraie géométrie (bourrelet), fils et reflet anisotrope ;
  - boutons en relief sculpté d'après la photo HD (étamines, boules, pétales, listel) ;
  - duvet de fibres (courbes) qui adoucit les contours comme une vraie maille.
"""
import json
import math
import os
import sys

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from skimage.measure import marching_cubes

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sdf_garment as G  # noqa: E402

TEX = os.path.join(HERE, "textures")
OUT_BLEND = os.path.join(HERE, "cardigan_fadiye.blend")
RNG = np.random.default_rng(11)

KNIT_TILE = 0.0512        # tuile jersey : 16 mailles x 18 rangs = 51,2 mm
RIB_PITCH = 0.0063        # une côte (2 endroit + 2 envers) = 6,3 mm (mesuré sur la photo)
RIB_TILE_V = 0.0568       # 20 rangs de côtes
PLACKET_PITCH = 0.0062


# =====================================================================  utils

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mesh_from_numpy(name, V, F, coll=None, uv=None, merge=False):
    me = bpy.data.meshes.new(name)
    V = np.asarray(V, np.float32)
    F = np.asarray(F, np.int32)
    nverts = F.shape[1]
    me.vertices.add(len(V))
    me.vertices.foreach_set("co", V.ravel())
    me.loops.add(F.size)
    me.loops.foreach_set("vertex_index", F.ravel())
    me.polygons.add(len(F))
    me.polygons.foreach_set("loop_start", np.arange(0, F.size, nverts, dtype=np.int32))
    me.update(calc_edges=True)
    me.validate()
    if uv is not None:
        lay = me.uv_layers.new(name="UVMap")
        vi = np.empty(len(me.loops), np.int32)
        me.loops.foreach_get("vertex_index", vi)
        lay.data.foreach_set("uv", np.asarray(uv, np.float32)[vi].ravel())
    if merge:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
    ob = bpy.data.objects.new(name, me)
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def grid_faces(nu, nv, wrap_u=False, wrap_v=False):
    """Faces quad pour une grille nu x nv (indice = v*nu + u)."""
    u = np.arange(nu if wrap_u else nu - 1)
    v = np.arange(nv if wrap_v else nv - 1)
    U, Vv = np.meshgrid(u, v)
    U2 = (U + 1) % nu
    V2 = (Vv + 1) % nv
    return np.stack([Vv * nu + U, Vv * nu + U2, V2 * nu + U2, V2 * nu + U], -1).reshape(-1, 4)


def apply_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)


def add_mod(ob, kind, **kw):
    m = ob.modifiers.new(kind.lower(), kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m


def subsurf(ob, render=1):
    m = add_mod(ob, "SUBSURF", levels=0, render_levels=render)
    try:
        m.uv_smooth = "PRESERVE_BOUNDARIES"
    except Exception:
        pass
    return m


def mesh_arrays(me):
    co = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


# =====================================================================  corps (SDF)

def build_body(coll):
    VOX = 0.0030
    xs = np.arange(-0.50, 0.50 + VOX, VOX, dtype=np.float32)
    ys = np.arange(-0.16, 0.16 + VOX, VOX, dtype=np.float32)
    zs = np.arange(0.03, 0.71 + VOX, VOX, dtype=np.float32)
    vol = np.empty((len(xs), len(ys), len(zs)), np.float32)
    Y, Z = np.meshgrid(ys, zs, indexing="ij")
    for i, x in enumerate(xs):
        vol[i] = G.garment_sdf(np.full_like(Y, x), Y, Z)
    v, f, _, _ = marching_cubes(vol, 0.0, spacing=(VOX, VOX, VOX), gradient_direction="ascent")
    v += np.array([xs[0], ys[0], zs[0]])
    ob = mesh_from_numpy("Cardigan_Corps", v, f, coll)
    add_mod(ob, "REMESH", mode="VOXEL", voxel_size=0.0030, adaptivity=0.0, use_smooth_shade=True)
    add_mod(ob, "SMOOTH", factor=0.5, iterations=2)
    apply_modifiers(ob)
    me = ob.data
    co = mesh_arrays(me)

    # ---- UV par pièce (devant / dos / manches) : les coutures tombent aux bons endroits
    nl = len(me.loops)
    vi = np.empty(nl, np.int32)
    me.loops.foreach_get("vertex_index", vi)
    ls = np.empty(len(me.polygons), np.int32)
    lt = np.empty(len(me.polygons), np.int32)
    me.polygons.foreach_get("loop_start", ls)
    me.polygons.foreach_get("loop_total", lt)
    face_of_loop = np.repeat(np.arange(len(ls)), lt)
    cent = np.zeros((len(ls), 3))
    np.add.at(cent, face_of_loop, co[vi])
    cent /= lt[:, None]
    _, dtf, dsf = G.garment_sdf(cent[:, 0], cent[:, 1], cent[:, 2], parts=True)
    is_slv = (dsf < dtf)[face_of_loop]
    front = (cent[:, 1] < 0)[face_of_loop]
    P = co[vi].astype(np.float64)
    uv = np.zeros((nl, 2))
    t = ~is_slv
    u_, v_ = G.torso_uv(P[t, 0], P[t, 1], P[t, 2], front=front[t])
    uv[t, 0], uv[t, 1] = u_, v_
    u_, v_ = G.sleeve_uv(P[is_slv, 0], P[is_slv, 1], P[is_slv, 2])
    uv[is_slv, 0], uv[is_slv, 1] = u_, v_
    lay = me.uv_layers.new(name="UVMap")
    lay.data.foreach_set("uv", uv.astype(np.float32).ravel())

    # ---- coutures (emmanchures, côtés, épaules) : attribut pour un léger creux dans la matière
    _, dt, ds = G.garment_sdf(co[:, 0], co[:, 1], co[:, 2], parts=True)
    ax = np.abs(co[:, 0])
    armhole = np.exp(-((dt - ds) / 0.0022) ** 2) * (ax > 0.15)
    W, DF, DB = G.torso_dims(co[:, 2])
    side = np.exp(-(co[:, 1] / 0.0018) ** 2) * (ax > 0.2) * (co[:, 2] < 0.46) * (dt < ds + 0.002)
    zt = G.shoulder_top(co[:, 0], co[:, 1])
    yc = 0.5 * (DB - DF)
    shoulder = (np.exp(-((co[:, 1] - yc - 0.01) / 0.0018) ** 2) * (co[:, 2] > zt - 0.05)
                * (ax > 0.10) * (ax < 0.29) * (dt < ds))
    seam = np.clip(np.maximum.reduce([armhole, side, shoulder]), 0, 1).astype(np.float32)
    at = me.attributes.new("couture", "FLOAT", "POINT")
    at.data.foreach_set("value", seam)
    me.shade_smooth()
    subsurf(ob, 1)
    print("corps :", len(me.vertices), "sommets")
    return ob


# =====================================================================  bord-côtes (bandes repliées)

def band_mesh(name, coll, base, nrm, up, thick, rib_amp, rib_period, uv_u, uv_v, fold="bottom", ribs_on="u"):
    """Bande tricotée repliée.

    base[nv, nu, 3]  : surface extérieure (rangées du haut vers le bas si fold='bottom')
    nrm[nv, nu, 3]   : normale vers l'extérieur ; up : sens de la bande (vers le pli)
    Le profil fait : face extérieure -> pli arrondi -> face intérieure (épaisseur thick).
    Côtes : décalage selon la normale, périodique en u (ribs_on='u') ou en v.
    """
    nv, nu, _ = base.shape
    s_coord = uv_u if ribs_on == "u" else uv_v
    rib = rib_amp * (0.5 + 0.5 * np.cos(2 * np.pi * s_coord / rib_period)) ** 0.6
    rows, uvs = [], []
    for j in range(nv):
        rows.append(base[j] + nrm[j] * rib[j][:, None])
        uvs.append(np.stack([uv_u[j], uv_v[j]], -1))
    # pli arrondi
    last = base[-1]
    nf = 9
    dv = uv_v[-1] - uv_v[-2]
    for k in range(1, nf):
        a = np.pi * k / nf
        off = -thick * 0.5 * (1 - np.cos(a))
        ext = thick * 0.5 * np.sin(a)
        rows.append(last + nrm[-1] * (off + rib[-1][:, None] * np.cos(a)) + up[-1] * ext)
        uvs.append(np.stack([uv_u[-1], uv_v[-1] + dv * k * 0.5], -1))
    for j in range(nv - 1, -1, -1):
        rows.append(base[j] - nrm[j] * (thick - rib[j][:, None] * 0.6))
        uvs.append(np.stack([uv_u[j], 2 * uv_v[-1] - uv_v[j] + dv * nf * 0.5], -1))
    V = np.concatenate(rows, 0)
    UV = np.concatenate(uvs, 0)
    # la dernière colonne double la première (même position, u décalé) : fusionnée ensuite
    F = grid_faces(nu, len(rows), wrap_u=False, wrap_v=True)
    ob = mesh_from_numpy(name, V, F, coll, uv=UV, merge=True)
    ob.data.shade_smooth()
    subsurf(ob, 1)
    return ob


def superellipse_ring(W, D, p, n):
    th = np.linspace(0, 2 * np.pi, 4000, endpoint=False)
    c, s = np.cos(th), np.sin(th)
    x = W * np.sign(c) * np.abs(c) ** (2 / p)
    y = D * np.sign(s) * np.abs(s) ** (2 / p)
    seg = np.hypot(np.diff(np.r_[x, x[0]]), np.diff(np.r_[y, y[0]]))
    L = np.r_[0, np.cumsum(seg)]
    per = L[-1]
    tgt = np.linspace(0, per, n, endpoint=False)
    return np.interp(tgt, L[:-1], x), np.interp(tgt, L[:-1], y), per


def build_hem(coll):
    nu, nv = 1401, 26
    p = G.P_BOX
    base = np.zeros((nv, nu, 3)); nrm = np.zeros((nv, nu, 3)); up = np.zeros((nv, nu, 3))
    uu = np.zeros((nv, nu)); vv = np.zeros((nv, nu))
    for j in range(nv):
        h = 1 - j / (nv - 1)                  # rangée 0 = haut, dernière = bas (pli)
        z = h * G.HEM_TOP
        Wb = G.HEM_W[0] + (G.HEM_W[1] - G.HEM_W[0]) * h
        Db = G.HEM_D[0] + (G.HEM_D[1] - G.HEM_D[0]) * h
        x, y, per = superellipse_ring(Wb, Db, p, nu - 1)
        x, y = np.r_[x, x[0]], np.r_[y, y[0]]
        nx, ny = x / Wb ** 2, y / Db ** 2
        nn = np.hypot(nx, ny)
        base[j] = np.stack([x, y, np.full(nu, z)], -1)
        nrm[j] = np.stack([nx / nn, ny / nn, np.zeros(nu)], -1)
        up[j] = (0, 0, -1)
        s = np.arange(nu) * per / (nu - 1)
        nrib = 4 * int(round(per / RIB_PITCH / 4))
        lam = per / nrib
        uu[j] = s / lam / 4.0
        vv[j] = (G.HEM_TOP - z) / RIB_TILE_V
    ob = band_mesh("Bord_Cotes_Ourlet", coll, base, nrm, up, 0.0068, 0.0012, 0.25, uu, vv)
    return ob


def build_cuff(coll, side):
    C0, C1, U, V1, V2 = G.cuff_frame(side)
    nu, nv = 421, 24
    L = np.linalg.norm(C1 - C0)
    start = -0.016  # recouvre le bout de manche
    th = np.linspace(0, 2 * np.pi, nu)
    base = np.zeros((nv, nu, 3)); nrm = np.zeros((nv, nu, 3)); up = np.zeros((nv, nu, 3))
    uu = np.zeros((nv, nu)); vv = np.zeros((nv, nu))
    for j in range(nv):
        t = j / (nv - 1)
        dist = start + t * (L - start)
        tt = np.clip(dist / L, 0, 1)
        r = G.CUFF_R[0] + (G.CUFF_R[1] - G.CUFF_R[0]) * tt
        rx, ry = r, r * 0.90
        Cc = C0 + U * dist
        base[j] = Cc + np.outer(rx * np.cos(th), V1) + np.outer(ry * np.sin(th), V2)
        n_ = np.outer(np.cos(th) / rx, V1) + np.outer(np.sin(th) / ry, V2)
        nrm[j] = n_ / np.linalg.norm(n_, axis=1, keepdims=True)
        up[j] = U
        per = np.pi * (3 * (rx + ry) - np.sqrt((3 * rx + ry) * (rx + 3 * ry)))
        nrib = 4 * int(round(per / RIB_PITCH / 4))
        uu[j] = th / (2 * np.pi) * nrib / 4.0
        vv[j] = dist / RIB_TILE_V
    name = "Poignet_" + ("D" if side > 0 else "G")
    return band_mesh(name, coll, base, nrm, up, 0.0070, 0.0013, 0.25, uu, vv)


def surface_z(x, y, zhi=0.75, zlo=0.40, it=30):
    """Hauteur de la surface du vêtement au-dessus de (x, y) (dichotomie)."""
    x, y = np.asarray(x, float), np.asarray(y, float)
    lo = np.full_like(x, zlo)
    hi = np.full_like(x, zhi)
    for _ in range(it):
        mid = 0.5 * (lo + hi)
        inside = G.garment_sdf(x, y, mid) < 0
        lo = np.where(inside, mid, lo)
        hi = np.where(inside, hi, mid)
    return 0.5 * (lo + hi)


def surface_front_y(x, z, it=30):
    """Position Y de la face avant du vêtement en (x, z)."""
    x, z = np.asarray(x, float), np.asarray(z, float)
    lo = np.full_like(x, -0.25)
    hi = np.full_like(x, -0.062)
    for _ in range(it):
        mid = 0.5 * (lo + hi)
        inside = G.garment_sdf(x, mid, z) < 0
        hi = np.where(inside, mid, hi)
        lo = np.where(inside, lo, mid)
    return 0.5 * (lo + hi)


def build_collar(coll):
    """Col rond côtelé : bande couchée sur la poitrine devant, plus droite au dos, bord replié."""
    nu, nv = 901, 20
    th = np.linspace(0, 2 * np.pi, nu)
    c, s = np.cos(th), np.sin(th)
    RXo, RYo = 0.092, 0.080          # couture (pied de col) sur le corps
    RXi, RYi = 0.064, 0.054          # bord de l'ouverture
    xo, yo = RXo * c, G.NECK_CY + RYo * s
    zo = surface_z(xo, yo) - 0.0025
    zc = zo[:-1]
    k = np.ones(31) / 31
    zc = np.convolve(np.r_[zc[-15:], zc, zc[:15]], k, mode="valid")
    zo = np.r_[zc, zc[0]]
    front, back = np.clip(-s, 0, 1), np.clip(s, 0, 1)
    rise = 0.019 + 0.014 * front ** 1.5 + 0.013 * back ** 1.5
    xi, yi, zi = RXi * c, G.NECK_CY + RYi * s, zo + rise
    Po = np.stack([xo, yo, zo], -1)
    Pi = np.stack([xi, yi, zi], -1)
    A = Pi - Po
    T = np.gradient(Po, axis=0)
    n = np.cross(T, A)
    n *= np.sign(n[:, 2:3] + 1e-9)
    n /= np.linalg.norm(n, axis=1, keepdims=True)
    per_o = np.pi * (3 * (RXo + RYo) - np.sqrt((3 * RXo + RYo) * (RXo + 3 * RYo)))
    nrib = 4 * int(round(per_o / RIB_PITCH / 4 * 0.85))
    base = np.zeros((nv, nu, 3)); nrm = np.zeros((nv, nu, 3)); up = np.zeros((nv, nu, 3))
    uu = np.zeros((nv, nu)); vv = np.zeros((nv, nu))
    Alen = np.linalg.norm(A, axis=1)
    for j in range(nv):
        h = j / (nv - 1)
        bulge = 0.0030 * np.sin(np.pi * h) + 0.0012 * h
        base[j] = Po + A * h + n * bulge
        nrm[j] = n
        up[j] = A / Alen[:, None]
        uu[j] = th / (2 * np.pi) * nrib / 4.0
        vv[j] = Alen * h / RIB_TILE_V
    ob = band_mesh("Col_Cotes", coll, base, nrm, up, 0.0080, 0.0012, 0.25, uu, vv)
    return ob, zo


PLACKET = {}


def build_placket(coll, z_top):
    """Patte de boutonnage côtelée (côtes horizontales), bords arrondis, posée sur les devants."""
    from scipy.ndimage import gaussian_filter1d
    nx, nz = 15, 900
    half = G.PLACKET_HALF
    xs = np.linspace(-half, half, nx)
    zs = np.linspace(-0.003, z_top, nz)
    XX, ZZ = np.meshgrid(xs, zs)
    yy = surface_front_y(XX.ravel(), np.maximum(ZZ.ravel(), G.HEM_TOP + 0.006)).reshape(XX.shape)
    hem_y = -(G.HEM_D[0] + (G.HEM_D[1] - G.HEM_D[0]) * np.clip(ZZ / G.HEM_TOP, 0, 1) + 0.0018)
    blend = np.clip((ZZ - (G.HEM_TOP - 0.004)) / 0.014, 0, 1)
    yy = np.where(ZZ < G.HEM_TOP + 0.010, yy * blend + hem_y * (1 - blend), yy)
    yy = gaussian_filter1d(yy, 8, axis=0, mode="nearest")
    yy = gaussian_filter1d(yy, 2, axis=1, mode="nearest")
    yy = yy.min(axis=1, keepdims=True) * 0.75 + yy * 0.25
    yy = yy - 0.0028                       # face avant, légèrement au-dessus des devants
    PLACKET["z"] = zs
    PLACKET["y"] = yy[:, nx // 2] - 0.0012
    # profil fermé : face avant (gauche -> droite), bord droit arrondi, face arrière, bord gauche
    thick = 0.0055
    r = thick / 2
    nr = 10
    px = list(np.linspace(-half, half, 21))
    py = [0.0] * 21
    for k in range(1, nr):
        a = np.pi * k / nr
        px.append(half + r * np.sin(a)); py.append(r * (1 - np.cos(a)))
    px += list(np.linspace(half, -half, 21)); py += [thick] * 21
    for k in range(1, nr + 1):
        a = np.pi * k / nr
        px.append(-half - r * np.sin(a)); py.append(thick - r * (1 - np.cos(a)))
    PX, PY = np.array(px), np.array(py)    # le dernier point double le premier (couture UV)
    front = np.array([1.0] * 21 + [0.0] * (len(px) - 21))
    arc = np.r_[0, np.cumsum(np.hypot(np.diff(PX), np.diff(PY)))]
    npf = len(PX)
    V, UV = [], []
    for j in range(nz):
        ys_row = np.interp(np.clip(PX, -half, half), xs, yy[j])
        ribs = 0.00075 * (0.5 + 0.5 * np.cos(2 * np.pi * zs[j] / PLACKET_PITCH)) ** 0.6
        yv = ys_row + PY - ribs * front
        V.append(np.stack([PX, yv, np.full(npf, zs[j])], -1))
        UV.append(np.stack([np.full(npf, zs[j] / PLACKET_PITCH / 4.0), arc / RIB_TILE_V], -1))
    V = np.concatenate(V, 0)
    UV = np.concatenate(UV, 0)
    F = grid_faces(npf, nz, wrap_u=False)
    ob = mesh_from_numpy("Patte_Boutonnage", V, F, coll, uv=UV, merge=True)
    ob.data.shade_smooth()
    subsurf(ob, 1)
    return ob


def placket_point(z):
    zs, yc = PLACKET["z"], PLACKET["y"]
    y = float(np.interp(z, zs, yc))
    dydz = float(np.interp(z, zs, np.gradient(yc, zs)))
    n = np.array([0.0, -1.0, dydz])
    n /= np.linalg.norm(n)
    return y - 0.0002, tuple(n)


# =====================================================================  broderie (géométrie)

def build_embroidery(coll, body):
    import cv2
    box = json.load(open(os.path.join(TEX, "embroidery_box.json")))
    mask = cv2.imread(os.path.join(TEX, "emb_mask.png"), 0).astype(np.float32) / 255
    hgt = cv2.imread(os.path.join(TEX, "emb_height.png"), -1).astype(np.float32) / 65535
    H_, W_ = mask.shape
    STEP = 0.00035
    x0, x1, z0, z1 = box["x0"], box["x1"], box["z0"], box["z1"]
    nx = int((x1 - x0) / STEP) + 1
    nz = int((z1 - z0) / STEP) + 1
    gx = np.linspace(x0, x1, nx)
    gz = np.linspace(z0, z1, nz)
    GX, GZ = np.meshgrid(gx, gz)           # (nz, nx)
    u = (GX - x0) / (x1 - x0)
    v = (GZ - z0) / (z1 - z0)
    px = (u * (W_ - 1)).astype(np.float32)
    py = ((1 - v) * (H_ - 1)).astype(np.float32)
    dil = cv2.dilate(mask, np.ones((9, 9), np.uint8))
    m_s = cv2.remap(dil, px, py, cv2.INTER_LINEAR)
    h_s = cv2.remap(cv2.GaussianBlur(hgt, (0, 0), 1.5), px, py, cv2.INTER_LINEAR)
    keep = m_s > 0.02
    # projection sur le tissu (lancer de rayon depuis l'avant, sur la surface subdivisée)
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    bm = bmesh.new()
    bm.from_mesh(ev.to_mesh())
    ev.to_mesh_clear()
    bm.transform(body.matrix_world)
    bvh = BVHTree.FromBMesh(bm)
    idx = -np.ones(keep.shape, np.int64)
    pts = np.argwhere(keep)
    V = np.zeros((len(pts), 3), np.float32)
    UVs = np.zeros((len(pts), 2), np.float32)
    ok = np.zeros(len(pts), bool)
    d_up = Vector((0, 1, 0))
    for k, (j, i) in enumerate(pts):
        loc, nrm, _, _ = bvh.ray_cast(Vector((gx[i], -0.5, gz[j])), d_up)
        if loc is None:
            continue
        off = 0.00012 + 0.00105 * float(h_s[j, i])
        V[k] = (loc.x + nrm.x * off, loc.y + nrm.y * off, loc.z + nrm.z * off)
        UVs[k] = (u[j, i], v[j, i])
        ok[k] = True
    bm.free()
    idx[pts[ok, 0], pts[ok, 1]] = np.arange(ok.sum())
    V, UVs = V[ok], UVs[ok]
    a, b, c, d = idx[:-1, :-1], idx[:-1, 1:], idx[1:, 1:], idx[1:, :-1]
    good = (a >= 0) & (b >= 0) & (c >= 0) & (d >= 0)
    F = np.stack([a[good], d[good], c[good], b[good]], -1)
    ob = mesh_from_numpy("Broderie_Fadiye", V, F, coll, uv=UVs)
    ob.data.shade_smooth()
    print("broderie :", len(V), "sommets")
    return ob


# =====================================================================  métal

def build_button_mesh(name, mat):
    """Bouton signature Ø 25 mm : listel, relief Lycoris sculpté (géométrie), bord bombé."""
    import cv2
    R = G.BTN_R
    hm = cv2.imread(os.path.join(TEX, "button_height.png"), -1).astype(np.float32) / 65535
    hm = cv2.GaussianBlur(hm, (0, 0), 0.7)
    S = hm.shape[0]
    nr, ns = 380, 1400
    rr = np.linspace(0, 1, nr) ** 0.85
    tt = np.linspace(0, 2 * np.pi, ns, endpoint=False)
    RR, TT = np.meshgrid(rr, tt, indexing="ij")
    px = (0.5 + 0.5 * RR * np.cos(TT)) * (S - 1)
    py = (0.5 - 0.5 * RR * np.sin(TT)) * (S - 1)
    rel = cv2.remap(hm, px.astype(np.float32), py.astype(np.float32), cv2.INTER_CUBIC)
    base = 0.0016
    face = base + 0.00055 * (1 - RR ** 2) + 0.00105 * rel
    rim = base + 0.00025 + 0.00125 * np.sqrt(np.clip(1 - ((RR - 0.937) / 0.063) ** 2, 0, 1))
    Z = np.where(RR < 0.874, face, np.maximum(rim, np.where(RR < 0.88, face, 0)))
    X = R * RR * np.cos(TT)
    Y = R * RR * np.sin(TT)
    V = np.stack([X, Y, Z], -1).reshape(-1, 3)
    faces = []
    idx = lambda i, j: i * ns + (j % ns)
    for i in range(nr - 1):
        for j in range(ns):
            faces.append((idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)))
    # flanc + dos bombé
    nb = len(V)
    rings = [(1.0, base * 0.55), (0.985, base * 0.12), (0.95, 0.0), (0.6, -0.0004), (0.2, -0.0006)]
    for k, (rf, zf) in enumerate(rings):
        V = np.vstack([V, np.stack([R * rf * np.cos(tt), R * rf * np.sin(tt), np.full(ns, zf)], -1)])
    prev = lambda j: idx(nr - 1, j)
    for k in range(len(rings)):
        cur = lambda j, k=k: nb + k * ns + (j % ns)
        for j in range(ns):
            faces.append((prev(j), cur(j), cur(j + 1), prev(j + 1)))
        prev = cur
    ob = mesh_from_numpy(name, V, np.array(faces), None)
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-8)
    bmesh.ops.holes_fill(bm, edges=bm.edges, sides=ns)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for l in f.loops:
            l[uv].uv = (0.5 + l.vert.co.x / (2 * R), 0.5 + l.vert.co.y / (2 * R))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    me.shade_smooth()
    bpy.context.scene.collection.objects.unlink(ob)
    return me


def place(coll, me, name, loc, normal, track=("Z", "Y")):
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    nrm = Vector(normal)
    ob.rotation_euler = nrm.to_track_quat(*track).to_euler()
    ob.location = loc
    return ob


def _cyl(bm, p0, p1, r, segs=40):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    mat = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    mat.translation = (p0 + p1) / 2
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r, depth=d.length, matrix=mat)


def _sphere(bm, c, r):
    m = Matrix.Translation(Vector(c))
    bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=20, radius=r, matrix=m)


def _torus(bm, c, R, r, axis="Y", segs=64, csegs=20):
    c = Vector(c)
    verts = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        ring = []
        for j in range(csegs):
            b = 2 * math.pi * j / csegs
            rr = R + r * math.cos(b)
            if axis == "Y":
                p = Vector((rr * math.cos(a), r * math.sin(b), rr * math.sin(a)))
            elif axis == "X":
                p = Vector((r * math.sin(b), rr * math.cos(a), rr * math.sin(a)))
            else:
                p = Vector((rr * math.cos(a), rr * math.sin(a), r * math.sin(b)))
            ring.append(bm.verts.new(c + p))
        verts.append(ring)
    for i in range(segs):
        for j in range(csegs):
            a, b = verts[i], verts[(i + 1) % segs]
            bm.faces.new((a[j], b[j], b[(j + 1) % csegs], a[(j + 1) % csegs]))


def build_clasp_mesh(name, mat):
    """Crochet type "fireman" (6,4 cm) : barre, goupille en T, bague, anneau."""
    bm = bmesh.new()
    s = 1.06
    y = -0.0036
    _cyl(bm, (-0.033 * s, 0.0, 0), (-0.033 * s, y + 0.001, 0), 0.0044)
    _cyl(bm, (0.017 * s, 0.0, 0), (0.017 * s, y + 0.001, 0), 0.0036)
    _cyl(bm, (-0.037 * s, y, 0), (-0.003 * s, y, 0), 0.0028)
    _sphere(bm, (-0.0385 * s, y, 0), 0.0038)
    _cyl(bm, (-0.030 * s, y, 0), (-0.0275 * s, y, 0), 0.0038)
    _cyl(bm, (-0.017 * s, y - 0.0005, -0.0112), (-0.017 * s, y - 0.0005, 0.0112), 0.0022)
    _sphere(bm, (-0.017 * s, y - 0.0005, -0.0120), 0.0032)
    _sphere(bm, (-0.017 * s, y - 0.0005, 0.0120), 0.0032)
    _cyl(bm, (-0.021 * s, y, 0), (-0.013 * s, y, 0), 0.0036)
    _cyl(bm, (-0.003 * s, y, 0), (0.0015 * s, y, 0.0029), 0.0022)
    _sphere(bm, (-0.003 * s, y, 0), 0.0028)
    _torus(bm, (0.0078 * s, y - 0.0005, 0.0), 0.0071, 0.0017, axis="Y")
    _torus(bm, (0.0162 * s, y + 0.0004, 0.0), 0.0033, 0.0012, axis="X")
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    me.shade_smooth()
    return me


def build_label(coll, mat):
    w, h = 0.062, 0.0259
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)]]
    f = bm.faces.new(vs)
    uv = bm.loops.layers.uv.new("UVMap")
    for l, t in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        l[uv].uv = t
    me = bpy.data.meshes.new("Etiquette")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("Etiquette", me)
    coll.objects.link(ob)
    ob.data.materials.append(mat)
    yb = G.NECK_CY + G.NECK_RY - 0.0045
    zc = surface_z(np.array([0.0]), np.array([yb + 0.012]))[0] - 0.022
    ob.location = (0, yb, zc)
    return ob


# =====================================================================  duvet (fibres)

def sample_surface(obs, density, rng):
    """Points tirés sur les surfaces (densité en fibres / m²), avec normales."""
    P, N = [], []
    dg = bpy.context.evaluated_depsgraph_get()
    for ob in obs:
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        me.calc_loop_triangles()
        co = mesh_arrays(me)
        tri = np.empty(len(me.loop_triangles) * 3, np.int32)
        me.loop_triangles.foreach_get("vertices", tri)
        tri = tri.reshape(-1, 3)
        ev.to_mesh_clear()
        mw = np.array(ob.matrix_world)
        co = co @ mw[:3, :3].T + mw[:3, 3]
        a, b, c = co[tri[:, 0]], co[tri[:, 1]], co[tri[:, 2]]
        cr = np.cross(b - a, c - a)
        area = 0.5 * np.linalg.norm(cr, axis=1)
        n = int(area.sum() * density)
        f = rng.choice(len(tri), n, p=area / area.sum())
        r1, r2 = rng.random(n), rng.random(n)
        s1 = np.sqrt(r1)
        p = (1 - s1)[:, None] * a[f] + (s1 * (1 - r2))[:, None] * b[f] + (s1 * r2)[:, None] * c[f]
        nn = cr[f] / (np.linalg.norm(cr[f], axis=1, keepdims=True) + 1e-12)
        P.append(p); N.append(nn)
    return np.concatenate(P), np.concatenate(N)


def build_fuzz(coll, obs, density=110000):
    P, N = sample_surface(obs, density, RNG)
    n = len(P)
    # direction : surtout tangente (fibres couchées), un peu relevée
    rnd = RNG.normal(size=(n, 3))
    tang = rnd - (rnd * N).sum(1, keepdims=True) * N
    tang /= np.linalg.norm(tang, axis=1, keepdims=True) + 1e-12
    lift = RNG.uniform(0.08, 0.45, (n, 1))
    d0 = tang * np.sqrt(1 - lift ** 2) + N * lift
    L = RNG.lognormal(np.log(0.0007), 0.5, (n, 1)).clip(0.0002, 0.0028)
    curl = RNG.normal(size=(n, 3)) * 0.35
    pts = [P - N * 0.00012]
    d = d0.copy()
    for k in range(3):
        d = d + curl * (k + 1) * 0.5
        d /= np.linalg.norm(d, axis=1, keepdims=True)
        pts.append(pts[-1] + d * L / 3)
    pos = np.stack(pts, 1).reshape(-1, 3).astype(np.float32)
    cv = bpy.data.hair_curves.new("Duvet")
    cv.add_curves([4] * n)
    cv.position_data.foreach_set("vector", pos.ravel())
    rad = cv.attributes.get("radius") or cv.attributes.new("radius", "FLOAT", "POINT")
    r = np.tile(np.array([0.0000060, 0.0000050, 0.0000038, 0.0000018], np.float32), n)
    rad.data.foreach_set("value", r)
    ob = bpy.data.objects.new("Duvet", cv)
    coll.objects.link(ob)
    print("duvet :", n, "fibres")
    return ob


# =====================================================================  matières

def img(path, colorspace="sRGB"):
    im = bpy.data.images.load(path, check_existing=True)
    im.colorspace_settings.name = colorspace
    return im


class NB:
    """Petit assistant pour écrire des arbres de nœuds."""

    def __init__(self, mat):
        mat.use_nodes = True
        self.nt = mat.node_tree
        self.N, self.L = self.nt.nodes, self.nt.links
        self.N.clear()
        self.x = 0

    def node(self, kind, loc=(0, 0), **inputs):
        n = self.N.new(kind)
        n.location = loc
        for k, v in inputs.items():
            if k in n.inputs:
                n.inputs[k].default_value = v
            else:
                setattr(n, k, v)
        return n

    def link(self, a, b):
        self.L.new(a, b)

    def math(self, op, a, b=None, loc=(0, 0), clamp=False):
        n = self.node("ShaderNodeMath", loc, operation=op)
        n.use_clamp = clamp
        for i, x in enumerate((a, b)):
            if x is None:
                continue
            if isinstance(x, (int, float)):
                n.inputs[i].default_value = x
            else:
                self.link(x, n.inputs[i])
        return n.outputs[0]

    def tex(self, path, vec, cs="Non-Color", loc=(0, 0), interp="Cubic", ext="REPEAT"):
        n = self.node("ShaderNodeTexImage", loc)
        n.image = img(path, cs)
        n.interpolation = interp
        n.extension = ext
        self.link(vec, n.inputs["Vector"])
        return n


def knit_material(name, kind="jersey"):
    m = bpy.data.materials.new(name)
    b = NB(m)
    out = b.node("ShaderNodeOutputMaterial", (1200, 0))
    bsdf = b.node("ShaderNodeBsdfPrincipled", (800, 0))
    uvn = b.node("ShaderNodeUVMap", (-1400, 0)); uvn.uv_map = "UVMap"
    mp = b.node("ShaderNodeMapping", (-1200, 0))
    if kind == "jersey":
        mp.inputs["Scale"].default_value = (1 / KNIT_TILE, 1 / KNIT_TILE, 1)
        hpath, dist = os.path.join(TEX, "knit_height.png"), 0.00042
    else:
        mp.inputs["Scale"].default_value = (1, 1, 1)
        hpath, dist = os.path.join(TEX, "rib_height.png"), 0.00060
    b.link(uvn.outputs["UV"], mp.inputs["Vector"])
    kh = b.tex(hpath, mp.outputs["Vector"], loc=(-900, 100))
    # variation lente de la maille (fil plus ou moins serré, légère chaînette)
    tc = b.node("ShaderNodeTexCoord", (-1400, -400))
    nz = b.node("ShaderNodeTexNoise", (-900, -300))
    nz.inputs["Scale"].default_value = 140.0
    nz.inputs["Detail"].default_value = 4.0
    b.link(tc.outputs["Object"], nz.inputs["Vector"])
    hn = b.node("ShaderNodeMath", (-600, 0), operation="MULTIPLY_ADD")
    b.link(kh.outputs["Color"], hn.inputs[0])
    hn.inputs[1].default_value = 0.92
    b.link(nz.outputs["Fac"], hn.inputs[2])
    # couture : petit creux
    if kind == "jersey":
        at = b.node("ShaderNodeAttribute", (-900, -600)); at.attribute_name = "couture"
        hs = b.math("MULTIPLY", at.outputs["Fac"], -0.9, loc=(-600, -500))
        h2 = b.math("ADD", hn.outputs[0], hs, loc=(-400, -200))
    else:
        h2 = hn.outputs[0]
    bump = b.node("ShaderNodeBump", (-200, -200))
    bump.inputs["Strength"].default_value = 1.0
    bump.inputs["Distance"].default_value = dist
    b.link(h2, bump.inputs["Height"])
    b.link(bump.outputs["Normal"], bsdf.inputs["Normal"])
    # couleur : noir profond, légèrement plus clair sur le dessus des mailles, plus sombre au creux
    if kind == "jersey":
        kc = b.tex(os.path.join(TEX, "knit_color.png"), mp.outputs["Vector"], loc=(-900, 400))
        cvar = kc.outputs["Color"]
    else:
        cvar = kh.outputs["Color"]
    cav = b.node("ShaderNodeMapRange", (-400, 300))
    cav.inputs["From Min"].default_value = 0.0
    cav.inputs["From Max"].default_value = 1.0
    cav.inputs["To Min"].default_value = 0.0022
    cav.inputs["To Max"].default_value = 0.0062
    b.link(kh.outputs["Color"], cav.inputs["Value"])
    cmul = b.math("MULTIPLY", cav.outputs["Result"], cvar, loc=(-200, 300))
    cmul2 = b.math("MULTIPLY", cmul, 1.8, loc=(0, 300))
    comb = b.node("ShaderNodeCombineColor", (200, 300))
    b.link(cmul2, comb.inputs["Red"]); b.link(cmul2, comb.inputs["Green"])
    cblue = b.math("MULTIPLY", cmul2, 1.08, loc=(100, 200))
    b.link(cblue, comb.inputs["Blue"])
    b.link(comb.outputs["Color"], bsdf.inputs["Base Color"])
    rough = b.node("ShaderNodeMapRange", (-200, 0))
    rough.inputs["To Min"].default_value = 0.92
    rough.inputs["To Max"].default_value = 0.70
    b.link(kh.outputs["Color"], rough.inputs["Value"])
    b.link(rough.outputs["Result"], bsdf.inputs["Roughness"])
    bsdf.inputs["Sheen Weight"].default_value = 0.22
    bsdf.inputs["Sheen Roughness"].default_value = 0.32
    bsdf.inputs["Sheen Tint"].default_value = (0.32, 0.31, 0.31, 1)
    bsdf.inputs["Specular IOR Level"].default_value = 0.16
    b.link(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def thread_material():
    m = bpy.data.materials.new("Fil_Broderie")
    b = NB(m)
    out = b.node("ShaderNodeOutputMaterial", (1300, 0))
    bsdf = b.node("ShaderNodeBsdfPrincipled", (700, 0))
    uvn = b.node("ShaderNodeUVMap", (-1400, 0)); uvn.uv_map = "UVMap"
    msk = b.tex(os.path.join(TEX, "emb_mask.png"), uvn.outputs["UV"], loc=(-1000, 400), ext="CLIP")
    hgt = b.tex(os.path.join(TEX, "emb_height.png"), uvn.outputs["UV"], loc=(-1000, 100), ext="CLIP")
    thr = b.tex(os.path.join(TEX, "emb_thread.png"), uvn.outputs["UV"], loc=(-1000, -200), ext="CLIP")
    tg = b.tex(os.path.join(TEX, "emb_tangent.png"), uvn.outputs["UV"], loc=(-1000, -500), interp="Linear", ext="CLIP")
    # relief fin : bourrelet + fils du point satin
    hh = b.math("MULTIPLY_ADD", thr.outputs["Color"], 0.35, loc=(-700, 0))
    hh.node.inputs[2].default_value = 0.0
    b.link(hgt.outputs["Color"], hh.node.inputs[2])
    bump = b.node("ShaderNodeBump", (-300, -100))
    bump.inputs["Strength"].default_value = 1.0
    bump.inputs["Distance"].default_value = 0.00035
    b.link(hh, bump.inputs["Height"])
    b.link(bump.outputs["Normal"], bsdf.inputs["Normal"])
    # tangente du fil (anisotropie) : T = cos * Tu + sin * Bv
    sep = b.node("ShaderNodeSeparateColor", (-700, -500))
    b.link(tg.outputs["Color"], sep.inputs["Color"])
    cs = b.math("MULTIPLY_ADD", sep.outputs["Red"], 2.0, loc=(-500, -450)); cs.node.inputs[2].default_value = -1.0
    sn = b.math("MULTIPLY_ADD", sep.outputs["Green"], 2.0, loc=(-500, -600)); sn.node.inputs[2].default_value = -1.0
    tan = b.node("ShaderNodeTangent", (-700, -800)); tan.direction_type = "UV_MAP"; tan.uv_map = "UVMap"
    geo = b.node("ShaderNodeNewGeometry", (-700, -1000))
    bit = b.node("ShaderNodeVectorMath", (-500, -900), operation="CROSS_PRODUCT")
    b.link(geo.outputs["Normal"], bit.inputs[0]); b.link(tan.outputs["Tangent"], bit.inputs[1])
    t1 = b.node("ShaderNodeVectorMath", (-300, -700), operation="SCALE")
    b.link(tan.outputs["Tangent"], t1.inputs[0]); b.link(cs, t1.inputs["Scale"])
    t2 = b.node("ShaderNodeVectorMath", (-300, -900), operation="SCALE")
    b.link(bit.outputs["Vector"], t2.inputs[0]); b.link(sn, t2.inputs["Scale"])
    tsum = b.node("ShaderNodeVectorMath", (-100, -800), operation="ADD")
    b.link(t1.outputs["Vector"], tsum.inputs[0]); b.link(t2.outputs["Vector"], tsum.inputs[1])
    b.link(tsum.outputs["Vector"], bsdf.inputs["Tangent"])
    # couleur : rouge intense, plus sombre dans les creux entre les fils
    col = b.node("ShaderNodeMix", (100, 300)); col.data_type = "RGBA"
    col.inputs["A"].default_value = (0.16, 0.0015, 0.004, 1)
    col.inputs["B"].default_value = (0.42, 0.004, 0.009, 1)
    b.link(thr.outputs["Color"], col.inputs["Factor"])
    b.link(col.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.34
    bsdf.inputs["Anisotropic"].default_value = 0.8
    bsdf.inputs["Specular IOR Level"].default_value = 0.42
    bsdf.inputs["Specular Tint"].default_value = (1.0, 0.55, 0.55, 1)
    bsdf.inputs["Sheen Weight"].default_value = 0.12
    bsdf.inputs["Sheen Tint"].default_value = (1.0, 0.05, 0.06, 1)
    bsdf.inputs["Sheen Roughness"].default_value = 0.3
    # bords nets : transparence hors du tracé
    a = b.node("ShaderNodeMapRange", (300, 500))
    a.inputs["From Min"].default_value = 0.42
    a.inputs["From Max"].default_value = 0.58
    b.link(msk.outputs["Color"], a.inputs["Value"])
    tr = b.node("ShaderNodeBsdfTransparent", (700, 300))
    mix = b.node("ShaderNodeMixShader", (1000, 100))
    b.link(a.outputs["Result"], mix.inputs["Fac"])
    b.link(tr.outputs["BSDF"], mix.inputs[1])
    b.link(bsdf.outputs["BSDF"], mix.inputs[2])
    b.link(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def metal_material(name, button=False):
    m = bpy.data.materials.new(name)
    b = NB(m)
    out = b.node("ShaderNodeOutputMaterial", (900, 0))
    bsdf = b.node("ShaderNodeBsdfPrincipled", (500, 0))
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Base Color"].default_value = (0.90, 0.90, 0.91, 1)
    bsdf.inputs["Roughness"].default_value = 0.11
    # micro-rayures / poli imparfait
    tc = b.node("ShaderNodeTexCoord", (-1200, -300))
    nz = b.node("ShaderNodeTexNoise", (-900, -300))
    nz.inputs["Scale"].default_value = 2600.0
    nz.inputs["Detail"].default_value = 3.0
    b.link(tc.outputs["Object"], nz.inputs["Vector"])
    rr = b.node("ShaderNodeMapRange", (-600, -300))
    rr.inputs["To Min"].default_value = 0.07
    rr.inputs["To Max"].default_value = 0.17
    b.link(nz.outputs["Fac"], rr.inputs["Value"])
    if button:
        uvn = b.node("ShaderNodeUVMap", (-1200, 200)); uvn.uv_map = "UVMap"
        hm = b.tex(os.path.join(TEX, "button_height.png"), uvn.outputs["UV"], loc=(-900, 200), ext="CLIP")
        cv = b.tex(os.path.join(TEX, "button_cavity.png"), uvn.outputs["UV"], loc=(-900, 500), ext="CLIP")
        bump = b.node("ShaderNodeBump", (-300, 100))
        bump.inputs["Strength"].default_value = 0.35
        bump.inputs["Distance"].default_value = 0.00025
        b.link(hm.outputs["Color"], bump.inputs["Height"])
        b.link(bump.outputs["Normal"], bsdf.inputs["Normal"])
        col = b.node("ShaderNodeMapRange", (-300, 400))
        col.inputs["From Min"].default_value = 0.30
        col.inputs["From Max"].default_value = 0.55
        col.inputs["To Min"].default_value = 0.30
        col.inputs["To Max"].default_value = 0.92
        b.link(cv.outputs["Color"], col.inputs["Value"])
        b.link(col.outputs["Result"], bsdf.inputs["Base Color"])
        r2 = b.node("ShaderNodeMapRange", (-300, -100))
        r2.inputs["From Min"].default_value = 0.30
        r2.inputs["From Max"].default_value = 0.55
        r2.inputs["To Min"].default_value = 0.32
        r2.inputs["To Max"].default_value = 0.09
        b.link(cv.outputs["Color"], r2.inputs["Value"])
        b.link(r2.outputs["Result"], bsdf.inputs["Roughness"])
    else:
        b.link(rr.outputs["Result"], bsdf.inputs["Roughness"])
    b.link(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def label_material():
    m = bpy.data.materials.new("Etiquette")
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    bsdf = N["Principled BSDF"]
    tex = N.new("ShaderNodeTexImage")
    tex.image = img(os.path.join(TEX, "etiquette_crop.png"))
    L.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.7
    bsdf.inputs["Sheen Weight"].default_value = 0.4
    return m


def fuzz_material():
    m = bpy.data.materials.new("Fibres")
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    N.clear()
    out = N.new("ShaderNodeOutputMaterial")
    hb = N.new("ShaderNodeBsdfHairPrincipled")
    try:
        hb.parametrization = "COLOR"
    except Exception:
        pass
    hb.inputs["Color"].default_value = (0.006, 0.0058, 0.0058, 1)
    hb.inputs["Roughness"].default_value = 0.45
    hb.inputs["Radial Roughness"].default_value = 0.7
    L.new(hb.outputs["BSDF"], out.inputs["Surface"])
    return m


# =====================================================================  lumières, caméra, monde

def setup_world_and_lights(scene):
    world = bpy.data.worlds.new("Monde")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.012, 0.010, 0.010, 1)
    bg.inputs["Strength"].default_value = 1.0

    def area(coll, name, loc, size, power, color, target=(0, 0, 0.33), sy=None):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = power
        ld.color = color
        ld.shape = "RECTANGLE"
        ld.size = size
        ld.size_y = sy or size
        ob = bpy.data.objects.new(name, ld)
        coll.objects.link(ob)
        ob.location = loc
        d = Vector(target) - Vector(loc)
        ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        ob.visible_camera = False
        return ob

    rig = bpy.data.collections.new("Eclairage")
    scene.collection.children.link(rig)
    area(rig, "Key", (-1.6, -2.2, 1.7), 1.6, 330, (1.0, 0.97, 0.94), sy=1.2)
    area(rig, "Fill", (2.2, -2.0, 0.6), 2.0, 55, (0.85, 0.88, 1.0))
    area(rig, "Top", (0.0, -0.4, 2.4), 1.2, 100, (1.0, 0.95, 0.92))
    area(rig, "Rim_Rouge_G", (-1.25, 2.1, 0.9), 0.5, 420, (1.0, 0.10, 0.07), sy=1.6)
    area(rig, "Rim_Rouge_D", (1.35, 2.0, 0.5), 0.5, 380, (1.0, 0.12, 0.08), sy=1.6)
    area(rig, "Contre_Blanc", (0.0, 2.2, 1.6), 1.0, 120, (1.0, 0.9, 0.9))
    for i, (loc, sz) in enumerate([((-0.9, -1.4, 0.9), 0.9), ((0.7, -1.2, 1.2), 0.5), ((0.0, -1.0, -0.6), 1.2)]):
        area(rig, f"Reflet_{i}", loc, sz, 12, (1, 1, 1), target=(0, 0, 0.35))

    # éclairage studio (packshot façon photo produit), désactivé par défaut
    st = bpy.data.collections.new("Eclairage_Studio")
    scene.collection.children.link(st)
    area(st, "Studio_Haut", (0.0, -1.2, 2.2), 2.4, 380, (1, 1, 1), target=(0, 0, 0.35))
    area(st, "Studio_Face", (0.0, -2.6, 0.5), 2.6, 160, (1, 1, 1), target=(0, 0, 0.35))
    area(st, "Studio_G", (-2.2, -1.2, 0.6), 1.6, 60, (1, 1, 1), target=(0, 0, 0.35))
    area(st, "Studio_D", (2.2, -1.2, 0.6), 1.6, 60, (1, 1, 1), target=(0, 0, 0.35))
    st.hide_render = True
    st.hide_viewport = True


def setup_camera(scene):
    cd = bpy.data.cameras.new("Camera")
    cd.lens = 85
    cd.sensor_width = 36
    cam = bpy.data.objects.new("Camera", cd)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.location = (0, -3.6, 0.42)
    cam.rotation_euler = (math.radians(89.0), 0, 0)
    return cam


def setup_render(scene):
    scene.render.engine = "CYCLES"
    c = scene.cycles
    c.device = "CPU"
    c.samples = 64
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.02
    c.use_denoising = True
    try:
        c.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    c.max_bounces = 8
    c.diffuse_bounces = 2
    c.glossy_bounces = 4
    c.transmission_bounces = 2
    c.transparent_max_bounces = 8
    try:
        scene.cycles_curves.shape = "RIBBONS"
    except Exception:
        pass
    scene.render.film_transparent = True
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1080
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    vs = scene.view_settings
    vs.view_transform = "Khronos PBR Neutral"
    vs.look = "None"
    vs.exposure = -0.2
    scene.render.fps = 30
    scene.render.use_persistent_data = True


# =====================================================================  main

def main(fuzz=True):
    reset_scene()
    scene = bpy.context.scene
    garment = bpy.data.collections.new("Cardigan")
    scene.collection.children.link(garment)
    root = bpy.data.objects.new("Cardigan_Racine", None)  # pivot du turntable
    garment.objects.link(root)

    mat_knit = knit_material("Maille_Noire", "jersey")
    mat_rib = knit_material("Cotes_Noires", "rib")
    mat_btn = metal_material("Argent_Bouton", button=True)
    mat_metal = metal_material("Argent_Poli")
    mat_thread = thread_material()

    body = build_body(garment)
    body.data.materials.append(mat_knit)
    hem = build_hem(garment); hem.data.materials.append(mat_rib)
    cuffs = [build_cuff(garment, s) for s in (1, -1)]
    for c in cuffs:
        c.data.materials.append(mat_rib)
    collar, zb = build_collar(garment); collar.data.materials.append(mat_rib)
    z_front_collar = float(zb[3 * (len(zb) - 1) // 4])
    placket = build_placket(garment, z_front_collar + 0.004)
    placket.data.materials.append(mat_rib)
    emb = build_embroidery(garment, body)
    emb.data.materials.append(mat_thread)

    btn_me = build_button_mesh("Bouton_Lycoris", mat_btn)
    clasp_me = build_clasp_mesh("Crochet", mat_metal)
    metal = []
    for i, z in enumerate(G.BTN_Z):
        y, nrm = placket_point(z)
        metal.append(place(garment, btn_me, f"Bouton_Lycoris_{i + 1}", (0.0, y, z), nrm, ("Z", "Y")))
    for i, z in enumerate(G.CLASP_Z):
        y, nrm = placket_point(z)
        metal.append(place(garment, clasp_me, f"Crochet_{i + 1}", (0.0, y, z), nrm, ("-Y", "Z")))
    try:
        metal.append(build_label(garment, label_material()))
    except Exception as e:  # pragma: no cover
        print("étiquette ignorée :", e)

    parts = [body, hem, collar, placket, *cuffs, emb, *metal]
    if fuzz:
        fz = build_fuzz(garment, [body, hem, collar, placket, *cuffs])
        fz.data.materials.append(fuzz_material())
        parts.append(fz)
    for ob in parts:
        ob.parent = root

    setup_world_and_lights(scene)
    setup_camera(scene)
    setup_render(scene)
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, compress=True)
    print("OK ->", OUT_BLEND)


if __name__ == "__main__":
    main(fuzz="--sans-duvet" not in sys.argv)
