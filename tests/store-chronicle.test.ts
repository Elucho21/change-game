import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';

/**
 * La cronica de fin de turno tiene que engancharse de verdad en endTurn
 * (mismo patron que tests/store-populargroups.test.ts), no solo existir
 * como funcion pura en lib/chronicle.ts.
 */
describe('cronica de fin de turno a traves de la store real', () => {
  it('deja un feed item de sistema con el emoji de la cronica tras un turno', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.getState().endTurn();

    const cronica = useGame.getState().feed.find((f) => f.emoji === '🗞️');
    expect(cronica).toBeDefined();
    expect(cronica?.kind).toBe('sistema');
    expect(cronica?.body.length).toBeGreaterThan(0);
  });

  it('la cronica aparece en cada turno, no solo el primero', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    for (let i = 0; i < 3; i++) useGame.getState().endTurn();

    const cronicas = useGame.getState().feed.filter((f) => f.emoji === '🗞️');
    expect(cronicas.length).toBe(3);
  });
});
