import type {
  ActiveEvent, Bloc, Country, Decision, GlobalState, Projection, ProjectionKey,
  ProjectionMetric, ProjectionWarning
} from './types';
import {
  adjustRelation, advanceMonth, applyDelta, clamp, eligibleEvents, getRelation,
  naturalDrift, relLabel, resolveRelationTargets, type TaxRates
} from './engine';
import { oilShock } from './routes';
import { monthsToElection, needsSuccessor, poll } from './politics';
import { systemOf } from './electoral';
import { topPartnerOf, totalTrade, tradeMatrix, type TradeContext } from './trade';
import type { Politics } from './politics';
import { cabinetPassive, coalitionPartners as coalitionPartnersOf, type Cabinet } from './cabinet';
import { CAPITAL_PASSIVE_BASE } from './electoral';
import { defaultImf, tickImf, type ImfState } from './imf';
import { applyFx, FX_START, fxInflationPassthrough, fxPressure, DEVALUE_JUMP } from './fx';

/**
 * Simulacion determinista del mundo: todo lo que pasa en un turno SIN azar.
 *
 * Existe por una razon concreta: el preview de consecuencias tiene que usar
 * exactamente las mismas reglas que el turno real. Si el turno viviera solo en
 * el store y el preview reimplementara la economia, los dos se desincronizan y
 * el preview miente. Aca `deterministicTick()` es la unica implementacion, y
 * tanto `endTurn` (lib/store.ts) como `projectDecision()` la usan.
 *
 * Lo que NO esta aca porque depende del azar o del jugador: sorteo de eventos,
 * reacciones de la IA, resolucion de eventos y feed.
 */

export interface SimState {
  turn: number;
  playerCode: string;
  countries: Record<string, Country>;
  relations: Record<string, number>;
  blocs: Bloc[];
  world: GlobalState;
  capital: number;
  sanctions: string[];
  disruptions: Record<string, number>;
  tradeBase: Record<string, number>;
  /** eventos en curso: sus efectos `ongoing` se aplican en cada tick */
  active: ActiveEvent[];
  /** tasas impositivas iniciales de cada pais: la referencia del efecto fiscal */
  taxBase: Record<string, TaxRates>;
  /** estado politico, para condicionar eventos (opcional en tests) */
  politics?: Politics;
  /** gabinete: sus pasivos se aplican en cada tick */
  cabinet?: Cabinet;
  /** hasta este turno el pasivo de capital va doble (100 dias / luna de miel) */
  honeymoonUntil?: number;
  /** arco FMI del jugador. Si falta, el tick lo crea. */
  imf?: ImfState;
}

export const cloneSim = (s: SimState): SimState => JSON.parse(JSON.stringify(s)) as SimState;

/**
 * Contexto politico y comercial que reciben los eventos en su condicion `when`.
 * Se arma aca para que sea el mismo en el sorteo real y en el preview.
 */
export function eventExtraOf(s: SimState) {
  const player = s.countries[s.playerCode];
  const imf = s.imf;
  const fx = player?.fx ?? FX_START;

  if (!s.politics) {
    return { imf, fx };
  }

  const sys = systemOf(s.playerCode);
  const sinceStart = s.turn - s.politics.termStart;
  const midterm = sys.midtermMonths
    ? Math.max(0, sys.midtermMonths - sinceStart)
    : null;

  const ctx = tradeContextOf(s);
  const total = totalTrade(s.playerCode, ctx);
  const base = s.tradeBase[s.playerCode];

  return {
    politics: {
      opposition: s.politics.opposition,
      monthsToElection: monthsToElection(s.politics, s.turn),
      monthsToMidterm: midterm,
      poll: poll(player, s.politics, s.capital),
      consecutiveTerms: s.politics.consecutiveTerms,
      lastTerm: needsSuccessor(s.politics),
      honeymoon: (s.honeymoonUntil ?? 0) >= s.turn,
      capital: s.capital,
      seats: s.politics.seats,
      coalition: !!s.cabinet && Object.values(s.cabinet).length > 0
        && !!coalitionPartnersOf(s.cabinet).length
    },
    trade: {
      total: Math.round(total),
      changeVsStart: base ? Math.round((total / base - 1) * 1000) / 10 : 0,
      topPartner: topPartnerOf(s.playerCode, ctx)
    },
    imf,
    fx
  };
}

export const tradeContextOf = (s: SimState): TradeContext => ({
  countries: s.countries,
  relations: s.relations,
  blocs: s.blocs,
  sanctions: s.sanctions,
  playerCode: s.playerCode,
  disruptions: s.disruptions,
  turn: s.turn
});

/**
 * Cuanto empuja el comercio a cada economia en este turno.
 * Calcula la matriz UNA vez y saca de ahi los 76 totales, en vez de recorrer
 * el mundo entero por cada pais.
 */
export function tradeEffects(s: SimState): Record<string, number> {
  const { totals } = tradeMatrix(tradeContextOf(s));
  const out: Record<string, number> = {};
  for (const code of Object.keys(s.countries)) {
    const base = s.tradeBase[code];
    if (!base) {
      out[code] = 0;
      continue;
    }
    const ratio = (totals[code] ?? 0) / base;
    out[code] = Math.max(-2, Math.min(2, (ratio - 1) * 2));
  }
  return out;
}

/** Cohesion de cada bloque: sigue a la relacion promedio entre sus socios. */
export function updateCohesion(blocs: Bloc[], relations: Record<string, number>) {
  for (const b of blocs) {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < b.members.length; i++) {
      for (let j = i + 1; j < b.members.length; j++) {
        sum += getRelation(relations, b.members[i], b.members[j]);
        n++;
      }
    }
    const avg = n ? sum / n : 0;
    b.cohesion = clamp(Math.round(b.cohesion * 0.9 + ((avg + 100) / 2) * 0.1), 0, 100);
  }
}

/** Capital politico que se recupera al cerrar el mes.
 *  Base 4. En luna de miel (100 dias = 4 meses post eleccion) se duplica. */
export const capitalRegen = (capital: number, happiness: number, honeymoon = false) => {
  const passive = CAPITAL_PASSIVE_BASE + (happiness - 60) / 10;
  return clamp(capital + passive * (honeymoon ? 2 : 1), 0, 100);
};

export interface TickResult {
  state: SimState;
  /** cuanto subio el barril por rutas cerradas (0 si no hay bloqueos) */
  oilShockApplied: number;
}

/**
 * Un mes de mundo, sin azar. Muta la copia que recibe y la devuelve, asi que
 * el llamador tiene que pasar un estado ya clonado (`cloneSim`).
 */
export function deterministicTick(s: SimState): TickResult {
  advanceMonth(s.world);
  s.turn += 1;

  // 1. las crisis en curso siguen pesando: una recesion de 4 meses cobra
  //    todos los meses, no solo el primero
  const stillActive: ActiveEvent[] = [];
  for (const a of s.active) {
    const left = a.turnsLeft ?? 0;
    if (left <= 0) continue;
    if (a.event.worldOngoing) {
      for (const c of Object.values(s.countries)) applyDelta(c, a.event.worldOngoing);
    }
    if (a.event.ongoing) applyDelta(s.countries[s.playerCode], a.event.ongoing, s.world);
    const next = { ...a, turnsLeft: left - 1 };
    if (next.turnsLeft > 0) stillActive.push(next);
  }
  s.active = stillActive;

  // el gabinete trabaja todos los meses, en chico
  if (s.cabinet) {
    const passive = cabinetPassive(s.cabinet);
    const { capitalPerTurn, ...delta } = passive;
    if (Object.keys(delta).length) applyDelta(s.countries[s.playerCode], delta, s.world);
    if (capitalPerTurn) s.capital = clamp(s.capital + capitalPerTurn, 0, 100);
  }

  const playerBefore = s.countries[s.playerCode];
  const prevDebt = playerBefore.economy.debt_to_gdp;
  const prevGold = playerBefore.economy.gold_reserves_tonnes;

  naturalDrift(s.countries, s.blocs, s.world, tradeEffects(s), s.taxBase);

  // FMI + tipo de cambio del jugador. Despues del drift para que vean
  // el mes economico, no el estado con el que se abrio el turno.
  const player = s.countries[s.playerCode];
  s.imf = tickImf(s.imf ?? defaultImf(), {
    debt: player.economy.debt_to_gdp,
    prevDebt,
    fiscal: player.economy.fiscal_balance,
    turn: s.turn
  });
  const pressure = fxPressure({
    inflation: player.economy.inflation,
    fiscal: player.economy.fiscal_balance,
    debt: player.economy.debt_to_gdp,
    imfStage: s.imf.stage,
    monthsRising: s.imf.monthsRising,
    deltaReserves: player.economy.gold_reserves_tonnes - prevGold
  });
  player.fx = applyFx(player.fx ?? FX_START, pressure);
  const importedInflation = fxInflationPassthrough(pressure);
  if (importedInflation) applyDelta(player, { inflation: importedInflation }, s.world);

  // rutas cerradas: el barril sube mientras dure el bloqueo
  const shock = oilShock(s.disruptions, s.turn);
  if (shock > 0) {
    s.world.oil_price = Math.round((s.world.oil_price + shock) * 10) / 10;
  }

  // las sanciones erosionan la relacion mes a mes
  for (const target of s.sanctions) adjustRelation(s.relations, s.playerCode, target, -2);

  updateCohesion(s.blocs, s.relations);

  s.capital = capitalRegen(
    s.capital,
    s.countries[s.playerCode].population.happiness,
    (s.honeymoonUntil ?? 0) >= s.turn
  );

  return { state: s, oilShockApplied: shock };
}

/** Aplica una decision sobre un estado simulado (sin tocar el store). */
export function applyDecisionTo(s: SimState, dec: Decision, target?: string): SimState {
  applyDelta(s.countries[s.playerCode], dec.effects, s.world);

  for (const rd of dec.relations ?? []) {
    const targets = resolveRelationTargets(rd, {
      player: s.playerCode, target, countries: s.countries, blocs: s.blocs
    });
    targets.forEach((t) => adjustRelation(s.relations, s.playerCode, t, rd.amount));
  }

  if (dec.cost.fiscal) applyDelta(s.countries[s.playerCode], { fiscal_balance: -dec.cost.fiscal }, s.world);
  if (dec.id === 'sancionar' && target && !s.sanctions.includes(target)) s.sanctions.push(target);
  if (dec.id === 'devaluar') {
    const c = s.countries[s.playerCode];
    c.fx = applyFx(c.fx ?? FX_START, DEVALUE_JUMP);
  }

  s.capital = clamp(s.capital - dec.cost.capital + (dec.effects.capital ?? 0), 0, 100);
  return s;
}

// ============================================================
// PROYECCION DE CONSECUENCIAS
// ============================================================

const METRIC_LABELS: Record<ProjectionKey, string> = {
  happiness: 'Felicidad',
  stability: 'Estabilidad',
  gdp_growth: 'Crecimiento',
  inflation: 'Inflacion',
  unemployment: 'Desempleo',
  fiscal_balance: 'Balance fiscal',
  debt_to_gdp: 'Deuda / PBI',
  capital: 'Capital politico',
  trade: 'Comercio total'
};

/** Metricas donde subir es malo. */
const BAD_WHEN_UP: ProjectionKey[] = ['inflation', 'unemployment', 'debt_to_gdp'];

function readMetric(s: SimState, key: ProjectionKey): number {
  const p = s.countries[s.playerCode];
  switch (key) {
    case 'capital': return s.capital;
    case 'trade': return totalTrade(s.playerCode, tradeContextOf(s));
    case 'happiness': return p.population.happiness;
    case 'stability': return p.population.stability;
    default: return p.economy[key];
  }
}

/** Umbrales que vale la pena avisarle al jugador antes de que decida. */
function collectWarnings(s: SimState, base: SimState, turnOffset: number): ProjectionWarning[] {
  const out: ProjectionWarning[] = [];
  const p = s.countries[s.playerCode].population;
  const e = s.countries[s.playerCode].economy;
  const bp = base.countries[base.playerCode].population;
  const be = base.countries[base.playerCode].economy;

  const crossed = (now: number, before: number, limit: number, down = true) =>
    down ? now < limit && before >= limit : now > limit && before <= limit;

  if (crossed(p.stability, bp.stability, 30)) {
    out.push({ turn: turnOffset, severity: 'grave', text: 'La estabilidad cae por debajo de 30: se activa la crisis institucional.' });
  } else if (crossed(p.stability, bp.stability, 45)) {
    out.push({ turn: turnOffset, severity: 'aviso', text: 'La estabilidad baja de 45: la oposicion puede pedir juicio politico.' });
  }
  if (crossed(p.happiness, bp.happiness, 25)) {
    out.push({ turn: turnOffset, severity: 'grave', text: 'La felicidad cae por debajo de 25: te acercas a la renuncia forzada.' });
  }
  if (crossed(e.inflation, be.inflation, 50, false)) {
    out.push({ turn: turnOffset, severity: 'grave', text: 'La inflacion supera el 50% anual.' });
  }
  if (crossed(e.debt_to_gdp, be.debt_to_gdp, 100, false)) {
    out.push({ turn: turnOffset, severity: 'aviso', text: 'La deuda cruza el 100% del PBI.' });
  }
  if (crossed(e.unemployment, be.unemployment, 12, false)) {
    out.push({ turn: turnOffset, severity: 'aviso', text: 'El desempleo pasa el 12%: se multiplican los piquetes.' });
  }
  if (crossed(s.capital, base.capital, 10)) {
    out.push({ turn: turnOffset, severity: 'aviso', text: 'Te quedas casi sin capital politico para reaccionar.' });
  }
  if (e.gdp_growth < 0 && be.gdp_growth >= 0) {
    out.push({ turn: turnOffset, severity: 'aviso', text: 'La economia entra en recesion.' });
  }
  return out;
}

/** Paises que cambian de categoria de relacion por culpa de la decision. */
function relationWarnings(withD: SimState, base: SimState): ProjectionWarning[] {
  const out: ProjectionWarning[] = [];
  for (const code of Object.keys(withD.countries)) {
    if (code === withD.playerCode) continue;
    const after = relLabel(getRelation(withD.relations, withD.playerCode, code));
    const before = relLabel(getRelation(base.relations, base.playerCode, code));
    if (after === before) continue;
    const name = withD.countries[code].name;
    if (after === 'hostil') {
      out.push({ turn: 0, severity: 'grave', text: `${name} pasa a hostil.` });
    } else if (after === 'tenso' && before !== 'hostil') {
      out.push({ turn: 0, severity: 'aviso', text: `${name} pasa a tenso.` });
    } else if ((after === 'aliado' || after === 'amistoso') && (before === 'neutral' || before === 'tenso')) {
      out.push({ turn: 0, severity: 'aviso', text: `${name} mejora a ${after}.` });
    }
  }
  return out.slice(0, 4);
}

/**
 * Que pasa si tomo esta decision, comparado con no hacer nada.
 *
 * Corre dos simulaciones deterministas en paralelo (con y sin la decision)
 * durante `horizon` turnos y devuelve la diferencia. No incluye eventos
 * aleatorios: muestra la tendencia que la decision empuja, no el futuro exacto.
 */
export function projectDecision(
  start: SimState,
  dec: Decision,
  target?: string,
  horizon = 3
): Projection {
  const keys: ProjectionKey[] = [
    'happiness', 'stability', 'gdp_growth', 'inflation', 'unemployment',
    'fiscal_balance', 'debt_to_gdp', 'capital', 'trade'
  ];

  const now: Record<ProjectionKey, number> = {} as Record<ProjectionKey, number>;
  for (const k of keys) now[k] = readMetric(start, k);

  let base = cloneSim(start);
  let withD = applyDecisionTo(cloneSim(start), dec, target);

  // paso 0: impacto inmediato, antes de que corra el mes
  const series: Record<ProjectionKey, number[]> = {} as Record<ProjectionKey, number[]>;
  for (const k of keys) series[k] = [readMetric(withD, k) - readMetric(base, k)];

  const warnings: ProjectionWarning[] = relationWarnings(withD, base);
  const eventsBefore = new Set(eligibleEvents({ ...base, eventExtra: eventExtraOf(base) }).map((e) => e.id));

  for (let t = 1; t <= horizon; t++) {
    base = deterministicTick(base).state;
    withD = deterministicTick(withD).state;
    for (const k of keys) series[k].push(readMetric(withD, k) - readMetric(base, k));
    warnings.push(...collectWarnings(withD, base, t));
  }

  const eventsAfter = eligibleEvents({ ...withD, eventExtra: eventExtraOf(withD) });
  const afterIds = new Set(eventsAfter.map((e) => e.id));

  const unlocks = eventsAfter
    .filter((e) => !eventsBefore.has(e.id) && e.scope === 'nacional')
    .slice(0, 4)
    .map((e) => ({ id: e.id, title: e.title, emoji: e.emoji }));

  const defuses = eligibleEvents({ ...base, eventExtra: eventExtraOf(base) })
    .filter((e) => eventsBefore.has(e.id) && !afterIds.has(e.id) && e.scope === 'nacional')
    .slice(0, 4)
    .map((e) => ({ id: e.id, title: e.title, emoji: e.emoji }));

  const metrics: ProjectionMetric[] = keys
    .map((k) => {
      const deltas = series[k].map((v) => Math.round(v * 100) / 100);
      const last = deltas[deltas.length - 1];
      const rel = k === 'trade' && now[k] ? (last / now[k]) * 100 : last;
      const bad = BAD_WHEN_UP.includes(k) ? last > 0 : last < 0;
      return {
        key: k,
        label: METRIC_LABELS[k],
        now: Math.round(now[k] * 100) / 100,
        // el comercio se muestra en % sobre el total actual, no en miles de millones
        deltas: k === 'trade'
          ? series[k].map((v) => (now[k] ? Math.round((v / now[k]) * 1000) / 10 : 0))
          : deltas,
        tone: Math.abs(rel) < 0.05 ? 'neutral' : bad ? 'malo' : 'bueno'
      } as ProjectionMetric;
    })
    .filter((m) => m.deltas.some((d) => Math.abs(d) >= 0.05));

  // un aviso por turno y severidad, sin repetir texto
  const seen = new Set<string>();
  const uniqueWarnings = warnings.filter((w) => {
    if (seen.has(w.text)) return false;
    seen.add(w.text);
    return true;
  });

  return { horizon, metrics, warnings: uniqueWarnings, unlocks, defuses };
}
