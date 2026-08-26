import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';

/**
 * Desglose de capital politico/diplomatico (que lo compone este turno),
 * mismo patron de test que tests/store-chronicle.test.ts: tiene que
 * engancharse de verdad en endTurn, no solo existir como calculo suelto.
 */
describe('desglose de capital a traves de la store real', () => {
  it('deja un desglose no vacio de capital politico tras un turno', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.getState().endTurn();

    const b = useGame.getState().capitalBreakdown;
    expect(b.length).toBeGreaterThan(0);
    expect(b.every((x) => typeof x.label === 'string' && typeof x.value === 'number')).toBe(true);
  });

  it('una decision de categoria diplomacia deja una linea de "Decisiones y bloques" en el desglose diplomatico', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.getState().planDecision('apoyo_onu');
    useGame.getState().endTurn();

    const bd = useGame.getState().capitalDiplomaticoBreakdown;
    expect(bd.some((x) => x.label === 'Decisiones y bloques' && x.value !== 0)).toBe(true);
  });
});

/**
 * Desglose por turno de felicidad/estabilidad/crecimiento/inflacion/fiscal/
 * deuda (docs/CAMBIOS.md): 5 tramos del turno, snapshots sobre el mismo
 * pais mutable en distintos puntos de endTurn.
 */
describe('desglose de KPIs (felicidad, estabilidad, crecimiento, inflacion, fiscal, deuda)', () => {
  it('una decision con effects sobre varios KPIs deja "Decisiones y eventos sin responder" en cada uno', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    // bajar_impuestos: effects { fiscal_balance: -1.5, happiness: 3, gdp_growth: 0.3, inflation: 0.4 }
    useGame.getState().planDecision('bajar_impuestos');
    useGame.getState().endTurn();

    const kb = useGame.getState().kpiBreakdown;
    const tramo = 'Decisiones y eventos sin responder';
    expect(kb.happiness?.some((x) => x.label === tramo && x.value > 0)).toBe(true);
    expect(kb.fiscal?.some((x) => x.label === tramo && x.value < 0)).toBe(true);
    expect(kb.growth?.some((x) => x.label === tramo && x.value > 0)).toBe(true);
    expect(kb.inflation?.some((x) => x.label === tramo && x.value > 0)).toBe(true);
  });

  it('cada linea del desglose de KPIs tiene forma {label, value} y valor no nulo', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    for (let i = 0; i < 3; i++) useGame.getState().endTurn();

    const kb = useGame.getState().kpiBreakdown;
    for (const key of Object.keys(kb) as (keyof typeof kb)[]) {
      const lines = kb[key] ?? [];
      expect(lines.every((x) => typeof x.label === 'string' && typeof x.value === 'number' && x.value !== 0)).toBe(true);
    }
  });

  it('el tramo del tick ya no es un solo "Motor economico": aparece alguno de los 3 sub-tramos', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    const subTramos = ['Crisis en curso y gabinete', 'Comercio, impuestos y calle', 'Banco Central, deuda y programas'];

    let vistoAlgunSubTramo = false;
    for (let i = 0; i < 6 && !vistoAlgunSubTramo; i++) {
      useGame.getState().endTurn();
      const kb = useGame.getState().kpiBreakdown;
      for (const key of Object.keys(kb) as (keyof typeof kb)[]) {
        if ((kb[key] ?? []).some((x) => subTramos.includes(x.label))) vistoAlgunSubTramo = true;
      }
    }
    expect(vistoAlgunSubTramo).toBe(true);
  });
});
