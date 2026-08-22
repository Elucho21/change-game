# 🌍 Change Game

Juego de geopolítica y gran estrategia para un jugador. Elegís un país, gobernás mes a mes sobre un **globo 3D interactivo**, y el resto del mundo reacciona.

Inspirado en Pax Historia y en Power & Revolution, pero jugable en el navegador y abierto para seguir construyéndolo.

![stack](https://img.shields.io/badge/Next.js-15-black) ![stack](https://img.shields.io/badge/react--globe.gl-3D-blue) ![stack](https://img.shields.io/badge/TypeScript-5-blue)

---

## Qué tiene hoy

- **Globo 3D**: 24 países jugables, click para seleccionar, cámara que viaja, tooltip con datos completos.
- **4 modos de mapa**: relaciones, bloques, estabilidad y economía.
- **Arcos diplomáticos**: alianzas militares, comercio y aduanas, tensión y sanciones, dibujados sobre el globo y actualizados cada turno.
- **10 bloques con mecánica real**: OTAN, MERCOSUR, UE, BRICS+, T-MEC, Alianza del Pacífico, CAN, CELAC, Indo-Pacífico, OPEP+. Con cohesión, requisitos de ingreso, rivales y efectos económicos.
- **32 eventos**: mundiales (shock petrolero, guerra comercial, pandemia), nacionales (piquetes, paro general, corrida cambiaria, FMI, juicio político) y de liderazgo.
- **25 decisiones** en economía, interior, comercio, diplomacia y defensa, con preview de impacto antes de confirmar.
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
docs/
  PLAN_MEJORAS.md        ← qué se hizo y qué sigue
  EVENTOS.md             ← catálogo y cómo agregar eventos
  GROK.md                ← cómo trabajar con Grok sobre este repo
  PROMPT_MAESTRO.md      ← prompt original del motor de simulación
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
| Sumar una decisión | `lib/decisions.ts` |
| Sumar un bloque o alianza | `lib/blocs.ts` |
| Cambiar cómo evoluciona la economía | `naturalDrift()` en `lib/engine.ts` |
| Cambiar cómo reaccionan los países | `aiReactions()` en `lib/engine.ts` |

Después de cualquier cambio: `npx tsc --noEmit` y `npm run build`.

## Deploy

Pensado para Vercel: importás el repo, framework Next.js detectado solo, sin variables de entorno.

## Licencia y datos

Proyecto personal. Los datos de países son aproximaciones de 2025 elegidas para que el juego esté balanceado, no una fuente estadística. El mapa usa Natural Earth 110m (dominio público) y las texturas del globo vienen de `three-globe`.
