import type { Country, Delta, GameEvent } from './types';
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
  /** escanos propios en un parlamento de 100 */
  seats: number;
  /** intencion de voto turno a turno, para el grafico */
  pollHistory: { turn: number; value: number }[];
  /** hasta este turno (inclusive) el pasivo de capital va doble: los 100 dias */
  honeymoonUntil: number;
  /** hay una segunda vuelta pendiente el proximo mes */
  pendingBallotage: boolean;
  /**
   * Los dos partidos que componen la oposicion, de mayor a menor peso.
   * Opcional: los saves viejos no lo traen (ver `oppositionSplit` para
   * completarlo al vuelo sin romper compatibilidad).
   */
  oppositionParties?: [string, string];
  /** true si ya se le oferto una coalicion a la oposicion este mandato */
  coalitionOffered?: boolean;
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

/** Nombres de partidos opositores: los dos que le tocan a cada partida se
 *  sortean de aca, evitando repetir el nombre del oficialismo. */
const OPPOSITION_POOL = [
  'Alianza Ciudadana', 'Union por el Cambio', 'Bloque Federal', 'Coalicion Civica',
  'Nuevo Espacio', 'Frente Amplio', 'Partido Justicialista', 'Convergencia Nacional',
  'Movimiento Progresista', 'Union Democratica'
];

function pickOppositionParties(exclude: string): [string, string] {
  const pool = OPPOSITION_POOL.filter((n) => n !== exclude);
  const a = pool[Math.floor(Math.random() * pool.length)];
  const rest = pool.filter((n) => n !== a);
  const b = rest[Math.floor(Math.random() * rest.length)];
  return [a, b];
}

export type Difficulty = 'facil' | 'normal' | 'dificil';

/** Solo mueve el punto de partida (capital politico y fuerza de la oposicion
 *  al asumir): no toca ninguna formula de la simulacion turno a turno, asi
 *  que gobernar bien o mal sigue dependiendo 100% de las decisiones del
 *  jugador, no de un multiplicador escondido corriendo por detras. */
/** Bono fijo de arranque, va arriba de lo que ya da cada dificultad. */
export const STARTING_CAPITAL_BONUS = 40;

export const DIFFICULTY_PRESETS: Record<Difficulty, { label: string; detail: string; capital: number; oppositionDelta: number }> = {
  facil: {
    label: 'Facil',
    detail: 'Mas capital politico para arrancar y una oposicion mas debil.',
    capital: 75 + STARTING_CAPITAL_BONUS,
    oppositionDelta: -15
  },
  normal: {
    label: 'Normal',
    detail: 'Como viene el pais en el escenario base, sin ventajas ni penas.',
    capital: 60 + STARTING_CAPITAL_BONUS,
    oppositionDelta: 0
  },
  dificil: {
    label: 'Dificil',
    detail: 'Menos capital politico y una oposicion fuerte desde el primer dia.',
    capital: 45 + STARTING_CAPITAL_BONUS,
    oppositionDelta: 15
  }
};

export function defaultPolitics(country: Country, turn: number, difficulty: Difficulty = 'normal'): Politics {
  const party = PARTY_BY_IDEOLOGY[country.traits.ideology] ?? 'Frente de Gobierno';
  const sys = systemOf(country.code);
  const oppositionDelta = DIFFICULTY_PRESETS[difficulty].oppositionDelta;
  return {
    partyName: party,
    leaderName: 'el oficialismo',
    termStart: turn,
    termLength: sys.termMonths,
    consecutiveTerms: 1,
    maxConsecutive: sys.maxConsecutive,
    // un pais estable tiene oposicion moderada; uno convulsionado, una feroz
    opposition: clamp(Math.round(100 - country.population.stability) + oppositionDelta, 15, 90),
    electionsWon: 0,
    powerSince: turn,
    // el oficialismo arranca con una mayoria ajustada, no comoda
    seats: clamp(Math.round(48 + (country.population.stability - 50) * 0.2), 30, 62),
    pollHistory: [],
    honeymoonUntil: grantHoneymoon(turn),
    pendingBallotage: false,
    oppositionParties: pickOppositionParties(party),
    coalitionOffered: false
  };
}

/** Reparto de la fuerza total de oposicion entre sus dos partidos: el
 *  primero se lleva la mayoria, no es un 50/50 parejo. Solo para mostrar
 *  y para calcular cuanto resta si uno de los dos se suma a una coalicion. */
export function oppositionSplit(opposition: number): [number, number] {
  const a = Math.round(opposition * 0.58 * 10) / 10;
  return [a, Math.round((opposition - a) * 10) / 10];
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
// Parlamento
// ------------------------------------------------------------------

export const MAJORITY = 51;

/** Escanos totales del oficialismo mas los que aportan sus socios de coalicion. */
export const totalSeats = (p: Politics, coalitionSeats = 0) =>
  clamp(p.seats + coalitionSeats, 0, 100);

export const hasMajority = (p: Politics, coalitionSeats = 0) =>
  totalSeats(p, coalitionSeats) >= MAJORITY;

/**
 * Sin mayoria, las medidas grandes hay que negociarlas voto por voto.
 * Solo pesa en las decisiones caras: las chicas pasan igual.
 */
export function parliamentCostFactor(p: Politics, capitalCost: number, coalitionSeats = 0): number {
  if (capitalCost < 15) return 1;
  return hasMajority(p, coalitionSeats) ? 1 : 1.4;
}

/**
 * Reparto de escanos despues de una eleccion.
 * El voto presidencial arrastra, pero nunca del todo: aunque ganes con el 60%
 * el Congreso queda mas repartido que la boleta.
 */
export function seatsFromVote(vote: number, previous: number): number {
  const target = clamp(Math.round(30 + (vote - 30) * 0.85), 20, 72);
  // el recambio es parcial: se renueva la mitad
  return clamp(Math.round(previous * 0.5 + target * 0.5), 15, 80);
}

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
  // `bonus` junta lo del candidato y lo que aporta el gabinete
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
  country: Country, p: Politics, capital: number, candidate?: Candidate, cabinetBonus = 0
): ElectionResult {
  const sys = systemOf(country.code);
  // el gabinete tambien pesa en la boleta: un ministro de la oposicion suma
  const base = poll(country, p, capital, (candidate?.voteBonus ?? 0) + cabinetBonus);
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
// Campaña: coalicion pre-electoral y discurso de cierre
// ------------------------------------------------------------------

/**
 * Eventos forzados de campaña, no aleatorios: se disparan por la agenda
 * electoral, no por sorteo (weight: 0, no compiten con el resto).
 *
 *  - A 3 meses de la eleccion: uno de los dos partidos opositores puede
 *    sumarse a tu coalicion a cambio de un costo politico. Reduce la
 *    oposicion de forma directa y permanente, no como el drift normal.
 *  - A 1 mes (el turno inmediato anterior): 5 discursos de cierre para
 *    elegir. Se resuelven ANTES de la eleccion (al planificar la eleccion
 *    ya corrio ese mismo turno con el efecto del discurso adentro), asi
 *    que el discurso que elegis define con que numeros llegas a la boleta.
 */
export function campaignEvents(p: Politics, turn: number): GameEvent[] {
  const out: GameEvent[] = [];
  const meses = monthsToElection(p, turn);
  const [partyA, partyB] = p.oppositionParties ?? ['la oposicion mayor', 'la oposicion menor'];
  const [shareA, shareB] = oppositionSplit(p.opposition);

  if (meses === 3 && !p.coalitionOffered) {
    out.push({
      id: 'oferta_coalicion',
      scope: 'nacional',
      title: 'Se abre la campaña: la oposicion no es un bloque unico',
      emoji: '🤝',
      tags: ['politica', 'eleccion'],
      weight: 0,
      duration: 1,
      description:
        `A 3 meses de la eleccion, ${partyA} (${shareA} pts) y ${partyB} (${shareB} pts) no van tan juntos como parecen. `
        + 'Alguno de los dos podria sumarse a tu coalicion a cambio de lugares en el gobierno.',
      choices: [
        {
          id: 'partyA',
          label: `Negociar con ${partyA}`,
          detail: 'El mas grande de los dos: pesa mas en la oposicion, pero pide mas para cruzar.',
          cost: { capital: 15 },
          effects: { stability: -1 },
          relations: []
        },
        {
          id: 'partyB',
          label: `Negociar con ${partyB}`,
          detail: 'El mas chico: cede menos oposicion, pero sale mas barato.',
          cost: { capital: 8 },
          effects: {},
          relations: []
        },
        {
          id: 'no_negociar',
          label: 'No negociar: ir solo a la campaña',
          detail: 'Cero costo, cero riesgo de que te acusen de "pacto con la casta". La oposicion sigue entera.',
          effects: {}
        }
      ]
    });
  }

  if (meses === 1) {
    out.push({
      id: 'discurso_cierre',
      scope: 'nacional',
      title: 'Discurso de cierre de campaña',
      emoji: '🎤',
      tags: ['politica', 'eleccion'],
      weight: 0,
      duration: 1,
      description:
        'La eleccion es el mes que viene. Este es tu ultimo acto de campaña antes de que se cuenten los votos: '
        + 'lo que digas hoy pesa en el resultado.',
      choices: [
        {
          id: 'unidad',
          label: 'Discurso de unidad y esperanza',
          detail: 'Convocas a todos, sin marcar enemigos. Suma parejo, entusiasma poco.',
          effects: { happiness: 3, capital: 4 }
        },
        {
          id: 'mano_dura',
          label: 'Discurso de mano dura contra la oposicion',
          detail: 'Consolidas tu base a los gritos. Energiza tambien al que se te opone.',
          effects: { stability: 2, capital: 6, happiness: -2 },
          relations: []
        },
        {
          id: 'tecnico',
          label: 'Discurso tecnico, con numeros y plan de gobierno',
          detail: 'Serio y sin sorpresas. No entusiasma, pero tampoco falla.',
          effects: { capital: 3, stability: 1 }
        },
        {
          id: 'emotivo',
          label: 'Discurso emotivo, apelando al corazon',
          detail: 'Alto impacto si prende. Si se lee como demagogia, te sale caro.',
          effects: { happiness: 5, capital: 8 },
          risk: {
            chance: 0.35,
            label: 'Se lee como demagogia vacia y el efecto se da vuelta',
            effects: { happiness: -4, capital: -6 }
          }
        },
        {
          id: 'bajo_perfil',
          label: 'No dar discurso de cierre: bajo perfil',
          detail: 'Cero riesgo. Tambien cero oportunidad.',
          effects: {}
        }
      ]
    });
  }

  return out;
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
