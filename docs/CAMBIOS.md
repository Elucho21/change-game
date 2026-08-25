# Cambios del motor — para leer antes de escribir contenido

Bitácora corta y en orden inverso: lo último arriba. Es lo que tenés que saber si volvés después de unos días y no querés releer todo.

**Cada entrada dice**: qué cambió, qué contrato nuevo hay y qué te habilita a vos.

---

## motor/economia-con-memoria · 24/08/2026 · La economia deja de auto-curarse sola

Diagnostico del plan de auditoria (D4): todo mean-revertia. La inflacion bajaba siempre
(`inflation *= 0.98`) sin importar el deficit; la deuda subia pero nunca costaba nada (sin
intereses, sin riesgo pais); el crecimiento convergia a 2% mirando solo el mes actual (cualquier
desastre se disolvia en ~6 meses); y el jugador tenia DOS motores de desempleo pisandose (uno
"mudo" en `naturalDrift`, otro real en `tickEmployment`). Las decisiones se lavaban solas.

**Decision explicita de diseño (pedida por el jugador): se cambio el modelo, no se agregaron
terminos apagados por defecto.** Una partida guardada se comporta distinto de ahora en mas.

### Contrato nuevo

```ts
naturalDrift(countries, blocs, world, tradeEffect, taxBase, playerCode?)  // 6to param nuevo
interestBurden(debtToGdp, rate, imfWeight)              // lib/centralBank.ts
sectoralEmploymentIntensity(sectors)                     // lib/employment_sectors.ts (por fin se usa)
Country.investmentMemory?: number                        // 0-100, nuevo campo opcional
EmploymentTickInput.sectorIntensity?: number              // lib/employment.ts
```

### Que hay (items #7, #8, #10, #11, #12 del plan)

- **#7 · Deficit -> inflacion**: con `fiscal_balance < -2` Y `debt_to_gdp > 70` a la vez (doble
  condicion: un deficit chico o puntual no alcanza), el faltante se monetiza y empuja inflacion,
  acotado a +0.6/mes.
- **#8 · Intereses de deuda**: `interestBurden` cobra cada mes sobre `fiscal_balance`, proporcional
  a la deuda y a una tasa EFECTIVA (`cb.rate` + prima de riesgo que sube con la deuda y con el
  weight del FMI). Techo de 1 punto de PBI/mes: ni el peor escenario tumba la economia en un solo
  mes.
- **#10 · `investmentMemory`**: memoria lenta (converge a 6%/mes, mismo idioma que Confianza del
  Banco Central) que lee estabilidad y deuda, y empuja el target de `gdp_growth` de forma aditiva.
  Rompe el iman de crecimiento a 2%: un pais destruido carga el estigma mucho mas de lo que tarda
  en calmarse la estabilidad que lo origino.
- **#11 · Un solo motor de desempleo para el jugador**: `naturalDrift` ya no toca el desempleo del
  pais del jugador (nuevo parametro `playerCode`) — sigue tocando el de los paises de IA, que no
  tienen `tickEmployment` propio.
- **#12 · Empleo por sector, por fin cableado**: `sectoralEmploymentIntensity` (peso real de
  turismo/agro/industria/etc. del pais) multiplica tanto el Okun's-law de `naturalDrift` (paises IA)
  como el termino de PBI de `tickEmployment` (jugador). El mismo `gdp_growth` baja mas el desempleo
  en un pais turistico que en uno minero.

### Que quedo explicitamente afuera (item #9)

**Separar caja de gasto estructural de gasto one-off** (`fiscal_balance` como stock permanente vs.
flujo) se evaluo y se dejo FUERA de esta pasada: arreglarlo de verdad implica re-tipar el efecto
fiscal de las ~90 decisiones y ~40 eventos del catalogo (distinguir cual es un costo de una vez y
cual es una reforma estructural), no un cambio de formula. Es un refactor de contenido, no de
motor, y el riesgo/alcance no entraba en esta sesion. Sigue en el backlog.

### Verificacion

262 tests de motor pasaban antes; 317 tests pasan ahora (30 nuevos: canal deficit-inflacion,
intereses, hysteresis de `investmentMemory`, desempleo unico, intensidad sectorial, y un guardia de
"no rompe la economia en 60 turnos" ampliado a 5 paises con perfiles distintos, mas un pais
castigado a proposito). Jugado en vivo: una partida totalmente pasiva (ignorando toda decision y
evento 25 turnos) termina en golpe de Estado real por primera vez con este motor — antes se hubiera
auto-curado. Una partida con ajuste fiscal activo estabiliza deuda e inflacion sin romperse.

---

## motor/grupos-con-dientes · 24/08/2026 · Los 5 grupos sociales dejan de ser decoracion

El jugador reporto que los 5 grupos "no aparecen en el juego ni en pantalla y no tienen funciones o
impacto". Cierto: `groupEffects` solo estaba en 5 de ~95 decisiones y 0 eventos, el feed narraba un
unico caso ("empresarios contentos"), y el impacto mecanico total eran 30% de `poll()` mas un
±0.6 de capital politico al mes via `mediaCapitalEffect`. Ningun grupo podia romper nada.

### Contrato nuevo (lib/popularGroups.ts)

```ts
groupConsequences(groups)  // huelga, fuga de capitales, caida de inversion, cacerolazo
GROUP_CRISIS_THRESHOLD     // 30: bajo eso, el grupo deja de ser paciente
groupSwingFeed(group, delta)  // copy narrable para CUALQUIER swing notable, no solo uno
```

### Que hay

- **Cobertura de `groupEffects`**: ~45 decisiones (economia, interior, comercio, defensa,
  previsional, infraestructura) y 6 eventos nacionales grandes con 18 opciones (piquete, paro
  general, corrupcion, corrida cambiaria, FMI, boom de commodities) — antes 5 decisiones, 0
  eventos.
- **Consecuencias duras** (`groupConsequences`): un grupo bajo `GROUP_CRISIS_THRESHOLD` (30) gatilla
  un efecto real todos los meses hasta que se recupere — obrera: huelga (happiness/stability), alta:
  fuga de capitales (reservas), empresarios: caida de inversion (gdp_growth), clase media:
  cacerolazo (capital politico). El delta pega en silencio cada mes (mismo patron que `ongoing` en
  eventos); el feed **solo narra el mes que cruza el umbral**, para no repetir el bug de spam que se
  corrigio en Enrique el mismo dia.
- **Feed completo**: `groupSwingFeed` narra cualquier swing notable de cualquier grupo, no solo
  empresarios subiendo.
- **Preview en eventos**: `Feed.tsx` ahora arma el preview de `EventCard` con `previewGroupDelta`
  ademas de `previewDelta`/`previewMoralDelta` — antes las opciones de evento con `groupEffects`
  no mostraban nada.
- **GroupsPanel.tsx**: flecha de tendencia (6 meses) + mini-sparkline por grupo (nuevos campos
  opcionales `groupEmpresarios/groupClaseMedia/groupObrera/groupAlta/groupFieles` en `HistoryPoint`,
  lib/store.ts) y marca ⚠️ + aviso cuando un grupo esta en crisis.

### Que te habilita

Contenido nuevo (decisiones, eventos, ministros) que sume `groupEffects` entra automaticamente al
preview, al feed y a las consecuencias duras sin tocar motor.

---

## motor/partidos-opositores · 24/08/2026 · Los dos partidos opositores dejan de ser dos strings

El jugador reporto que "los partidos minoritarios no aparecen ni tienen impacto". Ademas de los 3
lideres (ver entrada de mas abajo, mismo dia), los dos partidos opositores mayores eran hasta v1.3
literalmente dos nombres sorteados de un pool de diez, con una unica ventana de negociacion en toda
la partida (el evento `oferta_coalicion`, a 3 meses de la eleccion, una vez por mandato).

### Contrato nuevo (lib/politics.ts)

```ts
normalizeOppositionParties(raw, partyName)  // acepta la forma vieja (2 strings) y la nueva
parliament(p, moral, coalitionSeats)        // reparto DERIVADO de los 100 escanos del Congreso
partyCostFactor(p, category)                // 0.8x-1.3x segun ideologia + humor de cada partido
tickOppositionParties(parties, input)       // humor mensual: converge segun lo que hizo el gobierno
coalitionPrice(party, seats)                // precio variable del pacto, no fijo
```

`Politics.oppositionParties` ahora es `OppositionParty { name, ideology, mood, inCoalition }`.
Retrocompatible: `normalizeOppositionParties` acepta las dos formas, asi que los saves viejos
(2 strings) siguen cargando.

### Que hay

- **Ideologia real** (liberal / conservador / socialdemocrata / nacionalista / progresista), cada
  una con 2 categorias que acompana y 2 que bloquea (`PARTY_STANCE`).
- **Humor propio** (0-100) que se mueve todos los meses segun las categorias de decision que
  ejecutaste, la corrupcion a la vista y la felicidad general.
- **Parlamento derivado**: `parliament()` reparte los 100 escanos entre oficialismo+coalicion,
  los dos partidos opositores y los 3 minoritarios (via `minorityVoteShare`, lib/moral.ts). No se
  guarda: se recalcula siempre de sus tres fuentes, para que nunca se desincronice.
- **Pacto parlamentario en cualquier momento** (`pacto_parlamentario_a/b`, lib/decisions.ts,
  categoria comunicacion): dos decisiones nuevas, no un evento de ventana fija. Sus `cost.capital`
  del catalogo son simbolicos; `decisionCost` (lib/store.ts) detecta `PACT_DECISION_INDEX` y usa
  `coalitionPrice` en su lugar. Un partido sentado aporta sus bancas a la mayoria de verdad
  (`parliamentCostFactor`, `comisionIntegrityEffective`).

### Que te habilita

Contenido que lea `EventContext.politics.parties` (ideologia, humor, `inCoalition`, escanos de
cada partido) para condicionar decisiones y eventos por el tablero parlamentario real, no solo por
el numero agregado de `opposition`.

---

## motor/enrique-cadencia · 24/08/2026 · Enrique deja de ser un peaje mensual

El jugador reporto "son muchas ofertas de corrupcion y siempre las mismas". Era un bug de cadencia,
no de falta de cartas.

**Que estaba mal:** `enriqueEvents()` forzaba carta si `investigacion > 35`. Como `investigacion`
sube todos los meses en `tickMoral` y casi nunca vuelve a bajar, a partir del mes ~12 (sin mayoria)
salia **una carta por mes para el resto de la partida**. Y el `pick` era uniforme sin memoria: la
misma carta podia salir dos y tres meses seguidos.

### Contrato nuevo

```ts
enriqueEvents(moral, onboarded, turn)          // `turn` es nuevo y define el espaciado
enriqueAppearChance(moral)                     // rampa 0.12 -> 0.60, nunca 1
registerEnriqueCard(moral, cardId, turn)       // deja el registro para cooldown
applyEnriqueOutcome(moral, moralEffects, turn) // mueve la confianza tras jugar la carta
```

Campos nuevos y **opcionales** en `MoralState` (los saves viejos siguen cargando):
`enriqueSeen`, `enriqueLastTurn`, `enriqueTrust`, `enriqueSilentUntil`.

### Que hay

- **Rampa de probabilidad** en vez de puerta binaria: `ENRIQUE_MIN_GAP = 3` turnos entre cartas
  (1 solo si `investigacion > 70`), y `enriqueAppearChance` topeada en 60%.
- **Cooldown de 12 turnos por carta** y seleccion que prioriza lo que el jugador nunca vio.
- **Confianza (`enriqueTrust`, -3..+3)**: se deduce de los `moralEffects` de la opcion elegida.
  Tres rechazos seguidos lo ofenden y desaparece 10 meses; ademas los `favoresActivos` se caen al
  doble de rapido mientras esta ofendido.
- `enrique_oferta_final` ahora **tambien pide confianza >= 1**: la carta grande no se le ofrece a
  un presidente que le viene diciendo que no.

### Que te habilita

Cartas nuevas de Enrique con `moralEffects` claros (corrupcion/favores arriba = "acepto",
corrupcion abajo o integridad arriba = "rechazo"): la confianza las lee sola, no hay que tocar
motor para que una carta nueva entre en el arco.

---

## fix/build-data · 24/08/2026 · CI (y `npm run data`) rotos desde el 13e0e89

`scripts/build-data.mjs` tenia una `}` faltante (el objeto de un pais dentro del `for`
nunca cerraba) desde el commit "Motor de popularidad por sector". Era un `SyntaxError`
real: rompia tanto `npm run data` como el paso de lint de CI, en todos los PR y en `main`
mismo, desde ese commit. Arreglado con una sola llave — no toco `engine/countries_mvp.json`
ni el JSON generado, nadie lo modifico en el medio asi que no hay drift.

Es tecnicamente zona Grok (Datos), pero es una llave faltante sin decision de contenido
de por medio y estaba bloqueando el CI de todo el repo, asi que lo arregle sin esperar.
Si preferis que este tipo de arreglo puramente sintactico pase siempre por vos, avisame
y lo dejo en `docs/PEDIDOS_A_GROK.md` la proxima vez en vez de tocarlo.

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
