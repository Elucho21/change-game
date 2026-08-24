import { describe, expect, it } from 'vitest';
import {
  defaultMoral, MINORITY_CAPS, minorityOppositionPush, minorityStreetPush, minorityVoteShare,
  notableMinoritySwing
} from '../lib/moral';
import { defaultPolitics, driftOpposition, poll } from '../lib/politics';
import { eventWeightBoost } from '../lib/engine';
import { MINORITY_LEADER_EVENTS } from '../lib/events/minority_leaders';
import gen from '../lib/data/countries.gen.json';
import type { Country, EventContext, MoralState } from '../lib/types';

/**
 * Hasta v1.3 el apoyo a Gustavo/Amalia/Jhon se escribia desde 12 eventos, se
 * dibujaba en un panel y NINGUNA formula lo leia: cero impacto sobre la
 * eleccion, la oposicion, la calle o el sorteo de eventos. El jugador lo
 * reporto como "no tienen funciones o impacto". Estos tests fijan el cableado.
 */

const country = () =>
  JSON.parse(JSON.stringify((gen as { countries: Record<string, Country> }).countries.Argentina)) as Country;

const conApoyo = (over: Partial<MoralState> = {}): MoralState => ({ ...defaultMoral(), ...over });

describe('los minoritarios pesan en la eleccion', () => {
  it('el apoyo se descuenta punto por punto de la intencion de voto', () => {
    const c = country();
    const p = defaultPolitics(c, 1);
    const sinFuga = poll(c, p, 50, 0, undefined, conApoyo({ gustavoApoyo: 0, amaliaApoyo: 0, jhonApoyo: 0 }));
    const conFuga = poll(c, p, 50, 0, undefined, conApoyo({ gustavoApoyo: 6, amaliaApoyo: 3, jhonApoyo: 2 }));
    expect(sinFuga - conFuga).toBeCloseTo(11, 1);
  });

  it('sin `moral` la formula queda identica a la de antes (retrocompatible)', () => {
    const c = country();
    const p = defaultPolitics(c, 1);
    expect(poll(c, p, 50)).toBe(poll(c, p, 50, 0, undefined, undefined));
  });

  it('minorityVoteShare tolera un estado sin sistema moral', () => {
    expect(minorityVoteShare(undefined)).toBe(0);
    expect(minorityOppositionPush(undefined)).toBe(0);
    expect(minorityStreetPush(undefined)).toBe(0);
  });
});

describe('los minoritarios pesan fuera de la eleccion', () => {
  it('empujan el objetivo de la oposicion', () => {
    const a = country();
    const b = country();
    const p = defaultPolitics(a, 1);
    const sin = driftOpposition({ ...p }, a, conApoyo());
    const con = driftOpposition({ ...p }, b, conApoyo({ gustavoApoyo: 14, amaliaApoyo: 10, jhonApoyo: 14 }));
    expect(con).toBeGreaterThan(sin);
  });

  it('solo Gustavo pone gente en la calle, y recien pasado el testimonial', () => {
    expect(minorityStreetPush(conApoyo({ gustavoApoyo: 3 }))).toBe(0);
    expect(minorityStreetPush(conApoyo({ gustavoApoyo: 14 }))).toBeGreaterThan(0);
    // Amalia y Jhon no tienen estructura sindical: no tocan el streetWeight
    expect(minorityStreetPush(conApoyo({ amaliaApoyo: 12, jhonApoyo: 15 }))).toBe(0);
  });

  it('un lider con apoyo alto sortea sus cartas mas seguido, sin bajar ningun umbral', () => {
    const carta = MINORITY_LEADER_EVENTS.find((e) => e.tags?.includes('gustavo'))!;
    const ctx = (m: MoralState) => ({ moral: m }) as unknown as EventContext;
    expect(eventWeightBoost(carta, ctx(conApoyo({ gustavoApoyo: 0 })))).toBe(1);
    const alTecho = eventWeightBoost(carta, ctx(conApoyo({ gustavoApoyo: MINORITY_CAPS.gustavo })));
    expect(alTecho).toBeGreaterThan(2);
    // un evento sin tag de lider no se toca
    expect(eventWeightBoost({ ...carta, tags: ['economia'] }, ctx(conApoyo({ gustavoApoyo: 15 })))).toBe(1);
  });
});

describe('el feed puede narrar el movimiento', () => {
  it('detecta el lider que mas se movio y ignora el ruido chico', () => {
    const antes = conApoyo({ gustavoApoyo: 2, jhonApoyo: 2 });
    expect(notableMinoritySwing(antes, { ...antes, gustavoApoyo: 2.3 })).toBeNull();
    const swing = notableMinoritySwing(antes, { ...antes, gustavoApoyo: 5, jhonApoyo: 3 });
    expect(swing).toEqual({ id: 'gustavo', delta: 3 });
  });
});
