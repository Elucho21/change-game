import { describe, expect, it } from 'vitest';
import {
  applyMoralEffects, comisionIntegrityEffective, defaultMoral, levelOf, MINORITY_CAPS,
  tickMoral, CORRUPTION_LEVELS, type MoralTickInput
} from '../lib/moral';
import { defaultPolitics } from '../lib/politics';
import { defaultPopularGroups, GROUP_KEYS } from '../lib/popularGroups';
import data from '../lib/data/countries.gen.json';
import type { Country } from '../lib/types';

const RAW = data as unknown as { countries: Record<string, Country> };

const baseInput: MoralTickInput = {
  happiness: 60,
  unemployment: 7,
  hasMajority: false,
  strongMajority: false,
  comisionIntegrity: 50,
  groups: defaultPopularGroups()
};

describe('sistema moral (corrupcion, investigacion, lideres minoritarios)', () => {
  it('la corrupcion decae sola cuando el pueblo esta contento', () => {
    const s0 = defaultMoral();
    const r = tickMoral(s0, { ...baseInput, happiness: 70 });
    expect(r.state.corruption).toBeLessThan(s0.corruption);
  });

  it('la corrupcion sube de a poco cuando el pueblo esta descontento y no hay actos nuevos', () => {
    const s0 = defaultMoral();
    const r = tickMoral(s0, { ...baseInput, happiness: 30 });
    expect(r.state.corruption).toBeGreaterThan(s0.corruption);
  });

  it('investigacion sube mas rapido con mas corrupcion, a igualdad de todo lo demas', () => {
    const limpio = { ...defaultMoral(), corruption: 10 };
    const corrupto = { ...defaultMoral(), corruption: 70 };
    const rLimpio = tickMoral(limpio, baseInput);
    const rCorrupto = tickMoral(corrupto, baseInput);
    expect(rCorrupto.state.investigacion).toBeGreaterThan(rLimpio.state.investigacion);
  });

  it('mayoria parlamentaria frena el avance de las investigaciones', () => {
    const s0 = { ...defaultMoral(), corruption: 50 };
    const sinMayoria = tickMoral(s0, { ...baseInput, hasMajority: false });
    const conMayoria = tickMoral(s0, { ...baseInput, hasMajority: true, strongMajority: true });
    expect(conMayoria.state.investigacion).toBeLessThan(sinMayoria.state.investigacion);
  });

  it('los favores activos frenan la investigacion pero decaen solos mes a mes', () => {
    const s0 = { ...defaultMoral(), corruption: 50, favoresActivos: 20 };
    const r = tickMoral(s0, baseInput);
    expect(r.state.favoresActivos).toBeLessThan(20);
    expect(r.state.favoresActivos).toBeGreaterThanOrEqual(0);
  });

  it('la corrupcion muy alta resta felicidad (consecuencia mecanica del nivel)', () => {
    const limpio = tickMoral({ ...defaultMoral(), corruption: 10 }, baseInput);
    const podrido = tickMoral({ ...defaultMoral(), corruption: 85 }, baseInput);
    expect(podrido.happinessDelta).toBeLessThan(limpio.happinessDelta);
    expect(podrido.happinessDelta).toBeLessThan(0);
  });

  describe('lideres minoritarios: convergen hacia un target pero nunca superan su techo', () => {
    it('Gustavo Comun no supera 8% ni con desempleo altisimo sostenido', () => {
      let s = defaultMoral();
      for (let i = 0; i < 60; i++) {
        s = tickMoral(s, { ...baseInput, unemployment: 25, happiness: 20 }).state;
      }
      expect(s.gustavoApoyo).toBeLessThanOrEqual(MINORITY_CAPS.gustavo);
    });

    it('Amalia Verde no supera 5% ni con el indice ambiental hundido', () => {
      let s = { ...defaultMoral(), environmentIndex: 0, corruption: 90 };
      for (let i = 0; i < 60; i++) {
        s = tickMoral(s, baseInput).state;
      }
      expect(s.amaliaApoyo).toBeLessThanOrEqual(MINORITY_CAPS.amalia);
    });

    it('Jhon el Duro no supera 9% ni con inseguridad altisima', () => {
      let s = { ...defaultMoral(), securityIndex: 100, corruption: 90 };
      for (let i = 0; i < 60; i++) {
        s = tickMoral(s, baseInput).state;
      }
      expect(s.jhonApoyo).toBeLessThanOrEqual(MINORITY_CAPS.jhon);
    });

    it('desempleo bajo y felicidad alta hacen que Gustavo converja cerca de su piso', () => {
      let s = { ...defaultMoral(), gustavoApoyo: 8 };
      for (let i = 0; i < 24; i++) {
        s = tickMoral(s, { ...baseInput, unemployment: 4, happiness: 80 }).state;
      }
      expect(s.gustavoApoyo).toBeLessThan(2);
    });

    it('Gustavo responde al humor del grupo obrero, independiente del desempleo (v1.2)', () => {
      const obreraContenta = tickMoral(defaultMoral(), {
        ...baseInput, groups: { ...defaultPopularGroups(), obrera: 80 }
      });
      const obreraEnojada = tickMoral(defaultMoral(), {
        ...baseInput, groups: { ...defaultPopularGroups(), obrera: 15 }
      });
      expect(obreraEnojada.state.gustavoApoyo).toBeGreaterThan(obreraContenta.state.gustavoApoyo);
    });

    it('Jhon responde a la clase media descontenta, ademas de seguridad/corrupcion (v1.2)', () => {
      const base = { ...defaultMoral(), securityIndex: 50, corruption: 40 };
      const claseMediaContenta = tickMoral(base, {
        ...baseInput, groups: { ...defaultPopularGroups(), claseMedia: 80 }
      });
      const claseMediaEnojada = tickMoral(base, {
        ...baseInput, groups: { ...defaultPopularGroups(), claseMedia: 15 }
      });
      expect(claseMediaEnojada.state.jhonApoyo).toBeGreaterThan(claseMediaContenta.state.jhonApoyo);
    });

    it('Amalia no se mueve por ningun grupo de popularidad por sector (decision explicita de diseno)', () => {
      const base = { ...defaultMoral(), environmentIndex: 40, corruption: 40 };
      const conGruposNeutros = tickMoral(base, { ...baseInput, groups: defaultPopularGroups() }).state.amaliaApoyo;
      for (const key of GROUP_KEYS) {
        const grupos = { ...defaultPopularGroups(), [key]: 5 };
        const r = tickMoral(base, { ...baseInput, groups: grupos });
        expect(r.state.amaliaApoyo).toBeCloseTo(conGruposNeutros);
      }
    });
  });

  it('applyMoralEffects respeta los techos de los lideres minoritarios', () => {
    const s0 = defaultMoral();
    const r = applyMoralEffects(s0, { gustavoApoyo: 999, amaliaApoyo: 999, jhonApoyo: 999 });
    expect(r.gustavoApoyo).toBe(MINORITY_CAPS.gustavo);
    expect(r.amaliaApoyo).toBe(MINORITY_CAPS.amalia);
    expect(r.jhonApoyo).toBe(MINORITY_CAPS.jhon);
  });

  it('applyMoralEffects mueve corrupcion e investigacion sin tocar lo que no se pide', () => {
    const s0 = defaultMoral();
    const r = applyMoralEffects(s0, { corruption: 12, investigacion: -8 });
    expect(r.corruption).toBe(s0.corruption + 12);
    expect(r.investigacion).toBe(0); // clamp a 0, no puede quedar negativo
    expect(r.corteIntegrity).toBe(s0.corteIntegrity);
  });

  it('levelOf devuelve el nivel correcto de corrupcion en cada tramo', () => {
    expect(levelOf(5, CORRUPTION_LEVELS).label).toBe('Limpio');
    expect(levelOf(20, CORRUPTION_LEVELS).label).toBe('Manchas menores');
    expect(levelOf(40, CORRUPTION_LEVELS).label).toBe('Corrupcion estructural');
    expect(levelOf(60, CORRUPTION_LEVELS).label).toBe('Sistema capturado');
    expect(levelOf(90, CORRUPTION_LEVELS).label).toBe('Putrefaccion');
  });

  it('comisionIntegrityEffective nunca llega a 0 aunque la mayoria sea total', () => {
    const politics = defaultPolitics(RAW.countries.USA, 1);
    const value = comisionIntegrityEffective({ ...politics, seats: 100 }, 20);
    expect(value).toBeGreaterThanOrEqual(20);
  });

  describe('sanity a 48 turnos (una partida entera)', () => {
    it('un jugador limpio se mantiene lejos de la crisis institucional', () => {
      let s = { ...defaultMoral(), corruption: 12 };
      for (let i = 0; i < 48; i++) {
        s = tickMoral(s, { ...baseInput, happiness: 68, hasMajority: true }).state;
      }
      expect(s.investigacion).toBeLessThan(46);
    });

    it('un jugador que se mantiene corrupto sin usar cartas de Enrique escala de verdad', () => {
      let s = { ...defaultMoral(), corruption: 70 };
      for (let i = 0; i < 48; i++) {
        s = tickMoral(s, { ...baseInput, happiness: 45, hasMajority: false }).state;
      }
      expect(s.investigacion).toBeGreaterThan(46);
    });
  });
});
