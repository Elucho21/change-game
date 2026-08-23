# Pedidos a Opus — items 23 a 37 (listos para codear)

> Empaquetado por Grok (22/08 noche). Cada item trae **que**, **por que**, **contrato**, **codigo de arranque** y **como probar**.
> No pisar el plan del turno ni el cableado FMI/FX ya en main.
> Zona motor: `simulation.ts`, `store.ts`, `politics.ts`, `engine.ts`, `components/*`.

**Ya cubierto por la pasada de 30 mejoras (b5497a3)** y no hace falta rehacer:
- **#30 Buscador de pais** — hecho en StartScreen / CountryPanel.
- Onboarding, CI, service worker, export/import, IA rival, etc.

Modulos puros ya en repo (sin cablear):
- `lib/streetPressure.ts` + tests (#23 #24)
- `lib/factions.ts` + tests (#25)

---

## #23 — Arco de crisis por inflacion (goteo)

### Que
Si `inflation` supera umbral varios meses, weight de eventos calle y un **goteo** de felicidad/estabilidad hasta bajar 2-3 meses seguidos.

### Contrato
Ver `lib/streetPressure.ts`. Umbrales: INFLATION_THRESHOLD=25, MONTHS_TO_IGNITE=2.

### Cableado
1. Guardar `street` en `SimState` / save (default `defaultStreet()`).
2. En `deterministicTick`, despues del drift: `s.street = tickStreetPressure(...)`.
3. Si `streetWeight >= 4`, aplicar `streetDrip(weight)` (ajuste brusco del plan puede amplificar x1.5).
4. Exponer `c.street` en `EventContext` para eventos de piquetes/paros.

### Test
- 3 meses inflation 40 → weight > 0 y goteo.
- 2 meses bajo umbral → weight cae a 0.

---

## #24 — Arco de crisis por desempleo

Misma maquina (`unemploymentMonthsHigh`). Gasto social puede bajar el contador; empeora deficit (empuja FMI).

---

## #25 — Facciones de gasto

Ver `lib/factions.ts`. En `runPlan` costeo: `factionCostFactor(factions, policyKindOf(id))`.
En `coalitionDemand`: liberal pide superavit; sindical pide obra.

---

## #27 — Balotaje jugable

Hoy `pendingBallotage` existe. Falta **1 turno de campana** antes de resolver segunda vuelta.

Flujo:
1. Primera vuelta → pendingBallotage=true sin resolver ganador final.
2. Jugador 1 turno: decisiones `when: c.politics?.pendingBallotage`.
3. Al avanzar: resolveElection con modificadores de lo gastado.

Test AR: 40% sin 10 pts → pending → turno → resolucion.

---

## #28 — Sucesion con legado

```ts
export function inheritFromPredecessor(prev: {
  poll: number; partyLoyalty: number; capital: number;
}): { startingPollBoost: number; startingCapital: number; loyalty: number } {
  return {
    startingPollBoost: Math.round((prev.poll - 50) * 0.4),
    startingCapital: Math.min(40, Math.round(prev.capital * 0.5)),
    loyalty: prev.partyLoyalty
  };
}
```

Cablear en path succession / applyElection del sucesor.

---

## #29 — Parlamento legible (UX)

Panel: "51 escanos = mayoria. Hoy: X. Decisiones >=15 capital: x1.4".

---

## #30 — Buscador de pais — HECHO (b5497a3)

---

## #31 — Timeline del mandato

`components/MandateTimeline.tsx`: barra 0..termLength, hitos de feed + termStart + midterm + imf stage.

---

## #32-34 — Contenido Grok (esta rama)

Oposicion/campana, comercio, Ormuz Iran en commits de contenido.

---

## #35 — Espionaje / sabotaje

Decision `operacion_inteligencia` needsTarget, capital 14, risk 30% exposicion → relation -15, capital -8.
Resolver risk en runPlan (mockeable en tests).

---

## #36 — Sanciones con retaliacion

En tick, por cada sanction: si target en aiRoster, counter o -3 relation; si topPartner, gdp_growth -0.15, happiness -0.5.

---

## #37 — Mapa por deltas

GlobeView color por (current - start) o vs mes anterior. Ya hay startingGdp.

---

## Orden sugerido

1. #23+#24 cablear street  2. #25 facciones  3. #36 retaliacion  4. #27 balotaje  5. #28 legado  6. #35 espionaje  7. #31 timeline  8. #37 deltas  9. #29 copy

Cierre: npm test && tsc && build, commit atomico, CAMBIOS.md.

No tocar decisions/events/MINISTERS salvo hooks. No 100 paises sin ESCALA_GLOBO. No romper runPlan/preview.
