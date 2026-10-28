"""Cale les scènes sur la musique : chaque coupe tombe sur un temps (grille d'une demi-mesure),
le logo de l'intro explose sur le premier drop, et le final sur un drop après un silence.
Écrit src/schedule.json. Usage : python3 scripts/schedule.py"""
import json, numpy as np
voice = {v["id"]: v for v in json.load(open("src/voiceover.json", encoding="utf-8"))}
order = [v["id"] for v in json.load(open("src/voiceover.json", encoding="utf-8"))]
m = json.load(open("src/music.json"))
beats = np.array(m["beats"]); down = np.array(m["downbeats"])
beat = float(np.median(np.diff(beats)))
# grille : temps forts + milieux de mesure
i0 = int(np.argmin(abs(beats - down[0])))
grid = beats[i0 % 2::2]
DROPS = [8.67, 19.57, 28.35, 55.92, 89.08, 107.08, 125.95, 136.85]
T = beat                      # transition = 1 temps
LEAD, TAIL = T + 0.18, 0.28   # la voix démarre juste après la transition
snap = lambda t: float(grid[grid >= t - 1e-6][0])

slam_intro = DROPS[0]
plan = [{"id": "intro", "start": 0.0, "lead": 1.0, "slam": slam_intro}]
cur = snap(slam_intro + 2.4)
body = order[1:-1]
starts = {}
for sid in body:
    starts[sid] = cur
    cur = snap(cur + LEAD + voice[sid]["seconds"] + TAIL)
end_body = cur                # moment où l'outro pourrait commencer au plus tôt
# final : drop précédé d'un silence (on commence l'outro ~2,4 s avant)
for d in DROPS:
    out_start = snap(d - 2.5)
    if out_start >= end_body - 1e-6 and d > 100:
        slam_outro = d; break
slack = out_start - end_body
# répartir le temps restant (par pas de grille) entre les scènes les plus visuelles
prio = ["dashboard", "modeles", "accueil", "services", "finance", "recrutement", "createurs", "formation", "formules", "lecture", "mobile"]
steps = int(round(slack / (2 * beat)))
extra = {s: 0 for s in body}
for k in range(steps): extra[prio[k % len(prio)]] += 1
cur = snap(slam_intro + 2.4)
for sid in body:
    plan.append({"id": sid, "start": round(cur, 3), "lead": round(LEAD, 3)})
    cur = snap(cur + LEAD + voice[sid]["seconds"] + TAIL + extra[sid] * 2 * beat)
out_start = max(cur, out_start)
plan.append({"id": "outro", "start": round(out_start, 3), "lead": round(slam_outro - out_start + 0.35, 3), "slam": round(slam_outro - out_start, 3)})
for p in plan: p["voice"] = voice[p["id"]]["seconds"]
for a, b in zip(plan, plan[1:]): a["dur"] = round(b["start"] - a["start"] + T, 3)
plan[-1]["dur"] = round(plan[-1]["slam"] + 6.2, 3)
total = plan[-1]["start"] + plan[-1]["dur"]
json.dump({"T": round(T, 4), "beat": round(beat, 4), "total": round(total, 3), "scenes": plan}, open("src/schedule.json", "w"), indent=1)
print("battement", round(beat, 3), "s · transition", round(T, 3), "s · marge répartie", round(slack, 2), "s")
for p in plan: print(f'{p["id"]:12s} début {p["start"]:7.2f}  durée {p["dur"]:6.2f}  voix {p["voice"]:5.2f}', ("slam +%.2f" % p["slam"]) if "slam" in p else "")
print("total", round(total, 2), "s")
