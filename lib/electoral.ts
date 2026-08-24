import type { Country } from './types';
import { clamp } from './engine';

/**
 * Sistemas electorales por pais. El motor de politics.ts es generico
 * (mandato, reeleccion, sucesor); este archivo le dice COMO se gana
 * en cada pais. Los tres de referencia (Argentina, Uruguay, Estados Unidos)
 * estan modelados con las reglas reales; el resto usa una familia cercana.
 *
 * Zona de contenido: agregar un pais aca no exige tocar el store.
 */

export type WinRule =
  | 'majority_50'       // dos vueltas si nadie llega al 50% (Uruguay, Brasil, Francia)
  | 'ballotage_ar'      // 45% o 40%+10 (Argentina)
  | 'electoral_college' // 270 electores (Estados Unidos)
  | 'plurality';        // gana el mas votado, una vuelta (Mexico, UK)

export interface ElectoralSystem {
  id: string;
  /** nombre corto que ve el jugador */
  label: string;
  termMonths: number;
  maxConsecutive: number;
  /** 0 = no hay medio termino */
  midtermMonths: number;
  win: WinRule;
  /** texto de la encuesta: que hay que lograr */
  bar: string;
  notes: string;
}

const PRES_4_REELECT: Omit<ElectoralSystem, 'id' | 'label' | 'notes'> = {
  termMonths: 48, maxConsecutive: 2, midtermMonths: 0, win: 'majority_50',
  bar: '50% en primera o ballotage'
};

export const SYSTEMS: Record<string, ElectoralSystem> = {
  Argentina: {
    id: 'ar',
    label: 'Presidencial con ballotage',
    termMonths: 48,
    maxConsecutive: 2,
    midtermMonths: 24,
    win: 'ballotage_ar',
    bar: '45%, o 40% con 10 puntos de ventaja',
    notes:
      'Mandato de 4 anios, una reeleccion consecutiva. Mitad de diputados cada 2 anios. '
      + 'Gana en primera si llega al 45% o al 40% con 10 puntos sobre el segundo.'
  },
  Uruguay: {
    id: 'uy',
    label: 'Presidencial 5 anios, sin reeleccion inmediata',
    termMonths: 60,
    maxConsecutive: 1,
    midtermMonths: 0,
    win: 'majority_50',
    bar: '50% o ballotage un mes despues',
    notes:
      'Mandato de 5 anios. No hay reeleccion inmediata: el partido sigue, el lider no. '
      + 'Voto simultaneo presidente-parlamento. Si nadie llega al 50%, ballotage.'
  },
  USA: {
    id: 'us',
    label: 'Colegio electoral',
    termMonths: 48,
    maxConsecutive: 2,
    midtermMonths: 24,
    win: 'electoral_college',
    bar: '270 electores (el voto popular no alcanza)',
    notes:
      '4 anios, tope de dos mandatos. Gana quien llega a 270 electores, no quien saca mas votos. '
      + 'A los 2 anios se renueva toda la Camara: es el medio termino que mide al gobierno.'
  },
  Brazil: {
    id: 'br', label: 'Presidencial con segunda vuelta',
    ...PRES_4_REELECT,
    notes: '4 anios, una reeleccion. Segunda vuelta si nadie llega al 50%.'
  },
  France: {
    id: 'fr', label: 'Semipresidencial, dos vueltas',
    termMonths: 60, maxConsecutive: 2, midtermMonths: 0, win: 'majority_50',
    bar: '50% o segunda vuelta',
    notes: '5 anios, dos mandatos. El parlamento se elige aparte y puede cohabitar.'
  },
  Mexico: {
    id: 'mx', label: 'Sexenio sin reeleccion',
    termMonths: 72, maxConsecutive: 1, midtermMonths: 36, win: 'plurality',
    bar: 'mayoria simple, una vuelta',
    notes: '6 anios y no se puede reelegir. El partido elige sucesor si quiere continuar.'
  },
  Chile: {
    id: 'cl', label: 'Presidencial sin reeleccion inmediata',
    termMonths: 48, maxConsecutive: 1, midtermMonths: 0, win: 'majority_50',
    bar: '50% o ballotage',
    notes: '4 anios, sin reeleccion inmediata (como Uruguay).'
  }
};

const FALLBACK: ElectoralSystem = {
  id: 'default',
  label: 'Presidencial 4 anios',
  termMonths: 48,
  maxConsecutive: 2,
  midtermMonths: 24,
  win: 'majority_50',
  bar: '50% o ballotage',
  notes: 'Mandato de 4 anios, una reeleccion, segunda vuelta si no hay mayoria.'
};

export const systemOf = (code: string): ElectoralSystem => SYSTEMS[code] ?? FALLBACK;
export const systemOfCountry = (c: Country) => systemOf(c.code);

/** Los 100 dias del presidente: 4 meses de pasivo doble tras ganar. */
export const HONEYMOON_MONTHS = 4;
export const CAPITAL_ON_WIN = 60;
export const CAPITAL_ON_MIDTERM_WIN = 25;
export const CAPITAL_PASSIVE_BASE = 8;

/**
 * Capital diplomatico: recurso separado del capital politico (docs/PEDIDOS_A_OPUS.md,
 * pedido del jugador de "definir mejor el capital diplomatico"). Solo lo gastan/ganan
 * las decisiones categoria `diplomacia` y los movimientos de bloques (lib/store.ts).
 * Arranca mas escaso que el politico a proposito: la diplomacia tiene que sentirse
 * limitada, no un segundo bolsillo gratis.
 */
export const CAPITAL_DIPLOMATICO_START = 25;
export const DIPLOMATIC_CAPITAL_PASSIVE_BASE = 3;

export const grantHoneymoon = (turn: number) => turn + HONEYMOON_MONTHS;

/** Convierte voto popular en electores (538, mayoria 270). Exagera el winner-take-all. */
export function popularToElectors(vote: number): number {
  return clamp(Math.round(270 + (vote - 50) * 10), 0, 538);
}

/**
 * Decide si esa intencion de voto alcanza para ganar, ir a ballotage o perder.
 * El segundo se estima como el 58% del voto no oficialista (el resto se parte).
 */
export function decideRound(
  sys: ElectoralSystem,
  vote: number
): { won: boolean; ballotage: boolean; electors?: number; label: string } {
  const second = (100 - vote) * 0.58;
  const lead = vote - second;

  if (sys.win === 'plurality') {
    const won = vote > second;
    return { won, ballotage: false, label: won ? 'mayoria simple' : 'quedo segundo' };
  }

  if (sys.win === 'electoral_college') {
    const electors = popularToElectors(vote);
    if (electors >= 270) return { won: true, ballotage: false, electors, label: `${electors} electores` };
    if (electors >= 268 && electors <= 272) {
      return { won: false, ballotage: false, electors, label: `${electors} electores: va a la Camara` };
    }
    return { won: false, ballotage: false, electors, label: `${electors} electores (faltan ${270 - electors})` };
  }

  if (sys.win === 'ballotage_ar') {
    if (vote >= 45 || (vote >= 40 && lead >= 10)) {
      return { won: true, ballotage: false, label: vote >= 45 ? 'gana en primera (45%)' : 'gana en primera (40% + 10)' };
    }
    if (vote >= 30) return { won: false, ballotage: true, label: 'va a ballotage' };
    return { won: false, ballotage: false, label: 'queda fuera de la segunda vuelta' };
  }

  if (vote >= 50) return { won: true, ballotage: false, label: 'gana en primera' };
  if (vote >= 30) return { won: false, ballotage: true, label: 'va a ballotage' };
  return { won: false, ballotage: false, label: 'queda fuera de la segunda vuelta' };
}

/** Segunda vuelta: dos candidatos, gana quien pasa el 50%. */
export function decideBallotage(vote: number): { won: boolean; label: string } {
  const won = vote > 50;
  return { won, label: won ? 'gana el ballotage' : 'pierde el ballotage' };
}
