'use client';

import { create } from 'zustand';
import data from './data/countries.gen.json';
import { BLOCS } from './blocs';
import { DECISIONS } from './decisions';
import {
  ARC_COLORS, adjustRelation, aiCountryDecisions, aiReactions, aiRoster, applyDelta, applySectorShock,
  applyWorldShock, blocEffects,
  buildGrokPrompt, canJoin, checkGameOver, clamp, computeArcs, crisisEvents, damagedSectors,
  dateLabel, eligibleEvents, getRelation, previewDelta, relLabel, resolveRelationTargets,
  ratesOf, rollEvents, taxEffects, type TaxRates
} from './engine';
import type { Reaction } from './engine';
import { CHOKEPOINTS, CHOKEPOINT_OWNER, chokepointClosureRisk } from './routes';
import { tradeBaseline, topPartnerOf, totalTrade } from './trade';
import { buildLocalChronicle } from './chronicle';
import { cloneSim, deterministicTick, eventExtraOf, projectDecision, type SimState } from './simulation';
import {
  campaignEvents, defaultPolitics, DIFFICULTY_PRESETS, driftOpposition, hasMajority, isElectionDue, isMidtermDue,
  legacy, monthsToElection, needsSuccessor, oppositionCostFactor, oppositionSplit, parliamentCostFactor, poll,
  runElection, runMidterm, seatsFromVote, successors, totalSeats,
  type Candidate, type Difficulty, type ElectionResult, type Politics
} from './politics';
import {
  CAPITAL_DIPLOMATICO_START, CAPITAL_ON_MIDTERM_WIN, CAPITAL_ON_WIN, grantHoneymoon, systemOf
} from './electoral';
import {
  addBlocOrder, addCabinetOrder, addDecisionOrder, addEventOrder, addGoldOrder, addRateOrder, addTaxOrder,
  committedCapital, goldFiscalDelta, TAX_FIELD, TAX_LABELS,
  type EventOrder, type PlannedOrder, type TaxKind
} from './orders';
import { cooldownKey, cooldownLeft, cooldownUntil, decisionEligible, scaleDecision } from './diplomacy';
import {
  cabinetCostFactor, cabinetMoralEffects, cabinetUnionPower, cabinetVoteBonus, coalitionDemand,
  coalitionPartners, coalitionSeats, DEMAND_EVERY, factionsOf, ministerById, SEAT_LABEL,
  type Cabinet, type CabinetSeat
} from './cabinet';
import { factionCostFactor, policyKindOf } from './factions';
import {
  clearGame, loadGame, saveGame, savedSummary,
  type PersistedState, type SavedGame
} from './persistence';
import { defaultImf, imfLabel, type ImfState } from './imf';
import { defaultStreet, type StreetState } from './streetPressure';
import { applyFx, DEVALUE_JUMP, FX_START } from './fx';
import { applyPensionReform, defaultPension, pensionFromCountry, pensionReformCostMultiplier, type PensionState } from './pension';
import { defaultEmployment, employmentFromCountry, type EmploymentState } from './employment';
import {
  applyMoralEffects, comisionIntegrityEffective, defaultMoral, MINORITY_LEADERS,
  minorityVoteShare, notableMinoritySwing, tickMoral
} from './moral';
import {
  applyGroupEffects, defaultPopularGroups, groupSwingFeed, mediaCapitalEffect, notableGroupSwing,
  tickPopularGroups
} from './popularGroups';
import { applyRateChange, defaultCentralBank, type CentralBankState } from './centralBank';
import {
  corruptionCostMultiplier, defaultInfrastructure, INFRA_CONFIG, INFRA_DECISION_TYPE, startInfrastructure,
  type InfrastructureState
} from './infrastructure';
import {
  applyEnriqueOutcome, ENRIQUE_ONBOARDING_TURN, enriqueEvents, registerEnriqueCard
} from './events/enrique';
import { buildMilestones, type Milestone } from './milestones';
import type {
  ActiveEvent, Bloc, ChokepointCrisis, Country, Decision, Delta, FeedItem, GameEvent,
  GlobalState, Layers, MapMode, MoralState, PendingEnrique, PopularGroupsState, Projection
} from './types';

// MapMode y Layers viven en lib/types.ts (los comparten el store, la UI y el save)
export type { MapMode, Layers } from './types';

const RAW = data as unknown as {
  countries: Record<string, Country>;
  relations: Record<string, number>;
  global: GlobalState;
  isoToCode: Record<string, string>;
};

export const ISO_TO_CODE = RAW.isoToCode;
export const ALL_COUNTRIES = RAW.countries;

const fresh = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/**
 * Foto de los indicadores en cada turno.
 * Alimenta los graficos que aparecen al pasar el mouse por un KPI: el numero
 * de hoy dice poco si no se ve de donde viene.
 */
export interface HistoryPoint {
  turn: number;
  happiness: number;
  stability: number;
  inflation: number;
  growth: number;
  gdp: number;
  unemployment: number;
  fiscal: number;
  debt: number;
  capital: number;
  opposition: number;
  tension: number;
  oil: number;
  /** indice de tipo de cambio. 100 = arranque. Saves viejos no lo traen. */
  fx?: number;
  /** capital diplomatico. Saves viejos no lo traen. */
  capitalDiplomatico?: number;
}

interface GameStore {
  started: boolean;
  playerCode: string;
  turn: number;
  capital: number;
  /** capital diplomatico: pool separado, solo lo mueven decisiones de categoria diplomacia y bloques */
  capitalDiplomatico: number;
  world: GlobalState;
  countries: Record<string, Country>;
  relations: Record<string, number>;
  blocs: Bloc[];
  sanctions: string[];
  feed: FeedItem[];
  pending: ActiveEvent[];
  active: ActiveEvent[];
  recentEventIds: string[];
  reactions: Reaction[];
  lastActions: string[];
  history: HistoryPoint[];
  selected: string | null;
  mapMode: MapMode;
  layers: Layers;
  /** resumen de la partida guardada en localStorage, si hay alguna */
  savedGame: SavedGame['summary'] | null;
  /** chokepoint id -> turno en que se reabre */
  disruptions: Record<string, number>;
  /** comercio total de cada pais al empezar la partida, para medir el impacto */
  tradeBase: Record<string, number>;
  /** tasas impositivas iniciales: el efecto fiscal se mide contra estas */
  taxBase: Record<string, TaxRates>;
  /** mandato, partido y oposicion */
  politics: Politics;
  /** PBI al asumir, para el balance de gestion del final */
  startingGdp: number;
  /**
   * Plan del turno: lo que decidiste hacer, todavia sin ejecutar.
   * Se aplica entero al avanzar el mes.
   */
  orders: PlannedOrder[];
  /** acciones diplomaticas en enfriamiento: "decision|pais" -> turno en que se liberan */
  cooldowns: Record<string, number>;
  /** decisiones "once" ya usadas en toda la partida (id o id|target) */
  usedOnce: string[];
  /** quien ocupa cada silla del gabinete */
  cabinet: Cabinet;
  /** turno de la ultima factura del socio de coalicion */
  lastCoalitionDemand: number;
  /** arco FMI del jugador */
  imf: ImfState;
  /** presion de calle por inflacion/desempleo altos sostenidos */
  street: StreetState;
  /** sistema previsional del jugador (Change World Game v1.0) */
  pension: PensionState;
  /** empleo formal/informal y salario real del jugador */
  employment: EmploymentState;
  /** sistema moral: corrupcion, justicia, lideres minoritarios (Change World Game v1.1) */
  moral: MoralState;
  /** popularidad por sector: 5 grupos con intereses distintos (Change World Game v1.2) */
  groups: PopularGroupsState;
  /** Banco Central: tasa de interes + Confianza (Change World Game v1.2) */
  centralBank: CentralBankState;
  /** Infraestructura del jugador: aeropuerto, puerto, base militar, centro de datos IA (Change World Game v1.3) */
  infrastructure: InfrastructureState;
  /** hitos institucionales de toda la partida, para el recap de fin de partida (lib/milestones.ts, lib/recap.ts) */
  milestones: Milestone[];
  /** onboarding de Enrique (mes 4) o su carta actual, esperando al jugador en pantalla completa */
  pendingEnrique: PendingEnrique;
  /** resuelve la carta o el paso de onboarding de Enrique actual (aplica YA, no espera a endTurn) */
  resolveEnrique: (choiceId?: string) => void;
  /** eleccion resuelta esperando que el jugador la lea */
  election: ElectionResult | null;
  /** candidatos a sucederte: si esta lleno, la partida espera tu eleccion */
  succession: Candidate[];
  gameOver: { title: string; body: string } | null;

  start: (code: string, difficulty?: Difficulty) => void;
  toggleLayer: (l: keyof Layers) => void;
  /** carga la partida guardada; devuelve false si no habia ninguna */
  loadSaved: () => boolean;
  /** borra el save y vuelve a la pantalla de seleccion de pais */
  newGame: () => void;
  refreshSavedSummary: () => void;
  /** cierra un paso maritimo por N turnos (lo usan los eventos y el debug) */
  triggerChokepointCrisis: (id: string, turns: number, cause?: string) => void;
  clearChokepointCrisis: (id: string) => void;
  activeCrises: () => ChokepointCrisis[];
  /** que pasaria si tomo esta decision, a 3 turnos vista */
  previewDecision: (id: string, target?: string) => Projection | null;
  /** planifica mover una alicuota; los cambios sobre la misma se consolidan */
  planTaxChange: (kind: TaxKind, delta: number) => void;
  /** Banco Central: planifica comprar o vender oro; se consolida igual que los impuestos */
  planGoldOrder: (action: 'comprar' | 'vender', tonnes: number) => void;
  /** Banco Central: planifica mover la tasa de interes; se consolida igual que los impuestos */
  planRateChange: (delta: number) => void;
  /** intencion de voto proyectada de hoy */
  currentPoll: () => number;
  /** elige quien te sucede cuando se te agotan los mandatos */
  chooseSuccessor: (id: string) => void;
  /** cierra el cartel del resultado electoral */
  dismissElection: () => void;
  reset: () => void;
  select: (code: string | null) => void;
  setMapMode: (m: MapMode) => void;
  /** suma una decision al plan del turno (no la ejecuta) */
  planDecision: (id: string, target?: string) => void;
  /** elige como responder a un evento abierto (se resuelve al avanzar el mes) */
  planEventChoice: (key: string, choiceId: string) => void;
  /** quita una orden del plan */
  cancelOrder: (index: number) => void;
  /** vacia el plan del turno */
  clearOrders: () => void;
  /** capital politico que queda libre despues de comprometer el plan */
  availableCapital: () => number;
  /** capital diplomatico que queda libre despues de comprometer el plan */
  availableCapitalDiplomatico: () => number;
  /** nombra o saca a un ministro (queda en el plan del turno) */
  planCabinet: (seat: CabinetSeat, ministerId: string | null) => void;
  /** costo y efectos reales de una decision contra un pais concreto */
  quoteDecision: (id: string, target?: string) => {
    cost: number; size: number; reason: string; cooldown: number;
  } | null;
  endTurn: () => void;
  planJoinBloc: (id: string) => void;
  planLeaveBloc: (id: string) => void;
  planSummit: (id: string) => void;
  grokPrompt: () => string;
  applyGrokJson: (raw: string) => string;
}

const initial = () => ({
  started: false,
  playerCode: '',
  turn: 1,
  capital: 60,
  capitalDiplomatico: CAPITAL_DIPLOMATICO_START,
  world: fresh(RAW.global),
  countries: fresh(RAW.countries),
  relations: fresh(RAW.relations),
  blocs: fresh(BLOCS),
  sanctions: [] as string[],
  feed: [] as FeedItem[],
  pending: [] as ActiveEvent[],
  active: [] as ActiveEvent[],
  recentEventIds: [] as string[],
  reactions: [] as Reaction[],
  lastActions: [] as string[],
  history: [] as HistoryPoint[],
  selected: null as string | null,
  mapMode: 'relaciones' as MapMode,
  layers: {
    diplomacia: true, comercio: true, rutas: true,
    points: true, capitals: false, ports: true, airports: true, infraestructura: true
  } as Layers,
  savedGame: null as SavedGame['summary'] | null,
  disruptions: {} as Record<string, number>,
  tradeBase: {} as Record<string, number>,
  taxBase: {} as Record<string, TaxRates>,
  politics: {
    partyName: '', leaderName: '', termStart: 1, termLength: 48,
    consecutiveTerms: 1, maxConsecutive: 2, opposition: 40,
    electionsWon: 0, powerSince: 1, honeymoonUntil: 5, pendingBallotage: false
  } as Politics,
  startingGdp: 0,
  orders: [] as PlannedOrder[],
  cooldowns: {} as Record<string, number>,
  usedOnce: [] as string[],
  cabinet: {} as Cabinet,
  lastCoalitionDemand: 0,
  imf: defaultImf(),
  street: defaultStreet(),
  pension: defaultPension(),
  employment: defaultEmployment(),
  moral: defaultMoral(),
  groups: defaultPopularGroups(),
  centralBank: defaultCentralBank(),
  infrastructure: defaultInfrastructure(),
  milestones: [] as Milestone[],
  pendingEnrique: null as PendingEnrique,
  election: null as ElectionResult | null,
  succession: [] as Candidate[],
  gameOver: null as { title: string; body: string } | null
});

/** Estado serializable: lo que va al save. Nunca incluye funciones. */
function snapshot(st: GameStore): PersistedState {
  return {
    playerCode: st.playerCode,
    turn: st.turn,
    capital: st.capital,
    capitalDiplomatico: st.capitalDiplomatico,
    world: st.world,
    countries: st.countries,
    relations: st.relations,
    blocs: st.blocs,
    sanctions: st.sanctions,
    feed: st.feed.slice(0, 60),
    pending: st.pending,
    active: st.active,
    recentEventIds: st.recentEventIds,
    lastActions: st.lastActions,
    history: st.history,
    selected: st.selected,
    mapMode: st.mapMode,
    layers: st.layers,
    disruptions: st.disruptions,
    tradeBase: st.tradeBase,
    taxBase: st.taxBase,
    politics: st.politics,
    startingGdp: st.startingGdp,
    orders: st.orders,
    cooldowns: st.cooldowns,
    usedOnce: st.usedOnce,
    cabinet: st.cabinet,
    lastCoalitionDemand: st.lastCoalitionDemand,
    imf: st.imf,
    street: st.street,
    pension: st.pension,
    employment: st.employment,
    moral: st.moral,
    groups: st.groups,
    centralBank: st.centralBank,
    infrastructure: st.infrastructure,
    pendingEnrique: st.pendingEnrique,
    milestones: st.milestones,
    gameOver: st.gameOver
  };
}

/**
 * Costo final de una decision. Suman cuatro frentes:
 *  - la oposicion en la calle encarece todo
 *  - sin mayoria en el Congreso, las medidas grandes hay que negociarlas
 *  - un ministro de esa area las abarata
 *  - las facciones del gabinete empujan gasto o ajuste segun su perfil
 *    (un sindical abarata gasto y encarece ajuste; un liberal, al reves)
 */
function decisionCost(st: GameStore, dec: Decision, baseCost: number): number {
  const seats = coalitionSeats(st.cabinet);
  let factor =
    oppositionCostFactor(st.politics.opposition)
    * parliamentCostFactor(st.politics, baseCost, seats)
    * cabinetCostFactor(st.cabinet, dec.category)
    * factionCostFactor(factionsOf(st.cabinet), policyKindOf(dec.id));
  // reformas previsionales: crisis fiscal visible, superavit+inflacion baja
  // o capital politico alto abaratan la reforma (lib/pension.ts, paquete v1.0)
  if (dec.category === 'previsional') {
    const e = st.countries[st.playerCode].economy;
    factor *= pensionReformCostMultiplier({
      crisisFiscal: e.fiscal_balance < -3,
      surplusLowInflation: e.fiscal_balance >= 0 && e.inflation < 5,
      capitalHigh: st.capital > 15
    });
  }
  // infraestructura: la coima se lleva una parte del capital politico que
  // cuesta imponerla, igual que se lleva parte de la caja (lib/infrastructure.ts)
  if (dec.category === 'infraestructura') {
    factor *= corruptionCostMultiplier(st.moral.corruption);
  }
  return Math.max(1, Math.round(baseCost * factor));
}

interface PlanRun {
  countries: Record<string, Country>;
  relations: Record<string, number>;
  world: GlobalState;
  blocs: Bloc[];
  sanctions: string[];
  capital: number;
  /** capital diplomatico despues del plan: solo lo tocan decisiones diplomacia y bloques */
  capitalDiplomatico: number;
  feed: FeedItem[];
  pending: ActiveEvent[];
  lastActions: string[];
  /** hostilidad neta de lo que hiciste: define el tono de las reacciones */
  hostility: number;
  /** enfriamientos actualizados */
  cooldowns: Record<string, number>;
  /** gabinete despues de los cambios del plan */
  cabinet: Cabinet;
  /** previsional despues de las reformas del plan (para que el tick las lea este mismo turno) */
  pension: PensionState;
  /** politica despues del lever directo de oposicion del plan (ver Delta.opposition) */
  politics: Politics;
  /** decisiones "once" ya usadas, incluyendo las de este mismo plan */
  usedOnce: string[];
  /** moral despues de moralEffects del plan (decisiones y elecciones de eventos) */
  moral: MoralState;
  /** grupos populares despues de groupEffects del plan (decisiones y elecciones de eventos) */
  groups: PopularGroupsState;
  /** Banco Central despues de un cambio de tasa planificado (decision, orden directa, o carta de evento) */
  centralBank: CentralBankState;
  /** infraestructura despues de una obra nueva planificada este turno */
  infrastructure: InfrastructureState;
}

/**
 * Ejecuta el plan del turno.
 *
 * Es el unico lugar donde las ordenes tocan el mundo. Mientras el jugador
 * planifica no se aplica nada, asi puede probar, comparar y arrepentirse sin
 * ensuciar la partida ni el historial: al historial entra lo que quedo en el
 * plan cuando apreto avanzar mes, una sola linea por accion.
 */
function runPlan(st: GameStore, orders: PlannedOrder[]): PlanRun {
  const run: PlanRun = {
    countries: fresh(st.countries),
    relations: { ...st.relations },
    world: fresh(st.world),
    blocs: fresh(st.blocs),
    sanctions: [...st.sanctions],
    capital: st.capital,
    capitalDiplomatico: st.capitalDiplomatico,
    feed: [],
    pending: [...st.pending],
    lastActions: [],
    hostility: 0,
    cooldowns: { ...st.cooldowns },
    cabinet: { ...st.cabinet },
    pension: st.pension,
    politics: { ...st.politics },
    usedOnce: [...st.usedOnce],
    moral: st.moral,
    groups: st.groups,
    centralBank: st.centralBank,
    infrastructure: st.infrastructure
  };

  const log = (emoji: string, title: string, body: string, tone: FeedItem['tone'] = 'neutral') => {
    run.feed.push({ turn: st.turn, date: dateLabel(run.world), kind: 'decision', emoji, title, body, tone });
    run.lastActions.push(title);
  };

  for (const order of orders) {
    // decisiones de categoria diplomacia y movimientos de bloque pagan del
    // pool de capital diplomatico; todo el resto (impuestos, oro, eventos,
    // gabinete, y las demas decisiones) del capital politico
    const paysDiplomatico = order.kind === 'bloc' || (order.kind === 'decision' && order.pool === 'diplomatico');
    if (paysDiplomatico) run.capitalDiplomatico = clamp(run.capitalDiplomatico - order.capitalCost, 0, 100);
    else run.capital = clamp(run.capital - order.capitalCost, 0, 100);

    // ---------------------------------------------------------- decisiones
    if (order.kind === 'decision') {
      const dec = DECISIONS.find((d) => d.id === order.id);
      if (!dec) continue;

      // los efectos tambien escalan: un tratado con Estados Unidos mueve la
      // aguja mucho mas que el mismo tratado con Uruguay
      const scaled = scaleDecision(
        dec, run.countries[st.playerCode], order.target ? run.countries[order.target] : undefined, run.relations
      );
      applyDelta(run.countries[st.playerCode], scaled.effects, run.world);
      run.cooldowns[cooldownKey(order.id, order.target)] = cooldownUntil(dec, st.turn);
      if (dec.once) run.usedOnce = [...run.usedOnce, cooldownKey(order.id, order.target)];

      for (const rd of dec.relations ?? []) {
        const targets = resolveRelationTargets(rd, {
          player: st.playerCode, target: order.target, countries: run.countries, blocs: run.blocs
        });
        targets.forEach((t) => adjustRelation(run.relations, st.playerCode, t, rd.amount));
        run.hostility += rd.amount;
      }

      if (dec.id === 'sancionar' && order.target && !run.sanctions.includes(order.target)) {
        run.sanctions.push(order.target);
      }
      if (dec.id === 'devaluar') {
        const c = run.countries[st.playerCode];
        c.fx = applyFx(c.fx ?? FX_START, DEVALUE_JUMP);
      }
      if (dec.category === 'previsional') {
        run.pension = applyPensionReform(run.pension, dec.id);
      }
      if (dec.id === 'subir_tasa') {
        run.centralBank = applyRateChange(run.centralBank, 2);
      }
      const infraType = INFRA_DECISION_TYPE[dec.id];
      if (infraType) {
        const { item, fiscalCost } = startInfrastructure(infraType, run.moral.corruption);
        run.infrastructure = { items: [...run.infrastructure.items, item] };
        if (fiscalCost) {
          applyDelta(run.countries[st.playerCode], { fiscal_balance: -fiscalCost }, run.world);
        }
      }
      if (dec.effects.opposition) {
        run.politics = {
          ...run.politics,
          opposition: clamp(run.politics.opposition + dec.effects.opposition, 0, 100)
        };
      }
      if (dec.moralEffects) {
        run.moral = applyMoralEffects(run.moral, dec.moralEffects);
      }
      if (dec.groupEffects) {
        run.groups = applyGroupEffects(run.groups, dec.groupEffects);
      }
      // las decisiones de diplomacia rinden en capital diplomatico, no politico
      if (dec.category === 'diplomacia') {
        run.capitalDiplomatico = clamp(run.capitalDiplomatico + (dec.effects.capital ?? 0), 0, 100);
      } else if (dec.effects.capital) {
        run.capital = clamp(run.capital + dec.effects.capital, 0, 100);
      }
      log(dec.emoji, order.label, dec.detail);
      continue;
    }

    // ---------------------------------------------------------- impuestos
    if (order.kind === 'tax') {
      const e = run.countries[st.playerCode].economy;
      const field = TAX_FIELD[order.rate];
      const before = e[field];
      const after = clamp(Math.round((before + order.delta) * 10) / 10, 0, 60);
      if (after === before) continue;
      e[field] = after;
      const fx = taxEffects(run.countries[st.playerCode], st.taxBase[st.playerCode]);
      log(
        order.emoji,
        `${TAX_LABELS[order.rate]}: ${before}% -> ${after}%`,
        `Contra la estructura con la que arrancaste: recaudacion ${fx.fiscal >= 0 ? '+' : ''}${fx.fiscal} del PBI, `
        + `crecimiento ${fx.growth >= 0 ? '+' : ''}${fx.growth}, humor social ${fx.happiness >= 0 ? '+' : ''}${fx.happiness} por turno.`
      );
      continue;
    }

    // ---------------------------------------------------------- banco central
    if (order.kind === 'gold') {
      const e = run.countries[st.playerCode].economy;
      const signedTonnes = order.action === 'comprar' ? order.tonnes : -order.tonnes;
      const before = e.gold_reserves_tonnes;
      e.gold_reserves_tonnes = Math.round(Math.max(0, before + signedTonnes) * 10) / 10;
      const fiscalDelta = goldFiscalDelta(order.action, order.tonnes);
      e.fiscal_balance = Math.round((e.fiscal_balance + fiscalDelta) * 100) / 100;
      log(
        order.emoji,
        order.label,
        order.action === 'comprar'
          ? `Reservas ${before} t -> ${e.gold_reserves_tonnes} t. Balance fiscal ${fiscalDelta} del PBI (sale caja para pagar el oro).`
          : `Reservas ${before} t -> ${e.gold_reserves_tonnes} t. Balance fiscal +${fiscalDelta} del PBI (entra caja, con descuento por vender rapido).`
      );
      continue;
    }

    // ---------------------------------------------------------- tasa de interes
    if (order.kind === 'rate') {
      const before = run.centralBank.rate;
      run.centralBank = applyRateChange(run.centralBank, order.delta);
      log(
        order.emoji,
        order.label,
        `Tasa de politica: ${before}% -> ${run.centralBank.rate}%. Pega sobre inflacion, crecimiento y tipo de cambio desde el mes que viene.`
      );
      continue;
    }

    // ---------------------------------------------------------- bloques
    if (order.kind === 'bloc') {
      const bloc = run.blocs.find((b) => b.id === order.blocId);
      if (!bloc) continue;

      if (order.action === 'join') {
        if (bloc.members.includes(st.playerCode)) continue;
        bloc.members.push(st.playerCode);
        bloc.candidates = bloc.candidates.filter((c) => c !== st.playerCode);
        bloc.cohesion = clamp(bloc.cohesion - 4, 0, 100);
        bloc.members.forEach((m) => m !== st.playerCode && adjustRelation(run.relations, st.playerCode, m, 10));
        bloc.rivals.forEach((r) => adjustRelation(run.relations, st.playerCode, r, -15));
        run.feed.push({
          turn: st.turn, date: dateLabel(run.world), kind: 'bloque', emoji: '🤝',
          title: `${run.countries[st.playerCode].name} ingresa a ${bloc.short}`,
          body: bloc.rules[0], tone: 'bueno'
        });
        run.lastActions.push(order.label);
      } else if (order.action === 'leave') {
        if (!bloc.members.includes(st.playerCode)) continue;
        bloc.members = bloc.members.filter((m) => m !== st.playerCode);
        bloc.cohesion = clamp(bloc.cohesion - 10, 0, 100);
        bloc.members.forEach((m) => adjustRelation(run.relations, st.playerCode, m, -20));
        applyDelta(run.countries[st.playerCode], { gdp_growth: -0.5, stability: -3 }, undefined);
        run.hostility -= 20;
        run.feed.push({
          turn: st.turn, date: dateLabel(run.world), kind: 'bloque', emoji: '🚪',
          title: `${run.countries[st.playerCode].name} abandona ${bloc.short}`,
          body: 'Los socios lo leen como una traicion. Cae el comercio y la confianza.', tone: 'malo'
        });
        run.lastActions.push(order.label);
      } else {
        if (!bloc.members.includes(st.playerCode)) continue;
        bloc.cohesion = clamp(bloc.cohesion + 8, 0, 100);
        bloc.members.forEach((m) => m !== st.playerCode && adjustRelation(run.relations, st.playerCode, m, 8));
        run.feed.push({
          turn: st.turn, date: dateLabel(run.world), kind: 'bloque', emoji: '🏛️',
          title: `Cumbre de ${bloc.short} en ${run.countries[st.playerCode].capital}`,
          body: `Cohesion del bloque +8 (ahora ${bloc.cohesion}). Las relaciones con los socios mejoran.`,
          tone: 'bueno'
        });
        run.lastActions.push(order.label);
      }
      continue;
    }

    // ---------------------------------------------------------- gabinete
    if (order.kind === 'cabinet') {
      const saliente = ministerById(run.cabinet[order.seat]);
      const entrante = ministerById(order.ministerId ?? undefined);

      if (order.ministerId) run.cabinet[order.seat] = order.ministerId;
      else delete run.cabinet[order.seat];

      // mover el gabinete siempre cuesta algo de estabilidad: es senal de crisis
      applyDelta(run.countries[st.playerCode], { stability: saliente ? -1.5 : 0 }, run.world);

      const detalle = entrante
        ? `${entrante.description}${entrante.party !== 'oficialismo' ? ' Es un gesto de coalicion: suma votos y escanos, y va a pedir algo a cambio.' : ''}`
        : `${SEAT_LABEL[order.seat]} queda sin titular. Nadie coordina esa area.`;

      run.feed.push({
        turn: st.turn, date: dateLabel(run.world), kind: 'decision', emoji: order.emoji,
        title: saliente && entrante
          ? `${SEAT_LABEL[order.seat]}: sale ${saliente.name}, entra ${entrante.name}`
          : order.label,
        body: detalle,
        tone: entrante?.party !== 'oficialismo' && entrante ? 'bueno' : 'neutral'
      });
      run.lastActions.push(order.label);
      continue;
    }

    // ---------------------------------------------------------- eventos
    if (order.kind === 'event') {
      const item = run.pending.find((x) => x.key === order.eventKey);
      const choice = item?.event.choices?.find((c) => c.id === order.choiceId);
      if (!item || !choice) continue;

      applyDelta(run.countries[st.playerCode], choice.effects, run.world);
      if (choice.moralEffects) {
        run.moral = applyMoralEffects(run.moral, choice.moralEffects);
      }
      if (choice.groupEffects) {
        run.groups = applyGroupEffects(run.groups, choice.groupEffects);
      }
      if (choice.rateEffect) {
        run.centralBank = applyRateChange(run.centralBank, choice.rateEffect);
      }

      let outcome = choice.detail;
      let tone: FeedItem['tone'] = 'neutral';
      if (choice.risk && Math.random() < choice.risk.chance) {
        applyDelta(run.countries[st.playerCode], choice.risk.effects, run.world);
        outcome = `${choice.detail} PERO: ${choice.risk.label}.`;
        tone = 'malo';
      }

      for (const rd of choice.relations ?? []) {
        const targets = resolveRelationTargets(rd, {
          player: st.playerCode, target: item.target, countries: run.countries, blocs: run.blocs
        });
        targets.forEach((t) => adjustRelation(run.relations, st.playerCode, t, rd.amount));
        run.hostility += rd.amount;
      }

      run.capital = clamp(run.capital + (choice.effects.capital ?? 0), 0, 100);

      // si le dijiste que no al socio de coalicion, se levanta de la mesa
      if (order.choiceId === 'romper') {
        const socio = coalitionPartners(run.cabinet)[0];
        if (socio) {
          delete run.cabinet[socio.seat];
          run.feed.push({
            turn: st.turn, date: dateLabel(run.world), kind: 'sistema', emoji: '💔',
            title: `${socio.name} deja el gabinete`,
            body: `Se lleva ${socio.seats ?? 0} escanos y su bloque pasa a la oposicion. `
              + 'Las medidas grandes vuelven a costarte el doble de negociacion.',
            tone: 'malo'
          });
        }
      }

      run.pending = run.pending.filter((x) => x.key !== order.eventKey);
      run.feed.push({
        turn: st.turn, date: dateLabel(run.world), kind: 'evento', emoji: item.event.emoji,
        title: `${item.event.title}: ${choice.label}`, body: outcome, tone
      });
      run.lastActions.push(order.label);
    }
  }

  return run;
}

/**
 * Aplica el resultado de una eleccion sobre el estado.
 * Ganar abre un mandato nuevo; perder termina la partida con el balance de
 * gestion. Se usa tanto cuando te presentas vos como cuando compite tu sucesor.
 */
function applyElection(st: GameStore, result: ElectionResult, candidate?: Candidate): Partial<GameStore> {
  const country = st.countries[st.playerCode];
  const sys = systemOf(st.playerCode);
  const feed: FeedItem[] = [
    {
      turn: st.turn,
      date: dateLabel(st.world),
      kind: 'sistema',
      emoji: result.ballotage ? '🗳️' : result.won ? '🗳️' : '🏛️',
      title: result.headline,
      body: `${result.detail} Participacion: ${result.turnout}%.`,
      tone: result.ballotage ? 'neutral' : result.won ? 'bueno' : 'malo'
    }
  ];

  if (result.ballotage) {
    return {
      election: result,
      politics: { ...st.politics, pendingBallotage: true },
      feed: [...feed, ...st.feed]
    };
  }

  if (!result.won) {
    const balance = legacy(st.politics, st.turn, country, st.startingGdp);
    return {
      election: result,
      politics: { ...st.politics, pendingBallotage: false },
      feed: [...feed, ...st.feed],
      gameOver: {
        title: 'Tu partido pierde el gobierno',
        body: `${balance.years} anios en el poder y ${balance.elections} elecciones ganadas. `
          + `El PBI ${balance.gdpChange >= 0 ? 'crecio' : 'cayo'} ${Math.abs(balance.gdpChange)}%, `
          + `la inflacion quedo en ${balance.inflation}% y la felicidad en ${balance.happiness}. `
          + `Ahora gobierna la oposicion.`
      }
    };
  }

  const years = Math.round((sys.termMonths / 12) * 10) / 10;
  const politics: Politics = {
    ...st.politics,
    termStart: st.turn,
    consecutiveTerms: st.politics.consecutiveTerms + 1,
    electionsWon: st.politics.electionsWon + 1,
    // el Congreso se renueva a medias: ganar la presidencial arrastra, no barre
    seats: seatsFromVote(result.vote, st.politics.seats),
    opposition: clamp(st.politics.opposition - 12, 0, 100),
    honeymoonUntil: grantHoneymoon(st.turn),
    pendingBallotage: false
  };

  feed.unshift({
    turn: st.turn,
    date: dateLabel(st.world),
    kind: 'sistema',
    emoji: '🎉',
    title: candidate ? `${candidate.name} asume por ${politics.partyName}` : 'Arranca un nuevo mandato',
    body: candidate
      ? `${candidate.description} Mandato numero ${politics.electionsWon} del partido. Luna de miel: 4 meses.`
      : `${years} anios mas. +${CAPITAL_ON_WIN} de capital. La oposicion queda en ${politics.opposition}.`,
    tone: 'bueno'
  });

  return {
    election: result,
    politics,
    capital: clamp(st.capital + CAPITAL_ON_WIN, 0, 100),
    feed: [...feed, ...st.feed]
  };
}

function applyMidterm(st: GameStore, result: ElectionResult): Partial<GameStore> {
  const seats = seatsFromVote(result.vote, st.politics.seats);
  const feed: FeedItem = {
    turn: st.turn,
    date: dateLabel(st.world),
    kind: 'sistema',
    emoji: '🗳️',
    title: result.headline,
    body: result.detail,
    tone: result.won ? 'bueno' : 'malo'
  };
  if (result.won) {
    return {
      election: result,
      capital: clamp(st.capital + CAPITAL_ON_MIDTERM_WIN, 0, 100),
      politics: {
        ...st.politics,
        honeymoonUntil: grantHoneymoon(st.turn),
        opposition: clamp(st.politics.opposition - 8, 0, 100),
        seats
      },
      feed: [feed, ...st.feed]
    };
  }
  return {
    election: result,
    politics: { ...st.politics, opposition: clamp(st.politics.opposition + 10, 0, 100), seats },
    feed: [feed, ...st.feed]
  };
}

export const useGame = create<GameStore>((set, get) => {
  const doPersist = () => {
    const st = get();
    if (!st.started || !st.playerCode) return;
    const player = st.countries[st.playerCode];
    saveGame(snapshot(st), {
      playerCode: st.playerCode,
      playerName: player.name,
      flag: player.flag,
      turn: st.turn,
      date: dateLabel(st.world)
    });
  };

  // El guardado serializa el estado entero (JSON.stringify + localStorage)
  // en el hilo principal. Se llama despues de cada accion que cambia el
  // mundo, y algunas (subir/bajar impuestos en el plan) pueden dispararse
  // varias veces seguidas: se agrupan en un solo guardado 400ms despues del
  // ultimo cambio en vez de escribir en cada click. Si el jugador cierra o
  // esconde la pestana antes de eso, se fuerza el guardado pendiente.
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  const persist = () => {
    if (typeof window === 'undefined') {
      doPersist();
      return;
    }
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      doPersist();
    }, 400);
  };
  if (typeof window !== 'undefined') {
    const flush = () => {
      if (!persistTimer) return;
      clearTimeout(persistTimer);
      persistTimer = null;
      doPersist();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
  }

  /** Estado que consumen las funciones puras de lib/simulation.ts. */
  const simOf = (st: GameStore): SimState => ({
    turn: st.turn,
    playerCode: st.playerCode,
    countries: st.countries,
    relations: st.relations,
    blocs: st.blocs,
    world: st.world,
    capital: st.capital,
    capitalDiplomatico: st.capitalDiplomatico,
    sanctions: st.sanctions,
    disruptions: st.disruptions,
    tradeBase: st.tradeBase,
    active: st.active,
    taxBase: st.taxBase,
    politics: st.politics,
    honeymoonUntil: st.politics.honeymoonUntil,
    imf: st.imf,
    street: st.street,
    pension: st.pension,
    employment: st.employment,
    centralBank: st.centralBank,
    infrastructure: st.infrastructure,
    // sin esto, el preview de "eventos que se habilitan/desactivan" nunca ve
    // los eventos gateados en moral (mismo bug que en eventExtraOf de endTurn)
    moral: st.moral
  });

  return {
  ...initial(),

  start: (code, difficulty = 'normal') => {
    const s = initial();
    const player = s.countries[code];
    player.fx = FX_START;
    const preset = DIFFICULTY_PRESETS[difficulty];
    const baseline = tradeBaseline({
      countries: s.countries,
      relations: s.relations,
      blocs: s.blocs,
      sanctions: [],
      playerCode: code,
      disruptions: {},
      turn: 1
    });
    const taxBase = Object.fromEntries(
      Object.values(s.countries).map((c) => [c.code, ratesOf(c)])
    );
    const politics = defaultPolitics(player, 1, difficulty);
    set({
      ...s,
      started: true,
      playerCode: code,
      selected: code,
      tradeBase: baseline,
      taxBase,
      politics,
      capital: preset.capital,
      startingGdp: player.economy.gdp_trillion_usd,
      imf: defaultImf(),
      street: defaultStreet(),
      pension: pensionFromCountry(code),
      employment: employmentFromCountry(code),
      feed: [
        {
          turn: 1,
          date: dateLabel(s.world),
          kind: 'sistema',
          emoji: player.flag,
          title: `Asumis el gobierno de ${player.name}`,
          body: `Inflacion ${player.economy.inflation}% - desempleo ${player.economy.unemployment}% - deuda ${player.economy.debt_to_gdp}% del PBI. Tenes ${preset.capital} de capital politico y cuatro anios de mandato por delante. Dificultad: ${preset.label}.`,
          tone: 'neutral'
        }
      ],
      history: [
        {
          turn: 1,
          happiness: player.population.happiness,
          stability: player.population.stability,
          inflation: player.economy.inflation,
          growth: player.economy.gdp_growth,
          gdp: player.economy.gdp_trillion_usd,
          unemployment: player.economy.unemployment,
          fiscal: player.economy.fiscal_balance,
          debt: player.economy.debt_to_gdp,
          capital: preset.capital,
          opposition: politics.opposition,
          tension: s.world.global_tension,
          oil: s.world.oil_price,
          fx: FX_START,
          capitalDiplomatico: CAPITAL_DIPLOMATICO_START
        }
      ]
    });
    persist();
  },

  reset: () => set({ ...initial(), savedGame: savedSummary() }),
  select: (code) => set({ selected: code }),
  toggleLayer: (l) => {
    set((st) => ({ layers: { ...st.layers, [l]: !st.layers[l] } }));
    persist();
  },

  // ---------------------------------------------------------- guardado
  refreshSavedSummary: () => set({ savedGame: savedSummary() }),

  /** Carga la partida guardada. Devuelve false si no habia ninguna. */
  loadSaved: () => {
    const saved = loadGame();
    if (!saved) {
      set({ savedGame: null });
      return false;
    }
    const st = saved.state;
    set({
      ...initial(),
      started: true,
      savedGame: saved.summary,
      playerCode: st.playerCode,
      turn: st.turn,
      capital: st.capital,
      // saves viejos no traen capital diplomatico: arranca con la semilla de siempre
      capitalDiplomatico: st.capitalDiplomatico ?? CAPITAL_DIPLOMATICO_START,
      world: st.world,
      countries: (() => {
        const c = st.countries;
        const p = c[st.playerCode];
        if (p && p.fx === undefined) p.fx = FX_START;
        return c;
      })(),
      relations: st.relations,
      blocs: st.blocs,
      sanctions: st.sanctions,
      feed: st.feed,
      pending: st.pending,
      active: st.active ?? [],
      recentEventIds: st.recentEventIds,
      lastActions: st.lastActions,
      // un save viejo no trae los indicadores que se agregaron despues:
      // se completan con cero para que el grafico no rompa
      history: st.history.map((h) => ({
        unemployment: 0, fiscal: 0, debt: 0, capital: 0, opposition: 0, tension: 0, oil: 0, fx: FX_START,
        capitalDiplomatico: CAPITAL_DIPLOMATICO_START,
        ...h
      })),
      selected: st.selected ?? st.playerCode,
      mapMode: st.mapMode,
      // un save viejo puede no traer las capas nuevas: se completan con los valores por defecto
      layers: { ...initial().layers, ...st.layers },
      disruptions: st.disruptions,
      tradeBase: st.tradeBase,
      // un save v1 no traia taxBase: se reconstruye con las tasas actuales,
      // que es exactamente el comportamiento de "todavia no tocaste nada"
      taxBase: st.taxBase ?? Object.fromEntries(
        Object.values(st.countries).map((c) => [c.code, ratesOf(c)])
      ),
      // saves viejos sin ciclo electoral: se les crea el mandato desde cero
      politics: (() => {
        const p = st.politics ?? defaultPolitics(st.countries[st.playerCode], st.turn);
        return {
          ...p,
          honeymoonUntil: p.honeymoonUntil ?? 0,
          pendingBallotage: p.pendingBallotage ?? false,
          oppositionParties: p.oppositionParties,
          coalitionOffered: p.coalitionOffered ?? false
        };
      })(),
      startingGdp: st.startingGdp ?? st.countries[st.playerCode].economy.gdp_trillion_usd,
      orders: st.orders ?? [],
      cooldowns: st.cooldowns ?? {},
      usedOnce: st.usedOnce ?? [],
      cabinet: st.cabinet ?? {},
      lastCoalitionDemand: st.lastCoalitionDemand ?? 0,
      imf: st.imf ?? defaultImf(),
      street: st.street ?? defaultStreet(),
      pension: st.pension ?? pensionFromCountry(st.playerCode),
      employment: st.employment ?? employmentFromCountry(st.playerCode),
      moral: st.moral ?? defaultMoral(),
      groups: st.groups ?? defaultPopularGroups(),
      centralBank: st.centralBank ?? defaultCentralBank(),
      infrastructure: st.infrastructure ?? defaultInfrastructure(),
      pendingEnrique: st.pendingEnrique ?? null,
      milestones: st.milestones ?? [],
      gameOver: st.gameOver
    });
    return true;
  },

  /** Borra el save y vuelve a la seleccion de pais. */
  newGame: () => {
    clearGame();
    set({ ...initial(), savedGame: null });
  },

  // ---------------------------------------------------------- crisis de rutas
  /**
   * Cierra un paso maritimo por N turnos. Lo usan los eventos con `disrupts`,
   * y queda disponible para cualquier mecanica futura (guerra naval, bloqueo
   * declarado por el jugador, sancion de un tercero).
   */
  triggerChokepointCrisis: (id, turns, cause = 'manual') => {
    const st = get();
    const cp = CHOKEPOINTS.find((c) => c.id === id);
    if (!cp || turns <= 0) return;
    const until = st.turn + turns;
    set({
      disruptions: { ...st.disruptions, [id]: until },
      feed: [
        {
          turn: st.turn, date: dateLabel(st.world), kind: 'sistema', emoji: '⛴️',
          title: `${cp.name} cerrado`,
          body: `${cp.description} Bloqueado hasta el turno ${until}. El comercio de larga distancia se resiente y el barril sube.`,
          tone: 'malo'
        },
        ...st.feed
      ]
    });
    persist();
  },

  clearChokepointCrisis: (id) => {
    const st = get();
    const next = { ...st.disruptions };
    delete next[id];
    set({ disruptions: next });
    persist();
  },

  /** Crisis de rutas activas en este turno. */
  activeCrises: () => {
    const st = get();
    return CHOKEPOINTS
      .filter((c) => (st.disruptions[c.id] ?? 0) > st.turn)
      .map((c) => ({
        id: c.id,
        name: c.name,
        until: st.disruptions[c.id],
        cause: 'evento'
      }));
  },

  // ---------------------------------------------------------- preview
  /**
   * Consecuencias probables de una decision a 3 turnos vista.
   * La cuenta la hace lib/simulation.ts con las mismas reglas del turno real.
   */
  previewDecision: (id, target) => {
    const st = get();
    if (!st.started || st.gameOver) return null;
    const dec = DECISIONS.find((d) => d.id === id);
    if (!dec) return null;
    if (dec.needsTarget && !target) return null;

    // El preview parte del mundo CON el plan ya ejecutado: si planificaste un
    // ajuste fiscal, lo que ves es lo que agrega esta decision encima de eso,
    // no lo que pasaria si fuera lo unico que hacés.
    const base = st.orders.length
      ? { ...st, ...runPlan(st, st.orders) } as GameStore
      : st;
    return projectDecision(cloneSim(simOf(base)), dec, target, 3);
  },

  /**
   * Sube o baja una alicuota. El costo politico crece con el tamano del
   * cambio: retocar dos puntos es un tramite, subir diez es una reforma.
   */
  /**
   * Planifica mover una alicuota. Los cambios sobre la misma se consolidan:
   * subir dos puntos y despues bajarlos deja el plan como estaba, sin dos
   * lineas contradictorias en el historial.
   */
  planTaxChange: (kind, delta) => {
    const st = get();
    if (!st.started || st.gameOver || !delta) return;

    const orders = addTaxOrder(st.orders, kind, delta);
    // el capital tiene que alcanzar para el plan completo, no solo para este cambio
    if (committedCapital(orders) > st.capital) return;

    set({ orders });
    persist();
  },

  /**
   * Banco Central: planifica comprar o vender oro. Se consolida igual que
   * los impuestos (ver addGoldOrder) y no deja vender mas reservas de las
   * que el pais tiene.
   */
  planGoldOrder: (action, tonnes) => {
    const st = get();
    if (!st.started || st.gameOver || tonnes <= 0) return;

    const reserves = st.countries[st.playerCode].economy.gold_reserves_tonnes;
    const orders = addGoldOrder(st.orders, action, tonnes, reserves);
    if (committedCapital(orders) > st.capital) return;

    set({ orders });
    persist();
  },

  planRateChange: (delta) => {
    const st = get();
    if (!st.started || st.gameOver || !delta) return;

    const orders = addRateOrder(st.orders, delta);
    if (committedCapital(orders) > st.capital) return;

    set({ orders });
    persist();
  },
  setMapMode: (m) => set({ mapMode: m }),

  // ----------------------------------------------------------
  /** Suma una decision al plan del turno. No toca el mundo hasta avanzar el mes. */
  planDecision: (id, target) => {
    const st = get();
    if (!st.started || st.gameOver) return;
    const dec = DECISIONS.find((d) => d.id === id);
    if (!dec) return;
    if (dec.needsTarget && !target) return;

    // no se puede repetir la misma jugada con el mismo pais mes a mes
    if (cooldownLeft(st.cooldowns, id, target, st.turn) > 0) return;
    // estructurales: una vez usada no vuelve, y la contraria de un par
    // toggle necesita que la original ya se haya tomado
    if (!decisionEligible(dec, st.usedOnce, target)) return;

    // el costo sale del tamano del objetivo y de la relacion, y encima pesa
    // la oposicion: gobernar con el Congreso en contra sale mas caro
    const scaled = scaleDecision(dec, st.countries[st.playerCode], target ? st.countries[target] : undefined, st.relations);
    const cost = decisionCost(st, dec, scaled.cost);
    const orders = addDecisionOrder(st.orders, id, cost, target, target ? st.countries[target]?.name : undefined);
    const pool = dec.category === 'diplomacia' ? 'diplomatico' : 'politico';
    const budget = pool === 'diplomatico' ? st.capitalDiplomatico : st.capital;
    if (committedCapital(orders, pool) > budget) return;

    set({ orders });
    persist();
  },

  planCabinet: (seat, ministerId) => {
    const st = get();
    if (!st.started || st.gameOver) return;
    if (ministerId && !ministerById(ministerId)) return;
    if (!ministerId && !st.cabinet[seat]) return;   // ya esta vacia

    const orders = addCabinetOrder(st.orders, seat, ministerId, !!st.cabinet[seat]);
    if (committedCapital(orders) > st.capital) return;
    set({ orders });
    persist();
  },

  /** Lo que costaria y rendiria esta decision contra este pais, hoy. */
  quoteDecision: (id, target) => {
    const st = get();
    if (!st.started) return null;
    const dec = DECISIONS.find((d) => d.id === id);
    if (!dec) return null;
    const scaled = scaleDecision(
      dec, st.countries[st.playerCode], target ? st.countries[target] : undefined, st.relations
    );
    return {
      cost: decisionCost(st, dec, scaled.cost),
      size: scaled.size,
      reason: scaled.reason,
      cooldown: cooldownLeft(st.cooldowns, id, target, st.turn)
    };
  },

  cancelOrder: (index) => {
    const st = get();
    set({ orders: st.orders.filter((_, i) => i !== index) });
    persist();
  },

  clearOrders: () => {
    set({ orders: [] });
    persist();
  },

  availableCapital: () => {
    const st = get();
    return Math.round((st.capital - committedCapital(st.orders)) * 10) / 10;
  },

  availableCapitalDiplomatico: () => {
    const st = get();
    return Math.round((st.capitalDiplomatico - committedCapital(st.orders, 'diplomatico')) * 10) / 10;
  },

  // ---------------------------------------------------------- politica
  currentPoll: () => {
    const st = get();
    if (!st.started) return 0;
    return poll(st.countries[st.playerCode], st.politics, st.capital, cabinetVoteBonus(st.cabinet), st.groups, st.moral);
  },

  /**
   * Elegis quien encabeza la boleta cuando se te agotaron los mandatos.
   * Su perfil se aplica al pais y modifica el resultado de la eleccion que
   * se resuelve a continuacion.
   */
  chooseSuccessor: (id) => {
    const st = get();
    const candidate = st.succession.find((c) => c.id === id);
    if (!candidate) return;

    const countries = fresh(st.countries);
    const world = fresh(st.world);
    applyDelta(countries[st.playerCode], candidate.modifiers, world);
    const capital = clamp(st.capital + (candidate.modifiers.capital ?? 0), 0, 100);

    const politics: Politics = {
      ...st.politics,
      leaderName: `${candidate.name} (${candidate.title})`,
      consecutiveTerms: 0   // arranca de cero: la eleccion de abajo lo pone en 1
    };

    const result = runElection(countries[st.playerCode], politics, capital, candidate, 0, st.groups, st.moral);
    const after = applyElection(
      { ...st, countries, world, capital, politics } as GameStore, result, candidate
    );
    // `after` solo trae lo electoral: los efectos del candidato sobre el pais
    // viajan en `countries` y `world`, y hay que setearlos igual
    set({ countries, world, ...after, succession: [] });
    persist();
  },

  dismissElection: () => set({ election: null }),

  // ----------------------------------------------------------
  /**
   * Resuelve el onboarding de Enrique o una de sus cartas. A diferencia de
   * `planEventChoice`, aplica YA: es un modal bloqueante en pantalla
   * completa (components/EnriqueModal.tsx), no algo que se planifique para
   * el fin del turno.
   */
  resolveEnrique: (choiceId) => {
    const st = get();
    if (!st.pendingEnrique) return;

    if (st.pendingEnrique.kind === 'onboarding') {
      if (st.pendingEnrique.step === 'intro') {
        set({ pendingEnrique: { kind: 'onboarding', step: 'panel' } });
        return;
      }
      const moral = { ...st.moral, onboarded: true, corruption: clamp(st.moral.corruption + 2, 0, 100) };
      const onboardingEntry: FeedItem = {
        turn: st.turn, date: dateLabel(st.world), kind: 'sistema', emoji: '🕴️',
        title: 'El Subsecretario de la Subsecretaria hizo su aparicion',
        body: 'Enrique Grook se presenta. A partir de ahora, el sistema moral (corrupcion, justicia, '
          + 'lideres minoritarios) queda visible y en juego.',
        tone: 'neutral'
      };
      set({
        moral,
        pendingEnrique: null,
        feed: [onboardingEntry, ...st.feed].slice(0, 200)
      });
      persist();
      return;
    }

    const event = st.pendingEnrique.event;
    const choice = event.choices?.find((c) => c.id === choiceId);
    if (!choice) {
      set({ pendingEnrique: null });
      return;
    }

    const countries = fresh(st.countries);
    const world = fresh(st.world);
    const player = countries[st.playerCode];
    applyDelta(player, choice.effects, world);

    let outcome = choice.detail;
    let tone: FeedItem['tone'] = 'neutral';
    if (choice.risk && Math.random() < choice.risk.chance) {
      applyDelta(player, choice.risk.effects, world);
      outcome = `${choice.detail} PERO: ${choice.risk.label}.`;
      tone = 'malo';
    }

    const moralConEfectos = choice.moralEffects ? applyMoralEffects(st.moral, choice.moralEffects) : st.moral;
    // seguirle el juego o mandarlo a pasear mueve su confianza, y con eso la
    // cadencia con la que vuelve a aparecer (lib/events/enrique.ts)
    const moral = applyEnriqueOutcome(moralConEfectos, choice.moralEffects, st.turn);
    const groups = choice.groupEffects ? applyGroupEffects(st.groups, choice.groupEffects) : st.groups;
    const capital = clamp(st.capital + (choice.effects.capital ?? 0), 0, 100);
    const cardEntry: FeedItem = {
      turn: st.turn, date: dateLabel(world), kind: 'decision', emoji: event.emoji, title: event.title, body: outcome, tone
    };

    set({
      countries,
      world,
      moral,
      groups,
      capital,
      pendingEnrique: null,
      feed: [cardEntry, ...st.feed].slice(0, 200)
    });
    persist();
  },

  // ----------------------------------------------------------
  /** Elige como responder a un evento abierto. Se resuelve al avanzar el mes. */
  planEventChoice: (key, choiceId) => {
    const st = get();
    const item = st.pending.find((p) => p.key === key);
    if (!item) return;
    const choice = item.event.choices?.find((c) => c.id === choiceId);
    if (!choice) return;

    const orders = addEventOrder(st.orders, item.event, key, choiceId, choice.cost?.capital ?? 0);
    if (committedCapital(orders) > st.capital) return;

    set({ orders });
    persist();
  },

  // ----------------------------------------------------------
  endTurn: () => {
    const st = get();
    if (st.gameOver) return;

    // 0. se ejecuta el plan del turno: recien aca las decisiones tocan el mundo
    const run = runPlan(st, st.orders);
    const countries = run.countries;
    const relations = run.relations;
    const world = run.world;
    const blocs = run.blocs;
    // lo que se ejecuto del plan va arriba de todo en el historial del turno:
    // primero "esto hice", despues "esto paso en el mundo"
    const planFeed: FeedItem[] = run.feed;
    const feed: FeedItem[] = [];
    const pending: ActiveEvent[] = [];

    // 1. eventos que quedaron sin respuesta: la inaccion tambien es una decision
    for (const p of run.pending) {
      const player = countries[st.playerCode];
      if (p.event.effects) applyDelta(player, p.event.effects, world);
      if (p.event.moralEffects) run.moral = applyMoralEffects(run.moral, p.event.moralEffects);
      if (p.event.groupEffects) run.groups = applyGroupEffects(run.groups, p.event.groupEffects);
      applyDelta(player, { stability: -1 }, world);
      feed.push({
        turn: st.turn,
        date: dateLabel(world),
        kind: 'evento',
        emoji: '⏳',
        title: `${p.event.title}: sin respuesta del gobierno`,
        body: 'Dejaste pasar el turno sin tomar posicion. La sociedad lo registra.',
        tone: 'malo'
      });
    }

    // 2. el mundo corre un mes: economia, comercio, rutas, cohesion y capital.
    //    Es la MISMA funcion que usa el preview de consecuencias (lib/simulation.ts),
    //    para que lo que el jugador ve antes de decidir sea lo que realmente pasa.
    const disruptions = { ...st.disruptions };
    const tick = deterministicTick({
      turn: st.turn,
      playerCode: st.playerCode,
      countries,
      relations,
      blocs,
      world,
      capital: run.capital,
      capitalDiplomatico: run.capitalDiplomatico,
      sanctions: run.sanctions,
      disruptions,
      tradeBase: st.tradeBase,
      active: st.active,
      taxBase: st.taxBase,
      cabinet: run.cabinet,
      imf: st.imf,
      street: st.street,
      // run.pension ya trae las reformas del plan aplicadas (ver bug de
      // runPlan vs applyDecisionTo en docs/PARA_CLAUDE.md): el tick tiene
      // que leer el estado post-reforma, no el de antes de planificar.
      pension: run.pension,
      employment: st.employment,
      // idem run.pension: run.centralBank ya trae el cambio de tasa del plan
      centralBank: run.centralBank,
      // idem: run.infrastructure ya trae la obra nueva planificada este turno
      infrastructure: run.infrastructure
    });
    const turn = tick.state.turn;
    const active = tick.state.active;
    const imf = tick.state.imf ?? st.imf;
    const street = tick.state.street ?? st.street;
    const pension = tick.state.pension ?? st.pension;
    const employment = tick.state.employment ?? st.employment;
    const centralBank = tick.state.centralBank ?? st.centralBank;
    const infrastructure = tick.state.infrastructure ?? st.infrastructure;

    if (tick.oilShockApplied > 0) {
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '⛴️',
        title: 'Rutas maritimas interrumpidas',
        body: `El bloqueo sigue activo: el barril sube a ${world.oil_price} USD y el flete de larga distancia se encarece.`,
        tone: 'malo'
      });
    }

    for (const item of tick.infrastructureCompleted) {
      const cfg = INFRA_CONFIG[item.type];
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: cfg.emoji,
        title: `${cfg.label}: obra terminada`,
        body: 'Queda operativa desde este mes: entrega su bono todos los meses de ahora en mas.',
        tone: 'bueno'
      });
    }

    if (imf.stage !== st.imf.stage) {
      const tone: FeedItem['tone'] =
        imf.stage === 'exit' || imf.stage === 'none' ? 'bueno'
          : imf.stage === 'program' ? 'malo' : 'neutral';
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '🏦',
        title: imfLabel(imf.stage),
        body: imf.stage === 'exit'
          ? 'El pais sale del radar del Fondo. El mercado lo lee como alivio, no como perdón.'
          : `Peso ${imf.weight}/18. La deuda y el deficit definen si esto escala.`,
        tone
      });
    }

    // presion de calle: se avisa cuando prende (cruza el umbral que ya
    // gotea humor/estabilidad todos los meses) o cuando se apaga del todo
    const prevStreetWeight = st.street?.streetWeight ?? 0;
    if (prevStreetWeight < 4 && street.streetWeight >= 4) {
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '🔥',
        title: 'La calle se calienta',
        body: 'La inflacion y/o el desempleo llevan meses arriba del umbral: hasta que bajen, cada mes resta humor social y estabilidad de a poco.',
        tone: 'malo'
      });
    } else if (prevStreetWeight >= 4 && street.streetWeight < 4) {
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '🕊️',
        title: 'La calle se enfria',
        body: 'Inflacion y desempleo volvieron a niveles sostenibles: el goteo mensual se corta.',
        tone: 'bueno'
      });
    }

    // 4.5 el resto del mundo tambien gobierna: un roster de potencias toma
    // sus propias decisiones cada turno (distinto de aiReactions, que solo
    // reacciona a lo que haces vos). Ver aiCountryDecisions en lib/engine.ts.
    const aiMoves = aiCountryDecisions(countries, aiRoster(countries, st.playerCode), world);
    for (const mv of aiMoves) {
      feed.push({
        turn, date: dateLabel(world), kind: 'reaccion', emoji: mv.emoji,
        title: countries[mv.country]?.name ?? mv.country,
        body: mv.action,
        tone: 'neutral'
      });
    }

    // 5. eventos del turno
    const player = countries[st.playerCode];
    // el contexto politico es el que el jugador tenia al empezar el turno:
    // la oposicion de este mes todavia no se recalculo (paso 8). Mismo motivo
    // para moral: el sistema moral de ESTE turno recien se tickea en el paso
    // 5.5, despues de sortear eventos — sin este override, `tick.state.moral`
    // queda undefined (deterministicTick no lo toca) y CUALQUIER evento
    // gateado en moral (los 3 lideres minoritarios, entre otros) queda
    // permanentemente inelegible sin importar el estado real del pais.
    const eventExtra = eventExtraOf({ ...tick.state, politics: st.politics, moral: st.moral });
    const rolled: GameEvent[] = [
      ...rollEvents(player, world, turn, blocs, relations, st.recentEventIds, eventExtra),
      ...crisisEvents(player),
      // agenda electoral: oferta de coalicion a 3 meses, discurso de cierre
      // a 1 mes. No son aleatorios (weight 0), los dispara el calendario.
      ...campaignEvents(st.politics, turn)
    ];

    // el socio de coalicion pasa factura cada tanto
    const socios = coalitionPartners(run.cabinet);
    let lastCoalitionDemand = st.lastCoalitionDemand;
    if (socios.length && turn - lastCoalitionDemand >= DEMAND_EVERY) {
      rolled.push(coalitionDemand(socios[0], turn));
      lastCoalitionDemand = turn;
    }

    // Ormuz: si Teheran esta acorralado, lo cierra. Salvo que Teheran seas vos.
    for (const [cpId, owner] of Object.entries(CHOKEPOINT_OWNER)) {
      if (!countries[owner] || owner === st.playerCode) continue;
      if ((disruptions[cpId] ?? 0) > turn) continue;
      const riesgo = chokepointClosureRisk(
        cpId, getRelation(relations, owner, 'USA'), world.global_tension
      );
      if (riesgo > 0 && Math.random() < riesgo) {
        const cp = CHOKEPOINTS.find((c) => c.id === cpId)!;
        disruptions[cpId] = turn + 3;
        applyDelta(player, { global_tension: 8, oil_price: 15 }, world);
        feed.push({
          turn, date: dateLabel(world), kind: 'evento', emoji: '⛴️',
          title: `${countries[owner].name} cierra el ${cp.name}`,
          body: `${cp.description} Teheran responde a la presion internacional cortando el paso por tres meses. `
            + 'El barril se dispara y el comercio de larga distancia se encarece.',
          tone: 'malo'
        });
      }
    }

    for (const ev of rolled) {
      const key = `${ev.id}-${turn}`;
      for (const cp of ev.disrupts ?? []) disruptions[cp] = turn + ev.duration;
      if (ev.worldEffects) {
        // un evento mundial no pega igual en todos lados: las potencias
        // absorben mejor el golpe que las economias chicas (worldShockMultiplier).
        // Si la diferencia es clara, se narra quien la paso mejor y peor.
        const spread = applyWorldShock(countries, ev.worldEffects, aiRoster(countries, st.playerCode, 10));
        if (spread && Math.abs(spread.bestGrowth - spread.worstGrowth) > 0.5) {
          feed.push({
            turn, date: dateLabel(world), kind: 'evento', emoji: ev.emoji,
            title: `${ev.title}: no le pega igual a todos`,
            body: `${countries[spread.best]?.name} lo absorbe mejor (crecimiento ${spread.bestGrowth}%) mientras `
              + `${countries[spread.worst]?.name} lo sufre mas (crecimiento ${spread.worstGrowth}%).`,
            tone: 'neutral'
          });
        }
      }

      // golpe sectorial: el mismo evento pega distinto segun la estructura
      // productiva de cada pais
      if (ev.sectorEffects) {
        for (const c of Object.values(countries)) {
          const growthDelta = applySectorShock(c, ev.sectorEffects);
          if (growthDelta) applyDelta(c, { gdp_growth: growthDelta }, undefined);
        }
      }

      // eventos que duran: quedan activos y cobran todos los meses
      if ((ev.ongoing || ev.worldOngoing) && ev.duration > 1) {
        active.push({ key, event: ev, turn, target: st.playerCode, resolved: false, turnsLeft: ev.duration });
      }
      if (ev.choices?.length) {
        pending.push({ key, event: ev, turn, target: st.playerCode, resolved: false });
        feed.push({
          turn,
          date: dateLabel(world),
          kind: 'evento',
          emoji: ev.emoji,
          title: `${ev.title} - requiere decision`,
          body: ev.description,
          tone: 'neutral'
        });
      } else {
        if (ev.effects) applyDelta(player, ev.effects, world);
        if (ev.moralEffects) run.moral = applyMoralEffects(run.moral, ev.moralEffects);
        if (ev.groupEffects) run.groups = applyGroupEffects(run.groups, ev.groupEffects);
        feed.push({
          turn,
          date: dateLabel(world),
          kind: 'evento',
          emoji: ev.emoji,
          title: ev.title,
          body: ev.description,
          tone: (ev.effects?.happiness ?? 0) >= 0 && (ev.worldEffects?.gdp_growth ?? 0) >= 0 ? 'bueno' : 'malo'
        });
      }
    }

    // 5.4b popularidad por sector (Change World Game v1.2): 5 grupos con
    // intereses distintos, capa PARALELA a la felicidad de siempre. Corre
    // ANTES del sistema moral (5.5) para que targetGustavo/targetJhon puedan
    // leer el grupo obrero/clase media ya actualizados de este mismo turno.
    const groupsTick = tickPopularGroups(run.groups, {
      inflation: player.economy.inflation,
      inflationTrend: st.countries[st.playerCode].economy.inflation - player.economy.inflation,
      unemployment: player.economy.unemployment,
      taxAvg: (player.economy.tax_iva + player.economy.tax_corporate + player.economy.tax_income_avg) / 3,
      taxCorporate: player.economy.tax_corporate,
      fiscalBalance: player.economy.fiscal_balance,
      gdpGrowth: player.economy.gdp_growth,
      corruption: run.moral.corruption,
      unionPower: cabinetUnionPower(run.cabinet),
      happiness: player.population.happiness
    });
    const groups = groupsTick;
    // el grupo que mas se movio se narra SIEMPRE, suba o baje y sea cual sea
    // (antes solo salia el caso "empresarios contentos" y el resto de los
    // movimientos quedaba invisible fuera de la pestaña de Grupos)
    const groupSwing = notableGroupSwing(run.groups, groups);
    if (groupSwing) {
      const copy = groupSwingFeed(groupSwing.group, groupSwing.delta);
      feed.push({ turn, date: dateLabel(world), kind: 'sistema', ...copy });
    }

    // 5.5 sistema moral (Change World Game v1.1): corrupcion, investigacion,
    // lideres minoritarios, y Enrique Grook (onboarding obligatorio mes 4 o
    // una de sus cartas normales, en pantalla completa - no pasa por `pending`)
    const coalitionSeatsCount = coalitionSeats(run.cabinet);
    // el gabinete tambien pesa pasivo sobre el sistema moral (ej. "La fiscalizadora"
    // baja corrupcion de a poco) antes de que corra el drift del mes
    const cabinetMoral = cabinetMoralEffects(run.cabinet);
    const moralBeforeTick = Object.keys(cabinetMoral).length ? applyMoralEffects(run.moral, cabinetMoral) : run.moral;
    const moralTick = tickMoral(moralBeforeTick, {
      happiness: player.population.happiness,
      unemployment: player.economy.unemployment,
      hasMajority: hasMajority(run.politics, coalitionSeatsCount),
      strongMajority: totalSeats(run.politics, coalitionSeatsCount) > 65,
      comisionIntegrity: comisionIntegrityEffective(run.politics, coalitionSeatsCount),
      groups
    });
    if (moralTick.happinessDelta) applyDelta(player, { happiness: moralTick.happinessDelta }, world);
    // `let` porque el selector de Enrique, mas abajo, le deja registrada la
    // carta que salio este turno (cooldown + espaciado, lib/events/enrique.ts)
    let moral = moralTick.state;

    // un lider minoritario que crece le saca voto al oficialismo (poll) y
    // empuja la oposicion: tiene que verse el mes que pasa, no al cerrar la
    // partida en los hitos
    const minoritySwing = notableMinoritySwing(st.moral, moral);
    if (minoritySwing) {
      const leader = MINORITY_LEADERS.find((l) => l.id === minoritySwing.id)!;
      const sube = minoritySwing.delta > 0;
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: leader.emoji,
        title: sube ? `${leader.name} crece` : `${leader.name} se desinfla`,
        body: `${leader.party}: ${sube ? '+' : ''}${minoritySwing.delta} pts de intencion de voto `
          + `(${minorityVoteShare(moral).toFixed(1)}% fugado en total entre los tres).`,
        tone: sube ? 'malo' : 'bueno'
      });
    }

    // hitos institucionales del turno (mayoria, coalicion, corrupcion,
    // investigacion, presion minoritaria, FMI, calle): se recalculan al final
    // de cada rama de endTurn con la `politics` que quede firme en esa rama
    // (ver lib/milestones.ts). `extra` suma los hitos puntuales (elecciones,
    // medio termino, fin de partida) que cada rama arma por su cuenta.
    const turnMilestones = (politicsAfter: Politics, extra: Milestone[] = []): Milestone[] => [
      ...buildMilestones({
        turn, date: dateLabel(world),
        cabinetBefore: st.cabinet, cabinetAfter: run.cabinet,
        politicsBefore: st.politics, politicsAfter,
        moralBefore: st.moral, moralAfter: moral,
        imfStageBefore: st.imf.stage, imfStageAfter: imf.stage, imfLabel: imfLabel(imf.stage),
        streetWeightBefore: st.street.streetWeight, streetWeightAfter: street.streetWeight
      }),
      ...extra
    ];
    const finMilestone = (title: string, body: string): Milestone =>
      ({ turn, date: dateLabel(world), kind: 'fin_de_partida', emoji: '🏁', title, body, tone: 'malo' });

    let pendingEnrique: PendingEnrique = st.pendingEnrique;
    if (!pendingEnrique) {
      if (turn === ENRIQUE_ONBOARDING_TURN && !moral.onboarded) {
        pendingEnrique = { kind: 'onboarding', step: 'intro' };
      } else {
        const [card] = enriqueEvents(moral, moral.onboarded, turn);
        if (card) {
          pendingEnrique = { kind: 'event', key: `${card.id}-${turn}`, event: card };
          moral = registerEnriqueCard(moral, card.id, turn);
        }
      }
    }

    // 6. reaccion del resto del mundo a lo que hiciste
    let reactions: Reaction[] = [];
    if (run.lastActions.length) {
      const hostility = run.hostility !== 0
        ? clamp(run.hostility, -30, 30)
        : (run.lastActions.some((a) => /sancion|Movilizar|Retirar|aranceles/i.test(a)) ? -18 : 8);
      reactions = aiReactions(countries, relations, blocs, st.playerCode, run.lastActions[0], hostility);
      for (const r of reactions) {
        feed.push({
          turn,
          date: dateLabel(world),
          kind: 'reaccion',
          emoji: countries[r.country]?.flag ?? '🌐',
          title: `${countries[r.country]?.name}`,
          body: `${r.action} (relacion ${r.relationChange >= 0 ? '+' : ''}${r.relationChange})`,
          tone: r.relationChange >= 0 ? 'bueno' : 'malo'
        });
      }
    }

    // 7. el capital politico y el diplomatico ya los recupero el tick determinista
    let capital = tick.state.capital;
    const capitalDiplomatico = tick.state.capitalDiplomatico;
    // corrupcion alta drena capital politico todos los meses (docs/PEDIDOS_A_OPUS.md,
    // rebalance de la generacion pasiva): el gancho que le da payoff concreto
    // a pelear la corrupcion, no solo un numero que sube.
    capital = clamp(capital - Math.max(0, moral.corruption - 60) * 0.03, 0, 100);
    // grupo 4 (alta/oligarcas) maneja los medios: contento suma capital
    // politico, en contra le resta al gobierno
    capital = clamp(capital + mediaCapitalEffect(groups.alta), 0, 100);

    const p2 = countries[st.playerCode];

    // 7b. cronica de fin de turno: informe corto de que paso, en vez de solo
    // deltas. Las "reaccion" del feed mezclan movidas de otras potencias
    // (aiCountryDecisions) con reacciones del mundo a tus propias acciones
    // (aiReactions, mas abajo en el turno) y los "evento" mezclan eventos
    // reales con penalidades por eventos ignorados: simplificacion v1
    // aceptada, ver docs/CRONICA_FIN_DE_TURNO.md.
    {
      const tradeCtx = { countries, relations, blocs, sanctions: run.sanctions, playerCode: st.playerCode, disruptions, turn };
      const baseTrade = st.tradeBase[st.playerCode];
      const nowTrade = totalTrade(st.playerCode, tradeCtx);
      const tradeChangeVsStart = baseTrade ? ((nowTrade - baseTrade) / baseTrade) * 100 : 0;
      const topPartnerCode = topPartnerOf(st.playerCode, tradeCtx);
      const chronicle = buildLocalChronicle({
        turn,
        dateLabel: dateLabel(world),
        tradeChangeVsStart,
        topPartner: topPartnerCode ? (countries[topPartnerCode]?.name ?? null) : null,
        stability: p2.population.stability,
        happiness: p2.population.happiness,
        unemployment: p2.economy.unemployment,
        inflation: p2.economy.inflation,
        oilPrice: world.oil_price,
        oilShock: tick.oilShockApplied,
        globalTension: world.global_tension,
        aiMoves: feed.filter((f) => f.kind === 'reaccion').map((f) => ({ title: f.title, body: f.body })),
        worldEventTitles: feed.filter((f) => f.kind === 'evento').map((f) => f.title)
      });
      const tone = tick.oilShockApplied > 0 || p2.population.stability < 40
        ? 'malo'
        : tradeChangeVsStart >= 5
          ? 'bueno'
          : 'neutral';
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '🗞️',
        title: chronicle.headline, body: chronicle.lines.join('\n'), tone
      });
    }

    // 8. la oposicion se mueve todos los meses; la encuesta queda registrada.
    //    Parte de run.politics (no st.politics): ahi ya esta el lever directo
    //    de las decisiones de este turno (Delta.opposition, ver runPlan).
    const encuesta = poll(p2, run.politics, capital, cabinetVoteBonus(run.cabinet), groups, moral);
    let politics: Politics = {
      ...run.politics,
      opposition: driftOpposition(run.politics, p2, moral),
      pollHistory: [...(st.politics.pollHistory ?? []), { turn, value: encuesta }].slice(-60),
      // la agenda electoral (campaignEvents) oferto coalicion este turno: no
      // se vuelve a ofertar en el mismo mandato, elija lo que elija el jugador
      coalitionOffered: st.politics.coalitionOffered || monthsToElection(st.politics, turn) === 3
    };

    // el jugador eligio con que partido opositor negociar (o no negociar):
    // se resuelve aca porque "cuanto le resta a la oposicion" no es un
    // Delta de economia/humor, es especifico del ciclo electoral.
    const coalitionOrder = st.orders.find(
      (o): o is EventOrder => o.kind === 'event' && o.eventKey.startsWith('oferta_coalicion-')
    );
    if (coalitionOrder?.choiceId === 'partyA' || coalitionOrder?.choiceId === 'partyB') {
      const [partyA, partyB] = politics.oppositionParties ?? ['la oposicion mayor', 'la oposicion menor'];
      const [shareA, shareB] = oppositionSplit(politics.opposition);
      // no se lleva TODO el peso del partido a tu coalicion, solo una parte:
      // negociar peina votos y legisladores sueltos, no borra al partido.
      const cut = Math.round((coalitionOrder.choiceId === 'partyA' ? shareA : shareB) * 0.5 * 10) / 10;
      const name = coalitionOrder.choiceId === 'partyA' ? partyA : partyB;
      politics = { ...politics, opposition: clamp(politics.opposition - cut, 5, 100) };
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '🤝',
        title: `${name} se suma a tu coalicion`,
        body: `La oposicion pierde ${cut} puntos de fuerza parlamentaria y de calle.`,
        tone: 'bueno'
      });
    }

    const coalitionJoinMilestone: Milestone[] = coalitionOrder?.choiceId === 'partyA' || coalitionOrder?.choiceId === 'partyB'
      ? [{
          turn, date: dateLabel(world), kind: 'coalicion_sumada', emoji: '🤝',
          title: feed[feed.length - 1]?.title ?? 'Un partido opositor se suma a tu coalicion',
          body: feed[feed.length - 1]?.body ?? '', tone: 'bueno'
        }]
      : [];

    let election: ElectionResult | null = null;
    let succession: Candidate[] = [];
    /** hitos puntuales de este turno: coalicion sumada, y (si hay) eleccion/medio-termino decisivo */
    let electionMilestones: Milestone[] = coalitionJoinMilestone;

    // 9. se termino el mandato, hay ballotage pendiente, o medio termino
    if (politics.pendingBallotage) {
      const result = runElection(p2, politics, capital, undefined, 0, groups, moral);
      const after = applyElection(
        { ...st, turn, world, countries, capital, politics } as GameStore, result
      );
      election = after.election ?? null;
      if (after.politics) politics = after.politics;
      if (after.capital !== undefined) capital = after.capital;
      if (after.feed) feed.push(...after.feed.slice(0, 2).reverse());
      electionMilestones = [...electionMilestones, {
        turn, date: dateLabel(world), kind: result.won ? 'eleccion_ganada' : 'eleccion_perdida', emoji: '🗳️',
        title: result.headline, body: result.detail, tone: result.won ? 'bueno' : 'malo'
      }];
      if (after.gameOver) {
        feed.push({
          turn, date: dateLabel(world), kind: 'sistema', emoji: '🏁',
          title: after.gameOver.title, body: after.gameOver.body, tone: 'malo'
        });
        set({
          turn, world, countries, relations, blocs, disruptions, active, capital, capitalDiplomatico,
          politics, election, succession: [], sanctions: run.sanctions, orders: [],
          cooldowns: run.cooldowns, usedOnce: run.usedOnce, cabinet: run.cabinet,
          imf, street, pension, employment, moral, groups, centralBank, infrastructure, pendingEnrique,
          reactions, lastActions: [],
          pending: [...pending],
          recentEventIds: [...rolled.map((e) => e.id), ...st.recentEventIds].slice(0, 8),
          feed: [...planFeed, ...feed.reverse(), ...st.feed].slice(0, 200),
          milestones: [
            ...st.milestones,
            ...turnMilestones(politics, [...electionMilestones, finMilestone(after.gameOver.title, after.gameOver.body)])
          ],
          gameOver: after.gameOver
        });
        persist();
        return;
      }
    } else if (isElectionDue(politics, turn)) {
      if (needsSuccessor(politics)) {
        // no podes presentarte otra vez: elegis sucesor y la partida espera
        succession = successors();
        feed.push({
          turn, date: dateLabel(world), kind: 'sistema', emoji: '🗳️',
          title: 'Se termina tu ultimo mandato',
          body: `No podes presentarte de nuevo. Elegi quien encabeza la boleta de ${politics.partyName}.`,
          tone: 'neutral'
        });
      } else {
        const result = runElection(p2, politics, capital, undefined, cabinetVoteBonus(run.cabinet), groups, moral);
        const after = applyElection(
          { ...st, turn, world, countries, capital, politics } as GameStore, result
        );
        election = after.election ?? null;
        if (after.politics) politics = after.politics;
        if (after.capital !== undefined) capital = after.capital;
        if (after.feed) feed.push(...after.feed.slice(0, 2).reverse());
        const decisiveKind: Milestone['kind'] = result.won ? 'eleccion_ganada' : 'eleccion_perdida';
        const decisiveTone: Milestone['tone'] = result.won ? 'bueno' : 'malo';
        electionMilestones = [...electionMilestones, {
          turn, date: dateLabel(world),
          kind: result.ballotage ? 'ballotage' : decisiveKind, emoji: '🗳️',
          title: result.headline, body: result.detail,
          tone: result.ballotage ? 'neutral' : decisiveTone
        }];
        if (after.gameOver) {
          feed.push({
            turn, date: dateLabel(world), kind: 'sistema', emoji: '🏁',
            title: after.gameOver.title, body: after.gameOver.body, tone: 'malo'
          });
        }
        if (after.gameOver) {
          set({
            turn, world, countries, relations, blocs, disruptions, active, capital, capitalDiplomatico,
            politics, election, succession: [], sanctions: run.sanctions, orders: [],
            cooldowns: run.cooldowns, usedOnce: run.usedOnce, cabinet: run.cabinet,
            moral, groups, centralBank, infrastructure, pendingEnrique,
            reactions, lastActions: [],
            pending: [...pending],
            recentEventIds: [...rolled.map((e) => e.id), ...st.recentEventIds].slice(0, 8),
            feed: [...planFeed, ...feed.reverse(), ...st.feed].slice(0, 200),
            milestones: [
              ...st.milestones,
              ...turnMilestones(politics, [...electionMilestones, finMilestone(after.gameOver.title, after.gameOver.body)])
            ],
            gameOver: after.gameOver
          });
          persist();
          return;
        }
      }
    } else if (isMidtermDue(politics, turn, st.playerCode)) {
      const result = runMidterm(p2, politics, capital, groups, moral);
      const after = applyMidterm(
        { ...st, turn, world, countries, capital, politics } as GameStore, result
      );
      election = after.election ?? null;
      if (after.politics) politics = after.politics;
      if (after.capital !== undefined) capital = after.capital;
      if (after.feed?.[0]) feed.push(after.feed[0]);
      electionMilestones = [...electionMilestones, {
        turn, date: dateLabel(world), kind: result.won ? 'medio_termino_ganado' : 'medio_termino_perdido', emoji: '🗳️',
        title: result.headline, body: result.detail, tone: result.won ? 'bueno' : 'malo'
      }];
    }
    // interes: el capital politico que se sostiene de un mes a otro rinde.
    // Por cada 10 que quede sin gastar al cierre del turno, se suma 1 mas,
    // con techo (docs/PEDIDOS_A_OPUS.md, rebalance de la generacion pasiva):
    // sin el techo escalaba sin limite con capital alto, una bola de nieve
    // que hacia irrelevante gastarlo. Ahorrar para algo grande sigue rindiendo,
    // pero no reemplaza jugar el turno.
    const capitalInterest = Math.min(4, Math.floor(capital / 12));
    if (capitalInterest > 0) {
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '💹',
        title: 'Interes sobre el capital politico ahorrado',
        body: `Sostener ${Math.round(capital * 10) / 10} sin gastarlo suma +${capitalInterest} este mes.`,
        tone: 'bueno'
      });
      capital += capitalInterest;
    }

    const gameOver = checkGameOver(p2, turn);
    if (gameOver) {
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '🏁',
        title: gameOver.title, body: gameOver.body, tone: 'malo'
      });
    }

    set({
      turn,
      world,
      countries,
      relations,
      blocs,
      disruptions,
      active,
      capital,
      capitalDiplomatico,
      politics,
      election,
      succession,
      sanctions: run.sanctions,
      orders: [],
      cooldowns: run.cooldowns,
      usedOnce: run.usedOnce,
      cabinet: run.cabinet,
      lastCoalitionDemand,
      imf,
      street,
      pension,
      employment,
      moral,
      groups,
      centralBank,
      infrastructure,
      pendingEnrique,
      reactions,
      lastActions: [],
      pending: [...pending],
      recentEventIds: [...rolled.map((e) => e.id), ...st.recentEventIds].slice(0, 8),
      feed: [...planFeed, ...feed.reverse(), ...st.feed].slice(0, 200),
      history: [
        ...st.history,
        {
          turn,
          happiness: p2.population.happiness,
          stability: p2.population.stability,
          inflation: p2.economy.inflation,
          growth: p2.economy.gdp_growth,
          gdp: p2.economy.gdp_trillion_usd,
          unemployment: p2.economy.unemployment,
          fiscal: p2.economy.fiscal_balance,
          debt: p2.economy.debt_to_gdp,
          capital,
          opposition: politics.opposition,
          tension: world.global_tension,
          oil: world.oil_price,
          fx: p2.fx ?? FX_START,
          capitalDiplomatico
        }
      ],
      milestones: [
        ...st.milestones,
        ...turnMilestones(politics, gameOver ? [...electionMilestones, finMilestone(gameOver.title, gameOver.body)] : electionMilestones)
      ],
      gameOver
    });
    persist();
  },

  // ----------------------------------------------------------
  planJoinBloc: (id) => {
    const st = get();
    const bloc = st.blocs.find((b) => b.id === id);
    if (!bloc) return;
    const check = canJoin(bloc, st.playerCode, st.relations, st.capitalDiplomatico);
    if (!check.ok) return;

    const orders = addBlocOrder(st.orders, 'join', bloc, check.cost ?? 20);
    if (committedCapital(orders, 'diplomatico') > st.capitalDiplomatico) return;
    set({ orders });
    persist();
  },

  planLeaveBloc: (id) => {
    const st = get();
    const bloc = st.blocs.find((b) => b.id === id);
    if (!bloc || !bloc.members.includes(st.playerCode)) return;

    const orders = addBlocOrder(st.orders, 'leave', bloc, 15);
    if (committedCapital(orders, 'diplomatico') > st.capitalDiplomatico) return;
    set({ orders });
    persist();
  },

  planSummit: (id) => {
    const st = get();
    const bloc = st.blocs.find((b) => b.id === id);
    if (!bloc || !bloc.members.includes(st.playerCode)) return;

    const orders = addBlocOrder(st.orders, 'summit', bloc, 10);
    if (committedCapital(orders, 'diplomatico') > st.capitalDiplomatico) return;
    set({ orders });
    persist();
  },

  // ----------------------------------------------------------
  grokPrompt: () => {
    const st = get();
    return buildGrokPrompt(
      st.countries[st.playerCode], st.world, st.turn, st.relations,
      st.blocs, st.lastActions, st.pending
    );
  },

  /** Pega la respuesta JSON de Grok y aplicala al estado. Devuelve un mensaje de resultado. */
  applyGrokJson: (raw) => {
    const st = get();
    try {
      const cleaned = raw.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleaned) as {
        reactions?: { country: string; action: string; relation_change?: number; intensity?: number; public_statement?: string }[];
        internal_extra_effects?: { metric: keyof Delta; value: number; why?: string }[];
        narrative?: string;
      };

      const countries = fresh(st.countries);
      const relations = { ...st.relations };
      const world = fresh(st.world);
      const feed: FeedItem[] = [];

      for (const r of parsed.reactions ?? []) {
        const code = countries[r.country]
          ? r.country
          : Object.keys(countries).find((c) => countries[c].name.toLowerCase() === String(r.country).toLowerCase());
        if (!code) continue;
        const change = Number(r.relation_change ?? 0);
        if (change) adjustRelation(relations, st.playerCode, code, clamp(change, -25, 25));
        feed.push({
          turn: st.turn, date: dateLabel(world), kind: 'reaccion', emoji: countries[code].flag,
          title: `${countries[code].name} (Grok)`,
          body: `${r.action}${r.public_statement ? ` - "${r.public_statement}"` : ''}`,
          tone: change >= 0 ? 'bueno' : 'malo'
        });
      }

      for (const e of parsed.internal_extra_effects ?? []) {
        applyDelta(countries[st.playerCode], { [e.metric]: clamp(Number(e.value), -15, 15) } as Delta, world);
      }

      if (parsed.narrative) {
        feed.push({
          turn: st.turn, date: dateLabel(world), kind: 'sistema', emoji: '📰',
          title: 'Cronica del turno (Grok)', body: parsed.narrative, tone: 'neutral'
        });
      }

      set({ countries, relations, world, feed: [...feed.reverse(), ...st.feed].slice(0, 200) });
      persist();
      return `Aplicado: ${parsed.reactions?.length ?? 0} reacciones, ${parsed.internal_extra_effects?.length ?? 0} efectos internos.`;
    } catch (err) {
      return `No pude leer el JSON: ${(err as Error).message}`;
    }
  }
  };
});

// utiles de debug (ver docs/REGLAS_DE_CODIGO.md):
//   window.__game   -> estado completo del juego
//   window.__engine -> funciones puras del motor, para probar formulas y eventos
if (typeof window !== 'undefined') {
  const w = window as unknown as { __game: typeof useGame; __engine: Record<string, unknown> };
  w.__game = useGame;
  w.__engine = {
    applySectorShock, taxEffects, damagedSectors, projectDecision, deterministicTick,
    eligibleEvents, getRelation, blocEffects, canJoin
  };
}

// re-exports para los componentes
export { previewDelta, relLabel, getRelation, blocEffects, canJoin, computeArcs, ARC_COLORS, dateLabel };
