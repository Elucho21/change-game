import { describe, expect, it } from 'vitest';
import { naturalDrift, ratesOf, type TaxRates } from '../lib/engine';
import { interestBurden } from '../lib/centralBank';
import { sectoralEmploymentIntensity } from '../lib/employment_sectors';
import { tickEmployment, defaultEmployment } from '../lib/employment';
import data from '../lib/data/countries.gen.json';
import type { Country, GlobalState } from '../lib/types';

/**
 * Diagnostico D4 del plan: la economia se auto-curaba sola en ~6 meses
 * porque nada tenia memoria (inflacion decae siempre, deuda no cuesta nada,
 * el crecimiento converge a 2% mirando solo el mes actual, y el jugador
 * tenia dos motores de desempleo pisandose). Estos tests fijan los 5 canales
 * nuevos y confirman que la economia sigue siendo estable en el horizonte
 * largo (mismo guardia que ya existia en tests/engine.test.ts).
 */

const RAW = data as unknown as { countries: Record<string, Country>; global: GlobalState };
const fresh = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function country(code: string): Country {
  return fresh(RAW.countries[code]);
}

function world(): GlobalState {
  return fresh(RAW.global);
}

const taxBaseFor = (c: Country): Record<string, TaxRates> => ({ [c.code]: ratesOf(c) });

describe('item #7 - deficit alto + deuda alta empuja inflacion', () => {
  it('un pais con deficit y deuda altos termina con mas inflacion que uno sano, a igualdad del resto', () => {
    const sano = country('Argentina');
    const enCrisis = country('Argentina');
    sano.economy.fiscal_balance = 1;
    sano.economy.debt_to_gdp = 40;
    enCrisis.economy.fiscal_balance = -8;
    enCrisis.economy.debt_to_gdp = 150;

    for (let i = 0; i < 24; i++) {
      naturalDrift({ Argentina: sano }, [], world(), {}, taxBaseFor(sano));
      naturalDrift({ Argentina: enCrisis }, [], world(), {}, taxBaseFor(enCrisis));
    }
    expect(enCrisis.economy.inflation).toBeGreaterThan(sano.economy.inflation);
  });

  it('un deficit chico o puntual no dispara el canal (doble condicion)', () => {
    const c = country('Argentina');
    c.economy.fiscal_balance = -1; // por debajo del umbral (-2)
    c.economy.debt_to_gdp = 150;
    const antes = c.economy.inflation;
    naturalDrift({ Argentina: c }, [], world(), {}, taxBaseFor(c));
    // sin el canal de monetizacion, la inflacion deberia moverse igual que
    // siempre (decae), nunca subir por el deficit
    expect(c.economy.inflation).toBeLessThanOrEqual(antes);
  });
});

describe('item #8 - intereses de deuda', () => {
  it('mas deuda y mas tasa efectiva cobran mas interes, con techo', () => {
    expect(interestBurden(20, 5, 0)).toBeLessThan(interestBurden(150, 5, 0));
    expect(interestBurden(150, 5, 0)).toBeLessThan(interestBurden(150, 5, 18));
    expect(interestBurden(200, 40, 18)).toBeLessThanOrEqual(1); // el techo nunca se rompe
  });

  it('deuda baja y sana cobra casi nada', () => {
    expect(interestBurden(20, 5, 0)).toBeLessThan(0.1);
  });
});

describe('item #10 - memoria de inversion rompe el iman de crecimiento', () => {
  it('un pais con estabilidad hundida converge a un investmentMemory bajo y eso frena el crecimiento', () => {
    const golpeado = country('Argentina');
    golpeado.population.stability = 15;
    const sano = country('Argentina');
    sano.population.stability = 70;

    for (let i = 0; i < 30; i++) {
      naturalDrift({ Argentina: golpeado }, [], world(), {}, taxBaseFor(golpeado));
      naturalDrift({ Argentina: sano }, [], world(), {}, taxBaseFor(sano));
    }
    expect(golpeado.investmentMemory!).toBeLessThan(50);
    expect(sano.investmentMemory!).toBeGreaterThan(50);
    expect(golpeado.investmentMemory!).toBeLessThan(sano.investmentMemory!);
  });

  it('la memoria converge mucho mas lento que la estabilidad que la origina (hysteresis real)', () => {
    const c = country('Argentina');
    c.population.stability = 10;
    naturalDrift({ Argentina: c }, [], world(), {}, taxBaseFor(c));
    // estabilidad ya reacciona rapido (converge sobre si misma cada mes);
    // investmentMemory, recien arrancando de 50, todavia esta cerca de 50
    expect(Math.abs(c.investmentMemory! - 50)).toBeLessThan(3);
  });
});

describe('item #11 - un solo motor de desempleo para el jugador', () => {
  it('naturalDrift no toca el desempleo del jugador, si lo toca el de otros paises', () => {
    const countries = { Argentina: country('Argentina'), Brasil: country('Brazil') };
    countries.Argentina.economy.gdp_growth = 8; // shock de crecimiento fuerte
    countries.Brasil.economy.gdp_growth = 8;
    const antesAR = countries.Argentina.economy.unemployment;
    const antesBR = countries.Brasil.economy.unemployment;

    naturalDrift(countries, [], world(), {}, {}, 'Argentina');

    expect(countries.Argentina.economy.unemployment).toBe(antesAR);
    expect(countries.Brasil.economy.unemployment).not.toBe(antesBR);
  });

  it('sin playerCode (compatibilidad), el desempleo se mueve para todos como antes', () => {
    const countries = { Argentina: country('Argentina') };
    countries.Argentina.economy.gdp_growth = 8;
    const antes = countries.Argentina.economy.unemployment;
    naturalDrift(countries, [], world(), {}, {});
    expect(countries.Argentina.economy.unemployment).not.toBe(antes);
  });
});

describe('item #12 - empleo pesado por sector', () => {
  it('sectoralEmploymentIntensity: turismo puro pesa mas que agro puro', () => {
    const turismo = sectoralEmploymentIntensity({ tourism: 100 });
    const agro = sectoralEmploymentIntensity({ agriculture: 100 });
    expect(turismo).toBeGreaterThan(agro);
    expect(turismo).toBeCloseTo(1.55, 2);
    expect(agro).toBeCloseTo(0.85, 2);
  });

  it('sin sectores, cae a 1 (neutral) en vez de romper', () => {
    expect(sectoralEmploymentIntensity({})).toBe(1);
  });

  it('el mismo shock de crecimiento baja mas el desempleo en un pais turistico que en uno minero (naturalDrift, AI)', () => {
    const turistico = country('Argentina');
    turistico.sectors = { tourism: 100 };
    turistico.economy.gdp_growth = 6;
    const minero = country('Argentina');
    minero.sectors = { agriculture: 100 };
    minero.economy.gdp_growth = 6;

    naturalDrift({ X: turistico }, [], world(), {}, taxBaseFor(turistico));
    naturalDrift({ X: minero }, [], world(), {}, taxBaseFor(minero));

    const caidaTuristica = RAW.countries.Argentina.economy.unemployment - turistico.economy.unemployment;
    const caidaMinera = RAW.countries.Argentina.economy.unemployment - minero.economy.unemployment;
    expect(caidaTuristica).toBeGreaterThan(caidaMinera);
  });

  it('el mismo gdp_growth genera mas empleo formal para el jugador en un pais turistico (tickEmployment)', () => {
    const input = {
      gdpGrowth: 6, contribTotalDeltaPp: 0, coverageDeltaPp: 0, retirementAgeDeltaYears: 0, inflation: 5
    };
    const turistico = tickEmployment(defaultEmployment(), { ...input, sectorIntensity: 1.55 });
    const minero = tickEmployment(defaultEmployment(), { ...input, sectorIntensity: 0.35 });
    expect(turistico.state.formalPct).toBeGreaterThan(minero.state.formalPct);
  });
});

describe('estabilidad de largo plazo (60 turnos, varios paises)', () => {
  const CODES = ['Argentina', 'USA', 'Nigeria', 'Japan', 'Ukraine'];

  it.each(CODES)('%s no rompe la economia en 60 turnos con el modelo nuevo', (code) => {
    const c = country(code);
    const w = world();
    for (let i = 0; i < 60; i++) {
      naturalDrift({ [code]: c }, [], w, {}, taxBaseFor(c), code);
    }
    expect(Number.isFinite(c.economy.inflation)).toBe(true);
    expect(Number.isFinite(c.economy.gdp_growth)).toBe(true);
    expect(Number.isFinite(c.economy.debt_to_gdp)).toBe(true);
    expect(Number.isFinite(c.investmentMemory)).toBe(true);
    expect(c.investmentMemory).toBeGreaterThanOrEqual(0);
    expect(c.investmentMemory).toBeLessThanOrEqual(100);
    expect(c.population.happiness).toBeGreaterThanOrEqual(0);
    expect(c.population.happiness).toBeLessThanOrEqual(100);
  });

  it('un pais castigado a proposito (deficit+deuda+inestabilidad) sigue siendo finito y jugable en 60 turnos', () => {
    const c = country('Argentina');
    c.economy.fiscal_balance = -8;
    c.economy.debt_to_gdp = 160;
    c.population.stability = 15;
    const w = world();
    for (let i = 0; i < 60; i++) {
      naturalDrift({ Argentina: c }, [], w, {}, taxBaseFor(c), 'Argentina');
    }
    expect(Number.isFinite(c.economy.inflation)).toBe(true);
    expect(Number.isFinite(c.economy.gdp_growth)).toBe(true);
    expect(c.population.happiness).toBeGreaterThanOrEqual(0);
  });
});
