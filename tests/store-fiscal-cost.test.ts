import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';
import { NATIONAL_EVENTS } from '../lib/events/national';

/**
 * Bug real (no el que describia el plan original): `cost.fiscal` en
 * decisiones y en choices de evento es solo una etiqueta de display para el
 * "% PBI" que se muestra en el catalogo (ver DecisionsPanel.tsx) — el efecto
 * economico real siempre viaja adentro de `effects.fiscal_balance`, con el
 * mismo valor. `applyDecisionTo` (preview, lib/simulation.ts) y la rama de
 * eventos de `runPlan` (partida real, lib/store.ts) restaban `cost.fiscal`
 * una SEGUNDA vez encima de `effects.fiscal_balance` ya aplicado: cobraban
 * el doble del costo fiscal real, en partidas ya jugadas (no solo en el
 * preview). Fix: sacar esa segunda resta en ambos lugares; el costo fiscal
 * de las decisiones (rama de `runPlan` para `order.kind === 'decision'`)
 * nunca tuvo este problema porque ya solo aplicaba `effects`.
 */
describe('el costo fiscal (cost.fiscal) no se descuenta dos veces', () => {
  it('el preview de una decision ya no duplica el costo fiscal', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');

    const proyeccion = useGame.getState().previewDecision('obra_publica');
    expect(proyeccion).toBeTruthy();
    const metric = proyeccion!.metrics.find((m) => m.key === 'fiscal_balance');
    expect(metric).toBeTruthy();
    // obra_publica: cost.fiscal 1.2 == effects.fiscal_balance -1.2; el delta
    // inmediato (turno 0) tiene que ser -1.2, no -2.4 (el bug)
    expect(metric!.deltas[0]).toBeCloseTo(-1.2, 1);
  });

  it('resolver una eleccion de evento con costo fiscal en la partida real descuenta una sola vez', () => {
    const event = NATIONAL_EVENTS.find((e) => e.id === 'piquete');
    const choice = event?.choices?.find((c) => c.id === 'negociar');
    expect(event).toBeTruthy();
    expect(choice).toBeTruthy();
    expect(choice!.cost?.fiscal).toBeCloseTo(0.4);
    expect(choice!.effects.fiscal_balance).toBeCloseTo(-0.4);

    // Math.random fijo: ningun evento nuevo se sortea este turno en ninguna
    // de las dos corridas, asi la unica diferencia entre ambas es la
    // eleccion que se resuelve (mismo patron que tests/engine.test.ts:685)
    const originalRandom = Math.random;
    Math.random = () => 0.999;
    try {
      useGame.getState().newGame();
      useGame.getState().start('Argentina', 'normal');
      const fiscalAntes = useGame.getState().countries.Argentina.economy.fiscal_balance;
      useGame.getState().endTurn();
      const derivaNatural = useGame.getState().countries.Argentina.economy.fiscal_balance - fiscalAntes;

      useGame.getState().newGame();
      useGame.getState().start('Argentina', 'normal');
      const turn = useGame.getState().turn;
      useGame.setState((st) => ({
        pending: [
          ...st.pending,
          { key: `piquete-${turn}`, event: event!, turn, target: st.playerCode, resolved: false }
        ]
      }));
      useGame.getState().planEventChoice(`piquete-${turn}`, 'negociar');
      useGame.getState().endTurn();
      const fiscalConEleccion = useGame.getState().countries.Argentina.economy.fiscal_balance;

      const deltaAtribuible = (fiscalConEleccion - fiscalAntes) - derivaNatural;
      // con el bug esto daba -0.8 (choice.effects.fiscal_balance restado dos veces)
      expect(deltaAtribuible).toBeCloseTo(choice!.effects.fiscal_balance!, 1);
    } finally {
      Math.random = originalRandom;
    }
  });
});
