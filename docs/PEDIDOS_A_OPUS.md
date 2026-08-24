# Pedidos de motor para Opus

Bandeja de Grok → Opus. Si el jugador le pide a Grok un cambio de `store` / `politics` / `simulation` / `orders` / `engine` / `trade` / `persistence`, **Grok no lo codea**: lo escribe acá y avisa.

Formato de cada ítem: qué, por qué, contrato (función o campo), cómo probarlo. Un ítem por pedido. Cuando lo cierres, marcalo hecho y dejá el SHA.

Ver `docs/REGLAS_DE_CODIGO.md` sección 7.

---

> **Nota Grok 23/08:** el WIP de motor (`lib/deflation.ts`, `lib/employment.ts`,
> `lib/pension.ts` + enganche) está en la rama **`para-claude/economia-v1-0`**,
> no en `main`. Instrucciones: `docs/PARA_CLAUDE.md`. Grok no mergea.

## Abiertos (el jugador los pidió, nadie los codeó)

### U1–U6 · UX Cartas, Emblemas, Banderas + Onboarding Enrique — ALTA

**Qué:** capa visual del Sistema Moral.
- `EventCard` reutilizable (preview de KPIs antes de confirmar)
- `CharacterEmblem` (Enrique, Gustavo, Amalia, Jhon, Corte, Comisión)
- `CountryFlag` (SVG + fallback)
- Onboarding obligatorio de Enrique en mes 4 (2 pasos: presentación + panel “Cómo funciona el poder en las sombras”)
- Animaciones de entrada / urgencia / confirmación
- Entrada en Timeline con emblema o bandera

**Por qué:** el Sistema Moral ya está diseñado (contenido + mecánicas). Sin esta capa las cartas se sienten genéricas y no se pueden enganchar emblemas ni banderas de países.

**Contrato / docs:**
- `docs/PEDIDO_OPUS_UX_Cartas_Emblemas_Banderas.md` (pedido completo U1–U6)
- `docs/UX_Cartas_Personajes_Emblemas_Banderas.md` (especificación visual)
- `docs/Sistema_Moral_CONTRATO.md` (KPIs, fórmulas, techos, puntos de quiebre)

**Cómo probarlo:**
1. Llegar a mes 4 → secuencia onboarding Enrique (no es carta normal) → se desbloquean KPIs de corrupción/investigaciones.
2. Abrir una carta de Enrique o de un líder minoritario → preview de impacto visible antes de confirmar.
3. Emblema correcto por personaje; flag o fallback en header si aplica.
4. Mobile: opciones apiladas y usables.

---

### Deflación → reservas pasivas + superávit preservado — CHANGE WORLD GAME 1.0

**Qué:** si inflación < 0, las reservas internacionales crecen solas y el superávit fiscal no se come de forma pasiva; se fortalece en términos reales.

**Por qué:** es la regla prioritaria de la v1.0. Hoy el motor no distingue deflación de inflación baja. Grok cargó eventos (`deflacion_leve`, `trampa_deflacion`) con proxies (oro, felicidad). El tick tiene que hacerlo todos los meses, no solo cuando sale el evento.

**Contrato sugerido** (en `deterministicTick`, no en contenido):

```ts
// si inflation < 0:
//   gold_reserves_tonnes += |inflation| * 0.012 * gold_reserves_tonnes   // 1.0–1.5% por punto de deflación
//   si fiscal_balance > 0: no aplicar drift negativo al superávit; opcionalmente * (1 + |inflation|/100) real
```

Deflación leve (0 a −1.5): círculo virtuoso. Deflación < −2 sostenida: trampa (consumo e inversión se postergan; eso sí puede recortar `gdp_growth`).

**Cómo probarlo:** partir Argentina, forzar `inflation = -1` dos turnos, ver reservas subir y el superávit no licuarse. Forzar `-3` cuatro turnos: crecimiento debería resentirse.

Datos de diseño: `docs/LOGICAS_ECONOMICAS.md` §1. Excel: `docs/Gestion_Jubilaciones_Juego.xlsx`.

### Recaudación dinámica (tax buoyancy) — v1.0

**Qué:** Δ recaudación ≈ 1.10–1.30 × Δ PBI. Bajar impuestos duele en t0 y puede compensarse en años 2–4 vía actividad + formalización.

**Por qué:** hoy `bajar_impuestos` es un delta estático (`fiscal_balance: -1.5`). El jugador pidió que bajar impuestos tenga sentido estratégico, no solo político.

**Contrato:** elasticidad recaudación/PBI 1.10–1.30; elasticidad PBI/carga −0.30 a −0.45; lag 24–48 meses. La calculadora del Excel (hoja Calculadora Reforma) es la referencia de números.

**Cómo probarlo:** bajar impuestos, proyectar 36 meses: t0 caja peor, t24–t36 caja cerca de neutral si inflación anclada y no se financia con emisión.

### Empleo × sectores — leer `lib/employment_sectors.ts`

**Qué:** el empleo que genera un punto de PBI depende del sector (turismo 1.55, minería 0.35). Formalidad distinta por sector. Grok dejó la tabla; el motor no la lee.

**Contrato:** `employmentFromSectorPush(sector, gdpDelta)` ya existe. Enchufarlo cuando un evento/decisión mueve un sector o cuando el tick reparte crecimiento. Elasticidad empleo-PBI 0.45–0.60. Aportes ↑ → formalidad ↓.

No hay métrica de informalidad en `Delta`. Camino seguro: campo **opcional** `informality?: number` en `Economy` (0–100). Si no entra en este sprint, seguir proxyando con `unemployment` + `fiscal_balance`.

**Cómo probarlo:** mismo `gdp_growth +0.4` en un país turístico vs minero → el turístico baja más el desempleo.

### Combo superávit + deflación + empleo formal → capital político

**Qué:** los tres juntos son un círculo virtuoso. Hoy el capital pasivo mira felicidad (`electoral.ts`). Falta premiar el combo sin que se vuelva un win-button.

**Contrato:** bonus chico de `capitalPerTurn` (0.3–0.8) solo si `fiscal_balance > 0` **y** `inflation` en (−1.5, 0] **y** desempleo bajando. Si deflación < −2, el bonus se apaga (trampa).

**Cómo probarlo:** el combo da más capital que inflación 2% con déficit, pero menos que una elección ganada.

### Feedback de Timeline / UI para deflación, superávit y recaudación — interfaz

Esto es `components/*`, zona Opus. El jugador tiene que VER por qué le subieron las reservas “sin hacer nada”. Una línea en el feed del tick alcanza: “Deflación leve: reservas +X, poder de compra +Y”.

Grok no lo codea.

---

## Cerrados

### Impacto profundo de ministros (alineamiento, drift de relaciones, inversión, sindicatos) — hecho

Los cinco campos opcionales del contrato propuesto (`alignment`, `relationDrift`, `investmentMod`, `unionPower`, `diplomaticCapitalBonus`) ya están en `Minister` (`lib/cabinet.ts`) y cableados. Ver historial previo en este archivo / commits.

### Gabinete de 5 sillas — hecho
### Coalición — hecho
### Parlamento y gráfico de encuesta — hecho
### Irán y Ormuz — hecho
### Tasador diplomático — hecho
### Comercio O(n²) — mejorado
