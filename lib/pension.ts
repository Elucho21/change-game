/**
 * Sistema previsional (jubilaciones), Change World Game v1.0.
 *
 * Mismo patron que lib/fx.ts / lib/imf.ts: estado puro solo del jugador
 * Semilla por pais en engine/countries_mvp.json -> social. Enganchado en
 * deterministicTick (lib/simulation.ts) despues de naturalDrift.
 *
 * El resultado previsional (aportes recaudados vs gasto en haberes, en %
 * del PBI) se asienta en fiscal_balance solo cuando cambia respecto del
 * turno anterior — el mismo patron de "tramo nuevo" que taxFiscalApplied
 * en lib/engine.ts, para que una reforma mueva la caja una vez y no la
 * economia entera arranque ya con un flujo desconocido metido adentro.
 */

import gen from './data/countries.gen.json';

export interface PensionState {
  retirementAgeMen: number;
  retirementAgeWomen: number;
  /** aporte del trabajador, fraccion del salario (0.11 = 11%) */
  contribWorker: number;
  /** aporte del empleador, fraccion del salario */
  contribEmployer: number;
  /** tasa de reemplazo promedio sobre el ultimo salario */
  replacementRate: number;
  /** cobertura del sistema, fraccion de ocupados que aporta */
  coverage: number;
  /** morosidad / evasion, fraccion que deberia aportar y no aporta */
  evasion: number;
  /** jubilados / activos. Sube solo (envejecimiento), no hay reforma que lo baje directo. */
  dependencyRatio: number;
  /** ultimo resultado previsional (% PBI) ya asentado en fiscal_balance */
  resultApplied: number;
}

/** Masa salarial como fraccion del PBI. Valor fijo del paquete de diseño (~60%). */
export const WAGE_MASS_SHARE = 0.6;
/** Envejecimiento lento: cuanto sube la dependencia previsional por mes. */
export const DEPENDENCY_DRIFT = 0.0003;

/** Resultado previsional del mes, en puntos de PBI (positivo = superavit). */
export function pensionResultPctGdp(s: PensionState): number {
  const revenue = (s.contribWorker + s.contribEmployer) * WAGE_MASS_SHARE * s.coverage * (1 - s.evasion);
  const spend = s.dependencyRatio * s.replacementRate * WAGE_MASS_SHARE;
  return Math.round((revenue - spend) * 1000) / 10;
}

type GenFile = { countries: Record<string, { social?: {
  retirement_age_men: number; retirement_age_women: number;
  contrib_worker: number; contrib_employer: number; replacement_rate: number;
  coverage: number; evasion: number; dependency_ratio: number;
} }> };

function baseFromSocial(s: NonNullable<GenFile['countries'][string]['social']>) {
  return {
    retirementAgeMen: s.retirement_age_men,
    retirementAgeWomen: s.retirement_age_women,
    contribWorker: s.contrib_worker,
    contribEmployer: s.contrib_employer,
    replacementRate: s.replacement_rate,
    coverage: s.coverage,
    evasion: s.evasion,
    dependencyRatio: s.dependency_ratio
  };
}

const FALLBACK_BASE = {
  retirementAgeMen: 65,
  retirementAgeWomen: 60,
  contribWorker: 0.11,
  contribEmployer: 0.16,
  replacementRate: 0.65,
  coverage: 0.72,
  evasion: 0.18,
  dependencyRatio: 0.22
};

function withApplied(base: Omit<PensionState, 'resultApplied'>): PensionState {
  return { ...base, resultApplied: pensionResultPctGdp({ ...base, resultApplied: 0 }) };
}

/** Semilla previsional del pais elegido. Si no hay ficha social, fallback v1.0. */
export function pensionFromCountry(code: string): PensionState {
  const s = (gen as GenFile).countries[code]?.social;
  return withApplied(s ? baseFromSocial(s) : FALLBACK_BASE);
}

export const defaultPension = (): PensionState => withApplied(FALLBACK_BASE);

export interface PensionTickResult {
  state: PensionState;
  /** delta a aplicar sobre fiscal_balance este turno (Delta.fiscal_balance) */
  fiscalDelta: number;
}

/** Avanza el sistema previsional un mes. Pura: no muta `prev`. */
export function tickPension(prev: PensionState): PensionTickResult {
  const next: PensionState = { ...prev, dependencyRatio: prev.dependencyRatio + DEPENDENCY_DRIFT };
  const result = pensionResultPctGdp(next);
  const fiscalDelta = Math.round((result - prev.resultApplied) * 100) / 100;
  next.resultApplied = result;
  return { state: next, fiscalDelta };
}

// ============================================================
// REFORMAS: coste de Capital Politico
// ============================================================

/**
 * Coste base en Capital Politico (magnitud positiva, mismo signo que
 * `Decision.cost.capital` en el resto del juego), tabla del paquete v1.0.
 * `aumentar_cobertura` no esta: es la unica reforma "win-win" del Excel,
 * su ganancia de capital vive en `Decision.effects.capital`, no aca.
 */
export const PENSION_REFORM_BASE_COST: Record<string, number> = {
  subir_edad_jubilacion: 4,
  igualar_edad_hm: 7,
  subir_aporte_trabajador: 6,
  subir_aporte_empleador: 5,
  bajar_tasa_reemplazo: 11,
  mejorar_fiscalizacion: 3,
  eliminar_privilegios: 7
};

export interface PensionReformCtx {
  /** fiscal_balance < -3: la crisis visible abarata la reforma */
  crisisFiscal: boolean;
  /** superavit + inflacion baja: mismo efecto, la confianza abarata la reforma */
  surplusLowInflation: boolean;
  /** capital politico > 15: gobierno fuerte, reforma un poco mas barata */
  capitalHigh: boolean;
}

/**
 * Multiplicador de coste para decisiones de categoria 'previsional', para
 * usar junto al resto de los factores de lib/store.ts `decisionCost`.
 * Moduladores del paquete v1.0: crisis fiscal visible y superavit+inflacion
 * baja bajan el coste 20-40% cada uno (no acumulativo mas alla de un piso),
 * capital politico alto un poco mas.
 */
export function pensionReformCostMultiplier(ctx: PensionReformCtx): number {
  let mult = 1;
  if (ctx.crisisFiscal) mult -= 0.35;
  if (ctx.surplusLowInflation) mult -= 0.3;
  if (ctx.capitalHigh) mult -= 0.1;
  return Math.max(0.4, mult);
}

/**
 * Aplica una reforma previsional sobre el estado (lib/decisions.ts, seccion
 * PREVISIONAL). Pura: no muta `state`. `eliminar_privilegios` no toca ningun
 * parametro tocable (es una reforma de "quien cobra de mas", no de la caja
 * general) — su efecto es solo el coste/beneficio de Capital Politico que ya
 * trae la Decision.
 */
export function applyPensionReform(state: PensionState, reformId: string): PensionState {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  switch (reformId) {
    case 'subir_edad_jubilacion':
      return { ...state, retirementAgeMen: state.retirementAgeMen + 2, retirementAgeWomen: state.retirementAgeWomen + 2 };
    case 'igualar_edad_hm':
      return { ...state, retirementAgeWomen: state.retirementAgeMen };
    case 'subir_aporte_trabajador':
      return { ...state, contribWorker: clamp01(state.contribWorker + 0.02) };
    case 'subir_aporte_empleador':
      return { ...state, contribEmployer: clamp01(state.contribEmployer + 0.02) };
    case 'bajar_tasa_reemplazo':
      return { ...state, replacementRate: clamp01(state.replacementRate - 0.1) };
    case 'mejorar_fiscalizacion':
      return { ...state, evasion: clamp01(state.evasion - 0.06) };
    case 'aumentar_cobertura':
      return { ...state, coverage: clamp01(state.coverage + 0.08) };
    default:
      return state;
  }
}
