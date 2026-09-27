# Impulse World — Liquid Glass (dark), adaptado a video vertical

Fuente de verdad: "Impulse World — Liquid Glass Design System v1.0" (tokens `.dark`).

## Color
| Rol | Valor |
|---|---|
| background | #0B0E13 (hsl 220 25% 6%) |
| foreground | #E5E7EB |
| muted-foreground | #9AA1AC |
| primary | #0F82FF (hsl 213 100% 53%) |
| accent | #8FC4FF (hsl 213 100% 78%) |
| secondary | #0B1E3C |
| brand deep | #052E57 |
| glass-bg | hsl(220 30% 12% / .6) · border hsl(220 30% 25% / .4) · highlight hsl(220 30% 30% / .3) · shadow hsl(213 100% 53% / .15) · blur 24px |

## Tipografía
Poppins (bundled 400/700/900). Display 900 con tracking -0.03em; labels 700 uppercase con tracking 0.08em.

## Forma
Radios 1.25rem base (x2 para video: 40px cards, 999px pills). Glass sobre orbes estáticos (regla: el glass necesita algo detrás).

## Movimiento
ease.out = cubic-bezier(0.16,1,0.3,1) ≈ GSAP `expo.out`; ease.spring = cubic-bezier(0.34,1.56,0.64,1) ≈ `back.out(1.6)`.
Para el reel se comprime la escala de duración (entradas 0.35–0.5s) por pedido de "energía de trading".
Orbes sin animación de blur (regla de rendimiento); solo transform/opacity.

## Composición vertical
Safe zones Reels: top 220px (UI), bottom 380px (caption/CTA de la app). Logo en pill glass arriba (y≈120). Contenido principal entre y 300 y 1500.
