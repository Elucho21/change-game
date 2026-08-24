/**
 * Sistema Moral (Corrupcion, Justicia, Enrique Grook, lideres minoritarios),
 * Change World Game v1.1.
 *
 * Mismo patron que lib/pension.ts: estado puro solo del jugador, enganchado
 * en endTurn (lib/store.ts) despues del resto del tick.
 *
 * Simplificaciones deliberadas respecto del documento de diseño original
 * (ver plan de la sesion): la Suprema Corte y la Comision NO son 5 jueces
 * con nombre — son dos diales (`corteIntegrity`/`corteLealtad`) que las
 * cartas de Enrique mueven directo. La integridad de la Comision no se
 * guarda: se deriva de los escanos propios ya existentes en `Politics`.
 * Las formulas del doc estan pensadas en cadencia trimestral y con
 * magnitudes que llevan Progreso de Investigaciones a 100 en menos de un
 * año aplicadas tal cual — se reescalan a incrementos mensuales donde la
 * CORRUPCION PROPIA es el driver dominante (no la independencia judicial
 * de fondo), para que el jugador sienta que las investigaciones responden
 * a lo que el hace, no a un ruido de fondo que no controla.
 */

import { totalSeats, type Politics } from './politics';
import type { MoralEffects, MoralState } from './types';

export type { MoralState };

export const MINORITY_CAPS = { gustavo: 8, amalia: 5, jhon: 9 } as const;

export const defaultMoral = (): MoralState => ({
  corruption: 21,
  investigacion: 0,
  corteIntegrity: 55,
  corteLealtad: 40,
  favoresActivos: 0,
  environmentIndex: 55,
  securityIndex: 45,
  scandalFactor: 0,
  onboarded: false,
  gustavoApoyo: 2,
  amaliaApoyo: 1,
  jhonApoyo: 2
});

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * Integridad efectiva de la Comision, derivada de los escanos propios
 * (no se guarda como estado propio). Mas mayoria = mas controlable, nunca
 * a 0: siempre le queda margen de accion.
 */
export function comisionIntegrityEffective(politics: Politics, coalitionSeats = 0): number {
  return clamp(70 - totalSeats(politics, coalitionSeats) * 0.4, 20, 90);
}

export interface MoralTickInput {
  happiness: number;
  unemployment: number;
  hasMajority: boolean;
  /** mayoria solida (> 65 escanos totales): bonus extra al freno de investigaciones */
  strongMajority: boolean;
  comisionIntegrity: number;
}

export interface MoralTickResult {
  state: MoralState;
  /** Delta.happiness a aplicar por el nivel de corrupcion (solo en 56+) */
  happinessDelta: number;
}

/** Avanza el sistema moral un mes. Pura: no muta `prev`. */
export function tickMoral(prev: MoralState, input: MoralTickInput): MoralTickResult {
  // corrupcion: decae sola si el pueblo esta contento (nadie la alimenta),
  // sube de a poco si el pueblo esta descontento (opacidad sistemica) -
  // los actos puntuales (moralEffects de decisiones/eventos) ya se aplicaron
  // ANTES de este tick, via applyMoralEffects
  const corruptionDrift = input.happiness > 55 ? -0.3 : input.happiness < 40 ? 0.2 : -0.05;
  const corruption = clamp(round(prev.corruption + corruptionDrift), 0, 100);

  const majorityBonus = (input.hasMajority ? 1.2 : 0) + (input.strongMajority ? 0.6 : 0);
  const deltaInvestigacion =
    (corruption / 100) * 3.5
    + (100 - input.happiness) * 0.02
    + prev.corteIntegrity * 0.015
    + input.comisionIntegrity * 0.01
    + prev.scandalFactor * 0.06
    - prev.favoresActivos * 0.07
    - majorityBonus;
  const investigacion = clamp(round(prev.investigacion + deltaInvestigacion), 0, 100);

  const favoresActivos = clamp(round(prev.favoresActivos - 2), 0, 40);
  const scandalFactor = clamp(round(prev.scandalFactor - 5), 0, 30);
  const environmentIndex = clamp(round(prev.environmentIndex + (50 - prev.environmentIndex) * 0.03), 0, 100);
  const securityIndex = clamp(round(prev.securityIndex + (50 - prev.securityIndex) * 0.03), 0, 100);

  // los 3 lideres minoritarios convergen hacia un target segun sus propios
  // drivers, mismo patron que driftOpposition (lib/politics.ts)
  const targetGustavo = clamp((input.unemployment - 5) * 0.6 + (60 - input.happiness) * 0.05, 0, MINORITY_CAPS.gustavo);
  const targetAmalia = clamp((60 - prev.environmentIndex) * 0.08 + Math.max(0, corruption - 20) * 0.02, 0, MINORITY_CAPS.amalia);
  const targetJhon = clamp((prev.securityIndex - 30) * 0.15 + Math.max(0, corruption - 30) * 0.03, 0, MINORITY_CAPS.jhon);

  const converge = (current: number, target: number, cap: number) =>
    clamp(round(current + (target - current) * 0.1), 0, cap);

  const gustavoApoyo = converge(prev.gustavoApoyo, targetGustavo, MINORITY_CAPS.gustavo);
  const amaliaApoyo = converge(prev.amaliaApoyo, targetAmalia, MINORITY_CAPS.amalia);
  const jhonApoyo = converge(prev.jhonApoyo, targetJhon, MINORITY_CAPS.jhon);

  // consecuencia mecanica del nivel de corrupcion sobre la felicidad
  // (seccion 5.6 del doc): recien pega fuerte en los dos tramos altos
  const happinessDelta = corruption > 75 ? -0.4 : corruption > 55 ? -0.15 : 0;

  return {
    state: {
      ...prev,
      corruption, investigacion, favoresActivos, scandalFactor,
      environmentIndex, securityIndex, gustavoApoyo, amaliaApoyo, jhonApoyo
    },
    happinessDelta
  };
}

// ============================================================
// NIVELES (para mostrar nombre/color en la UI)
// ============================================================

export interface MoralLevel {
  min: number;
  label: string;
  detail: string;
}

export const CORRUPTION_LEVELS: MoralLevel[] = [
  { min: 0, label: 'Limpio', detail: 'Investigaciones muy lentas. Bonus leve de imagen.' },
  { min: 16, label: 'Manchas menores', detail: 'Investigaciones normales. Poco ruido.' },
  { min: 36, label: 'Corrupcion estructural', detail: 'Investigaciones mas activas. Enrique aparece mas.' },
  { min: 56, label: 'Sistema capturado', detail: 'Alto riesgo de escandalos. Comision y Corte se activan.' },
  { min: 76, label: 'Putrefaccion', detail: 'Crisis institucional posible. La caida del gobierno entra en el radar.' }
];

export const INVESTIGACION_LEVELS: MoralLevel[] = [
  { min: 0, label: 'Bajo', detail: 'Casi no pasa nada.' },
  { min: 26, label: 'Seguimiento', detail: 'Enrique aparece mas. Algunas cartas de presion.' },
  { min: 46, label: 'Investigacion activa', detail: 'Posibles pedidos de informes, testigos, medidas cautelares.' },
  { min: 66, label: 'Peligro real', detail: 'Riesgo de juicios politicos, destitucion de ministros, fallos adversos.' },
  { min: 81, label: 'Crisis institucional', detail: 'Posible juicio politico al presidente o caida del gobierno.' }
];

export function levelOf(value: number, table: MoralLevel[]): MoralLevel {
  let current = table[0];
  for (const l of table) {
    if (value >= l.min) current = l;
  }
  return current;
}

// ============================================================
// LEVER de decisiones/eventos (moralEffects)
// ============================================================

/** Aplica un MoralEffects (lib/types.ts) sobre el estado. Pura: no muta `state`. */
export function applyMoralEffects(state: MoralState, effects: MoralEffects): MoralState {
  return {
    ...state,
    corruption: clamp(round(state.corruption + (effects.corruption ?? 0)), 0, 100),
    investigacion: clamp(round(state.investigacion + (effects.investigacion ?? 0)), 0, 100),
    corteIntegrity: clamp(round(state.corteIntegrity + (effects.corteIntegrity ?? 0)), 0, 100),
    corteLealtad: clamp(round(state.corteLealtad + (effects.corteLealtad ?? 0)), 0, 100),
    favoresActivos: clamp(round(state.favoresActivos + (effects.favoresActivos ?? 0)), 0, 40),
    environmentIndex: clamp(round(state.environmentIndex + (effects.environmentIndex ?? 0)), 0, 100),
    securityIndex: clamp(round(state.securityIndex + (effects.securityIndex ?? 0)), 0, 100),
    scandalFactor: clamp(round(state.scandalFactor + (effects.scandalFactor ?? 0)), 0, 30),
    gustavoApoyo: clamp(round(state.gustavoApoyo + (effects.gustavoApoyo ?? 0)), 0, MINORITY_CAPS.gustavo),
    amaliaApoyo: clamp(round(state.amaliaApoyo + (effects.amaliaApoyo ?? 0)), 0, MINORITY_CAPS.amalia),
    jhonApoyo: clamp(round(state.jhonApoyo + (effects.jhonApoyo ?? 0)), 0, MINORITY_CAPS.jhon)
  };
}

// ============================================================
// PREVIEW (docs/UX_Cartas_Personajes_Emblemas_Banderas.md: "preview de
// impacto visible antes de confirmar" en cada opcion de EventCard)
// ============================================================

const MORAL_LABELS: Record<keyof MoralEffects, string> = {
  corruption: 'Corrupcion',
  investigacion: 'Investigaciones',
  corteIntegrity: 'Integridad Corte',
  corteLealtad: 'Lealtad Corte',
  favoresActivos: 'Favores activos',
  environmentIndex: 'Indice ambiental',
  securityIndex: 'Inseguridad',
  scandalFactor: 'Escandalo',
  gustavoApoyo: 'Apoyo Gustavo',
  amaliaApoyo: 'Apoyo Amalia',
  jhonApoyo: 'Apoyo Jhon'
};

/** Subir esto es malo para el jugador (a diferencia de corteIntegrity/environmentIndex, donde subir es bueno). */
const MORAL_BAD_WHEN_UP: (keyof MoralEffects)[] = [
  'corruption', 'investigacion', 'corteLealtad', 'favoresActivos',
  'securityIndex', 'scandalFactor', 'gustavoApoyo', 'amaliaApoyo', 'jhonApoyo'
];

export interface MoralPreviewItem {
  key: string;
  label: string;
  value: number;
  tone: 'bueno' | 'malo';
}

/** Mismo shape/criterio que `previewDelta` (lib/engine.ts), version MoralEffects. */
export function previewMoralDelta(effects: MoralEffects): MoralPreviewItem[] {
  return (Object.keys(effects) as (keyof MoralEffects)[])
    .filter((k) => effects[k] !== undefined && effects[k] !== 0)
    .map((k) => {
      const v = effects[k] as number;
      const bad = MORAL_BAD_WHEN_UP.includes(k) ? v > 0 : v < 0;
      return { key: k, label: MORAL_LABELS[k] ?? k, value: v, tone: bad ? 'malo' : 'bueno' as const };
    });
}
