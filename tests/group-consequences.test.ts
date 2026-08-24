import { describe, expect, it } from 'vitest';
import { defaultPopularGroups, GROUP_CRISIS_THRESHOLD, groupConsequences } from '../lib/popularGroups';
import { DECISIONS } from '../lib/decisions';
import { NATIONAL_EVENTS } from '../lib/events/national';

/**
 * El jugador reporto que los 5 grupos "no aparecen en el juego ni en pantalla
 * y no tienen funciones o impacto". `groupEffects` (lib/types.ts) solo estaba
 * en 5 de ~95 decisiones y 0 eventos, y ningun grupo podia romper nada mas
 * alla de un 30% de una encuesta. Estos tests fijan la cobertura ampliada y
 * las consecuencias duras nuevas.
 */

describe('cobertura de groupEffects', () => {
  it('bastante mas de las 5 decisiones originales lo usan', () => {
    const conGroupEffects = DECISIONS.filter((d) => d.groupEffects && Object.keys(d.groupEffects).length);
    expect(conGroupEffects.length).toBeGreaterThanOrEqual(30);
  });

  it('los eventos nacionales grandes ya lo usan (antes: cero)', () => {
    const choicesConGroupEffects = NATIONAL_EVENTS
      .flatMap((e) => e.choices ?? [])
      .filter((c) => c.groupEffects && Object.keys(c.groupEffects).length);
    expect(choicesConGroupEffects.length).toBeGreaterThanOrEqual(10);
  });
});

describe('consecuencias duras por grupo', () => {
  it('un grupo por encima del umbral no gatilla nada', () => {
    expect(groupConsequences(defaultPopularGroups())).toEqual([]);
  });

  it('cada grupo bajo el umbral gatilla su propia consecuencia', () => {
    const bajo = GROUP_CRISIS_THRESHOLD - 5;
    const crisis = groupConsequences({ ...defaultPopularGroups(), obrera: bajo });
    expect(crisis).toHaveLength(1);
    expect(crisis[0].group).toBe('obrera');
    expect(crisis[0].delta.happiness).toBeLessThan(0);
  });

  it('alta baja drena reservas, empresarios bajo frena el crecimiento', () => {
    const bajo = GROUP_CRISIS_THRESHOLD - 5;
    const altaCrisis = groupConsequences({ ...defaultPopularGroups(), alta: bajo });
    expect(altaCrisis[0].delta.gold_reserves_tonnes).toBeLessThan(0);

    const empresariosCrisis = groupConsequences({ ...defaultPopularGroups(), empresarios: bajo });
    expect(empresariosCrisis[0].delta.gdp_growth).toBeLessThan(0);
  });

  it('clase media baja cuesta capital politico, no un delta de pais', () => {
    const bajo = GROUP_CRISIS_THRESHOLD - 5;
    const c = groupConsequences({ ...defaultPopularGroups(), claseMedia: bajo });
    expect(c[0].capitalPenalty).toBeGreaterThan(0);
    expect(Object.keys(c[0].delta)).toHaveLength(0);
  });

  it('varios grupos en crisis a la vez devuelven varias consecuencias', () => {
    const bajo = GROUP_CRISIS_THRESHOLD - 5;
    const c = groupConsequences({
      ...defaultPopularGroups(), obrera: bajo, alta: bajo, empresarios: bajo, claseMedia: bajo
    });
    expect(c).toHaveLength(4);
  });

  it('fieles nunca gatilla consecuencia: tiene piso 35, siempre arriba del umbral 30', () => {
    // el piso de fieles (applyGroupEffects/tickPopularGroups, lib/popularGroups.ts)
    // es 35, por encima de GROUP_CRISIS_THRESHOLD (30): es la base leal, nunca
    // deberia poder cruzar a "en crisis"
    const c = groupConsequences({ ...defaultPopularGroups(), fieles: 35 });
    expect(c.find((x) => x.group === ('fieles' as never))).toBeUndefined();
  });
});
