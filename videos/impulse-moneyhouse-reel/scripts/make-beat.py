"""Beat electronico sintetizado para el reel (120 BPM, 20 s, libre de derechos).

Determinista (semilla fija). Uso: python3 scripts/make-beat.py assets/track.wav
Los golpes fuertes caen en los cortes de escena: 3, 7, 11, 15 y 18 s.
"""
import sys
import wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
DUR = 20.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros(N)
side = np.ones(N)  # envolvente de sidechain


def add(sig, t, gain=1.0):
    i = int(t * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    mix[i:j] += sig[: j - i] * gain


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    e = np.exp(-t / d)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc
        y[k] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = rng.standard_normal(n) * np.exp(-t / 0.003) * 0.3
    return (np.sin(ph) * np.exp(-t / 0.18) + click)


def clap():
    n = int(0.25 * SR)
    noise = highpass(rng.standard_normal(n), 900)
    e = env(n, 0.001, 0.07)
    for off in (0.0, 0.011, 0.022):
        e[int(off * SR):] += env(n - int(off * SR), 0.0005, 0.012) * 0.6
    return noise * e * 0.5


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    noise = highpass(rng.standard_normal(n), 7000)
    return noise * env(n, 0.0005, 0.06 if open_ else 0.012)


def saw(freq, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    s = 2 * ((t * freq) % 1) - 1
    s2 = 2 * ((t * freq * 1.006) % 1) - 1
    return (s + s2) * 0.5


def impact():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.55)
    crash = highpass(rng.standard_normal(n), 3000) * np.exp(-t / 0.5) * 0.35
    return boom + crash


def riser(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    seg = n // 16
    for s in range(16):
        cut = 400 + (s / 15) ** 2 * 9000
        a, b = s * seg, (s + 1) * seg if s < 15 else n
        out[a:b] = highpass(noise[a:b], cut)
    return out * (t / length) ** 2 * 0.45


# progresion en La menor: A - F - C - G, un acorde por compas (2 s)
roots = [55.0, 43.65, 65.41, 49.0]
arp_sets = [
    [220.0, 261.63, 329.63, 440.0],
    [174.61, 220.0, 261.63, 349.23],
    [261.63, 329.63, 392.0, 523.25],
    [196.0, 246.94, 293.66, 392.0],
]

steps = int(DUR / (BEAT / 4))
for s in range(steps):
    t = s * BEAT / 4
    beat_i, sub = divmod(s, 4)
    bar = int(t // (BEAT * 4))
    chord = bar % 4
    # breaks cortos antes de cada impacto fuerte
    in_break = (14.0 <= t < 15.0) or (2.5 <= t < 3.0)
    if sub == 0 and not in_break:
        add(kick(), t, 0.95)
        k0 = int(t * SR)
        k1 = min(N, k0 + int(0.3 * SR))
        side[k0:k1] = np.minimum(side[k0:k1], 0.25 + 0.75 * np.linspace(0, 1, k1 - k0) ** 0.6)
    if sub == 0 and beat_i % 2 == 1 and not in_break:
        add(clap(), t, 0.55)
    if not in_break:
        if sub == 2:
            add(hat(open_=True), t, 0.22)
        else:
            add(hat(), t, 0.16 if sub % 2 else 0.1)

# bajo sidechain (corcheas en contratiempo)
bass = np.zeros(N)
for b in range(int(DUR / (BEAT / 2))):
    t = b * BEAT / 2
    if b % 2 == 0 or (2.5 <= t < 3.0) or (14.0 <= t < 15.0):
        continue
    bar = int(t // (BEAT * 4)) % 4
    note = lowpass(saw(roots[bar] * 2, BEAT / 2), 700) * env(int(BEAT / 2 * SR), 0.003, 0.14)
    i = int(t * SR)
    j = min(N, i + len(note))
    bass[i:j] += note[: j - i]
mix += bass * 0.9

# arpegio pluck en semicorcheas, entra a los 3 s
lead = np.zeros(N)
for s in range(steps):
    t = s * BEAT / 4
    if t < 3.0 or (14.0 <= t < 15.0):
        continue
    bar = int(t // (BEAT * 4)) % 4
    f = arp_sets[bar][s % 4]
    n = int(BEAT / 4 * SR)
    tt = np.arange(n) / SR
    sq = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * 2 * tt) * 0.3
    note = sq * env(n, 0.002, 0.07)
    i = int(t * SR)
    j = min(N, i + n)
    lead[i:j] += note[: j - i]
mix += lowpass(lead, 3200) * 0.16

mix *= side
add(riser(2.5), 0.5, 0.8)
add(riser(3.0), 12.0, 0.9)
for t in (3.0, 7.0, 11.0, 15.0, 18.0):
    add(impact(), t, 0.8 if t in (3.0, 15.0) else 0.5)

mix = np.tanh(mix * 1.4) * 0.8
mix /= np.max(np.abs(mix)) / 0.89
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", sys.argv[1], DUR, "s")
