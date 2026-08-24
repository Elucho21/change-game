/**
 * Recap de fin de partida: balance de gestion (arranque vs cierre, mejor y
 * peor mes de cada indicador) y logros desbloqueados. Se calcula una sola
 * vez, al mostrar EndGameScreen (components/EndGameScreen.tsx), a partir de
 * `history` (numeros por turno, lib/store.ts) y `milestones` (hitos
 * institucionales, lib/milestones.ts) — nunca se guarda en el estado.
 */

import { dateLabelForTurn } from './engine';
import type { Milestone } from './milestones';
import type { Politics } from './politics';
import type { Country, GlobalState, MoralState } from './types';
import type { HistoryPoint } from './store';

export type RecapMetricKey =
  | 'inflation' | 'unemployment' | 'growth' | 'fiscal' | 'debt' | 'happiness' | 'stability' | 'opposition';

const METRIC_LABEL: Record<RecapMetricKey, string> = {
  inflation: 'Inflacion',
  unemployment: 'Desempleo',
  growth: 'Crecimiento del PBI',
  fiscal: 'Balance fiscal',
  debt: 'Deuda / PBI',
  happiness: 'Felicidad social',
  stability: 'Estabilidad',
  opposition: 'Fuerza de la oposicion'
};

export const METRIC_UNIT: Record<RecapMetricKey, string> = {
  inflation: '%', unemployment: '%', growth: '%', fiscal: '%', debt: '%',
  happiness: '', stability: '', opposition: ''
};

/** true si mas alto es mejor para este indicador (define que punto es "mejor" y cual "peor") */
const HIGHER_IS_BETTER: Record<RecapMetricKey, boolean> = {
  inflation: false,
  unemployment: false,
  growth: true,
  fiscal: true,
  debt: false,
  happiness: true,
  stability: true,
  opposition: false
};

export interface RecapPoint {
  value: number;
  date: string;
  turn: number;
}

export interface RecapMetric {
  key: RecapMetricKey;
  label: string;
  start: number;
  end: number;
  best: RecapPoint;
  worst: RecapPoint;
}

export interface RecapSummary {
  startDate: string;
  endDate: string;
  years: number;
  turns: number;
  electionsWon: number;
  metrics: RecapMetric[];
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  detail: string;
}

export interface RecapInput {
  history: HistoryPoint[];
  milestones: Milestone[];
  politics: Politics;
  moral: MoralState;
  player: Country;
  world: GlobalState;
  turn: number;
  startingGdp: number;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

function buildMetric(
  key: RecapMetricKey, history: HistoryPoint[], field: keyof HistoryPoint, world: GlobalState, currentTurn: number
): RecapMetric {
  let best = history[0];
  let worst = history[0];
  const higherIsBetter = HIGHER_IS_BETTER[key];
  for (const h of history) {
    const v = (h[field] as number) ?? 0;
    const bestV = (best[field] as number) ?? 0;
    const worstV = (worst[field] as number) ?? 0;
    if (higherIsBetter ? v > bestV : v < bestV) best = h;
    if (higherIsBetter ? v < worstV : v > worstV) worst = h;
  }
  const toPoint = (h: HistoryPoint): RecapPoint => ({
    value: round1((h[field] as number) ?? 0),
    date: dateLabelForTurn(world, currentTurn, h.turn),
    turn: h.turn
  });
  return {
    key,
    label: METRIC_LABEL[key],
    start: round1((history[0][field] as number) ?? 0),
    end: round1((history[history.length - 1][field] as number) ?? 0),
    best: toPoint(best),
    worst: toPoint(worst)
  };
}

export function buildRecapSummary(input: RecapInput): RecapSummary {
  const { history, world, turn, politics } = input;
  const fields: [RecapMetricKey, keyof HistoryPoint][] = [
    ['inflation', 'inflation'], ['unemployment', 'unemployment'], ['growth', 'growth'],
    ['fiscal', 'fiscal'], ['debt', 'debt'], ['happiness', 'happiness'],
    ['stability', 'stability'], ['opposition', 'opposition']
  ];
  return {
    startDate: dateLabelForTurn(world, turn, history[0]?.turn ?? 1),
    endDate: dateLabelForTurn(world, turn, history[history.length - 1]?.turn ?? turn),
    years: Math.round(((history[history.length - 1]?.turn ?? turn) - (history[0]?.turn ?? 1)) / 12 * 10) / 10,
    turns: history.length,
    electionsWon: politics.electionsWon,
    metrics: fields.map(([key, field]) => buildMetric(key, history, field, world, turn))
  };
}

const metricOf = (summary: RecapSummary, key: RecapMetricKey) => summary.metrics.find((m) => m.key === key)!;

const hasMilestone = (ms: Milestone[], kind: Milestone['kind']) => ms.some((m) => m.kind === kind);
const firstTurn = (ms: Milestone[], kind: Milestone['kind']) => ms.find((m) => m.kind === kind)?.turn ?? Infinity;

export function computeAchievements(input: RecapInput, summary: RecapSummary): Achievement[] {
  const { milestones, politics, moral, turn } = input;
  const out: Achievement[] = [];

  const inflation = metricOf(summary, 'inflation');
  if (inflation.worst.value >= 50 && inflation.end < 15 && inflation.worst.value - inflation.end >= 20) {
    out.push({
      id: 'fenix', emoji: '🔥',
      title: 'El Fenix',
      detail: `La inflacion llego a ${inflation.worst.value}% (${inflation.worst.date}) y cerraste en ${inflation.end}%.`
    });
  }
  if (inflation.worst.value >= 150 && inflation.end < 80) {
    out.push({
      id: 'contra_hiperinflacion', emoji: '💸',
      title: 'Al borde de la hiperinflacion',
      detail: `Llegaste a ${inflation.worst.value}% de inflacion (${inflation.worst.date}) y evitaste que la moneda volara por los aires.`
    });
  }

  const fiscal = metricOf(summary, 'fiscal');
  if (fiscal.worst.value <= -4 && fiscal.end >= 0) {
    out.push({
      id: 'cirujano_fiscal', emoji: '🩺',
      title: 'Cirujano Fiscal',
      detail: `Diste vuelta un rojo de ${fiscal.worst.value}% del PBI (${fiscal.worst.date}) a un superavit de ${fiscal.end}%.`
    });
  }

  const stability = metricOf(summary, 'stability');
  if (stability.worst.value < 20 && input.player.population.stability > 8) {
    out.push({
      id: 'borde_del_abismo', emoji: '⚠️',
      title: 'Al borde del abismo',
      detail: `La estabilidad cayo a ${stability.worst.value} (${stability.worst.date}), a un paso del golpe, y la sostuviste.`
    });
  }

  if (!hasMilestone(milestones, 'mayoria_perdida') && turn >= 24) {
    out.push({
      id: 'mano_dura_institucional', emoji: '🏛️',
      title: 'Mano Dura Institucional',
      detail: 'Nunca perdiste la mayoria propia en el Congreso.'
    });
  }

  const setbackTurn = Math.min(firstTurn(milestones, 'mayoria_perdida'), firstTurn(milestones, 'medio_termino_perdido'));
  const comebackTurn = firstTurn(milestones, 'eleccion_ganada');
  if (hasMilestone(milestones, 'eleccion_ganada') && setbackTurn < comebackTurn) {
    out.push({
      id: 'segundo_aire', emoji: '🌬️',
      title: 'Segundo Aire',
      detail: 'Perdiste terreno institucional en el camino y despues volviste a ganar una eleccion presidencial.'
    });
  }

  if (politics.electionsWon >= 2) {
    out.push({
      id: 'reelecto', emoji: '🗳️',
      title: 'Reelecto',
      detail: `Ganaste ${politics.electionsWon} elecciones presidenciales.`
    });
  }

  if (turn >= 96) {
    out.push({
      id: 'maratonista_del_poder', emoji: '⏳',
      title: 'Maratonista del Poder',
      detail: `${summary.years} anios de gestion, entre vos y tus sucesores.`
    });
  }

  if (hasMilestone(milestones, 'calle_apaga') && firstTurn(milestones, 'calle_apaga') > firstTurn(milestones, 'calle_prende')) {
    out.push({
      id: 'domador_de_la_calle', emoji: '🕊️',
      title: 'Domador de la Calle',
      detail: 'La presion de calle prendio por inflacion o desempleo altos y lograste apagarla sin que el gobierno cayera.'
    });
  }

  const coalitionMoves = milestones.filter((m) => m.kind === 'ministro_coalicion').length;
  if (coalitionMoves >= 2) {
    out.push({
      id: 'concesiones_de_poder', emoji: '🤝',
      title: 'Concesiones de Poder',
      detail: `Sumaste ${coalitionMoves} ministros de otros partidos para sostener el gobierno.`
    });
  }

  if (moral.onboarded) {
    const maxCorruptionLevel = Math.max(
      0, ...milestones.filter((m) => m.kind === 'corrupcion_sube').map((m) => m.value ?? 0)
    );
    const maxInvestigacionLevel = Math.max(
      0, ...milestones.filter((m) => m.kind === 'investigacion_sube').map((m) => m.value ?? 0)
    );
    if (maxCorruptionLevel < 36) {
      out.push({
        id: 'manos_limpias', emoji: '🕊️',
        title: 'Manos Limpias',
        detail: 'La corrupcion nunca paso de "manchas menores" en toda tu gestion.'
      });
    }
    if (maxCorruptionLevel >= 56 && maxInvestigacionLevel < 81) {
      out.push({
        id: 'el_padrino', emoji: '🎩',
        title: 'El Padrino',
        detail: 'Gobernaste con el sistema capturado por la corrupcion y nunca te atraparon.'
      });
    }
  }

  return out;
}
