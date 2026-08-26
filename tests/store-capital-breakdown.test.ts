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
