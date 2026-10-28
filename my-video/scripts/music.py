"""Musique de fond originale, synthétisée (aucun échantillon externe) : nappes, basse, arpège, beat doux.
Usage : python3 scripts/music.py <durée en secondes>  → public/music/background.mp3"""
import numpy as np, subprocess, sys, os, wave
SR = 44100
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 120
BPM = 100.0; BEAT = 60 / BPM; BAR = 4 * BEAT
N = int(DUR * SR); t = np.arange(N) / SR
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
# Progression (IV – V – iii – vi en do majeur, voicings ouverts), 2 mesures par accord
CH = [[53, 57, 60, 64, 67], [55, 59, 62, 65, 69], [52, 55, 59, 62, 67], [57, 60, 64, 67, 71]]
ROOT = [41, 43, 40, 45]
chord_len = 2 * BAR
def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus
    ai = min(n, int(a * SR)); e[:ai] = np.linspace(0, sus, ai)
    ri = min(n, int(r * SR)); e[n - ri:] *= np.linspace(1, 0, ri)
    return e
def saw(f, tt): return 2 * ((f * tt) % 1) - 1
def lowpass(x, fc, q=0.0):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 4); return np.fft.irfft(X, len(x))
def highpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4); return np.fft.irfft(X, len(x))
pad = np.zeros(N); bass = np.zeros(N); arp = np.zeros(N); drums = np.zeros(N)
i = 0; pos = 0.0
while pos < DUR:
    ch = CH[i % 4]; s0 = int(pos * SR); n = min(N - s0, int((chord_len + 1.2) * SR))
    if n <= 0: break
    tt = np.arange(n) / SR
    e = env(n, 0.9, 1.6)
    for m in ch:
        for det in (-0.08, 0, 0.08):
            pad[s0:s0 + n] += saw(hz(m + det), tt + rng.random()) * e * 0.05
    # basse : noires pointées sur la fondamentale
    for k, off in enumerate([0, 1.5, 2.5, 4, 5.5, 6.5]):
        bs = s0 + int(off * BEAT * SR); bn = min(N - bs, int(0.9 * BEAT * SR))
        if bn <= 0: continue
        bt = np.arange(bn) / SR; f = hz(ROOT[i % 4] - 12 + (7 if k in (2, 5) else 0))
        bass[bs:bs + bn] += (np.sin(2 * np.pi * f * bt) + 0.3 * np.sin(4 * np.pi * f * bt)) * np.exp(-bt * 3.2) * env(bn, 0.005, 0.05) * 0.42
    # arpège en croches
    notes = ch[1:] + [ch[2] + 12]
    for k in range(16):
        as_ = s0 + int(k * BEAT / 2 * SR); an = min(N - as_, int(0.7 * SR))
        if an <= 0: continue
        at = np.arange(an) / SR; f = hz(notes[(k * 3) % len(notes)] + 12)
        arp[as_:as_ + an] += (np.sin(2 * np.pi * f * at) + 0.25 * np.sin(6 * np.pi * f * at)) * np.exp(-at * 7) * env(an, 0.003, 0.05) * 0.11
    pos += chord_len; i += 1
# batterie douce (kick, clap, charleston)
kick_env = np.zeros(N)
b = 0
while b * BEAT < DUR:
    s0 = int(b * BEAT * SR)
    if b % 4 in (0, 2) or (b % 8 == 7):
        kn = min(N - s0, int(0.45 * SR)); kt = np.arange(kn) / SR
        f = 45 + 75 * np.exp(-kt * 28); ph = 2 * np.pi * np.cumsum(f) / SR
        drums[s0:s0 + kn] += np.sin(ph) * np.exp(-kt * 7) * 0.75
        kick_env[s0:s0 + int(0.32 * SR)] = np.maximum(kick_env[s0:s0 + int(0.32 * SR)], np.linspace(1, 0, len(kick_env[s0:s0 + int(0.32 * SR)])) ** 1.6)
    if b % 4 in (1, 3):
        cn = min(N - s0, int(0.25 * SR)); ct = np.arange(cn) / SR
        drums[s0:s0 + cn] += rng.standard_normal(cn) * np.exp(-ct * 22) * 0.16
    for h in (0, 0.5):
        hs = s0 + int(h * BEAT * SR); hn = min(N - hs, int(0.06 * SR))
        if hn > 0: drums[hs:hs + hn] += rng.standard_normal(hn) * np.exp(-np.arange(hn) / SR * 70) * (0.05 if h else 0.035)
    b += 1
pad = lowpass(pad, 1700); arp = lowpass(arp, 5000); bass = lowpass(bass, 900)
hat_clap = highpass(drums, 160)
duck = 1 - 0.45 * kick_env
# arrangement : intro (nappes seules), corps complet, final apaisé
def ramp(a, b, c, d):
    g = np.interp(t, [0, a, b, c, d, DUR], [0, 1, 1, 1, 0, 0]); return g
intro_end = 2 * BAR * 2           # 4 mesures d'intro
g_drums = np.clip((t - intro_end) / 2, 0, 1) * np.clip((DUR - 10 - t) / 3, 0, 1)
g_bass = np.clip((t - intro_end + 4) / 3, 0, 1) * np.clip((DUR - 6 - t) / 3, 0, 1)
g_arp = np.clip((t - 3) / 4, 0, 1)
master = np.clip(t / 3, 0, 1) * np.clip((DUR - t) / 4, 0, 1)
mix = (pad * duck * 0.9 + arp * duck * g_arp + bass * g_bass + hat_clap * g_drums) * master
mix /= np.max(np.abs(mix)) + 1e-9; mix *= 0.89
st = np.stack([mix, np.roll(mix, int(0.012 * SR)) * 0.96 + mix * 0.04], axis=1)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(root, 'public', 'music'), exist_ok=True)
wav = os.path.join(root, 'scripts', 'music.wav')
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
mp3 = os.path.join(root, 'public', 'music', 'background.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'aecho=0.8:0.6:90|150|230:0.22|0.16|0.1,loudnorm=I=-18:TP=-1.5:LRA=9', '-b:a', '192k', mp3], check=True)
os.remove(wav); print('ok', mp3, DUR, 's')
