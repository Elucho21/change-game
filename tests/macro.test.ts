import { describe, expect, it } from 'vitest';
import data from '../lib/data/countries.gen.json';
import { pensionFromCountry } from '../lib/pension';
import { employmentFromCountry } from '../lib/employment';
import type { Country } from '../lib/types';

const RAW = data as unknown as { meta: { year: number }; countries: Record<string, Country> };
const countries = RAW.countries;
const codes = Object.keys(countries);

describe('base macro 2026', () => {
  it('cubre 76 paises y anio 2026', () => {
    expect(codes).toHaveLength(76);
    expect(RAW.meta.year).toBe(2026);
  });

  it('todos tienen ficha social (jubilacion, pensiones, empleo, militar % PBI)', () => {
    for (const code of codes) {
      const s = countries[code].social;
      expect(s, code).toBeTruthy();
      expect(s!.retirement_age_men, code).toBeGreaterThanOrEqual(55);
      expect(s!.retirement_age_men, code).toBeLessThanOrEqual(70);
      expect(s!.retirement_age_women, code).toBeLessThanOrEqual(s!.retirement_age_men);
      expect(s!.pension_spend_pct_gdp, code).toBeGreaterThanOrEqual(0);
      expect(s!.pension_spend_pct_gdp, code).toBeLessThan(25);
      expect(s!.military_spend_pct_gdp, code).toBeGreaterThanOrEqual(0);
      expect(s!.formal_pct + s!.informal_pct, code).toBeLessThanOrEqual(100);
    }
  });

  it('Argentina 2026: inflacion desinflacion (no 140), superavit, edad 65/60', () => {
    const a = countries.Argentina;
    expect(a.economy.inflation).toBeGreaterThan(15);
    expect(a.economy.inflation).toBeLessThan(45);
    expect(a.economy.fiscal_balance).toBeGreaterThan(0);
    expect(a.social!.retirement_age_men).toBe(65);
    expect(a.social!.retirement_age_women).toBe(60);
    expect(a.social!.informal_pct).toBeGreaterThan(35);
  });

  it('EE.UU.: PBI > 30 T, edad 67, gasto militar ~3% PBI, pensiones ~7%', () => {
    const u = countries.USA;
    expect(u.economy.gdp_trillion_usd).toBeGreaterThan(30);
    expect(u.social!.retirement_age_men).toBe(67);
    expect(u.social!.military_spend_pct_gdp).toBeGreaterThan(2.5);
    expect(u.social!.military_spend_pct_gdp).toBeLessThan(4);
    expect(u.social!.pension_spend_pct_gdp).toBeGreaterThan(6);
    expect(u.social!.pension_spend_pct_gdp).toBeLessThan(9);
  });

  it('Francia e Italia gastan mucho mas en pensiones que EE.UU.', () => {
    expect(countries.France.social!.pension_spend_pct_gdp).toBeGreaterThan(12);
    expect(countries.Italy.social!.pension_spend_pct_gdp).toBeGreaterThan(14);
    expect(countries.France.social!.pension_spend_pct_gdp)
      .toBeGreaterThan(countries.USA.social!.pension_spend_pct_gdp);
  });

  it('Ucrania: gasto militar de guerra (>> 10% PBI)', () => {
    expect(countries.Ukraine.social!.military_spend_pct_gdp).toBeGreaterThan(15);
  });

  it('India: informalidad alta, pensiones publicas chicas', () => {
    expect(countries.India.social!.informal_pct).toBeGreaterThan(70);
    expect(countries.India.social!.pension_spend_pct_gdp).toBeLessThan(3);
  });

  it('el % militar de la ficha coincide con presupuesto / PBI', () => {
    for (const code of ['USA', 'Argentina', 'France', 'Ukraine', 'Japan']) {
      const c = countries[code];
      const pct = c.military.military_budget_bn / (c.economy.gdp_trillion_usd * 10);
      expect(Math.abs(pct - c.social!.military_spend_pct_gdp), code).toBeLessThan(0.05);
    }
  });

  it('la semilla previsional/empleo sigue al pais, no un default global', () => {
    const ar = pensionFromCountry('Argentina');
    const us = pensionFromCountry('USA');
    const fr = pensionFromCountry('France');
    expect(ar.retirementAgeMen).toBe(65);
    expect(ar.retirementAgeWomen).toBe(60);
    expect(us.retirementAgeMen).toBe(67);
    expect(fr.retirementAgeMen).toBe(64);
    expect(employmentFromCountry('Argentina').informalPct).toBe(42);
    expect(employmentFromCountry('USA').formalPct).toBe(86);
    expect(employmentFromCountry('India').informalPct).toBe(80);
  });
});
