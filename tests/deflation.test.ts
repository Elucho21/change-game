import { describe, expect, it } from 'vitest';
import { deflationReserveGrowth } from '../lib/deflation';

describe('deflacion + reservas pasivas (Change World Game v1.0)', () => {
  it('sin deflacion, las reservas no crecen solas', () => {
    expect(deflationReserveGrowth(3, 10000)).toBe(0);
    expect(deflationReserveGrowth(0, 10000)).toBe(0);
  });

  it('con deflacion, las reservas crecen proporcional a la deflacion y al stock actual', () => {
    const leve = deflationReserveGrowth(-1, 10000);
    const profunda = deflationReserveGrowth(-3, 10000);
    expect(leve).toBeGreaterThan(0);
    expect(profunda).toBeGreaterThan(leve);
  });

  it('a mas reservas de arranque, mas crecimiento pasivo en toneladas', () => {
    const pocas = deflationReserveGrowth(-2, 1000);
    const muchas = deflationReserveGrowth(-2, 50000);
    expect(muchas).toBeGreaterThan(pocas);
  });
});
