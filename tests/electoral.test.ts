import { describe, expect, it } from 'vitest';
import { capitalRegen } from '../lib/simulation';
import { defaultPolitics } from '../lib/politics';
import {
  CAPITAL_ON_MIDTERM_WIN, CAPITAL_ON_WIN, CAPITAL_PASSIVE_BASE,
  decideRound, popularToElectors, systemOf
} from '../lib/electoral';
import type { Country } from '../lib/types';

const stub = (code: string, extra: Partial<Country> = {}): Country =>
  ({
    code,
    iso: 'XXX',
    name: code,
    flag: '',
    region: '',
    capital: '',
    lat: 0,
    lng: 0,
    playable: true,
    economy: {
      gdp_trillion_usd: 1, gdp_growth: 2, unemployment: 6, inflation: 3,
      gold_reserves_tonnes: 0, debt_to_gdp: 50, fiscal_balance: -2,
      tax_iva: 21, tax_corporate: 25, tax_income_avg: 20
    },
    population: {
      total_millions: 10, male_pct: 50, female_pct: 50, unemployed_millions: 0.6,
      minorities: {}, happiness: 60, stability: 70
    },
    military: {
      active_soldiers: 1, reserves: 1, aircraft: 1, submarines: 0,
      nuclear_warheads: 0, tanks: 1, naval_ships: 1, military_budget_bn: 1
    },
    sectors: { industry: 20, agriculture: 5, services: 60, commerce: 10, tourism: 5 },
    traits: {
      ideology: 'liberal_democracy', aggression: 0.2, risk_tolerance: 0.3,
      nuclear_doctrine: 'none', priorities: []
    },
    ...extra
  }) as Country;

describe('capital pasivo y luna de miel', () => {
  it('la base es 4, no 6', () => {
    expect(CAPITAL_PASSIVE_BASE).toBe(4);
    expect(capitalRegen(60, 60, false)).toBe(64);
  });

  it('en los 100 dias el pasivo se duplica', () => {
    expect(capitalRegen(60, 60, true)).toBe(68);
  });

  it('ganar da 60 y el medio termino 25', () => {
    expect(CAPITAL_ON_WIN).toBe(60);
    expect(CAPITAL_ON_MIDTERM_WIN).toBe(25);
  });
});

describe('sistemas electorales', () => {
  it('Argentina: 4 anios, reeleccion, ballotage 45 o 40+10, medio termino', () => {
    const s = systemOf('Argentina');
    expect(s.termMonths).toBe(48);
    expect(s.maxConsecutive).toBe(2);
    expect(s.midtermMonths).toBe(24);
    expect(s.win).toBe('ballotage_ar');
    expect(decideRound(s, 46).won).toBe(true);
    expect(decideRound(s, 46).ballotage).toBe(false);
    expect(decideRound(s, 42).ballotage).toBe(true);
    expect(decideRound(s, 28).won).toBe(false);
    expect(decideRound(s, 28).ballotage).toBe(false);
  });

  it('Uruguay: 5 anios, sin reeleccion inmediata, 50% o ballotage', () => {
    const s = systemOf('Uruguay');
    expect(s.termMonths).toBe(60);
    expect(s.maxConsecutive).toBe(1);
    expect(s.midtermMonths).toBe(0);
    expect(decideRound(s, 51).won).toBe(true);
    expect(decideRound(s, 44).ballotage).toBe(true);
    const p = defaultPolitics(stub('Uruguay'), 1);
    expect(p.termLength).toBe(60);
    expect(p.maxConsecutive).toBe(1);
    expect(p.honeymoonUntil).toBe(5);
  });

  it('EE.UU.: colegio de 270, medio termino a los 2 anios', () => {
    const s = systemOf('USA');
    expect(s.win).toBe('electoral_college');
    expect(s.midtermMonths).toBe(24);
    expect(s.maxConsecutive).toBe(2);
    expect(popularToElectors(50)).toBe(270);
    expect(decideRound(s, 52).won).toBe(true);
    expect(decideRound(s, 52).electors).toBeGreaterThanOrEqual(270);
    expect(decideRound(s, 45).won).toBe(false);
  });
});
