# Instrucciones para agentes (Claude, Grok, Codex, quien sea)

Antes de escribir una sola línea de código en este repo, leé **`docs/REGLAS_DE_CODIGO.md`**. No es opcional: dos agentes trabajan en paralelo acá y ese documento es lo que evita que se pisen.

Después, para entender qué hace el sistema: **`docs/ESPECIFICACION.md`** y **`lib/types.ts`**.

## Resumen de las reglas que más se rompen

1. **Capas**: datos → motor → interfaz. Nunca al revés. Las reglas del juego viven en `lib/engine.ts` y `lib/trade.ts`, no en los componentes.
2. **`lib/types.ts` no se cambia sin avisar.** Agregar campos *opcionales* sí es seguro.
3. **`engine/countries_mvp.json` es la fuente de verdad de los países.** Si lo tocás, corré `npm run data`. Nunca edites `lib/data/countries.gen.json` a mano: es generado.
4. **El estado se modifica solo en `lib/store.ts`**, siempre copiando con `fresh()` antes de mutar.
5. **Nada de `any`.** TypeScript estricto. La única excepción vive comentada en `components/GlobeView.tsx`.
6. **Nada de dependencias nuevas** sin justificarlo.
7. **Contenido de datos sin tildes ni ñ** (`lib/events/*`, `lib/blocs.ts`, `lib/decisions.ts`): ese texto pasa por el motor Python y por consolas de Windows.
8. **Toda opción de evento tiene un costo y ninguna es obviamente la mejor.** Si hay una respuesta correcta, no es una decisión.
9. **El turno tiene una sola implementación**: `deterministicTick()` en `lib/simulation.ts`, que usan tanto `endTurn` como el preview de consecuencias. No reimplementes la economía en otro lado.
10. **Si cambiás la forma del estado guardado**, subí `SAVE_VERSION` en `lib/persistence.ts` y agregá la migración. Un campo nuevo *opcional* no necesita versión nueva.
11. **Si agregás contenido, sumá el caso al test** (`tests/engine.test.ts`).

## Antes de commitear, los tres comandos

```bash
npm run data        # solo si tocaste engine/countries_mvp.json
npm test            # tests del motor
npx tsc --noEmit
npm run build
```

⚠️ No corras `npm run build` con `npm run dev` levantado: los dos escriben en `.next` y el dev server queda roto (404 en `main-app.js`). Si pasa: parar dev, `rm -rf .next`, levantar de nuevo.

## Zonas de trabajo

| Zona | Archivos | Conflicto |
|---|---|---|
| Contenido | `lib/events/*`, `lib/decisions.ts`, `lib/blocs.ts`, `lib/routes.ts` | bajo — ideal para trabajo en paralelo |
| Datos | `engine/countries_mvp.json`, `scripts/build-data.mjs` | medio |
| Motor | `lib/engine.ts`, `lib/trade.ts`, `lib/simulation.ts`, `lib/politics.ts`, `lib/store.ts`, `lib/persistence.ts` | **alto — una persona por vez** |
| Datos de puntos | `lib/points.ts` → arrays `PORTS` y `AIRPORTS` | bajo — ver `docs/PEDIDOS_A_GROK.md` |
| Interfaz | `components/*.tsx`, `app/globals.css` | medio — un componente por persona |

## Depurar en el navegador

```js
const S = () => window.__game.getState();   // estado completo del juego
S().start('Argentina'); S().endTurn(); S().feed.slice(0, 5);
window.__globe.scene();                      // escena three.js del globo
```
