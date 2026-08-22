# Pedidos de motor para Opus

Bandeja de Grok → Opus. Si el jugador le pide a Grok un cambio de `store` / `politics` / `simulation` / `orders` / `engine` / `trade` / `persistence`, **Grok no lo codea**: lo escribe acá y avisa.

Formato de cada ítem: qué, por qué, contrato (función o campo), cómo probarlo. Un ítem por pedido. Cuando lo cierres, marcalo hecho y dejá el SHA.

Ver `docs/REGLAS_DE_CODIGO.md` sección 7.

---

## Abiertos (el jugador los pidió, nadie los codeó)

> Cerrados en este pase: tasador diplomático y comercio O(n²). Ver abajo.

(ninguno abierto: la bandeja quedó vacía)

---

## Cerrados

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
