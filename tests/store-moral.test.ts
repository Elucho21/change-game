import { describe, expect, it, vi } from 'vitest';
import { useGame } from '../lib/store';
import { ENRIQUE_ONBOARDING_TURN } from '../lib/events/enrique';
import { eligibleEvents } from '../lib/engine';
import { NATIONAL_EVENTS } from '../lib/events/national';
import { MINORITY_LEADER_EVENTS } from '../lib/events/minority_leaders';

// en la app real, lib/boot_content.ts (importado una vez desde app/page.tsx)
// mete MINORITY_LEADER_EVENTS adentro de NATIONAL_EVENTS antes de que se
// juegue nada. Los tests no pasan por app/page.tsx, asi que hay que
// garantizar el mismo mutation-push aca, mismo patron que tests/content-v10.test.ts
if (!NATIONAL_EVENTS.some((e) => e.id === MINORITY_LEADER_EVENTS[0].id)) {
  NATIONAL_EVENTS.push(...MINORITY_LEADER_EVENTS);
}

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

    // desde v1.4 la aparicion de Enrique es una rampa de probabilidad, no una
    // puerta binaria (lib/events/enrique.ts): con investigacion 60 la chance es
    // ~32%, asi que el test fuerza el roll en vez de quedar a merced del azar
    useGame.setState({ moral: { ...useGame.getState().moral, investigacion: 60 } });
    const rng = vi.spyOn(Math, 'random').mockReturnValue(0);
    useGame.getState().endTurn();
    rng.mockRestore();
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

  /**
   * Bug reportado por el jugador via Grok (docs/LIDERES_MINORITARIOS_DIAGNOSTICO.md,
   * 24/08): mes 60, 14% de desempleo, cero cartas de Gustavo/Amalia/Jhon en
   * toda la partida. Causa real: `eventExtraOf` en `endTurn` (lib/store.ts)
   * nunca recibia `moral` (ni `simOf` para el preview) — todo `when` gateado
   * en `c.moral?.algo` quedaba `undefined?.algo` = false para siempre, sin
   * importar el estado real del pais. Fix: un solo `moral: st.moral` de mas
   * en esos dos lugares.
   */
  it('moral llega al sorteo real de eventos: los lideres minoritarios dejan de ser inalcanzables', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    for (let i = 1; i < ENRIQUE_ONBOARDING_TURN; i++) useGame.getState().endTurn();
    useGame.getState().resolveEnrique();
    useGame.getState().resolveEnrique();
    expect(useGame.getState().moral.onboarded).toBe(true);

    useGame.setState((st) => ({
      countries: {
        ...st.countries,
        Argentina: { ...st.countries.Argentina, economy: { ...st.countries.Argentina.economy, unemployment: 14 } }
      }
    }));

    const st = useGame.getState();
    const base = { turn: st.turn, playerCode: st.playerCode, countries: st.countries, relations: st.relations, blocs: st.blocs, world: st.world };

    // con el fix: moral llega al contexto, Gustavo Comun es elegible (14% > su umbral de 12%)
    const conMoral = eligibleEvents({ ...base, eventExtra: { moral: st.moral } });
    expect(conMoral.some((e) => e.characterId === 'gustavo_comun')).toBe(true);

    // reproduce el bug (moral ausente del contexto, como pasaba antes del fix):
    // ningun evento de lideres minoritarios es elegible, pase lo que pase en la partida
    const sinMoral = eligibleEvents(base);
    expect(sinMoral.some((e) => e.characterId === 'gustavo_comun')).toBe(false);
  });
});
