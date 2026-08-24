import { describe, expect, it } from 'vitest';
import { defaultEmployment, tickEmployment, type EmploymentTickInput } from '../lib/employment';

const noChange: EmploymentTickInput = {
  gdpGrowth: 0,
  contribTotalDeltaPp: 0,
  coverageDeltaPp: 0,
  retirementAgeDeltaYears: 0,
  inflation: 2
};

describe('empleo formal/informal y salario real', () => {
  it('sin cambios de fondo, el empleo formal casi no se mueve', () => {
    const r = tickEmployment(defaultEmployment(), noChange);
    expect(Math.abs(r.state.formalPct - defaultEmployment().formalPct)).toBeLessThan(1);
  });

  it('crecimiento del PBI sube el empleo formal', () => {
    const conCrecimiento = tickEmployment(defaultEmployment(), { ...noChange, gdpGrowth: 6 });
    const sinCrecimiento = tickEmployment(defaultEmployment(), { ...noChange, gdpGrowth: 0 });
    expect(conCrecimiento.state.formalPct).toBeGreaterThan(sinCrecimiento.state.formalPct);
  });

  it('subir el aporte total baja el empleo formal', () => {
    const r = tickEmployment(defaultEmployment(), { ...noChange, contribTotalDeltaPp: 3 });
    expect(r.state.formalPct).toBeLessThan(defaultEmployment().formalPct);
  });

  it('un ministro con laborMitigation atenua el dano de subir aportes', () => {
    const sinMitigar = tickEmployment(defaultEmployment(), { ...noChange, contribTotalDeltaPp: 3 });
    const conMitigar = tickEmployment(defaultEmployment(), { ...noChange, contribTotalDeltaPp: 3, laborMitigation: 0.6 });
    expect(conMitigar.state.formalPct).toBeGreaterThan(sinMitigar.state.formalPct);
  });

  it('mas cobertura/formalizacion sube el empleo formal', () => {
    const r = tickEmployment(defaultEmployment(), { ...noChange, coverageDeltaPp: 8 });
    expect(r.state.formalPct).toBeGreaterThan(defaultEmployment().formalPct);
  });

  it('subir la edad de jubilacion sube la participacion laboral (empleo formal)', () => {
    const r = tickEmployment(defaultEmployment(), { ...noChange, retirementAgeDeltaYears: 2 });
    expect(r.state.formalPct).toBeGreaterThan(defaultEmployment().formalPct);
  });

  it('la deflacion sube el salario real (poder adquisitivo automatico)', () => {
    const r = tickEmployment(defaultEmployment(), { ...noChange, inflation: -3 });
    expect(r.state.realWageIndex).toBeGreaterThan(defaultEmployment().realWageIndex);
  });

  it('inflacion alta no indexada baja el salario real', () => {
    const r = tickEmployment(defaultEmployment(), { ...noChange, inflation: 25 });
    expect(r.state.realWageIndex).toBeLessThan(defaultEmployment().realWageIndex);
  });

  it('subir aportes del trabajador tambien pega en el salario real', () => {
    const r = tickEmployment(defaultEmployment(), { ...noChange, contribTotalDeltaPp: 2 });
    expect(r.state.realWageIndex).toBeLessThan(defaultEmployment().realWageIndex);
  });

  it('formalPct e informalPct quedan siempre dentro de rango valido', () => {
    const r = tickEmployment(defaultEmployment(), { ...noChange, contribTotalDeltaPp: 50 });
    expect(r.state.formalPct).toBeGreaterThanOrEqual(5);
    expect(r.state.formalPct).toBeLessThanOrEqual(95);
    expect(r.state.informalPct).toBeGreaterThanOrEqual(0);
    expect(r.state.informalPct).toBeLessThanOrEqual(90);
  });
});
