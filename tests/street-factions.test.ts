import { describe, expect, it } from 'vitest';
import {
  defaultStreet,
  tickStreetPressure,
  streetDrip,
  INFLATION_THRESHOLD
} from '../lib/streetPressure';
import { factionOfMinister, factionCostFactor, policyKindOf } from '../lib/factions';

describe('streetPressure', () => {
  it('weight stays 0 while under threshold', () => {
    let s = defaultStreet();
    s = tickStreetPressure(s, INFLATION_THRESHOLD - 1, 5);
    s = tickStreetPressure(s, INFLATION_THRESHOLD - 1, 5);
    expect(s.streetWeight).toBe(0);
    expect(s.inflationMonthsHigh).toBe(0);
  });

  it('ignites after sustained high inflation', () => {
    let s = defaultStreet();
    s = tickStreetPressure(s, 40, 5);
    s = tickStreetPressure(s, 40, 5);
    expect(s.inflationMonthsHigh).toBe(2);
    expect(s.streetWeight).toBeGreaterThan(0);
  });

  it('clears when inflation falls', () => {
    let s = defaultStreet();
    s = tickStreetPressure(s, 40, 5);
    s = tickStreetPressure(s, 40, 5);
    s = tickStreetPressure(s, 10, 5);
    expect(s.inflationMonthsHigh).toBe(0);
  });

  it('drip only when weight >= 4', () => {
    expect(streetDrip(0).happiness).toBe(0);
    expect(streetDrip(4).happiness).toBeLessThan(0);
  });
});

describe('factions', () => {
  it('classifies liberal vs sindical', () => {
    expect(
      factionOfMinister({ id: 'eco_liberal', title: 'La liberal', party: 'oficialismo' })
    ).toBe('liberal');
    expect(
      factionOfMinister({ id: 'eco_sindical', title: 'El sindical', party: 'aliado' })
    ).toBe('sindical');
    expect(
      factionOfMinister({ id: 'x', title: 'Opositor', party: 'oposicion' })
    ).toBe('oposicion');
  });

  it('gasto cheaper for sindical, ajuste cheaper for liberal', () => {
    const gastoSind = factionCostFactor(['sindical'], 'gasto');
    const gastoLib = factionCostFactor(['liberal'], 'gasto');
    expect(gastoSind).toBeLessThan(gastoLib);
    const ajLib = factionCostFactor(['liberal'], 'ajuste');
    const ajSind = factionCostFactor(['sindical'], 'ajuste');
    expect(ajLib).toBeLessThan(ajSind);
  });

  it('detects policy kind from decision id', () => {
    expect(policyKindOf('obra_publica')).toBe('gasto');
    expect(policyKindOf('ajuste_fiscal')).toBe('ajuste');
  });
});
