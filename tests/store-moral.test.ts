import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';
import { ENRIQUE_ONBOARDING_TURN } from '../lib/events/enrique';

/**
 * Sistema Moral (Change World Game v1.1): el onboarding de Enrique tiene
 * que dispararse exactamente en el mes 4, no antes ni una segunda vez, y
 * jugar una de sus cartas tiene que mover `moral` de verdad a traves de la
 * store real (mismo patron que el bug de runPlan vs preview de la pasada
 * previsional).
 */
describe('sistema moral a traves de la store real', () => {
  it('el onboarding de Enrique no aparece antes del mes 4', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    for (let i = 1; i < ENRIQUE_ONBOARDING_TURN; i++) {
      expect(useGame.getState().pendingEnrique).toBeNull();
      useGame.getState().endTurn();
    }
    expect(useGame.getState().pendingEnrique).toEqual({ kind: 'onboarding', step: 'intro' });
    expect(useGame.getState().moral.onboarded).toBe(false);
  });

  it('el onboarding completo (2 pasos) desbloquea moral.onboarded y no se repite', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    for (let i = 1; i < ENRIQUE_ONBOARDING_TURN; i++) useGame.getState().endTurn();

    expect(useGame.getState().pendingEnrique).toEqual({ kind: 'onboarding', step: 'intro' });
    useGame.getState().resolveEnrique();
    expect(useGame.getState().pendingEnrique).toEqual({ kind: 'onboarding', step: 'panel' });
    expect(useGame.getState().moral.onboarded).toBe(false);

    useGame.getState().resolveEnrique();
    expect(useGame.getState().pendingEnrique).toBeNull();
    expect(useGame.getState().moral.onboarded).toBe(true);

    // avanzar mas meses no lo vuelve a disparar
    for (let i = 0; i < 6; i++) {
      useGame.getState().endTurn();
      if (useGame.getState().pendingEnrique?.kind === 'onboarding') {
        throw new Error('el onboarding se repitio');
      }
    }
  });

  it('jugar una carta de Enrique mueve moral de verdad, no solo el store local', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    for (let i = 1; i < ENRIQUE_ONBOARDING_TURN; i++) useGame.getState().endTurn();
    useGame.getState().resolveEnrique();
    useGame.getState().resolveEnrique();
    expect(useGame.getState().moral.onboarded).toBe(true);

    // fuerza investigacion alta: enriqueEvents() dispara seguro (no depende
    // del roll base) apenas supera 35, asi el test no queda a merced del azar
    useGame.setState({ moral: { ...useGame.getState().moral, investigacion: 60 } });
    useGame.getState().endTurn();
    expect(useGame.getState().pendingEnrique?.kind).toBe('event');

    const before = { ...useGame.getState().moral };
    const pending = useGame.getState().pendingEnrique;
    if (pending?.kind === 'event') {
      const firstChoice = pending.event.choices?.[0];
      expect(firstChoice).toBeTruthy();
      useGame.getState().resolveEnrique(firstChoice!.id);
    }
    expect(useGame.getState().pendingEnrique).toBeNull();
    expect(useGame.getState().moral).not.toEqual(before);
  });
});
