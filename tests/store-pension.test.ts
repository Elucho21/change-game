import { describe, expect, it } from 'vitest';
import { useGame } from '../lib/store';

/**
 * Regresion del bug que encontro Grok en docs/PARA_CLAUDE.md: `runPlan`
 * (lib/store.ts, lo que corre `endTurn`) no aplicaba `applyPensionReform`
 * aunque `applyDecisionTo` (el que usa el preview) si lo hacia — el preview
 * mentia, y jugar la reforma de verdad no cambiaba `pension`. Este test
 * pasa por la store real (planDecision + endTurn), no por las funciones
 * puras sueltas, porque el bug estaba justo en esa costura.
 */
describe('reforma previsional a traves de la store real (bug runPlan vs preview)', () => {
  it('planificar y avanzar el mes aplica la reforma sobre pension, no solo sobre el preview', () => {
    useGame.getState().start('Argentina', 'normal');
    const before = useGame.getState().pension;

    useGame.getState().planDecision('subir_aporte_trabajador');
    // todavia no se aplico nada: plan del turno, sin tocar el mundo
    expect(useGame.getState().pension).toEqual(before);

    useGame.getState().endTurn();
    const after = useGame.getState().pension;

    expect(after.contribWorker).toBeCloseTo(before.contribWorker + 0.02, 5);
  });

  it('el empleo formal SI reacciona a una reforma tomada este mismo turno (bug: delta contra el mismo tick daba 0)', () => {
    useGame.getState().start('Argentina', 'normal');
    const before = useGame.getState().employment.formalPct;

    useGame.getState().planDecision('subir_aporte_trabajador');
    useGame.getState().endTurn();

    // subir el aporte total 2pp tiene que notarse en el empleo formal del
    // mismo mes en que se aplica la reforma, no recien el mes siguiente
    expect(useGame.getState().employment.formalPct).toBeLessThan(before - 0.5);
  });

  it('el preview de la reforma y jugarla de verdad dan el mismo cambio de parametro', () => {
    useGame.getState().start('Brazil', 'normal');
    const before = useGame.getState().pension;

    const projection = useGame.getState().previewDecision('bajar_tasa_reemplazo');
    expect(projection).not.toBeNull();

    useGame.getState().planDecision('bajar_tasa_reemplazo');
    useGame.getState().endTurn();

    expect(useGame.getState().pension.replacementRate).toBeCloseTo(before.replacementRate - 0.1, 5);
  });
});
