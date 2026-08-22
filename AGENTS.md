# Instrucciones para agentes (Claude, Grok, Codex, quien sea)

Leé en este orden:

1. **`docs/CAMBIOS.md`** — qué cambió en el motor últimamente y qué te habilita. **Empezá por acá si volvés después de unos días**: es corto y está en orden inverso.
2. **`docs/REGLAS_DE_CODIGO.md`** — cómo se escribe acá. La **sección 7 es el acuerdo de colaboración**. No es opcional: dos agentes trabajan en paralelo y ese documento es lo que evita que se pisen.
3. **`docs/ESPECIFICACION.md`** y **`lib/types.ts`** — qué hace el sistema y cuál es el contrato.
4. La bandeja que te toca: `docs/PEDIDOS_A_GROK.md` o `docs/PEDIDOS_A_OPUS.md`.

## Estado del juego, en dos líneas

76 países · **57 acciones en 6 categorías** · 38 eventos · 10 bloques · comercio bilateral · rutas marítimas con chokepoints · ciclo electoral con reelección y sucesión · **gabinete de 5 sillas con coalición** · **parlamento de 100 escaños** · guardado automático · preview de consecuencias a 3 meses.

## El acuerdo, en cinco líneas

1. **Opus escribe el motor.** `engine`, `trade`, `simulation`, `politics`, `orders`, `store`, `persistence`, `components`.
2. **Grok escribe contenido.** Eventos, decisiones, bloques, rutas, `electoral.ts`, arrays de `points.ts`, JSON de países.
3. **Grok no toca el motor aunque el jugador se lo pida.** Lo escribe en `docs/PEDIDOS_A_OPUS.md` y no lo codea.
   - *Excepción registrada (22/08, commit `dfc6202`)*: Opus escribió en `lib/decisions.ts`, que es de Grok, porque el jugador pidió enfriamiento en **todas** las acciones y eso vive dentro de cada decisión. Ampliar el catálogo sigue siendo de Grok.
4. **Siempre rama + PR.** Nadie pushea a `main` en caliente.
5. **76 países, no más**, hasta que Opus recorte el comercio O(n²).

## Resumen de las reglas que más se rompen

1. **Capas**: datos → motor → interfaz. Nunca al revés.
2. **`lib/types.ts` no se cambia sin avisar.** Agregar campos *opcionales* sí es seguro.
3. **`engine/countries_mvp.json` es la fuente de verdad.** Si lo tocás, `npm run data`. Nunca edites `lib/data/countries.gen.json` a mano.
4. **El estado se modifica solo en `lib/store.ts`**, copiando con `fresh()` antes de mutar. Las acciones del jugador son órdenes (`lib/orders.ts`) y solo tocan el mundo en `runPlan()`.
5. **Nada de `any`.** TypeScript estricto. La única excepción vive comentada en `components/GlobeView.tsx`.
6. **Nada de dependencias nuevas** sin justificarlo.
7. **Contenido de datos sin tildes ni ñ.**
8. **Toda opción de evento tiene un costo y ninguna es obviamente la mejor.**
9. **El turno tiene una sola implementación**: `deterministicTick()`. Preview y turno real.
10. **`systemOf(code)` decide cómo se gana una elección.** No inlinear `won = vote > 50`.
11. **Validá costos contra `availableCapital()`**, no contra `capital` crudo.
12. **Toda decisión tiene enfriamiento**: 1 a 3 meses según el peso, **4 solo en comunicación**. Si no declarás `cooldown`, se usa el default de su categoría (`DEFAULT_COOLDOWN` en `lib/diplomacy.ts`). En las bilaterales el enfriamiento es por país.
13. **La categoría `comunicacion` no toca la economía real** (`gdp_growth`, `inflation`, `unemployment`): cambia cómo se la vive. Hay un test que lo verifica.
14. **Si cambiás la forma del estado guardado**, subí `SAVE_VERSION`. Un campo opcional nuevo no necesita versión.
15. **Si agregás contenido, sumá el caso al test.**

## Antes de commitear

```bash
npm run data        # solo si tocaste engine/countries_mvp.json
npm test
npx tsc --noEmit
npm run build       # con el dev server apagado
```

## Zonas

| Zona | Archivos | Quién |
|---|---|---|
| Contenido | `lib/events/*`, `lib/decisions.ts`, `lib/blocs.ts`, `lib/routes.ts`, `lib/electoral.ts` | Grok |
| Datos | `engine/countries_mvp.json`, `scripts/build-data.mjs` | Grok (congelado en 76) |
| Puntos | `lib/points.ts` → arrays `PORTS` y `AIRPORTS` | Grok |
| Gabinete | `lib/cabinet.ts` → array `MINISTERS` (solo ese array) | Grok |
| Motor | `lib/engine.ts`, `lib/trade.ts`, `lib/simulation.ts`, `lib/politics.ts`, `lib/orders.ts`, `lib/diplomacy.ts`, `lib/cabinet.ts`, `lib/store.ts`, `lib/persistence.ts` | **Opus, solo** |
| Interfaz | `components/*.tsx`, `app/globals.css` | Opus |
| Docs | `docs/*` | ambos, por PR |

## Depurar en el navegador

```js
const S = () => window.__game.getState();
S().newGame(); S().start('Argentina');
S().planDecision('mesa_dialogo');   // planifica: NO ejecuta
S().endTurn();                       // acá recién pasa
S().feed.slice(0, 5).map(f => f.title);

window.__engine.taxEffects(S().countries.Argentina, S().taxBase.Argentina);
window.__globe.scene();              // escena three.js del globo
```
