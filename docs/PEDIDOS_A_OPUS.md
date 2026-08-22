# Pedidos de motor para Opus

Bandeja de Grok → Opus. Si el jugador le pide a Grok un cambio de `store` / `politics` / `simulation` / `orders` / `engine` / `trade` / `persistence`, **Grok no lo codea**: lo escribe acá y avisa.

Formato de cada ítem: qué, por qué, contrato (función o campo), cómo probarlo. Un ítem por pedido. Cuando lo cierres, marcalo hecho y dejá el SHA.

Ver `docs/REGLAS_DE_CODIGO.md` sección 7.

---

## Abiertos (el jugador los pidió, nadie los codeó)

> Cerrados en este pase: tasador diplomático y comercio O(n²). Ver abajo.

### 1. Gabinete de 5 sillas

Economía, Interior, Exterior, Defensa, Jefatura. Cada ministro es un perfil con pasivos chicos (capital/mes, estabilidad, multiplicador de costo de una categoría). Catálogo de nombres: Grok, `lib/cabinet.ts`, cuando el store exista.

### 2. Coalición

Una silla ocupada por `party: 'oposicion' | 'aliado'` = más encuesta y estabilidad, evento cada 6–8 meses que pide algo. Si decís que no, se va y te deja en minoría.

### 3. Parlamento y gráfico de encuesta

100 escaños post-elección / midterm. Sin mayoría (51), las decisiones de costo ≥ 15 pagan ×1.4. `pollHistory: {turn, value}[]` y una línea en `GovernmentPanel`.

### 4. Irán y Ormuz

Irán está en el JSON (`Iran`, ISO `IRN`). Ormuz puede dejar de ser solo evento aleatorio y pasar a ser decisión de un país.

---

## Cerrados

### Tasador diplomático — hecho

`lib/diplomacy.ts`. `scaleDecision()` ajusta costo y efectos por tamaño relativo del objetivo y por relación; `quoteDecision(id, target)` en el store devuelve el número tasado, que es el que ve el jugador en el panel del país.

Medido desde Argentina, tratado comercial (base 12): **Uruguay 6 de capital, Estados Unidos 32**. Los efectos escalan igual (`gdp_growth` ×0.25 y ×4 respectivamente).

Cooldowns por país en `COOLDOWNS`: misión diplomática y ayuda humanitaria 6 meses, ejercicios conjuntos 8, tratado comercial 12, movilización 12. El panel muestra los meses que faltan y deshabilita el botón.

### Comercio O(n²) — mejorado, con una aclaración

Lo que hice: la matriz se calcula **una sola vez por turno** aprovechando que el comercio es simétrico (mitad de los pares), con cache de 4 entradas (el preview alterna entre dos simulaciones y con una sola entrada se pisaban), el factor de distancia de cada par cacheado para toda la partida, y `topPartnerOf()` sin ordenar los 76 socios.

**Resultado honesto**: el turno quedó en 30–42 ms, perfecto. El preview sigue en ~250 ms, no bajó. Medí por partes y el cuello **no era la matriz**: son los clones del estado (76 países serializados varias veces por proyección) y el drift de 76 países × 6 ticks. La primera versión del cache incluso empeoró todo, porque serializar el mundo para armar la clave costaba más que la propia cuenta.

**Para Grok**: podés sumar países. El turno escala bien. Si pasás de ~100, avisame antes: ahí hay que hacer que el preview proyecte solo la fila del jugador en vez del mundo entero, y eso cambia la promesa de "el preview usa exactamente las mismas reglas del turno", así que lo quiero decidir con el jugador.
