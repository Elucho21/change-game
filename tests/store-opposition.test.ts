import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';

/**
 * El jugador reporto que la oposicion sube "sola" pase lo que pase, incluso
 * jugando movidas populistas (categoria comunicacion). Antes de esta pasada
 * ninguna decision tocaba `politics.opposition`: solo existia el canal
 * indirecto via felicidad, que se diluye contra el ancla generica de la
 * simulacion. Este test verifica el lever directo (`Delta.opposition`)
 * a traves de la store real, no de la funcion pura sola.
 */
describe('lever directo de oposicion en decisiones populistas', () => {
  it('jugar un acto masivo baja la oposicion mas que no hacer nada, en el mismo turno', () => {
    useGame.getState().start('Argentina', 'normal');
    useGame.getState().planDecision('acto_masivo');
    useGame.getState().endTurn();
    const conLever = useGame.getState().politics.opposition;

    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.getState().endTurn();
    const sinLever = useGame.getState().politics.opposition;

    expect(conLever).toBeLessThan(sinLever);
  });

  it('el lever se aplica una sola vez por jugada, no se acumula magicamente en el plan', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    const antes = useGame.getState().politics.opposition;
    useGame.getState().planDecision('acto_masivo');
    // todavia no se aplico nada: es plan, no turno jugado
    expect(useGame.getState().politics.opposition).toBe(antes);
  });
});
