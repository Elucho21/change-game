import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';
import { CAPITAL_DIPLOMATICO_START } from '../lib/electoral';

/**
 * Capital diplomatico: recurso separado del capital politico
 * (docs/PEDIDOS_A_OPUS.md). Solo lo mueven decisiones categoria diplomacia
 * y los movimientos de bloque; todo el resto sigue pagando del capital
 * politico. Mismo patron que tests/store-moral.test.ts: store real, no
 * simulada, para agarrar bugs de plomeria que un test puro no ve.
 */
describe('capital diplomatico a traves de la store real', () => {
  it('arranca separado del capital politico', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    expect(useGame.getState().capitalDiplomatico).toBe(CAPITAL_DIPLOMATICO_START);
    expect(useGame.getState().capital).not.toBe(useGame.getState().capitalDiplomatico);
  });

  it('entrar a un bloque descuenta del capital diplomatico, no del politico', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    const bloc = useGame.getState().blocs.find((b) => !b.members.includes('Argentina') && b.type !== 'militar');
    expect(bloc).toBeTruthy();
    // relacion suficiente con todos los miembros, para que canJoin no bloquee por eso
    useGame.setState((st) => {
      const relations = { ...st.relations };
      for (const m of bloc!.members) {
        relations[`Argentina|${m}`] = 60;
        relations[`${m}|Argentina`] = 60;
      }
      return { relations };
    });

    const politicoAntes = useGame.getState().capital;
    const diplomaticoAntes = useGame.getState().capitalDiplomatico;
    useGame.getState().planJoinBloc(bloc!.id);
    expect(useGame.getState().orders.length).toBeGreaterThan(0);
    useGame.getState().endTurn();

    expect(useGame.getState().blocs.find((b) => b.id === bloc!.id)?.members).toContain('Argentina');
    // el politico solo se movio por la regen pasiva de siempre, nunca por el ingreso
    expect(useGame.getState().capitalDiplomatico).toBeLessThan(diplomaticoAntes + 10);
    expect(useGame.getState().capital).toBeGreaterThanOrEqual(politicoAntes - 1);
  });

  it('una decision de categoria diplomacia mueve el pool diplomatico, no el politico', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');

    const politicoAntes = useGame.getState().capital;
    const diplomaticoAntes = useGame.getState().capitalDiplomatico;
    useGame.getState().planDecision('apoyo_onu');
    const order = useGame.getState().orders[0];
    expect(order?.kind).toBe('decision');
    if (order?.kind === 'decision') expect(order.pool).toBe('diplomatico');

    useGame.getState().endTurn();
    // apoyo_onu da mas de lo que cuesta (invariante de tests/engine.test.ts): sube neto
    expect(useGame.getState().capitalDiplomatico).toBeGreaterThan(diplomaticoAntes);
    // el capital politico solo se movio por su propia regen pasiva, no por la decision
    expect(useGame.getState().capital).toBeGreaterThanOrEqual(politicoAntes);
  });

  it('una decision de otra categoria mueve el capital politico, no el diplomatico', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');

    const diplomaticoAntes = useGame.getState().capitalDiplomatico;
    useGame.getState().planDecision('mesa_dialogo');
    const order = useGame.getState().orders[0];
    expect(order?.kind).toBe('decision');
    if (order?.kind === 'decision') expect(order.pool).toBe('politico');

    useGame.getState().endTurn();
    // mesa_dialogo no toca capital diplomatico: solo se movio por su propia regen pasiva
    expect(useGame.getState().capitalDiplomatico).toBeGreaterThanOrEqual(diplomaticoAntes);
  });

  it('el interes sobre el capital ahorrado tiene techo', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState({ capital: 100 });
    const antes = useGame.getState().capital;
    useGame.getState().endTurn();
    // sin techo, floor(100/10)=10 de interes solo; con techo, min(4, floor(100/12))=4.
    // mas el resto de la regen pasiva (felicidad, combo), el salto total no deberia superar ~15
    expect(useGame.getState().capital - antes).toBeLessThan(15);
  });

  it('corrupcion alta drena capital politico turno a turno', () => {
    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    // fuerza corrupcion alta y felicidad neutra para aislar el efecto del drenaje
    useGame.setState((st) => ({
      moral: { ...st.moral, corruption: 95 },
      countries: {
        ...st.countries,
        Argentina: { ...st.countries.Argentina, population: { ...st.countries.Argentina.population, happiness: 60 } }
      },
      capital: 50
    }));
    const conCorrupcion = (() => {
      useGame.getState().endTurn();
      return useGame.getState().capital;
    })();

    useGame.getState().newGame();
    useGame.getState().start('Argentina', 'normal');
    useGame.setState((st) => ({
      moral: { ...st.moral, corruption: 10 },
      countries: {
        ...st.countries,
        Argentina: { ...st.countries.Argentina, population: { ...st.countries.Argentina.population, happiness: 60 } }
      },
      capital: 50
    }));
    const sinCorrupcion = (() => {
      useGame.getState().endTurn();
      return useGame.getState().capital;
    })();

    expect(conCorrupcion).toBeLessThan(sinCorrupcion);
  });
});
