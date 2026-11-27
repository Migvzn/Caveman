"""Bande-son originale de la vidéo Fadiye (générée, libre de droits).

Nappe mélancolique en ré mineur, notes de piano sur le manifeste, impact grave à la
révélation du cardigan, rythmique lente et feutrée (≈69 BPM) pendant le produit,
puis résolution sur la signature.  Calée sur le montage Remotion (30 i/s).

    python compose_ambiance.py  ->  public/audio/ambiance.wav
"""
import os
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
from scipy.io import wavfile

SR = 48000
FPS = 30
TOTAL_FRAMES = 1338
DUR = TOTAL_FRAMES / FPS + 0.2
N = int(DUR * SR)
rng = np.random.default_rng(7)

# repères du montage (en secondes)
S2 = 130 / FPS          # manifeste
PANELS = [S2, S2 + 96 / FPS, S2 + 192 / FPS]
REVEAL = 418 / FPS      # apparition du cardigan
DETAILS = 672 / FPS
FICHE = 978 / FPS
SIGN = 1158 / FPS
BEAT = 26 / FPS         # 69,2 BPM


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def t_arr(dur):
    return np.arange(int(dur * SR)) / SR


def place(buf, sig, start, gain=1.0):
    i = int(start * SR)
    if i >= buf.shape[0]:
        return
    j = min(buf.shape[0], i + sig.shape[0])
    buf[i:j] += sig[: j - i] * gain


def env_adsr(n, a, r, sustain_len):
    t = np.arange(n) / SR
    e = np.clip(t / a, 0, 1)
    rel_start = sustain_len
    e *= np.where(t > rel_start, np.exp(-(t - rel_start) / r), 1.0)
    return e


def lowpass(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), btype="low", output="sos")
    return sosfilt(sos, x, axis=0)


def highpass(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, x, axis=0)


def bandpass(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, x, axis=0)


# ------------------------------------------------------------------ instruments

def pad_note(freq, dur, bright=1.0):
    """Nappe : partiels de dent de scie adoucis, désaccordés, stéréo."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for ch, det in enumerate([-0.006, 0.006]):
        for v in (-1, 0, 1):
            f = freq * (1 + det * v * 0.7)
            ph = rng.uniform(0, 2 * np.pi)
            vib = 0.0015 * np.sin(2 * np.pi * (0.18 + 0.05 * v) * t + ph)
            for k in range(1, 14):
                if f * k > 5000:
                    break
                amp = (1 / k) * np.exp(-k / (3.5 * bright))
                out[:, ch] += amp * np.sin(2 * np.pi * f * k * t * (1 + vib) + ph * k)
    return out / 6


def piano_note(freq, dur=4.0, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    B = 0.0004
    for k in range(1, 10):
        fk = freq * k * np.sqrt(1 + B * k * k)
        decay = 2.8 / (1 + 0.45 * k) * (1.0 if freq < 400 else 0.7)
        s += (0.9 ** k) / k ** 0.8 * np.sin(2 * np.pi * fk * t) * np.exp(-t / decay)
    att = np.clip(t / 0.004, 0, 1)
    click = rng.normal(size=n) * np.exp(-t / 0.006) * 0.08
    s = (s * att + click) * vel
    s = lowpass(s, 4200)
    st = np.stack([s * 0.95, s], 1)
    return st


def bell(freq, dur=5.0, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod = 2.0 * np.exp(-t / 1.2) * np.sin(2 * np.pi * freq * 3.5 * t)
    s = np.sin(2 * np.pi * freq * t + mod) * np.exp(-t / 1.8) * vel
    s *= np.clip(t / 0.01, 0, 1)
    pan = rng.uniform(0.3, 0.7)
    return np.stack([s * (1 - pan), s * pan], 1) * 2


def kick(vel=1.0):
    t = t_arr(0.7)
    f = 48 + 90 * np.exp(-t / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 0.32) * vel
    s += rng.normal(size=t.size) * np.exp(-t / 0.004) * 0.15
    s = np.tanh(s * 1.4)
    return np.stack([s, s], 1)


def snap(vel=1.0):
    t = t_arr(0.5)
    noise = rng.normal(size=t.size)
    s = bandpass(noise, 900, 5200) * (np.exp(-t / 0.05) + 0.4 * np.exp(-((t - 0.012) / 0.006) ** 2))
    s += np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.03) * 0.4
    return np.stack([s, s], 1) * vel * 0.8


def hat(vel=1.0, open_=False):
    t = t_arr(0.35 if open_ else 0.08)
    s = highpass(rng.normal(size=t.size), 7000, 4) * np.exp(-t / (0.09 if open_ else 0.018))
    pan = rng.uniform(0.35, 0.65)
    return np.stack([s * (1 - pan), s * pan], 1) * vel * 0.5


def sub_boom(dur=4.5):
    t = t_arr(dur)
    f = 32 + 40 * np.exp(-t / 0.25)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 1.4)
    s += lowpass(rng.normal(size=t.size), 300) * np.exp(-t / 0.35) * 0.6
    s = np.tanh(s * 1.6)
    return np.stack([s, s], 1)


def riser(dur=1.6):
    t = t_arr(dur)
    noise = rng.normal(size=(t.size, 2))
    e = (t / dur) ** 2.5
    s = np.zeros_like(noise)
    # balayage de filtre par blocs
    blocks = 16
    for b in range(blocks):
        a, z = b * t.size // blocks, (b + 1) * t.size // blocks
        fc = 400 + 7000 * (b / blocks) ** 2
        s[a:z] = bandpass(noise[a:z], fc * 0.6, min(fc * 1.6, 20000))
    return s * e[:, None] * 0.7


# ------------------------------------------------------------------ arrangement

dry = np.zeros((N, 2))
pads = np.zeros((N, 2))
drums = np.zeros((N, 2))

# Progression : Dm9 – Bbmaj9 – Gm9 – A7sus4   (voicings graves)
CHORDS = {
    "Dm9": [38, 50, 53, 57, 60, 64],
    "Bbmaj9": [34, 46, 50, 53, 57, 60],
    "Gm9": [31, 43, 46, 50, 53, 57],
    "Asus": [33, 45, 50, 52, 55, 57],
    "Fmaj7": [29, 41, 48, 52, 55, 57],
}

pad_plan = [
    (0.0, 4.6, "Dm9", 0.55),
    (4.33, 3.3, "Dm9", 0.8),
    (7.53, 3.3, "Bbmaj9", 0.8),
    (10.73, 3.3, "Gm9", 0.85),
]
# section produit : boucle de 4 mesures
bar = 4 * BEAT
prog = ["Dm9", "Bbmaj9", "Gm9", "Asus"]
tt = REVEAL
i = 0
while tt < SIGN - 0.1:
    pad_plan.append((tt, bar, prog[i % 4], 1.0))
    tt += bar
    i += 1
pad_plan.append((SIGN, DUR - SIGN, "Dm9", 0.9))

for start, length, name, bright in pad_plan:
    dur = length + 2.5
    for k, m in enumerate(CHORDS[name]):
        note = pad_note(midi(m), dur, bright)
        e = env_adsr(note.shape[0], 1.1 if start < 1 else 0.5, 1.4, length)
        g = 0.5 if k == 0 else 0.32
        place(pads, note * e[:, None], start, g)

pads = lowpass(pads, 1800)
pads[: int(REVEAL * SR)] = lowpass(pads[: int(REVEAL * SR)], 1100)

# cloches : la fleur qui pousse (ouverture) et la signature
for k, (tm, m) in enumerate([(0.5, 81), (1.2, 76), (1.9, 74), (2.6, 77), (3.4, 69)]):
    place(dry, bell(midi(m), 5.0, 0.18), tm)
for k, (tm, m) in enumerate([(SIGN + 0.2, 81), (SIGN + 0.9, 77), (SIGN + 1.6, 74), (SIGN + 2.6, 72), (SIGN + 3.4, 69)]):
    place(dry, bell(midi(m), 5.0, 0.16), tm)

# piano : une phrase par mot du manifeste
phrases = [
    [(0.0, 69, 0.55), (0.9, 72, 0.4), (1.8, 76, 0.45), (2.6, 74, 0.35)],
    [(0.0, 70, 0.5), (0.9, 74, 0.4), (1.8, 77, 0.45), (2.6, 76, 0.35)],
    [(0.0, 67, 0.5), (0.9, 70, 0.4), (1.8, 74, 0.45), (2.5, 72, 0.4)],
]
bass_notes = [50, 46, 43]
for p0, ph, bn in zip(PANELS, phrases, bass_notes):
    place(dry, piano_note(midi(bn), 4.5, 0.55), p0)
    for dt, m, v in ph:
        place(dry, piano_note(midi(m), 4.0, v), p0 + dt)

# piano pendant le produit : motif lent, une note par temps fort
motif = [74, 72, 69, 72, 77, 76, 74, 69]
tt, k = REVEAL + 2 * bar, 0
while tt < FICHE:
    place(dry, piano_note(midi(motif[k % len(motif)]), 3.5, 0.28), tt)
    tt += 2 * BEAT
    k += 1
# accord final
for m in [50, 57, 62, 65, 69]:
    place(dry, piano_note(midi(m), 7.0, 0.35), SIGN + 0.05)

# impact de révélation
place(dry, riser(1.5), REVEAL - 1.5, 0.35)
place(dry, sub_boom(5.0), REVEAL, 0.9)

# rythmique feutrée (demi-temps) de la révélation jusqu'à la signature
tt = REVEAL
beat_i = 0
while tt < SIGN - 0.05:
    pos = beat_i % 8  # 2 mesures de 4 temps
    fade = 1.0 if tt < FICHE else 0.65
    if beat_i >= 4:  # la batterie entre après une mesure
        if pos in (0, 5):
            place(drums, kick(0.95 * fade), tt)
        if pos == 6 and (beat_i // 8) % 2 == 1:
            place(drums, kick(0.6 * fade), tt + BEAT * 0.5)
        if pos in (2, 6):
            place(drums, snap(0.55 * fade), tt)
        for h in range(2):
            vel = (0.32 if h == 0 else 0.2) * fade
            place(drums, hat(vel), tt + h * BEAT / 2)
        if pos == 7 and (beat_i // 8) % 2 == 0:
            for h in range(4):
                place(drums, hat(0.14 * fade), tt + BEAT / 2 + h * BEAT / 8)
    tt += BEAT
    beat_i += 1

# ------------------------------------------------------------------ espace & mix

def reverb(x, seconds=3.2, mix=0.35, pre=0.02):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.normal(size=(n, 2)) * np.exp(-t / (seconds / 6.5))[:, None]
    ir = lowpass(ir, 6000)
    ir[: int(pre * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True))
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[: x.shape[0]] for c in range(2)], 1)
    return x * (1 - mix) + wet * mix * 2.2


mix = reverb(pads, 4.0, 0.45) * 0.55 + reverb(dry, 3.4, 0.4) * 0.8 + reverb(drums, 1.4, 0.18) * 0.62
mix = highpass(mix, 28)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 10 ** (-1.0 / 20)
fade_n = int(1.5 * SR)
mix[-fade_n:] *= np.linspace(1, 0, fade_n)[:, None]

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "audio", "ambiance.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok ->", os.path.abspath(out), f"{DUR:.1f}s")
