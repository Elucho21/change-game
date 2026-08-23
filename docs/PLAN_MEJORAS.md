# Plan de mejoras — Change World Game

Documento de trabajo. Estado al 22 de agosto de 2026.

---

## De dónde venimos

El MVP original (carpeta `CHANGE GAME` en OneDrive) era:

| Pieza | Qué hacía | Límite |
|---|---|---|
| `countries_mvp.json` | 24 países con economía, población, militar, sectores, relaciones y traits | Relaciones en texto (`amistoso`/`tenso`), sin coordenadas, sin bloques |
| `game_engine.py` | Turnos, drift económico, 13 eventos, generación de prompts para Grok | Solo CLI, sin estado visual, decisiones por texto libre |
| `PROMPT_MAESTRO.md` | Grok como motor de realismo y reacciones | Todo el peso narrativo en el LLM, sin números duros |

El diagnóstico: **el juego pensaba bien y se veía nada**. Un turno era leer JSON en una terminal.

## Qué se hizo en esta iteración

Todo sobre los mismos datos: `engine/countries_mvp.json` sigue siendo la fuente de verdad y `scripts/build-data.mjs` la traduce a lo que consume la web.

1. **Globo 3D interactivo** (`react-globe.gl` + Natural Earth 110m). Click en cualquier país, cámara que viaja al país seleccionado, relieve, atmósfera, tooltip con datos.
2. **4 modos de mapa**: relaciones (verde→rojo según tu vínculo), bloques (color por membresía), estabilidad y economía (mapa de calor).
3. **Arcos diplomáticos** sobre el globo: alianzas militares (azul), comercio y aduanas (verde), tensión (naranja punteado y animado) y sanciones (rojo). Se recalculan solos cuando cambian las relaciones.
4. **10 bloques** con mecánica real, no decorativa: OTAN, MERCOSUR, UE, BRICS+, T-MEC, Alianza del Pacífico, CAN, CELAC, Indo-Pacífico y OPEP+. Cada uno con tipo (militar / aduanera / económica / política), cohesión dinámica, reglas visibles y efectos que entran en el cálculo de crecimiento e inflación.
5. **Ingresar, salir y convocar cumbres**: entrar exige relación mínima con todos los socios y tensa con los rivales del bloque; salir cuesta crecimiento y relaciones.
6. **38 eventos** (18 mundiales, 16 nacionales, 4 de liderazgo) con condiciones de disparo, opciones de respuesta y riesgo de que la opción salga mal.
7. **25 decisiones** en 5 categorías, con **preview de impacto** antes de confirmar y costo en capital político.
8. **Capital político** como recurso central: se gasta en decidir, se recupera según cómo te va con la gente.
9. **Feed del turno** con eventos, reacciones de otros países, decisiones tomadas y un gráfico de felicidad/estabilidad turno a turno.
10. **Puente con Grok**: un botón genera el prompt compacto del turno; pegás la respuesta JSON y el juego aplica reacciones, efectos y crónica. El motor local resuelve números, Grok resuelve realismo.
11. **Fin de partida**: golpe de Estado, renuncia forzada o hiperinflación.
12. **Comercio bilateral** con modelo de gravedad (`lib/trade.ts`): el volumen con cada socio surge del tamaño de las economías, la distancia, los bloques compartidos, la relación y las sanciones. La variación contra el comercio inicial entra directo al crecimiento.
13. **Rutas marítimas y chokepoints** (`lib/routes.ts`): seis rutas reales sobre el globo y cinco pasos críticos (Ormuz, Malaca, Suez, Gibraltar, Panamá). Cuatro eventos los cierran: mientras dura el bloqueo, el comercio de larga distancia cae y el barril sube todos los turnos.
14. **Capas del globo**: diplomacia, comercio y rutas se prenden y apagan por separado.

## Próximos pasos

### Fase 1 — Profundidad de simulación (lo siguiente que más se nota)

- [x] **Comercio bilateral real** — hecho el 22/08/2026 (`lib/trade.ts`). Modelo de gravedad calibrado; una sanción ahora duele en proporción a lo que comerciabas.
- [x] **Rutas marítimas y chokepoints** — hecho el 22/08/2026 (`lib/routes.ts`). Seis rutas reales, cinco pasos críticos y cuatro eventos que los cierran.
- [x] **Impuestos como variable jugable** — hecho el 22/08/2026. IVA, empresas e ingresos son palancas reales, medidas contra la estructura inicial de cada país.
- [ ] **Aranceles y tipo de cambio como variable jugable**: hoy `lib/fx.ts` calcula el tipo de cambio y `externalTariff` es un número fijo del bloque, pero ninguno de los dos es una palanca que el jugador mueva a mano (como sí lo son IVA/empresas/ingresos en `GovernmentPanel`). Detalle en el backlog de abajo.
- [x] **Sectores productivos vivos** — hecho el 22/08/2026. `sectorEffects` en los eventos: el mismo shock pega distinto según la estructura productiva de cada país.
- [x] **Ciclo electoral** — hecho el 22/08/2026 (`lib/politics.ts`). Mandato de 4 años, reelección, y cuando se agotan los mandatos elegís sucesor y el partido sigue. La oposición encarece cada decisión.
- [x] **IA activa en el resto del mundo** — hecho el 22/08/2026 (`aiCountryDecisions`/`aiRoster` en `lib/engine.ts`). Antes solo existía `aiReactions` (reacciona a lo que hacés vos); ahora un roster de los 12 países de mayor PBI (sin el jugador) toma decisiones propias cada turno según su situación economica: sube impuestos si tiene déficit fuerte, estimula si tiene desempleo alto, endurece política monetaria si la inflación es muy alta, o calma la calle si la estabilidad es baja. Con tests en `tests/engine.test.ts`.
- [x] **Eventos internacionales con más presencia e impacto real** — hecho el 22/08/2026. La chance de evento mundial por turno subió de 25% a 40% (`rollEvents`). Además `applyWorldShock`/`worldShockMultiplier` hacen que el mismo evento ya no pegue igual en todos lados: las economías grandes (PBI ≥ 5T) absorben mejor el golpe (×0.7) que las chicas (PBI ≤ 0.5T, ×1.35), y si la diferencia es clara se narra en el feed quién lo pasó mejor y peor.
- [ ] **Guerra limitada**: resolución de combates con los datos militares que ya están cargados (soldados, aviones, submarinos, ojivas).

### Fase 2 — Más interacción

- [x] **Preview de consecuencias de 2º y 3er orden** — hecho el 22/08/2026 (`lib/simulation.ts`). Proyecta 3 meses con las mismas reglas del turno real y avisa qué eventos habilita cada decisión.

- [ ] **Tratados multilaterales negociados**: proponer un bloque nuevo e invitar países; que acepten o no según intereses.
- [ ] **Espionaje e inteligencia**: información parcial sobre países hostiles; hoy ves todo de todos.
- [~] **Panel de oposición interna** — mejorado el 22/08/2026. La oposición ahora tiene **2 partidos con nombre propio** (`politics.oppositionParties`, repartidos ~58/42 con `oppositionSplit`), se puede **negociar una coalición con uno de los dos a 3 meses de la elección** (`campaignEvents` en `lib/politics.ts`, le resta la mitad de su peso a la oposición) y aparecen **5 discursos de cierre de campaña a 1 mes de la elección** cuyo efecto se aplica antes de que corra el cálculo electoral. Falta todavía: gobernadores/sindicatos como actores separados con demandas propias, y que los partidos tengan ideología/rasgos propios más allá del nombre.
- [ ] **Cadena de consecuencias**: eventos que desbloquean otros eventos (un piquete reprimido habilita un juicio político).
- [ ] **Timeline navegable**: click en un turno pasado para ver el estado del mundo en ese momento.

### Fase 3 — Presentación

- [x] **Guardado de partidas** — hecho el 22/08/2026 (`lib/persistence.ts`). Automático en localStorage, con versión de save y migración preparada. Ampliado el mismo día con **exportar/importar como archivo .json** (`exportSave`/`importSave`): botón 💾 en el TopBar y en la pantalla de inicio, para no perder el progreso si se borra el navegador.
- [ ] **Modo comparación**: dos países lado a lado.
- [ ] **Animación de cambio de turno**: que se vea qué polígonos cambiaron de color.
- [ ] **Sonido y música ambiente** de sala de situación.
- [x] **Móvil** — mejorado el 22/08/2026. Tabs con scroll horizontal en vez de aplastarse, tap targets más grandes, densidad reducida en el topbar. Sigue pendiente una vista dedicada para el globo en pantallas chicas.

### Fase 4 — Escala

- [ ] **Ampliar a 60+ países** (India, Turquía, Arabia Saudita, Indonesia, Sudáfrica, Nigeria, Egipto, Israel, Irán, Australia). Solo requiere sumar entradas al JSON y su ISO3 en `scripts/build-data.mjs`.
- [ ] **Llamada directa a la API de Grok** en vez de copiar y pegar (requiere backend y clave; el puente manual ya deja el contrato definido). Ver nota de seguridad en el backlog de abajo.
- [ ] **Multijugador por turnos (hotseat local)**: dos personas, dos países, mismo mundo. Ver detalle en el backlog de abajo — es el ítem más grande que quedó pendiente de la pasada del 22/08.

## Deuda técnica conocida

- Los datos económicos son aproximaciones de 2025 pensadas para que el juego sea jugable y esté balanceado, no una base estadística.
- Las relaciones se derivan de las etiquetas del JSON (`amistoso` = +55, `neutral` = 0, `tenso` = −40, `hostil` = −75) y se simetrizan promediando lo que cada país declara del otro.
- La IA local es heurística (agresividad, relación, membresía de bloque, y desde el 22/08 tambien `aiCountryDecisions` para el roster de potencias). El realismo fino sigue dependiendo de Grok.
- Tests del motor en `tests/engine.test.ts` (68 casos al 22/08/2026). Falta cobertura de la UI (componentes React sin tests).
- El balance de los países con inflación muy alta (Argentina, Venezuela) sigue siendo duro: se estabiliza pero ganar la elección exige desinflacionar de verdad. Requiere jugarlo para afinarlo.
- 3 vulnerabilidades altas (`postcss`, `sharp`, via `npm audit`) que solo se resuelven actualizando Next 15 → 16 (breaking change). No se tocó en esta pasada, ver backlog.
- `tsconfig.json` no tiene `noUncheckedIndexedAccess`: se probó activarlo y destapó ~100 sitios de acceso a `Record<string,X>` sin chequear, demasiado para arreglar de pasada sin revisar cada uno. Ver backlog.

## Backlog detallado — de la pasada de 40 mejoras (22/08/2026)

De un pedido de 40 mejoras (10 recursos, 10 código/seguridad, 10 UX, 10 jugabilidad) se implementaron
y verificaron (68 tests, `npm run build` limpio) las 30 de recursos/código/UX y las 5 de jugabilidad
más pedidas explícitamente. Quedan en espera, con el detalle para retomarlas sin tener que
re-investigar desde cero:

### Hotseat local (2 países en la misma partida)
El más grande de los pendientes. Hoy `playerCode` es un string único en todo `lib/store.ts` (turno,
capital, política, taxBase, etc. están indexados por un solo jugador). Para 2 jugadores humanos hace
falta: (a) decidir si es simultáneo (cada uno arma su plan del turno y se resuelven juntos) o por
turnos alternados; (b) `GameStore` necesita un segundo `playerCode2` o pasar a `players: string[]`;
(c) la UI (`GameShell`, `TopBar`, `TurnPlan`) necesita un selector de "a quién le toca ver esto"; (d)
las decisiones bilaterales (`CountryPanel` "Acciones bilaterales") ya asumen "vos vs. un país NPC", no
"vos vs. el otro jugador humano". Es un cambio de arquitectura, no una feature aislada.

### Editor de escenario / sandbox
Arrancar una partida con parámetros custom (inflación, deuda, impuestos, capital político inicial)
en vez de los valores fijos de `lib/data/countries.gen.json`. Lo más directo: en `StartScreen.tsx`,
antes de `start(code, difficulty)`, agregar un panel opcional que genere un `Partial<Economy>` y lo
mergee sobre el país elegido antes de llamar a `start`. La función `start` en `lib/store.ts` ya
clona el país (`s.countries[code]`), así que aceptar un override ahí es el punto de entrada natural.

### Logros / hitos
No hay ningún sistema de tracking de hitos hoy. Necesita: (a) una lista de logros definidos (ej.
"bajaste la inflación 50% en un mandato", "3 mandatos consecutivos", "sin déficit fiscal 12 meses
seguidos"); (b) un array `unlockedAchievements: string[]` en el store, persistido; (c) chequeos que
corran en `endTurn` comparando `history` contra las condiciones. El array `history` (capado a 60
turnos) ya tiene la serie temporal necesaria para varios de estos logros.

### Tipo de cambio y aranceles como decisión jugable
`lib/fx.ts` ya calcula `fx` (índice de tipo de cambio, 100 = arranque) y lo aplica a la inflación
(`fxInflationPassthrough`) y a la presión cambiaria (`fxPressure`), pero el jugador no tiene ninguna
palanca sobre eso: es 100% resultado del modelo. Los bloques ya tienen `externalTariff` en
`lib/blocs.ts`, pero es un número fijo por bloque, no algo que el jugador ajuste por país o sector.
Para exponerlo como decisión jugable, el patrón más directo es calcar `lib/orders.ts` (`TaxOrder`,
`addTaxOrder`, `plannedTaxRate`): un `FxOrder`/`TariffOrder` nuevo, un botón +/- en `GovernmentPanel`,
y aplicar el cambio en `naturalDrift` o en el resuelve del plan, igual que ya pasa con los impuestos.

### Modo campaña con objetivos reales por país
Ej. "Argentina: bajar inflación de 140% a 20% en 4 años". Necesita: (a) una lista de objetivos por
país (`{ metric, target, deadlineTurns }`); (b) mostrarlo en algún lado persistente de la UI (TopBar o
un panel nuevo) con progreso; (c) una condición de victoria/derrota distinta del final de partida
actual (golpe, hiperinflación, renuncia). El array `history` sirve para trackear el progreso sin
lógica nueva de storage.

### noUncheckedIndexedAccess (código y seguridad)
Se probó activar la opción en `tsconfig.json`: tira ~100 errores `TS2532`/`TS18048` en `components/`
y `lib/` (accesos a `Record<string, X>` que TypeScript hoy no marca como potencialmente `undefined`).
Ninguno es un bug confirmado, son sitios a revisar uno por uno para decidir si necesitan una guarda o
si son seguros por invariante del programa (y en ese caso documentar por qué con un comentario, no
solo silenciar con `!`). Requiere una pasada dedicada, no mezclada con otro trabajo.

### Actualizar Next.js 15 → 16
`npm audit` marca 3 vulnerabilidades altas en `postcss` y `sharp` (dependencias transitivas de Next)
que solo se resuelven con `next@16`. Es un breaking change de framework: necesita su propia pasada de
verificación (build, todas las rutas, el dev server, Vercel) antes de mergear, no algo para colar
junto a otras 39 mejoras.
