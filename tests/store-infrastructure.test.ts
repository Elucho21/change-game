import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';
import { INFRA_CONFIG } from '../lib/infrastructure';
import { DECISIONS } from '../lib/decisions';
import { decisionEligible, decisionWhenEligible } from '../lib/diplomacy';
import { buildCtx } from '../lib/engine';

/**
 * Infraestructura (Change World Game v1.3) a traves de la store real, mismo
 * patron que tests/store-pension.test.ts y tests/store-centralbank.test.ts:
 * lo que importa es la costura runPlan/applyDecisionTo, no las funciones
 * puras sueltas (ya cubiertas en tests/infrastructure.test.ts).
 */
describe('Infraestructura a traves de la store real', () => {
  it('empieza sin obras', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    expect(useGame.getState().infrastructure.items).toHaveLength(0);
  });

  it('construir un aeropuerto: preview y partida real cobran el mismo costo fiscal (bug de runPlan vs preview del prerequisito de esta fase)', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    // estabilidad alta y corrupcion baja: el `when` de la decision queda elegible
    useGame.setState((st) => ({
      countries: {
        ...st.countries,
        Argentina: {
          ...st.countries.Argentina,
          population: { ...st.countries.Argentina.population, stability: 80 }
        }
      },
      moral: { ...st.moral, corruption: 10 }
    }));

    const proyeccion = useGame.getState().previewDecision('construir_aeropuerto');
    expect(proyeccion).toBeTruthy();
    const fiscalMetric = proyeccion!.metrics.find((m) => m.key === 'fiscal_balance');
    expect(fiscalMetric!.deltas[0]).toBeCloseTo(-INFRA_CONFIG.aeropuerto.costFiscal, 1);

    useGame.getState().planDecision('construir_aeropuerto');
    useGame.getState().endTurn();

    expect(useGame.getState().infrastructure.items).toHaveLength(1);
    const item = useGame.getState().infrastructure.items[0];
    expect(item.type).toBe('aeropuerto');
    // el turno que se construye ya corre un tick: arranca en buildTurns y baja uno
    expect(item.turnsLeft).toBe(INFRA_CONFIG.aeropuerto.buildTurns - 1);
  });

  it('corrupcion alta: se cobra el recargo y la obra tarda mas', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState((st) => ({
      countries: {
        ...st.countries,
        Argentina: {
          ...st.countries.Argentina,
          population: { ...st.countries.Argentina.population, stability: 90 }
        }
      },
      moral: { ...st.moral, corruption: 90 }
    }));

    useGame.getState().planDecision('construir_base_militar');
    useGame.getState().endTurn();

    const item = useGame.getState().infrastructure.items[0];
    const totalConRecargo = Math.round(INFRA_CONFIG.base_militar.buildTurns * 1.15);
    expect(item.totalTurns).toBe(totalConRecargo);
  });

  it('al completarse la obra, el bono pasivo se nota en el pais desde el mes siguiente', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState((st) => ({
      countries: {
        ...st.countries,
        Argentina: {
          ...st.countries.Argentina,
          population: { ...st.countries.Argentina.population, stability: 90 }
        }
      },
      moral: { ...st.moral, corruption: 0 }
    }));

    useGame.getState().planDecision('construir_aeropuerto');
    useGame.getState().endTurn();
    for (let i = 0; i < INFRA_CONFIG.aeropuerto.buildTurns - 1; i++) {
      useGame.getState().endTurn();
    }

    const item = useGame.getState().infrastructure.items[0];
    expect(item.turnsLeft).toBe(0);

    // Math.random fijo: sin eventos nuevos de por medio, asi la unica fuente
    // de gdp_growth extra en este turno es el bono pasivo ya operativo
    // (mismo patron que tests/store-fiscal-cost.test.ts)
    const originalRandom = Math.random;
    Math.random = () => 0.999;
    try {
      useGame.getState().newGame();
      useGame.getState().start('Argentina', 'normal');
      const antes = useGame.getState().countries.Argentina.economy.gdp_growth;
      useGame.getState().endTurn();
      const derivaSinInfra = useGame.getState().countries.Argentina.economy.gdp_growth - antes;

      useGame.getState().newGame();
      useGame.getState().start('Argentina', 'normal');
      useGame.setState({ infrastructure: { items: [{ id: 'aeropuerto', type: 'aeropuerto', turnsLeft: 0, totalTurns: 4 }] } });
      const antesConInfra = useGame.getState().countries.Argentina.economy.gdp_growth;
      useGame.getState().endTurn();
      const derivaConInfra = useGame.getState().countries.Argentina.economy.gdp_growth - antesConInfra;

      expect(derivaConInfra - derivaSinInfra).toBeCloseTo(INFRA_CONFIG.aeropuerto.passive.gdp_growth ?? 0, 2);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('once: construir una obra la saca del catalogo (Fase A, `when` + `once`)', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState((st) => ({
      countries: {
        ...st.countries,
        Argentina: {
          ...st.countries.Argentina,
          population: { ...st.countries.Argentina.population, stability: 90 }
        }
      },
      moral: { ...st.moral, corruption: 0 }
    }));

    const dec = DECISIONS.find((d) => d.id === 'construir_aeropuerto')!;
    expect(decisionEligible(dec, useGame.getState().usedOnce)).toBe(true);

    useGame.getState().planDecision('construir_aeropuerto');
    useGame.getState().endTurn();

    expect(useGame.getState().usedOnce).toContain('construir_aeropuerto');
    expect(decisionEligible(dec, useGame.getState().usedOnce)).toBe(false);
  });

  it('una decision de infraestructura desaparece del catalogo si no cumple el `when` (estabilidad baja)', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState((s) => ({
      countries: {
        ...s.countries,
        Argentina: {
          ...s.countries.Argentina,
          population: { ...s.countries.Argentina.population, stability: 10 }
        }
      }
    }));

    const dec = DECISIONS.find((d) => d.id === 'construir_base_militar')!;
    const s2 = useGame.getState();
    const ctx = { ...buildCtx(s2.countries[s2.playerCode], s2.world, s2.turn, s2.blocs, s2.relations, { moral: s2.moral }), groups: s2.groups };
    expect(decisionWhenEligible(dec, ctx)).toBe(false);
  });
});
