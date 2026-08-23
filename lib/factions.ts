/**
 * Facciones de gasto — modifican costo de gasto vs ajuste.
 * Modulo PURO para que Opus lo enganche en runPlan / coalitionDemand.
 * Ver docs/PEDIDOS_A_OPUS_23_37.md (#25).
 */

export type Faction = 'pragmatico' | 'sindical' | 'liberal' | 'oposicion';

export function factionOfMinister(m: {
  id: string;
  title: string;
  party: string;
}): Faction {
  if (m.party === 'oposicion') return 'oposicion';
  const key = `${m.id} ${m.title}`.toLowerCase();
  if (/sindical|dialoguista|operador|pereyra|quiroga|brizuela/.test(key)) {
    return 'sindical';
  }
  if (/liberal|ortodox|monetar|koren|aramburu/.test(key)) {
    return 'liberal';
  }
  return 'pragmatico';
}

export type PolicyKind = 'gasto' | 'ajuste' | 'otro';

/** Heuristica por id de decision — Opus puede reemplazar por tags. */
export function policyKindOf(decisionId: string): PolicyKind {
  if (
    /obra|paritaria|vivienda|subsidio|gasto|fondos|emergencia_sanitaria|plan_/.test(
      decisionId
    )
  ) {
    return 'gasto';
  }
  if (/ajuste|subir_impuesto|subir_tasa|auditoria|regla_fiscal|devaluar/.test(decisionId)) {
    return 'ajuste';
  }
  return 'otro';
}

export function factionCostFactor(factions: Faction[], kind: PolicyKind): number {
  if (kind === 'otro') return 1;
  let f = 1;
  for (const x of factions) {
    if (kind === 'gasto') {
      if (x === 'sindical') f *= 0.9;
      if (x === 'liberal') f *= 1.15;
    }
    if (kind === 'ajuste') {
      if (x === 'liberal') f *= 0.9;
      if (x === 'sindical') f *= 1.2;
    }
  }
  return Math.round(f * 100) / 100;
}
