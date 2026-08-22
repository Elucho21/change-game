# 🌍 Change Game

Juego de geopolítica y gran estrategia para un jugador. Elegís un país, gobernás mes a mes sobre un **globo 3D interactivo**, y el resto del mundo reacciona.

Inspirado en Pax Historia y en Power & Revolution, pero jugable en el navegador y abierto para seguir construyéndolo.

![stack](https://img.shields.io/badge/Next.js-15-black) ![stack](https://img.shields.io/badge/react--globe.gl-3D-blue) ![stack](https://img.shields.io/badge/TypeScript-5-blue)

---

## Qué tiene hoy

- **Globo 3D**: 76 países jugables sobre los seis continentes, click para seleccionar, cámara que viaja, tooltip con datos completos.
- **4 modos de mapa** (relaciones, bloques, estabilidad, economía) y capas que se prenden por separado, incluidos puertos, aeropuertos y capitales.
- **Arcos diplomáticos**: alianzas militares, comercio y aduanas, tensión y sanciones, dibujados sobre el globo y actualizados cada turno.
- **Flujos comerciales**: comercio bilateral calculado con un modelo de gravedad (tamaño de las economías, distancia, bloques, relación y sanciones). El grosor del arco es el volumen real.
- **Rutas marítimas y chokepoints**: Ormuz, Malaca, Suez, Panamá y Gibraltar. Cuando un evento cierra un paso, la ruta se dibuja en rojo, el comercio de larga distancia cae y el barril sube.
- **10 bloques con mecánica real**: OTAN, MERCOSUR, UE, BRICS+, T-MEC, Alianza del Pacífico, CAN, CELAC, Indo-Pacífico, OPEP+. Con cohesión, requisitos de ingreso, rivales y efectos económicos.
- **38 eventos**: mundiales (shock petrolero, guerra comercial, pandemia, cierre de Ormuz, bloqueo de Suez), nacionales (piquetes, paro general, corrida cambiaria, FMI, juicio político) y de liderazgo. Los que duran cobran todos los meses.
- **Ciclo electoral**: mandato, reelección y, cuando se agotan los mandatos, elegís sucesor y tu partido sigue. Sistemas reales por país (ballotage argentino, colegio electoral en EE.UU., sexenio mexicano).
- **Gabinete de 5 sillas y parlamento**: cada ministro aporta un pasivo y abarata una categoría; sentar a un opositor arma coalición, presta escaños y pasa factura. Sin mayoría, las medidas grandes cuestan 40% más.
- **57 acciones** en economía, interior, comercio, diplomacia, defensa y **comunicación**, con preview de consecuencias a 3 meses y enfriamiento de 1 a 4 meses cada una.
- **Plan del turno**: lo que elegís se acumula y se ejecuta al avanzar el mes. Hasta entonces podés probar, comparar y sacar lo que no te cierre.
- **Capital político** como recurso: gobernar cuesta, y se recupera según cómo te va con la gente.
- **Puente con Grok**: el motor local resuelve los números; Grok agrega reacciones realistas y la crónica del turno.

## Correr el proyecto

```bash
npm install
npm run dev
```

Abre http://localhost:3010

Otros comandos:

```bash
npm run data
```

Regenera `lib/data/countries.gen.json` desde `engine/countries_mvp.json`. **Corrélo cada vez que toques los datos de países.**

```bash
npm run build
```

> ¿Sos un agente (Claude, Grok, Codex) y venís a escribir código? Leé **[AGENTS.md](AGENTS.md)** primero, y después **[docs/CAMBIOS.md](docs/CAMBIOS.md)**.

## Estructura

```
engine/
  countries_mvp.json     ← FUENTE DE VERDAD de los países (compartida con el motor Python y con Grok)
  game_engine.py         ← motor original en Python (CLI), sigue funcionando
scripts/
  build-data.mjs         ← JSON del motor → datos de la web (ISO3, coordenadas, relaciones numéricas)
lib/
  types.ts               ← contrato de tipos de todo el juego
  blocs.ts               ← bloques, alianzas y uniones aduaneras
  trade.ts               ← comercio bilateral (modelo de gravedad) y su efecto en el crecimiento
  routes.ts              ← rutas maritimas, chokepoints y su interrupcion
  decisions.ts           ← las 25 decisiones del jugador
  events/world.ts        ← eventos mundiales
  events/national.ts     ← eventos nacionales y de liderazgo
  engine.ts              ← relaciones, drift económico, sorteo de eventos, IA, arcos, fin de partida
  store.ts               ← estado del juego (zustand) y resolución de turno
components/
  GlobeView.tsx          ← el globo 3D, polígonos, arcos y anillos
  TopBar.tsx             ← indicadores y botón de avanzar mes
  CountryPanel.tsx       ← ficha del país + acciones bilaterales
  DecisionsPanel.tsx     ← decisiones por categoría con preview
  BlocsPanel.tsx         ← bloques: ingresar, salir, convocar cumbre
  EventCatalog.tsx       ← catálogo completo de eventos
  Feed.tsx               ← eventos pendientes, crónica del turno y gráfico
  GrokBridge.tsx         ← prompt del turno y aplicación de la respuesta de Grok
AGENTS.md / CLAUDE.md    ← reglas que cargan automaticamente los agentes de IA
docs/
  CAMBIOS.md             ← EMPEZA POR ACA si volves despues de unos dias
  REGLAS_DE_CODIGO.md    ← OBLIGATORIO antes de escribir codigo
  ESPECIFICACION.md      ← como funciona todo el sistema
  PEDIDOS_A_GROK.md      ← bandeja de Grok (contenido y datos)
  PEDIDOS_A_OPUS.md      ← bandeja de Opus (motor)
  PLAN_MEJORAS.md        ← que se hizo y que sigue
  EVENTOS.md             ← catalogo y como agregar eventos
  ESCALA_GLOBO.md        ← estudio de escala antes de sumar mas paises
  GROK.md                ← el puente con Grok durante la partida
  PROMPT_MAESTRO.md      ← prompt original del motor de simulacion
```

## Cómo se juega

1. Elegís país.
2. Cada mes tenés **capital político**. Lo gastás en decisiones (bajar impuestos, mandar una misión diplomática, entrar al MERCOSUR, sancionar a un vecino).
3. Los eventos te interrumpen: un piquete, una corrida, una cumbre climática. Elegís cómo responder — o dejás pasar el turno y pagás el costo de no decidir.
4. Apretás **Avanzar mes**: la economía se mueve, los bloques cambian de cohesión, el resto del mundo reacciona y aparecen eventos nuevos.
5. Perdés si la estabilidad o la felicidad se derrumban, o si la inflación se descontrola.

## Cómo se agrega contenido

| Quiero... | Toco... |
|---|---|
| Sumar un país | `engine/countries_mvp.json` + su ISO3 y capital en `scripts/build-data.mjs`, después `npm run data` |
| Sumar un evento | `lib/events/world.ts` o `lib/events/national.ts` (formato en `docs/EVENTOS.md`) |
| Sumar una decisión | `lib/decisions.ts` (con su `cooldown`) |
| Sumar un ministro | `lib/cabinet.ts` → array `MINISTERS` |
| Sumar un bloque o alianza | `lib/blocs.ts` |
| Cambiar cómo evoluciona la economía | `naturalDrift()` en `lib/engine.ts` |
| Cambiar cómo reaccionan los países | `aiReactions()` en `lib/engine.ts` |
| Sumar una ruta marítima o un chokepoint | `lib/routes.ts` |
| Cambiar el modelo de comercio | `lib/trade.ts` |

Después de cualquier cambio: `npx tsc --noEmit` y `npm run build`.
Las reglas completas (capas, contratos, zonas de trabajo, estilo) están en **[docs/REGLAS_DE_CODIGO.md](docs/REGLAS_DE_CODIGO.md)**. Leelo antes de tocar código.

## Deploy

Pensado para Vercel: importás el repo, framework Next.js detectado solo, sin variables de entorno.

## Licencia y datos

Proyecto personal. Los datos de países son aproximaciones de 2025 elegidas para que el juego esté balanceado, no una fuente estadística. El mapa usa Natural Earth 110m (dominio público) y las texturas del globo vienen de `three-globe`.
