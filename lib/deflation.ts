/**
 * Deflacion + reservas + superavit pasivo, Change World Game v1.0.
 *
 * Regla del paquete de diseño: si el pais entra en deflacion (inflacion < 0),
 * las reservas internacionales crecen SOLAS (apreciacion real, menos demanda
 * de importaciones, posible entrada de capitales). "Reservas" en este motor
 * es `economy.gold_reserves_tonnes` (ya integrado con el tipo de cambio en
 * lib/fx.ts), no se crea un stat en USD en paralelo.
 *
 * La otra mitad de la regla ("el superavit no decae de forma pasiva bajo
 * deflacion") no necesita codigo: `fiscal_balance` en este motor solo se
 * mueve por deltas explicitos (impuestos, decisiones, eventos) o por la
 * recaudacion dinamica de lib/engine.ts — nunca por un decaimiento pasivo.
 * Un superavit ya se preserva solo. Se documenta la regla completa en la
 * Guia para que quede explicito, aunque la mitad ya la cumple el motor.
 */

/** % de las reservas que crecen por cada punto de deflacion anual. */
export const DEFLATION_RESERVE_FACTOR = 0.0125;

/**
 * Crecimiento pasivo de reservas este mes, en toneladas.
 * Devuelve 0 si no hay deflacion (inflation >= 0). `inflation` es la tasa
 * ANUAL (misma unidad que `economy.inflation`); el factor del diseño es
 * anual, asi que se mensualiza igual que el resto del motor (ver
 * `gdp_growth / 100 / 12` en lib/engine.ts).
 */
export function deflationReserveGrowth(inflation: number, reservesTonnes: number): number {
  if (inflation >= 0) return 0;
  const growth = (Math.abs(inflation) * DEFLATION_RESERVE_FACTOR * reservesTonnes) / 12;
  return Math.round(growth * 10) / 10;
}
