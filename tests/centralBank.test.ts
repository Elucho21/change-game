import { describe, expect, it } from 'vitest';
import {
  applyRateChange, confidenceLabel, defaultCentralBank, R_NATURAL, RATE_MAX, RATE_MIN,
  rateEconomicEffect, tickCentralBank, type CentralBankTickInput
} from '../lib/centralBank';

const baseInput: CentralBankTickInput = {
  inflation: 8, debtToGdp: 50, goldReservesTonnes: 60, imfStage: 'none'
};

describe('rateEconomicEffect (pura)', () => {
  it('en la tasa neutral, no hace nada', () => {
    const e = rateEconomicEffect(R_NATURAL);
    expect(e.inflation).toBeCloseTo(0);
    expect(e.gdp_growth).toBeCloseTo(0);
  });

  it('tasa contractiva (por encima de la neutral) baja inflacion y crecimiento', () => {
    const e = rateEconomicEffect(R_NATURAL + 10);
    expect(e.inflation).toBeLessThan(0);
    expect(e.gdp_growth).toBeLessThan(0);
  });

  it('tasa expansiva (por debajo de la neutral) sube inflacion y crecimiento', () => {
    const e = rateEconomicEffect(R_NATURAL - 3);
    expect(e.inflation).toBeGreaterThan(0);
    expect(e.gdp_growth).toBeGreaterThan(0);
  });

  it('el efecto queda acotado aunque la tasa sea extrema (nunca domina sobre naturalDrift)', () => {
    const e = rateEconomicEffect(RATE_MAX);
    expect(Math.abs(e.inflation)).toBeLessThanOrEqual(1.8);
    expect(Math.abs(e.gdp_growth)).toBeLessThanOrEqual(0.6);
  });
});

describe('tickCentralBank (puro)', () => {
  it('la confianza converge y nunca sale de [0,100] en un loop largo', () => {
    let s = defaultCentralBank();
    for (let i = 0; i < 60; i++) {
      s = tickCentralBank(s, { ...baseInput, inflation: 90, debtToGdp: 140 });
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('inflacion y deuda altas hunden la confianza; reservas altas la sostienen', () => {
    const s0 = defaultCentralBank();
    const mal = tickCentralBank(s0, { ...baseInput, inflation: 90, debtToGdp: 140, goldReservesTonnes: 0 });
    const bien = tickCentralBank(s0, { ...baseInput, inflation: 3, debtToGdp: 30, goldReservesTonnes: 500 });
    expect(bien.confidence).toBeGreaterThan(mal.confidence);
  });

  it('un programa del FMI le pesa a la confianza', () => {
    const s0 = { ...defaultCentralBank(), confidence: 60 };
    const sinFmi = tickCentralBank(s0, { ...baseInput, imfStage: 'none' });
    const conPrograma = tickCentralBank(s0, { ...baseInput, imfStage: 'program' });
    expect(conPrograma.confidence).toBeLessThan(sinFmi.confidence);
  });

  it('monthsSinceRateChange avanza un mes por tick', () => {
    const s0 = { ...defaultCentralBank(), monthsSinceRateChange: 5 };
    const s1 = tickCentralBank(s0, baseInput);
    expect(s1.monthsSinceRateChange).toBe(6);
  });
});

describe('applyRateChange (puro)', () => {
  it('mueve la tasa y respeta el rango', () => {
    const s0 = defaultCentralBank();
    expect(applyRateChange(s0, 5).rate).toBe(s0.rate + 5);
    expect(applyRateChange(s0, -1000).rate).toBe(RATE_MIN);
    expect(applyRateChange(s0, 1000).rate).toBe(RATE_MAX);
  });

  it('marca el mes del cambio en -1, para que la confianza lo note ese mismo turno', () => {
    const s0 = { ...defaultCentralBank(), monthsSinceRateChange: 20 };
    expect(applyRateChange(s0, 2).monthsSinceRateChange).toBe(-1);
  });
});

describe('confidenceLabel', () => {
  it('etiqueta segun el nivel', () => {
    expect(confidenceLabel(80)).toBe('Alta confianza');
    expect(confidenceLabel(50)).toBe('Confianza normal');
    expect(confidenceLabel(30)).toBe('Confianza baja');
    expect(confidenceLabel(10)).toBe('Desconfianza');
  });
});
