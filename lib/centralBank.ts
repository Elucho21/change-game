/**
 * Banco Central: tasa de interes persistente + Confianza (Change World Game
 * v1.2, pedido de Grok en docs/BANCO_CENTRAL_FORMULAS.md).
 *
 * Deliberadamente chico, mismo tamaño que lib/streetPressure.ts: 2 numeros y
 * un tick que converge a un target, no las formulas I/G/X/Conf/M del doc de
 * Grok. La tasa pega ADITIVO sobre naturalDrift/fxPressure (lib/engine.ts,
 * lib/fx.ts) — nunca se tocan los coeficientes ya afinados de esas formulas,
 * solo se suma un termino mas, mismo patron que fxInflationPassthrough.
 */

import type { ImfStage } from './imf';

export interface CentralBankState {
  /** tasa de politica monetaria, puntos porcentuales */
  rate: number;
  /** 0-100. Confianza de mercado en la moneda/gestion. Por ahora informativa. */
  confidence: number;
  /** turnos desde el ultimo cambio de tasa. -1 el mismo mes del cambio (se lee como "recien"). */
  monthsSinceRateChange: number;
}

/** Tasa "neutral": ni contractiva ni expansiva. */
export const R_NATURAL = 5;
export const RATE_MIN = 0;
export const RATE_MAX = 40;
export const RATE_STEP = 1;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export const defaultCentralBank = (): CentralBankState => ({ rate: R_NATURAL, confidence: 60, monthsSinceRateChange: 99 });

/**
 * Efecto ADITIVO de la tasa sobre inflacion/crecimiento este mes. Tasa por
 * encima de la neutral (contractiva) baja inflacion y crecimiento; por
 * debajo (expansiva), al reves. Acotado para que nunca domine sobre
 * naturalDrift, solo lo empuje.
 */
export function rateEconomicEffect(rate: number): { inflation: number; gdp_growth: number } {
  const gap = rate - R_NATURAL;
  return {
    inflation: round(clamp(-gap * 0.09, -1.8, 1.2)),
    gdp_growth: round(clamp(-gap * 0.025, -0.6, 0.35))
  };
}

export interface CentralBankTickInput {
  inflation: number;
  debtToGdp: number;
  goldReservesTonnes: number;
  imfStage: ImfStage;
}

/**
 * Avanza el Banco Central un mes. Pura: no muta `prev`. La confianza
 * converge a un target (mismo idioma que tickMoral/tickStreetPressure):
 * inflacion alta y deuda alta la hunden, reservas y un mandato sin sobresaltos
 * (recien tocaste la tasa) la sostienen; un programa del FMI le pesa.
 */
export function tickCentralBank(prev: CentralBankState, input: CentralBankTickInput): CentralBankState {
  const monthsSinceRateChange = prev.monthsSinceRateChange + 1;
  const target = clamp(
    70
    - Math.max(0, input.inflation - 8) * 1.1
    - Math.max(0, input.debtToGdp - 80) * 0.15
    + Math.min(10, input.goldReservesTonnes / 50)
    - (monthsSinceRateChange <= 1 ? 4 : 0)
    - (input.imfStage === 'program' ? 8 : input.imfStage === 'mission' ? 3 : 0),
    0, 100
  );
  const confidence = clamp(round(prev.confidence + (target - prev.confidence) * 0.12), 0, 100);
  return { ...prev, confidence, monthsSinceRateChange };
}

/** Cambia la tasa, respeta el rango y marca el mes del cambio (para que la confianza lo note). */
export function applyRateChange(prev: CentralBankState, delta: number): CentralBankState {
  return { ...prev, rate: round(clamp(prev.rate + delta, RATE_MIN, RATE_MAX), 1), monthsSinceRateChange: -1 };
}

/**
 * Carga de intereses de la deuda, en puntos de PBI por mes (Change World Game
 * v1.4, item #8 del reordenamiento de economia).
 *
 * Hasta v1.3 `debt_to_gdp` subia con el deficit (`naturalDrift`, lib/engine.ts)
 * pero NUNCA volvia — no habia intereses, ni riesgo pais, ni spread. Una
 * deuda del 180% del PBI era gratis salvo por el arco del FMI. Esto cierra
 * el circulo: mas deuda y mas bajo el stage del FMI, mas cara la tasa
 * EFECTIVA a la que se financia el pais (`riskPremium`), y esa tasa paga
 * intereses reales sobre el stock de deuda todos los meses.
 *
 * ADITIVO sobre `fiscal_balance`, mismo patron que el resto del modulo: se
 * resta en `deterministicTick` (lib/simulation.ts) junto al resto de los
 * terminos fiscales, nunca reemplaza nada.
 */
export function interestBurden(debtToGdp: number, rate: number, imfWeight: number): number {
  // prima de riesgo: sube con la deuda por encima de un umbral sano, y con
  // que tan metido esta el pais en el radar del FMI (weight 0-18)
  const riskPremium = Math.max(0, (debtToGdp - 60) * 0.02) + imfWeight * 0.15;
  const effectiveRate = rate + riskPremium;
  // deuda x tasa efectiva, mensualizado (divisor 1800 = 100 x 100 x 12 x 1.5
  // de margen). Techo a proposito: ni la peor combinacion puede tumbar la
  // economia en un solo mes (ver tests/engine.test.ts "no rompe la economia").
  return round(clamp((debtToGdp * effectiveRate) / 1800, 0, 1), 3);
}

export function confidenceLabel(confidence: number): string {
  if (confidence >= 70) return 'Alta confianza';
  if (confidence >= 45) return 'Confianza normal';
  if (confidence >= 25) return 'Confianza baja';
  return 'Desconfianza';
}
