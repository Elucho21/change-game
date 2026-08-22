import { describe, expect, it } from 'vitest';
import data from '../lib/data/countries.gen.json';
import { BLOCS } from '../lib/blocs';
import { DECISIONS } from '../lib/decisions';
import { ratesOf } from '../lib/engine';
import { NATIONAL_EVENTS } from '../lib/events/national';
import { applyFx, fxPressure, FX_START, DEVALUE_JUMP } from '../lib/fx';
import { computeImfWeight, defaultImf, tickImf, DEBT_MISSION, DEBT_PROGRAM } from '../lib/imf';
import { applyDecisionTo, deterministicTick, type SimState } from '../lib/simulation';
import { tradeBaseline, type TradeContext } from '../lib/trade';
import type { Country, GlobalState } from '../lib/types';

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

const RAW = data as unknown as {
  countries: Record<string, Country>;
  relations: Record<string, number>;
  global: GlobalState;
};

function simFor(playerCode: string): SimState {
  const countries = JSON.parse(JSON.stringify(RAW.countries)) as Record<string, Country>;
  const relations = JSON.parse(JSON.stringify(RAW.relations)) as Record<string, number>;
  const blocs = JSON.parse(JSON.stringify(BLOCS));
  countries[playerCode].fx = FX_START;
  const base: SimState = {
    turn: 1,
    playerCode,
    countries,
    relations,
    blocs,
    world: JSON.parse(JSON.stringify(RAW.global)) as GlobalState,
    capital: 60,
    sanctions: [],
    disruptions: {},
    tradeBase: {},
    active: [],
    taxBase: Object.fromEntries(Object.values(countries).map((c) => [c.code, ratesOf(c)])),
    imf: defaultImf()
  };
  const ctx: TradeContext = {
    countries, relations, blocs, sanctions: [], playerCode, disruptions: {}, turn: 1
  };
  base.tradeBase = tradeBaseline(ctx);
  return base;
}

describe('tick wiring', () => {
  it('high debt moves IMF toward mission and depreciates FX', () => {
    const s = simFor('Argentina');
    s.countries.Argentina.economy.debt_to_gdp = 95;
    s.countries.Argentina.economy.fiscal_balance = -4;
    let cur = s;
    for (let i = 0; i < 4; i++) {
      cur = deterministicTick(cur).state;
    }
    expect(cur.imf).toBeTruthy();
    expect(cur.imf!.weight).toBeGreaterThanOrEqual(5);
    expect(['mission', 'program']).toContain(cur.imf!.stage);
    expect(cur.countries.Argentina.fx ?? 0).toBeGreaterThan(FX_START);
  });

  it('devaluar jumps the FX index in applyDecisionTo', () => {
    const s = simFor('Argentina');
    const dec = DECISIONS.find((d) => d.id === 'devaluar');
    expect(dec).toBeTruthy();
    applyDecisionTo(s, dec!);
    expect(s.countries.Argentina.fx ?? 0).toBeGreaterThan(FX_START);
  });

  it('fmi_watch and fmi key off EventContext.imf', () => {
    const watch = NATIONAL_EVENTS.find((e) => e.id === 'fmi_watch');
    const fmi = NATIONAL_EVENTS.find((e) => e.id === 'fmi');
    expect(watch?.when).toBeTruthy();
    expect(fmi?.when).toBeTruthy();

    const player = RAW.countries.Argentina;
    const base = {
      player,
      world: RAW.global,
      turn: 1,
      blocs: BLOCS,
      relationOf: () => 0,
      memberOf: () => false
    };

    expect(watch!.when!({ ...base, imf: { stage: 'watch', weight: 3, monthsRising: 0 } })).toBe(true);
    expect(watch!.when!({ ...base, imf: { stage: 'none', weight: 0, monthsRising: 0 } })).toBe(false);
    expect(fmi!.when!({ ...base, imf: { stage: 'mission', weight: 6, monthsRising: 2 } })).toBe(true);
    expect(fmi!.when!({ ...base, imf: { stage: 'watch', weight: 3, monthsRising: 0 } })).toBe(false);
  });
});
