import { describe, expect, it } from 'vitest';
import { capitalComboBonus, capitalRegen, diplomaticCapitalRegen } from '../lib/simulation';
import { defaultPolitics } from '../lib/politics';
import {
  CAPITAL_DIPLOMATICO_START, CAPITAL_ON_MIDTERM_WIN, CAPITAL_ON_WIN, CAPITAL_PASSIVE_BASE,
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
  // El jugador pidio duplicar el capital por ronda: la base paso de 4 a 8.
  // Con 8 y felicidad neutra (60), el pasivo mensual es 8 y en los 100 dias 16.
  it('la base es 8', () => {
    expect(CAPITAL_PASSIVE_BASE).toBe(8);
    expect(capitalRegen(60, 60, false)).toBe(68);
  });

  it('en los 100 dias el pasivo se duplica', () => {
    expect(capitalRegen(60, 60, true)).toBe(76);
  });

  it('la felicidad sigue moviendo el pasivo', () => {
    expect(capitalRegen(50, 80, false)).toBeGreaterThan(capitalRegen(50, 40, false));
  });

  it('ganar da 60 y el medio termino 25', () => {
    expect(CAPITAL_ON_WIN).toBe(60);
    expect(CAPITAL_ON_MIDTERM_WIN).toBe(25);
  });
});

describe('capital diplomatico (pool separado del politico)', () => {
  it('arranca en 25, mas escaso que el politico', () => {
    expect(CAPITAL_DIPLOMATICO_START).toBe(25);
    expect(CAPITAL_DIPLOMATICO_START).toBeLessThan(60);
  });

  it('sube con la cantidad de bloques, acotado a un tope', () => {
    const sinBloques = diplomaticCapitalRegen(25, 0);
    const conBloques = diplomaticCapitalRegen(25, 3);
    const conMuchosBloques = diplomaticCapitalRegen(25, 10);
    expect(conBloques).toBeGreaterThan(sinBloques);
    expect(conMuchosBloques).toBeLessThanOrEqual(diplomaticCapitalRegen(25, 5) + 0.01);
  });

  it('el bonus del canciller y la luna de miel lo potencian', () => {
    const base = diplomaticCapitalRegen(25, 1, 0, false);
    const conCanciller = diplomaticCapitalRegen(25, 1, 0.2, false);
    const conLuna = diplomaticCapitalRegen(25, 1, 0, true);
    expect(conCanciller).toBeGreaterThan(base);
    expect(conLuna).toBeGreaterThan(base);
  });

  it('se mueve independiente del capital politico (0-100 propio)', () => {
    expect(diplomaticCapitalRegen(0, 0)).toBeGreaterThanOrEqual(0);
    expect(diplomaticCapitalRegen(100, 5)).toBeLessThanOrEqual(100);
  });
});

describe('combo capital politico: superavit + inflacion baja + empleo mejorando', () => {
  it('da un bonus solo si se cumplen las tres condiciones', () => {
    expect(capitalComboBonus(1, -1, true)).toBeGreaterThan(0);
    expect(capitalComboBonus(-1, -1, true)).toBe(0); // sin superavit
    expect(capitalComboBonus(1, 2, true)).toBe(0); // inflacion no esta en la banda baja
    expect(capitalComboBonus(1, -1, false)).toBe(0); // desempleo no esta bajando
  });

  it('se apaga en deflacion profunda, para no premiar la trampa', () => {
    expect(capitalComboBonus(1, -3, true)).toBe(0);
  });

  it('el bonus queda entre 0.3 y 0.8, menos que ganar una eleccion', () => {
    const bonus = capitalComboBonus(2, -1.5, true);
    expect(bonus).toBeGreaterThanOrEqual(0.3);
    expect(bonus).toBeLessThanOrEqual(0.8);
    expect(bonus).toBeLessThan(CAPITAL_ON_WIN);
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
