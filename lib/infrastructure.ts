/**
 * Infraestructura del jugador (Change World Game v1.3, pedido de Grok en
 * docs/INFRAESTRUCTURA_Y_DECISIONES_CONTEXTUALES.md).
 *
 * Sin sub-regiones (no existen en el motor hoy: `Country.region` es solo una
 * etiqueta continental): las 4 obras se construyen "en el pais", se dibujan
 * en el globo sobre la capital del jugador. Maximo una de cada tipo en toda
 * la partida (`once: true` en las decisiones de lib/decisions.ts).
 */

import type { Delta } from './types';

export type InfraType = 'aeropuerto' | 'puerto_aguas_profundas' | 'base_militar' | 'centro_datos_ia';

export interface InfrastructureItem {
  id: string;
  type: InfraType;
  /** meses que faltan. 0 = operativa: desde ahi entrega `passive` todos los meses. */
  turnsLeft: number;
  totalTurns: number;
}

export interface InfrastructureState {
  items: InfrastructureItem[];
}

export const defaultInfrastructure = (): InfrastructureState => ({ items: [] });

export interface InfraConfig {
  label: string;
  emoji: string;
  costCapital: number;
  costFiscal: number;
  buildTurns: number;
  /** estabilidad minima (population.stability) para poder construirla */
  minStability: number;
  /** corrupcion maxima (moral.corruption) por encima de la cual no se puede construir */
  maxCorruption: number;
  /** bono que entrega cada mes desde que queda operativa */
  passive: Delta;
}

export const INFRA_CONFIG: Record<InfraType, InfraConfig> = {
  aeropuerto: {
    label: 'Aeropuerto Internacional', emoji: '✈️',
    costCapital: 16, costFiscal: 2.0, buildTurns: 4,
    minStability: 40, maxCorruption: 65,
    passive: { gdp_growth: 0.05, happiness: 0.03 }
  },
  puerto_aguas_profundas: {
    label: 'Puerto de Aguas Profundas', emoji: '🚢',
    costCapital: 20, costFiscal: 3.0, buildTurns: 6,
    minStability: 45, maxCorruption: 60,
    passive: { gdp_growth: 0.08, fiscal_balance: 0.04 }
  },
  base_militar: {
    label: 'Base Militar', emoji: '🪖',
    costCapital: 22, costFiscal: 3.5, buildTurns: 6,
    minStability: 50, maxCorruption: 55,
    passive: { stability: 0.07 }
  },
  centro_datos_ia: {
    label: 'Centro de Datos IA', emoji: '🖥️',
    costCapital: 25, costFiscal: 4.0, buildTurns: 5,
    minStability: 55, maxCorruption: 45,
    passive: { gdp_growth: 0.10, happiness: 0.02 }
  }
};

/**
 * Recargo sobre el costo de construir por corrupcion (moral.corruption):
 * la obra publica grande es donde mas se filtra la coima. Aplica al costo
 * de capital (decisionCost, lib/store.ts) y al de caja (runPlan/applyDecisionTo).
 */
export function corruptionCostMultiplier(corruption: number): number {
  if (corruption < 30) return 1;
  if (corruption < 60) return 1.2;
  if (corruption < 80) return 1.5;
  return 1.8;
}

function addPassive(acc: Delta, passive: Delta) {
  for (const key of Object.keys(passive) as (keyof Delta)[]) {
    const v = passive[key];
    if (v === undefined) continue;
    acc[key] = Math.round(((acc[key] ?? 0) + v) * 1000) / 1000;
  }
}

export interface InfrastructureTickResult {
  state: InfrastructureState;
  /** suma de `passive` de toda obra ya operativa este mes (se aplica todos los meses, no solo al completar) */
  passiveDeltas: Delta;
  /** obras que pasaron de "en obra" a "operativa" recien este tick, para narrar en el feed */
  justCompleted: InfrastructureItem[];
}

/** Que tipo de obra construye cada decision de categoria 'infraestructura' (lib/decisions.ts). */
export const INFRA_DECISION_TYPE: Record<string, InfraType> = {
  construir_aeropuerto: 'aeropuerto',
  construir_puerto: 'puerto_aguas_profundas',
  construir_base_militar: 'base_militar',
  construir_datacenter: 'centro_datos_ia'
};

/**
 * Arma el item nuevo al construir: costo de caja y plazo suben con la
 * corrupcion (`corruptionCostMultiplier`); corrupcion > 60 ademas alarga la
 * obra un 15% (los sobornos no compran velocidad, la burocracia paralela si
 * la frena). Pura.
 */
export function startInfrastructure(
  type: InfraType, corruption: number
): { item: InfrastructureItem; fiscalCost: number } {
  const cfg = INFRA_CONFIG[type];
  const mult = corruptionCostMultiplier(corruption);
  const buildTurns = corruption > 60 ? Math.round(cfg.buildTurns * 1.15) : cfg.buildTurns;
  return {
    // `once: true` en la decision garantiza una sola obra por tipo en toda la
    // partida, asi que el tipo alcanza como id estable (y la funcion queda pura)
    item: { id: type, type, turnsLeft: buildTurns, totalTurns: buildTurns },
    fiscalCost: Math.round(cfg.costFiscal * mult * 100) / 100
  };
}

/** Avanza la cuenta regresiva de cada obra un mes. Pura: no muta `prev`. */
export function tickInfrastructure(prev: InfrastructureState): InfrastructureTickResult {
  const items: InfrastructureItem[] = [];
  const justCompleted: InfrastructureItem[] = [];
  const passiveDeltas: Delta = {};

  for (const item of prev.items) {
    if (item.turnsLeft <= 0) {
      items.push(item);
      addPassive(passiveDeltas, INFRA_CONFIG[item.type].passive);
      continue;
    }
    const next: InfrastructureItem = { ...item, turnsLeft: item.turnsLeft - 1 };
    items.push(next);
    if (next.turnsLeft <= 0) {
      justCompleted.push(next);
      addPassive(passiveDeltas, INFRA_CONFIG[next.type].passive);
    }
  }

  return { state: { items }, passiveDeltas, justCompleted };
}
