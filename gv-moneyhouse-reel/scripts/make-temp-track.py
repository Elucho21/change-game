#!/usr/bin/env python3
"""
Track TEMPORAL para el reel (trailer epico, 120 BPM, Re menor, 30 s).

Existe solo porque el brief trae [RUTA/track.mp3] como placeholder. Esta
compuesto para que los golpes caigan exactamente en los cortes del config
(3 / 6 / 9 / 13 / 14..17 / 18..21 / 22 / 26 / 29 s). Cuando llegue el track
real: copialo a assets/bgm.mp3, corre `npm run beats` y ajusta CUES en
index.html con los tiempos que imprime scripts/suggest-cues.py.

Uso: python3 scripts/make-temp-track.py  ->  assets/bgm.mp3
"""
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
DUR = 30.0
BPM = 120
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def t_(d):
    return np.arange(int(SR * d)) / SR


def lp(x, f, order=4):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=4):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i : i + len(sig)] += sig * gain * (1 + min(0, pan))


def saw(freq, d, detune=0.0):
    t = t_(d)
    ph = (freq * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def env(d, a=0.005, rel=0.3, hold=0.0):
    t = t_(d)
    e = np.minimum(1, t / max(a, 1e-4))
    tail = np.clip((t - a - hold) / max(rel, 1e-4), 0, None)
    return e * np.exp(-tail * 5)


# ---------- instrumentos ----------
def kick(g=1.0):
    d = 0.5
    t = t_(d)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7)
    s += lp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 90) * 0.4
    return np.tanh(s * 1.6) * g


def boom(d=3.5):
    """Impacto cinematico: sub + ruido grave + cola."""
    t = t_(d)
    f = 32 + 70 * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 1.6)
    n = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 6) * 0.9
    s = np.tanh((s + n) * 2.2)
    return s


def braam(root=73.42, d=2.4):
    """Brass grave distorsionado estilo trailer."""
    t = t_(d)
    s = np.zeros(len(t))
    for mult, g in ((1, 1), (1.5, 0.6), (2, 0.5), (0.5, 0.8)):
        for dt in (-0.004, 0.0, 0.005):
            s += saw(root * mult, d, dt) * g
    s /= 8
    cut = lp(s, 700)
    e = np.minimum(1, t / 0.04) * np.exp(-t * 1.1)
    return np.tanh(cut * 3) * e


def snare():
    d = 0.35
    t = t_(d)
    n = bp(rng.standard_normal(len(t)), 900, 7000) * np.exp(-t * 18)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.6
    return np.tanh((n + tone) * 1.5) * 0.8


def hat(open_=False):
    d = 0.25 if open_ else 0.06
    t = t_(d)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if open_ else 70)) * 0.35


def tom(f0=95):
    d = 0.8
    t = t_(d)
    f = f0 * (0.65 + 0.35 * np.exp(-t * 8))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 4.5)
    s += lp(rng.standard_normal(len(t)), 1200) * np.exp(-t * 30) * 0.5
    return np.tanh(s * 1.4)


def stab(freqs, d=0.45):
    t = t_(d)
    s = sum(saw(f, d, dt) for f in freqs for dt in (-0.006, 0.006)) / (2 * len(freqs))
    s = lp(s, 2600) * np.exp(-t * 6) * np.minimum(1, t / 0.004)
    return s


def pad(freqs, d):
    t = t_(d)
    s = sum(saw(f, d, dt) for f in freqs for dt in (-0.004, 0.0, 0.004)) / (3 * len(freqs))
    s = lp(s, 1100)
    e = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.4)
    return s * e


def bassline(freq, d):
    t = t_(d)
    s = saw(freq, d) * 0.6 + np.sin(2 * np.pi * freq * t)
    s = lp(s, 380)
    # pump de sidechain por corchea
    pump = 1 - 0.75 * np.exp(-((t % (BEAT / 2)) * 22))
    return np.tanh(s * 1.5) * pump * np.minimum(1, (d - t) / 0.05)


def riser(d):
    t = t_(d)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    seg = int(SR * 0.05)
    for i in range(0, len(t), seg):
        c = 400 + 7000 * (i / len(t)) ** 2
        out[i : i + seg] = bp(n[i : i + seg + 0], c * 0.7, min(c * 1.4, 20000))[: len(out[i : i + seg])]
    f = 150 + 1100 * (t / d) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (out * 0.8 + tone) * (t / d) ** 2.2


def crowd(d):
    """Rumor de estadio: ruido rosado filtrado con modulaciones lentas."""
    t = t_(d)
    n = rng.standard_normal(len(t))
    n = bp(n, 300, 3000)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) * np.sin(2 * np.pi * 1.9 * t + 1)
    e = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8)
    return n * mod * e * 0.18


# ---------- armonia (Re menor) ----------
Dm = [146.83, 174.61, 220.0]
Bb = [116.54, 146.83, 174.61]
Gm = [98.0, 116.54, 146.83]
A = [110.0, 138.59, 164.81]
F = [87.31, 110.0, 130.81]
C = [130.81, 164.81, 196.0]
ROOT = {"Dm": 73.42, "Bb": 58.27, "Gm": 49.0, "A": 55.0, "F": 43.65, "C": 65.41}
CH = {"Dm": Dm, "Bb": Bb, "Gm": Gm, "A": A, "F": F, "C": C}

# ---------- arreglo ----------
# 0-3 s: negro. Drone + golpe gigante en 0.5
add(pad([36.71, 73.42], 3.2), 0.0, 0.25)
add(boom(3.5), 0.5, 1.0)
add(braam(73.42, 2.5), 0.5, 0.55)

# 3-6 s: intro, taikos por negra, pad, riser hacia el 6
add(boom(2.5), 3.0, 0.75)
add(pad(Dm, 1.5), 3.0, 0.3)
add(pad(Bb, 1.5), 4.5, 0.3)
for k in range(6):
    tt = 3.0 + k * BEAT
    add(tom(95 if k % 2 == 0 else 80), tt, 0.55, pan=-0.2 if k % 2 else 0.2)
add(riser(2.6), 3.4, 0.55)
for k in range(4):  # redoble final
    add(snare(), 5.0 + k * BEAT / 4 * 2, 0.35 + k * 0.1)

# 6-22 s: seccion con beat completo
prog = ["Dm", "Bb", "Gm", "A", "Dm", "Bb", "F", "C"]
for bar in range(8):  # 2 s por compas: 6..22
    b0 = 6.0 + bar * 2
    name = prog[bar]
    add(bassline(ROOT[name], 2.0), b0, 0.5)
    add(pad(CH[name], 2.0), b0, 0.22)
    for q in range(4):
        tt = b0 + q * BEAT
        add(kick(), tt, 0.85)
        if q % 2 == 1:
            add(snare(), tt, 0.55)
        for e8 in range(2):
            add(hat(open_=(e8 == 1)), tt + e8 * BEAT / 2, 0.5, pan=0.3)
    # stab de acorde en cada tiempo 1
    add(stab([f * 2 for f in CH[name]]), b0, 0.45)

# golpes de titular
add(boom(3.0), 6.0, 0.95)
add(braam(73.42, 2.8), 6.0, 0.6)
add(boom(2.0), 9.0, 0.7)
for day in (10.0, 11.0, 12.0):  # cambio de fecha
    add(stab([293.66 * 2, 440.0 * 2], 0.25), day, 0.3)
add(boom(2.0), 13.0, 0.8)
# montaje de marcas: un golpe por corte
for k, tt in enumerate((13.0, 14.0, 15.0, 16.0, 17.0)):
    add(tom(110 - k * 6), tt, 0.6)
    add(stab([f * 2 for f in Dm], 0.3), tt, 0.35)
# rafaga de dinamicas (grilla de semicorcheas)
for tt in (18.0, 18.75, 19.5, 20.25, 21.0):
    add(snare(), tt, 0.5)
    add(tom(120), tt, 0.35)
# riser hacia la escena 7
add(riser(2.2), 19.8, 0.65)
for k in range(8):
    add(snare(), 21.0 + k * BEAT / 4, 0.2 + k * 0.05)

# 22-26 s: la arena. Hit enorme, half-time, multitud
add(boom(4.0), 22.0, 1.0)
add(braam(73.42, 3.5), 22.0, 0.75)
add(braam(55.0, 2.5), 24.0, 0.5)
add(crowd(8.0), 22.0, 1.0)
for bar in range(2):
    b0 = 22.0 + bar * 2
    name = ["Dm", "A"][bar]
    add(bassline(ROOT[name], 2.0), b0, 0.45)
    add(pad(CH[name], 2.0), b0, 0.3)
    add(kick(), b0, 0.9)
    add(snare(), b0 + 1.0, 0.7)
    add(kick(), b0 + 1.5, 0.6)
    for e8 in range(8):
        add(hat(), b0 + e8 * BEAT / 2, 0.35)

# 26-30 s: CTA
add(boom(3.0), 26.0, 0.9)
for bar in range(2):
    b0 = 26.0 + bar * 2
    name = ["Bb", "C"][bar]
    add(pad(CH[name], 2.0), b0, 0.3)
    if b0 < 28.0:
        add(bassline(ROOT[name], 2.0), b0, 0.5)
        for q in range(4):
            add(kick(), b0 + q * BEAT, 0.85)
            if q % 2:
                add(snare(), b0 + q * BEAT, 0.5)
            add(hat(), b0 + q * BEAT + BEAT / 2, 0.4)
# 28-29: redoble a la resolucion
for k in range(8):
    add(snare(), 28.0 + k * BEAT / 4, 0.25 + k * 0.06)
add(riser(1.0), 28.0, 0.5)
# ultimo golpe (fade a negro)
add(boom(1.4), 29.0, 1.0)
add(braam(73.42, 1.2), 29.0, 0.7)
add(pad(Dm, 1.0), 29.0, 0.4)

# ---------- master ----------
mix = np.stack([L, R])
# reverb corta (IR de ruido con decaimiento)
irl = int(SR * 1.6)
ir = rng.standard_normal((2, irl)) * np.exp(-np.arange(irl) / SR * 3.2)
ir = np.stack([lp(ir[0], 5000), lp(ir[1], 5000)])
wet = np.stack([fftconvolve(mix[c], ir[c])[:N] for c in range(2)])
wet /= np.max(np.abs(wet)) + 1e-9
dry = mix / (np.max(np.abs(mix)) + 1e-9)
out = dry * 0.85 + wet * 0.22
out = np.tanh(out * 1.4)  # glue / limiter suave
# fade-out del ultimo segundo (29 -> 30)
fade = np.ones(N)
i29 = int(29.0 * SR)
fade[i29:] = np.linspace(1, 0, N - i29) ** 1.5
out *= fade
out /= np.max(np.abs(out)) + 1e-9
out *= 0.89

root = Path(__file__).resolve().parent.parent
wav = root / "assets" / "bgm.wav"
mp3 = root / "assets" / "bgm.mp3"
import soundfile as sf  # noqa: E402

sf.write(wav, out.T.astype(np.float32), SR)
subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-b:a", "256k", str(mp3)],
    check=True,
)
wav.unlink()
print(f"ok -> {mp3}")
