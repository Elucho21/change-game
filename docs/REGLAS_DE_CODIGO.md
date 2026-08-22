# Reglas de código — Change Game

**Este documento es obligatorio para cualquiera que escriba código acá: Luciano, Claude, Grok o quien venga después.**

El objetivo no es "código lindo". Es que dos agentes trabajando en paralelo, sin verse, produzcan código que encaje sin que nadie tenga que rehacer nada. Todo lo que sigue existe porque su ausencia genera conflictos concretos.

---

## 0. La regla que ordena a todas las demás

> **Los datos mandan sobre el código, y el código manda sobre la interfaz.**

Tres capas, en este orden:

```
DATOS        engine/countries_mvp.json, lib/blocs.ts, lib/events/*, lib/decisions.ts,
   ↓         lib/routes.ts, lib/points.ts
             (contenido puro: números, textos, listas. Sin lógica.)
MOTOR        lib/engine.ts, lib/trade.ts, lib/simulation.ts, lib/store.ts, lib/persistence.ts
   ↓         (reglas del juego: funciones puras + un único store. Sin JSX.)
INTERFAZ     components/*.tsx, app/*
             (dibuja lo que el motor calculó. Sin reglas del juego.)
```

Una capa puede importar de las de arriba, **nunca de las de abajo**. Si `lib/engine.ts` necesita importar algo de `components/`, el diseño está mal.

**La prueba concreta**: si querés saber cuánto crece la economía, la respuesta tiene que estar en `lib/engine.ts`, no repartida en tres componentes. Si un componente calcula una regla del juego, esa regla se va a desincronizar con el resto en cuanto alguien toque el motor.

---

## 1. Contratos: lo que no se toca sin avisar

Estos cuatro puntos son la frontera entre lo que hace uno y lo que hace el otro. Cambiarlos rompe el trabajo del otro **en silencio**, que es la peor forma de romper algo.

### 1.1 `lib/types.ts` es la constitución

Todo tipo compartido vive ahí. Si necesitás un tipo nuevo, agregalo; si necesitás **cambiar** uno existente (renombrar un campo, cambiar de `number` a `string`, volver obligatorio un opcional), eso es un cambio de contrato: avisá antes.

Agregar un campo **opcional** a un tipo existente no rompe nada y no requiere aviso. Es el camino recomendado para extender.

```ts
// ✅ seguro: campo opcional nuevo
export interface GameEvent {
  // ...lo que ya estaba
  disrupts?: string[];   // nadie que no lo use se entera
}

// ❌ rompe a todos: campo obligatorio nuevo
export interface GameEvent {
  severidad: number;     // cada uno de los 36 eventos existentes deja de compilar
}
```

### 1.2 `engine/countries_mvp.json` es la fuente de verdad de los países

La web **no lee** ese archivo directamente: lee `lib/data/countries.gen.json`, que se genera con `npm run data`.

```bash
npm run data     # después de CUALQUIER cambio en countries_mvp.json
```

Si agregás un país, también va su ISO3 y las coordenadas de su capital en el mapa `META` de `scripts/build-data.mjs`. El script falla con un mensaje claro si falta: eso es a propósito.

**Nunca edites `lib/data/countries.gen.json` a mano.** Es un archivo generado; el próximo `npm run data` borra lo que escribas.

### 1.3 El formato JSON del puente con Grok

Definido en `docs/GROK.md` y leído por `applyGrokJson()` en `lib/store.ts`. Si cambia el formato, cambian los dos lados a la vez.

### 1.4 Las claves de `Delta`

Las métricas que un evento o una decisión puede mover son exactamente estas, y coinciden con los campos del JSON de países:

```
happiness · stability · gdp_growth · inflation · unemployment · fiscal_balance
debt_to_gdp · military_budget_bn · gold_reserves_tonnes · capital
global_tension · oil_price
```

Inventar una métrica nueva (`corrupcion`, `moral_militar`) implica: agregarla a `Delta`, a `DELTA_LABELS`, a `applyDelta()` y decidir si sube o baja es bueno en `BAD_WHEN_UP`. Son cuatro lugares en el mismo archivo. Hacelo completo o no lo hagas.

---

## 2. Zonas de trabajo: cómo no pisarse

Cada tarea vive en una zona. **Dos agentes no trabajan en la misma zona al mismo tiempo.**

| Zona | Archivos | Riesgo de conflicto | Ideal para |
|---|---|---|---|
| **Contenido: eventos** | `lib/events/world.ts`, `lib/events/national.ts` | Bajo | trabajo en volumen, en paralelo |
| **Contenido: decisiones** | `lib/decisions.ts` | Bajo | ídem |
| **Contenido: bloques** | `lib/blocs.ts` | Bajo | ídem |
| **Contenido: rutas** | `lib/routes.ts` | Bajo | ídem |
| **Datos de países** | `engine/countries_mvp.json` + `scripts/build-data.mjs` | Medio | ampliar el mapa |
| **Motor** | `lib/engine.ts`, `lib/trade.ts`, `lib/simulation.ts`, `lib/store.ts`, `lib/persistence.ts` | **Alto** | **una persona por vez** |
| **Datos de puntos** | `lib/points.ts` (arrays `PORTS` y `AIRPORTS`) | Bajo | cargar puertos y aeropuertos |
| **Interfaz** | `components/*.tsx`, `app/globals.css` | Medio | un componente por persona |
| **Docs** | `docs/*`, `README.md` | Bajo | siempre |

Regla práctica: **agregar a una lista casi nunca genera conflicto; cambiar una función sí.** Por eso el contenido se reparte y el motor no.

---

## 3. Cómo se escribe el código acá

### 3.1 Idioma

- **Código en inglés** (nombres de funciones, variables, tipos): `bilateralVolume`, `naturalDrift`, `playerCode`.
- **Contenido y comentarios en español**: todo lo que ve el jugador y toda explicación.
- **Sin tildes ni ñ dentro de strings del código de datos** (`lib/events/*`, `lib/blocs.ts`, `lib/decisions.ts`). Ese contenido pasa por el motor Python, por prompts y por consola, y los acentos rompen encodings en Windows. En Markdown y en JSX sí se usan tildes normalmente.

### 3.2 TypeScript estricto, sin `any`

`strict: true` está activo y no se negocia. Si algo no tipa, el problema es el diseño, no el tipo.

```ts
// ❌
const data: any = await res.json();

// ✅
const data = (await res.json()) as { features: Feature[] };
```

La única excepción viva es el componente `Globe` de `react-globe.gl`, que no trae tipos usables. Está aislado con un cast explícito y comentado en `components/GlobeView.tsx`. **No agregues excepciones nuevas sin dejar el motivo escrito al lado.**

### 3.3 Funciones puras en el motor

Todo en `lib/engine.ts` y `lib/trade.ts` recibe lo que necesita por parámetro y devuelve un resultado. No leen el store, no tocan `window`, no tienen fecha ni aleatoriedad escondida (salvo el sorteo de eventos, que está concentrado en `rollEvents` y `crisisEvents`).

Esto no es purismo: es lo que permite que alguien pruebe una fórmula en la consola del navegador sin levantar una partida entera.

```ts
// ✅ pura: mismos argumentos, mismo resultado
export function bilateralVolume(a: string, b: string, ctx: TradeContext): number

// ❌ escondida: nadie puede probarla ni predecirla
export function bilateralVolume(a: string, b: string): number {
  const st = useGame.getState();   // lee estado global
  return st.countries[a].economy.gdp_trillion_usd * Math.random();
}
```

### 3.4 El estado se cambia solo en el store

`lib/store.ts` es el **único** lugar donde el estado del juego se modifica. Los componentes leen con `useGame(...)` y llaman acciones (`takeDecision`, `endTurn`, `joinBloc`). Nunca mutan lo que leyeron.

Dentro del store, antes de tocar un objeto se lo copia con `fresh()`:

```ts
const countries = fresh(st.countries);   // copia profunda
applyDelta(countries[st.playerCode], delta, world);
set({ countries });
```

Mutar el estado en el lugar hace que React no vea el cambio y la pantalla quede vieja. Es el bug más común de este stack y el más difícil de encontrar después.

**Al leer, suscribite solo a lo que usás.** `useGame()` sin selector devuelve el store entero: el componente se re-renderiza ante cualquier cambio, incluido el feed. En componentes caros (el globo) eso significa recalcular arcos, rutas y puntos sin motivo.

```ts
// ❌ el globo se recalcula cada vez que entra una línea al feed
const { countries, relations } = useGame();

// ✅ solo cuando cambia lo que realmente usa
const { countries, relations } = useGame(
  useShallow((s) => ({ countries: s.countries, relations: s.relations }))
);
```

Y memoizá cada capa por separado: prender el comercio no debería obligar a recalcular los arcos diplomáticos.

### 3.5 El turno tiene UNA sola implementación

Todo lo que pasa en un mes sin intervención del azar vive en `deterministicTick()` (`lib/simulation.ts`): economía, comercio, rutas cerradas, cohesión de bloques, capital político. Lo usan dos lugares: el turno real (`endTurn` en el store) y el preview de consecuencias.

No es una elección estética. Si el preview reimplementara la economía, los dos cálculos se desincronizarían en el primer cambio de fórmula y el preview empezaría a mentir. Está verificado que coinciden: proyectar un ajuste fiscal a 3 meses da −6.4 de felicidad, y jugarlo de verdad da −6.4.

Lo que queda fuera del tick porque no es determinista: sorteo de eventos, reacciones de la IA, resolución de eventos y feed.

### 3.6 Números redondeados al guardar

Los porcentajes del juego se guardan con 2 decimales como máximo (`round()` en `lib/engine.ts`). Nada de `inflation: 114.39999999999998` en pantalla.

### 3.7 Sin dependencias nuevas sin motivo

El proyecto tiene 6 dependencias: `next`, `react`, `react-dom`, `react-globe.gl`, `three`, `zustand`. Cada paquete nuevo es peso de build, superficie de bugs y una decisión que el otro agente no tomó. Si hace falta una función de utilidad de 20 líneas, se escribe.

**`three` va alineada con la que pide `globe.gl`.** Si conviven dos versiones, three.js renderiza objetos creados por la otra copia y el globo se cae con `determinantAffine is not a function`. `package.json` fuerza una sola copia:

```json
"overrides": { "three": "$three" }
```

Al actualizar `react-globe.gl`, revisá qué versión de `three` trae `globe.gl` y subí la del proyecto a la misma.

### 3.8 Sin CSS-in-JS ni frameworks de estilo

Todo el estilo vive en `app/globals.css` con clases reutilizables (`.card`, `.row`, `.pill`, `.section`, `.decision`) y variables CSS (`--bg`, `--good`, `--bad`). Los `style={{}}` inline se usan solo para valores calculados (el ancho de una barra, el color de un bloque).

---

## 4. Cómo se agrega contenido (los cuatro casos comunes)

### 4.1 Un evento

En `lib/events/world.ts` (mundial) o `lib/events/national.ts` (nacional o de liderazgo):

```ts
{
  id: 'corrida_bancaria',          // único en TODO el juego, snake_case
  scope: 'nacional',
  title: 'Corrida bancaria',        // lo que ve el jugador
  emoji: '🏦',
  tags: ['economia', 'crisis'],     // reutilizá tags existentes antes de inventar
  weight: 6,                        // 3 = raro, 6 = normal, 10 = frecuente
  duration: 2,
  description: 'Dos o tres oraciones concretas. Qué pasa y por qué te importa.',
  when: (c) => c.player.economy.inflation > 30,   // opcional
  choices: [ /* 2 o 3 opciones */ ]
}
```

Reglas de diseño de eventos, no negociables porque son lo que hace que el juego no sea aburrido:

1. **Toda opción tiene un costo.** Si una opción es gratis y buena, las otras no existen.
2. **Ninguna opción es obviamente la mejor.** Si hay una respuesta correcta, no es una decisión: es un trámite.
3. **El `detail` dice qué se pierde**, no solo qué se gana. "Calma la calle, alimenta la inflación."
4. **`risk` para las opciones autoritarias o de atajo.** Reprimir funciona… el 70% de las veces.
5. **Máximo 3 opciones.** Con cuatro, el jugador deja de leer.

### 4.2 Una decisión

En `lib/decisions.ts`. Misma filosofía, más una regla propia: **el costo en capital político tiene que doler**. Escala vigente:

| Costo | Significado | Ejemplo |
|---|---|---|
| 4–8 | trámite | misión diplomática, comprar oro |
| 10–15 | medida seria | ajuste parcial, sanciones, tratado |
| 18–25 | apuesta de gobierno | reforma laboral, movilizar tropas |

### 4.3 Un bloque o alianza

En `lib/blocs.ts`. Cada bloque necesita `rules: string[]` — dos o tres frases que le expliquen al jugador **qué gana y qué resigna**. Un bloque sin costo no es una decisión.

### 4.4 Un país

1. Entrada completa en `engine/countries_mvp.json` (misma forma que las 24 existentes).
2. ISO3 + capital + bandera en `META` de `scripts/build-data.mjs`. El ISO3 tiene que coincidir con `ADM0_A3` del GeoJSON, no con `ISO_A3` (Francia y Noruega tienen `-99` ahí; es un problema conocido de Natural Earth y por eso usamos `ADM0_A3`).
3. `npm run data`.
4. Sumarlo a los bloques que le correspondan en `lib/blocs.ts`.

---

## 5. Verificación obligatoria antes de cualquier commit

```bash
npm run data        # solo si tocaste datos de países
npx tsc --noEmit    # tipos
npm run build       # que compile de verdad
```

**Los tres tienen que pasar.** Un commit que no compila le hace perder una hora al otro agente, que va a asumir que el problema lo causó él.

Además, si tocaste el motor o la interfaz, **probalo en el navegador**. El store está expuesto en `window.__game` justamente para eso:

```js
const S = () => window.__game.getState();
S().start('Argentina');
S().takeDecision('ajuste_fiscal');
S().endTurn();
S().countries.Argentina.economy;        // ¿los números tienen sentido?
S().feed.slice(0, 5).map(f => f.title);  // ¿el feed cuenta lo que pasó?
```

Y el globo en `window.__globe`:

```js
const c = {}; window.__globe.scene().traverse(o => { if (o.__globeObjType) c[o.__globeObjType] = (c[o.__globeObjType]||0)+1; }); c;
// { polygon: 288, arc: 42, path: 6, point: 5, ring: 1 }
```

### Verificar que el globo realmente dibuja

Contar objetos en la escena **no alcanza**: los objetos pueden existir mientras el render está roto. Lo que prueba que se ve algo es que avance el contador de frames del renderer.

```js
const r = window.__globe.renderer().info.render;
const f = r.frame;
setTimeout(() => console.log('frames nuevos:', window.__globe.renderer().info.render.frame - f), 1000);
// tiene que dar > 0. Si da 0, el render está muerto aunque la escena esté llena.
```

## 5.1 Errores conocidos y qué significan

| Síntoma | Causa | Solución |
|---|---|---|
| `object.matrixWorld.determinantAffine is not a function` y globo negro | dos copias de `three` en `node_modules` (una del proyecto, otra anidada bajo `globe.gl`): los objetos los crea una versión y los renderiza la otra | `package.json` tiene `"overrides": { "three": "$three" }` justamente para esto. Verificá con el comando de abajo y, si hay dos, `rm -rf node_modules package-lock.json && npm install` |
| 404 en `main-app.js`, página en blanco | corriste `npm run build` con `npm run dev` levantado; los dos escriben en `.next` | parar dev, `rm -rf .next`, levantar de nuevo |
| `Failed to read source code from .../globe.gl/node_modules/three/...` | caché de webpack apuntando a una copia de three que ya se borró | `rm -rf .next` y reiniciar dev |
| El país no se pinta en el globo | su ISO3 no coincide con `ADM0_A3` del GeoJSON | revisá `META` en `scripts/build-data.mjs` y corré `npm run data` |

Comprobar que hay una sola copia de three:

```bash
find node_modules -maxdepth 4 -type d -name three
# tiene que devolver exactamente una linea: node_modules/three
```

> ⚠️ **No corras `npm run build` con el `npm run dev` levantado.** Los dos escriben en `.next` y el dev server queda con chunks rotos (404 en `main-app.js`, página en blanco). Si te pasa: parar dev, `rm -rf .next`, volver a levantar.

---

## 5.2 Guardado de partida

La partida se guarda sola en `localStorage` al cerrar cada acción que cambia el mundo (decisión, evento resuelto, cambio de bloque, fin de turno) y se retoma sola al abrir la página.

- Clave: `change-game:save`. Versión actual: **1** (`SAVE_VERSION` en `lib/persistence.ts`).
- **Si cambiás la forma del estado persistido, subí `SAVE_VERSION` y agregá la migración en `migrate()`.** Un save de versión desconocida se descarta en silencio: perder una partida molesta, cargar un estado corrupto es peor.
- Agregar un campo nuevo al estado no obliga a subir la versión si tiene un valor por defecto sensato: `loadSaved()` completa lo que falte con `initial()`. Eso es lo que permite que un save viejo siga andando cuando aparecen capas nuevas.
- El save guarda solo datos, nunca funciones (`snapshot()` en `lib/store.ts`). Pesa ~38 KB por partida.

Para probar a mano:

```js
window.__game.getState().newGame();     // borra el save y vuelve al inicio
localStorage.getItem('change-game:save');
```

## 6. Git: cómo commiteamos

- **Rama por tarea**: `evento/corrida-bancaria`, `motor/ciclo-electoral`, `ui/panel-comercio`. Nada directo a `main` salvo documentación.
- **Un commit = un cambio con sentido.** No "varios arreglos".
- **Mensaje en español, imperativo, explicando el porqué**:

```
Agrega corrida bancaria como evento nacional

Faltaba un evento que castigue la inflación alta sostenida. Se dispara
con inflación > 30% y las tres opciones cruzan tasa, reservas y cepo,
que hasta ahora solo aparecían en decisiones voluntarias.
```

- **Antes de empezar**: `git pull`. **Antes de pedir merge**: los tres comandos de la sección 5.

---

## 7. Reparto entre Claude y Grok

Los dos leen este documento y `docs/ESPECIFICACION.md` antes de escribir una línea.

| | Claude (Claude Code) | Grok |
|---|---|---|
| **Fuerte en** | motor, refactors, tipos, integración visual | contenido en volumen, variantes, datos, narrativa |
| **Zona** | `lib/engine.ts`, `lib/trade.ts`, `lib/store.ts`, `components/*` | `lib/events/*`, `lib/decisions.ts`, `lib/blocs.ts`, `engine/countries_mvp.json` |
| **Por qué** | son archivos donde dos manos se pisan | son listas: agregar ítems no genera conflictos |

**Durante la partida** el reparto es otro y complementario: el motor local resuelve los números (que tienen que ser consistentes turno a turno) y Grok resuelve las reacciones y la crónica (que tienen que ser variadas y creíbles). Ninguno de los dos hace bien el trabajo del otro: un LLM no mantiene la coherencia numérica en 40 turnos, y un motor determinista escribe reacciones repetidas.

### Prompt de arranque para Grok

> Trabajás sobre el repo `change-game` (github.com/Elucho21/change-game): Next.js 15 + TypeScript estricto + react-globe.gl, juego de geopolítica por turnos.
>
> Antes de escribir código leé, en este orden: `docs/REGLAS_DE_CODIGO.md`, `docs/ESPECIFICACION.md` y `lib/types.ts`.
>
> Reglas que no podés romper:
> 1. No cambiás `lib/types.ts` ni el formato de `engine/countries_mvp.json` sin avisarme.
> 2. Trabajás solo en la zona que te asigno (ver tabla de zonas). No tocás `lib/engine.ts`, `lib/trade.ts` ni `lib/store.ts`.
> 3. Nada de `any`, nada de dependencias nuevas, contenido sin tildes en los strings de datos.
> 4. Toda opción de evento tiene costo y ninguna es obviamente la mejor.
> 5. Terminás corriendo `npx tsc --noEmit` y `npm run build`, y me contás en 5 líneas qué cambiaste.
>
> Tu tarea: [una tarea, de una sola zona].

---

## 8. Qué hacer cuando algo no encaja

Si para hacer tu tarea necesitás romper una regla de acá, **la regla puede estar mal**. Pero no la rompas en silencio: cambiá este documento en el mismo commit, explicando por qué. Un documento que no se actualiza deja de leerse, y entonces volvemos a dos agentes hablando idiomas distintos, que es exactamente lo que esto viene a evitar.
