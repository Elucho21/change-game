import type {
  ActiveEvent, Bloc, Country, Delta, DiploArc, EventContext, GameEvent,
  GlobalState, RelationDelta, RelationLabel
} from './types';
import { NATIONAL_EVENTS } from './events/national';
import { WORLD_EVENTS } from './events/world';

// ============================================================
// RELACIONES
// ============================================================

export function relKey(a: string, b: string) {
  return `${a}|${b}`;
}

export function getRelation(rel: Record<string, number>, a: string, b: string): number {
  if (a === b) return 100;
  return rel[relKey(a, b)] ?? rel[relKey(b, a)] ?? 0;
}

export function setRelation(rel: Record<string, number>, a: string, b: string, value: number) {
  const v = clamp(value, -100, 100);
  if (rel[relKey(a, b)] !== undefined) rel[relKey(a, b)] = v;
  else if (rel[relKey(b, a)] !== undefined) rel[relKey(b, a)] = v;
  else rel[relKey(a, b)] = v;
}

export function adjustRelation(rel: Record<string, number>, a: string, b: string, delta: number) {
  setRelation(rel, a, b, getRelation(rel, a, b) + delta);
}

export function relLabel(n: number): RelationLabel {
  if (n >= 70) return 'aliado';
  if (n >= 25) return 'amistoso';
  if (n > -25) return 'neutral';
  if (n > -60) return 'tenso';
  return 'hostil';
}

export const REL_COLORS: Record<RelationLabel, string> = {
  aliado: '#2ecc71',
  amistoso: '#8bd45c',
  neutral: '#8a93a6',
  tenso: '#f0a742',
  hostil: '#e5484d'
};

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round = (v: number, d = 2) => {
  const r = Math.round(v * 10 ** d) / 10 ** d;
  // Math.round(-0.001) da -0, que se muestra como "-0" en pantalla y rompe
  // cualquier comparacion directa contra 0
  return r === 0 ? 0 : r;
};

// ============================================================
// BLOQUES
// ============================================================

/** Suma de los efectos de todos los bloques a los que pertenece un pais,
 *  ponderados por la cohesion actual del bloque. */
export function blocEffects(blocs: Bloc[], code: string) {
  const acc = { tradeBonus: 0, securityBonus: 0, techBonus: 0, inflationDrag: 0, externalTariff: 0, count: 0 };
  for (const b of blocs) {
    if (!b.members.includes(code)) continue;
    const w = b.cohesion / 100;
    acc.tradeBonus += (b.effects.tradeBonus ?? 0) * w;
    acc.securityBonus += (b.effects.securityBonus ?? 0) * w;
    acc.techBonus += (b.effects.techBonus ?? 0) * w;
    acc.inflationDrag += (b.effects.inflationDrag ?? 0) * w;
    if (b.effects.externalTariff !== undefined) acc.externalTariff = Math.max(acc.externalTariff, b.effects.externalTariff);
    acc.count++;
  }
  return acc;
}

/** Requisitos para que un pais pueda entrar a un bloque. */
export function canJoin(bloc: Bloc, code: string, rel: Record<string, number>, capital: number) {
  if (bloc.members.includes(code)) return { ok: false, reason: 'Ya sos miembro' };
  const minRel = bloc.type === 'militar' ? 40 : 20;
  const blockers = bloc.members.filter((m) => getRelation(rel, code, m) < minRel);
  if (blockers.length) {
    return { ok: false, reason: `Necesitas relacion >= ${minRel} con: ${blockers.join(', ')}` };
  }
  const cost = bloc.type === 'militar' ? 25 : 18;
  if (capital < cost) return { ok: false, reason: `Necesitas ${cost} de capital politico` };
  return { ok: true, reason: `Ingreso posible (cuesta ${cost} de capital politico)`, cost };
}

// ============================================================
// APLICAR DELTAS
// ============================================================

export function applyDelta(country: Country, delta: Delta, world?: GlobalState) {
  const e = country.economy;
  const p = country.population;
  const m = country.military;

  if (delta.gdp_growth !== undefined) e.gdp_growth = round(e.gdp_growth + delta.gdp_growth);
  if (delta.inflation !== undefined) e.inflation = round(Math.max(-2, e.inflation + delta.inflation));
  if (delta.unemployment !== undefined) e.unemployment = round(clamp(e.unemployment + delta.unemployment, 0.5, 60));
  if (delta.fiscal_balance !== undefined) e.fiscal_balance = round(e.fiscal_balance + delta.fiscal_balance);
  if (delta.debt_to_gdp !== undefined) e.debt_to_gdp = round(Math.max(0, e.debt_to_gdp + delta.debt_to_gdp));
  if (delta.gold_reserves_tonnes !== undefined) {
    e.gold_reserves_tonnes = round(Math.max(0, e.gold_reserves_tonnes + delta.gold_reserves_tonnes), 1);
  }
  if (delta.happiness !== undefined) p.happiness = round(clamp(p.happiness + delta.happiness, 0, 100), 1);
  if (delta.stability !== undefined) p.stability = round(clamp(p.stability + delta.stability, 0, 100), 1);
  if (delta.military_budget_bn !== undefined) {
    m.military_budget_bn = round(Math.max(0, m.military_budget_bn + delta.military_budget_bn), 1);
  }
  if (world) {
    if (delta.global_tension !== undefined) world.global_tension = clamp(world.global_tension + delta.global_tension, 0, 100);
    if (delta.oil_price !== undefined) world.oil_price = Math.max(10, round(world.oil_price + delta.oil_price, 1));
  }
}

/** Texto corto para el preview de impacto (lo que ve el jugador antes de confirmar). */
const DELTA_LABELS: Record<keyof Delta, string> = {
  happiness: 'Felicidad',
  stability: 'Estabilidad',
  gdp_growth: 'Crecimiento',
  inflation: 'Inflacion',
  unemployment: 'Desempleo',
  fiscal_balance: 'Balance fiscal',
  debt_to_gdp: 'Deuda/PBI',
  military_budget_bn: 'Presupuesto militar',
  gold_reserves_tonnes: 'Reservas de oro',
  capital: 'Capital politico',
  global_tension: 'Tension global',
  oil_price: 'Precio del petroleo',
  opposition: 'Oposicion'
};

/** Metricas donde subir es malo (para pintar el preview en rojo/verde). */
const BAD_WHEN_UP: (keyof Delta)[] = ['inflation', 'unemployment', 'debt_to_gdp', 'global_tension', 'opposition'];

export function previewDelta(delta: Delta) {
  return (Object.keys(delta) as (keyof Delta)[])
    .filter((k) => delta[k] !== undefined && delta[k] !== 0)
    .map((k) => {
      const v = delta[k] as number;
      const bad = BAD_WHEN_UP.includes(k) ? v > 0 : v < 0;
      return { key: k, label: DELTA_LABELS[k] ?? k, value: v, tone: bad ? 'malo' : 'bueno' as 'malo' | 'bueno' };
    });
}

// ============================================================
// SECTORES PRODUCTIVOS
// ============================================================

/**
 * Cuanto pesa un golpe sectorial sobre el crecimiento del pais.
 * K=40 esta calibrado para que una sequia que tumba 20% la agricultura le
 * cueste ~0.64 de crecimiento a Argentina (agricultura 8% del PBI) y apenas
 * 0.08 a Japon (1%). El mismo evento, consecuencias distintas segun la
 * estructura productiva de cada uno.
 */
const SECTOR_K = 40;

export const DEFAULT_SECTOR_HEALTH = 100;

/** Salud de los sectores de un pais, creandola si es la primera vez. */
export function sectorHealthOf(country: Country): Record<string, number> {
  if (!country.sectorHealth) {
    country.sectorHealth = Object.fromEntries(
      Object.keys(country.sectors).map((k) => [k, DEFAULT_SECTOR_HEALTH])
    );
  }
  return country.sectorHealth;
}

/**
 * Aplica un golpe sectorial y devuelve cuanto mueve el crecimiento del pais.
 * `effects` viene en % de caida del sector: { agriculture: -20 }.
 */
export function applySectorShock(country: Country, effects: Record<string, number>): number {
  const health = sectorHealthOf(country);
  let growthDelta = 0;
  for (const [sector, pct] of Object.entries(effects)) {
    const weight = country.sectors[sector] ?? 0;
    if (!weight) continue;
    health[sector] = clamp(round((health[sector] ?? DEFAULT_SECTOR_HEALTH) + pct, 1), 0, 100);
    growthDelta += (pct / 100) * (weight / 100) * SECTOR_K;
  }
  return round(growthDelta);
}

/** Los sectores golpeados se recuperan de a poco. */
export function recoverSectors(country: Country, rate = 3) {
  if (!country.sectorHealth) return;
  for (const k of Object.keys(country.sectorHealth)) {
    const v = country.sectorHealth[k];
    if (v < DEFAULT_SECTOR_HEALTH) {
      country.sectorHealth[k] = clamp(round(v + rate, 1), 0, DEFAULT_SECTOR_HEALTH);
    }
  }
}

/** Sectores que hoy estan por debajo de lo normal (para mostrarlos en la UI). */
export function damagedSectors(country: Country) {
  if (!country.sectorHealth) return [];
  return Object.entries(country.sectorHealth)
    .filter(([, v]) => v < DEFAULT_SECTOR_HEALTH - 0.5)
    .map(([sector, health]) => ({ sector, health, weight: country.sectors[sector] ?? 0 }))
    .sort((a, b) => a.health - b.health);
}

// ============================================================
// IMPUESTOS
// ============================================================

/**
 * Efecto de la estructura impositiva sobre la economia, por turno.
 *
 * Las tasas del JSON (IVA, corporativo, ingresos) hasta ahora solo se
 * mostraban. Aca definen recaudacion y costos reales:
 *  - IVA: la mas facil de recaudar y la mas regresiva (pega en precios y humor)
 *  - Corporativo: financia, pero espanta inversion y crecimiento
 *  - Ingresos: recauda sin inflacionar, castiga el humor de la clase media
 *
 * MUY IMPORTANTE: el efecto se mide contra las tasas CON LAS QUE ARRANCO ese
 * pais, no contra una media mundial. El balance fiscal del JSON ya refleja la
 * estructura impositiva de cada uno; si comparasemos contra una media, Estados
 * Unidos (sin IVA federal) arrastraria un rojo permanente sin que el jugador
 * toque nada, y los 24 paises quedarian descalibrados. Aca, si no movés los
 * impuestos, el efecto es cero: es una palanca del jugador, no un impuesto
 * escondido.
 */
export interface TaxRates {
  iva: number;
  corporate: number;
  income: number;
}

/**
 * Recaudacion dinamica (tax buoyancy), Change World Game v1.0.
 * El PBI que crece o se contrae mueve la recaudacion mas que proporcional
 * (elasticidad > 1): a igual carga tributaria, una economia mas grande
 * recauda mas. `TAX_BURDEN_PROXY` es la carga tributaria total tipica
 * (% del PBI) del paquete de diseño: no hay un dato real por pais, se usa
 * un valor global fijo a proposito para no inventar 76 numeros.
 */
export const TAX_BUOYANCY = 1.15;
export const TAX_BURDEN_PROXY = 0.28;

export const ratesOf = (country: Country): TaxRates => ({
  iva: country.economy.tax_iva,
  corporate: country.economy.tax_corporate,
  income: country.economy.tax_income_avg
});

export interface TaxEffects {
  fiscal: number;      // puntos del PBI de recaudacion extra o faltante
  inflation: number;
  growth: number;
  happiness: number;
}

export const NO_TAX_EFFECTS: TaxEffects = { fiscal: 0, inflation: 0, growth: 0, happiness: 0 };

export function taxEffects(country: Country, baseline?: TaxRates): TaxEffects {
  if (!baseline) return NO_TAX_EFFECTS;
  const e = country.economy;
  const dIva = e.tax_iva - baseline.iva;
  const dCorp = e.tax_corporate - baseline.corporate;
  const dInc = e.tax_income_avg - baseline.income;

  return {
    fiscal: round(dIva * 0.28 + dCorp * 0.10 + dInc * 0.16),
    inflation: round(dIva * 0.08),
    growth: round(-(dCorp * 0.06) - dIva * 0.02 - dInc * 0.018),
    happiness: round(-(dIva * 0.15) - dInc * 0.12 - dCorp * 0.04)
  };
}

// ============================================================
// RESOLUCION DE RELACIONES DE UNA DECISION / EVENTO
// ============================================================

export function neighborsOf(countries: Record<string, Country>, code: string) {
  const region = countries[code]?.region;
  return Object.values(countries).filter((c) => c.code !== code && c.region === region).map((c) => c.code);
}

export function resolveRelationTargets(
  rd: RelationDelta,
  ctx: { player: string; target?: string; countries: Record<string, Country>; blocs: Bloc[] }
): string[] {
  const { player, target, countries, blocs } = ctx;
  const t = rd.target as string;
  if (t === 'TARGET') return target ? [target] : [];
  if (t === 'todos') return Object.keys(countries).filter((c) => c !== player);
  if (t === 'vecinos') return neighborsOf(countries, player);
  if (t.startsWith('bloc:')) {
    const type = t.split(':')[1];
    const set = new Set<string>();
    blocs.filter((b) => b.type === type && b.members.includes(player))
      .forEach((b) => b.members.forEach((m) => m !== player && set.add(m)));
    return [...set];
  }
  return countries[t] ? [t] : [];
}

/**
 * Resuelve el target de un relationDrift de ministro (lib/cabinet.ts).
 * A diferencia de resolveRelationTargets, 'bloc:x' aca es el ID del bloque
 * (ej. 'bloc:mercosur'), no su tipo, y solo pega si el jugador es miembro.
 */
export function resolveDriftTarget(
  target: string,
  ctx: { player: string; countries: Record<string, Country>; blocs: Bloc[] }
): string[] {
  const { player, countries, blocs } = ctx;
  if (target.startsWith('bloc:')) {
    const id = target.slice('bloc:'.length);
    const bloc = blocs.find((b) => b.id === id);
    if (!bloc || !bloc.members.includes(player)) return [];
    return bloc.members.filter((m) => m !== player);
  }
  return countries[target] ? [target] : [];
}

// ============================================================
// DRIFT NATURAL (mismo criterio que engine/game_engine.py)
// ============================================================

/**
 * Cuanto empuja el humor social este turno, antes de aplicarlo a `happiness`.
 * Separada de `naturalDrift` porque es la parte con mas logica de tuneo
 * (ver comentario historico mas abajo sobre por que el castigo es logaritmico
 * y no plano) y la que mas vale poder testear sola, sin tener que armar un
 * `Country` completo y mutarlo para probar un caso.
 */
export function moodDrift(input: {
  taxHappiness: number;
  inflation: number;
  prevInflation: number;
  unemployment: number;
  gdpGrowth: number;
  debtToGdp: number;
}): number {
  const { taxHappiness, inflation, prevInflation, unemployment, gdpGrowth, debtToGdp } = input;

  // El castigo por inflacion es logaritmico y esta acotado, y ademas cuenta
  // la TENDENCIA: la gente no reacciona al nivel de precios sino a si la
  // cosa mejora o empeora. Con el castigo plano anterior (-2 fijo con
  // inflacion > 25) la felicidad tendia matematicamente a cero y paises como
  // Argentina, que arrancan con 140%, eran imposibles de gobernar: no habia
  // ningun equilibrio estable por encima de 0.
  const trend = prevInflation - inflation; // positivo = la inflacion esta bajando

  let mood = taxHappiness;
  if (inflation > 10) mood -= Math.min(2, Math.log10(Math.max(inflation, 10) / 10) * 1.1);
  if (trend > 0.5) mood += Math.min(1.2, trend * 0.15);       // desinflacionar se nota y se premia
  else if (trend < -0.5) mood -= Math.min(1.2, -trend * 0.2); // que se dispare, tambien

  if (unemployment > 12) mood -= 1.5;
  else if (unemployment < 5) mood += 0.5;
  if (gdpGrowth > 3) mood += 1;
  else if (gdpGrowth < 0) mood -= 1.2;
  if (debtToGdp > 110) mood -= 0.5;

  return mood;
}

export function naturalDrift(
  countries: Record<string, Country>,
  blocs: Bloc[],
  world: GlobalState,
  /** efecto del comercio bilateral por pais, de lib/trade.ts (opcional) */
  tradeEffect: Record<string, number> = {},
  /** tasas impositivas con las que arranco cada pais (opcional) */
  taxBase: Record<string, TaxRates> = {}
) {
  for (const c of Object.values(countries)) {
    const e = c.economy;
    const p = c.population;
    const fx = blocEffects(blocs, c.code);

    // el comercio intrabloque, los flujos bilaterales y la presion impositiva
    // definen hacia donde tiende el crecimiento
    const tax = taxEffects(c, taxBase[c.code]);
    const target =
      2 + fx.tradeBonus + (tradeEffect[c.code] ?? 0) + tax.growth
      - (e.inflation > 30 ? 1.5 : 0)
      - (world.global_tension > 70 ? 0.5 : 0);
    e.gdp_growth = round(e.gdp_growth * 0.85 + target * 0.15);

    // el PBI acumula el crecimiento mensual
    e.gdp_trillion_usd = round(e.gdp_trillion_usd * (1 + e.gdp_growth / 100 / 12), 3);

    // la inflacion alta cede de a poco; el ancla de bloque acelera la baja
    if (e.inflation > 5) e.inflation = round(e.inflation * (0.98 - fx.inflationDrag / 20));
    else e.inflation = round(e.inflation * 0.95 + 2 * 0.05);

    // desempleo sigue al ciclo
    e.unemployment = round(clamp(e.unemployment - (e.gdp_growth - 2) * 0.05, 0.5, 60));

    // la estructura impositiva empuja la recaudacion y los precios
    if (tax.inflation) e.inflation = round(Math.max(-2, e.inflation + tax.inflation));

    // la recaudacion extra (o faltante) por la politica impositiva se asienta
    // en el balance fiscal de forma escalonada: solo se suma el tramo nuevo
    // respecto del turno anterior, como una reforma que ya quedo asentada.
    // Asi el numero que ve el jugador (Balance fiscal / FISCAL) se mueve de
    // verdad con los impuestos, en vez de quedar escondido solo en la deuda.
    const taxFiscalPrev = c.taxFiscalApplied ?? 0;
    if (tax.fiscal !== taxFiscalPrev) {
      e.fiscal_balance = round(e.fiscal_balance + (tax.fiscal - taxFiscalPrev));
      c.taxFiscalApplied = tax.fiscal;
    }

    // recaudacion dinamica: el tamaño de la economia (crecer o contraerse)
    // mueve la recaudacion con elasticidad > 1. Solo el excedente sobre 1
    // genera efecto neto en fiscal_balance (a elasticidad 1 la recaudacion
    // crece al mismo ritmo que el PBI y el ratio recaudacion/PBI no se mueve).
    e.fiscal_balance = round(
      e.fiscal_balance + (e.gdp_growth / 100 / 12) * (TAX_BUOYANCY - 1) * TAX_BURDEN_PROXY * 100
    );

    // deficit sostenido acumula deuda; la recaudacion extra lo amortigua
    if (e.fiscal_balance < 0) e.debt_to_gdp = round(e.debt_to_gdp + Math.abs(e.fiscal_balance) * 0.08);
    else e.debt_to_gdp = round(Math.max(0, e.debt_to_gdp - e.fiscal_balance * 0.05));

    // los sectores golpeados se recuperan solos
    recoverSectors(c);

    // Presiones sobre el humor social (calculo puro en moodDrift, arriba).
    const mood = moodDrift({
      taxHappiness: tax.happiness,
      inflation: e.inflation,
      prevInflation: c.prevInflation ?? e.inflation,
      unemployment: e.unemployment,
      gdpGrowth: e.gdp_growth,
      debtToGdp: e.debt_to_gdp
    });
    c.prevInflation = e.inflation;

    p.happiness = round(clamp(p.happiness * 0.97 + 60 * 0.03 + mood, 0, 100), 1);
    p.stability = round(clamp(p.stability * 0.97 + p.happiness * 0.03 + (mood > 0 ? 0.3 : -0.4), 0, 100), 1);
  }

  // el mundo tambien respira
  world.global_tension = clamp(round(world.global_tension * 0.98 + 40 * 0.02, 1), 0, 100);
  world.oil_price = round(world.oil_price * 0.99 + 78 * 0.01, 1);
}

// ============================================================
// EVENTOS
// ============================================================

export function buildCtx(
  player: Country, world: GlobalState, turn: number, blocs: Bloc[], rel: Record<string, number>,
  /** contexto politico y comercial, para condicionar eventos de oposicion o economia externa */
  extra?: Pick<EventContext, 'politics' | 'trade' | 'imf' | 'fx' | 'street' | 'moral'>
): EventContext {
  return {
    player,
    world,
    turn,
    blocs,
    relationOf: (other) => getRelation(rel, player.code, other),
    memberOf: (blocId) => !!blocs.find((b) => b.id === blocId && b.members.includes(player.code)),
    ...extra
  };
}

/** Estado minimo que hace falta para saber que eventos estan habilitados. */
export interface EligibilityState {
  turn: number;
  playerCode: string;
  countries: Record<string, Country>;
  relations: Record<string, number>;
  blocs: Bloc[];
  world: GlobalState;
  /** contexto politico y comercial, si esta disponible */
  eventExtra?: Pick<EventContext, 'politics' | 'trade' | 'imf' | 'fx' | 'street' | 'moral'>;
}

/**
 * Eventos que HOY podrian dispararse con este estado (pasan su condicion `when`).
 * Lo usa el preview de consecuencias para avisar que decisiones habilitan o
 * desactivan que riesgos.
 */
export function eligibleEvents(s: EligibilityState): GameEvent[] {
  const ctx = buildCtx(s.countries[s.playerCode], s.world, s.turn, s.blocs, s.relations, s.eventExtra);
  return [...WORLD_EVENTS, ...NATIONAL_EVENTS].filter((e) => !e.when || e.when(ctx));
}

function pick<T>(items: { item: T; weight: number }[]): T | null {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const i of items) {
    r -= i.weight;
    if (r <= 0) return i.item;
  }
  return items[items.length - 1].item;
}

/**
 * Sortea los eventos del turno. El motor Python usa 25% mundial / 35%
 * nacional / 15% personal; aca el mundial se subio a 40% a proposito: el
 * resto del mundo tiene que sentirse presente, no como ruido de fondo que
 * aparece una vez cada cuatro turnos.
 */
export function rollEvents(
  player: Country, world: GlobalState, turn: number, blocs: Bloc[],
  rel: Record<string, number>, recentIds: string[],
  extra?: Pick<EventContext, 'politics' | 'trade' | 'imf' | 'fx' | 'street' | 'moral'>
): GameEvent[] {
  const ctx = buildCtx(player, world, turn, blocs, rel, extra);
  const out: GameEvent[] = [];

  const eligible = (list: GameEvent[], scope?: GameEvent['scope']) =>
    list
      .filter((e) => (!scope || e.scope === scope) && (!e.when || e.when(ctx)) && !recentIds.includes(e.id))
      .map((e) => ({ item: e, weight: e.weight }));

  if (Math.random() < 0.4) {
    const e = pick(eligible(WORLD_EVENTS));
    if (e) out.push(e);
  }
  if (Math.random() < 0.35) {
    const e = pick(eligible(NATIONAL_EVENTS, 'nacional'));
    if (e) out.push(e);
  }
  if (Math.random() < 0.15) {
    const e = pick(eligible(NATIONAL_EVENTS, 'personal'));
    if (e) out.push(e);
  }
  return out;
}

/** Eventos forzados por condiciones criticas (no dependen del azar). */
export function crisisEvents(player: Country): GameEvent[] {
  const forced: GameEvent[] = [];
  const p = player.population;
  if (p.stability < 30 && p.happiness < 40) {
    forced.push({
      id: 'crisis_institucional',
      scope: 'nacional',
      title: 'Crisis institucional',
      emoji: '🔥',
      tags: ['crisis'],
      weight: 0,
      duration: 1,
      description:
        'Con la calle en llamas y sin apoyo parlamentario, el gobierno pierde el control de la agenda. Se habla de adelantar elecciones.',
      choices: [
        {
          id: 'adelantar',
          label: 'Adelantar elecciones',
          detail: 'Salida institucional: perdes poder, evitas el colapso.',
          effects: { stability: 12, happiness: 5, capital: -20 }
        },
        {
          id: 'resistir',
          label: 'Resistir hasta terminar el mandato',
          detail: 'Todo o nada.',
          effects: { stability: -6, happiness: -3, capital: 5 }
        }
      ]
    });
  }
  return forced;
}

// ============================================================
// REACCIONES DE LA IA (capa deterministica; Grok agrega el realismo fino)
// ============================================================

export interface Reaction {
  country: string;
  action: string;
  intensity: number;
  relationChange: number;
}

/** Heuristica: cada pais reacciona segun su agresividad, su relacion actual
 *  y si comparte bloque con el jugador. */
export function aiReactions(
  countries: Record<string, Country>, rel: Record<string, number>, blocs: Bloc[],
  player: string, decisionLabel: string, hostility: number
): Reaction[] {
  const out: Reaction[] = [];
  const pool = Object.values(countries).filter((c) => c.code !== player);

  for (const c of pool) {
    const r = getRelation(rel, player, c.code);
    const shares = blocs.some((b) => b.members.includes(player) && b.members.includes(c.code));
    const isNeighbor = c.region === countries[player].region;
    const rival = blocs.some((b) => b.members.includes(c.code) && b.rivals.includes(player));

    // relevancia: quien se toma el trabajo de reaccionar
    let relevance = Math.abs(r) / 100 + (shares ? 0.4 : 0) + (isNeighbor ? 0.3 : 0) + c.traits.aggression * 0.5;
    if (Math.abs(hostility) > 15) relevance += 0.4;
    if (Math.random() > relevance) continue;

    const intensity = clamp(Math.round(1 + Math.abs(hostility) / 8 + c.traits.aggression * 3), 1, 5);
    let change = 0;
    let action = '';

    if (hostility < 0) {
      change = Math.round(hostility * (0.3 + c.traits.aggression * 0.5) * (shares ? 1.3 : 1));
      action = rival
        ? `${c.name} aprovecha la medida para reforzar su bloque y aislarte`
        : intensity >= 4
          ? `${c.name} convoca a tu embajador y evalua represalias`
          : `${c.name} expresa preocupacion por la medida`;
    } else if (hostility > 0) {
      change = Math.round(hostility * (0.25 + (shares ? 0.35 : 0.15)));
      action = shares
        ? `${c.name} acompana la iniciativa dentro del bloque`
        : `${c.name} toma nota con buenos ojos y explora acuerdos`;
    } else {
      change = Math.round((Math.random() - 0.5) * 4);
      action = `${c.name} sigue de cerca el impacto de "${decisionLabel}"`;
    }

    if (change !== 0) adjustRelation(rel, player, c.code, change);
    out.push({ country: c.code, action, intensity, relationChange: change });
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * Roster de paises con IA activa: los de mayor PBI que no sean el jugador.
 * Se recalcula cada turno (no cuesta nada y el PBI se mueve solo) y cubre
 * a las potencias sea cual sea el pais que eligio el jugador. `size` de
 * al menos 10 para que el resto del mundo se sienta vivo, no solo dos o
 * tres vecinos reaccionando.
 */
export function aiRoster(countries: Record<string, Country>, player: string, size = 12): string[] {
  return Object.values(countries)
    .filter((c) => c.code !== player && c.playable)
    .sort((a, b) => b.economy.gdp_trillion_usd - a.economy.gdp_trillion_usd)
    .slice(0, size)
    .map((c) => c.code);
}

export interface AiMove {
  country: string;
  emoji: string;
  action: string;
}

/**
 * Cada pais del roster evalua su propia situacion y, si hace falta, toma UNA
 * decision propia por turno. No pasa por el motor de decisiones del jugador
 * (ese cobra capital politico, tiene cooldowns y el jugador lo elige a mano):
 * es una heuristica simple para que el resto del mundo se mueva solo, no
 * para simular su politica interna con el mismo detalle que la del jugador.
 *
 * Es DISTINTA de `aiReactions`: esa reacciona a lo que hace el jugador
 * (relaciones bilaterales). Esta actua sobre la economia propia del pais,
 * pase lo que pase con el jugador.
 */
export function aiCountryDecisions(
  countries: Record<string, Country>, roster: string[], world: GlobalState
): AiMove[] {
  const moves: AiMove[] = [];

  for (const code of roster) {
    const c = countries[code];
    if (!c) continue;
    const e = c.economy;

    // no todos los paises activos hacen algo notorio cada mes: si no, el
    // feed se llena de ruido y deja de comunicar nada.
    if (Math.random() > 0.4) continue;

    if (e.fiscal_balance < -6 && e.tax_iva < 32) {
      e.tax_iva = round(Math.min(35, e.tax_iva + 2));
      moves.push({ country: code, emoji: '📈', action: `${c.name} sube el IVA para frenar el deficit fiscal` });
    } else if (e.unemployment > 12 && e.fiscal_balance > -4) {
      applyDelta(c, { gdp_growth: 0.4, unemployment: -0.3, fiscal_balance: -0.6 }, world);
      moves.push({ country: code, emoji: '💵', action: `${c.name} lanza un plan de estimulo contra el desempleo` });
    } else if (e.inflation > 30) {
      applyDelta(c, { inflation: -1.5, gdp_growth: -0.3 }, world);
      moves.push({ country: code, emoji: '🏦', action: `${c.name} endurece la politica monetaria para frenar la inflacion` });
    } else if (c.population.stability < 40) {
      applyDelta(c, { stability: 2, happiness: 1 }, world);
      moves.push({ country: code, emoji: '🕊️', action: `${c.name} lanza un plan social para calmar la calle` });
    } else if (c.traits.priorities.includes('regional_influence') && Math.random() < 0.3) {
      applyDelta(c, { global_tension: 1 }, world);
      moves.push({ country: code, emoji: '🎖️', action: `${c.name} refuerza su presencia militar en la region` });
    }
  }

  return moves;
}

/**
 * Cuanto absorbe un pais un shock mundial segun el tamano de su economia.
 * Una economia grande y diversificada amortigua mejor una recesion o un
 * shock de petroleo que una chica y concentrada: mismo evento, golpe
 * distinto. No es un ajuste cosmetico: multiplica el Delta que le toca a
 * cada pais antes de aplicarlo.
 */
export function worldShockMultiplier(country: Country): number {
  const gdp = country.economy.gdp_trillion_usd;
  if (gdp >= 5) return 0.7;   // potencias: absorben mejor el golpe
  if (gdp <= 0.5) return 1.35; // economias chicas: lo sienten mas fuerte
  return 1.0;
}

/**
 * Aplica el efecto mundial de un evento pais por pais, escalado por
 * `worldShockMultiplier`, y devuelve quien lo paso mejor y quien peor
 * (por variacion de crecimiento) para narrarlo en el feed. Sin esto, un
 * evento mundial le pegaba lo mismo a todos y el jugador nunca veia que
 * el resto del mundo tambien gana o pierde con lo que pasa afuera.
 */
export function applyWorldShock(
  countries: Record<string, Country>, effects: Delta, roster: string[]
): { best: string; worst: string; bestGrowth: number; worstGrowth: number } | null {
  const before: Record<string, number> = {};
  for (const code of roster) before[code] = countries[code]?.economy.gdp_growth ?? 0;

  for (const c of Object.values(countries)) {
    const mult = worldShockMultiplier(c);
    const scaled: Delta = {};
    for (const [k, v] of Object.entries(effects) as [keyof Delta, number][]) {
      scaled[k] = v * mult;
    }
    applyDelta(c, scaled, undefined);
  }

  if (roster.length < 2) return null;
  let best = roster[0];
  let worst = roster[0];
  for (const code of roster) {
    const d = (countries[code]?.economy.gdp_growth ?? 0) - before[code];
    const dBest = (countries[best]?.economy.gdp_growth ?? 0) - before[best];
    const dWorst = (countries[worst]?.economy.gdp_growth ?? 0) - before[worst];
    if (d > dBest) best = code;
    if (d < dWorst) worst = code;
  }
  if (best === worst) return null;
  return {
    best, worst,
    bestGrowth: countries[best].economy.gdp_growth,
    worstGrowth: countries[worst].economy.gdp_growth
  };
}

// ============================================================
// ARCOS DIPLOMATICOS (lo que se dibuja sobre el globo)
// ============================================================

export function computeArcs(
  countries: Record<string, Country>, rel: Record<string, number>, blocs: Bloc[],
  player: string, sanctions: string[]
): DiploArc[] {
  const arcs: DiploArc[] = [];
  const seen = new Set<string>();
  const add = (from: string, to: string, kind: DiploArc['kind'], strength: number, label: string) => {
    if (from === to || !countries[from] || !countries[to]) return;
    const id = [from, to].sort().join('-') + ':' + kind;
    if (seen.has(id)) return;
    seen.add(id);
    arcs.push({ id, from, to, kind, strength, label });
  };

  // bloques: topologia de estrella desde el primer miembro (lider) para no saturar el globo
  for (const b of blocs) {
    const hub = b.members[0];
    const kind: DiploArc['kind'] = b.type === 'militar' ? 'alianza' : 'comercio';
    if (b.type === 'politica') continue;
    for (const m of b.members) {
      if (m === hub) continue;
      add(hub, m, kind, b.cohesion / 100, `${b.short}: ${countries[hub]?.name} - ${countries[m]?.name}`);
    }
  }

  // tension: pares realmente enfrentados (siempre los del jugador, mas los de las potencias)
  const majors = ['USA', 'China', 'Russia'];
  const codes = Object.keys(countries);
  for (const a of codes) {
    for (const b of codes) {
      if (a >= b) continue;
      const involvesFocus = a === player || b === player || (majors.includes(a) && majors.includes(b));
      if (!involvesFocus) continue;
      const r = getRelation(rel, a, b);
      if (r <= -40) {
        add(a, b, 'tension', Math.min(1, Math.abs(r) / 100), `Tension ${countries[a].name} - ${countries[b].name} (${r})`);
      }
    }
  }

  // sanciones activas del jugador
  for (const s of sanctions) add(player, s, 'sancion', 1, `Sanciones a ${countries[s]?.name ?? s}`);

  return arcs;
}

export const ARC_COLORS: Record<DiploArc['kind'], string> = {
  alianza: '#4f7cff',
  comercio: '#37c98a',
  tension: '#f0a742',
  sancion: '#e5484d',
  flujo: '#00e0a4'
};

// ============================================================
// FIN DE PARTIDA
// ============================================================

export function checkGameOver(player: Country, turn: number): { title: string; body: string } | null {
  const p = player.population;
  if (p.stability <= 8) {
    return {
      title: 'Golpe de Estado',
      body: `Con la estabilidad en ${p.stability.toFixed(0)}, las fuerzas armadas y el Congreso te apartan del poder en el turno ${turn}.`
    };
  }
  if (p.happiness <= 8) {
    return {
      title: 'Renuncia forzada',
      body: `Con la felicidad social en ${p.happiness.toFixed(0)}, la presion de la calle vuelve imposible seguir gobernando.`
    };
  }
  if (player.economy.inflation > 300) {
    return {
      title: 'Hiperinflacion',
      body: `La inflacion supero el 300% anual. La moneda dejo de funcionar y el gobierno cae con ella.`
    };
  }
  return null;
}

/** Fecha legible del turno. */
export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export const dateLabel = (w: GlobalState) => `${MONTHS[w.month - 1]} ${w.year}`;

export function advanceMonth(w: GlobalState) {
  w.month += 1;
  if (w.month > 12) {
    w.month = 1;
    w.year += 1;
  }
}

/** Prompt compacto para pegar en Grok (mantiene el flujo de PROMPT_MAESTRO.md). */
export function buildGrokPrompt(
  player: Country, world: GlobalState, turn: number, rel: Record<string, number>,
  blocs: Bloc[], lastActions: string[], pending: ActiveEvent[]
) {
  const relevant = Object.entries(rel)
    .filter(([k]) => k.includes(player.code))
    .map(([k, v]) => {
      const [a, b] = k.split('|');
      return `${a === player.code ? b : a}:${v}`;
    });

  return `Sos el motor de simulacion de un juego de geopolitica realista (ver PROMPT_MAESTRO.md).
El jugador controla ${player.name}. Turno ${turn} - ${dateLabel(world)}.

ESTADO DEL JUGADOR:
${JSON.stringify({
    economia: player.economy,
    poblacion: { felicidad: player.population.happiness, estabilidad: player.population.stability },
    militar: { presupuesto_bn: player.military.military_budget_bn, ojivas: player.military.nuclear_warheads },
    bloques: blocs.filter((b) => b.members.includes(player.code)).map((b) => `${b.short} (cohesion ${b.cohesion})`),
    tension_global: world.global_tension,
    petroleo: world.oil_price
  }, null, 1)}

RELACIONES (-100 a 100): ${relevant.join(', ')}

ACCIONES DEL JUGADOR ESTE TURNO:
${lastActions.length ? lastActions.map((a) => `- ${a}`).join('\n') : '- (ninguna)'}

EVENTOS ABIERTOS: ${pending.map((p) => p.event.title).join(', ') || '(ninguno)'}

Devolve SOLO JSON valido:
{"reactions":[{"country":"codigo","action":"que hace","relation_change":-20..20,"intensity":1-5,"public_statement":"frase"}],
 "internal_extra_effects":[{"metric":"happiness|stability|gdp_growth|inflation|fiscal_balance","value":-10..10,"why":"motivo"}],
 "narrative":"2-4 oraciones de lo que paso en el mundo este turno"}

Reglas: cada pais defiende sus intereses de forma racional, nada de reacciones suicidas,
variedad en las respuestas, sin repeticion, el juego no debe ser facil.`;
}
