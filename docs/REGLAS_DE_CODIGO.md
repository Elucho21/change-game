# Reglas de código — Change World Game

**Este documento es obligatorio para cualquiera que escriba código acá: Luciano, Claude, Grok o quien venga después.**

> Si volvés después de unos días, leé primero **`docs/CAMBIOS.md`**: tiene lo último que cambió en el motor y qué te habilita, en orden inverso.

El objetivo no es "código lindo". Es que dos agentes trabajando en paralelo, sin verse, produzcan código que encaje sin que nadie tenga que rehacer nada. Todo lo que sigue existe porque su ausencia genera conflictos concretos.

---

## 0. La regla que ordena a todas las demás

> **Los datos mandan sobre el código, y el código manda sobre la interfaz.**

Tres capas, en este orden:

```
DATOS        engine/countries_mvp.json, lib/blocs.ts, lib/events/*, lib/decisions.ts,
   ↓         lib/routes.ts, lib/points.ts
             (contenido puro: números, textos, listas. Sin lógica.)
MOTOR        lib/engine.ts, lib/trade.ts, lib/simulation.ts, lib/politics.ts,
   ↓         lib/store.ts, lib/persistence.ts
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

| Zona | Archivos | Riesgo | Quién |
|---|---|---|---|
| **Contenido: eventos** | `lib/events/world.ts`, `lib/events/national.ts` | Bajo | Grok |
| **Contenido: decisiones** | `lib/decisions.ts` | Bajo | Grok |
| **Contenido: bloques** | `lib/blocs.ts` | Bajo | Grok |
| **Contenido: rutas** | `lib/routes.ts` | Bajo | Grok |
| **Contenido: sistemas electorales** | `lib/electoral.ts` | Bajo | Grok (Opus **lee**, no reescribe) |
| **Datos de países** | `engine/countries_mvp.json` + `scripts/build-data.mjs` | Medio | Grok, **congelado en 76** hasta optimizar comercio |
| **Datos de puntos** | `lib/points.ts` (arrays `PORTS` y `AIRPORTS`) | Bajo | Grok |
| **Tests de contenido** | `tests/electoral.test.ts` y casos nuevos en `tests/engine.test.ts` | Bajo | quien agrega el contenido |
| **Motor** | `lib/engine.ts`, `lib/trade.ts`, `lib/simulation.ts`, `lib/politics.ts`, `lib/orders.ts`, `lib/store.ts`, `lib/persistence.ts` | **Alto** | **Opus, una persona, siempre** |
| **Interfaz** | `components/*.tsx`, `app/globals.css` | Medio | Opus (un componente por persona si se parte) |
| **Docs** | `docs/*`, `AGENTS.md`, `CLAUDE.md`, `README.md` | Bajo | ambos |

Regla práctica: **agregar a una lista casi nunca genera conflicto; cambiar una función sí.** Por eso el contenido se reparte y el motor no.

`lib/electoral.ts` es contrato, no motor: Grok carga sistemas (Argentina, Uruguay, EE.UU.…); Opus llama `systemOf(code)` desde `politics.ts`. Volver a `won = vote > 50` rompe tres países.

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

### 3.6 El jugador planifica, el turno ejecuta

Nada de lo que el jugador elige toca el mundo en el momento. Las acciones se acumulan como **órdenes** (`lib/orders.ts`) y se ejecutan todas juntas al avanzar el mes, en `runPlan()` (`lib/store.ts`).

Esto es una decisión de diseño, no una implementación accidental: el jugador tiene que poder probar, comparar previews y arrepentirse sin ensuciar la partida. Consecuencias para quien programe acá:

- **`runPlan()` es el único lugar donde las órdenes tocan el estado del mundo.** Si agregás un tipo de acción, se planifica primero y se ejecuta ahí.
- **Al historial entra lo ejecutado, no lo intentado.** Una línea por acción, escrita en `runPlan()`.
- **Las órdenes del mismo tipo se consolidan.** Subir el IVA dos puntos y bajarlo dos deja el plan vacío, sin dos líneas contradictorias. Igual con decisiones repetidas y respuestas a eventos: elegir otra opción reemplaza la anterior.
- **El capital político se compromete al planificar** y se libera al cancelar. `availableCapital()` es lo que queda libre; validá contra eso, no contra `capital`.

### 3.7 Números redondeados al guardar

Los porcentajes del juego se guardan con 2 decimales como máximo (`round()` en `lib/engine.ts`). Nada de `inflation: 114.39999999999998` en pantalla.

### 3.8 Sin dependencias nuevas sin motivo

El proyecto tiene 6 dependencias de producción: `next`, `react`, `react-dom`, `react-globe.gl`, `three`, `zustand`, y una sola de desarrollo además de TypeScript: `vitest`. Cada paquete nuevo es peso de build, superficie de bugs y una decisión que el otro agente no tomó. Si hace falta una función de utilidad de 20 líneas, se escribe.

`vitest` entró con motivo: sin runner de tests no hay forma de detectar que un cambio de contenido rompió el balance. Se probó primero `node --test` nativo con `--experimental-strip-types`, que no sirve acá porque Node ESM exige extensión explícita en cada import y eso obligaría a reescribir todos los imports del proyecto.

**`three` va alineada con la que pide `globe.gl`.** Si conviven dos versiones, three.js renderiza objetos creados por la otra copia y el globo se cae con `determinantAffine is not a function`. `package.json` fuerza una sola copia:

```json
"overrides": { "three": "$three" }
```

Al actualizar `react-globe.gl`, revisá qué versión de `three` trae `globe.gl` y subí la del proyecto a la misma.

### 3.9 Sin CSS-in-JS ni frameworks de estilo

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

**Toda decisión tiene enfriamiento.** Sin eso, la estrategia óptima era repetir la misma jugada todos los meses. La escala es corta a propósito, para que el jugador siempre tenga algo que hacer:

| Meses | Cuándo |
|---|---|
| 1 | medidas de rutina |
| 2 | lo que mueve la aguja (default de casi todas las categorías) |
| 3 | lo que cuesta capital de verdad, y toda la categoría defensa |
| 4 | **solo comunicación**: el gesto se gasta si lo repetís |

Si no declarás `cooldown` en la decisión, se usa el default de su categoría (`DEFAULT_COOLDOWN` en `lib/diplomacy.ts`). El enfriamiento de las acciones bilaterales es **por país**: podés mandar una misión a Brasil y otra a Chile el mismo mes, pero no dos a Brasil.

**Categoría `comunicacion`**: actos de gobierno que no cambian la economía, cambian cómo la gente la vive. Regla dura: **no tocan `gdp_growth`, `inflation` ni `unemployment`** — solo felicidad, estabilidad y capital político. Hay un test que lo verifica.

### 4.3 Un bloque o alianza

En `lib/blocs.ts`. Cada bloque necesita `rules: string[]` — dos o tres frases que le expliquen al jugador **qué gana y qué resigna**. Un bloque sin costo no es una decisión.

### 4.4 Un país

Hoy hay **76**. El comercio es O(n²): con 76 el preview pasó de 12 ms a 95 ms. **No se agregan más países** hasta que Opus recorte esa matriz (cachear por turno, no recalcular pares que la decisión no toca).

Cuando se descongele, el procedimiento sigue siendo:

1. Entrada completa en `engine/countries_mvp.json` (misma forma que los existentes).
2. ISO3 + capital + bandera en `META` de `scripts/build-data.mjs`. El ISO3 tiene que coincidir con `ADM0_A3` del GeoJSON, no con `ISO_A3` (Francia y Noruega tienen `-99` ahí; es un problema conocido de Natural Earth y por eso usamos `ADM0_A3`).
3. `npm run data`.
4. Sumarlo a los bloques que le correspondan en `lib/blocs.ts`.
5. Si el país tiene sistema electoral propio (no el fallback de 4 años / 50%), agregarlo en `lib/electoral.ts`.

---

## 5. Verificación obligatoria antes de cualquier commit

```bash
npm run data        # solo si tocaste datos de países
npm test            # tests del motor
npx tsc --noEmit    # tipos
npm run build       # que compile de verdad
```

**Los cuatro tienen que pasar.** Un commit que no compila le hace perder una hora al otro agente, que va a asumir que el problema lo causó él.

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

## 5.1 Tests

```bash
npm test          # una corrida
npm run test:watch
```

Están en `tests/engine.test.ts` y cubren lo que se rompe en silencio: la calibración del comercio, que el preview coincida con el turno real, que los eventos con duración se apaguen solos, que la economía no explote a 60 turnos, que la oposición converja, y que el contenido sea consistente (ids únicos, ninguna decisión gratis, bloques sin miembros inexistentes).

**Si agregás contenido, sumá el caso.** Un evento nuevo con `when` mal escrito no rompe nada visible hasta que alguien juega media hora.

Los rangos de los tests son anchos a propósito: cuidan el orden de magnitud y las relaciones entre valores, no números exactos que cambiarían con cualquier ajuste de balance.

## 5.2 Guardado de partida

La partida se guarda sola en `localStorage` al cerrar cada acción que cambia el mundo (decisión, evento resuelto, cambio de bloque, fin de turno) y se retoma sola al abrir la página.

- Clave: `change-game:save`. Versión actual: **1** (`SAVE_VERSION` en `lib/persistence.ts`).
- **Si cambiás la forma del estado persistido, subí `SAVE_VERSION` y agregá la migración en `migrate()`.** Un save de versión desconocida se descarta en silencio: perder una partida molesta, cargar un estado corrupto es peor.
- Agregar un campo nuevo al estado no obliga a subir la versión si tiene un valor por defecto sensato: `loadSaved()` completa lo que falte con `initial()`. Eso es lo que permite que un save viejo siga andando cuando aparecen capas nuevas.
- El save guarda solo datos, nunca funciones (`snapshot()` en `lib/store.ts`). Pesa ~38 KB por partida.
- Campos agregados después (`taxBase`, `politics`, `active`) son opcionales en `PersistedState` y se reconstruyen al cargar: por eso un save viejo sigue funcionando sin subir la versión.

Para probar a mano:

```js
window.__game.getState().newGame();     // borra el save y vuelve al inicio
localStorage.getItem('change-game:save');
```

## 6. Git: cómo commiteamos

- **Rama por tarea**, siempre: `evento/corrida-bancaria`, `contenido/paises`, `motor/ciclo-electoral`, `docs/acuerdo`.
- **Nadie pushea a `main` en caliente.** Ni Grok ni Opus. `main` solo se mueve con PR mergeado.
- **Excepción estrecha: docs de una sola línea** (typo, enlace). Todo lo demás, PR.
- **Un commit = un cambio con sentido.** No "varios arreglos".
- **Mensaje en español, imperativo, explicando el porqué**:

```
Agrega corrida bancaria como evento nacional

Faltaba un evento que castigue la inflacion alta sostenida. Se dispara
con inflacion > 30% y las tres opciones cruzan tasa, reservas y cepo,
que hasta ahora solo aparecian en decisiones voluntarias.
```

- **Antes de empezar**: `git pull`. **Antes de pedir merge**: los comandos de la sección 5.
- El PR declara la zona en el título: `contenido: …`, `motor: …`, `docs: …`. Si un PR de Grok lista un archivo de motor, Opus no lo mergea: se cierra y se convierte en nota.

---

## 7. Acuerdo de colaboración (Opus y Grok)

Esto no es un organigrama. Es lo que evita el conflicto del 22/08: Grok tocó `store.ts` / `politics.ts` / `simulation.ts` mientras Opus reescribía el click. Esta vez fueron dos imports; la próxima puede ser el medio de `endTurn`.

### 7.1 Quién es quién

| | Opus (Claude Code) | Grok |
|---|---|---|
| **Fuerte en** | motor, refactors, tipos, integración, UI | contenido en volumen, datos, narrativa, sistemas por país |
| **Escribe** | `lib/engine.ts`, `trade`, `simulation`, `politics`, `orders`, `store`, `persistence`, `components/*` | `lib/events/*`, `decisions.ts`, `blocs.ts`, `routes.ts`, `electoral.ts`, `points.ts` (arrays), `engine/countries_mvp.json` |
| **No escribe** | catálogos de eventos/decisiones (salvo un caso de prueba) | **ningún archivo de motor, nunca** |

**Durante la partida** el motor local resuelve los números (consistentes turno a turno) y Grok resuelve reacciones y crónica (variadas y creíbles). Ninguno hace bien el trabajo del otro.

### 7.2 La regla que no se vuelve a romper

> **Grok no toca el motor.** Aunque el jugador se lo pida en el chat.

Si el jugador le pide a Grok un cambio de `store` / `politics` / `simulation` / `orders` / `engine` / `trade` / `persistence`:

1. Grok **no codea**.
2. Grok escribe el pedido en `docs/PEDIDOS_A_OPUS.md` (qué, por qué, contrato, cómo probarlo).
3. Grok avisa en el chat: "esto es motor, quedó escrito para Opus".
4. Opus lo implementa cuando cierre lo que tiene en las manos.

El 22/08 el jugador pidió 100 días y sistemas electorales. Eso **es motor**. Grok lo implementó porque no había otro camino y pisó a Opus. No se repite: ahora `lib/electoral.ts` existe para que el contenido electoral no viva dentro de `politics.ts`.

### 7.3 Git, en la práctica

- Grok trabaja **siempre en rama** y abre PR. No squash-mergea a `main` si el diff toca motor.
- Opus también trabaja en rama cuando el cambio es grande.
- Antes de arrancar: `git pull`. Si `main` se movió, rebase. No se resuelve a mano en silencio un conflicto de `store.ts`.
- Handoff: `docs/NOTA_PARA_OPUS.md` (Grok → Opus) y `docs/PEDIDOS_A_GROK.md` (Opus → Grok). Un pedido por ítem.

### 7.4 Contratos que el otro tiene que respetar

- **`systemOf(code)`** (`lib/electoral.ts`): cómo se gana una elección. Opus no lo inlinea. Volver a `won = vote > 50` rompe Argentina, Uruguay y EE.UU.
- **`runPlan()`** (`lib/store.ts`): único lugar donde las órdenes tocan el mundo. Una decisión nueva de Grok es una carta en `decisions.ts`; se vuelve orden en `orders.ts`, que es de Opus.
- **`availableCapital()`**, no `capital` crudo, para validar costos (el plan compromete).
- **`deterministicTick()`**: única implementación del mes. Preview y turno real.
- **76 países, no más**, hasta que el comercio deje de ser O(n²) crudo. Irán (`Iran`, ISO `IRN`) está: conectar Ormuz al país es motor, Opus.

### 7.5 Si el jugador pide las dos cosas a la vez

El orden del proyecto es **profundidad de simulación → escala → guerra → presentación**. Si Grok y Opus reciben tareas del mismo sprint: Opus profundidad/motor, Grok el contenido que ese motor ya soporta (`PEDIDOS_A_GROK.md`). Grok no adelanta el motor para destrabar contenido.

### Prompt de arranque para Grok

> Trabajas sobre el repo `change-game` (github.com/Elucho21/change-game): Next.js 15 + TypeScript estricto + react-globe.gl, juego de geopolitica por turnos.
>
> Antes de escribir codigo lee, en este orden: `docs/REGLAS_DE_CODIGO.md` (seccion 7 = acuerdo), `docs/PEDIDOS_A_GROK.md`, `docs/ESPECIFICACION.md` y `lib/types.ts`.
>
> Reglas que no podes romper:
> 1. No tocas el motor: `lib/engine.ts`, `lib/trade.ts`, `lib/simulation.ts`, `lib/politics.ts`, `lib/orders.ts`, `lib/store.ts`, `lib/persistence.ts`. Si el jugador te pide un cambio ahi, lo escribis en `docs/PEDIDOS_A_OPUS.md` y no lo codeas.
> 2. Siempre rama + PR. No pusheas a `main`.
> 3. No cambias `lib/types.ts` ni el formato de `engine/countries_mvp.json` sin avisar. Campos opcionales si.
> 4. Nada de `any`, nada de dependencias nuevas, contenido sin tildes en los strings de datos.
> 5. Toda opcion de evento tiene costo y ninguna es obviamente la mejor.
> 6. No agregas paises: estamos en 76 hasta que Opus recorte el comercio O(n^2).
> 7. Una decision nueva es una carta en `lib/decisions.ts`. No la apliques al mundo: el plan del turno (`runPlan`) es de Opus.
> 8. Terminas corriendo `npm test && npx tsc --noEmit && npm run build`, y contas en 5 lineas que cambiaste.
>
> Tu tarea: [una tarea, de una sola zona de contenido].

---

## 8. Qué hacer cuando algo no encaja

Si para hacer tu tarea necesitás romper una regla de acá, **la regla puede estar mal**. Pero no la rompas en silencio: cambiá este documento en el mismo commit, explicando por qué. Un documento que no se actualiza deja de leerse, y entonces volvemos a dos agentes hablando idiomas distintos, que es exactamente lo que esto viene a evitar.
