import type { Country, Delta } from './types';
import { clamp } from './engine';
import {
  CAPITAL_ON_WIN, decideBallotage, decideRound, grantHoneymoon, systemOf
} from './electoral';

/**
 * Ciclo electoral, oposicion y continuidad del partido.
 *
 * La partida NO termina a los cuatro anios. Gobernas un mandato, te presentas
 * a la reeleccion, y cuando se te agotan los mandatos consecutivos elegis un
 * sucesor de tu propio partido y seguis. Lo que se juega no es tu cargo: es la
 * continuidad de tu proyecto. Perder una eleccion si termina la partida.
 */

export interface Politics {
  partyName: string;
  leaderName: string;
  /** turno en que arranco el mandato actual */
  termStart: number;
  /** duracion del mandato en turnos (48 = 4 anios de turnos mensuales) */
  termLength: number;
  /** mandatos seguidos del mismo lider */
  consecutiveTerms: number;
  /** cuantos puede encadenar antes de tener que elegir sucesor */
  maxConsecutive: number;
  /** fuerza parlamentaria y de calle de la oposicion, 0-100 */
  opposition: number;
  electionsWon: number;
  /** turno en que asumio el partido por primera vez */
  powerSince: number;
  /** hasta este turno (inclusive) el pasivo de capital va doble: los 100 dias */
  honeymoonUntil: number;
  /** hay una segunda vuelta pendiente el proximo mes */
  pendingBallotage: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  title: string;
  description: string;
  /** efectos que se aplican al asumir */
  modifiers: Delta;
  /** cuanto suma o resta al resultado electoral */
  voteBonus: number;
}

export interface ElectionResult {
  vote: number;
  won: boolean;
  margin: number;
  turnout: number;
  headline: string;
  detail: string;
  /** primera, ballotage o colegio */
  round: 'primera' | 'ballotage' | 'colegio' | 'medio_termino';
  electors?: number;
  /** si true, el store NO cierra el mandato: espera un mes y corre la segunda */
  ballotage: boolean;
}

// ------------------------------------------------------------------
// Arranque
// ------------------------------------------------------------------

const PARTY_BY_IDEOLOGY: Record<string, string> = {
  liberal_democracy: 'Frente Republicano',
  social_democracy: 'Frente Popular',
  authoritarian_state_capitalism: 'Partido del Estado',
  authoritarian: 'Movimiento Nacional',
  socialist: 'Frente de Unidad Popular',
  monarchy: 'Union Constitucional'
};

export function defaultPolitics(country: Country, turn: number): Politics {
  const party = PARTY_BY_IDEOLOGY[country.traits.ideology] ?? 'Frente de Gobierno';
  const sys = systemOf(country.code);
  return {
    partyName: party,
    leaderName: 'el oficialismo',
    termStart: turn,
    termLength: sys.termMonths,
    consecutiveTerms: 1,
    maxConsecutive: sys.maxConsecutive,
    // un pais estable tiene oposicion moderada; uno convulsionado, una feroz
    opposition: clamp(Math.round(100 - country.population.stability), 20, 80),
    electionsWon: 0,
    powerSince: turn,
    honeymoonUntil: grantHoneymoon(turn),
    pendingBallotage: false
  };
}

// ------------------------------------------------------------------
// Oposicion
// ------------------------------------------------------------------

/**
 * La oposicion crece con el malestar y se desinfla cuando la gestion camina.
 * No es solo un numero de ambientacion: encarece cada decision y define
 * cuantos votos te faltan.
 *
 * Converge hacia un objetivo en vez de acumular. La version acumulativa
 * generaba una espiral sin salida: la oposicion trepaba a 100, cada decision
 * costaba 40% mas, y con eso era imposible recuperar el humor social que la
 * habia hecho crecer. Asi, una mala racha la infla pero una buena la desinfla,
 * y siempre hay camino de vuelta.
 */
export function driftOpposition(p: Politics, country: Country): number {
  const e = country.economy;
  const pop = country.population;

  let target = clamp(100 - pop.happiness, 15, 85);
  if (e.inflation > 25) target += 6;
  if (e.unemployment > 12) target += 5;
  if (e.gdp_growth > 3) target -= 6;
  if (pop.stability > 65) target -= 5;
  target = clamp(target, 10, 90);

  // se mueve un 12% del camino por mes: reacciona sin dar saltos
  const next = p.opposition + (target - p.opposition) * 0.12;
  return clamp(Math.round(next * 10) / 10, 0, 100);
}

/**
 * Cuanto mas cara sale cada decision con una oposicion fuerte.
 * Oposicion 40 (normal) = 1x. Oposicion 80 = 1.27x.
 */
export const oppositionCostFactor = (opposition: number) =>
  Math.round((1 + (opposition - 40) / 150) * 100) / 100;

// ------------------------------------------------------------------
// Elecciones
// ------------------------------------------------------------------

export const termsElapsed = (p: Politics, turn: number) => turn - p.termStart;
export const monthsToElection = (p: Politics, turn: number) => Math.max(0, p.termLength - termsElapsed(p, turn));
export const isElectionDue = (p: Politics, turn: number) => termsElapsed(p, turn) >= p.termLength;
export const needsSuccessor = (p: Politics) => p.consecutiveTerms >= p.maxConsecutive;

/**
 * Intencion de voto proyectada, 0-100.
 * Es la misma cuenta que decide la eleccion, asi que la encuesta que ve el
 * jugador durante el mandato no le miente: si llega al final con 46, pierde.
 */
export function poll(country: Country, p: Politics, capital: number, bonus = 0): number {
  const e = country.economy;
  const pop = country.population;
  const vote =
    46 +
    (pop.happiness - 55) * 0.55 +
    e.gdp_growth * 2.2 -
    Math.min(e.inflation, 100) * 0.06 -
    (e.unemployment - 8) * 0.7 +
    (capital - 50) * 0.04 -
    (p.opposition - 40) * 0.18 +
    bonus;
  return clamp(Math.round(vote * 10) / 10, 1, 99);
}

export const isMidtermDue = (p: Politics, turn: number, code: string) => {
  const m = systemOf(code).midtermMonths;
  return m > 0 && termsElapsed(p, turn) === m;
};

/** Resuelve la eleccion. El ruido evita que el resultado sea cantado. */
export function runElection(
  country: Country, p: Politics, capital: number, candidate?: Candidate
): ElectionResult {
  const sys = systemOf(country.code);
  const base = poll(country, p, capital, candidate?.voteBonus ?? 0);
  const noise = (Math.random() - 0.5) * 6;
  const vote = clamp(Math.round((base + noise) * 10) / 10, 1, 99);
  const quien = candidate ? candidate.name : p.leaderName;
  const turnout = Math.round(clamp(
    (country.code === 'Uruguay' ? 84 : 62)
      + (p.opposition - 40) * 0.25
      + (55 - country.population.happiness) * 0.1,
    45, 94
  ));

  if (p.pendingBallotage) {
    const d = decideBallotage(vote);
    return {
      vote, won: d.won, margin: Math.round((vote - 50) * 10) / 10, turnout,
      round: 'ballotage', ballotage: false,
      headline: d.won
        ? `${p.partyName} gana el ballotage con el ${vote}%`
        : `${p.partyName} pierde el ballotage con el ${vote}%`,
      detail: d.won
        ? `${quien} se impone en segunda vuelta.`
        : `La oposicion da vuelta el resultado. ${quien} entrega el gobierno.`
    };
  }

  const d = decideRound(sys, vote);
  const round: ElectionResult['round'] = sys.win === 'electoral_college' ? 'colegio' : 'primera';
  const margin = Math.round((vote - 50) * 10) / 10;

  if (d.ballotage) {
    return {
      vote, won: false, margin, turnout, round, ballotage: true, electors: d.electors,
      headline: `${p.partyName} va a ballotage con el ${vote}%`,
      detail: `${d.label}. Segunda vuelta el mes que viene. ${quien} sigue en carrera.`
    };
  }

  return {
    vote, won: d.won, margin, turnout, round, ballotage: false, electors: d.electors,
    headline: d.won
      ? `${p.partyName} gana con el ${vote}%`
      : `${p.partyName} pierde el gobierno con el ${vote}%`,
    detail: d.won
      ? `${quien} sigue en el poder (${d.label}). Recibe ${CAPITAL_ON_WIN} de capital politico y 4 meses de luna de miel.`
      : `La oposicion se impone (${d.label}). ${quien} entrega el gobierno.`
  };
}

export function runMidterm(country: Country, p: Politics, capital: number): ElectionResult {
  const vote = poll(country, p, capital);
  const won = vote >= 48;
  return {
    vote, won, margin: Math.round((vote - 50) * 10) / 10,
    turnout: 58, round: 'medio_termino', ballotage: false,
    headline: won
      ? `El oficialismo gana el medio termino con el ${vote}%`
      : `El oficialismo pierde el medio termino con el ${vote}%`,
    detail: won
      ? `El Congreso acompana. +${25} de capital politico y 4 meses de pasivo doble.`
      : 'La oposicion se queda con la Camara. Gobernar se encarece.'
  };
}

// ------------------------------------------------------------------
// Sucesion
// ------------------------------------------------------------------

const NAMES = [
  'M. Ferreyra', 'L. Sandoval', 'R. Ocampo', 'V. Duarte', 'A. Bustos',
  'C. Miranda', 'J. Vergara', 'P. Aguirre', 'S. Peralta', 'N. Cardozo'
];

const pickName = (used: string[]) => {
  const free = NAMES.filter((n) => !used.includes(n));
  return free[Math.floor(Math.random() * free.length)] ?? NAMES[0];
};

/**
 * Tres candidatos del propio partido. No hay uno mejor: cada perfil te deja
 * mejor parado para un problema distinto y peor para otro.
 */
export function successors(): Candidate[] {
  const used: string[] = [];
  const take = () => {
    const n = pickName(used);
    used.push(n);
    return n;
  };

  return [
    {
      id: 'tecnico',
      name: take(),
      title: 'El tecnico',
      description:
        'Economista de carrera, sin calle. Los mercados lo festejan y el electorado lo mira con desconfianza.',
      modifiers: { inflation: -4, stability: 3, happiness: -4, capital: 5 },
      voteBonus: -2
    },
    {
      id: 'carismatica',
      name: take(),
      title: 'La carismatica',
      description:
        'Arrastra multitudes y arranca con la calle a favor. Con la caja es menos prolija.',
      modifiers: { happiness: 8, capital: 15, fiscal_balance: -0.4 },
      voteBonus: 4
    },
    {
      id: 'continuista',
      name: take(),
      title: 'El delfin',
      description:
        'Tu mano derecha. No sorprende a nadie: mantiene el rumbo, los socios y la estructura.',
      modifiers: { stability: 5, capital: 8 },
      voteBonus: 1
    }
  ];
}

/** Balance de gestion para el cierre de la partida. */
export function legacy(p: Politics, turn: number, country: Country, startingGdp: number) {
  const months = turn - p.powerSince;
  const years = Math.round((months / 12) * 10) / 10;
  const gdpChange = startingGdp ? Math.round((country.economy.gdp_trillion_usd / startingGdp - 1) * 1000) / 10 : 0;
  return {
    years,
    elections: p.electionsWon,
    gdpChange,
    inflation: country.economy.inflation,
    happiness: country.population.happiness
  };
}
