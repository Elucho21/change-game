# PARA CLAUDE — CHANGE WORLD GAME 1.0

**Leé este archivo primero.** Después `docs/REGLAS_DE_CODIGO.md` sección 7 y `docs/LOGICAS_ECONOMICAS.md`.

Grok dejó el paquete en una **rama alternativa**. No está en `main`. Tu trabajo: **analizar, revisar compatibilidad, corregir lo que sea motor, y pushear vos** (merge a `main` solo cuando esté verde).

---

## Qué tenés que hacer, en este orden

1. `git fetch origin` y checkout **`para-claude/economia-v1-0`**.
2. Analizar este documento + el diff contra `main`.
3. Revisar compatibilidad (checklist abajo). El motor es tuyo: Grok no lo toca en caliente.
4. Corregir lo que falle (sobre todo `runPlan` vs preview).
5. Correr `npm test && npx tsc --noEmit && npm run build`.
6. **Pushear vos.** Preferible: commits en esta rama + merge del PR. Nadie squash-mergea a `main` si el diff de motor no lo revisaste.

Rama: `para-claude/economia-v1-0`  
Repo: `github.com/Elucho21/change-game`  
PR de contenido solo (sin motor): [#9](https://github.com/Elucho21/change-game/pull/9) (`contenido/economia-v1-0`)  
Esta rama **incluye el #9 más el WIP de motor** que Grok no quiso mandar a `main`.

---

## Qué hay en esta rama (dos capas)

### Capa A — contenido Grok (listo para mergear si el motor no se pisa)

| Archivo | Qué |
|---|---|
| `lib/employment_sectors.ts` | Tabla de intensidad de empleo y formalidad por sector |
| `lib/decisions_economia.ts` | 9 decisiones: formalización + impulso sectorial |
| `lib/boot_content.ts` | Concatena esas decisiones al catálogo |
| `lib/events/world.ts` + `world_extra.ts` | `ongoing` / `sectorEffects`; rutas extra |
| `lib/events/national.ts` + `national_extra.ts` | Goteo; deflación, informalidad, recaudación, previsional en la calle |
| `docs/LOGICAS_ECONOMICAS.md` | Fuente de verdad de diseño v1.0 |
| `docs/Gestion_Jubilaciones_Juego.xlsx` | Parámetros y calculadoras |
| `docs/PROMPT_GROK_CONTINUIDAD.md` | Memoria de Grok |
| `tests/content-v10.test.ts` | 12 tests de contenido. En `main`+contenido: **104 tests verdes** |

Esto ya está en el PR #9. No rehacerlo. Si hay conflicto de merge con `main`, el contenido gana en `lib/events/*` y `lib/decisions_economia.ts`.

### Capa B — WIP de motor (NO mergear a `main` sin que lo revises)

Aterrizó en el working tree mientras Grok escribía contenido. **No es un commit de Grok a `main`.** Está acá para que lo veas.

| Archivo | Qué pretende |
|---|---|
| `lib/deflation.ts` | Reservas (oro) crecen si inflación < 0. Factor 1.25%/punto anual, mensualizado |
| `lib/employment.ts` | Estado formal/informal + salario real del jugador. Tick puro |
| `lib/pension.ts` | Sistema previsional del jugador. Tick + `applyPensionReform` |
| `lib/engine.ts` | Tax buoyancy 1.15 sobre `fiscal_balance` en `naturalDrift` |
| `lib/simulation.ts` | Engancha pension + employment + deflación **después del FX** en `deterministicTick`. Preview aplica reformas en `applyDecisionTo` |
| `lib/store.ts` | Estado `pension` / `employment`. Multiplicador de costo previsional. **`runPlan` NO aplica la reforma** (ver bug 1) |
| `lib/persistence.ts` | Campos opcionales. `SAVE_VERSION` sigue en **1** |
| `lib/types.ts` | Categoría nueva `'previsional'` en `Decision` — **cambio de contrato** |
| `lib/decisions.ts` | 8 reformas previsionales + categoría en `CATEGORIES` |
| `lib/cabinet.ts` | `laborMitigation?: number` + `cabinetLaborMitigation()` |
| `lib/ministers_extra.ts` | `laborMitigation` en dos ministros de economía |
| `app/layout.tsx` / `package.json` / `README.md` | Rename a Change World Game v1.0 |

---

## Compatibilidad — lo que tenés que revisar

### 1. Bug: preview ≠ turno real (bloqueante)

`applyDecisionTo` (`lib/simulation.ts`) llama `applyPensionReform` si `dec.category === 'previsional'`.

`runPlan` (`lib/store.ts`) **no**. Ejecuta `applyDelta` de los effects de la carta y listo. El plan del turno es el único lugar donde las órdenes tocan el mundo (`REGLAS_DE_CODIGO.md` 3.6).

Consecuencia: el preview de 3 meses miente. Jugar la reforma no cambia `pension` de verdad.

**Qué hacer:** en `runPlan`, cuando `dec.category === 'previsional'`, aplicar `applyPensionReform` sobre el estado que el tick va a leer. `PlanRun` hoy no lleva `pension`/`employment`: hay que copiarlos al run o mutar `st.pension` de forma explícita **después** del plan y **antes** de `deterministicTick`. El tick ya llama `tickPension`/`tickEmployment` sobre `s.pension`.

### 2. Contrato: categoría `previsional`

- `Decision['category']` ahora incluye `'previsional'`. Es cambio de unión, no un campo opcional. Grok no debió tocarlo; ya está en esta rama para que lo cierres vos.
- `DEFAULT_COOLDOWN` (`lib/diplomacy.ts`) **no** tiene `previsional`. Cae al fallback `2`. Poné un default explícito (3, son reformas caras) o `cooldown` en cada carta.
- `DecisionsPanel` recorre `CATEGORIES`: la pestaña aparece sola. Revisá CSS/ancho de tabs.
- Test "cada segmento tiene al menos ocho opciones": previsional tiene 8. OK.
- Test "comunicacion no toca gdp/inflation/unemployment": no aplica.

### 3. `aumentar_cobertura` rompe tests (bloqueante)

```ts
cost: { capital: 0 },
effects: { capital: 3, happiness: 1 }
```

`tests/engine.test.ts`: "ninguna decision es gratis". Va a ponerse rojo apenas corras el suite con esta capa. Subí el costo (4–8) o sacá la carta del core.

### 4. Dos sistemas de formalización

- Grok: `lib/decisions_economia.ts` (`aportes_nuevos_formales`, `credito_fiscal_formal`, `amnistia_previsional`, `inspeccion_trabajo`) — deltas estáticos de desempleo/caja.
- Motor WIP: `aumentar_cobertura` + `tickEmployment` / `tickPension`.

No los borres de un lado. O el tick lee las decisiones de Grok por `id`, o documentás que las de Grok son el golpe político y las previsionales son el estado. Duplicar el mismo botón dos veces en Economía + Previsional confunde.

`lib/employment_sectors.ts` **no está enchufado** a `lib/employment.ts`. El pedido original era que el tick lea la tabla. Hoy el empleo es un estado agregado del jugador, no por sector.

### 5. Save

`pension` y `employment` son opcionales en `PersistedState`. `SAVE_VERSION` = 1. Un save viejo carga si `loadSaved()` / `initial()` rellenan default. Verificá que un save de `main` actual abra sin `undefined` en el tick.

Si `snapshot()` ahora guarda forma nueva y un cliente viejo no la entiende, subí `SAVE_VERSION` y migrá. Campos opcionales con default **no** obligan versión; no dejes `st.pension` en `undefined` al hidratar.

### 6. Tax buoyancy en `naturalDrift`

`lib/engine.ts` suma `(gdp_growth/100/12) * (1.15-1) * 0.28 * 100` a `fiscal_balance` **todos los países todos los meses**. El diseño pedía lag 2–4 años para bajar impuestos, no un extra mensual chico. Revisá orden de magnitud: a 60 turnos el test "no rompe la economia" tiene que seguir verde. Si pisa el déficit/deuda existente, recortá.

### 7. Deflación usa oro como reservas

`deflationReserveGrowth` mueve `gold_reserves_tonnes`. El diseño habla de reservas internacionales. El motor ya usa oro + FX. OK si lo dejás documentado; no inventes un stat USD en paralelo (eso sí rompe `Delta`).

Deflación profunda (trampa): el tick **no** recorta `gdp_growth` si inflación < −2. Grok puso el evento `trampa_deflacion`. El círculo virtuoso leve está en el tick; la trampa sigue siendo evento. Decidí si el tick debe hacer las dos.

### 8. `sectorEffects` + recesión/pandemia

Grok sacó `gdp_growth` fijo de eventos que ya tenían `sectorEffects` (regla de `PEDIDOS_A_GROK.md` #4), **incluyendo** recesión global y pandemia (referencias que Opus había dejado con los dos). El golpe de crecimiento ahora es proporcional al sector. Preview y turno usan `applySectorShock`. Rejugá una recesión: no debería ser un -0.9 plano para Japón y Argentina.

### 9. `types.ts` y tests de contenido

Grok no cambió campos de `Country`. La única unión nueva es `previsional`. Tests de contenido importan arrays extra **sin** mutar `DECISIONS` (no usan `boot_content`). El panel sí, porque `app/page.tsx` importa `boot_content`.

### 10. Rename

`package.json` name `change-world-game` / version `1.0.0`. `layout.tsx` title. Vercel/CI pueden no importar. Confirmá el proyecto de Vercel.

---

## Checklist de verificación (obligatorio antes de pushear a main)

```bash
git fetch origin
git log --oneline main..HEAD
npm test
npx tsc --noEmit
npm run build          # con el dev server APAGADO
```

En el navegador (`window.__game`):

```js
const S = () => window.__game.getState();
S().newGame(); S().start('Argentina');
// deflacion: forzar inflacion negativa y avanzar 2 meses → oro tiene que subir
// reforma: planificar subir_edad_jubilacion, endTurn, leer S().pension
// preview de esa reforma vs jugarla: mismos numeros
// save viejo: localStorage de una partida de main tiene que abrir
```

Tests nuevos que convienen (zona tuya):

- `deflationReserveGrowth(-1, 80)` > 0 y `deflationReserveGrowth(2, 80) === 0`
- reforma previsional en `runPlan` cambia `pension` igual que `applyDecisionTo`
- `aumentar_cobertura` (o la que quede) tiene `cost.capital > 0`
- tax buoyancy no explota a 60 turnos

---

## Pedidos de motor que esta rama intenta cerrar

Están en `docs/PEDIDOS_A_OPUS.md` (abiertos). Si después de tu revisión quedan hechos, marcá SHA. Si recortás alcance, dejá el resto abierto.

1. Deflación → reservas pasivas  
2. Recaudación dinámica (buoyancy)  
3. Empleo × sectores (`employment_sectors.ts` — **todavía no se lee**)  
4. Combo superávit + deflación + empleo formal → capital (no vi bonus de `capitalPerTurn` en el WIP)  
5. Línea de feed/UI cuando las reservas suben solas (`components/*`, no está)
6. UI: `components/PrevisionalPanel.tsx` + tab en `GameShell.tsx` y una línea en `Onboarding.tsx`. Revisá que lea `pension`/`employment` del store y no calcule reglas de juego en el componente.

---

## Qué Grok no va a hacer

No mergea esta rama a `main`. No rebasea `store.ts` en silencio. Si `main` se movió, `git merge origin/main` (no rebase, no force-push). Conflictos en `store.ts` / `simulation.ts` / `engine.ts` los resolvés vos.

Handoff: este archivo. Contenido ya empujado también en `contenido/economia-v1-0` (PR #9) por si querés mergear contenido primero y motor después.

**CHANGE WORLD GAME 1.0 — Grok 23/08/2026**
