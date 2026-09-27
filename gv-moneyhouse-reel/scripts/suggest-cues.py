#!/usr/bin/env python3
"""
Sugiere CUES para el track real.

1) Copia el track a assets/bgm.mp3
2) npm run beats        (analiza -> audiomap.json y corre este script)
3) Pega los valores que imprime en window.REEL.cues (index.html) y ajusta
   data-start de las escenas / SFX si algun corte se movio.

Cada cue actual se ajusta al beat detectado mas cercano (tolerancia 0.3 s).
Los golpes fuertes (downbeats y key_moments SURGE) se listan aparte para
elegir a mano los cortes principales.
"""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
am = json.loads((root / "audiomap.json").read_text())
beats = am["grid"]["beats_sec"]
downs = am["grid"]["downbeats_sec"]

CURRENT = {
    "hit1": 0.5, "s2": 3.0, "s2lines": [4.0, 4.5, 5.0], "s3": 6.0, "s3sweep": 7.0,
    "s3tags": [7.5, 8.0], "s4": 9.0, "ticks": [10.0, 11.0, 12.0], "s5": 13.0,
    "brands": [13.0, 14.0, 15.0, 16.0, 17.0], "s6": 18.0,
    "items": [18.0, 18.75, 19.5, 20.25, 21.0], "s7": 22.0, "s7sub": 23.0,
    "s7info": 24.0, "s8": 26.0, "s8live": 27.0, "s8handle": 27.5, "s8logo": 28.0,
    "final": 29.0,
}


def snap(t):
    b = min(beats, key=lambda x: abs(x - t)) if beats else t
    return round(b, 3) if abs(b - t) <= 0.3 else t


out = {k: ([snap(x) for x in v] if isinstance(v, list) else snap(v)) for k, v in CURRENT.items()}
print(f"BPM detectado: {am['tempo']['bpm']}  ·  duracion: {am['audio']['duration_sec']} s\n")
print("cues sugeridos (pegar en window.REEL.cues):")
for k, v in out.items():
    print(f"  {k}: {json.dumps(v)},")
print("\ndownbeats:", ", ".join(f"{d:.2f}" for d in downs))
km = sorted(am.get("key_moments", []), key=lambda m: m["t"])
print("key moments:", ", ".join(f"{m['kind']}@{m['t']}" for m in km))
if am["audio"]["duration_sec"] < 30:
    print("\nATENCION: el track dura menos de 30 s", file=sys.stderr)
