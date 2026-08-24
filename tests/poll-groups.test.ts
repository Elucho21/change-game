import { describe, expect, it } from 'vitest';
import { defaultPolitics, poll } from '../lib/politics';
import { defaultPopularGroups } from '../lib/popularGroups';
import data from '../lib/data/countries.gen.json';
import type { Country } from '../lib/types';

const RAW = data as unknown as { countries: Record<string, Country> };

describe('poll() con popularidad por sector (v1.2)', () => {
  it('sin `groups`, la formula queda identica a la de siempre (compatibilidad hacia atras)', () => {
    const country = RAW.countries.Argentina;
    const politics = defaultPolitics(country, 1);
    const conFormulaVieja = poll(country, politics, 60);
    // felicidad-only, sin el quinto argumento: mismo resultado que antes de v1.2
    const legacyVote = poll(country, politics, 60, 0);
    expect(conFormulaVieja).toBe(legacyVote);
  });

  it('con `groups`, un swing en un grupo cambia el resultado', () => {
    const country = RAW.countries.Argentina;
    const politics = defaultPolitics(country, 1);
    const neutro = poll(country, politics, 60, 0, defaultPopularGroups());
    const empresariosFelices = poll(
      country, politics, 60, 0, { ...defaultPopularGroups(), empresarios: 90 }
    );
    expect(empresariosFelices).not.toBe(neutro);
  });

  it('un swing en clase media mueve poll() mas que el mismo swing en clase alta (peso electoral distinto)', () => {
    const country = RAW.countries.Argentina;
    const politics = defaultPolitics(country, 1);
    const base = defaultPopularGroups();
    const votoBase = poll(country, politics, 60, 0, base);
    const conClaseMediaAlta = poll(country, politics, 60, 0, { ...base, claseMedia: 90 });
    const conClaseAltaAlta = poll(country, politics, 60, 0, { ...base, alta: 90 });
    const deltaClaseMedia = Math.abs(conClaseMediaAlta - votoBase);
    const deltaClaseAlta = Math.abs(conClaseAltaAlta - votoBase);
    expect(deltaClaseMedia).toBeGreaterThan(deltaClaseAlta);
  });
});
