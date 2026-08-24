import { describe, expect, it } from 'vitest';
import {
  applyEnriqueOutcome, ENRIQUE_CARD_COOLDOWN, ENRIQUE_MIN_GAP, ENRIQUE_OFFENDED_TURNS,
  enriqueAppearChance, enriqueEvents, enriqueTrustDelta, registerEnriqueCard
} from '../lib/events/enrique';
import { defaultMoral, tickMoral } from '../lib/moral';
import { defaultPopularGroups } from '../lib/popularGroups';
import type { MoralState } from '../lib/types';

/**
 * El jugador reporto "son muchas ofertas de corrupcion y siempre las mismas".
 * La causa era el selector viejo: `investigacion > 35` forzaba carta TODOS los
 * meses para siempre, y el pick uniforme sin memoria repetia la misma carta.
 * Estos tests fijan la cadencia nueva para que no vuelva a pasar.
 */

/** Corre `turns` meses de selector, devolviendo la carta que salio en cada uno. */
function simulate(start: MoralState, turns: number): { turn: number; id: string }[] {
  let moral = start;
  const out: { turn: number; id: string }[] = [];
  for (let turn = 1; turn <= turns; turn++) {
    const [card] = enriqueEvents(moral, true, turn);
    if (card) {
      out.push({ turn, id: card.id });
      moral = registerEnriqueCard(moral, card.id, turn);
    }
  }
  return out;
}

describe('cadencia de Enrique', () => {
  const base = (over: Partial<MoralState> = {}): MoralState =>
    ({ ...defaultMoral(), onboarded: true, ...over });

  it('sin onboarding no aparece nunca', () => {
    expect(enriqueEvents(base(), false, 10)).toEqual([]);
  });

  it('la chance es una rampa acotada, no una puerta binaria', () => {
    expect(enriqueAppearChance(base({ investigacion: 0 }))).toBeCloseTo(0.12, 5);
    // el bug viejo: con investigacion 36 salia carta SEGURA todos los meses
    expect(enriqueAppearChance(base({ investigacion: 36 }))).toBeLessThan(0.3);
    expect(enriqueAppearChance(base({ investigacion: 100, scandalFactor: 30 }))).toBeLessThanOrEqual(0.6);
  });

  it('respeta el espaciado minimo entre cartas', () => {
    const cartas = simulate(base({ investigacion: 60 }), 120);
    expect(cartas.length).toBeGreaterThan(3);
    for (let i = 1; i < cartas.length; i++) {
      expect(cartas[i].turn - cartas[i - 1].turn).toBeGreaterThanOrEqual(ENRIQUE_MIN_GAP);
    }
  });

  it('en 60 meses no satura la partida (el bug era una carta por mes)', () => {
    const cartas = simulate(base({ investigacion: 60 }), 60);
    expect(cartas.length).toBeLessThan(30);
  });

  it('no repite la misma carta antes del cooldown', () => {
    const cartas = simulate(base({ investigacion: 60 }), 200);
    const ultimoTurnoPorId: Record<string, number> = {};
    for (const c of cartas) {
      const previo = ultimoTurnoPorId[c.id];
      if (previo !== undefined) {
        expect(c.turn - previo).toBeGreaterThanOrEqual(ENRIQUE_CARD_COOLDOWN);
      }
      ultimoTurnoPorId[c.id] = c.turn;
    }
  });

  it('con la investigacion desbocada puede apretar mas seguido', () => {
    const cartas = simulate(base({ investigacion: 95, scandalFactor: 30 }), 60);
    const gaps = cartas.slice(1).map((c, i) => c.turn - cartas[i].turn);
    expect(Math.min(...gaps)).toBeLessThan(ENRIQUE_MIN_GAP);
  });
});

describe('confianza de Enrique', () => {
  const dirty = { corruption: 5, favoresActivos: 4 };
  const clean = { corruption: -3 };

  it('seguirle el juego sube la confianza, rechazarlo la baja', () => {
    expect(enriqueTrustDelta(dirty)).toBe(1);
    expect(enriqueTrustDelta(clean)).toBe(-1);
    expect(enriqueTrustDelta(undefined)).toBe(-1);
  });

  it('tres rechazos seguidos lo ofenden y desaparece unos meses', () => {
    let m: MoralState = { ...defaultMoral(), onboarded: true };
    for (let i = 0; i < 3; i++) m = applyEnriqueOutcome(m, clean, 10);
    expect(m.enriqueSilentUntil).toBe(10 + ENRIQUE_OFFENDED_TURNS);
    // mientras dura el silencio no sale ninguna carta, ni con investigacion alta
    const enSilencio = { ...m, investigacion: 95 };
    for (let turn = 11; turn <= 10 + ENRIQUE_OFFENDED_TURNS; turn++) {
      expect(enriqueEvents(enSilencio, true, turn)).toEqual([]);
    }
    expect(simulate({ ...enSilencio }, 40).some((c) => c.turn > 10 + ENRIQUE_OFFENDED_TURNS)).toBe(true);
  });

  it('ofendido, los favores prestados se caen al doble de rapido', () => {
    const input = {
      happiness: 50, unemployment: 8, hasMajority: true, strongMajority: false,
      comisionIntegrity: 50, groups: defaultPopularGroups()
    };
    const normal = tickMoral({ ...defaultMoral(), favoresActivos: 20 }, input);
    const ofendido = tickMoral({ ...defaultMoral(), favoresActivos: 20, enriqueTrust: -2 }, input);
    expect(ofendido.state.favoresActivos).toBeLessThan(normal.state.favoresActivos);
  });

  it('la carta grande solo aparece si le venis siguiendo el juego', () => {
    const crisis = { investigacion: 90, corruption: 80 };
    const desconfiado = simulate({ ...defaultMoral(), onboarded: true, ...crisis, enriqueTrust: -1 }, 200);
    expect(desconfiado.some((c) => c.id === 'enrique_oferta_final')).toBe(false);
    const complice = simulate({ ...defaultMoral(), onboarded: true, ...crisis, enriqueTrust: 2 }, 200);
    expect(complice.some((c) => c.id === 'enrique_oferta_final')).toBe(true);
  });
});
