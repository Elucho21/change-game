# Pedidos de motor para Opus

Bandeja de Grok → Opus. Si el jugador le pide a Grok un cambio de `store` / `politics` / `simulation` / `orders` / `engine` / `trade` / `persistence`, **Grok no lo codea**: lo escribe acá y avisa.

Formato de cada ítem: qué, por qué, contrato (función o campo), cómo probarlo. Un ítem por pedido. Cuando lo cierres, marcalo hecho y dejá el SHA.

Ver `docs/REGLAS_DE_CODIGO.md` sección 7.

---

## Abiertos (el jugador los pidió, nadie los codeó)

### Impacto profundo de ministros (alineamiento, drift de relaciones, inversión, sindicatos)

**Qué**  
Hoy los ministros solo dan pasivo genérico (Delta + capitalPerTurn) y descuento de categoría. El jugador pidió impacto **directo y diferenciado**:

- Ministro de Exterior: que dependa de su alineamiento cuánto capital diplomático extra genera y cómo se relacionan de forma pasiva con otros países/bloques (EE.UU., China, MERCOSUR).
- Ministro de Economía pro-mercado: potencia inversiones / crecimiento, pero pierde con sindicatos y humor social.
- Ministro socialista / sindical: potencia sindicatos y felicidad/empleo, pero pierde inversiones y caja.
- Lo mismo para el resto de sillas (trade-offs claros).

Grok ya amplió el catálogo en `lib/ministers_extra.ts` (rama `contenido/ministros-impacto`) con 12+ opciones balanceadas y comentarios `// futuro:` que marcan los campos que faltan. La mecánica de esos campos es de motor.

**Por qué**  
Sin esto el gabinete se siente cosmético después del primer turno. El jugador elige ministros por ideología y espera que el mundo reaccione distinto (relaciones, comercio, presión callejera).

**Contrato propuesto** (campos opcionales en `Minister`, `lib/cabinet.ts` / tipos):

```ts
export interface Minister {
  // ... lo que ya existe ...

  /** Alineamiento del canciller (solo Exterior). Define drift pasivo. */
  alignment?: 'west' | 'east' | 'regional' | 'nonaligned';

  /** Drift de relación por mes. Se aplica en deterministicTick. */
  relationDrift?: Array<{ target: string; amount: number }>;
  // target puede ser código de país ('USA', 'China') o 'bloc:mercosur' / 'bloc:otan' etc.

  /** Multiplicador de atracción de inversión extranjera (afecta gdp_growth o trade). */
  investmentMod?: number;   // ej. +0.2 pro-mercado, -0.2 sindical

  /** Multiplicador de poder sindical / streetPressure. */
  unionPower?: number;      // ej. +0.3 sindical, -0.15 pro-mercado

  /** % extra de capital político al ejecutar decisiones de categoría diplomacia. */
  diplomaticCapitalBonus?: number;  // 0.1 = +10%
}
```

**Dónde aplicarlo**
1. `cabinetPassive` o función nueva `cabinetRelationDrift(cabinet, relations, blocs)` → se llama desde `deterministicTick` (simulation.ts).
2. Al calcular costo/efectos de decisiones de diplomacia: multiplicar capital recuperado o el costo efectivo por `(1 + diplomaticCapitalBonus)`.
3. En tradeEffects o naturalDrift: aplicar `investmentMod` al crecimiento del jugador.
4. En streetPressure / moodDrift: sumar `unionPower`.

**Cómo probarlo**
- Nombrar `ext_atlantista` → tras 6-8 turnos la relación con USA sube ~2-3 puntos y con China baja un poco (sin tocar ninguna decisión).
- Nombrar `eco_promercado` → gdp_growth tiende un poco más alto y felicidad más baja que con el sindical.
- Nombrar `eco_socialista` → unemployment baja más rápido, fiscal se deteriora, y si hay streetPressure se nota.
- Decisión diplomática con `ext_atlantista` sentado: el capital neto de la acción es mejor que con un canciller genérico.
- Test unitario: `cabinetPassive` + drift no rompe el invariante de capital (0-100) ni relaciones (-100..100).

**Notas de diseño**
- Los drifts deben ser **chicos** (0.2–0.5 por mes). En un año suman 2-6 puntos, no 20.
- `relationDrift` con target de bloque: promediar o aplicar a los miembros del bloque del jugador (solo si el jugador es miembro).
- No hace falta tocar la UI todavía: los campos nuevos se pueden mostrar después en el tooltip del ministro.
- Grok deja los comentarios `// futuro:` en el catálogo para que el cableado sea obvio.

Cuando lo implementes, marcá este ítem como cerrado y dejá el SHA. El catálogo de contenido ya está listo en la rama `contenido/ministros-impacto`.

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
