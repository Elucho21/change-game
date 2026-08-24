/**
 * Popularidad por sector (Change World Game v1.2): 5 grupos con intereses
 * distintos, capa PARALELA a `population.happiness` (lib/engine.ts). No la
 * reemplaza — felicidad sigue con su motor de siempre (renuncia forzada,
 * presion de calle, regen de capital, drift de corrupcion). Esto alimenta
 * `poll()` (lib/politics.ts) y empuja capital politico via el grupo 4
 * (medios), ademas de mover el objetivo de dos de los lideres minoritarios
 * (lib/moral.ts).
 *
 * Mismo patron que lib/moral.ts::tickMoral: cada grupo converge de a poco
 * hacia un `target` que depende de un puñado de señales economicas, con
 * pesos DISTINTOS por grupo — eso es lo que hace que subir impuestos, por
 * ejemplo, mueva a empresarios mucho mas que a la clase obrera.
 */

import type { ClassComposition, Country, GroupEffects, GroupKey, PopularGroupsState } from './types';

export const GROUP_KEYS: GroupKey[] = ['empresarios', 'claseMedia', 'obrera', 'alta', 'fieles'];

export const GROUP_LABEL: Record<GroupKey, string> = {
  empresarios: 'Empresarios y comerciantes',
  claseMedia: 'Clase media',
  obrera: 'Clase obrera',
  alta: 'Clase alta / oligarcas',
  fieles: 'Los fieles'
};

export const GROUP_BLURB: Record<GroupKey, string> = {
  empresarios: 'Priorizan inflacion baja, impuestos bajos y desregulacion. El desempleo casi no les importa.',
  claseMedia: 'Odian la corrupcion, la inflacion y el desempleo. Quieren impuestos bajos y buenos servicios a la vez.',
  obrera: 'En contra del desempleo y del capital concentrado. A favor de los sindicatos.',
  alta: 'Quieren favores y desregulacion, hasta que les toca el bolsillo propio. Manejan los medios.',
  fieles: 'Bancan al gobierno bajo casi cualquier circunstancia. Los ultimos en irse.'
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export const defaultPopularGroups = (): PopularGroupsState => ({
  empresarios: 50,
  claseMedia: 50,
  obrera: 50,
  alta: 50,
  fieles: 55,
  deregulationIndex: 50
});

// ============================================================
// COMPOSICION DE CLASE POR PAIS (peso poblacional de cada grupo)
// ============================================================

const clamp01 = (v: number) => clamp(v, 0, 1);

function normalize(raw: ClassComposition): ClassComposition {
  const total = raw.empresarios + raw.claseMedia + raw.obrera + raw.alta + raw.fieles;
  if (total <= 0) return { empresarios: 20, claseMedia: 30, obrera: 30, alta: 5, fieles: 15 };
  const scale = 100 / total;
  return {
    empresarios: round(raw.empresarios * scale, 1),
    claseMedia: round(raw.claseMedia * scale, 1),
    obrera: round(raw.obrera * scale, 1),
    alta: round(raw.alta * scale, 1),
    fieles: round(raw.fieles * scale, 1)
  };
}

/**
 * Composicion de clase por defecto, derivada de datos macro que YA EXISTEN
 * (PBI per capita, peso del sector comercio, estabilidad). Formula
 * deliberadamente simple: aproxima, no reemplaza el dato real que se le
 * pide a Grok (docs/PEDIDOS_A_GROK.md seccion 12) — existe solo para que
 * nada quede undefined mientras ese dato no llega.
 */
export function computeClassComposition(country: Country): ClassComposition {
  const gdpPerCapitaUsd = (country.economy.gdp_trillion_usd * 1e6) / Math.max(1, country.population.total_millions);
  // 0 = pais pobre (~3k per capita), 1 = pais rico (~60k+)
  const d = clamp01((gdpPerCapitaUsd - 3000) / 57000);
  const commercePct = country.sectors.commerce ?? 10;

  const claseMedia = 25 + d * 25;
  const empresarios = 5 + d * 10 + commercePct * 0.15;
  const alta = clamp(3 - d, 2, 4);
  const fieles = clamp(8 + (country.population.stability - 50) * 0.08, 5, 15);
  const obrera = Math.max(20, 100 - claseMedia - empresarios - alta - fieles);

  return normalize({ empresarios, claseMedia, obrera, alta, fieles });
}

/** Composicion de clase del pais: usa el dato real si Grok lo cargo, si no calcula el default. */
export function classCompositionFromCountry(country: Country): ClassComposition {
  return country.classComposition ?? computeClassComposition(country);
}

// ============================================================
// TICK DINAMICO
// ============================================================

export interface GroupsTickInput {
  inflation: number;
  /** prevInflation - inflation. positivo = la inflacion esta bajando. */
  inflationTrend: number;
  unemployment: number;
  /** promedio de IVA, ganancias y corporativo: presion impositiva general */
  taxAvg: number;
  taxCorporate: number;
  fiscalBalance: number;
  gdpGrowth: number;
  corruption: number;
  /** cabinetUnionPower + empuje sindical del gabinete */
  unionPower: number;
  happiness: number;
}

const converge = (current: number, target: number, rate: number, floor = 0, ceil = 100) =>
  clamp(round(current + (target - current) * rate), floor, ceil);

/** Avanza los 5 grupos un mes. Pura: no muta `prev`. */
export function tickPopularGroups(prev: PopularGroupsState, input: GroupsTickInput): PopularGroupsState {
  // empresarios: inflacion (nivel y tendencia) y presion impositiva pesan
  // fuerte, el desempleo casi no les importa
  const targetEmpresarios = clamp(
    55
    - Math.max(0, input.inflation - 10) * 0.6
    + clamp(input.inflationTrend, -4, 4) * 1.5
    - (input.taxAvg - 25) * 0.4
    - input.unemployment * 0.05
    + (prev.deregulationIndex - 50) * 0.3,
    0, 100
  );

  // clase media: odia inflacion, desempleo y corrupcion a la vez; el termino
  // impositivo responde a ambos lados segun que decisiones se tomen (quieren
  // impuestos bajos Y buenos servicios, un perfil deliberadamente contradictorio)
  const targetClaseMedia = clamp(
    55
    - Math.max(0, input.inflation - 10) * 0.5
    - Math.max(0, input.unemployment - 8) * 0.7
    - Math.max(0, input.corruption - 30) * 0.3
    - (input.taxAvg - 25) * 0.2,
    0, 100
  );

  // obrera: el desempleo pesa fuerte, inflacion/deficit casi nada, a favor
  // de los sindicatos y en contra de la desregulacion
  const targetObrera = clamp(
    55
    - Math.max(0, input.unemployment - 6) * 1.1
    - Math.max(0, input.inflation - 10) * 0.15
    + input.unionPower * 1.0
    - (prev.deregulationIndex - 50) * 0.25
    + input.gdpGrowth * 0.3,
    0, 100
  );

  // alta/oligarcas: la desregulacion y el crecimiento les gustan, pero el
  // impuesto corporativo les pesa mucho mas que el resto de las señales
  // ("quieren favores hasta que les tocan los intereses")
  const targetAlta = clamp(
    55
    + (prev.deregulationIndex - 50) * 1.2
    - Math.max(0, input.taxCorporate - 20) * 0.6
    + input.gdpGrowth * 1.0,
    0, 100
  );

  // fieles: casi no reaccionan a la macro, solo un poco a la felicidad general
  const targetFieles = clamp(60 + (input.happiness - 55) * 0.15, 35, 90);

  return {
    empresarios: converge(prev.empresarios, targetEmpresarios, 0.12),
    claseMedia: converge(prev.claseMedia, targetClaseMedia, 0.12),
    obrera: converge(prev.obrera, targetObrera, 0.12),
    alta: converge(prev.alta, targetAlta, 0.12),
    // ancla de baja volatilidad: converge mas lento y no baja de 35
    fieles: converge(prev.fieles, targetFieles, 0.04, 35),
    // decae solo a neutral salvo que un groupEffects lo mueva
    deregulationIndex: converge(prev.deregulationIndex, 50, 0.03)
  };
}

/** Aplica un GroupEffects (lib/types.ts) sobre el estado. Pura: no muta `state`. */
export function applyGroupEffects(state: PopularGroupsState, effects: GroupEffects): PopularGroupsState {
  return {
    empresarios: clamp(round(state.empresarios + (effects.empresarios ?? 0)), 0, 100),
    claseMedia: clamp(round(state.claseMedia + (effects.claseMedia ?? 0)), 0, 100),
    obrera: clamp(round(state.obrera + (effects.obrera ?? 0)), 0, 100),
    alta: clamp(round(state.alta + (effects.alta ?? 0)), 0, 100),
    fieles: clamp(round(state.fieles + (effects.fieles ?? 0)), 35, 100),
    deregulationIndex: clamp(round(state.deregulationIndex + (effects.deregulationIndex ?? 0)), 0, 100)
  };
}

/**
 * Cuanto suma o resta el grupo 4 (alta/oligarcas) a capital politico este
 * mes via su control de los medios: contentos, empujan a favor; en contra,
 * le restan al gobierno.
 */
export function mediaCapitalEffect(alta: number): number {
  if (alta >= 65) return 0.6;
  if (alta >= 55) return 0.25;
  if (alta <= 25) return -0.6;
  if (alta <= 35) return -0.25;
  return 0;
}

/** El grupo con el mayor cambio este turno, si supera el umbral (si no, null). */
export function notableGroupSwing(
  prev: PopularGroupsState, next: PopularGroupsState, threshold = 3
): { group: GroupKey; delta: number } | null {
  let best: { group: GroupKey; delta: number } | null = null;
  for (const key of GROUP_KEYS) {
    const delta = round(next[key] - prev[key]);
    if (Math.abs(delta) < threshold) continue;
    if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { group: key, delta };
  }
  return best;
}

/**
 * Titular para el feed cuando un grupo se mueve fuerte.
 *
 * Antes el store solo narraba UN caso (empresarios subiendo) y el resto de los
 * swings pasaba invisible: el jugador veia la barra cambiada en la pestaña sin
 * saber cuando ni por que. Un grupo que se mueve tiene que decirlo el mes que
 * se mueve, o no existe.
 */
const GROUP_SWING_COPY: Record<GroupKey, { up: string; down: string }> = {
  empresarios: {
    up: 'Los empresarios recuperan confianza',
    down: 'Los empresarios desconfian del rumbo'
  },
  claseMedia: {
    up: 'La clase media respira',
    down: 'La clase media se siente exprimida'
  },
  obrera: {
    up: 'La clase obrera acompana al gobierno',
    down: 'La clase obrera le suelta la mano al gobierno'
  },
  alta: {
    up: 'Los grandes grupos economicos aflojan la presion',
    down: 'Los grandes grupos economicos se dan vuelta'
  },
  fieles: {
    up: 'La base propia se entusiasma',
    down: 'Hasta la base propia empieza a dudar'
  }
};

const GROUP_SWING_WHY: Record<GroupKey, string> = {
  empresarios: 'Miran inflacion y presion impositiva antes que cualquier otra cosa.',
  claseMedia: 'Pesa la mezcla de corrupcion, inflacion y desempleo.',
  obrera: 'Lo que mueve la aguja es el empleo y el peso de los sindicatos.',
  alta: 'Leen desregulacion, impuesto corporativo y crecimiento. Y manejan los medios.',
  fieles: 'Se mueven poco y tarde: si estos se mueven, algo grande paso.'
};

export function groupSwingFeed(group: GroupKey, delta: number): {
  emoji: string; title: string; body: string; tone: 'bueno' | 'malo';
} {
  const up = delta > 0;
  const signo = up ? '+' : '';
  return {
    emoji: up ? '📈' : '📉',
    title: GROUP_SWING_COPY[group][up ? 'up' : 'down'],
    body: `${GROUP_LABEL[group]}: ${signo}${delta} este mes. ${GROUP_SWING_WHY[group]}`,
    tone: up ? 'bueno' : 'malo'
  };
}

// ============================================================
// PREVIEW (mismo patron que previewMoralDelta, lib/moral.ts)
// ============================================================

const GROUP_EFFECT_LABEL: Record<keyof GroupEffects, string> = {
  empresarios: GROUP_LABEL.empresarios,
  claseMedia: GROUP_LABEL.claseMedia,
  obrera: GROUP_LABEL.obrera,
  alta: GROUP_LABEL.alta,
  fieles: GROUP_LABEL.fieles,
  deregulationIndex: 'Indice de desregulacion'
};

export interface GroupPreviewItem {
  key: string;
  label: string;
  value: number;
  tone: 'bueno' | 'malo';
}

export function previewGroupDelta(effects: GroupEffects): GroupPreviewItem[] {
  return (Object.keys(effects) as (keyof GroupEffects)[])
    .filter((k) => effects[k] !== undefined && effects[k] !== 0)
    .map((k) => {
      const v = effects[k] as number;
      return { key: k, label: GROUP_EFFECT_LABEL[k] ?? k, value: v, tone: v > 0 ? 'bueno' : 'malo' as const };
    });
}
