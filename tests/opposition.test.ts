import { describe, expect, it } from 'vitest';
import data from '../lib/data/countries.gen.json';
import { defaultPolitics, driftOpposition } from '../lib/politics';
import type { Country } from '../lib/types';

const RAW = data as unknown as { countries: Record<string, Country> };
const fresh = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const countryWith = (overrides: Partial<Country['economy']> = {}, happiness = 60, stability = 50): Country => {
  const c = fresh(RAW.countries.USA);
  c.economy = { ...c.economy, ...overrides };
  c.population = { ...c.population, happiness, stability };
  delete c.prevHappiness;
  return c;
};

describe('oposicion sensible al esfuerzo real (driftOpposition)', () => {
  it('una tendencia positiva de felicidad baja la oposicion mas que felicidad plana al mismo nivel', () => {
    const politics = defaultPolitics(countryWith(), 1);
    politics.opposition = 45;

    // pais A: felicidad plana en 65 (no cambio de mes a mes)
    const plano = countryWith({}, 65);
    plano.prevHappiness = 65;
    const oppPlano = driftOpposition({ ...politics }, plano);

    // pais B: felicidad tambien en 65, pero VENIA de 55 (mejoro 10 puntos este mes)
    const mejorando = countryWith({}, 65);
    mejorando.prevHappiness = 55;
    const oppMejorando = driftOpposition({ ...politics }, mejorando);

    expect(oppMejorando).toBeLessThan(oppPlano);
  });

  it('una tendencia negativa de felicidad sube la oposicion mas rapido que un nivel plano', () => {
    const politics = defaultPolitics(countryWith(), 1);
    politics.opposition = 45;

    const plano = countryWith({}, 55);
    plano.prevHappiness = 55;
    const oppPlano = driftOpposition({ ...politics }, plano);

    const empeorando = countryWith({}, 55);
    empeorando.prevHappiness = 65;
    const oppEmpeorando = driftOpposition({ ...politics }, empeorando);

    expect(oppEmpeorando).toBeGreaterThan(oppPlano);
  });

  it('mejorar la inflacion sin cruzar el viejo umbral de 25% ya alivia la oposicion', () => {
    const politics = defaultPolitics(countryWith(), 1);
    politics.opposition = 50;

    const inflacionAlta = countryWith({ inflation: 40 });
    const oppAlta = driftOpposition({ ...politics }, inflacionAlta);

    const inflacionMejorada = countryWith({ inflation: 26 }); // sigue > 25, el viejo umbral no se movia
    const oppMejorada = driftOpposition({ ...politics }, inflacionMejorada);

    expect(oppMejorada).toBeLessThan(oppAlta);
  });

  it('la convergencia sigue acotada al 12% del camino por mes (no hay saltos)', () => {
    const politics = defaultPolitics(countryWith(), 1);
    politics.opposition = 90;
    const feliz = countryWith({}, 90); // target bajo, opposition arranca muy arriba
    const next = driftOpposition({ ...politics }, feliz);
    expect(politics.opposition - next).toBeLessThan(15);
  });

  it('deja guardado prevHappiness para que la proxima llamada mida la tendencia real', () => {
    const politics = defaultPolitics(countryWith(), 1);
    const c = countryWith({}, 72);
    expect(c.prevHappiness).toBeUndefined();
    driftOpposition(politics, c);
    expect(c.prevHappiness).toBe(72);
  });
});
