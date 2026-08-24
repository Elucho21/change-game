import { describe, expect, it } from 'vitest';
import {
  applyGroupEffects, classCompositionFromCountry, computeClassComposition, defaultPopularGroups,
  GROUP_KEYS, mediaCapitalEffect, notableGroupSwing, tickPopularGroups, type GroupsTickInput
} from '../lib/popularGroups';
import data from '../lib/data/countries.gen.json';
import type { Country } from '../lib/types';

const RAW = data as unknown as { countries: Record<string, Country> };

const baseInput: GroupsTickInput = {
  inflation: 8,
  inflationTrend: 0,
  unemployment: 7,
  taxAvg: 25,
  taxCorporate: 25,
  fiscalBalance: 0,
  gdpGrowth: 2,
  corruption: 20,
  unionPower: 0,
  happiness: 55
};

describe('popularidad por sector (5 grupos)', () => {
  it('empresarios responde mas a la inflacion que la clase obrera', () => {
    const bajo = tickPopularGroups(defaultPopularGroups(), { ...baseInput, inflation: 5, inflationTrend: 4 });
    const alto = tickPopularGroups(defaultPopularGroups(), { ...baseInput, inflation: 60, inflationTrend: -4 });
    const deltaEmpresarios = bajo.empresarios - alto.empresarios;
    const deltaObrera = bajo.obrera - alto.obrera;
    expect(deltaEmpresarios).toBeGreaterThan(0);
    expect(deltaEmpresarios).toBeGreaterThan(deltaObrera);
  });

  it('la clase obrera responde mas al desempleo que los empresarios', () => {
    const bajo = tickPopularGroups(defaultPopularGroups(), { ...baseInput, unemployment: 4 });
    const alto = tickPopularGroups(defaultPopularGroups(), { ...baseInput, unemployment: 25 });
    const deltaObrera = bajo.obrera - alto.obrera;
    const deltaEmpresarios = bajo.empresarios - alto.empresarios;
    expect(deltaObrera).toBeGreaterThan(0);
    expect(deltaObrera).toBeGreaterThan(deltaEmpresarios);
  });

  it('el sindicalismo (unionPower) sube a la clase obrera', () => {
    const sinSindicato = tickPopularGroups(defaultPopularGroups(), { ...baseInput, unionPower: 0 });
    const conSindicato = tickPopularGroups(defaultPopularGroups(), { ...baseInput, unionPower: 3 });
    expect(conSindicato.obrera).toBeGreaterThan(sinSindicato.obrera);
  });

  it('clase media odia la corrupcion, el desempleo y la inflacion a la vez', () => {
    const limpio = tickPopularGroups(defaultPopularGroups(), { ...baseInput, corruption: 5, unemployment: 5, inflation: 5 });
    const sucio = tickPopularGroups(defaultPopularGroups(), { ...baseInput, corruption: 90, unemployment: 20, inflation: 60 });
    expect(limpio.claseMedia).toBeGreaterThan(sucio.claseMedia);
  });

  it('clase alta sube con crecimiento y desregulacion, cae fuerte con impuesto corporativo', () => {
    const bajoImpuesto = tickPopularGroups(
      { ...defaultPopularGroups(), deregulationIndex: 70 }, { ...baseInput, taxCorporate: 15, gdpGrowth: 4 }
    );
    const altoImpuesto = tickPopularGroups(
      { ...defaultPopularGroups(), deregulationIndex: 70 }, { ...baseInput, taxCorporate: 55, gdpGrowth: 4 }
    );
    expect(bajoImpuesto.alta).toBeGreaterThan(altoImpuesto.alta);
  });

  it('fieles se mueve menos que los otros 4 grupos ante el mismo shock, y nunca baja de 35', () => {
    const shock: GroupsTickInput = { ...baseInput, inflation: 80, unemployment: 25, corruption: 95, happiness: 10 };
    const prev = defaultPopularGroups();
    const next = tickPopularGroups(prev, shock);
    const deltaFieles = Math.abs(next.fieles - prev.fieles);
    for (const key of GROUP_KEYS) {
      if (key === 'fieles') continue;
      expect(deltaFieles).toBeLessThanOrEqual(Math.abs(next[key] - prev[key]));
    }
    // aunque el shock sea muy negativo durante muchos turnos, no perfora el piso
    let s = { ...prev, fieles: 35 };
    for (let i = 0; i < 24; i++) s = tickPopularGroups(s, { ...shock, happiness: 0 });
    expect(s.fieles).toBeGreaterThanOrEqual(35);
  });

  it('deregulationIndex decae solo hacia 50 si nadie lo mueve', () => {
    let s = { ...defaultPopularGroups(), deregulationIndex: 90 };
    for (let i = 0; i < 30; i++) s = tickPopularGroups(s, baseInput);
    expect(s.deregulationIndex).toBeLessThan(90);
    expect(s.deregulationIndex).toBeGreaterThanOrEqual(50);
  });

  it('applyGroupEffects suma y clampea, sin perforar el piso de fieles', () => {
    const s = applyGroupEffects(defaultPopularGroups(), { empresarios: 10, fieles: -50 });
    expect(s.empresarios).toBe(60);
    expect(s.fieles).toBeGreaterThanOrEqual(35);
  });

  it('mediaCapitalEffect es monotono: alta contenta suma, alta enojada resta', () => {
    expect(mediaCapitalEffect(80)).toBeGreaterThan(0);
    expect(mediaCapitalEffect(60)).toBeGreaterThan(0);
    expect(mediaCapitalEffect(50)).toBe(0);
    expect(mediaCapitalEffect(30)).toBeLessThan(0);
    expect(mediaCapitalEffect(10)).toBeLessThan(0);
    expect(mediaCapitalEffect(80)).toBeGreaterThan(mediaCapitalEffect(60));
    expect(mediaCapitalEffect(10)).toBeLessThan(mediaCapitalEffect(30));
  });

  it('notableGroupSwing solo devuelve el grupo con mayor cambio si supera el umbral', () => {
    const prev = defaultPopularGroups();
    const casiIgual = { ...prev, empresarios: prev.empresarios + 1 };
    expect(notableGroupSwing(prev, casiIgual)).toBeNull();

    const cambioGrande = { ...prev, empresarios: prev.empresarios + 8, obrera: prev.obrera + 2 };
    const swing = notableGroupSwing(prev, cambioGrande);
    expect(swing?.group).toBe('empresarios');
    expect(swing?.delta).toBeCloseTo(8);
  });
});

describe('composicion de clase por pais', () => {
  it('computeClassComposition siempre suma ~100, para todos los paises', () => {
    for (const country of Object.values(RAW.countries)) {
      const comp = computeClassComposition(country);
      const total = comp.empresarios + comp.claseMedia + comp.obrera + comp.alta + comp.fieles;
      expect(total, `${country.code} no suma 100`).toBeGreaterThan(99);
      expect(total, `${country.code} no suma 100`).toBeLessThan(101);
      for (const v of Object.values(comp)) expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('classCompositionFromCountry prefiere el dato real si esta cargado', () => {
    const country = Object.values(RAW.countries)[0];
    const withData: Country = {
      ...country,
      classComposition: { empresarios: 10, claseMedia: 40, obrera: 35, alta: 5, fieles: 10 }
    };
    expect(classCompositionFromCountry(withData)).toEqual(withData.classComposition);
    const { classComposition, ...withoutData } = withData;
    void classComposition;
    expect(classCompositionFromCountry(withoutData as Country)).toEqual(computeClassComposition(withoutData as Country));
  });
});
