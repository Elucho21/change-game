# Cambios del motor — para leer antes de escribir contenido

Bitácora corta y en orden inverso: lo último arriba. Es lo que tenés que saber si volvés después de unos días y no querés releer todo.

**Cada entrada dice**: qué cambió, qué contrato nuevo hay y qué te habilita a vos.

---

## motor/chronicle · 24/08/2026 · Cronica de fin de turno (v1 local)

Primera pieza concreta del roadmap de identidad de `docs/IDENTIDAD_JUEGO_DEMOCRACY_PR_PAX.md`
(prioridad #4). Al cerrar cada turno, `endTurn()` ahora empuja un `FeedItem` extra:
`kind: 'sistema'`, `emoji: '🗞️'`, resumen corto (4-6 lineas) de comercio, petroleo/rutas,
movidas de otras potencias, eventos mundiales y estabilidad/desempleo interno.

### Contrato nuevo

`lib/chronicle.ts`: `buildLocalChronicle(input: ChronicleInput): TurnChronicle`, funcion pura,
sin estado ni IO. No hay `kind` nuevo en `FeedItem` ni campo nuevo persistido: viaja adentro
del `feed` de siempre.

### Que NO hace (v1)

- No compara comercio contra el arranque del mandato, sino contra `st.tradeBase` (arranque de
  partida) — no hay snapshot por mandato todavia.
- No menciona cohesion de bloques ni moral/minoritarios — necesitarian un snapshot pre-tick
  que no esta barato en el punto de enganche (`lib/simulation.ts`/`updateCohesion` tendria
  que exponerlo).
- Es local, no llama a Grok. El puente manual (`GrokBridge.tsx` / `applyGrokJson`) sigue
  aparte y sigue generando su propio feed item `'Cronica del turno (Grok)'`; no se tocaron
  ni se fusionaron.

Si en algun momento se quiere la version enriquecida por Grok (paso 4 del doc de la cronica),
el contrato de `TurnChronicle` ya tiene el campo `source` listo para sumar `'grok'` sin romper
lo que lee `source: 'local'`.

---

## motor/fx-imf · 22/08/2026 · FMI + tipo de cambio en el tick

El índice de tipo de cambio y el arco FMI ya no son módulos sueltos: corren en `deterministicTick()`.

### Contrato nuevo para eventos

```ts
when: (c) => (c.imf?.weight ?? 0) >= 5
when: (c) => c.imf?.stage === 'watch'
when: (c) => (c.fx ?? 100) > 120
```

`EventContext.imf` y `EventContext.fx` son opcionales. `Country.fx` arranca en 100 (sube = depreciación).

### Qué hay

- `lib/imf.ts`: bandas 60/75/90/110, weight 0-18, stages none/watch/mission/program/exit.
- `lib/fx.ts`: índice, pressure, passthrough a inflación, salto al **devaluar**.
- KPI **Tipo de cambio** en la barra.
- Eventos: `fmi_watch` (stage watch) y `fmi` cuando `weight >= 5`.
- `corrida_cambiaria` también puede salir si el índice pasa 115.

---

## dfc6202 · 22/08/2026 · Capital ×2, 31 acciones nuevas, Comunicación, enfriamientos, KPIs con gráfico

Pedido del jugador, en una sola pasada.

### Capital político por ronda: 4 → 8

`CAPITAL_PASSIVE_BASE` en `lib/electoral.ts`. Con la luna de miel de los 100 días, 16.

> Actualicé dos casos de `tests/electoral.test.ts`, que es tuyo. **Tu lógica no cambió**, cambió el número que pidió el jugador: `capitalRegen(60, 60)` ahora da 68 y con luna de miel 76.

### 57 acciones en 6 categorías (eran 26 en 5)

**Toqué `lib/decisions.ts`, que es tu zona.** Lo hice porque el enfriamiento es mecánica de motor y vive *dentro* de cada decisión: partirlo en dos manos habría sido peor. Ampliarlas sigue siendo tuyo.

Cinco acciones nuevas por segmento, más una categoría nueva.

### Categoría `comunicacion`

Actos que no cambian la economía sino **cómo se la vive**: cadena nacional, acto masivo, gira por el interior, entrevista incómoda, campaña de gestión, pedir disculpas.

**Regla dura, con test que la verifica** (`tests/engine.test.ts`, "comunicacion sube el animo sin tocar la economia real"):

- No tocan `gdp_growth`, `inflation` ni `unemployment`.
- Sí mueven `happiness`, `stability` y `capital`.
- Enfriamiento 4: el gesto se gasta si se repite.

Si agregás acciones acá, respetá eso o el test se pone rojo.

### Enfriamiento en todas las decisiones

Antes lo tenían siete acciones diplomáticas, con 6 a 12 meses. Ahora lo tienen las 57, entre **1 y 3 meses** (4 solo en comunicación), porque el jugador lo pidió corto para siempre tener algo que hacer.

```ts
cooldown: 2   // opcional: si no está, se usa el default de la categoría
```

`DEFAULT_COOLDOWN` en `lib/diplomacy.ts`: economía, interior, comercio y diplomacia 2; defensa 3; comunicación 4.

En las **bilaterales el enfriamiento es por país**: podés mandar una misión a Brasil y otra a Chile el mismo mes, pero no dos a Brasil.

### KPIs con gráfico

El historial pasó de 5 a 12 indicadores por turno (`HistoryPoint` en `lib/store.ts`). Cada KPI de la barra abre la evolución de los últimos 24 meses al pasar el mouse.

---

## 3565a51 · 22/08/2026 · Gabinete, coalición, parlamento y Ormuz

Cerró los cuatro pedidos que quedaban en `PEDIDOS_A_OPUS.md`.

### Gabinete — `lib/cabinet.ts`

Cinco sillas. Cada ministro suma un pasivo mensual chico y abarata una categoría de decisiones.

**`MINISTERS` es tuyo.** Dejé dos o tres por silla como referencia. Reglas de balance en `PEDIDOS_A_GROK.md`, pedido 9: pasivos entre 0.1 y 0.6 (se aplican *todos los meses*), `discount` entre 0.75 y 0.95, y todo ministro bueno en algo tiene que ser malo en otra cosa.

### Coalición

Un ministro con `party: 'oposicion' | 'aliado'` presta escaños y votos, y cada 7 meses pasa factura con un pedido incómodo. Decirle que no lo saca del gabinete.

### Parlamento

100 escaños. Sin mayoría (51), las decisiones de 15 o más de capital pagan ×1.4. Los escaños se reparten tras cada presidencial y cada medio término con `seatsFromVote()`.

### Ormuz con dueño

`CHOKEPOINT_OWNER` en `lib/routes.ts`. Si la relación Irán–EE.UU. cae de −40 o la tensión pasa 60, Teherán puede cerrarlo tres meses. **Si el jugador es Irán no se dispara solo**: falta la decisión para que la tome él, y esa decisión es contenido → pedido 10.

---

## 89dd3f0 · 22/08/2026 · Tasador diplomático, comercio a escala, globo estable

### `EventContext` con `politics` y `trade`

Esto es lo que estabas esperando para los eventos de oposición y campaña:

```ts
when: (c) => (c.politics?.opposition ?? 0) > 60
when: (c) => (c.politics?.monthsToElection ?? 99) <= 6
when: (c) => (c.trade?.changeVsStart ?? 0) < -10
```

Campos: `opposition`, `monthsToElection`, `monthsToMidterm`, `poll`, `consecutiveTerms`, `lastTerm`, `honeymoon`, `capital`, `seats`, `coalition`. Y en `trade`: `total`, `changeVsStart`, `topPartner`.

Si necesitás una condición que no se puede expresar con eso, pedímela: agregar un campo opcional al contexto no rompe nada.

### Tasador diplomático — `lib/diplomacy.ts`

El costo y los efectos de una acción bilateral salen del tamaño relativo de la otra economía y de la relación. Desde Argentina, el tratado comercial: Uruguay 6 de capital, EE.UU. 32.

**Si escribís decisiones bilaterales**, poné el costo pensando en una economía del tamaño de la tuya: el motor lo escala solo.

### Comercio

La matriz se calcula una vez por turno. El turno quedó en 30–42 ms con 76 países. El preview sigue en ~250 ms y el cuello no es la matriz: es clonar el estado. **Podés seguir sumando países**; si pasás de ~100, avisá antes.

---

## e3a572f · 22/08/2026 · Plan del turno

**El cambio que más te afecta si escribís contenido.**

Nada de lo que el jugador elige toca el mundo en el momento. Las acciones se acumulan como órdenes (`lib/orders.ts`) y se ejecutan todas juntas al avanzar el mes, en `runPlan()`.

Consecuencias:

- Una decisión o una respuesta a un evento **no mutan el país en el click**.
- El costo se valida contra `availableCapital()`, no contra `capital` crudo.
- Al historial entra **lo ejecutado, no lo intentado**.
- Las órdenes del mismo tipo se consolidan: subir el IVA dos puntos y bajarlo dos deja el plan vacío.

---

## 62fc214 · 22/08/2026 · Eventos que duran, sectores, impuestos, ciclo electoral

- **`ongoing` / `worldOngoing`**: efecto que se repite cada turno mientras dura el evento. Sin eso, `duration` era decorativo. Referencias cargadas: recesión global, pandemia, sequía. **El resto es tuyo** (pedido 3).
- **`sectorEffects`**: golpe a un sector concreto, proporcional a su peso en cada país. Cuando lo uses, **sacá el `gdp_growth` fijo del evento** o el golpe se cobra dos veces (pedido 4).
- **Impuestos** medidos contra la estructura inicial de cada país, no contra una media mundial.
- **Ciclo electoral**: mandato, reelección, sucesor, oposición que converge.
- **Inflación logarítmica y con tendencia**: desinflacionar se premia. Antes, Argentina era matemáticamente injugable.
