"""Analyse le morceau de fond : tempo, beats, temps forts (mesures) et énergie par instant.
Écrit src/music.json, utilisé pour caler les coupes et les pulsations sur la musique.
Usage : python3 scripts/analyze_music.py public/music/tesla.mp3"""
import json, sys, os
import numpy as np, librosa
path = sys.argv[1]
y, sr = librosa.load(path, sr=22050, mono=True)
dur = len(y) / sr
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time', tightness=120)
tempo = float(np.atleast_1d(tempo)[0])
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
hop = 512
# énergie (RMS) et graves, normalisées, échantillonnées à 120 points par seconde
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
bass = S[(freqs >= 30) & (freqs <= 160)].mean(axis=0)
t_frames = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
grid = np.arange(0, dur, 1 / 120)
def norm(x):
    x = np.interp(grid, t_frames[:len(x)], x)
    lo, hi = np.percentile(x, 5), np.percentile(x, 98)
    return np.clip((x - lo) / (hi - lo + 1e-9), 0, 1)
energy = norm(rms); low = norm(bass)
# force de chaque beat (enveloppe d'attaque) pour repérer les temps forts
on_t = librosa.times_like(onset_env, sr=sr)
strength = [float(np.interp(b, on_t, onset_env)) for b in beats]
# temps forts : on cherche la phase (0..3) qui maximise la force moyenne
phase = int(np.argmax([np.mean(strength[p::4]) if len(strength[p::4]) else 0 for p in range(4)]))
downbeats = [float(b) for b in beats[phase::4]]
# sections : moyenne d'énergie par mesure
sections = [{"t": round(d, 3), "e": round(float(energy[min(len(energy) - 1, int(d * 120))]), 3)} for d in downbeats]
out = {"file": "music/" + os.path.basename(path), "duration": round(dur, 3), "bpm": round(tempo, 2),
       "beats": [round(float(b), 3) for b in beats], "downbeats": [round(d, 3) for d in downbeats],
       "energy": [round(float(v), 3) for v in energy[::2]], "bass": [round(float(v), 3) for v in low[::2]], "rate": 60}
json.dump(out, open("src/music.json", "w"), separators=(",", ":"))
print("durée", round(dur, 1), "s · tempo", round(tempo, 1), "BPM ·", len(beats), "beats ·", len(downbeats), "mesures")
print("premiers beats", [round(float(b), 2) for b in beats[:12]])
print("énergie par tranche de 8 s :", [round(float(energy[int(i * 120):int((i + 8) * 120)].mean()), 2) for i in range(0, int(dur), 8)])
