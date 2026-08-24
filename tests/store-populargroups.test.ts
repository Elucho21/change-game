import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';
import { defaultPopularGroups } from '../lib/popularGroups';

/**
 * Popularidad por sector a traves de la store real (mismo patron que
 * tests/store-moral.test.ts): el tick tiene que correr de verdad en
 * `endTurn`, no solo existir como funcion pura sin enganchar.
 */
describe('popularidad por sector a traves de la store real', () => {
  it('arranca en los valores por defecto y se mueve turno a turno', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    expect(useGame.getState().groups).toEqual(defaultPopularGroups());

    for (let i = 0; i < 3; i++) useGame.getState().endTurn();
    // algo se tuvo que mover en 3 turnos de economia real (aunque sea poco)
    const g = useGame.getState().groups;
    const movio = Object.values(g).some((v, i) => v !== Object.values(defaultPopularGroups())[i]);
    expect(movio).toBe(true);
  });

  it('una decision con groupEffects mueve el grupo correspondiente a traves del plan real', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    const antes = useGame.getState().groups.obrera;
    useGame.getState().planDecision('reforma_laboral');
    useGame.getState().endTurn();
    // reforma_laboral tiene groupEffects: { obrera: -5, ... }
    expect(useGame.getState().groups.obrera).toBeLessThan(antes);
  });

  it('grupo 4 (alta) contento suma capital politico via medios, en contra resta', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState((st) => ({ groups: { ...st.groups, alta: 80 } }));
    const antesFeliz = useGame.getState().capital;
    useGame.getState().endTurn();
    const despuesFeliz = useGame.getState().capital;

    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState((st) => ({ groups: { ...st.groups, alta: 10 } }));
    const antesEnojada = useGame.getState().capital;
    useGame.getState().endTurn();
    const despuesEnojada = useGame.getState().capital;

    // el delta con alta contenta tiene que ser mayor que con alta enojada,
    // aislando el efecto de medios del resto de la regen pasiva
    expect(despuesFeliz - antesFeliz).toBeGreaterThan(despuesEnojada - antesEnojada);
  });
});
