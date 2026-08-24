# Pedidos de motor para Opus

Bandeja de Grok → Opus. Si el jugador le pide a Grok un cambio de `store` / `politics` / `simulation` / `orders` / `engine` / `trade` / `persistence`, **Grok no lo codea**: lo escribe acá y avisa.

Formato de cada ítem: qué, por qué, contrato (función o campo), cómo probarlo. Un ítem por pedido. Cuando lo cierres, marcalo hecho y dejá el SHA.

Ver `docs/REGLAS_DE_CODIGO.md` sección 7.

---

> **Nota Grok 23/08:** el WIP de motor (`lib/deflation.ts`, `lib/employment.ts`,
> `lib/pension.ts` + enganche) está en la rama **`para-claude/economia-v1-0`**,
> no en `main`. Instrucciones: `docs/PARA_CLAUDE.md`. Grok no mergea.

## Abiertos (el jugador los pidió, nadie los codeó)

### Empleo × sectores — leer `lib/employment_sectors.ts`

**Qué:** el empleo que genera un punto de PBI depende del sector (turismo 1.55, minería 0.35). Formalidad distinta por sector. Grok dejó la tabla; el motor no la lee.

**Contrato:** `employmentFromSectorPush(sector, gdpDelta)` ya existe. Enchufarlo cuando un evento/decisión mueve un sector o cuando el tick reparte crecimiento. Elasticidad empleo-PBI 0.45–0.60. Aportes ↑ → formalidad ↓.

No hay métrica de informalidad en `Delta`. Camino seguro: campo **opcional** `informality?: number` en `Economy` (0–100). Si no entra en este sprint, seguir proxyando con `unemployment` + `fiscal_balance`.

**Cómo probarlo:** mismo `gdp_growth +0.4` en un país turístico vs minero → el turístico baja más el desempleo.

### Feedback de Timeline / UI para deflación, superávit y recaudación — interfaz

Esto es `components/*`, zona Opus. El jugador tiene que VER por qué le subieron las reservas “sin hacer nada”. Una línea en el feed del tick alcanza: “Deflación leve: reservas +X, poder de compra +Y”.

Grok no lo codea.

---

## Cerrados

### Combo superávit + deflación + empleo formal → capital político — hecho

`capitalComboBonus` (`lib/simulation.ts`), enganchado en `deterministicTick` junto a `capitalRegen`.
0.3–0.8 solo con `fiscal_balance > 0`, `inflation` en (−2, 0] y desempleo bajando este turno
(comparado contra el propio arranque del tick, no contra un campo persistido). Se apaga en
deflación profunda (`inflation <= -2`) para no premiar la trampa.

De paso, capital político y capital diplomático quedaron separados en dos pools (pedido del jugador,
no de Grok): `capitalDiplomatico` es un recurso nuevo (`lib/electoral.ts`) que solo mueven las
decisiones categoría `diplomacia` y los bloques. `diplomaticCapitalBonus` (Canciller) cambió de
significado: ya no abarata/infla el rendimiento de esas decisiones (eso lo cubre el `discount`
genérico como cualquier categoría), ahora es % extra de generación pasiva del pool diplomático
(`diplomaticCapitalRegen`, `lib/simulation.ts`).

### U1–U6 · UX Cartas, Emblemas, Banderas + Onboarding Enrique — hecho

`EventCard`, `CharacterEmblem`, `CountryFlag` (fallback; SVG completo queda para una fase 2 si hace
falta), onboarding de Enrique en 2 pasos (`EnriqueModal.tsx`, `ENRIQUE_ONBOARDING_TURN`). Commits
`803c11d` / `68ce0a6`.

### Deflación → reservas pasivas + superávit preservado — hecho

`lib/deflation.ts` (`deflationReserveGrowth` y afines), enganchado en `deterministicTick`
(`lib/simulation.ts:296-298`).

### Recaudación dinámica (tax buoyancy) — hecho

`TAX_BUOYANCY = 1.15` en `lib/engine.ts:244`, aplicado en `naturalDrift`/`taxEffects`.

### Impacto profundo de ministros (alineamiento, drift de relaciones, inversión, sindicatos) — hecho

Los cinco campos opcionales del contrato propuesto (`alignment`, `relationDrift`, `investmentMod`, `unionPower`, `diplomaticCapitalBonus`) ya están en `Minister` (`lib/cabinet.ts`) y cableados. Ver historial previo en este archivo / commits. `diplomaticCapitalBonus` cambió de significado despues (ver item de capital diplomático abajo): sigue siendo del Canciller, ahora pega sobre la generación pasiva del pool diplomático en vez del costo/rendimiento de las decisiones.

### Gabinete de 5 sillas — hecho
### Coalición — hecho
### Parlamento y gráfico de encuesta — hecho
### Irán y Ormuz — hecho
### Tasador diplomático — hecho
### Comercio O(n²) — mejorado
