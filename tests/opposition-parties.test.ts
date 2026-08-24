import { describe, expect, it } from 'vitest';
import {
  coalitionPrice, normalizeOppositionParties, parliament, PARTY_MOOD_START, partyCostFactor,
  tickOppositionParties, type OppositionParty, type Politics
} from '../lib/politics';
import { defaultMoral } from '../lib/moral';
import gen from '../lib/data/countries.gen.json';
import { defaultPolitics } from '../lib/politics';
import type { Country } from '../lib/types';

/**
 * El jugador reporto que los partidos minoritarios "no aparecen ni tienen
 * impacto". Ademas de los 3 lideres (ver tests/minority-impact.test.ts), los
 * dos partidos opositores mayores eran hasta v1.3 dos strings sin ideologia,
 * sin escaños propios y con una unica ventana de negociacion en toda la
 * partida. Estos tests fijan el modelo nuevo: ideologia, humor, parlamento
 * derivado y pacto negociable en cualquier momento.
 */

const country = () =>
  JSON.parse(JSON.stringify((gen as { countries: Record<string, Country> }).countries.Argentina)) as Country;

const politicsWith = (over: Partial<Politics> = {}): Politics => ({
  ...defaultPolitics(country(), 1),
  ...over
});

describe('normalizacion de partidos opositores', () => {
  it('acepta la forma vieja (dos strings) y la convierte', () => {
    const [a, b] = normalizeOppositionParties(['Bloque Federal', 'Frente Amplio'], 'Frente de Gobierno');
    expect(a.name).toBe('Bloque Federal');
    expect(a.ideology).toBe('conservador');
    expect(a.mood).toBe(PARTY_MOOD_START);
    expect(a.inCoalition).toBe(false);
    expect(b.ideology).toBe('socialdemocrata');
  });

  it('sin nada, sortea dos partidos con ideologias distintas', () => {
    const [a, b] = normalizeOppositionParties(undefined, 'Frente de Gobierno');
    expect(a.ideology).not.toBe(b.ideology);
  });
});

describe('parlamento derivado', () => {
  it('suma 100 entre gobierno, los dos partidos y los minoritarios', () => {
    const p = politicsWith({ seats: 45 });
    const moral = { ...defaultMoral(), gustavoApoyo: 5, amaliaApoyo: 3, jhonApoyo: 4 };
    const s = parliament(p, moral, 0);
    expect(s.gobierno + s.partyA + s.partyB + s.minoritarios).toBe(100);
  });

  it('un partido sentado en la coalicion aporta sus bancas al gobierno', () => {
    const base = politicsWith({ seats: 40 });
    const sinPacto = parliament(base, defaultMoral(), 0);
    const parties = normalizeOppositionParties(base.oppositionParties, base.partyName);
    const conPacto: [OppositionParty, OppositionParty] = [{ ...parties[0], inCoalition: true }, parties[1]];
    const p2 = { ...base, oppositionParties: conPacto };
    const conPactoResult = parliament(p2, defaultMoral(), 0);
    expect(conPactoResult.gobierno).toBeGreaterThan(sinPacto.gobierno);
    expect(conPactoResult.partyA).toBe(0);
    expect(conPactoResult.aliados).toBeGreaterThan(0);
  });
});

describe('costo por ideologia', () => {
  it('un partido alineado y de buen humor abarata la decision', () => {
    const p = politicsWith();
    const parties = normalizeOppositionParties(p.oppositionParties, p.partyName);
    const alineado: [OppositionParty, OppositionParty] = [
      { ...parties[0], ideology: 'liberal', mood: 80 },
      { ...parties[1], ideology: 'liberal', mood: 50 }
    ];
    const p2 = { ...p, oppositionParties: alineado };
    expect(partyCostFactor(p2, 'economia')).toBeLessThan(1);
  });

  it('un partido opuesto y enojado encarece la decision', () => {
    const p = politicsWith();
    const parties = normalizeOppositionParties(p.oppositionParties, p.partyName);
    const enojado: [OppositionParty, OppositionParty] = [
      { ...parties[0], ideology: 'liberal', mood: 10 },
      { ...parties[1], ideology: 'liberal', mood: 50 }
    ];
    const p2 = { ...p, oppositionParties: enojado };
    expect(partyCostFactor(p2, 'previsional')).toBeGreaterThan(1);
  });

  it('un partido sentado en la coalicion no cobra ni descuenta', () => {
    const p = politicsWith();
    const parties = normalizeOppositionParties(p.oppositionParties, p.partyName);
    const sentado: [OppositionParty, OppositionParty] = [
      { ...parties[0], ideology: 'liberal', mood: 10, inCoalition: true },
      // nacionalista es neutral para 'previsional' (ni favor ni contra), asi
      // aisla el efecto de la coalicion sin que el segundo partido meta ruido
      { ...parties[1], ideology: 'nacionalista', mood: 50 }
    ];
    const p2 = { ...p, oppositionParties: sentado };
    expect(partyCostFactor(p2, 'previsional')).toBe(1);
  });
});

describe('humor que reacciona a lo que hace el gobierno', () => {
  it('decisiones alineadas suben el humor, opuestas lo bajan', () => {
    const parties: [OppositionParty, OppositionParty] = [
      { name: 'A', ideology: 'liberal', mood: 50, inCoalition: false },
      { name: 'B', ideology: 'socialdemocrata', mood: 50, inCoalition: false }
    ];
    const input = { categories: ['economia', 'comercio'] as const, corruption: 10, happiness: 55 };
    const next = tickOppositionParties(parties, { ...input, categories: [...input.categories] });
    expect(next[0].mood).toBeGreaterThan(50); // liberal, economia+comercio lo favorecen
    expect(next[1].mood).toBeLessThanOrEqual(50); // socialdemocrata no gana nada con eso
  });

  it('la corrupcion alta hunde el humor de los dos, sin importar ideologia', () => {
    const parties: [OppositionParty, OppositionParty] = [
      { name: 'A', ideology: 'liberal', mood: 50, inCoalition: false },
      { name: 'B', ideology: 'nacionalista', mood: 50, inCoalition: false }
    ];
    const limpio = tickOppositionParties(parties, { categories: [], corruption: 5, happiness: 55 });
    const corrupto = tickOppositionParties(parties, { categories: [], corruption: 90, happiness: 55 });
    expect(corrupto[0].mood).toBeLessThan(limpio[0].mood);
    expect(corrupto[1].mood).toBeLessThan(limpio[1].mood);
  });
});

describe('precio del pacto parlamentario', () => {
  it('un partido enojado y grande pide mas capital', () => {
    const barato = coalitionPrice({ name: 'A', ideology: 'liberal', mood: 80, inCoalition: false }, 10);
    const caro = coalitionPrice({ name: 'A', ideology: 'liberal', mood: 15, inCoalition: false }, 35);
    expect(caro).toBeGreaterThan(barato);
  });
});
