/**
 * Arco FMI atado a la deuda.
 *
 * La deuda define la banda; la tendencia y el deficit definen el weight;
 * el stage define que carta puede salir. Solo superavit + deuda bajando
 * (o cumplir el programa) sacan al pais del radar.
 */

export type ImfStage = 'none' | 'watch' | 'mission' | 'program' | 'exit';

export interface ImfState {
  stage: ImfStage;
  /** meses consecutivos con deuda subiendo */
  monthsRising: number;
  /** meses seguidos con balance fiscal >= 0 */
  monthsPrimarySurplus: number;
  /** meses cumpliendo condicionalidades del programa */
  conditionStreak: number;
  /** weight dinamico 0-18 para sorteo / UI */
  weight: number;
  /** turno hasta el cual el stage exit sigue en cooldown */
  exitUntil: number;
}

export const DEBT_WATCH = 60;
export const DEBT_RISK = 75;
export const DEBT_MISSION = 90;
export const DEBT_PROGRAM = 110;
export const RISING_EPS = 0.15;
export const RISING_FORCE = 3;
export const SURPLUS_EXIT = 2;
export const PROGRAM_STREAK = 3;
export const FISCAL_BAD = -3;
export const FISCAL_VERY_BAD = -6;

export const defaultImf = (): ImfState => ({
  stage: 'none',
  monthsRising: 0,
  monthsPrimarySurplus: 0,
  conditionStreak: 0,
  weight: 0,
  exitUntil: 0
});

export function baseWeight(debt: number): number {
  if (debt < DEBT_WATCH) return 0;
  if (debt < DEBT_RISK) return 2;
  if (debt < DEBT_MISSION) return 5;
  if (debt < DEBT_PROGRAM) return 9;
  return 14;
}

/** Weight del mes: deuda + tendencia + fiscal + stage. */
export function computeImfWeight(
  debt: number,
  fiscal: number,
  monthsRising: number,
  stage: ImfStage
): number {
  let w = baseWeight(debt);
  w += 3 * Math.min(monthsRising, 3);
  if (fiscal < FISCAL_BAD) w += 3;
  if (fiscal < FISCAL_VERY_BAD) w += 3;
  if (fiscal >= 0) w -= 4;
  if (stage === 'exit') w -= 10;
  return Math.max(0, Math.min(18, w));
}

function stageFromDebt(debt: number, monthsRising: number, current: ImfStage): ImfStage {
  // program y exit los maneja tickImf (cumplimiento / cooldown)
  if (current === 'exit' || current === 'program') return current;

  if (debt >= DEBT_PROGRAM) return 'program';
  if (debt >= DEBT_MISSION || (monthsRising >= RISING_FORCE && debt >= DEBT_RISK)) {
    return 'mission';
  }
  if (debt >= DEBT_WATCH) {
    return current === 'mission' ? 'mission' : 'watch';
  }
  return 'none';
}

export interface ImfTickInput {
  debt: number;
  prevDebt: number;
  fiscal: number;
  turn: number;
  /** true si este turno el jugador cumplio una meta de ajuste (opcional) */
  compliedThisTurn?: boolean;
}

/**
 * Avanza el estado FMI un mes. Pura: recibe el estado anterior y devuelve el nuevo.
 */
export function tickImf(prev: ImfState, input: ImfTickInput): ImfState {
  const rising =
    input.debt > input.prevDebt + RISING_EPS
      ? prev.monthsRising + 1
      : 0;

  const surplus =
    input.fiscal >= 0 ? prev.monthsPrimarySurplus + 1 : 0;

  let stage = stageFromDebt(input.debt, rising, prev.stage);
  let conditionStreak = prev.conditionStreak;
  let exitUntil = prev.exitUntil;

  // salida del cooldown exit
  if (stage === 'exit' && input.turn > exitUntil) {
    stage = stageFromDebt(input.debt, rising, 'none');
    if (stage === 'exit') stage = 'none';
  }

  // programa: racha de cumplimiento
  if (stage === 'program') {
    const ok =
      input.fiscal >= 0 ||
      input.debt < input.prevDebt ||
      !!input.compliedThisTurn;
    conditionStreak = ok ? conditionStreak + 1 : 0;
    if (conditionStreak >= PROGRAM_STREAK) {
      stage = 'exit';
      conditionStreak = 0;
      exitUntil = input.turn + 8;
    }
  } else if (
    stage !== 'exit' &&
    surplus >= SURPLUS_EXIT &&
    input.debt < input.prevDebt &&
    input.debt < 100
  ) {
    // salida honorable sin programa
    stage = 'exit';
    exitUntil = input.turn + 6;
  }

  const weight = computeImfWeight(input.debt, input.fiscal, rising, stage);

  return {
    stage,
    monthsRising: rising,
    monthsPrimarySurplus: surplus,
    conditionStreak,
    weight,
    exitUntil
  };
}

/** Texto corto para UI / tooltips. */
export function imfLabel(stage: ImfStage): string {
  switch (stage) {
    case 'none':
      return 'Sin radar FMI';
    case 'watch':
      return 'FMI en observacion';
    case 'mission':
      return 'Mision FMI';
    case 'program':
      return 'Programa FMI';
    case 'exit':
      return 'Fuera del radar FMI';
  }
}
