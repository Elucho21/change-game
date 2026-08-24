/**
 * Tipo de cambio real (indice). 100 = arranque de partida.
 * Sube = depreciacion; baja = apreciacion.
 *
 * Termometro de inflacion + fiscal + deuda/FMI + reservas.
 * Comunicacion no lo mueve.
 */

import type { ImfStage } from './imf';
import { R_NATURAL } from './centralBank';

export const FX_START = 100;
export const FX_MIN = 50;
export const FX_MAX = 400;

export interface FxPressureInput {
  inflation: number;
  fiscal: number;
  debt: number;
  imfStage: ImfStage;
  monthsRising: number;
  /** cambio de reservas en toneladas este mes (positivo = suben) */
  deltaReserves?: number;
  /** tasa de politica del Banco Central (lib/centralBank.ts). Contractiva (> R_NATURAL) resta presion. */
  rate?: number;
}

/** Pressure en "puntos" suaves del indice por mes. */
export function fxPressure(input: FxPressureInput): number {
  let p = 0;
  p += 0.15 * Math.max(0, input.inflation - 3);
  p += 0.08 * Math.max(0, -input.fiscal);
  p += (0.04 * Math.max(0, input.debt - 60)) / 10;
  if (input.imfStage === 'mission') p += 0.8;
  if (input.imfStage === 'program') p += 1.5;
  p += 0.3 * Math.min(input.monthsRising, 3);
  p -= 0.2 * Math.max(0, input.fiscal);
  if (input.deltaReserves !== undefined && input.deltaReserves > 0) {
    p -= 0.05 * Math.min(input.deltaReserves, 20);
  }
  if (input.rate !== undefined) {
    p -= 0.05 * Math.max(0, input.rate - R_NATURAL);
  }
  return p;
}

/** Aplica pressure al indice. */
export function applyFx(current: number, pressure: number): number {
  const next = current * (1 + pressure / 100);
  return Math.round(Math.max(FX_MIN, Math.min(FX_MAX, next)) * 10) / 10;
}

/**
 * Passthrough: depreciacion del mes alimenta un poco de inflacion importada.
 * Solo la parte positiva de pressure (depreciar).
 */
export function fxInflationPassthrough(pressure: number): number {
  if (pressure <= 0) return 0;
  return Math.round(Math.min(1.2, pressure * 0.12) * 100) / 100;
}

/** Salto discreto al ejecutar la decision "devaluar". */
export const DEVALUE_JUMP = 8;
