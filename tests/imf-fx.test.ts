import { describe, expect, it } from 'vitest';
import { computeImfWeight, defaultImf, tickImf, DEBT_MISSION, DEBT_PROGRAM } from '../lib/imf';
import { applyFx, fxPressure, FX_START, DEVALUE_JUMP } from '../lib/fx';

describe('IMF thresholds', () => {
  it('weight is zero below watch band', () => {
    expect(computeImfWeight(40, 0, 0, 'none')).toBe(0);
  });

  it('weight rises with debt band', () => {
    const low = computeImfWeight(65, 0, 0, 'watch');
    const mid = computeImfWeight(95, 0, 0, 'mission');
    const high = computeImfWeight(120, 0, 0, 'program');
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
  });

  it('surplus lowers weight; deficit raises it', () => {
    const withSurplus = computeImfWeight(95, 1, 0, 'mission');
    const withDeficit = computeImfWeight(95, -5, 0, 'mission');
    expect(withDeficit).toBeGreaterThan(withSurplus);
  });

  it('rising debt pushes toward mission', () => {
    let s = defaultImf();
    for (let i = 0; i < 4; i++) {
      s = tickImf(s, {
        debt: 80 + i * 0.5,
        prevDebt: 80 + (i - 1) * 0.5,
        fiscal: -2,
        turn: i + 1
      });
    }
    expect(s.monthsRising).toBeGreaterThanOrEqual(3);
    expect(['mission', 'program']).toContain(s.stage);
  });

  it('program exit after condition streak', () => {
    let s = defaultImf();
    s = { ...s, stage: 'program', conditionStreak: 0 };
    for (let i = 0; i < 3; i++) {
      s = tickImf(s, {
        debt: DEBT_PROGRAM + 5,
        prevDebt: DEBT_PROGRAM + 6,
        fiscal: 0.5,
        turn: 10 + i
      });
    }
    expect(s.stage).toBe('exit');
  });

  it('mission threshold from debt alone', () => {
    const s = tickImf(defaultImf(), {
      debt: DEBT_MISSION + 1,
      prevDebt: DEBT_MISSION + 1,
      fiscal: -1,
      turn: 1
    });
    expect(s.stage).toBe('mission');
    expect(s.weight).toBeGreaterThanOrEqual(5);
  });
});

describe('FX pressure', () => {
  it('starts at 100 and depreciates with inflation and IMF program', () => {
    const p = fxPressure({
      inflation: 40,
      fiscal: -5,
      debt: 120,
      imfStage: 'program',
      monthsRising: 3
    });
    expect(p).toBeGreaterThan(2);
    const next = applyFx(FX_START, p);
    expect(next).toBeGreaterThan(FX_START);
  });

  it('surplus and low inflation can appreciate', () => {
    const p = fxPressure({
      inflation: 2,
      fiscal: 2,
      debt: 40,
      imfStage: 'none',
      monthsRising: 0
    });
    expect(p).toBeLessThan(0);
    const next = applyFx(FX_START, p);
    expect(next).toBeLessThan(FX_START);
  });

  it('devalue jump moves the index up', () => {
    const next = applyFx(FX_START, DEVALUE_JUMP);
    expect(next).toBeGreaterThan(FX_START);
  });
});
