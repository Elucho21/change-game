# Continuación de sesión — Change Game

> Generado el 23/08/2026 porque la ventana de contexto de la sesión anterior se llenó.
> Pegar este archivo (o su ruta) al arrancar una sesión nueva de Claude Code en este repo.

## Estado del repo AHORA MISMO

- `main` en GitHub: commit `2b1b9fd`, **CI verde, Vercel verde, deployado en producción**.
- Rama sin mergear: **`contenido/ministros-impacto`** (de Grok) — tiene una feature grande pedida formalmente, sin cablear. Ver sección 3.
- 86 tests, `npm run build` limpio.

## 1. Qué se hizo en la sesión anterior (resumen)

Sesión larga de colaboración Claude ↔ Grok sobre el mismo repo (`main`), cada uno pusheando directo. Se hicieron, en orden:

1. Fix de scroll roto en pantalla inicial + recaudación por impuestos invisible.
2. Pasada de 30 mejoras (recursos, código/seguridad, UX, jugabilidad — ver `docs/PLAN_MEJORAS.md` sección "Backlog detallado").
3. **Fix de CI roto desde el primer commit**: el lockfile generado con npm 11 local le faltaban paquetes que npm 10 (CI) exige. Regenerado con `npx npm@10 install`. **Si esto vuelve a fallar en ~1 segundo en CI, es lo primero a revisar.**
4. **Banco Central**: comprar Y vender oro (antes solo compra). Vender mejora el balance fiscal con un spread peor que comprar. UI en `GovernmentPanel.tsx` sección "Banco Central", pasos de 5 toneladas. Lógica en `lib/orders.ts` (`GoldOrder`, `addGoldOrder`, `goldFiscalDelta`, `goldCapitalCost`) y resuelta en `runPlan` (`lib/store.ts`).
5. Capital político: ~16 decisiones/eventos que daban capital pero costaban más de lo que daban, corregidas a netas positivas (test que verifica el invariante para toda `DECISIONS`). +40 de capital inicial fijo. Interés: +1 cada 10 de capital que se sostiene sin gastar de un turno a otro.
6. Merge con 6 commits de Grok (landing cinemático + rotación del globo) — **ojo**: ese merge destapó que Grok había borrado sin querer `.decision`, `.preview`, `.feed-item`, `.section`, `.row`, `.bar`, `.pill`, `.overlay`, `.modal` de `globals.css` en una reescritura. Se restauraron a mano comparando cada `className` usado en componentes contra lo que el CSS define. **Si algo se ve "sin estilo" de golpe, sospechar de esto de nuevo.**
7. `PEDIDOS_A_OPUS_23_37.md` (Grok): cableados **#23/#24 presión de calle** (`lib/streetPressure.ts` → `deterministicTick` + `EventContext.street`) y **#25 facciones de gasto** (`lib/factions.ts` → `decisionCost` + `coalitionDemand`).
8. Merge con 5 commits más de Grok (animación de fin de turno, `app/turn-fx.css`, `turnFx` prop en TopBar/GlobeView/Feed) — sin conflictos.

## 2. Qué falta de `PEDIDOS_A_OPUS_23_37.md`

Orden sugerido por Grok, ninguno empezado:

- **#27** Balotaje jugable: falta 1 turno de campaña antes de resolver la segunda vuelta.
- **#28** Sucesión con legado: `inheritFromPredecessor()`, contrato ya escrito en el doc.
- **#29** Parlamento legible (copy de UX): "51 escaños = mayoría. Hoy: X. Decisiones ≥15 capital: x1.4".
- **#31** Timeline del mandato: `components/MandateTimeline.tsx`.
- **#35** Espionaje/sabotaje: decisión `operacion_inteligencia`, risk 30%.
- **#36** Sanciones con retaliación: contrarrestar o -3 relación si el sancionado está en `aiRoster`.
- **#37** Mapa por deltas: `GlobeView` coloreando por `(actual - inicio)` en vez de absoluto.

Contratos completos de cada uno en `docs/PEDIDOS_A_OPUS_23_37.md`.

## 3. LA FEATURE GRANDE PENDIENTE: impacto profundo de ministros

Grok la dejó pedida formalmente en `docs/PEDIDOS_A_OPUS.md` (sección "Abiertos") y el catálogo ampliado en **la rama sin mergear `contenido/ministros-impacto`** (`lib/ministers_extra.ts`, +187 líneas, 12+ ministros con comentarios `// futuro:`).

**Qué pide**: hoy los ministros solo dan un pasivo genérico y abaratan una categoría. El jugador quiere que peguen distinto según ideología:
- Canciller: según `alignment` (`west`/`east`/`regional`/`nonaligned`), un drift pasivo de relación con países/bloques puntuales.
- Economía pro-mercado: sube inversión/crecimiento, resta con sindicatos y humor social.
- Economía sindical: sube empleo/felicidad, resta inversión y caja.

**Contrato propuesto** (campos opcionales nuevos en `Minister`, `lib/cabinet.ts`):
```ts
alignment?: 'west' | 'east' | 'regional' | 'nonaligned';       // solo Exterior
relationDrift?: Array<{ target: string; amount: number }>;      // pais o 'bloc:X', chico (0.2-0.5/mes)
investmentMod?: number;    // afecta gdp_growth o trade
unionPower?: number;       // afecta streetPressure / moodDrift
diplomaticCapitalBonus?: number;  // % extra de capital en decisiones de diplomacia
```

**Dónde engancharlo**: `deterministicTick` (drift de relaciones), `decisionCost`/capital recuperado en decisiones de diplomacia, `naturalDrift` o `tradeEffects` (investmentMod), `streetPressure`/`moodDrift` (unionPower).

**Antes de arrancar esto**: la rama `contenido/ministros-impacto` está desactualizada respecto a `main` (se ramificó antes de la presión de calle, facciones, banco central y la animación de fin de turno). **No hacer `git merge` directo sin revisar** — probablemente conviene traer solo el contenido nuevo (`lib/ministers_extra.ts`, el texto de `PEDIDOS_A_OPUS.md`) a mano sobre el `main` actual, no mergear la rama entera (revertiría trabajo posterior). Revisar con `git diff main origin/contenido/ministros-impacto -- lib/ministers_extra.ts` antes de tocar nada.

## 4. Cómo verificar que todo sigue sano

```bash
cd "C:\Users\lucia\Documents\change-game"
git fetch origin
git log --oneline main..origin/main    # si hay commits nuevos de Grok, mergear con cuidado (ver punto 6 de arriba)
npx tsc --noEmit -p .
npm run lint
npm test                                # deberia dar 86 o mas
npm run build
```

## 5. Reglas de colaboración con Grok (ya establecidas)

- Grok pushea directo a `main` a veces. Antes de cualquier `git push`, hacer `git fetch` + revisar `git log main..origin/main`.
- Si hay commits nuevos, `git merge origin/main` (nunca rebase, nunca force-push). Si hay conflicto en `globals.css`, revisar con cuidado que no se pierdan reglas — comparar `className` usados en componentes contra lo que el CSS define (ver punto 6 de la sección 1).
- Docs de comunicación entre agentes: `docs/PEDIDOS_A_OPUS.md` (pedidos de motor puntuales, bandeja), `docs/PEDIDOS_A_OPUS_23_37.md` (paquete grande ya cerrado en su mayoría), `docs/NOTA_PARA_OPUS.md` (historia larga, ya vieja pero útil de contexto), `docs/WIRES_PENDIENTES.md` (ya resuelto, dejar como referencia).
- `docs/PLAN_MEJORAS.md` tiene el backlog de la pasada de 30 mejoras original, con lo que quedó pendiente (hotseat, editor de escenario, logros, aranceles jugables, modo campaña) — sigue vigente.

## 6. Prompt sugerido para arrancar la sesión nueva

```
Segui donde quedó la sesión anterior de Change Game. Leé
docs/CONTINUACION_SESION.md en el repo (C:\Users\lucia\Documents\change-game)
para el contexto completo. Confirmame que CI/Vercel siguen en verde y
contame qué encontrás antes de tocar nada.
```
