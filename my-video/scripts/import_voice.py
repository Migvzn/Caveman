"""Importe une voix off enregistrée par une vraie personne (téléphone, micro…).

Deux façons d'enregistrer :
  1) Une seule prise : tout le texte d'affilée, avec ~2 secondes de silence entre les paragraphes.
     Les reprises sont acceptées : on recommence le paragraphe après une pause, la dernière version est gardée.
       python3 scripts/import_voice.py prise.m4a [--asr <dossier modèle whisper sherpa-onnx>]
  2) Un fichier par paragraphe, nommés 01…13 (ou par identifiant : intro, accueil…) :
       python3 scripts/import_voice.py dossier/

Le son est nettoyé (bruit de fond, grave parasite, niveau, silences au début et à la fin),
écrit dans public/voiceover/<id>.mp3, puis src/voiceover.json et src/schedule.json sont recalculés :
la vidéo se recale automatiquement sur la musique avec la nouvelle durée de chaque phrase."""
import json, os, re, subprocess, sys, unicodedata, difflib
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = json.load(open(os.path.join(ROOT, "scripts", "script.json"), encoding="utf-8"))
IDS = [s["id"] for s in SCRIPT]
SR = 16000
CLEAN = "highpass=f=80,afftdn=nf=-28,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=160,loudnorm=I=-16:TP=-1.5:LRA=7"
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse"

def readable(t):  # texte tel qu'il doit être lu (sans graphies phonétiques)
    return t.replace("Vaïnora Haouce", "VAYNORA House").replace("O F M", "OFM").replace("tchatteurs", "chatters").replace("Tchatteurs", "Chatters")

def norm(t):
    t = unicodedata.normalize("NFD", readable(t).lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]+", " ", t).split()

def pcm(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768

def speech_regions(x, min_gap=1.3, min_len=0.6):
    hop = int(0.02 * SR)
    n = len(x) // hop
    db = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-6)
    lo, hi = np.percentile(db, 10), np.percentile(db, 95)
    voiced = db > lo + 0.33 * (hi - lo)
    regs, start, last = [], None, None
    for i, v in enumerate(voiced):
        t = i * 0.02
        if v:
            if start is None: start = t
            elif t - last > min_gap: regs.append((start, last)); start = t
            last = t
    if start is not None: regs.append((start, last))
    return [(a, b + 0.02) for a, b in regs if b - a >= min_len]

def asr_texts(x, regs, model):
    import sherpa_onnx
    m = model.rstrip("/") + "/"
    name = [f for f in os.listdir(m) if f.endswith("-encoder.int8.onnx")][0].replace("-encoder.int8.onnx", "")
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=m + name + "-encoder.int8.onnx", decoder=m + name + "-decoder.int8.onnx", tokens=m + name + "-tokens.txt", language="fr", task="transcribe", num_threads=4)
    out = []
    for a, b in regs:
        seg = x[int(a * SR): int(b * SR)]
        texts = []
        for k in range(0, len(seg), 28 * SR):
            s = rec.create_stream(); s.accept_waveform(SR, seg[k: k + 28 * SR]); rec.decode_stream(s); texts.append(s.result.text)
        out.append(" ".join(texts))
    return out

def match(regs, texts):
    """Associe chaque paragraphe à une suite de segments consécutifs (ordre respecté, reprises ignorées)."""
    P, N = len(IDS), len(regs)
    para = [norm(s["text"]) for s in SCRIPT]
    seg = [norm(t) for t in texts]
    def score(j, a, b):
        words = sum(seg[a:b + 1], [])
        return difflib.SequenceMatcher(None, para[j], words).ratio() + 0.002 * b  # à score égal, on préfère la dernière prise
    NEG = -1e9
    best = [[NEG] * (N + 1) for _ in range(P + 1)]; back = [[None] * (N + 1) for _ in range(P + 1)]
    for i in range(N + 1): best[0][i] = 0
    for j in range(1, P + 1):
        for i in range(1, N + 1):
            # le paragraphe j se termine au segment i-1 (span de 1 à 3 segments) ; ou le segment i-1 est ignoré
            cand = [(best[j][i - 1], ("skip",))]
            for L in range(1, 4):
                a = i - L
                if a < 0: break
                if best[j - 1][a] > NEG: cand.append((best[j - 1][a] + score(j - 1, a, i - 1), ("span", a, i - 1)))
            best[j][i], back[j][i] = max(cand, key=lambda c: c[0])
    spans, j, i = [None] * P, P, N
    while j > 0 and i > 0:
        op = back[j][i]
        if op[0] == "skip": i -= 1
        else: spans[j - 1] = (op[1], op[2]); i = op[1]; j -= 1
    return spans

def export(src, dst, a=None, b=None):
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    if a is not None: cmd += ["-ss", f"{max(0, a - 0.15):.3f}", "-to", f"{b + 0.3:.3f}"]
    cmd += ["-i", src, "-af", CLEAN + "," + TRIM, "-ar", "44100", "-ac", "1", "-b:a", "192k", dst]
    subprocess.run(cmd, check=True)

def duration(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)

def main():
    args = sys.argv[1:]
    asr = None
    if "--asr" in args: k = args.index("--asr"); asr = args[k + 1]; args = args[:k] + args[k + 2:]
    src = args[0]
    outdir = os.path.join(ROOT, "public", "voiceover"); os.makedirs(outdir, exist_ok=True)
    if os.path.isdir(src):
        files = sorted(f for f in os.listdir(src) if re.search(r"\.(m4a|mp3|wav|aac|ogg|opus|mp4|caf|flac|webm)$", f, re.I))
        found = {}
        for f in files:
            base = os.path.splitext(f)[0].lower()
            num = re.match(r"\s*(\d{1,2})", base)
            sid = next((i for i in IDS if i in base), None) or (IDS[int(num.group(1)) - 1] if num and 1 <= int(num.group(1)) <= len(IDS) else None)
            if sid: found[sid] = os.path.join(src, f)
        missing = [i for i in IDS if i not in found]
        if missing: sys.exit("Fichiers manquants pour : " + ", ".join(missing))
        for sid in IDS: export(found[sid], os.path.join(outdir, sid + ".mp3")); print("✓", sid)
    else:
        x = pcm(src)
        regs = speech_regions(x)
        print(len(regs), "passages détectés dans la prise")
        if len(regs) == len(IDS) and not asr:
            spans = [(i, i) for i in range(len(IDS))]
        else:
            if not asr: sys.exit(f"{len(regs)} passages au lieu de {len(IDS)} : relancez avec --asr <modèle whisper> pour reconnaître les paragraphes (reprises).")
            texts = asr_texts(x, regs, asr)
            spans = match(regs, texts)
            for k, (a, b) in enumerate(regs): print(f"  segment {k:2d} {a:7.2f}-{b:7.2f}s : {texts[k][:70]}")
        for sid, sp in zip(IDS, spans):
            if sp is None: sys.exit("Paragraphe introuvable dans la prise : " + sid)
            a, b = regs[sp[0]][0], regs[sp[1]][1]
            export(src, os.path.join(outdir, sid + ".mp3"), a, b)
            print(f"✓ {sid:12s} ← segments {sp[0]}–{sp[1]}  ({a:.2f}–{b:.2f} s)")
    vo = [{"id": s["id"], "title": s["title"], "text": s["text"], "file": "voiceover/" + s["id"] + ".mp3", "seconds": round(duration(os.path.join(outdir, s["id"] + ".mp3")), 3), "voice": "humaine"} for s in SCRIPT]
    json.dump(vo, open(os.path.join(ROOT, "src", "voiceover.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("durée totale de voix :", round(sum(v["seconds"] for v in vo), 1), "s")
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "schedule.py")], cwd=ROOT, check=True)

if __name__ == "__main__":
    main()
