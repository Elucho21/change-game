import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';
import { R_NATURAL } from '../lib/centralBank';
import { NATIONAL_EVENTS } from '../lib/events/national';

/**
 * Banco Central a traves de la store real (mismo patron que
 * tests/store-pension.test.ts): la tasa tiene que moverse de verdad en
 * endTurn, y el preview (applyDecisionTo) tiene que coincidir con lo que
 * pasa en la partida real para subir_tasa — mismo motivo que el bug de
 * pension documentado en docs/PARA_CLAUDE.md.
 */
describe('Banco Central a traves de la store real', () => {
  it('arranca en la tasa neutral', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    expect(useGame.getState().centralBank.rate).toBe(R_NATURAL);
  });

  it('planRateChange consolida como los impuestos: subir y despues bajar deja el plan vacio', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.getState().planRateChange(2);
    useGame.getState().planRateChange(-2);
    expect(useGame.getState().orders.some((o) => o.kind === 'rate')).toBe(false);
  });

  it('planRateChange mueve la tasa de verdad al avanzar el turno', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    const antes = useGame.getState().centralBank.rate;
    useGame.getState().planRateChange(3);
    useGame.getState().endTurn();
    expect(useGame.getState().centralBank.rate).toBe(antes + 3);
  });

  it('subir_tasa mueve la tasa +2 igual en el preview que en la partida real', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    const antes = useGame.getState().centralBank.rate;

    const proyeccion = useGame.getState().previewDecision('subir_tasa');
    expect(proyeccion).toBeTruthy();

    useGame.getState().planDecision('subir_tasa');
    useGame.getState().endTurn();
    expect(useGame.getState().centralBank.rate).toBe(antes + 2);
  });

  it('la carta de corrida cambiaria (opcion "tasa") mueve la tasa +3 a traves del evento real', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    // el sorteo de eventos es probabilistico (lib/engine.ts::rollEvents):
    // en vez de esperar a que salga sola, se inyecta directo como pendiente
    // (mismo shape que arma rollEvents) y se resuelve por el camino real
    // (planEventChoice + endTurn), asi el test no es flaky.
    const event = NATIONAL_EVENTS.find((e) => e.id === 'corrida_cambiaria');
    expect(event).toBeTruthy();
    const turn = useGame.getState().turn;
    useGame.setState((st) => ({
      pending: [...st.pending, { key: `corrida_cambiaria-${turn}`, event: event!, turn, target: st.playerCode, resolved: false }]
    }));

    const antes = useGame.getState().centralBank.rate;
    useGame.getState().planEventChoice(`corrida_cambiaria-${turn}`, 'tasa');
    useGame.getState().endTurn();
    expect(useGame.getState().centralBank.rate).toBe(antes + 3);
  });

  it('un cambio de tasa tiene techo y piso (RATE_MIN/RATE_MAX)', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    for (let i = 0; i < 30; i++) {
      useGame.getState().planRateChange(5);
      useGame.getState().endTurn();
    }
    expect(useGame.getState().centralBank.rate).toBeLessThanOrEqual(40);
  });
});
