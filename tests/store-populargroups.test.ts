import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';
import { defaultPopularGroups, GROUP_CRISIS_THRESHOLD } from '../lib/popularGroups';

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

  it('el sistema moral de este turno ya lee los grupos de este mismo turno (orden en endTurn)', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    // fuerza obrera muy enojada justo antes de un endTurn: si moral leyera
    // los grupos DEL TURNO ANTERIOR (bug de orden), gustavoApoyo no
    // reaccionaria todavia a este cambio
    useGame.setState((st) => ({ groups: { ...st.groups, obrera: 5 } }));
    const antes = useGame.getState().moral.gustavoApoyo;
    useGame.getState().endTurn();
    expect(useGame.getState().moral.gustavoApoyo).toBeGreaterThan(antes);
  });

  it('un salto de empresarios entre dos ticks dispara el mensaje de feed correspondiente', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    // fuerza el escenario en el propio estado de grupos (mas confiable que
    // esperar a que la macro real cruce el umbral en un turno): empresarios
    // muy bajo el turno anterior implicito, alta inflacion cayendo este turno
    useGame.setState((st) => ({
      groups: { ...st.groups, empresarios: 20 },
      countries: {
        ...st.countries,
        Argentina: { ...st.countries.Argentina, economy: { ...st.countries.Argentina.economy, inflation: 4 } }
      }
    }));
    useGame.getState().endTurn();
    const feedTitles = useGame.getState().feed.map((f) => f.title);
    expect(feedTitles.some((t) => t.includes('empresarios'))).toBe(true);
  });
  it('un grupo que CRUZA el umbral dentro del turno gatilla la consecuencia dura', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    // arranca apenas arriba del umbral; reforma_laboral tiene
    // groupEffects: { obrera: -5, ... } — el propio turno lo cruza para abajo
    useGame.setState((st) => ({ groups: { ...st.groups, obrera: GROUP_CRISIS_THRESHOLD + 2 } }));
    const antes = useGame.getState().countries.Argentina.population.happiness;
    useGame.getState().planDecision('reforma_laboral');
    useGame.getState().endTurn();
    expect(useGame.getState().groups.obrera).toBeLessThan(GROUP_CRISIS_THRESHOLD);
    const feedTitles = useGame.getState().feed.map((f) => f.title);
    expect(feedTitles).toContain('Huelga general no declarada');
    // la consecuencia pega de verdad sobre el pais, no solo narra
    expect(useGame.getState().countries.Argentina.population.happiness).toBeLessThan(antes + 0.01);
  });

  it('la narracion solo sale el mes que CRUZA el umbral, no todos los meses que sigue abajo', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState((st) => ({ groups: { ...st.groups, obrera: GROUP_CRISIS_THRESHOLD + 2 } }));
    useGame.getState().planDecision('reforma_laboral');
    useGame.getState().endTurn();
    expect(useGame.getState().groups.obrera).toBeLessThan(GROUP_CRISIS_THRESHOLD);
    expect(useGame.getState().feed.map((f) => f.title)).toContain('Huelga general no declarada');

    // sigue abajo del umbral el mes siguiente, sin cruzar de nuevo: no se repite
    useGame.getState().endTurn();
    const apariciones = useGame.getState().feed.filter((f) => f.title === 'Huelga general no declarada').length;
    expect(apariciones).toBe(1);
  });
});

