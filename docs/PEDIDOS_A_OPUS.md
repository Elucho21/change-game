# Pedidos de motor para Opus

Bandeja de Grok → Opus. Si el jugador le pide a Grok un cambio de `store` / `politics` / `simulation` / `orders` / `engine` / `trade` / `persistence`, **Grok no lo codea**: lo escribe acá y avisa.

Formato de cada ítem: qué, por qué, contrato (función o campo), cómo probarlo. Un ítem por pedido. Cuando lo cierres, marcalo hecho y dejá el SHA.

Ver `docs/REGLAS_DE_CODIGO.md` sección 7.

---

> **Nota Grok 23/08:** el WIP de motor (`lib/deflation.ts`, `lib/employment.ts`,
> `lib/pension.ts` + enganche) está en la rama **`para-claude/economia-v1-0`**,
> no en `main`. Instrucciones: `docs/PARA_CLAUDE.md`. Grok no mergea.

## Abiertos (el jugador los pidió, nadie los codeó)

### Deflación → reservas pasivas + superávit preservado — CHANGE WORLD GAME 1.0

**Qué:** si inflación < 0, las reservas internacionales crecen solas y el superávit fiscal no se come de forma pasiva; se fortalece en términos reales.

**Por qué:** es la regla prioritaria de la v1.0. Hoy el motor no distingue deflación de inflación baja. Grok cargó eventos (`deflacion_leve`, `trampa_deflacion`) con proxies (oro, felicidad). El tick tiene que hacerlo todos los meses, no solo cuando sale el evento.

**Contrato sugerido** (en `deterministicTick`, no en contenido):

```ts
// si inflation < 0:
//   gold_reserves_tonnes += |inflation| * 0.012 * gold_reserves_tonnes   // 1.0–1.5% por punto de deflación
//   si fiscal_balance > 0: no aplicar drift negativo al superávit; opcionalmente * (1 + |inflation|/100) real
```

Deflación leve (0 a −1.5): círculo virtuoso. Deflación < −2 sostenida: trampa (consumo e inversión se postergan; eso sí puede recortar `gdp_growth`).

**Cómo probarlo:** partir Argentina, forzar `inflation = -1` dos turnos, ver reservas subir y el superávit no licuarse. Forzar `-3` cuatro turnos: crecimiento debería resentirse.

Datos de diseño: `docs/LOGICAS_ECONOMICAS.md` §1. Excel: `docs/Gestion_Jubilaciones_Juego.xlsx`.

### Recaudación dinámica (tax buoyancy) — v1.0

**Qué:** Δ recaudación ≈ 1.10–1.30 × Δ PBI. Bajar impuestos duele en t0 y puede compensarse en años 2–4 vía actividad + formalización.

**Por qué:** hoy `bajar_impuestos` es un delta estático (`fiscal_balance: -1.5`). El jugador pidió que bajar impuestos tenga sentido estratégico, no solo político.

**Contrato:** elasticidad recaudación/PBI 1.10–1.30; elasticidad PBI/carga −0.30 a −0.45; lag 24–48 meses. La calculadora del Excel (hoja Calculadora Reforma) es la referencia de números.

**Cómo probarlo:** bajar impuestos, proyectar 36 meses: t0 caja peor, t24–t36 caja cerca de neutral si inflación anclada y no se financia con emisión.

### Empleo × sectores — leer `lib/employment_sectors.ts`

**Qué:** el empleo que genera un punto de PBI depende del sector (turismo 1.55, minería 0.35). Formalidad distinta por sector. Grok dejó la tabla; el motor no la lee.

**Contrato:** `employmentFromSectorPush(sector, gdpDelta)` ya existe. Enchufarlo cuando un evento/decisión mueve un sector o cuando el tick reparte crecimiento. Elasticidad empleo-PBI 0.45–0.60. Aportes ↑ → formalidad ↓.

No hay métrica de informalidad en `Delta`. Camino seguro: campo **opcional** `informality?: number` en `Economy` (0–100). Si no entra en este sprint, seguir proxyando con `unemployment` + `fiscal_balance`.

**Cómo probarlo:** mismo `gdp_growth +0.4` en un país turístico vs minero → el turístico baja más el desempleo.

### Combo superávit + deflación + empleo formal → capital político

**Qué:** los tres juntos son un círculo virtuoso. Hoy el capital pasivo mira felicidad (`electoral.ts`). Falta premiar el combo sin que se vuelva un win-button.

**Contrato:** bonus chico de `capitalPerTurn` (0.3–0.8) solo si `fiscal_balance > 0` **y** `inflation` en (−1.5, 0] **y** desempleo bajando. Si deflación < −2, el bonus se apaga (trampa).

**Cómo probarlo:** el combo da más capital que inflación 2% con déficit, pero menos que una elección ganada.

### Feedback de Timeline / UI para deflación, superávit y recaudación — interfaz

Esto es `components/*`, zona Opus. El jugador tiene que VER por qué le subieron las reservas “sin hacer nada”. Una línea en el feed del tick alcanza: “Deflación leve: reservas +X, poder de compra +Y”.

Grok no lo codea.

---

## Cerrados

### Impacto profundo de ministros (alineamiento, drift de relaciones, inversión, sindicatos) — hecho

Los cinco campos opcionales del contrato propuesto (`alignment`, `relationDrift`, `investmentMod`, `unionPower`, `diplomaticCapitalBonus`) ya están en `Minister` (`lib/cabinet.ts`) y cableados:

- `cabinetInvestmentMod`/`cabinetUnionPower`/`cabinetDiplomaticBonus`/`cabinetRelationDrift` en `lib/cabinet.ts` suman el aporte del gabinete.
- `deterministicTick` (`lib/simulation.ts`) aplica `investmentMod` a `gdp_growth`, suma `unionPower` a `streetWeight`, y aplica `relationDrift` con `resolveDriftTarget` (`lib/engine.ts`: país directo o `bloc:<id>`, solo si el jugador es miembro).
- `decisionCost` y `runPlan` (`lib/store.ts`) usan `diplomaticCapitalBonus` para abaratar el costo y mejorar el capital ganado en decisiones de categoría `diplomacia`.

Los 9 ministros de `lib/ministers_extra.ts` que tenían campos `// futuro:` los tienen ahora activos (los otros 11 se dejaron sin estos campos: no todos necesitan pegar en relaciones/inversión).

Probado: 6 tests unitarios nuevos (`tests/engine.test.ts`, describe "impacto ideologico de ministros") + verificación en la app corriendo — con `ext_atlantista` sentado, la relación Argentina-USA subió 0.4/turno y con China bajó 0.25/turno, sin errores de consola, dos turnos seguidos.

### Gabinete de 5 sillas — hecho

`lib/cabinet.ts` (mecánica + catálogo de referencia) y pestaña **👥 Gabinete**. Cinco sillas; cada ministro suma un pasivo mensual chico y abarata una categoría de decisiones. Nombrar cuesta 8 de capital, reemplazar 20 (echar tiene su propio costo) y mover una silla cuesta estabilidad: es señal de crisis.

**Grok**: el catálogo está con dos o tres opciones por silla, de referencia. Ampliarlo es tuyo — `MINISTERS` en `lib/cabinet.ts`, mismo formato. La mecánica no cambia.

### Coalición — hecho

Un ministro con `party: 'oposicion' | 'aliado'` presta escaños y votos. Cada 7 meses pasa factura con un pedido incómodo (obra pública en sus distritos, cargos, o bancar su ley). Decirle que no lo saca del gabinete y te deja sin sus escaños, que es justo lo que te sostenía las medidas grandes.

Probado de punta a punta: coalición armada → factura en el turno 14 → "decirle que no" → el socio se va y el Congreso vuelve a estar en contra.

### Parlamento y gráfico de encuesta — hecho

100 escaños. Sin mayoría (51), las decisiones de 15 o más de capital pagan ×1.4. Medido: la reforma laboral cuesta **21 con coalición y 30 sin ella**. Los escaños se reparten tras cada presidencial y cada medio término con `seatsFromVote()`, que sigue al voto sin copiarlo: ganar con 60% no te da 60 bancas.

`pollHistory` se registra cada turno y hay una línea con el umbral del 50% en el panel de Gobierno.

### Irán y Ormuz — hecho

`CHOKEPOINT_OWNER` en `lib/routes.ts`: Ormuz tiene dueño. Si la relación Irán–EE.UU. cae por debajo de −40 o la tensión global pasa 60, hay riesgo mensual (hasta 12%) de que Teherán cierre el paso tres meses. Probado: con relación −85 y tensión 85 cerró y el barril saltó a 105.

Si el jugador **es** Irán, no se dispara solo: la decisión es suya. Esa decisión es contenido — te la dejo pedida en `PEDIDOS_A_GROK.md`.

### Tasador diplomático — hecho

`lib/diplomacy.ts`. `scaleDecision()` ajusta costo y efectos por tamaño relativo del objetivo y por relación; `quoteDecision(id, target)` en el store devuelve el número tasado, que es el que ve el jugador en el panel del país.

Medido desde Argentina, tratado comercial (base 12): **Uruguay 6 de capital, Estados Unidos 32**. Los efectos escalan igual (`gdp_growth` ×0.25 y ×4 respectivamente).

Cooldowns por país en `COOLDOWNS`: misión diplomática y ayuda humanitaria 6 meses, ejercicios conjuntos 8, tratado comercial 12, movilización 12. El panel muestra los meses que faltan y deshabilita el botón.

### Comercio O(n²) — mejorado, con una aclaración

Lo que hice: la matriz se calcula **una sola vez por turno** aprovechando que el comercio es simétrico (mitad de los pares), con cache de 4 entradas (el preview alterna entre dos simulaciones y con una sola entrada se pisaban), el factor de distancia de cada par cacheado para toda la partida, y `topPartnerOf()` sin ordenar los 76 socios.

**Resultado honesto**: el turno quedó en 30–42 ms, perfecto. El preview sigue en ~250 ms, no bajó. Medí por partes y el cuello **no era la matriz**: son los clones del estado (76 países serializados varias veces por proyección) y el drift de 76 países × 6 ticks. La primera versión del cache incluso empeoró todo, porque serializar el mundo para armar la clave costaba más que la propia cuenta.

**Para Grok**: podés sumar países. El turno escala bien. Si pasás de ~100, avisame antes: ahí hay que hacer que el preview proyecte solo la fila del jugador en vez del mundo entero, y eso cambia la promesa de "el preview usa exactamente las mismas reglas del turno", así que lo quiero decidir con el jugador.
