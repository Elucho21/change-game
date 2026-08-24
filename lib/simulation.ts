import type {
  ActiveEvent, Bloc, Country, Decision, GlobalState, Projection, ProjectionKey,
  ProjectionMetric, ProjectionWarning
} from './types';
import {
  adjustRelation, advanceMonth, applyDelta, clamp, eligibleEvents, getRelation,
  naturalDrift, relLabel, resolveDriftTarget, resolveRelationTargets, type TaxRates
} from './engine';
import { oilShock } from './routes';
import { monthsToElection, needsSuccessor, normalizeOppositionParties, parliament, poll } from './politics';
import { systemOf } from './electoral';
import { topPartnerOf, totalTrade, tradeMatrix, type TradeContext } from './trade';
import type { Politics } from './politics';
import {
  cabinetDiplomaticBonus, cabinetInvestmentMod, cabinetLaborMitigation, cabinetPassive, cabinetRelationDrift,
  cabinetUnionPower, coalitionPartners as coalitionPartnersOf, coalitionSeats as coalitionSeatsOf,
  type Cabinet
} from './cabinet';
import { CAPITAL_PASSIVE_BASE, DIPLOMATIC_CAPITAL_PASSIVE_BASE } from './electoral';
import { defaultImf, tickImf, type ImfState } from './imf';
import { applyFx, FX_START, fxInflationPassthrough, fxPressure, DEVALUE_JUMP } from './fx';
import { defaultStreet, streetDrip, tickStreetPressure, type StreetState } from './streetPressure';
import { applyPensionReform, defaultPension, tickPension, type PensionState } from './pension';
import { defaultEmployment, tickEmployment, type EmploymentState } from './employment';
import { deflationReserveGrowth } from './deflation';
import { applyRateChange, defaultCentralBank, rateEconomicEffect, tickCentralBank, type CentralBankState } from './centralBank';
import {
  defaultInfrastructure, INFRA_DECISION_TYPE, startInfrastructure, tickInfrastructure,
  type InfrastructureItem, type InfrastructureState
} from './infrastructure';
import { minorityStreetPush } from './moral';
import type { MoralState } from './types';

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
  /** capital diplomatico: pool separado, solo lo mueven decisiones de categoria diplomacia y bloques */
  capitalDiplomatico: number;
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
  /** presion de calle por inflacion/desempleo altos sostenidos. Si falta, el tick lo crea. */
  street?: StreetState;
  /** sistema previsional del jugador (lib/pension.ts). Si falta, el tick lo crea. */
  pension?: PensionState;
  /** empleo formal/informal y salario real del jugador (lib/employment.ts). Si falta, el tick lo crea. */
  employment?: EmploymentState;
  /** Banco Central: tasa de interes + Confianza (lib/centralBank.ts). Si falta, el tick lo crea. */
  centralBank?: CentralBankState;
  /** Infraestructura del jugador (lib/infrastructure.ts). Si falta, el tick lo crea. */
  infrastructure?: InfrastructureState;
  /**
   * Sistema moral del jugador (lib/moral.ts). Se pisa/tickea en lib/store.ts
   * endTurn (no adentro de deterministicTick): solo se carga aca para que
   * eventExtraOf pueda armar EventContext.moral para las cartas de los
   * lideres minoritarios en el sorteo real y en el preview.
   */
  moral?: MoralState;
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
  const street = s.street;

  if (!s.politics) {
    return { imf, fx, street, moral: s.moral };
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
      poll: poll(player, s.politics, s.capital, 0, undefined, s.moral),
      consecutiveTerms: s.politics.consecutiveTerms,
      lastTerm: needsSuccessor(s.politics),
      honeymoon: (s.honeymoonUntil ?? 0) >= s.turn,
      capital: s.capital,
      seats: s.politics.seats,
      coalition: !!s.cabinet && Object.values(s.cabinet).length > 0
        && !!coalitionPartnersOf(s.cabinet).length,
      parties: (() => {
        const seats = parliament(s.politics, s.moral, s.cabinet ? coalitionSeatsOf(s.cabinet) : 0);
        return normalizeOppositionParties(s.politics.oppositionParties, s.politics.partyName)
          .map((party, i) => ({
            name: party.name,
            ideology: party.ideology,
            mood: party.mood,
            inCoalition: party.inCoalition,
            seats: i === 0 ? seats.partyA : seats.partyB
          }));
      })()
    },
    trade: {
      total: Math.round(total),
      changeVsStart: base ? Math.round((total / base - 1) * 1000) / 10 : 0,
      topPartner: topPartnerOf(s.playerCode, ctx)
    },
    imf,
    fx,
    street,
    moral: s.moral
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

/**
 * Capital diplomatico que se recupera al cerrar el mes. Pool separado del
 * politico (docs/PEDIDOS_A_OPUS.md, ver electoral.ts). Sube con la cantidad
 * de bloques a los que perteneces (tener presencia internacional rinde solo)
 * y con el bonus pasivo del Canciller (`diplomaticCapitalBonus`, lib/cabinet.ts) —
 * ya no abarata ni infla el rendimiento de las decisiones de diplomacia, ver
 * lib/store.ts.
 */
export const diplomaticCapitalRegen = (
  capitalD: number, blocMemberships: number, cancillerBonus = 0, honeymoon = false
) => {
  const passive = DIPLOMATIC_CAPITAL_PASSIVE_BASE + Math.min(3, blocMemberships * 0.6);
  return clamp(capitalD + passive * (1 + cancillerBonus) * (honeymoon ? 1.5 : 1), 0, 100);
};

/**
 * Bonus de capital politico por el combo superavit + inflacion baja + empleo
 * mejorando (docs/PEDIDOS_A_OPUS.md, pedido de Grok, antes sin cablear).
 * Deliberadamente estrecho para que no sea un "win button": exige superavit
 * fiscal real, inflacion en una banda baja (deflacion profunda la apaga, para
 * no premiar la trampa de la recesion) y desempleo bajando este mismo turno.
 */
export function capitalComboBonus(
  fiscalBalance: number, inflation: number, unemploymentFalling: boolean
): number {
  if (fiscalBalance <= 0) return 0;
  if (inflation > 0 || inflation <= -2) return 0;
  if (!unemploymentFalling) return 0;
  return Math.round(clamp(0.3 + Math.min(0.5, Math.abs(inflation) * 0.3), 0.3, 0.8) * 100) / 100;
}

export interface TickResult {
  state: SimState;
  /** cuanto subio el barril por rutas cerradas (0 si no hay bloqueos) */
  oilShockApplied: number;
  /** obras de infraestructura que pasaron a operativas este turno, para narrar en el feed */
  infrastructureCompleted: InfrastructureItem[];
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

    // impacto ideologico: inversion que el gabinete atrae o espanta, y el
    // drift de relaciones del canciller segun su alineamiento (docs/PEDIDOS_A_OPUS.md)
    const investmentMod = cabinetInvestmentMod(s.cabinet);
    if (investmentMod) applyDelta(s.countries[s.playerCode], { gdp_growth: investmentMod }, s.world);

    for (const rd of cabinetRelationDrift(s.cabinet)) {
      const targets = resolveDriftTarget(rd.target, {
        player: s.playerCode, countries: s.countries, blocs: s.blocs
      });
      targets.forEach((t) => adjustRelation(s.relations, s.playerCode, t, rd.amount));
    }
  }

  const playerBefore = s.countries[s.playerCode];
  const prevDebt = playerBefore.economy.debt_to_gdp;
  const prevGold = playerBefore.economy.gold_reserves_tonnes;
  const prevUnemployment = playerBefore.economy.unemployment;

  naturalDrift(s.countries, s.blocs, s.world, tradeEffects(s), s.taxBase);

  // presion de calle: inflacion/desempleo altos sostenidos varios meses
  // suben el weight de eventos de calle y gotean humor/estabilidad. Despues
  // del drift para que mida el mes economico que se acaba de cerrar.
  const streetPlayer = s.countries[s.playerCode];
  s.street = tickStreetPressure(
    s.street ?? defaultStreet(), streetPlayer.economy.inflation, streetPlayer.economy.unemployment
  );
  // un ministro sindical alimenta la mecha; uno pro-mercado la enfria
  const unionPower = s.cabinet ? cabinetUnionPower(s.cabinet) : 0;
  // ...y Gustavo Comun tambien: es el unico de los tres minoritarios con
  // estructura sindical para poner gente en la calle (lib/moral.ts)
  const streetPush = unionPower + minorityStreetPush(s.moral);
  if (streetPush) {
    s.street = { ...s.street, streetWeight: clamp(s.street.streetWeight + streetPush, 0, 12) };
  }
  if (s.street.streetWeight >= 4) {
    applyDelta(streetPlayer, streetDrip(s.street.streetWeight), s.world);
  }

  // FMI + tipo de cambio del jugador. Despues del drift para que vean
  // el mes economico, no el estado con el que se abrio el turno.
  const player = s.countries[s.playerCode];
  s.imf = tickImf(s.imf ?? defaultImf(), {
    debt: player.economy.debt_to_gdp,
    prevDebt,
    fiscal: player.economy.fiscal_balance,
    turn: s.turn
  });
  // Banco Central (Change World Game v1.2): la tasa pega ADITIVO sobre
  // inflacion/crecimiento (nunca toca los coeficientes de naturalDrift) y
  // entra como un termino mas en fxPressure, mismo patron que imfStage.
  const cb = s.centralBank ?? defaultCentralBank();
  const rateEffect = rateEconomicEffect(cb.rate);
  if (rateEffect.inflation || rateEffect.gdp_growth) applyDelta(player, rateEffect, s.world);

  const pressure = fxPressure({
    inflation: player.economy.inflation,
    fiscal: player.economy.fiscal_balance,
    debt: player.economy.debt_to_gdp,
    imfStage: s.imf.stage,
    monthsRising: s.imf.monthsRising,
    deltaReserves: player.economy.gold_reserves_tonnes - prevGold,
    rate: cb.rate
  });
  player.fx = applyFx(player.fx ?? FX_START, pressure);
  const importedInflation = fxInflationPassthrough(pressure);
  if (importedInflation) applyDelta(player, { inflation: importedInflation }, s.world);

  s.centralBank = tickCentralBank(cb, {
    inflation: player.economy.inflation,
    debtToGdp: player.economy.debt_to_gdp,
    goldReservesTonnes: player.economy.gold_reserves_tonnes,
    imfStage: s.imf.stage
  });

  // previsional + empleo/salarios (Change World Game v1.0). Despues del FX
  // para leer inflacion/gdp_growth ya asentados del mes que se cierra.
  const prevPension = s.pension ?? defaultPension();
  const pensionTick = tickPension(prevPension);
  if (pensionTick.fiscalDelta) applyDelta(player, { fiscal_balance: pensionTick.fiscalDelta }, s.world);
  s.pension = pensionTick.state;

  const prevEmployment = s.employment ?? defaultEmployment();
  const employmentTick = tickEmployment(prevEmployment, {
    gdpGrowth: player.economy.gdp_growth,
    ...pensionTick.employmentInputs,
    inflation: player.economy.inflation,
    laborMitigation: s.cabinet ? cabinetLaborMitigation(s.cabinet) : 0
  });
  applyDelta(
    player,
    { unemployment: employmentTick.unemploymentDelta, happiness: employmentTick.happinessDelta },
    s.world
  );
  s.employment = employmentTick.state;

  // deflacion: si el mes cierra con precios cayendo, las reservas crecen solas
  const reserveGrowth = deflationReserveGrowth(player.economy.inflation, player.economy.gold_reserves_tonnes);
  if (reserveGrowth) applyDelta(player, { gold_reserves_tonnes: reserveGrowth }, s.world);

  // infraestructura (Change World Game v1.3): decrementa las obras en curso y
  // aplica el bono pasivo de toda obra ya operativa (no solo la que completa este mes)
  const infraTick = tickInfrastructure(s.infrastructure ?? defaultInfrastructure());
  if (Object.keys(infraTick.passiveDeltas).length) applyDelta(player, infraTick.passiveDeltas, s.world);
  s.infrastructure = infraTick.state;

  // rutas cerradas: el barril sube mientras dure el bloqueo
  const shock = oilShock(s.disruptions, s.turn);
  if (shock > 0) {
    s.world.oil_price = Math.round((s.world.oil_price + shock) * 10) / 10;
  }

  // las sanciones erosionan la relacion mes a mes
  for (const target of s.sanctions) adjustRelation(s.relations, s.playerCode, target, -2);

  updateCohesion(s.blocs, s.relations);

  const honeymoon = (s.honeymoonUntil ?? 0) >= s.turn;
  s.capital = capitalRegen(s.capital, s.countries[s.playerCode].population.happiness, honeymoon);
  s.capital = clamp(
    s.capital + capitalComboBonus(
      player.economy.fiscal_balance, player.economy.inflation, player.economy.unemployment < prevUnemployment
    ),
    0, 100
  );

  const blocMemberships = s.blocs.filter((b) => b.members.includes(s.playerCode)).length;
  s.capitalDiplomatico = diplomaticCapitalRegen(
    s.capitalDiplomatico, blocMemberships, s.cabinet ? cabinetDiplomaticBonus(s.cabinet) : 0, honeymoon
  );

  return { state: s, oilShockApplied: shock, infrastructureCompleted: infraTick.justCompleted };
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

  if (dec.id === 'sancionar' && target && !s.sanctions.includes(target)) s.sanctions.push(target);
  if (dec.id === 'devaluar') {
    const c = s.countries[s.playerCode];
    c.fx = applyFx(c.fx ?? FX_START, DEVALUE_JUMP);
  }
  if (dec.category === 'previsional') {
    s.pension = applyPensionReform(s.pension ?? defaultPension(), dec.id);
  }
  if (dec.id === 'subir_tasa') {
    s.centralBank = applyRateChange(s.centralBank ?? defaultCentralBank(), 2);
  }
  const infraType = INFRA_DECISION_TYPE[dec.id];
  if (infraType) {
    const infra = s.infrastructure ?? defaultInfrastructure();
    const { item, fiscalCost } = startInfrastructure(infraType, s.moral?.corruption ?? 0);
    s.infrastructure = { items: [...infra.items, item] };
    if (fiscalCost) applyDelta(s.countries[s.playerCode], { fiscal_balance: -fiscalCost }, s.world);
  }

  // diplomacia gasta y rinde en el pool de capital diplomatico, no en el politico
  if (dec.category === 'diplomacia') {
    s.capitalDiplomatico = clamp(s.capitalDiplomatico - dec.cost.capital + (dec.effects.capital ?? 0), 0, 100);
  } else {
    s.capital = clamp(s.capital - dec.cost.capital + (dec.effects.capital ?? 0), 0, 100);
  }
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
  capitalDiplomatico: 'Capital diplomatico',
  trade: 'Comercio total'
};

/** Metricas donde subir es malo. */
const BAD_WHEN_UP: ProjectionKey[] = ['inflation', 'unemployment', 'debt_to_gdp'];

function readMetric(s: SimState, key: ProjectionKey): number {
  const p = s.countries[s.playerCode];
  switch (key) {
    case 'capital': return s.capital;
    case 'capitalDiplomatico': return s.capitalDiplomatico;
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

  // gasto rigido (militar + deficit previsional) vs el 15-18% PBI que
  // el diseño de v1.0 marca como techo sostenible sin crisis de deuda.
  const c = s.countries[s.playerCode];
  const bc = base.countries[base.playerCode];
  const rigidNow = rigidSpendingPctGdp(c, s.pension);
  const rigidBefore = rigidSpendingPctGdp(bc, base.pension);
  if (crossed(rigidNow, rigidBefore, 18, false)) {
    out.push({
      turn: turnOffset, severity: 'grave',
      text: 'Gasto militar + previsional supera el 18% del PBI: riesgo de crisis de deuda.'
    });
  }
  return out;
}

/** Gasto militar + deficit previsional, como % del PBI (0 si hay superavit previsional). */
function rigidSpendingPctGdp(country: Country, pension?: PensionState): number {
  const militaryPctGdp = (country.military.military_budget_bn / (country.economy.gdp_trillion_usd * 1000)) * 100;
  const pensionDeficitPctGdp = pension ? Math.max(0, -pension.resultApplied) : 0;
  return Math.round((militaryPctGdp + pensionDeficitPctGdp) * 100) / 100;
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
    'fiscal_balance', 'debt_to_gdp', 'capital', 'capitalDiplomatico', 'trade'
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
