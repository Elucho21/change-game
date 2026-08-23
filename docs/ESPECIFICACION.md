# Especificación técnica — Change World Game

Documento único de referencia del sistema. Fusiona el diseño original (`docs/legacy/PAX_HISTORIA_MVP_COMPLETO.md`) con lo que está efectivamente implementado.

**Regla de lectura**: si este documento y el código dicen cosas distintas, manda el código y este documento está desactualizado — arreglalo en el mismo commit.

Última actualización: 22 de agosto de 2026.

---

## 1. Visión

Juego de geopolítica y gran estrategia para un jugador, inspirado en Pax Historia.

- El jugador elige un país y toma decisiones económicas, militares, diplomáticas y políticas.
- El resto del mundo actúa según sus propios intereses, de forma racional.
- El juego **no es lineal**: eventos mundiales, nacionales y de liderazgo generan incertidumbre.
- La partida se juega sobre un **globo 3D interactivo** con países seleccionables, arcos diplomáticos, flujos comerciales y rutas marítimas reales.

Uso personal, un solo jugador.

---

## 2. Arquitectura

```
1. Datos           engine/countries_mvp.json  (24 países, fuente de verdad)
                   lib/blocs.ts · lib/events/* · lib/decisions.ts · lib/routes.ts
2. Transformación  scripts/build-data.mjs  →  lib/data/countries.gen.json
3. Motor           lib/engine.ts · lib/trade.ts · lib/simulation.ts · lib/orders.ts · lib/store.ts
                   lib/persistence.ts (guardado) · lib/points.ts (puntos del mapa)
4. Capa de IA      docs/PROMPT_MAESTRO.md + puente en components/GrokBridge.tsx
5. Interfaz        components/*.tsx sobre react-globe.gl
6. Despliegue      Vercel (Next.js 15, sin variables de entorno)
```

El motor Python original (`engine/game_engine.py`) sigue en el repo y sigue funcionando como CLI. La web no lo ejecuta: reimplementa las mismas reglas en TypeScript, con las mismas fórmulas de drift y las mismas probabilidades de evento, para que las dos versiones se comporten igual.

### Flujo de un turno

```
1. El jugador arma el PLAN del turno: decisiones, impuestos, bloques y
   respuestas a eventos. Nada toca el mundo todavia; puede sacar lo que quiera.
2. Los eventos abiertos esperan respuesta (la respuesta tambien va al plan)
3. "Avanzar mes":
   0. Se ejecuta el plan completo y entra al historial, una linea por accion
   a. Los eventos sin responder se aplican solos, con penalidad de estabilidad
   b. Avanza el calendario
   c. Se recalcula el comercio bilateral de todos los países
   d. Drift económico (crecimiento, inflación, desempleo, deuda, humor social)
   e. Las rutas marítimas cerradas encarecen el petróleo y el flete
   f. Se recalcula la cohesión de cada bloque
   g. Se sortean los eventos del turno
   h. El resto del mundo reacciona a lo que hiciste
   i. Se recupera capital político
   j. Se evalúa el fin de partida
4. (Opcional) El puente con Grok agrega reacciones finas y la crónica
```

---

## 3. Países

24 países, todos con datos completos desde el inicio.

**Sudamérica completa**: Argentina, Bolivia, Brasil, Chile, Colombia, Ecuador, Guyana, Paraguay, Perú, Surinam, Uruguay, Venezuela.
**Norteamérica**: Estados Unidos, Canadá, México.
**Europa**: Reino Unido, Francia, Alemania, España.
**Asia y Eurasia**: China, Japón, Corea del Sur, Corea del Norte, Rusia.

Forma de cada país en `engine/countries_mvp.json`:

```json
{
  "name": "Argentina",
  "region": "South America",
  "capital": "Buenos Aires",
  "playable": true,
  "economy": {
    "gdp_trillion_usd": 0.65, "gdp_growth": 2.0, "unemployment": 7.0,
    "inflation": 140, "gold_reserves_tonnes": 62, "debt_to_gdp": 90,
    "fiscal_balance": -3.0, "tax_iva": 21, "tax_corporate": 35, "tax_income_avg": 25
  },
  "population": {
    "total_millions": 46.5, "male_pct": 48.9, "female_pct": 51.1,
    "unemployed_millions": 1.6, "minorities": {}, "happiness": 58, "stability": 50
  },
  "military": {
    "active_soldiers": 72000, "reserves": 20000, "aircraft": 140, "submarines": 2,
    "nuclear_warheads": 0, "tanks": 300, "naval_ships": 40, "military_budget_bn": 3.5
  },
  "sectors": { "industry": 25, "agriculture": 8, "services": 60, "commerce": 12, "tourism": 4 },
  "relations": { "Brazil": "amistoso", "default": "neutral" },
  "traits": {
    "ideology": "liberal_democracy", "aggression": 0.2, "risk_tolerance": 0.45,
    "nuclear_doctrine": "none", "priorities": ["inflation_control", "exports"]
  }
}
```

Los números mantienen proporcionalidad lógica, no exactitud estadística. Están elegidos para que el juego esté balanceado.

`scripts/build-data.mjs` le agrega a cada país: código ISO3 (`ADM0_A3` del GeoJSON), coordenadas de la capital, bandera, y convierte las relaciones de texto a números:

| Etiqueta | Valor |
|---|---|
| aliado | +80 |
| amistoso | +55 |
| neutral | 0 |
| tenso | −40 |
| hostil | −75 |

La matriz resultante es **simétrica**: se promedia lo que cada país declara del otro. En el juego se muestran de vuelta como etiquetas (`relLabel()`: ≥70 aliado, ≥25 amistoso, >−25 neutral, >−60 tenso, resto hostil).

---

## 4. Bloques, alianzas y uniones aduaneras

10 bloques en `lib/blocs.ts`, en cuatro tipos:

| Tipo | Qué hace | Bloques |
|---|---|---|
| `militar` | disuasión, artículo 5, tensa con rivales | OTAN, Indo-Pacífico |
| `aduanera` | arancel interno 0, arancel externo común, multiplica el comercio ×1.5 | MERCOSUR, UE, T-MEC, CAN |
| `economica` | inversión y tecnología, multiplica el comercio ×1.2 | BRICS+, Alianza del Pacífico, OPEP+ |
| `politica` | peso diplomático, sin obligaciones económicas | CELAC |

Cada bloque tiene **cohesión** (0–100) que se mueve sola cada turno hacia la relación promedio entre sus miembros, y pondera todos sus efectos: un bloque con cohesión 40 entrega menos de la mitad de sus beneficios.

**Ingresar** exige relación ≥ 40 (militar) o ≥ 20 (resto) con *todos* los miembros, cuesta 25 o 18 de capital político, mejora +10 la relación con cada socio y empeora −15 con cada rival del bloque.
**Salir** cuesta 15 de capital, −20 de relación con cada ex socio, −0.5 de crecimiento y −3 de estabilidad.
**Convocar una cumbre** cuesta 10 de capital y da +8 de cohesión y +8 de relación con los socios.

---

## 5. Comercio bilateral

Implementado en `lib/trade.ts` con un **modelo de gravedad**: dos economías comercian más cuanto más grandes son y menos cuanto más lejos están.

```
volumen(A,B) = √(PBI_A × PBI_B) × 112 / (distancia_km/1000 + 1)^0.6
               × (1 + relación/250)          relación diplomática: 0.6 a 1.4
               × multiplicador de bloque      aduanera +0.5 · económica +0.2 · militar +0.1
               × factor de rutas              si la distancia supera 6.000 km
               × 0.15 si hay sanciones
```

La constante 112 está calibrada contra pares conocidos: China–EE.UU. ≈ 580, EE.UU.–México ≈ 350, Brasil–China ≈ 130 (miles de millones de USD al año).

**Por qué importa en el juego**: al empezar la partida se guarda el comercio total de cada país (`tradeBase`). Cada turno se compara el comercio actual contra ese baseline y la diferencia entra directo al crecimiento:

```
efecto sobre el crecimiento = (comercio_actual / comercio_inicial − 1) × 2     [límite ±2]
```

Perder 20% del comercio cuesta 0.4 puntos de crecimiento, todos los meses, hasta que lo recuperes. Por eso sancionar a tu principal socio te duele a vos también, y por eso entrar a una unión aduanera se nota.

---

## 6. Rutas marítimas y chokepoints

En `lib/routes.ts`. Seis rutas reales dibujadas con `pathsData`, cada una pasando por uno o más **chokepoints**:

| Ruta | Pasa por | Volumen |
|---|---|---|
| Asia → Europa | Malaca, Suez, Gibraltar | 480 |
| Asia → Costa Oeste EE.UU. | — | 390 |
| Asia → Costa Este EE.UU. | Panamá | 220 |
| Sudamérica → China | Malaca | 180 |
| Golfo Pérsico → Asia | Ormuz, Malaca | 350 |
| Sudamérica → Europa | Gibraltar | 160 |

Chokepoints: **Ormuz** (20% del petróleo mundial), **Malaca** (15%), **Suez** (8%), **Gibraltar** (4%), **Panamá** (3%).

Cuatro eventos mundiales los cierran: cierre de Ormuz, bloqueo de Suez, sequía en Panamá e incidente en Malaca. Mientras un chokepoint está cerrado:

- las rutas que pasan por ahí se dibujan en rojo y punteadas,
- el comercio de larga distancia (>6.000 km) cae hasta 45% según cuánto volumen quedó fuera,
- el barril sube cada turno en proporción a la participación petrolera del paso cerrado.

Es la diferencia entre una capa decorativa y una mecánica: cerrar Ormuz te sube la inflación de verdad.

---

## 7. Sistema de eventos

| Tipo | Probabilidad por turno | Cantidad | Archivo |
|---|---|---|---|
| Mundial | 25% | 18 | `lib/events/world.ts` |
| Nacional | 35% | 16 | `lib/events/national.ts` |
| Liderazgo | 15% | 4 | `lib/events/national.ts` |

Dentro de cada tipo se sortea por `weight`, filtrando por la condición `when` y descartando los 8 eventos más recientes para que no se repitan. Un evento con `choices` frena el turno; si lo ignorás, se aplica solo y perdés estabilidad.

Además hay un evento **forzado** sin sorteo: crisis institucional, cuando estabilidad < 30 y felicidad < 40.

El catálogo completo, con condiciones y opciones, está en `docs/EVENTOS.md` y en la pestaña 📚 Eventos del juego.

---

## 8. Decisiones del jugador

57 decisiones en `lib/decisions.ts`, en seis categorías: **economía** (12), **interior** (11), **comercio** (9), **diplomacia** (10), **defensa** (9) y **comunicación** (6). Cada una muestra su impacto antes de confirmar.

**Comunicación** son actos que no cambian la economía sino cómo se la vive: cadena nacional, acto masivo, gira por el interior, entrevista incómoda, campaña de gestión y pedir disculpas. Suben felicidad, estabilidad y capital político, y tienen 4 meses de espera porque el gesto se gasta si se repite.

**Todas las acciones tienen enfriamiento**: entre 1 y 3 meses según el peso de la medida, 4 en comunicación. En las bilaterales el enfriamiento es por país.

El recurso que las limita es el **capital político** (0–100): se gasta al decidir y se recupera cada turno según

```
capital += 8 + (felicidad − 60) / 10        (×2 durante los 100 días)
```

Un gobierno con la gente en contra se queda sin margen para gobernar. Esa es la restricción central del juego.

---

## 9. Reglas de comportamiento de la IA

Valen tanto para la heurística local (`aiReactions()` en `lib/engine.ts`) como para Grok:

1. Cada país defiende **sus** intereses nacionales de forma racional.
2. Nunca reacciones estúpidas o suicidas, salvo Corea del Norte o regímenes muy ideológicos en situaciones existenciales.
3. Las reacciones varían: fuertes, de espera, de bajo perfil, de oportunidad.
4. Sin monotonía ni repetición.
5. El juego **no debe ser fácil**: fricción, trade-offs y consecuencias de segundo orden.
6. Se considera siempre: relación actual, prioridades estratégicas, agresividad y tolerancia al riesgo del que reacciona.

La heurística local calcula una "relevancia" por país (relación + bloques compartidos + vecindad + agresividad) y solo reaccionan los relevantes, máximo cuatro por turno.

---

## 10. Capa visual

**Librería**: `react-globe.gl` (three.js). Componente: `components/GlobeView.tsx`.

| Capa | Prop | Qué muestra |
|---|---|---|
| Países | `polygonsData` | selección, hover, color según el modo de mapa |
| Arcos diplomáticos | `arcsData` | alianzas (azul), aduanas (verde), tensión (naranja animado), sanciones (rojo) |
| Flujos comerciales | `arcsData` | grosor y opacidad según volumen; rojo si hay sanciones |
| Rutas marítimas | `pathsData` | seis rutas reales, rojas y punteadas si están interrumpidas |
| Chokepoints | `pointsData` | cinco pasos críticos, rojos cuando están cerrados |
| Puntos | `pointsData` | chokepoints, capitales, puertos y aeropuertos (`lib/points.ts`) |
| Alertas | `ringsData` | anillo pulsante donde hay un evento esperando decisión |

**Modos de mapa**: relaciones · bloques · estabilidad · economía.
**Capas que se prenden y apagan**: diplomacia · comercio · rutas marítimas · puntos (capa maestra) · capitales · puertos · aeropuertos.

Los puertos y aeropuertos están soportados por el motor y la UI pero todavía sin datos: ver `docs/PEDIDOS_A_GROK.md`.

Los polígonos se pintan cruzando `ADM0_A3` del GeoJSON con el ISO3 de cada país. Se usa `ADM0_A3` y no `ISO_A3` porque en Natural Earth 110m Francia y Noruega tienen `ISO_A3: "-99"`.

Texturas y mapa servidos desde `public/` (no desde CDN): `earth-night.jpg`, `earth-topology.png`, `countries.geojson`.

---

## 10.1 Preview de consecuencias

Antes de confirmar una decisión, el juego proyecta **3 meses** hacia adelante. La cuenta la hace `projectDecision()` (`lib/simulation.ts`): corre dos simulaciones deterministas en paralelo —con la decisión y sin ella— y muestra la diferencia mes a mes.

Devuelve tres cosas:

1. **Métricas**: felicidad, estabilidad, crecimiento, inflación, desempleo, balance fiscal, deuda, capital político y comercio total, con su delta inmediato y a +1, +2 y +3 meses.
2. **Avisos**: umbrales que se cruzan por culpa de la decisión (estabilidad bajo 30, deuda sobre 100% del PBI, desempleo sobre 12%, países que pasan a hostil…).
3. **Eventos que habilita o desactiva**: evalúa la condición `when` de los 38 eventos contra el estado proyectado y avisa cuáles se vuelven posibles. Un ajuste fiscal, por ejemplo, habilita "Marcha opositora masiva" al hundir la felicidad debajo de 58.

No incluye eventos aleatorios: muestra la tendencia que la decisión empuja, no el futuro exacto.

## 10.2 Guardado de partida

Automático en `localStorage` (`change-game:save`, versión 1) al cerrar cada acción que cambia el mundo. Al abrir la página, la partida se retoma sola; la pantalla de inicio ofrece continuar o descartar. Detalles y política de versionado en `docs/REGLAS_DE_CODIGO.md`, sección 5.2.

## 10.3 Gabinete, coalición y parlamento

Cinco sillas (Economía, Interior, Exterior, Defensa, Jefatura). Cada ministro aporta un pasivo mensual chico y abarata una categoría de decisiones. Sentar a alguien de otro partido arma una **coalición**: presta escaños y votos, y cada 7 meses pasa factura con un pedido incómodo. Decirle que no lo saca del gabinete.

El **parlamento** son 100 escaños que se reparten tras cada presidencial y cada medio término, siguiendo al voto sin copiarlo. Sin mayoría (51), las decisiones de 15 o más de capital pagan ×1.4: la reforma laboral cuesta 21 con coalición y 30 sin ella.

El costo final de una decisión junta tres frentes: la oposición en la calle, la mayoría en el Congreso y el ministro del área.

## 10.4 Tasador diplomático

Una acción bilateral vale según con quién. `scaleDecision()` (`lib/diplomacy.ts`) ajusta costo y efectos por el tamaño relativo de la otra economía y por la relación actual. Desde Argentina, el tratado comercial: **Uruguay 6 de capital, Estados Unidos 32**, con efectos escalados en la misma proporción. Las acciones diplomáticas tienen cooldown por país para que repetirlas no sea una estrategia.

## 11. Fin de partida

| Final | Condición |
|---|---|
| Golpe de Estado | estabilidad ≤ 8 |
| Renuncia forzada | felicidad ≤ 8 |
| Hiperinflación | inflación > 300% |

---

## 12. Puente con la IA

El botón 🤖 Grok arma un prompt compacto (~1.600 caracteres) con el estado del jugador, sus relaciones, sus bloques, lo que hizo en el turno y los eventos abiertos. Grok responde JSON y el juego lo aplica.

Formato exacto y límites en `docs/GROK.md`. Los cambios de relación se recortan a ±25 y los efectos internos a ±15 por turno, para que la capa narrativa no rompa el balance numérico.

---

## 13. Estado del proyecto

**Implementado**: globo 3D con seis capas conmutables · 24 países · 10 bloques con mecánica · comercio bilateral por gravedad · rutas marítimas con chokepoints y crisis · 38 eventos · 25 decisiones con preview de consecuencias a 3 meses · capital político · reacciones de la IA · puente con Grok · guardado automático · fin de partida.

**Lo que sigue**, priorizado en `docs/PLAN_MEJORAS.md`: aranceles jugables por país y sector · sectores productivos que reaccionen · ciclo electoral con oposición parlamentaria · guerra limitada con los datos militares que ya existen · ampliación a 60+ países.

---

## 14. Documentos relacionados

| Documento | Para qué |
|---|---|
| `docs/REGLAS_DE_CODIGO.md` | **obligatorio antes de escribir código** |
| `docs/PEDIDOS_A_GROK.md` | datos y contenido que el motor ya soporta y faltan cargar |
| `docs/PLAN_MEJORAS.md` | qué se hizo y qué sigue |
| `docs/EVENTOS.md` | catálogo de eventos y cómo agregar uno |
| `docs/GROK.md` | formato del puente y reparto de trabajo |
| `docs/PROMPT_MAESTRO.md` | prompt original de la capa de simulación |
| `docs/legacy/PAX_HISTORIA_MVP_COMPLETO.md` | documento de diseño original (histórico) |
