import { describe, expect, it } from 'vitest';
import { DECISIONS } from '../lib/decisions';
import { decisionEligible, isUsedOnce } from '../lib/diplomacy';
import { useGame } from '../lib/store';
import type { Decision } from '../lib/types';

const dec = (overrides: Partial<Decision>): Decision => ({
  id: 'x', category: 'previsional', label: '', emoji: '', detail: '', cost: { capital: 1 },
  effects: {}, ...overrides
});

describe('decisionEligible (pura)', () => {
  it('una decision once ya usada deja de ser elegible', () => {
    const d = dec({ id: 'reforma_x', once: true });
    expect(decisionEligible(d, [])).toBe(true);
    expect(decisionEligible(d, ['reforma_x'])).toBe(false);
  });

  it('una decision con requires no es elegible hasta que su prerequisito se uso', () => {
    const d = dec({ id: 'desmantelar_x', requires: 'crear_x' });
    expect(decisionEligible(d, [])).toBe(false);
    expect(decisionEligible(d, ['crear_x'])).toBe(true);
  });

  it('isUsedOnce respeta el target cuando la decision necesita objetivo', () => {
    expect(isUsedOnce(['sancionar|USA'], 'sancionar', 'USA')).toBe(true);
    expect(isUsedOnce(['sancionar|USA'], 'sancionar', 'Brazil')).toBe(false);
  });
});

/**
 * Regresion del pedido de Grok (docs/PARA_CLAUDE.md-style): hoy solo habia
 * cooldowns de 1-4 meses, asi que las reformas estructurales se podian
 * repetir como si fueran politicas de corto plazo. Este test pasa por la
 * store real: plan + endTurn, no solo la funcion pura de arriba.
 */
describe('reformas "once" a traves de la store real', () => {
  it('una reforma once no se puede volver a planificar despues de usarla', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');

    useGame.getState().planDecision('bajar_tasa_reemplazo');
    expect(useGame.getState().orders.some((o) => o.kind === 'decision' && o.id === 'bajar_tasa_reemplazo')).toBe(true);
    useGame.getState().endTurn();

    useGame.getState().planDecision('bajar_tasa_reemplazo');
    expect(useGame.getState().orders.some((o) => o.kind === 'decision' && o.id === 'bajar_tasa_reemplazo')).toBe(false);
  });

  it('el par toggle servicio_civico / desmantelar_servicio_civico se habilita en cadena', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');

    expect(useGame.getState().usedOnce).not.toContain('servicio_civico');
    useGame.getState().planDecision('servicio_civico');
    useGame.getState().endTurn();

    expect(useGame.getState().usedOnce).toContain('servicio_civico');

    // servicio_civico ya no es elegible; desmantelar_servicio_civico si
    const { usedOnce } = useGame.getState();
    const crear = DECISIONS.find((d) => d.id === 'servicio_civico')!;
    const desmantelar = DECISIONS.find((d) => d.id === 'desmantelar_servicio_civico')!;
    expect(decisionEligible(crear, usedOnce)).toBe(false);
    expect(decisionEligible(desmantelar, usedOnce)).toBe(true);
  });
});
