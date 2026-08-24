import { describe, expect, it } from 'vitest';
import {
  applyPensionReform, defaultPension, pensionReformCostMultiplier, pensionResultPctGdp, tickPension
} from '../lib/pension';

describe('sistema previsional', () => {
  it('el resultado por defecto arranca cerca de cero, sin favorecer a nadie de arranque', () => {
    const result = pensionResultPctGdp(defaultPension());
    expect(Math.abs(result)).toBeLessThan(6);
  });

  it('subir la tasa de reemplazo empeora el resultado previsional', () => {
    const base = defaultPension();
    const peor = { ...base, replacementRate: base.replacementRate + 0.1 };
    expect(pensionResultPctGdp(peor)).toBeLessThan(pensionResultPctGdp(base));
  });

  it('subir aportes o cobertura mejora el resultado previsional', () => {
    const base = defaultPension();
    const masAportes = { ...base, contribWorker: base.contribWorker + 0.02 };
    const masCobertura = { ...base, coverage: base.coverage + 0.08 };
    expect(pensionResultPctGdp(masAportes)).toBeGreaterThan(pensionResultPctGdp(base));
    expect(pensionResultPctGdp(masCobertura)).toBeGreaterThan(pensionResultPctGdp(base));
  });

  it('el envejecimiento (dependencyRatio) sube solo, mes a mes', () => {
    const s0 = defaultPension();
    const s1 = tickPension(s0).state;
    expect(s1.dependencyRatio).toBeGreaterThan(s0.dependencyRatio);
  });

  it('sin reformas, el fiscalDelta mes a mes es chico (solo envejecimiento, no el resultado entero)', () => {
    // defaultPension() ya arranca con resultApplied = su propio resultado:
    // ese numero se asume ya metido en el fiscal_balance de arranque del pais
    // (viene de engine/countries_mvp.json). Si no fuera asi, el primer tick
    // le sumaria a fiscal_balance TODO el resultado previsional de golpe.
    const s0 = defaultPension();
    const t1 = tickPension(s0);
    expect(Math.abs(t1.fiscalDelta)).toBeLessThan(0.5);
  });

  it('una reforma SI mueve el fiscalDelta del proximo tick de forma notoria', () => {
    const s0 = defaultPension();
    const reformado = applyPensionReform(s0, 'bajar_tasa_reemplazo');
    const t = tickPension(reformado);
    expect(t.fiscalDelta).toBeGreaterThan(0.5);
  });

  it('una reforma de aportes se ve reflejada en el siguiente resultado previsional', () => {
    const s0 = defaultPension();
    const reformado = applyPensionReform(s0, 'subir_aporte_trabajador');
    expect(reformado.contribWorker).toBeCloseTo(s0.contribWorker + 0.02, 5);
    expect(pensionResultPctGdp(reformado)).toBeGreaterThan(pensionResultPctGdp(s0));
  });

  it('bajar la tasa de reemplazo mueve el parametro correcto', () => {
    const s0 = defaultPension();
    const r = applyPensionReform(s0, 'bajar_tasa_reemplazo');
    expect(r.replacementRate).toBeCloseTo(s0.replacementRate - 0.1, 5);
  });

  it('igualar edad hombres/mujeres sube la edad de las mujeres a la de los hombres', () => {
    const s0 = defaultPension();
    const r = applyPensionReform(s0, 'igualar_edad_hm');
    expect(r.retirementAgeWomen).toBe(s0.retirementAgeMen);
  });

  it('un reformId desconocido no cambia nada (default seguro)', () => {
    const s0 = defaultPension();
    expect(applyPensionReform(s0, 'algo_que_no_existe')).toEqual(s0);
  });

  describe('coste de reformas (moduladores v1.0)', () => {
    it('crisis fiscal y superavit con inflacion baja abaratan la reforma', () => {
      const normal = pensionReformCostMultiplier({ crisisFiscal: false, surplusLowInflation: false, capitalHigh: false });
      const crisis = pensionReformCostMultiplier({ crisisFiscal: true, surplusLowInflation: false, capitalHigh: false });
      const superavit = pensionReformCostMultiplier({ crisisFiscal: false, surplusLowInflation: true, capitalHigh: false });
      expect(crisis).toBeLessThan(normal);
      expect(superavit).toBeLessThan(normal);
    });

    it('el multiplicador nunca baja de un piso (0.4)', () => {
      const todo = pensionReformCostMultiplier({ crisisFiscal: true, surplusLowInflation: true, capitalHigh: true });
      expect(todo).toBeGreaterThanOrEqual(0.4);
    });
  });
});
