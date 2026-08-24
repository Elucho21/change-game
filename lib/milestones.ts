/**
 * Hitos de la partida: eventos institucionales/politicos que no quedan bien
 * representados en `history` (que solo guarda numeros por turno) ni sobreviven
 * en `feed` (se corta a los 200 items mas recientes). Se acumulan sin recorte
 * fuerte durante toda la partida y alimentan la pantalla de fin de partida
 * (components/EndGameScreen.tsx): la linea de tiempo y los logros de
 * lib/recap.ts, que buscan patrones como "perdiste la mayoria" seguido mas
 * tarde de "ganaste una eleccion".
 */

import { coalitionSeats, ministerById, SEAT_LABEL, type Cabinet } from './cabinet';
import { hasMajority, type Politics } from './politics';
import { CORRUPTION_LEVELS, INVESTIGACION_LEVELS, levelOf, MINORITY_CAPS } from './moral';
import type { MoralState } from './types';
import type { ImfState } from './imf';

export type MilestoneKind =
  | 'mayoria_perdida' | 'mayoria_recuperada'
  | 'coalicion_rota' | 'ministro_coalicion' | 'coalicion_sumada'
  | 'corrupcion_sube' | 'corrupcion_baja'
  | 'investigacion_sube' | 'investigacion_baja'
  | 'presion_minoritaria'
  | 'imf' | 'calle_prende' | 'calle_apaga'
  | 'eleccion_ganada' | 'eleccion_perdida' | 'ballotage'
  | 'medio_termino_ganado' | 'medio_termino_perdido'
  | 'fin_de_partida';

export interface Milestone {
  turn: number;
  date: string;
  kind: MilestoneKind;
  emoji: string;
  title: string;
  body: string;
  tone: 'bueno' | 'malo' | 'neutral';
  /** lectura numerica del hito (nivel cruzado, etc.), para que lib/recap.ts filtre sin parsear texto */
  value?: number;
}

const LEADER_NAME: Record<'gustavo' | 'amalia' | 'jhon', string> = {
  gustavo: 'Gustavo Comun (Partido Comunista)',
  amalia: 'Amalia Verde (Partido Verde)',
  jhon: 'Jhon el Duro (Ultra-Derecha)'
};

export interface MilestoneCtx {
  turn: number;
  date: string;
  cabinetBefore: Cabinet;
  cabinetAfter: Cabinet;
  politicsBefore: Politics;
  politicsAfter: Politics;
  moralBefore: MoralState;
  moralAfter: MoralState;
  imfStageBefore: ImfState['stage'];
  imfStageAfter: ImfState['stage'];
  imfLabel: string;
  streetWeightBefore: number;
  streetWeightAfter: number;
}

/**
 * Detecta hitos comparando el estado antes/despues del turno. Pura: no muta
 * nada, solo lee. Se llama una vez por turno desde `endTurn` (lib/store.ts)
 * con el estado ya resuelto (post-tick), y sus resultados se appendean a
 * `milestones` sin pisar los de turnos anteriores.
 */
export function buildMilestones(ctx: MilestoneCtx): Milestone[] {
  const out: Milestone[] = [];
  const push = (
    kind: MilestoneKind, emoji: string, title: string, body: string,
    tone: Milestone['tone'], value?: number
  ) => out.push({ turn: ctx.turn, date: ctx.date, kind, emoji, title, body, tone, value });

  // ---------------------------------------------------------- mayoria parlamentaria
  const seatsBefore = coalitionSeats(ctx.cabinetBefore);
  const seatsAfter = coalitionSeats(ctx.cabinetAfter);
  const hadMajority = hasMajority(ctx.politicsBefore, seatsBefore);
  const hasMajorityNow = hasMajority(ctx.politicsAfter, seatsAfter);
  if (hadMajority && !hasMajorityNow) {
    push(
      'mayoria_perdida', '🏛️', 'Perdes la mayoria en el Congreso',
      'Sin numeros propios, las medidas grandes hay que negociarlas una por una.',
      'malo'
    );
  } else if (!hadMajority && hasMajorityNow) {
    push(
      'mayoria_recuperada', '🏛️', 'Recuperas la mayoria en el Congreso',
      'Volves a tener numeros propios para gobernar sin pedirle permiso a nadie.',
      'bueno'
    );
  }

  // ---------------------------------------------------------- gabinete / coalicion
  const seats = new Set([...Object.keys(ctx.cabinetBefore), ...Object.keys(ctx.cabinetAfter)]);
  for (const seat of seats) {
    const before = ministerById(ctx.cabinetBefore[seat as keyof Cabinet]);
    const after = ministerById(ctx.cabinetAfter[seat as keyof Cabinet]);
    if (before?.id === after?.id) continue;
    if (before && before.party !== 'oficialismo') {
      push(
        'coalicion_rota', '💔', `${before.name} deja el gabinete`,
        `${SEAT_LABEL[seat as keyof typeof SEAT_LABEL]} pierde a su socio de coalicion.`,
        'malo'
      );
    }
    if (after && after.party !== 'oficialismo') {
      push(
        'ministro_coalicion', '🤝', `${after.name} entra al gabinete`,
        `Gesto de coalicion en ${SEAT_LABEL[seat as keyof typeof SEAT_LABEL]}: suma votos y escanos.`,
        'bueno'
      );
    }
  }

  // ---------------------------------------------------------- corrupcion / investigacion
  const corrBefore = levelOf(ctx.moralBefore.corruption, CORRUPTION_LEVELS);
  const corrAfter = levelOf(ctx.moralAfter.corruption, CORRUPTION_LEVELS);
  if (ctx.moralAfter.onboarded && corrAfter.min > corrBefore.min) {
    push(
      'corrupcion_sube', '🕴️', `Corrupcion: ${corrAfter.label}`,
      corrAfter.detail, 'malo', corrAfter.min
    );
  } else if (ctx.moralAfter.onboarded && corrAfter.min < corrBefore.min) {
    push(
      'corrupcion_baja', '🕊️', `Corrupcion: ${corrAfter.label}`,
      corrAfter.detail, 'bueno', corrAfter.min
    );
  }

  const invBefore = levelOf(ctx.moralBefore.investigacion, INVESTIGACION_LEVELS);
  const invAfter = levelOf(ctx.moralAfter.investigacion, INVESTIGACION_LEVELS);
  if (ctx.moralAfter.onboarded && invAfter.min > invBefore.min) {
    push(
      'investigacion_sube', '🔍', `Investigacion: ${invAfter.label}`,
      invAfter.detail, 'malo', invAfter.min
    );
  } else if (ctx.moralAfter.onboarded && invAfter.min < invBefore.min) {
    push(
      'investigacion_baja', '🔍', `Investigacion: ${invAfter.label}`,
      invAfter.detail, 'bueno', invAfter.min
    );
  }

  // ---------------------------------------------------------- presion de partidos minoritarios
  if (ctx.moralAfter.onboarded) {
    const checks: [keyof typeof LEADER_NAME, number, number, number][] = [
      ['gustavo', ctx.moralBefore.gustavoApoyo, ctx.moralAfter.gustavoApoyo, MINORITY_CAPS.gustavo],
      ['amalia', ctx.moralBefore.amaliaApoyo, ctx.moralAfter.amaliaApoyo, MINORITY_CAPS.amalia],
      ['jhon', ctx.moralBefore.jhonApoyo, ctx.moralAfter.jhonApoyo, MINORITY_CAPS.jhon]
    ];
    for (const [id, before, after, cap] of checks) {
      const threshold = cap * 0.7;
      if (before < threshold && after >= threshold) {
        push(
          'presion_minoritaria', '📣', `${LEADER_NAME[id]} presiona fuerte`,
          `Su apoyo llega a ${after}%, cerca de su techo historico. Empieza a condicionar la agenda.`,
          'malo'
        );
      }
    }
  }

  // ---------------------------------------------------------- FMI
  if (ctx.imfStageBefore !== ctx.imfStageAfter) {
    push(
      'imf', '🏦', ctx.imfLabel,
      ctx.imfStageAfter === 'exit'
        ? 'El pais sale del radar del Fondo.'
        : `El FMI pasa a mirar el pais como "${ctx.imfStageAfter}".`,
      ctx.imfStageAfter === 'exit' || ctx.imfStageAfter === 'none' ? 'bueno'
        : ctx.imfStageAfter === 'program' ? 'malo' : 'neutral'
    );
  }

  // ---------------------------------------------------------- presion de calle
  if (ctx.streetWeightBefore < 4 && ctx.streetWeightAfter >= 4) {
    push(
      'calle_prende', '🔥', 'La calle se calienta',
      'Inflacion y/o desempleo llevan meses altos: humor social y estabilidad gotean cada mes.',
      'malo'
    );
  } else if (ctx.streetWeightBefore >= 4 && ctx.streetWeightAfter < 4) {
    push(
      'calle_apaga', '🕊️', 'La calle se enfria',
      'Inflacion y desempleo volvieron a niveles sostenibles.',
      'bueno'
    );
  }

  return out;
}
