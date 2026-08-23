/**
 * Presion de calle por inflacion y desempleo altos sostenidos.
 *
 * Modulo PURO: Opus lo cablea en deterministicTick + EventContext.
 * Ver docs/PEDIDOS_A_OPUS_23_37.md (#23 y #24).
 */

export type StreetState = {
  /** meses consecutivos con inflacion sobre el umbral */
  inflationMonthsHigh: number;
  /** meses consecutivos con desempleo sobre el umbral */
  unemploymentMonthsHigh: number;
  /** 0-12: weight sugerido para eventos de calle */
  streetWeight: number;
};

export const INFLATION_THRESHOLD = 25;
export const UNEMPLOYMENT_THRESHOLD = 12;
export const MONTHS_TO_IGNITE = 2;

export const defaultStreet = (): StreetState => ({
  inflationMonthsHigh: 0,
  unemploymentMonthsHigh: 0,
  streetWeight: 0
});

/**
 * Avanza contadores un mes. Pura.
 * Si ambos indicadores bajan del umbral, los contadores vuelven a 0.
 */
export function tickStreetPressure(
  prev: StreetState,
  inflation: number,
  unemployment: number
): StreetState {
  const inflationMonthsHigh =
    inflation > INFLATION_THRESHOLD ? prev.inflationMonthsHigh + 1 : 0;
  const unemploymentMonthsHigh =
    unemployment > UNEMPLOYMENT_THRESHOLD ? prev.unemploymentMonthsHigh + 1 : 0;

  let streetWeight = 0;
  if (inflationMonthsHigh >= MONTHS_TO_IGNITE) {
    streetWeight += Math.min(8, 2 + inflationMonthsHigh);
  }
  if (unemploymentMonthsHigh >= MONTHS_TO_IGNITE) {
    streetWeight += Math.min(6, 2 + unemploymentMonthsHigh);
  }

  return {
    inflationMonthsHigh,
    unemploymentMonthsHigh,
    streetWeight: Math.min(12, streetWeight)
  };
}

/** Goteo mensual sugerido cuando streetWeight >= 4 */
export function streetDrip(weight: number): { happiness: number; stability: number } {
  if (weight < 4) return { happiness: 0, stability: 0 };
  const scale = Math.min(1.5, weight / 8);
  return {
    happiness: Math.round(-0.4 * scale * 10) / 10,
    stability: Math.round(-0.3 * scale * 10) / 10
  };
}
