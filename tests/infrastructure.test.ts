import { describe, expect, it } from 'vitest';
import {
  corruptionCostMultiplier, defaultInfrastructure, INFRA_CONFIG, startInfrastructure, tickInfrastructure,
  type InfrastructureState
} from '../lib/infrastructure';

describe('corruptionCostMultiplier (pura)', () => {
  it('escalones: <30 sin recargo, <60 20%, <80 50%, resto 80%', () => {
    expect(corruptionCostMultiplier(10)).toBe(1);
    expect(corruptionCostMultiplier(45)).toBe(1.2);
    expect(corruptionCostMultiplier(70)).toBe(1.5);
    expect(corruptionCostMultiplier(90)).toBe(1.8);
  });
});

describe('startInfrastructure (pura)', () => {
  it('corrupcion baja: costo y plazo de catalogo, sin recargo', () => {
    const { item, fiscalCost } = startInfrastructure('aeropuerto', 10);
    expect(fiscalCost).toBeCloseTo(INFRA_CONFIG.aeropuerto.costFiscal);
    expect(item.totalTurns).toBe(INFRA_CONFIG.aeropuerto.buildTurns);
    expect(item.turnsLeft).toBe(item.totalTurns);
  });

  it('corrupcion alta (>60): el costo de caja sube y la obra tarda 15% mas', () => {
    const { item, fiscalCost } = startInfrastructure('aeropuerto', 90);
    expect(fiscalCost).toBeCloseTo(INFRA_CONFIG.aeropuerto.costFiscal * 1.8);
    expect(item.totalTurns).toBe(Math.round(INFRA_CONFIG.aeropuerto.buildTurns * 1.15));
  });

  it('corrupcion media (30-60): sube el costo de caja pero no el plazo', () => {
    const { item, fiscalCost } = startInfrastructure('base_militar', 45);
    expect(fiscalCost).toBeCloseTo(INFRA_CONFIG.base_militar.costFiscal * 1.2);
    expect(item.totalTurns).toBe(INFRA_CONFIG.base_militar.buildTurns);
  });
});

describe('tickInfrastructure (pura)', () => {
  it('decrementa turnsLeft un mes, sin bono pasivo mientras esta en obra', () => {
    const state: InfrastructureState = { items: [{ id: 'aeropuerto', type: 'aeropuerto', turnsLeft: 4, totalTurns: 4 }] };
    const r = tickInfrastructure(state);
    expect(r.state.items[0].turnsLeft).toBe(3);
    expect(r.justCompleted).toHaveLength(0);
    expect(r.passiveDeltas).toEqual({});
  });

  it('completa una sola vez: el mes que turnsLeft llega a 0 entra a justCompleted', () => {
    const state: InfrastructureState = { items: [{ id: 'aeropuerto', type: 'aeropuerto', turnsLeft: 1, totalTurns: 4 }] };
    const r1 = tickInfrastructure(state);
    expect(r1.state.items[0].turnsLeft).toBe(0);
    expect(r1.justCompleted).toHaveLength(1);
    expect(r1.passiveDeltas).toEqual(INFRA_CONFIG.aeropuerto.passive);

    // el mes siguiente ya esta operativa: el bono sigue, pero no vuelve a "completar"
    const r2 = tickInfrastructure(r1.state);
    expect(r2.justCompleted).toHaveLength(0);
    expect(r2.passiveDeltas).toEqual(INFRA_CONFIG.aeropuerto.passive);
  });

  it('varias obras operativas suman sus bonos pasivos', () => {
    const state: InfrastructureState = {
      items: [
        { id: 'aeropuerto', type: 'aeropuerto', turnsLeft: 0, totalTurns: 4 },
        { id: 'centro_datos_ia', type: 'centro_datos_ia', turnsLeft: 0, totalTurns: 5 }
      ]
    };
    const r = tickInfrastructure(state);
    expect(r.passiveDeltas.gdp_growth).toBeCloseTo(
      (INFRA_CONFIG.aeropuerto.passive.gdp_growth ?? 0) + (INFRA_CONFIG.centro_datos_ia.passive.gdp_growth ?? 0)
    );
  });

  it('sin obras no hay nada que tickear', () => {
    const r = tickInfrastructure(defaultInfrastructure());
    expect(r.state.items).toHaveLength(0);
    expect(r.passiveDeltas).toEqual({});
    expect(r.justCompleted).toHaveLength(0);
  });
});
