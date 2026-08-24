# Sistema Moral — Contrato de motor (CHANGE WORLD GAME v1.1)

**Grok → Opus** · 23/08/2026  
Especificación completa de contenido + UX: ver  
- `docs/PEDIDO_OPUS_UX_Cartas_Emblemas_Banderas.md`  
- `docs/UX_Cartas_Personajes_Emblemas_Banderas.md`  

Este archivo concentra lo que el **motor / store / KPIs** necesita.

---

## KPIs nuevos

| KPI | Rango | Notas |
|-----|-------|-------|
| `corruption` | 0–100 | Inicial 18–25. Nunca empieza en 0. |
| `investigationProgress` | 0–100 | Qué tan cerca está Justicia/Comisión de llegar al gobierno |
| `courtIntegrity` | 0–100 | Derivado de los 5 jueces |
| `commissionIntegrity` | 0–100 | Derivado de escaños + lealtad |
| `supportGustavoComun` | 0–8 | Techo duro 8% |
| `supportAmaliaVerde` | 0–5 | Techo duro 5% |
| `supportJhonElDuro` | 0–9 | Techo duro 9% |

Desbloquear visualmente tras onboarding de Enrique (mes 4).

---

## Rangos de corrupción (feedback)

| Rango | Nombre | Efecto |
|-------|--------|--------|
| 0–15 | Limpio | Investigaciones muy lentas |
| 16–35 | Manchas menores | Normal |
| 36–55 | Estructural | Enrique aparece más |
| 56–75 | Sistema capturado | Alto riesgo escándalos |
| 76–100 | Putrefacción | Crisis institucional posible |

Multiplicador: si corruption ≥ 56 → nuevas acciones ×1.25.  
Si hay escándalo mediático activo → ×1.4 ese trimestre.

---

## Fórmula Progreso de Investigaciones (trimestral)

```
Δ investigationProgress = (
    (100 - happiness) * 0.35
  + courtIntegrity * 0.25
  + commissionIntegrity * 0.20
  + scandalFactor * 0.15          // 0 | 15 | 30
  + (corruption / 100) * 20
) - (activeFavors * 0.30) - majorityBonus   // majorityBonus 0–12
```

Umbrales: 46–65 activa · 66–80 peligro · 81–100 crisis / juicio político posible.

---

## Suprema Corte (5 jueces)

Cada juez: `integrity` 0–100, `loyaltyToGov` 0–100, `ideology`, `yearsLeft`.

```
courtIntegrity = avg(integrity) - avg(loyaltyToGov) * 0.35
```

Vacante → proceso de elección (candidato propio / acuerdo / libre).  
Candidato propio: +corrupción, −courtIntegrity, +lealtad.

---

## Comisión Anticorrupción

Distribución proporcional a escaños del Parlamento.  
**Mayoría ayuda a diluir, nunca anula.**  
`commissionIntegrity` baja con mayoría oficialista fuerte, pero piso > 0.

---

## Enrique Grook — Onboarding mes 4

No es una carta normal. Secuencia obligatoria:

1. Presentación (diálogo cínico)
2. Panel “Cómo funciona el poder en las sombras”
3. Al cerrar → desbloquear KPIs de corrupción/investigaciones/integridades + entrada Timeline

Luego puede emitir cartas normales (contrato amigo, silencio mediático, sacrificio, favores a la Corte, operación archivo, limpieza de emergencia, oferta final, etc.).

Textos y catálogo completo: diseño en artifacts / pedido UX.

---

## Líderes minoritarios (techos duros)

| ID | Techo | Drivers principales |
|----|-------|---------------------|
| gustavo_comun | 8% | desempleo, pobreza, salario real ↓, recortes sociales |
| amalia_verde | 5% | índices ambientales ↓, descontento político, escándalos extractivos |
| jhon_el_duro | 9% | inseguridad ↑, inmigración, “mano blanda” |

Dispersan votos. Generan eventos de presión. Aliados tácticos inestables.

---

## Puntos de quiebre

1. corruption > 70 **y** investigationProgress > 60 → carta “Oferta Final” de Enrique  
2. investigationProgress > 85 → Corte puede habilitar juicio político  
3. corruption > 85 **y** happiness < 30 **y** investigationProgress > 70 → riesgo caída gobierno

---

## Fuentes típicas de Δ corruption (jugador)

| Acción | Δ típica |
|--------|----------|
| Contrato opaco | +8 a +15 |
| Nombramiento familiar/político | +6 a +12 |
| Fondos reservados | +5 a +11 |
| Comprar silencio | +7 a +10 |
| Favores a jueces/parlamentarios | +4 a +9 |
| Clientelismo fuerte | +3 a +8 |

Limpieza siempre tiene coste (capital político, lealtad o riesgo de revelar más).

---

## Integración

- Capital político: corrupción da control corto plazo; limpiar cuesta capital.
- Felicidad del pueblo = principal freno/acelerador de investigaciones.
- Timeline: toda carta resuelta deja entrada con emblema/flag + resultado.
- UI: ver pedido `PEDIDO_OPUS_UX_Cartas_Emblemas_Banderas.md` (EventCard, CharacterEmblem, CountryFlag, onboarding).

**Grok no codea motor ni componentes React.** Este archivo + el pedido UX son el contrato.
