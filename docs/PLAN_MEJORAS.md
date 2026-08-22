# Plan de mejoras — Change Game

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
- [ ] **Aranceles como variable jugable**: hoy el arancel externo común es un número del bloque; falta que el jugador fije aranceles por país y por sector.
- [x] **Sectores productivos vivos** — hecho el 22/08/2026. `sectorEffects` en los eventos: el mismo shock pega distinto según la estructura productiva de cada país.
- [x] **Ciclo electoral** — hecho el 22/08/2026 (`lib/politics.ts`). Mandato de 4 años, reelección, y cuando se agotan los mandatos elegís sucesor y el partido sigue. La oposición encarece cada decisión.
- [ ] **Guerra limitada**: resolución de combates con los datos militares que ya están cargados (soldados, aviones, submarinos, ojivas).

### Fase 2 — Más interacción

- [x] **Preview de consecuencias de 2º y 3er orden** — hecho el 22/08/2026 (`lib/simulation.ts`). Proyecta 3 meses con las mismas reglas del turno real y avisa qué eventos habilita cada decisión.

- [ ] **Tratados multilaterales negociados**: proponer un bloque nuevo e invitar países; que acepten o no según intereses.
- [ ] **Espionaje e inteligencia**: información parcial sobre países hostiles; hoy ves todo de todos.
- [~] **Panel de oposición interna**: la oposición ya existe como fuerza que crece, encarece decisiones y define elecciones. Falta abrirla en actores separados (gobernadores, sindicatos, partidos) con demandas propias.
- [ ] **Cadena de consecuencias**: eventos que desbloquean otros eventos (un piquete reprimido habilita un juicio político).
- [ ] **Timeline navegable**: click en un turno pasado para ver el estado del mundo en ese momento.

### Fase 3 — Presentación

- [x] **Guardado de partidas** — hecho el 22/08/2026 (`lib/persistence.ts`). Automático en localStorage, con versión de save y migración preparada.
- [ ] **Modo comparación**: dos países lado a lado.
- [ ] **Animación de cambio de turno**: que se vea qué polígonos cambiaron de color.
- [ ] **Sonido y música ambiente** de sala de situación.
- [ ] **Móvil**: el layout responde, pero el globo pide una vista dedicada.

### Fase 4 — Escala

- [ ] **Ampliar a 60+ países** (India, Turquía, Arabia Saudita, Indonesia, Sudáfrica, Nigeria, Egipto, Israel, Irán, Australia). Solo requiere sumar entradas al JSON y su ISO3 en `scripts/build-data.mjs`.
- [ ] **Llamada directa a la API de Grok** en vez de copiar y pegar (requiere backend y clave; el puente manual ya deja el contrato definido).
- [ ] **Multijugador por turnos**: dos personas, dos países, mismo mundo.

## Deuda técnica conocida

- Los datos económicos son aproximaciones de 2025 pensadas para que el juego sea jugable y esté balanceado, no una base estadística.
- Las relaciones se derivan de las etiquetas del JSON (`amistoso` = +55, `neutral` = 0, `tenso` = −40, `hostil` = −75) y se simetrizan promediando lo que cada país declara del otro.
- La IA local es heurística (agresividad, relación, membresía de bloque). El realismo fino depende de Grok.
- Tests del motor en `tests/engine.test.ts` (19 casos). Falta cobertura de la UI.
- El balance de los países con inflación muy alta (Argentina, Venezuela) sigue siendo duro: se estabiliza pero ganar la elección exige desinflacionar de verdad. Requiere jugarlo para afinarlo.
