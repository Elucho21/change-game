# Video C2C · Impulse World (Remotion)

Video explicativo del **Programa C2C (Client-to-Client)** en dos formatos:

| Composición | Tamaño | Uso |
|---|---|---|
| `C2C-Vertical` | 1080×1920 · 30 fps | Reels / TikTok / Stories / WhatsApp |
| `C2C-Horizontal` | 1920×1080 · 30 fps | YouTube / landing / presentación |

Duración: **2647 frames ≈ 88,2 s** (8 escenas, transiciones de 14 frames).

## Uso

```bash
npm install
npm run studio          # preview en el navegador
npm run render          # → out/c2c-vertical.mp4 y out/c2c-horizontal.mp4 (H.264, CRF 18)
```

Render sin acceso a Google Fonts (offline o detrás de un proxy corporativo):

```bash
REMOTION_FONTS=local npm run render   # usa public/fonts/poppins-*.woff2
```

## Dónde editar

| Qué | Archivo |
|---|---|
| **Todo el texto**, URL del CTA y duración de cada escena | `src/content.ts` (`**texto**` = énfasis de marca) |
| Colores, glass, radios, tipografía, motion tokens, safe areas | `src/tokens.ts` |
| Presets de animación (`blurIn`, `fadeUp`, `scaleIn`, `stagger`) | `src/motion.ts` |
| Escenas | `src/scenes/E1Hook.tsx` … `E8CTA.tsx` |
| Componentes (GlassCard, Badge, Button, AmbientOrbs, Particles, Ladder, Checklist, Counter) | `src/components/` |

## Assets opcionales

- `public/music.mp3` → se usa automáticamente (volumen 0.35, fade in/out 1 s). Si no existe, el video renderiza sin audio.
- `public/logo.png` → reemplaza el wordmark "IMPULSE WORLD" del CTA. Si no existe, se usa el wordmark en texto.

La detección es en `calculateMetadata` (`src/Root.tsx`): no hay que tocar código.

## Reglas de contenido (material público)

- H3 = 100K Una Fase · objetivo 18% · DD 5/10. H8 = 300K Una Fase · objetivo 18% · DD 4/8. Nada más.
- H7 nunca incluye Fondeo Directo ("Hasta 100K. Excepto Fondeo Directo").
- Cada hito se gana **una sola vez**: no es comisión recurrente.
- 10% OFF = del amigo (su primera compra). 25% y 40% = del referidor sobre su propia compra. No mezclar ni sumar.
- No prometer panel, wallet, red cripto, plazos de aceptación de Partner ni fechas de pago.
- Partners / IB no participan del C2C.

## Fuentes

Poppins (SIL Open Font License 1.1). Las copias en `public/fonts/` son el subset latin de Google Fonts, usadas solo con `REMOTION_FONTS=local`.
