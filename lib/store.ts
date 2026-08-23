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
import { tradeBaseline } from './trade';
import { cloneSim, deterministicTick, eventExtraOf, projectDecision, type SimState } from './simulation';
import {
  campaignEvents, defaultPolitics, DIFFICULTY_PRESETS, driftOpposition, isElectionDue, isMidtermDue, legacy,
  monthsToElection, needsSuccessor, oppositionCostFactor, oppositionSplit, parliamentCostFactor, poll,
  runElection, runMidterm, seatsFromVote, successors,
  type Candidate, type Difficulty, type ElectionResult, type Politics
} from './politics';
import {
  CAPITAL_ON_MIDTERM_WIN, CAPITAL_ON_WIN, grantHoneymoon, systemOf
} from './electoral';
import {
  addBlocOrder, addCabinetOrder, addDecisionOrder, addEventOrder, addGoldOrder, addTaxOrder, committedCapital,
  goldFiscalDelta, TAX_FIELD, TAX_LABELS,
  type EventOrder, type PlannedOrder, type TaxKind
} from './orders';
import { cooldownKey, cooldownLeft, cooldownUntil, scaleDecision } from './diplomacy';
import {
  cabinetCostFactor, cabinetVoteBonus, coalitionDemand, coalitionPartners, coalitionSeats,
  DEMAND_EVERY, factionsOf, ministerById, SEAT_LABEL, type Cabinet, type CabinetSeat
} from './cabinet';
import { factionCostFactor, policyKindOf } from './factions';
import {
  clearGame, loadGame, saveGame, savedSummary,
  type PersistedState, type SavedGame
} from './persistence';
import { defaultImf, imfLabel, type ImfState } from './imf';
import { defaultStreet, type StreetState } from './streetPressure';
import { applyFx, DEVALUE_JUMP, FX_START } from './fx';
import type {
  ActiveEvent, Bloc, ChokepointCrisis, Country, Decision, Delta, FeedItem, GameEvent,
  GlobalState, Layers, MapMode, Projection
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
}

interface GameStore {
  started: boolean;
  playerCode: string;
  turn: number;
  capital: number;
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
  /** quien ocupa cada silla del gabinete */
  cabinet: Cabinet;
  /** turno de la ultima factura del socio de coalicion */
  lastCoalitionDemand: number;
  /** arco FMI del jugador */
  imf: ImfState;
  /** presion de calle por inflacion/desempleo altos sostenidos */
  street: StreetState;
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
    points: true, capitals: false, ports: true, airports: true
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
  cabinet: {} as Cabinet,
  lastCoalitionDemand: 0,
  imf: defaultImf(),
  street: defaultStreet(),
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
    cabinet: st.cabinet,
    lastCoalitionDemand: st.lastCoalitionDemand,
    imf: st.imf,
    street: st.street,
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
  const factor =
    oppositionCostFactor(st.politics.opposition)
    * parliamentCostFactor(st.politics, baseCost, seats)
    * cabinetCostFactor(st.cabinet, dec.category)
    * factionCostFactor(factionsOf(st.cabinet), policyKindOf(dec.id));
  return Math.max(1, Math.round(baseCost * factor));
}

interface PlanRun {
  countries: Record<string, Country>;
  relations: Record<string, number>;
  world: GlobalState;
  blocs: Bloc[];
  sanctions: string[];
  capital: number;
  feed: FeedItem[];
  pending: ActiveEvent[];
  lastActions: string[];
  /** hostilidad neta de lo que hiciste: define el tono de las reacciones */
  hostility: number;
  /** enfriamientos actualizados */
  cooldowns: Record<string, number>;
  /** gabinete despues de los cambios del plan */
  cabinet: Cabinet;
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
    feed: [],
    pending: [...st.pending],
    lastActions: [],
    hostility: 0,
    cooldowns: { ...st.cooldowns },
    cabinet: { ...st.cabinet }
  };

  const log = (emoji: string, title: string, body: string, tone: FeedItem['tone'] = 'neutral') => {
    run.feed.push({ turn: st.turn, date: dateLabel(run.world), kind: 'decision', emoji, title, body, tone });
    run.lastActions.push(title);
  };

  for (const order of orders) {
    run.capital = clamp(run.capital - order.capitalCost, 0, 100);

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
      run.capital = clamp(run.capital + (dec.effects.capital ?? 0), 0, 100);
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
      if (choice.cost?.fiscal) {
        applyDelta(run.countries[st.playerCode], { fiscal_balance: -choice.cost.fiscal }, run.world);
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
    sanctions: st.sanctions,
    disruptions: st.disruptions,
    tradeBase: st.tradeBase,
    active: st.active,
    taxBase: st.taxBase,
    politics: st.politics,
    honeymoonUntil: st.politics.honeymoonUntil,
    imf: st.imf,
    street: st.street
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
          fx: FX_START
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
      cabinet: st.cabinet ?? {},
      lastCoalitionDemand: st.lastCoalitionDemand ?? 0,
      imf: st.imf ?? defaultImf(),
      street: st.street ?? defaultStreet(),
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

    // el costo sale del tamano del objetivo y de la relacion, y encima pesa
    // la oposicion: gobernar con el Congreso en contra sale mas caro
    const scaled = scaleDecision(dec, st.countries[st.playerCode], target ? st.countries[target] : undefined, st.relations);
    const cost = decisionCost(st, dec, scaled.cost);
    const orders = addDecisionOrder(st.orders, id, cost, target, target ? st.countries[target]?.name : undefined);
    if (committedCapital(orders) > st.capital) return;

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

  // ---------------------------------------------------------- politica
  currentPoll: () => {
    const st = get();
    if (!st.started) return 0;
    return poll(st.countries[st.playerCode], st.politics, st.capital, cabinetVoteBonus(st.cabinet));
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

    const result = runElection(countries[st.playerCode], politics, capital, candidate);
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
      sanctions: run.sanctions,
      disruptions,
      tradeBase: st.tradeBase,
      active: st.active,
      taxBase: st.taxBase,
      cabinet: run.cabinet,
      imf: st.imf,
      street: st.street
    });
    const turn = tick.state.turn;
    const active = tick.state.active;
    const imf = tick.state.imf ?? st.imf;
    const street = tick.state.street ?? st.street;

    if (tick.oilShockApplied > 0) {
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '⛴️',
        title: 'Rutas maritimas interrumpidas',
        body: `El bloqueo sigue activo: el barril sube a ${world.oil_price} USD y el flete de larga distancia se encarece.`,
        tone: 'malo'
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
    // la oposicion de este mes todavia no se recalculo (paso 8)
    const eventExtra = eventExtraOf({ ...tick.state, politics: st.politics });
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

    // 7. el capital politico ya lo recupero el tick determinista
    let capital = tick.state.capital;

    const p2 = countries[st.playerCode];

    // 8. la oposicion se mueve todos los meses; la encuesta queda registrada
    const encuesta = poll(p2, st.politics, capital, cabinetVoteBonus(run.cabinet));
    let politics: Politics = {
      ...st.politics,
      opposition: driftOpposition(st.politics, p2),
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

    let election: ElectionResult | null = null;
    let succession: Candidate[] = [];

    // 9. se termino el mandato, hay ballotage pendiente, o medio termino
    if (politics.pendingBallotage) {
      const result = runElection(p2, politics, capital);
      const after = applyElection(
        { ...st, turn, world, countries, capital, politics } as GameStore, result
      );
      election = after.election ?? null;
      if (after.politics) politics = after.politics;
      if (after.capital !== undefined) capital = after.capital;
      if (after.feed) feed.push(...after.feed.slice(0, 2).reverse());
      if (after.gameOver) {
        feed.push({
          turn, date: dateLabel(world), kind: 'sistema', emoji: '🏁',
          title: after.gameOver.title, body: after.gameOver.body, tone: 'malo'
        });
        set({
          turn, world, countries, relations, blocs, disruptions, active, capital,
          politics, election, succession: [],
          reactions, lastActions: [],
          pending: [...pending],
          recentEventIds: [...rolled.map((e) => e.id), ...st.recentEventIds].slice(0, 8),
          feed: [...feed.reverse(), ...st.feed].slice(0, 200),
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
        const result = runElection(p2, politics, capital, undefined, cabinetVoteBonus(run.cabinet));
        const after = applyElection(
          { ...st, turn, world, countries, capital, politics } as GameStore, result
        );
        election = after.election ?? null;
        if (after.politics) politics = after.politics;
        if (after.capital !== undefined) capital = after.capital;
        if (after.feed) feed.push(...after.feed.slice(0, 2).reverse());
        if (after.gameOver) {
          feed.push({
            turn, date: dateLabel(world), kind: 'sistema', emoji: '🏁',
            title: after.gameOver.title, body: after.gameOver.body, tone: 'malo'
          });
        }
        if (after.gameOver) {
          set({
            turn, world, countries, relations, blocs, disruptions, active, capital,
            politics, election, succession: [], sanctions: run.sanctions, orders: [],
            cooldowns: run.cooldowns, cabinet: run.cabinet,
            reactions, lastActions: [],
            pending: [...pending],
            recentEventIds: [...rolled.map((e) => e.id), ...st.recentEventIds].slice(0, 8),
            feed: [...planFeed, ...feed.reverse(), ...st.feed].slice(0, 200),
            gameOver: after.gameOver
          });
          persist();
          return;
        }
      }
    } else if (isMidtermDue(politics, turn, st.playerCode)) {
      const result = runMidterm(p2, politics, capital);
      const after = applyMidterm(
        { ...st, turn, world, countries, capital, politics } as GameStore, result
      );
      election = after.election ?? null;
      if (after.politics) politics = after.politics;
      if (after.capital !== undefined) capital = after.capital;
      if (after.feed?.[0]) feed.push(after.feed[0]);
    }
    // interes: el capital politico que se sostiene de un mes a otro rinde.
    // Por cada 10 que quede sin gastar al cierre del turno, se suma 1 mas:
    // ahorrar para algo grande deja de ser tiempo muerto.
    const capitalInterest = Math.floor(capital / 10);
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
      politics,
      election,
      succession,
      sanctions: run.sanctions,
      orders: [],
      cooldowns: run.cooldowns,
      cabinet: run.cabinet,
      lastCoalitionDemand,
      imf,
      street,
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
          fx: p2.fx ?? FX_START
        }
      ].slice(-60),
      gameOver
    });
    persist();
  },

  // ----------------------------------------------------------
  planJoinBloc: (id) => {
    const st = get();
    const bloc = st.blocs.find((b) => b.id === id);
    if (!bloc) return;
    const check = canJoin(bloc, st.playerCode, st.relations, st.capital);
    if (!check.ok) return;

    const orders = addBlocOrder(st.orders, 'join', bloc, check.cost ?? 20);
    if (committedCapital(orders) > st.capital) return;
    set({ orders });
    persist();
  },

  planLeaveBloc: (id) => {
    const st = get();
    const bloc = st.blocs.find((b) => b.id === id);
    if (!bloc || !bloc.members.includes(st.playerCode)) return;

    const orders = addBlocOrder(st.orders, 'leave', bloc, 15);
    if (committedCapital(orders) > st.capital) return;
    set({ orders });
    persist();
  },

  planSummit: (id) => {
    const st = get();
    const bloc = st.blocs.find((b) => b.id === id);
    if (!bloc || !bloc.members.includes(st.playerCode)) return;

    const orders = addBlocOrder(st.orders, 'summit', bloc, 10);
    if (committedCapital(orders) > st.capital) return;
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
