/**
 * Empleo formal/informal y salario real, Change World Game v1.0.
 *
 * Mismo patron que lib/pension.ts: estado puro solo del jugador, enganchado
 * en deterministicTick despues de naturalDrift y del tick previsional (para
 * poder leer cuanto cambiaron los aportes/cobertura/edad este mes).
 *
 * Formula simplificada del paquete de diseño:
 *   ΔEmpleoFormal ≈ ε·ΔPBI − α·Δ(aporte total) + γ·ΔCobertura + δ·Δ(edad jubilacion)
 * `laborMitigation` (lib/cabinet.ts, ministro de Economia/Trabajo) atenua el
 * termino negativo de subir aportes.
 */

export interface EmploymentState {
  /** % de ocupados que son empleo formal */
  formalPct: number;
  /** % de ocupados que son empleo informal (formalPct + informalPct <= 100) */
  informalPct: number;
  /** indice de salario real, 100 = arranque de partida */
  realWageIndex: number;
}

export const EMPLOYMENT_GDP_ELASTICITY = 0.5;
export const CONTRIB_FORMAL_IMPACT = 1.0;
export const COVERAGE_FORMAL_IMPACT = 0.5;
export const RETIREMENT_AGE_FORMAL_IMPACT = 0.175;

export const WAGE_PRODUCTIVITY_ELASTICITY = 0.7;
export const WAGE_CONTRIB_IMPACT = 0.9;
export const WAGE_DEFLATION_BONUS = 0.05;
export const WAGE_HIGH_INFLATION_PENALTY = 0.1;

export const defaultEmployment = (): EmploymentState => ({
  formalPct: 58,
  informalPct: 34,
  realWageIndex: 100
});

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export interface EmploymentTickInput {
  /** crecimiento anual del PBI, % (economy.gdp_growth) */
  gdpGrowth: number;
  /** cambio este mes en aporte total (trabajador+empleador), en puntos porcentuales */
  contribTotalDeltaPp: number;
  /** cambio este mes en cobertura, en puntos porcentuales */
  coverageDeltaPp: number;
  /** cambio este mes en edad de jubilacion promedio, en años */
  retirementAgeDeltaYears: number;
  /** inflacion anual, % (economy.inflation; negativo = deflacion) */
  inflation: number;
  /** 0-1, ministro de Economia/Trabajo (lib/cabinet.ts cabinetLaborMitigation) */
  laborMitigation?: number;
}

export interface EmploymentTickResult {
  state: EmploymentState;
  /** Delta.unemployment a aplicar (negativo = baja el desempleo) */
  unemploymentDelta: number;
  /** Delta.happiness a aplicar por variacion de salario real */
  happinessDelta: number;
}

/** Avanza empleo/salarios un mes. Pura: no muta `prev`. */
export function tickEmployment(prev: EmploymentState, input: EmploymentTickInput): EmploymentTickResult {
  const mitigation = clamp(input.laborMitigation ?? 0, 0, 1);
  const contribHit = CONTRIB_FORMAL_IMPACT * input.contribTotalDeltaPp * (1 - mitigation * 0.5);

  const formalDelta =
    EMPLOYMENT_GDP_ELASTICITY * (input.gdpGrowth / 12)
    - contribHit
    + COVERAGE_FORMAL_IMPACT * input.coverageDeltaPp
    + RETIREMENT_AGE_FORMAL_IMPACT * input.retirementAgeDeltaYears;

  const formalPct = clamp(round(prev.formalPct + formalDelta, 2), 5, 95);
  // la informalidad se mueve al reves de la cobertura, mas la mitad de lo que gana/pierde el empleo formal
  const informalDelta = -input.coverageDeltaPp * 0.6 - formalDelta * 0.4;
  const informalPct = clamp(round(prev.informalPct + informalDelta, 2), 0, 90);

  const wageDelta =
    WAGE_PRODUCTIVITY_ELASTICITY * (input.gdpGrowth / 12)
    - WAGE_CONTRIB_IMPACT * input.contribTotalDeltaPp * (1 - mitigation * 0.3)
    + (input.inflation < 0
      ? Math.abs(input.inflation) * WAGE_DEFLATION_BONUS
      : -Math.max(0, input.inflation - 8) * WAGE_HIGH_INFLATION_PENALTY);

  const realWageIndex = clamp(round(prev.realWageIndex + wageDelta, 2), 40, 220);

  return {
    state: { formalPct, informalPct, realWageIndex },
    // mas empleo formal baja el desempleo abierto; se le da la mitad del peso
    // porque parte de ese formal viene de gente que ya estaba trabajando informal
    unemploymentDelta: round(-formalDelta * 0.5, 2),
    happinessDelta: round((realWageIndex - prev.realWageIndex) * 0.05, 2)
  };
}
