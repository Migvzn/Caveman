"""Rendus du cardigan Fadiye (séquences PNG transparentes pour Remotion).

Usage :
  python render_shots.py <plan> [--frames a:b] [--res 1080] [--samples 48] [--out dossier] [--still]

Plans : turntable, broderie, boutons, col, hero, face, dos
"""
import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
BLEND = os.path.join(HERE, "cardigan_fadiye.blend")

ap = argparse.ArgumentParser()
ap.add_argument("shot")
ap.add_argument("--frames", default=None)
ap.add_argument("--res", type=int, default=1080)
ap.add_argument("--resy", type=int, default=None)
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--out", default=os.path.join(HERE, "renders"))
ap.add_argument("--still", type=int, default=None, help="rend une seule image (n° de frame)")
ap.add_argument("--threads", type=int, default=0)
ap.add_argument("--step", type=int, default=1)
args = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])

bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
cam = scene.camera
root = bpy.data.objects["Cardigan_Racine"]
scene.cycles.samples = args.samples
scene.render.resolution_x = args.res
scene.render.resolution_y = args.resy or args.res
if args.threads:
    scene.render.threads_mode = "FIXED"
    scene.render.threads = args.threads

CENTER = Vector((0, 0, 0.335))


def look_at(obj, target, roll=0.0):
    d = Vector(target) - obj.location
    q = d.to_track_quat("-Z", "Y")
    obj.rotation_euler = q.to_euler()
    if roll:
        obj.rotation_euler.rotate_axis("Z", roll)


def ease(t):
    return t * t * (3 - 2 * t)


def ease_io(t):  # sinus in-out
    return 0.5 - 0.5 * math.cos(math.pi * t)


SHOTS = {}


def shot(name, n):
    def deco(fn):
        SHOTS[name] = (fn, n)
        return fn
    return deco


@shot("turntable", 150)
def turntable(f, n):
    t = f / n
    root.rotation_euler = (0, 0, 2 * math.pi * t)
    cam.data.lens = 112
    cam.location = (0, -3.55, 0.62)
    look_at(cam, CENTER + Vector((0, 0, 0.01)))


@shot("face", 1)
def face(f, n):
    root.rotation_euler = (0, 0, 0)
    cam.data.lens = 112
    cam.location = (0, -3.55, 0.62)
    look_at(cam, CENTER + Vector((0, 0, 0.01)))


@shot("trois_quarts", 1)
def trois_quarts(f, n):
    root.rotation_euler = (0, 0, math.radians(-40))
    cam.data.lens = 112
    cam.location = (0, -3.55, 0.62)
    look_at(cam, CENTER + Vector((0, 0, 0.01)))


@shot("dos", 1)
def dos(f, n):
    root.rotation_euler = (0, 0, math.pi)
    cam.data.lens = 112
    cam.location = (0, -3.55, 0.62)
    look_at(cam, CENTER + Vector((0, 0, 0.01)))


@shot("hero", 96)
def hero(f, n):
    """Contre-plongée, lent travelling avant + légère rotation du vêtement."""
    t = ease_io(f / (n - 1))
    root.rotation_euler = (0, 0, math.radians(-28 + 40 * t))
    cam.data.lens = 50
    d = 2.25 - 0.35 * t
    cam.location = (0.15, -d, 0.10 + 0.05 * t)
    look_at(cam, CENTER + Vector((0, 0, 0.03)))


@shot("broderie", 90)
def broderie(f, n):
    """Gros plan : la caméra descend le long de la broderie."""
    t = ease_io(f / (n - 1))
    root.rotation_euler = (0, 0, math.radians(-14 + 6 * t))
    cam.data.lens = 70
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 4.0
    z = 0.52 - 0.36 * t
    target = Vector((0.12, -0.11, z))
    cam.location = target + Vector((0.18, -0.78, 0.05))
    cam.data.dof.focus_distance = (cam.location - target).length
    look_at(cam, target, roll=math.radians(-4))


@shot("boutons", 90)
def boutons(f, n):
    """Macro sur la patte : bouton Lycoris puis crochets."""
    t = ease_io(f / (n - 1))
    root.rotation_euler = (0, 0, math.radians(18 - 10 * t))
    cam.data.lens = 100
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 2.8
    z = 0.575 - 0.20 * t
    target = Vector((0.004, -0.13, z))
    cam.location = target + Vector((-0.12, -0.42, 0.06))
    cam.data.dof.focus_distance = (cam.location - target).length
    look_at(cam, target)


@shot("macro_bouton", 90)
def macro_bouton(f, n):
    """Très gros plan sur un bouton Lycoris (le 2e, sous les crochets)."""
    t = ease_io(f / (n - 1))
    root.rotation_euler = (0, 0, 0)
    cam.data.lens = 100
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 5.6
    btn = bpy.data.objects["Bouton_Lycoris_2"].matrix_world.translation
    target = Vector(btn)
    a = math.radians(-22 + 30 * t)
    r = 0.15 - 0.02 * t
    cam.location = target + Vector((r * math.sin(a), -r * math.cos(a), 0.035 - 0.02 * t))
    cam.data.dof.focus_distance = (cam.location - target).length
    look_at(cam, target)


@shot("col", 90)
def col(f, n):
    """Vue plongeante 3/4 sur le col et l'étiquette."""
    t = ease_io(f / (n - 1))
    root.rotation_euler = (0, 0, math.radians(-25 + 30 * t))
    cam.data.lens = 60
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 4.0
    target = Vector((0.0, 0.02, 0.60))
    ang = math.radians(-100 + 25 * t)
    r = 0.62
    cam.location = target + Vector((r * math.cos(ang) * 0.5, r * math.sin(ang), 0.52 - 0.06 * t))
    cam.data.dof.focus_distance = (cam.location - target).length
    look_at(cam, target)


fn, n = SHOTS[args.shot]
os.makedirs(os.path.join(args.out, args.shot), exist_ok=True)

if args.still is not None:
    fn(args.still, n)
    scene.render.filepath = os.path.join(args.out, f"{args.shot}_still_{args.still:04d}.png")
    bpy.ops.render.render(write_still=True)
    print("still ->", scene.render.filepath)
else:
    a, b = (0, n - 1)
    if args.frames:
        a, b = [int(x) for x in args.frames.split(":")]
    for f in range(a, b + 1, args.step):
        path = os.path.join(args.out, args.shot, f"{f:04d}.png")
        if os.path.exists(path):
            continue
        fn(f, n)
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print(f"[{args.shot}] {f}/{n - 1}", flush=True)
