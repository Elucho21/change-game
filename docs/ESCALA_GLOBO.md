# Escala: datos, flujos y el globo (antes de los 100 países)

Estudio, no código de motor. Lo pidió el jugador al leer el aviso de Opus: *si pasás de ~100, avisame*. Hoy hay **76 jugables**. Este texto es el plan para que cargar más no mate la velocidad ni convierta el planeta en un ovillo de arcos.

Opus ya midió (commit `89dd3f0`):

| Qué | 76 países |
|---|---|
| Un turno | 30–42 ms |
| Preview a 3 meses | ~250 ms |
| Cuello del preview | clonar el estado + drift de 76 países × 6 ticks, **no** la matriz de comercio |
| Cuello viejo (ya recortado) | matriz n², ahora 1 vez por turno, simétrica, cache de distancias |

El globo **ya dibuja el mundo entero**. Natural Earth 110m trae **177 polígonos**. Solo 76 tienen ficha jugable. Sumar países al JSON **no suma polígonos**: colorea los que ya están. Eso cambia todo el diagnóstico.

---

## 1. Dónde está el peso, de verdad

### Carga (abrir la partida)

| Archivo | Hoy | A 100 | A 177 (todo el GeoJSON jugable) |
|---|---|---|---|
| `countries.geojson` | 477 KB, 177 features, ~10.600 puntos | igual | igual |
| `earth-night.jpg` + bump | 1.07 MB | igual | igual |
| `countries.gen.json` | 171 KB (76 + 2.850 pares) | ~220 KB / 4.950 pares | ~350 KB / 15.576 pares |
| First Load JS (build) | ~171 KB | sube con el JSON embebido | — |

La textura y el GeoJSON **ya son el piso**. No se tocan. El JSON de países crece lineal; la **matriz de relaciones** crece n² en disco. A 177 sigue siendo chico para la red (medio MB). El problema no es descargar: es **clonar ese objeto seis veces por preview** y **pintar capas de three.js**.

### CPU (cada turno / preview)

- Drift económico: O(n). A 100 ~ +30% sobre 76. Sigue barato.
- Preview: 2 simulaciones × 3 meses = 6 ticks sobre **todo** el mundo. A 100, ~330 ms si escala lineal. A 150, medio segundo. Ahí Opus avisó: proyectar solo la fila del jugador **rompe** “el preview usa las mismas reglas”. Hay que decidirlo con el jugador, no callarlo.
- Comercio: ya no es el cuello. No volver a serializar el mundo para armar la clave del cache (Opus lo midió: empeoraba).

### GPU (el planeta)

three-globe, medido antes: ~288 polígonos, ~110k triángulos, ~30 fps. Las capas caras no son los países: son **arcos animados** (`arcDashAnimateTime`), **paths** de rutas y **puntos sin merge**.

Hoy el dibujo está contenido:

- Diplomacia: estrella por bloque (hub → miembros) + tensiones del jugador y de USA/China/Rusia. No es n².
- Comercio: top 8 socios del jugador + pares entre USA, China, Alemania, Japón. ~12 arcos, no 2.850.
- Rutas: 6 paths fijos.
- Puntos: puertos + aeropuertos + chokepoints. `pointsMerge={false}` → un mesh por punto.

**El riesgo al pasar 100 no es “se cae el globo”. Es que alguien dibuje todos los flujos o todas las capitales a la vez.**

---

## 2. Datos: cómo no ahogar la carga

Reglas para cuando se descongele el JSON (hoy: 76, se puede sumar; **avisar a Opus antes de cruzar 100**).

1. **No subir el GeoJSON.** 110m es el techo. 50m duplicaría vértices y no se siente en un globo de este tamaño.
2. **Relaciones sparse.** Guardar solo pares ≠ default. `build-data.mjs` ya promedia declaraciones; el gen.json no necesita 15.000 ceros. Un `default` por país + excepciones recorta el save y el clone del preview.
3. **No meter la matriz en el save.** El save ya es ~38 KB. Si un día se serializan 5.000 pares, el `localStorage` se pone pesado. Persistí sanciones, no el grafo entero.
4. **Fichas livianas para no jugables.** Si un día se colorean los 177, la mayoría puede ser stub: PBI, capital, ISO. Sin militares ni minorities. El motor de drift puede saltárselos o usar un tick barato.
5. **ISO3 = `ADM0_A3`.** Ya es la regla. Un país mal codeado no se pinta y parece un bug de fps.

Umbrales:

| n jugables | Qué hacer |
|---|---|
| 76 | estado actual, turno 30–42 ms |
| 77–99 | se puede sumar; Grok avisa en el PR cuántos van |
| **100** | **avisar a Opus antes del merge.** Preview y clone se discuten |
| 120+ | relaciones sparse + preview de fila del jugador, o el preview pasa de 400 ms |
| 177 | todo el 110m jugable. Solo con LOD de capas y tick barato para stubs |

---

## 3. Flujos: que el planeta no sea un ovillo

Nunca dibujar el grafo completo. A 100 países, 4.950 arcos tiran el fps a piso y no se lee nada.

### Lo que ya está bien (no romperlo)

- Comercio: top-N del jugador + 4 majors.
- Bloques: estrella, no clique.
- Rutas marítimas: 6, no “todas las líneas navieras del mundo”.

### LOD por altura de cámara (Opus, `GlobeView`)

`pointOfView().altitude` ya existe. Usarlo como filtro, no como postproceso:

| Altitud | Se ve |
|---|---|
| > 2.4 (mundo) | polígonos + chokepoints + 4 flujos majors. Sin capitales, sin puertos, sin aeropuertos |
| 1.4–2.4 | + top 8 flujos del jugador + diplomacia del jugador |
| < 1.4 (región) | puertos y aeropuertos de esa región, capitales |

Capas que el jugador ya puede apagar (Diplomacia / Comercio / Rutas / Puntos). El LOD es el default inteligente; los botones siguen mandando.

### `pointsMerge`

Con decenas de puertos, `pointsMerge={true}` junta en un mesh. Se pierde el label por punto: el tooltip se resuelve por picking propio o se deja solo en zoom cercano. Vale la pena a 80+ puntos.

### Flujos que se sienten, no que se cuentan

- Grosor ∝ log(volumen), no lineal. China–USA no tiene que ser un tubo que tape África.
- Color por **variación**, no solo por volumen: verde si el flujo creció vs el arranque, rojo si se derrumbó. Eso es el impacto, no el adorno.
- Tope duro: **≤ 20 arcos de comercio en pantalla**, siempre. Si hay más socios, el resto vive en el panel, no en el aire.

---

## 4. Interfaz: cómo se usa un planeta con 100 nombres

El globo no escala como lista. A 76 ya cuesta encontrar Kenia. A 100, sin buscador, el mapa es lindo e inútil.

1. **Buscador de país** (input en el shell, filtra por nombre / ISO, `select(code)` + vuelo de cámara). Barato, alto impacto. Un componente, no toca el motor.
2. **Lista por región** en el start y en un drawer: América / Europa / África / Asia / Oceanía. El JSON ya tiene `region`.
3. **Hover estable.** Opus acaba de sacar el parpadeo (ref estable, transición 0). No reintroducir `polygonsTransitionDuration` alto.
4. **Click vs drag.** En móvil, el globo se pelea con el panel. Vista móvil está en espera (Sprint 5); hasta entonces, un tap en polígono selecciona y no tiene que abrir tres paneles a la vez.
5. **El plan del turno no debe recolorear 177 polígonos.** Comprometer capital no cambia relaciones: el globo no se suscribe a `orders`. Hoy el selector ya evita el feed; hay que **no** suscribirse a `capital` ni a `orders`.

---

## 5. Impacto sobre el planeta (que se vea lo que hiciste)

Hoy el globo es un mapa de relaciones. El jugador mueve impuestos, comercio, chokepoints, y la Tierra casi no se entera salvo el arco rojo de Ormuz. Eso es lo que hay que mejorar, más que el brillo de la atmósfera.

Capa de impacto, en orden barato → caro:

1. **Recoloreo con significado** (ya hay modos Estabilidad / Economía). Que Economía use Δ vs turno 1, no el nivel: un país que se cae se pone rojo aunque el PBI siga siendo grande.
2. **Pulso en el polígono afectado** cuando se ejecuta el plan: un `ringsData` de un solo frame en los países que el tasador tocó. Ya hay anillos para eventos pendientes. Reutilizar, no inventar partículas.
3. **Flujos que mueren.** Si el comercio con el socio top cae > 15%, ese arco pasa a rojo y más fino, aunque el volumen absoluto siga alto. `visibleFlows` ya trae `sanctioned`; falta `changeVsStart` por par (Opus, campo opcional en `TradeFlow`).
4. **Chokepoints como causa, no como adorno.** Ya se pone rojo. Falta que el hover diga “barril +X, comercio de larga distancia −Y%” — es texto, está en `oilShock` / `disruptionFactor`.
5. **No nubes, no satélites, no 8k.** La atmósfera actual alcanza. Cada capa nueva pelea fps con los arcos.

Lo que **no** hacer: heatmap mundial de 177 países recálculado cada mes en un canvas aparte. El polígono ya es el heatmap.

---

## 6. Quién hace qué (acuerdo, sección 7)

| Pieza | Quién | Cuándo |
|---|---|---|
| Avisar al cruzar 100 países en un PR | **Grok** | antes del merge |
| Relaciones sparse en `build-data.mjs` | Grok + Opus se ponen de acuerdo en el formato | al ir a 100 |
| Preview solo fila del jugador | **Opus** (rompe la promesa del preview; decidir con el jugador) | ≥ 100 |
| LOD por altitud, `pointsMerge`, tope de 20 arcos | **Opus** (`GlobeView`) | cuando duela, o al ir a 100 |
| Buscador / lista por región | **Opus** UI, datos ya existen | alto valor ya con 76 |
| `TradeFlow.changeVsStart` | **Opus**, campo opcional | para pintar impacto |
| No dibujar 4.950 arcos, no subir GeoJSON | ambos | siempre |
| Eventos de oposición / campaña / comercio | **Grok** | ahora: `EventContext.politics` y `.trade` ya existen |

Grok no toca `GlobeView`, `trade.ts` ni `simulation.ts`. Si el jugador pide “hacé el LOD”, va a `docs/PEDIDOS_A_OPUS.md`.

---

## 7. Decisión que hay que tomar con el jugador (no solos)

Al pasar 100, el preview a 3 meses va a costar ~330 ms+. Tres caminos:

A. **Dejarlo.** 330 ms al clickear una carta es perceptible pero no rompe. Más honesto.
B. **Preview de 1 mes** en vez de 3, mismo motor. Pierde 2º y 3er orden en la UI, no en el turno.
C. **Preview solo del jugador.** Rápido, y miente en comercio/bloques (el resto del mundo no se mueve en la proyección).

Opus quiere decidir C con el jugador. Hasta que no esté decidido, **Grok no mergea un PR que deje `Object.keys(countries).length >= 100`**.
