# Nota para Opus — qué hizo Grok y cómo adaptar

Fecha: 22 ago 2026. Autores: Grok (este commit y el `f24c442`) sobre el Sprint 2 de Opus (`62fc214`).

Leé esto antes de tocar `lib/politics.ts`, `lib/simulation.ts`, `lib/store.ts` o el JSON de países. Pisé zona de motor a pedido del jugador. No es un accidente.

---

## 1. Estado de git

**Sí: está en `main`.** HEAD = `f24c442` (*Sistemas electorales reales, 100 dias y 52 paises nuevos*). PR #3 mergeado squash. No hay PRs abiertos.

Últimos dos commits de `main`:

| SHA | Quién | Qué |
|---|---|---|
| `f24c442` | Grok | Sistemas electorales + 100 días + 76 países |
| `62fc214` | Opus | Sprint 2: `ongoing`, sectores, impuestos, ciclo electoral, tests |

El PR #1 de Grok (**no** se mergeó): pisaba `GlobeView` y `MapPoint`. Los puertos/aeropuertos entraron por el #2 (`c9889de`), solo arrays.

Un save viejo de antes de `f24c442` carga, pero `honeymoonUntil` / `pendingBallotage` se rellenan con 0/false. **Nueva partida** para ver luna de miel y los 52 países. No subí `SAVE_VERSION`.

---

## 2. Lo que leí de tu Sprint 2 (no lo rehacer)

Entendido y dejado en pie:

- `ongoing` / `worldOngoing` + `active[]` que ahora sí se usa.
- `sectorEffects` + `sectorHealth`.
- Impuestos contra `taxBase` del propio país (no contra la media mundial).
- `lib/politics.ts`: mandato, reelección, sucesor de tres perfiles, oposición que **converge**, `poll()`, `runElection()`, `GovernmentPanel`, `ElectionModal`.
- Inflación logarítmica (Argentina jugable).
- Tests en `tests/engine.test.ts` (19 casos). Los corrí: siguen verdes, más 6 míos.

No toqué `lib/engine.ts` ni `lib/trade.ts`. El preview sigue siendo `deterministicTick()`.

---

## 3. Qué pidió el jugador (todo el hilo, no solo el último commit)

Orden aproximado. Lo marcado **hecho** está en `main`. Lo demás es backlog para vos o para Grok-contenido.

### 3.1 Jugabilidad que notó al jugar

1. **El capital solo subía al pasar el turno.** No había acciones que sumaran. Pedido: que ganar elecciones recargue, y que existan acciones de campaña/pacto que sumen.
2. **Diplomacia plana.** Un TLC Argentina–Uruguay costaba y rendía igual que Argentina–EE.UU. Pedido: tasar por tamaño de PBI y por relación actual.
3. **Gabinete.** Ministros elegibles que sumen capital / estabilidad / felicidad o abaraten una categoría.
4. **Coaliciones.** Poder poner políticos de otro partido en el gabinete.
5. **Encuesta visible + camino a la elección + ballotage + parlamento.**

### 3.2 Capital y 100 días (hecho)

El jugador corrigió mi propuesta de pasivo 3 → **4**.

| | Antes (tu Sprint 2) | Ahora |
|---|---|---|
| Pasivo mensual | `6 + (felicidad-60)/10` | **`4 + (felicidad-60)/10`** |
| Ganar presidencial | `capital + 20` | **`capital + 60`**, tope 100 |
| Ganar medio término | no existía | **`+25`** |
| Luna de miel | no | **4 meses de pasivo ×2** (los 100 días) |

Arrancar partida = acabás de ganar: `honeymoonUntil = turn + 4`, capital inicial sigue en 60.

Constantes en `lib/electoral.ts`: `CAPITAL_PASSIVE_BASE`, `CAPITAL_ON_WIN`, `CAPITAL_ON_MIDTERM_WIN`, `HONEYMOON_MONTHS`.

### 3.3 Sistemas electorales (hecho, encima de tu ciclo)

Tu motor genérico (48 meses, gana si voto > 50) ahora **lee el país**. `runElection` ya no hace `won = vote > 50`.

| País | Mandato | Reelección | Cómo se gana | Medio término |
|---|---|---|---|---|
| Argentina | 48 | 2 consecutivos | 45%, o 40% + 10 pts sobre el segundo; si no, ballotage al mes siguiente | mes 24 |
| Uruguay | 60 | **1** (no inmediata) | 50% o ballotage. Voto simultáneo presidente-parlamento | no |
| EE.UU. | 48 | 2 (22ª enmienda) | 270 electores, no el popular. `popularToElectors(vote)` | mes 24 (Cámara) |
| Brasil | 48 | 2 | 50% o ballotage | no |
| Francia | 60 | 2 | 50% o segunda vuelta | no |
| México | 72 | 1 (sexenio) | mayoría simple | mes 36 |
| Chile | 48 | 1 | 50% o ballotage | no |
| Resto | 48 | 2 | 50% o ballotage | mes 24 |

Uruguay con `maxConsecutive: 1` y `consecutiveTerms: 1` al arrancar hace que **la primera elección ya pida sucesor**. Es a propósito: el partido sigue, el líder no.

Ballotage: `Politics.pendingBallotage`. Si `decideRound` dice ballotage, `applyElection` **no** cierra el mandato ni termina la partida. El mes siguiente `runElection` entra por `decideBallotage` (gana quien pasa 50%).

### 3.4 52 países nuevos (hecho)

24 → **76**. Fuente: `engine/countries_mvp.json`. `npm run data` corrido. ISO3 = `ADM0_A3`.

Europa, África, Asia, Medio Oriente, Centroamérica/Caribe, Oceanía. Incluye India, Turquía, Arabia Saudita, Indonesia, Sudáfrica, Nigeria, Egipto, Israel, **Irán**, Australia, y 42 más.

Bloques actualizados en `lib/blocs.ts`: OTAN, UE, BRICS+ (India, Sudáfrica, Irán, Egipto, Etiopía, EAU, Indonesia), OPEP+ (Saudita, Irán, Irak, EAU, Nigeria, Angola, Argelia), CELAC (Centroamérica/Caribe), Indo-Pacífico (+Australia, Filipinas).

Hubs que estaban sin `country` ahora lo tienen: Singapur, Rotterdam, Jebel Ali, DXB, Changi.

**Irán está en el JSON.** Tu nota del Sprint 2: Ormuz deja de ser solo evento aleatorio. Te toca conectar la mecánica.

El comercio bilateral ahora tiene 2850 pares. Tus tests de calibración (China–USA, USA–México, Brasil–China) **siguen pasando**. Si el globo o el tick se sienten pesados, el cuello está en `trade.ts` / arcos, no en el JSON.

### 3.5 Lo que el jugador pidió y NO está hecho

Grok no lo implementó. Si lo vas a hacer vos, no pises `lib/electoral.ts`.

| Pedido | Estado | Zona |
|---|---|---|
| Acciones que **suman** capital (discurso, pacto con gobernadores) aparte de ganar elecciones | no | Grok, `lib/decisions.ts` |
| Tasador diplomático: costo/beneficio según PBI del target y relación | no | **Opus**, `applyDecisionTo` / preview |
| Gabinete de 5 sillas con perfiles | no | Opus store + Grok catálogo `lib/cabinet.ts` |
| Coalición (ministros de otro partido) | no | Opus |
| Gráfico de encuesta en el tiempo + escaños de parlamento | no | Opus `GovernmentPanel` / `Politics` |
| Eventos de oposición / campaña / sucesión | no | Grok, espera tu `EventContext` con `politics` |
| `ongoing` / `sectorEffects` en el resto de eventos | no | Grok, pedido 3 y 4 de `PEDIDOS_A_GROK.md` |
| Espionaje / sabotaje de puertos | diseño solo | más adelante |
| Diplomacia que escala | diseño solo | ver sección 6 |

---

## 4. Archivos que toqué (incluye zona motor)

Pediste no tocar motor. El jugador pidió lo contrario para capital y elecciones. Lista honesta:

| Archivo | Qué cambió | ¿Zona tuya? |
|---|---|---|
| `lib/electoral.ts` | **nuevo.** Sistemas, `decideRound`, `decideBallotage`, constantes de capital | contenido, no lo reescribas |
| `lib/politics.ts` | `honeymoonUntil`, `pendingBallotage`; `ElectionResult.round/ballotage/electors`; `defaultPolitics` lee `systemOf`; `runElection` usa `decideRound`; `runMidterm`; `isMidtermDue` | **sí** |
| `lib/simulation.ts` | `capitalRegen(capital, hap, honeymoon?)`; `SimState.honeymoonUntil?` | **sí** |
| `lib/store.ts` | `applyElection` (+60, luna de miel, no game-over si ballotage); `applyMidterm`; `simOf` pasa `honeymoonUntil`; `endTurn` corre ballotage / elección / midterm; loadSaved rellena campos nuevos | **sí** |
| `components/GovernmentPanel.tsx` | sistema, luna de miel, medio término, texto de la encuesta = `sys.bar` + `sys.notes` | interfaz |
| `engine/countries_mvp.json` + `scripts/build-data.mjs` META | 52 países | datos |
| `lib/data/countries.gen.json` | generado, no editar a mano | — |
| `lib/blocs.ts` | miembros nuevos | contenido |
| `lib/points.ts` | `country` en 5 hubs | arrays, permitido |
| `scripts/add-countries.mjs` | generador idempotente | no hace falta tocarlo |
| `tests/electoral.test.ts` | 6 casos: pasivo 4, ×2, AR/UY/US | sumá acá si cambiás reglas |
| `docs/PEDIDOS_A_GROK.md` | ítem 8 cerrado | — |

`capitalRegen` ahora tiene tercer argumento opcional (`honeymoon = false`). Llamadas viejas de dos args siguen compilando y dan pasivo 4, no 6.

---

## 5. Cómo adaptar (si vas a seguir el motor)

1. **No borres `lib/electoral.ts`.** Si el ciclo electoral cambia, cambialo en `politics.ts` / `store.ts` y **consultá** `systemOf(code)`. Un `won = vote > 50` otra vez rompe Argentina, Uruguay y EE.UU.
2. **No hardcodees `termLength: 48`.** Uruguay es 60, México 72. `defaultPolitics` ya lo setea.
3. **`ElectionResult` ahora exige `round` y `ballotage`.** Si construís un resultado a mano, los dos campos van. Si `ballotage: true`, **no** pongas `gameOver`.
4. **Luna de miel.** `deterministicTick` duplica el pasivo si `s.honeymoonUntil >= s.turn`. `simOf` ya se lo pasa. Si clonás `SimState` en un test, el campo es opcional (sin él, pasivo simple).
5. **76 países.** Si rebalanceás comercio, no asumas 24 nodos. Los tests de orden de magnitud deberían seguir siendo la red de seguridad.
6. **Irán + Ormuz.** Cuando conectes chokepoint a un país, el código de Irán es `Iran` (no `IRN`; el ISO3 `IRN` está en META).
7. **Tests.** `npm test` = 25. No bajes de eso. Si cambiás `capitalRegen`, actualizá `tests/electoral.test.ts` (espera `capitalRegen(60, 60) === 64` y con honeymoon `68`).
8. **GovernmentPanel** asume `politics.honeymoonUntil`. Si lo sacás del tipo, el panel rompe.

Campos nuevos de `Politics` (obligatorios en el tipo, con default en loadSaved):

```ts
honeymoonUntil: number    // turno inclusive; 0 = sin luna de miel
pendingBallotage: boolean
```

---

## 6. Diseño que el jugador aprobó y nadie codeó todavía

Para que no se pierda el hilo. No lo implementes entero de un saque; el orden que pidió es profundidad → escala (ya hay 76) → guerra → presentación.

**Tasador diplomático** (vos, motor):

```
size = clamp(PBI_objetivo / PBI_tuyo, 0.25, 4)
costo = base * (0.5 + 0.5 * size) * relMod
crecimiento = base * size
```

Ejemplo Argentina, TLC base 12 / +0.4: Uruguay ~6 capital y +0.10 PBI; EE.UU. ~30 capital y +1.6 PBI. La misión diplomática (+12 relación por 5 capital a cualquiera) hay que capearla: cooldown por país.

**Gabinete** (vos store + Grok catálogo): 5 sillas (Economía, Interior, Exterior, Defensa, Jefatura). Pasivos chicos. Un opositor en una silla = coalición: más encuesta y estabilidad, evento cada 6–8 meses que pide algo.

**Parlamento**: 100 escaños post-elección / midterm. Sin mayoría (51), las decisiones de costo ≥ 15 pagan ×1.4.

**Espionaje**: no ahora. Diseño escrito en el chat (escucha / ciber / sabotaje de puerto). Espera a que el gabinete exista.

---

## 7. Qué le toca a Grok ahora (para no pisarnos)

Sigo en contenido. Próximo, en este orden, cuando liberes o no hace falta motor:

1. `ongoing` y `sectorEffects` en el resto de eventos (pedidos 3 y 4).
2. Eventos de oposición / campaña / interna / sucesor (pedido 5). Si `when` necesita `ctx.politics`, agregalo vos como campo opcional al `EventContext`.
3. Decisiones que **suman** capital (discurso, pacto).
4. Eventos de rutas y comercio (pedidos 6 y 7).

No vuelvo a tocar `store.ts` / `simulation.ts` / `politics.ts` salvo que el jugador lo pida otra vez.

---

## 8. Cómo verificar

```js
const S = () => window.__game.getState()
S().newGame(); S().start('Argentina')
S().politics.honeymoonUntil        // 5
S().politics.termLength            // 48
S().start('Uruguay')
S().politics.termLength            // 60
S().politics.maxConsecutive        // 1
Object.keys(S().countries).length  // 76
```

```bash
npm test && npx tsc --noEmit && npm run build
```

`npm run build` con el dev server apagado.
