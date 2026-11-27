"""Construit la scène Blender du cardigan Fadiye et l'enregistre dans cardigan_fadiye.blend.

Lancer :  python build_cardigan.py      (avec le module bpy installé)
"""
import math
import os
import sys

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix
from skimage.measure import marching_cubes

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sdf_garment as G  # noqa: E402

TEX = os.path.join(HERE, "textures")
OUT_BLEND = os.path.join(HERE, "cardigan_fadiye.blend")


# =====================================================================  utils

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mesh_from_numpy(name, V, F, coll=None):
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
    ob = bpy.data.objects.new(name, me)
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def grid_faces(nu, nv, wrap_u=False):
    """Faces quad pour une grille nu x nv (indice = v*nu + u)."""
    faces = []
    umax = nu if wrap_u else nu - 1
    for v in range(nv - 1):
        for u in range(umax):
            u2 = (u + 1) % nu
            faces.append((v * nu + u, v * nu + u2, (v + 1) * nu + u2, (v + 1) * nu + u))
    return np.array(faces, np.int32)


def apply_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)


def shade_smooth(ob):
    ob.data.shade_smooth()


def add_mod(ob, kind, **kw):
    m = ob.modifiers.new(kind.lower(), kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m


# =====================================================================  garment body (SDF)

def build_body(coll):
    VOX = 0.0032
    xs = np.arange(-0.53, 0.53 + VOX, VOX, dtype=np.float32)
    ys = np.arange(-0.17, 0.17 + VOX, VOX, dtype=np.float32)
    zs = np.arange(0.0, 0.70 + VOX, VOX, dtype=np.float32)
    vol = np.empty((len(xs), len(ys), len(zs)), np.float32)
    Y, Z = np.meshgrid(ys, zs, indexing="ij")
    for i, x in enumerate(xs):
        vol[i] = G.garment_sdf(np.full_like(Y, x), Y, Z)
    v, f, _, _ = marching_cubes(vol, 0.0, spacing=(VOX, VOX, VOX), gradient_direction="ascent")
    v += np.array([xs[0], ys[0], zs[0]])
    ob = mesh_from_numpy("Cardigan_Corps", v, f, coll)
    add_mod(ob, "REMESH", mode="VOXEL", voxel_size=0.0036, adaptivity=0.0, use_smooth_shade=True)
    add_mod(ob, "SMOOTH", factor=0.5, iterations=2)
    apply_modifiers(ob)

    # Attribut "torse" (1 = buste, 0 = manche) : sert à limiter la broderie au panneau avant
    me = ob.data
    co = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    _, dt, ds = G.garment_sdf(co[:, 0], co[:, 1], co[:, 2], parts=True)
    w = np.clip(0.5 + (ds - dt) / 0.008, 0, 1).astype(np.float32)
    at = me.attributes.new("torse", "FLOAT", "POINT")
    at.data.foreach_set("value", w)
    shade_smooth(ob)
    add_mod(ob, "SUBSURF", levels=0, render_levels=1)
    print("corps:", len(me.vertices), "sommets")
    return ob


# =====================================================================  rib parts

def superellipse_ring(W, D, p, n):
    """Points d'une super-ellipse, échantillonnés à abscisse curviligne constante."""
    th = np.linspace(0, 2 * np.pi, 4000, endpoint=False)
    c, s = np.cos(th), np.sin(th)
    x = W * np.sign(c) * np.abs(c) ** (2 / p)
    y = D * np.sign(s) * np.abs(s) ** (2 / p)
    seg = np.hypot(np.diff(np.r_[x, x[0]]), np.diff(np.r_[y, y[0]]))
    L = np.r_[0, np.cumsum(seg)]
    per = L[-1]
    tgt = np.linspace(0, per, n, endpoint=False)
    xi = np.interp(tgt, L[:-1], x)
    yi = np.interp(tgt, L[:-1], y)
    return xi, yi, per


def rib_offset(s, lam, amp):
    # côte 1x1 : crête arrondie + creux étroit
    w = 0.5 + 0.5 * np.cos(2 * np.pi * s / lam)
    return amp * (w ** 0.6)


def build_hem(coll):
    nu, nv = 720, 18
    p = G.P_BOX
    verts = []
    for j in range(nv):
        v = j / (nv - 1)
        z = v * G.HEM_TOP
        Wb = 0.257 - 0.004 * v
        Db = 0.111 - 0.002 * v
        x, y, per = superellipse_ring(Wb, Db, p, nu)
        nrib = int(round(per / 0.0072))
        lam = per / nrib
        s = np.arange(nu) * per / nu
        # normale approx (radiale normalisée par la super-ellipse)
        nx, ny = x / Wb ** 2, y / Db ** 2
        nn = np.hypot(nx, ny)
        nx, ny = nx / nn, ny / nn
        off = rib_offset(s, lam, 0.0016) - 0.0006 * (1 - np.sin(np.pi * v) ** 0.5)
        for i in range(nu):
            verts.append((x[i] + nx[i] * off[i], y[i] + ny[i] * off[i], z))
    ob = mesh_from_numpy("Bord_Cotes_Ourlet", np.array(verts), grid_faces(nu, nv, True), coll)
    add_mod(ob, "SOLIDIFY", thickness=0.007, offset=-1.0, use_rim=True, use_even_offset=True)
    add_mod(ob, "SUBSURF", levels=0, render_levels=1)
    shade_smooth(ob)
    return ob


def build_cuff(coll, side):
    A, B, U, V1, V2 = G.sleeve_frame(side)
    nu, nv = 220, 16
    verts = []
    start = -0.014  # recouvre le bout de manche
    for j in range(nv):
        v = j / (nv - 1)
        dist = start + v * (G.CUFF_LEN - start)
        rx = 0.0475 - 0.002 * v
        ry = 0.0425 - 0.002 * v
        th = np.linspace(0, 2 * np.pi, nu, endpoint=False)
        per = np.pi * (3 * (rx + ry) - np.sqrt((3 * rx + ry) * (rx + 3 * ry)))
        nrib = int(round(per / 0.0068))
        rib = 0.0013 * (0.5 + 0.5 * np.cos(th * nrib)) ** 0.6
        r1 = (rx + rib) * np.cos(th)
        r2 = (ry + rib) * np.sin(th)
        C = B + U * dist
        for i in range(nu):
            P = C + V1 * r1[i] + V2 * r2[i]
            verts.append(P)
    ob = mesh_from_numpy("Poignet_" + ("D" if side > 0 else "G"), np.array(verts), grid_faces(nu, nv, True), coll)
    add_mod(ob, "SOLIDIFY", thickness=0.0065, offset=-1.0, use_rim=True, use_even_offset=True)
    add_mod(ob, "SUBSURF", levels=0, render_levels=1)
    shade_smooth(ob)
    # vérifie l'orientation des normales (vers l'extérieur)
    return ob


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
    lo = np.full_like(x, -0.25)  # dehors
    hi = np.full_like(x, -0.088)  # dedans (paroi avant, devant le trou d'encolure)
    for _ in range(it):
        mid = 0.5 * (lo + hi)
        inside = G.garment_sdf(x, mid, z) < 0
        hi = np.where(inside, mid, hi)
        lo = np.where(inside, lo, mid)
    return 0.5 * (lo + hi)


def build_collar(coll):
    nu, nv = 420, 14
    th = np.linspace(0, 2 * np.pi, nu, endpoint=False)
    rx0, ry0 = G.NECK_RX + 0.007, G.NECK_RY + 0.007
    bx = rx0 * np.cos(th)
    by = G.NECK_CY + ry0 * np.sin(th)
    zb = surface_z(bx, by) - 0.007
    # un peu de lissage du pied de col
    k = np.ones(15) / 15
    zb = np.convolve(np.r_[zb[-7:], zb, zb[:7]], k, mode="valid")
    per = np.pi * (3 * (rx0 + ry0) - np.sqrt((3 * rx0 + ry0) * (rx0 + 3 * ry0)))
    nrib = int(round(per / 0.0068))
    rib = 0.0013 * (0.5 + 0.5 * np.cos(th * nrib)) ** 0.6
    height = 0.031 - 0.004 * (np.sin(th) < 0) * (-np.sin(th))  # col un peu plus bas devant
    verts = []
    for j in range(nv):
        v = j / (nv - 1)
        shrink = 1.0 - 0.06 * v - 0.03 * np.sin(np.pi * v)  # le col se referme légèrement
        roll = 0.003 * np.sin(np.pi * v)  # bombé
        rx = (rx0 + rib + roll) * shrink
        ry = (ry0 + rib + roll) * shrink
        x = rx * np.cos(th)
        y = G.NECK_CY + ry * np.sin(th)
        z = zb + height * v
        verts.extend(np.stack([x, y, z], 1))
    ob = mesh_from_numpy("Col_Cotes", np.array(verts), grid_faces(nu, nv, True), coll)
    add_mod(ob, "SOLIDIFY", thickness=0.0085, offset=-1.0, use_rim=True, use_even_offset=True)
    add_mod(ob, "SUBSURF", levels=0, render_levels=1)
    shade_smooth(ob)
    return ob, zb


def build_placket(coll, z_top):
    nx, nz = 11, 600
    half = 0.0165
    xs = np.linspace(-half, half, nx)
    zs = np.linspace(0.0, z_top, nz)
    XX, ZZ = np.meshgrid(xs, zs)
    yy = surface_front_y(XX.ravel(), np.maximum(ZZ.ravel(), G.HEM_TOP + 0.004)).reshape(XX.shape)
    # sous l'ourlet : face avant du bord-côte
    hem_y = -(0.111 + 0.0016)
    blend = np.clip((ZZ - (G.HEM_TOP - 0.004)) / 0.012, 0, 1)
    yy = np.where(ZZ < G.HEM_TOP + 0.008, yy * blend + hem_y * (1 - blend), yy)
    # lissage vertical pour une patte bien tendue
    from scipy.ndimage import gaussian_filter1d
    yy = gaussian_filter1d(yy, 6, axis=0, mode="nearest")
    yy = gaussian_filter1d(yy, 2, axis=1, mode="nearest")
    yy = yy.min(axis=1, keepdims=True) * 0.7 + yy * 0.3  # patte plutôt plane en largeur
    ribs = 0.0007 * (0.5 + 0.5 * np.cos(2 * np.pi * ZZ / 0.0052)) ** 0.6
    edge = np.abs(XX) / half
    yy = yy - 0.0040 - ribs + 0.0012 * edge ** 4  # surélevée, bords arrondis
    V = np.stack([XX.ravel(), yy.ravel(), ZZ.ravel()], 1)
    F = []
    for j in range(nz - 1):
        for i in range(nx - 1):
            a = j * nx + i
            F.append((a, a + 1, a + 1 + nx, a + nx))
    ob = mesh_from_numpy("Patte_Boutonnage", V, np.array(F), coll)
    add_mod(ob, "SOLIDIFY", thickness=0.005, offset=-1.0, use_rim=True, use_even_offset=True)
    add_mod(ob, "SUBSURF", levels=0, render_levels=1)
    shade_smooth(ob)
    return ob


def placket_point(z):
    y = surface_front_y(np.array([0.0]), np.array([max(z, G.HEM_TOP + 0.004)]))[0]
    if z < G.HEM_TOP + 0.004:
        y = -(0.111 + 0.0016)
    return y - 0.0040 - 0.0014


# =====================================================================  metal

def build_button(coll, mat, name, loc):
    """Bouton signature Ø 20 mm : disque bombé + relief Lycoris en vraie géométrie."""
    import cv2
    R = 0.010
    hm = cv2.imread(os.path.join(TEX, "button_relief.png"), 0).astype(np.float32) / 255.0
    S = hm.shape[0]
    nr, ns = 170, 540
    rr = np.linspace(0, 1, nr)
    tt = np.linspace(0, 2 * np.pi, ns, endpoint=False)
    RR, TT = np.meshgrid(rr, tt, indexing="ij")
    px = (0.5 + 0.5 * RR * np.cos(TT)) * (S - 1)
    py = (0.5 - 0.5 * RR * np.sin(TT)) * (S - 1)
    rel = cv2.remap(hm, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR)
    dome = 0.0011 * (1 - RR ** 2)
    edge = -0.0014 * np.clip((RR - 0.965) / 0.035, 0, 1) ** 2
    Z = 0.0021 + dome + edge + 0.0010 * rel * (RR < 0.985)
    X = R * RR * np.cos(TT)
    Y = R * RR * np.sin(TT)
    V = np.stack([X, Y, Z], -1).reshape(-1, 3)
    faces = []
    idx = lambda i, j: i * ns + (j % ns)
    for i in range(nr - 1):
        for j in range(ns):
            faces.append((idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)))
    # dos du bouton
    nb = len(V)
    back = np.stack([X[-1] * 0.96, Y[-1] * 0.96, np.zeros(ns)], -1)
    V = np.vstack([V, back])
    for j in range(ns):
        faces.append((idx(nr - 1, j), nb + j, nb + (j + 1) % ns, idx(nr - 1, j + 1)))
    ob = mesh_from_numpy(name, V, np.array(faces), coll)
    me = ob.data
    # le centre (r=0) est dégénéré : fusionne les sommets confondus
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.holes_fill(bm, edges=bm.edges, sides=ns)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for l in f.loops:
            l[uv].uv = (0.5 + l.vert.co.x / (2 * R), 0.5 + l.vert.co.y / (2 * R))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    shade_smooth(ob)
    ob.rotation_euler = (math.radians(90), 0, 0)
    ob.location = loc
    return ob


def _cyl(bm, p0, p1, r, segs=32):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    mat = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    mat.translation = (p0 + p1) / 2
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r, depth=d.length, matrix=mat)


def _sphere(bm, c, r):
    m = Matrix.Translation(Vector(c))
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=r, matrix=m)


def _torus(bm, c, R, r, axis="Y", segs=48, csegs=16):
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


def build_clasp(coll, mat, name, loc):
    """Crochet type "fireman" : barre + goupille en T + anneau."""
    bm = bmesh.new()
    y = -0.0035
    # platines cousues
    _cyl(bm, (-0.032, 0.0, 0), (-0.032, y + 0.001, 0), 0.0042)
    _cyl(bm, (0.016, 0.0, 0), (0.016, y + 0.001, 0), 0.0034)
    # barre principale
    _cyl(bm, (-0.036, y, 0), (-0.003, y, 0), 0.0027)
    _sphere(bm, (-0.0375, y, 0), 0.0036)
    _cyl(bm, (-0.029, y, 0), (-0.027, y, 0), 0.0036)  # bague
    # goupille en T
    _cyl(bm, (-0.017, y - 0.0005, -0.0085), (-0.017, y - 0.0005, 0.0085), 0.0021)
    _sphere(bm, (-0.017, y - 0.0005, -0.0092), 0.003)
    _sphere(bm, (-0.017, y - 0.0005, 0.0092), 0.003)
    _cyl(bm, (-0.0205, y, 0), (-0.0135, y, 0), 0.0034)
    # crochet
    _cyl(bm, (-0.003, y, 0), (0.0015, y, 0.0028), 0.0021)
    _sphere(bm, (-0.003, y, 0), 0.0027)
    _torus(bm, (0.0075, y - 0.0005, 0.0), 0.0068, 0.00165, axis="Y")
    _torus(bm, (0.0155, y + 0.0004, 0.0), 0.0032, 0.0012, axis="X")
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    ob.data.materials.append(mat)
    shade_smooth(ob)
    ob.location = loc
    return ob


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
    zc = surface_z(np.array([0.0]), np.array([yb + 0.012]))[0] - 0.024
    ob.location = (0, yb, zc)
    return ob


# =====================================================================  materials

def img(path, colorspace="sRGB"):
    im = bpy.data.images.load(path, check_existing=True)
    im.colorspace_settings.name = colorspace
    return im


def knit_material(name, bump_scale=1.0, stitch=0.0045, embroidery=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    N.clear()
    out = N.new("ShaderNodeOutputMaterial"); out.location = (900, 0)
    bsdf = N.new("ShaderNodeBsdfPrincipled"); bsdf.location = (300, 200)
    bsdf.inputs["Base Color"].default_value = (0.0042, 0.0042, 0.0048, 1)
    bsdf.inputs["Roughness"].default_value = 0.86
    bsdf.inputs["Sheen Weight"].default_value = 0.45
    bsdf.inputs["Sheen Roughness"].default_value = 0.42
    bsdf.inputs["Sheen Tint"].default_value = (0.30, 0.29, 0.29, 1)
    bsdf.inputs["Specular IOR Level"].default_value = 0.18

    tc = N.new("ShaderNodeTexCoord"); tc.location = (-1200, 0)
    mp = N.new("ShaderNodeMapping"); mp.location = (-1000, 0)
    # tuile = 8 mailles x 10 rangs
    mp.inputs["Scale"].default_value = (1 / (8 * stitch), 1 / (8 * stitch), 1 / (10 * stitch * 0.84))
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    knit = N.new("ShaderNodeTexImage"); knit.location = (-800, 0)
    knit.image = img(os.path.join(TEX, "knit_height.png"), "Non-Color")
    knit.projection = "BOX"; knit.projection_blend = 0.35
    L.new(mp.outputs["Vector"], knit.inputs["Vector"])
    # légère variation de teinte / fibre
    noise = N.new("ShaderNodeTexNoise"); noise.location = (-800, -300)
    noise.inputs["Scale"].default_value = 180.0
    noise.inputs["Detail"].default_value = 6
    L.new(tc.outputs["Object"], noise.inputs["Vector"])
    bump = N.new("ShaderNodeBump"); bump.location = (-300, -200)
    bump.inputs["Strength"].default_value = 0.55 * bump_scale
    bump.inputs["Distance"].default_value = 0.0012 * bump_scale
    mix_h = N.new("ShaderNodeMix"); mix_h.location = (-500, -150); mix_h.data_type = "FLOAT"
    mix_h.inputs["Factor"].default_value = 0.18
    L.new(knit.outputs["Color"], mix_h.inputs["A"])
    L.new(noise.outputs["Fac"], mix_h.inputs["B"])
    L.new(mix_h.outputs["Result"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    shader_out = bsdf.outputs["BSDF"]
    if embroidery:
        # ---- broderie "Fadiye" : décalque projeté de face sur le panneau droit
        sep = N.new("ShaderNodeSeparateXYZ"); sep.location = (-1000, 600)
        L.new(tc.outputs["Object"], sep.inputs["Vector"])
        X0, X1, Z0, Z1 = 0.0313, 0.2409, 0.0708, 0.5873
        def lin(inp, a, b, loc):
            n = N.new("ShaderNodeMapRange"); n.location = loc
            n.inputs["From Min"].default_value = a
            n.inputs["From Max"].default_value = b
            n.inputs["To Min"].default_value = 0
            n.inputs["To Max"].default_value = 1
            n.clamp = False
            L.new(inp, n.inputs["Value"])
            return n
        u = lin(sep.outputs["X"], X0, X1, (-800, 700))
        v = lin(sep.outputs["Z"], Z0, Z1, (-800, 500))
        comb = N.new("ShaderNodeCombineXYZ"); comb.location = (-600, 600)
        L.new(u.outputs["Result"], comb.inputs["X"])
        L.new(v.outputs["Result"], comb.inputs["Y"])
        emb = N.new("ShaderNodeTexImage"); emb.location = (-400, 600)
        emb.image = img(os.path.join(TEX, "embroidery_mask.png"), "Non-Color")
        emb.extension = "CLIP"
        emb.interpolation = "Cubic"
        L.new(comb.outputs["Vector"], emb.inputs["Vector"])
        # avant uniquement + buste uniquement
        front = N.new("ShaderNodeMapRange"); front.location = (-600, 400)
        front.inputs["From Min"].default_value = -0.02
        front.inputs["From Max"].default_value = -0.05
        L.new(sep.outputs["Y"], front.inputs["Value"])
        attr = N.new("ShaderNodeAttribute"); attr.location = (-600, 250)
        attr.attribute_name = "torse"
        m1 = N.new("ShaderNodeMath"); m1.operation = "MULTIPLY"; m1.location = (-200, 500)
        L.new(emb.outputs["Color"], m1.inputs[0])
        L.new(front.outputs["Result"], m1.inputs[1])
        m2 = N.new("ShaderNodeMath"); m2.operation = "MULTIPLY"; m2.location = (-50, 500)
        L.new(m1.outputs[0], m2.inputs[0])
        L.new(attr.outputs["Fac"], m2.inputs[1])
        mask = N.new("ShaderNodeMapRange"); mask.location = (100, 500)
        mask.inputs["From Min"].default_value = 0.35
        mask.inputs["From Max"].default_value = 0.6
        L.new(m2.outputs[0], mask.inputs["Value"])

        thread = N.new("ShaderNodeBsdfPrincipled"); thread.location = (300, 700)
        thread.inputs["Base Color"].default_value = (0.36, 0.0008, 0.010, 1)
        thread.inputs["Roughness"].default_value = 0.34
        thread.inputs["Sheen Weight"].default_value = 0.6
        thread.inputs["Sheen Tint"].default_value = (1.0, 0.08, 0.12, 1)
        thread.inputs["Sheen Roughness"].default_value = 0.3
        thread.inputs["Specular IOR Level"].default_value = 0.6
        try:
            thread.inputs["Anisotropic"].default_value = 0.6
        except KeyError:
            pass
        # relief : masque flouté + fines stries du fil (point satin)
        wave = N.new("ShaderNodeTexWave"); wave.location = (-200, 900)
        wave.inputs["Scale"].default_value = 900.0
        wave.inputs["Distortion"].default_value = 2.0
        wave.inputs["Detail"].default_value = 1.0
        wave.bands_direction = "DIAGONAL"
        L.new(tc.outputs["Object"], wave.inputs["Vector"])
        eh = N.new("ShaderNodeTexImage"); eh.location = (-400, 1000)
        eh.image = img(os.path.join(TEX, "embroidery_height.png"), "Non-Color")
        eh.extension = "CLIP"
        eh.interpolation = "Cubic"
        L.new(comb.outputs["Vector"], eh.inputs["Vector"])
        wm = N.new("ShaderNodeMath"); wm.operation = "MULTIPLY"; wm.location = (-100, 1000)
        L.new(wave.outputs["Fac"], wm.inputs[0])
        L.new(eh.outputs["Color"], wm.inputs[1])
        hsum = N.new("ShaderNodeMath"); hsum.operation = "MULTIPLY_ADD"; hsum.location = (0, 900)
        L.new(wm.outputs[0], hsum.inputs[0])
        hsum.inputs[1].default_value = 0.10
        L.new(eh.outputs["Color"], hsum.inputs[2])
        bump2 = N.new("ShaderNodeBump"); bump2.location = (150, 900)
        bump2.inputs["Strength"].default_value = 1.0
        bump2.inputs["Distance"].default_value = 0.0011
        L.new(hsum.outputs[0], bump2.inputs["Height"])
        L.new(bump2.outputs["Normal"], thread.inputs["Normal"])
        mixs = N.new("ShaderNodeMixShader"); mixs.location = (650, 300)
        L.new(mask.outputs["Result"], mixs.inputs["Fac"])
        L.new(bsdf.outputs["BSDF"], mixs.inputs[1])
        L.new(thread.outputs["BSDF"], mixs.inputs[2])
        shader_out = mixs.outputs["Shader"]
    L.new(shader_out, out.inputs["Surface"])
    return m


def metal_material(name, relief=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    bsdf = N["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.62, 0.62, 0.64, 1)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.2
    if relief:
        tex = N.new("ShaderNodeTexImage"); tex.location = (-600, -200)
        tex.image = img(relief, "Non-Color")
        bump = N.new("ShaderNodeBump"); bump.location = (-300, -200)
        bump.inputs["Strength"].default_value = 0.25
        bump.inputs["Distance"].default_value = 0.0004
        L.new(tex.outputs["Color"], bump.inputs["Height"])
        L.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        # creux un peu plus mats / patinés
        rr = N.new("ShaderNodeMapRange"); rr.location = (-300, 100)
        rr.inputs["From Min"].default_value = 0.12
        rr.inputs["From Max"].default_value = 0.5
        rr.inputs["To Min"].default_value = 0.38
        rr.inputs["To Max"].default_value = 0.1
        L.new(tex.outputs["Color"], rr.inputs["Value"])
        L.new(rr.outputs["Result"], bsdf.inputs["Roughness"])
        col = N.new("ShaderNodeMapRange"); col.location = (-300, 300)
        col.inputs["From Min"].default_value = 0.12
        col.inputs["From Max"].default_value = 0.5
        col.inputs["To Min"].default_value = 0.16
        col.inputs["To Max"].default_value = 0.86
        L.new(tex.outputs["Color"], col.inputs["Value"])
        L.new(col.outputs["Result"], bsdf.inputs["Base Color"])
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


# =====================================================================  lights, camera, world

def setup_world_and_lights(scene):
    world = bpy.data.worlds.new("Monde")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.012, 0.010, 0.010, 1)
    bg.inputs["Strength"].default_value = 1.0

    rig = bpy.data.collections.new("Eclairage")
    scene.collection.children.link(rig)

    def area(name, loc, size, power, color, target=(0, 0, 0.33), shape="RECTANGLE", sy=None, cam_visible=False):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = power
        ld.color = color
        ld.shape = shape
        ld.size = size
        if sy:
            ld.size_y = sy
        ob = bpy.data.objects.new(name, ld)
        rig.objects.link(ob)
        ob.location = loc
        d = Vector(target) - Vector(loc)
        ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        ob.visible_camera = cam_visible
        return ob

    area("Key", (-1.6, -2.2, 1.7), 1.6, 300, (1.0, 0.97, 0.94), sy=1.2)
    area("Fill", (2.2, -2.0, 0.6), 2.0, 45, (0.85, 0.88, 1.0))
    area("Top", (0.0, -0.4, 2.4), 1.2, 90, (1.0, 0.95, 0.92))
    area("Rim_Rouge_G", (-1.25, 2.1, 0.9), 0.5, 420, (1.0, 0.10, 0.07), sy=1.6)
    area("Rim_Rouge_D", (1.35, 2.0, 0.5), 0.5, 380, (1.0, 0.12, 0.08), sy=1.6)
    area("Contre_Blanc", (0.0, 2.2, 1.6), 1.0, 120, (1.0, 0.9, 0.9))
    # panneaux à reflets pour le métal (invisibles à la caméra)
    for i, (loc, sz) in enumerate([((-0.9, -1.4, 0.9), 0.9), ((0.7, -1.2, 1.2), 0.5), ((0.0, -1.0, -0.6), 1.2)]):
        ld = bpy.data.lights.new(f"Reflet_{i}", "AREA")
        ld.energy = 10
        ld.size = sz
        ob = bpy.data.objects.new(f"Reflet_{i}", ld)
        rig.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = (Vector((0, 0, 0.35)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()


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
    c.max_bounces = 6
    c.diffuse_bounces = 2
    c.glossy_bounces = 3
    c.transmission_bounces = 2
    c.transparent_max_bounces = 4
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

def main():
    reset_scene()
    scene = bpy.context.scene
    garment = bpy.data.collections.new("Cardigan")
    scene.collection.children.link(garment)

    root = bpy.data.objects.new("Cardigan_Racine", None)  # pivot du turntable
    garment.objects.link(root)

    mat_knit = knit_material("Maille_Noire", stitch=0.0055, embroidery=True)
    mat_rib = knit_material("Cotes_Noires", bump_scale=0.6, stitch=0.0035)
    mat_btn = metal_material("Argent_Bouton", os.path.join(TEX, "button_relief.png"))
    mat_metal = metal_material("Argent_Poli")

    body = build_body(garment)
    body.data.materials.append(mat_knit)
    hem = build_hem(garment); hem.data.materials.append(mat_rib)
    cuffs = [build_cuff(garment, s) for s in (1, -1)]
    for c in cuffs:
        c.data.materials.append(mat_rib)
    collar, zb = build_collar(garment); collar.data.materials.append(mat_rib)
    z_front_collar = float(zb[3 * len(zb) // 4])  # pied de col devant (theta = -90°)
    placket = build_placket(garment, z_front_collar + 0.004)
    placket.data.materials.append(mat_rib)

    # Boutons & crochets (positions relevées sur la photo produit, en cm depuis le haut)
    top = 0.66
    btn_z = [top - 0.092, top - 0.370, top - 0.478, top - 0.594]
    clasp_z = [top - 0.169, top - 0.268]
    metal = []
    for i, z in enumerate(btn_z):
        y = placket_point(z)
        metal.append(build_button(garment, mat_btn, f"Bouton_Lycoris_{i + 1}", (0.0, y, z)))
    for i, z in enumerate(clasp_z):
        y = placket_point(z)
        metal.append(build_clasp(garment, mat_metal, f"Crochet_{i + 1}", (0.0, y, z)))

    try:
        label = build_label(garment, label_material())
        metal.append(label)
    except Exception as e:  # pragma: no cover
        print("étiquette ignorée :", e)

    for ob in [body, hem, collar, placket, *cuffs, *metal]:
        ob.parent = root

    setup_world_and_lights(scene)
    setup_camera(scene)
    setup_render(scene)
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, compress=True)
    print("OK ->", OUT_BLEND)


if __name__ == "__main__":
    main()
