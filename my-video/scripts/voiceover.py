"""Génère la voix off (Kokoro, voix française ff_siwis, en local) et src/voiceover.json avec la durée de chaque scène.
Usage : python3 scripts/voiceover.py <dossier contenant kokoro-v1.0.onnx et voices-v1.0.bin>"""
import json, subprocess, sys, os
import soundfile as sf
from kokoro_onnx import Kokoro

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
models = sys.argv[1]
k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
scenes = json.load(open(os.path.join(root, "scripts", "script.json"), encoding="utf-8"))
out = []
for s in scenes:
    samples, sr = k.create(s["text"], voice="ff_siwis", speed=1.04, lang="fr-fr")
    wav = os.path.join(root, "scripts", s["id"] + ".wav")
    sf.write(wav, samples, sr)
    mp3 = os.path.join(root, "public", "voiceover", s["id"] + ".mp3")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", "44100", "-b:a", "192k", mp3], check=True)
    os.remove(wav)
    out.append({"id": s["id"], "title": s["title"], "text": s["text"], "file": "voiceover/" + s["id"] + ".mp3", "seconds": round(len(samples) / sr, 3)})
    print(s["id"], out[-1]["seconds"], "s")
json.dump(out, open(os.path.join(root, "src", "voiceover.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("total", round(sum(x["seconds"] for x in out), 1), "s")
