# GV MoneyHouse — Reel 9:16 (30 s · 1080x1920 · 60 fps)

Composicion [HyperFrames](https://hyperframes.heygen.com) (HTML + GSAP, render determinista a MP4).

```bash
npm run dev        # preview en el navegador (Studio)
npm run check      # lint + runtime + layout + contraste
npm run render     # -> output/gv-moneyhouse-reel.mp4
npm run frames     # -> output/frames/*.png (un frame por escena)
```

Requiere Node 22+, FFmpeg y (para `beats`) Python 3 con `librosa numpy soundfile`.

## Que editar

Todo esta al principio de `index.html`:

| Que | Donde |
|---|---|
| Textos, colores, fechas, marcas, logos, handle | `window.REEL` (bloque CONFIG en el `<head>`) |
| Tiempos de cada golpe/entrada | `window.REEL.cues` |
| Track y SFX | etiquetas `<audio>` al inicio del `<body>` (el render lee el `src` literal) |
| Ventana de cada escena | `data-start` / `data-duration` de cada `<section class="scene">` |

### Cambiar el track (hoy es temporal)

1. Copiar el track real a `assets/bgm.mp3`.
2. `npm run beats` → analiza el audio (`audiomap.json`) e imprime los cues ajustados al beat mas cercano.
3. Pegar los cues en `window.REEL.cues`; si se movio un corte de escena, mover el `data-start` de esa escena y de sus SFX.
4. `npm run check && npm run render`.

El track temporal (`scripts/make-temp-track.py`, 120 BPM, Re menor) esta compuesto para que los
golpes caigan en 0.5 / 3 / 6 / 9 / 13–17 / 18–21 / 22 / 26 / 29 s y ya trae el fade-out del ultimo segundo.

### Logos

`s5.brands[i].logo: null` dibuja un wordmark tipografico con icono de reemplazo en el color de la marca.
Para usar el logo real: poner el archivo en `assets/logos/` y setear `logo: "assets/logos/impulse-world.png"`.

## Escenas y transiciones

| # | Tiempo | Contenido | Sale con |
|---|---|---|---|
| 1 | 0–3 | Negro → golpe en 0.5 s: **4 DÍAS** + shockwave | zoom-through por el trazo del "4" (inunda de oro) |
| 2 | 3–6 | UNA CASA. / LOS MEJORES EDUCADORES DE TRADING (mask reveal) | light leak dorado (riser antes) |
| 3 | 6–9 | GV MONEYHOUSE: piezas doradas que convergen + light sweep | whip pan con motion blur |
| 4 | 9–13 | 4 AL 7 DE OCTUBRE + contador 04→07 + velas | glitch RGB |
| 5 | 13–18 | Marcas, un corte por golpe, color de acento c/u | corte seco en el golpe |
| 6 | 18–22 | Dinámicas en ráfaga | colapso a línea (apagón) |
| 7 | 22–26 | GRAN FINAL EN LA ARENA + luces de estadio (riser antes) | iris dorado |
| 8 | 26–30 | Entradas desde S/ 50 · YouTube · handle · logo con glow → fade a negro en 29 s | — |

Capas globales: partículas doradas con parallax (2 profundidades + chispas en cada golpe), bokeh,
luz volumétrica que barre, pulso de brillo al beat, grano de película, viñeta, shake de cámara en los golpes
y push-in lento constante en cada escena.
