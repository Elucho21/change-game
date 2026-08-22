'use client';

import { create } from 'zustand';
import data from './data/countries.gen.json';
import { BLOCS } from './blocs';
import { DECISIONS } from './decisions';
import {
  ARC_COLORS, adjustRelation, aiReactions, applyDelta, applySectorShock, blocEffects,
  buildGrokPrompt, canJoin, checkGameOver, clamp, computeArcs, crisisEvents, damagedSectors,
  dateLabel, eligibleEvents, getRelation, previewDelta, relLabel, resolveRelationTargets,
  ratesOf, rollEvents, taxEffects, type TaxRates
} from './engine';
import type { Reaction } from './engine';
import { CHOKEPOINTS } from './routes';
import { tradeBaseline } from './trade';
import { cloneSim, deterministicTick, projectDecision, type SimState } from './simulation';
import {
  defaultPolitics, driftOpposition, isElectionDue, legacy, needsSuccessor,
  oppositionCostFactor, poll, runElection, successors,
  type Candidate, type ElectionResult, type Politics
} from './politics';
import {
  clearGame, loadGame, saveGame, savedSummary,
  type PersistedState, type SavedGame
} from './persistence';
import type {
  ActiveEvent, Bloc, ChokepointCrisis, Country, Delta, FeedItem, GameEvent,
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

interface HistoryPoint {
  turn: number;
  happiness: number;
  stability: number;
  inflation: number;
  growth: number;
  gdp: number;
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
  /** eleccion resuelta esperando que el jugador la lea */
  election: ElectionResult | null;
  /** candidatos a sucederte: si esta lleno, la partida espera tu eleccion */
  succession: Candidate[];
  gameOver: { title: string; body: string } | null;

  start: (code: string) => void;
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
  /** mueve una alicuota impositiva (IVA, corporativo o ingresos) */
  setTaxRate: (kind: keyof TaxRates, delta: number) => void;
  /** intencion de voto proyectada de hoy */
  currentPoll: () => number;
  /** elige quien te sucede cuando se te agotan los mandatos */
  chooseSuccessor: (id: string) => void;
  /** cierra el cartel del resultado electoral */
  dismissElection: () => void;
  reset: () => void;
  select: (code: string | null) => void;
  setMapMode: (m: MapMode) => void;
  takeDecision: (id: string, target?: string) => void;
  resolveEvent: (key: string, choiceId: string) => void;
  endTurn: () => void;
  joinBloc: (id: string) => void;
  leaveBloc: (id: string) => void;
  summit: (id: string) => void;
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
    electionsWon: 0, powerSince: 1
  } as Politics,
  startingGdp: 0,
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
    gameOver: st.gameOver
  };
}

/**
 * Aplica el resultado de una eleccion sobre el estado.
 * Ganar abre un mandato nuevo; perder termina la partida con el balance de
 * gestion. Se usa tanto cuando te presentas vos como cuando compite tu sucesor.
 */
function applyElection(st: GameStore, result: ElectionResult, candidate?: Candidate): Partial<GameStore> {
  const country = st.countries[st.playerCode];
  const feed: FeedItem[] = [
    {
      turn: st.turn,
      date: dateLabel(st.world),
      kind: 'sistema',
      emoji: result.won ? '🗳️' : '🏛️',
      title: result.headline,
      body: `${result.detail} Participacion: ${result.turnout}%.`,
      tone: result.won ? 'bueno' : 'malo'
    }
  ];

  if (!result.won) {
    const balance = legacy(st.politics, st.turn, country, st.startingGdp);
    return {
      election: result,
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

  const politics: Politics = {
    ...st.politics,
    termStart: st.turn,
    consecutiveTerms: st.politics.consecutiveTerms + 1,
    electionsWon: st.politics.electionsWon + 1,
    // ganar una eleccion desinfla a la oposicion, al menos por un tiempo
    opposition: clamp(st.politics.opposition - 12, 0, 100)
  };

  feed.unshift({
    turn: st.turn,
    date: dateLabel(st.world),
    kind: 'sistema',
    emoji: '🎉',
    title: candidate ? `${candidate.name} asume por ${politics.partyName}` : 'Arranca un nuevo mandato',
    body: candidate
      ? `${candidate.description} Mandato numero ${politics.electionsWon + 1} del partido.`
      : `Cuatro anios mas. La oposicion queda en ${politics.opposition}.`,
    tone: 'bueno'
  });

  return {
    election: result,
    politics,
    capital: clamp(st.capital + 20, 0, 100),
    feed: [...feed, ...st.feed]
  };
}

export const useGame = create<GameStore>((set, get) => {
  /** Guarda la partida. Se llama al cerrar cada accion que cambia el mundo. */
  const persist = () => {
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
    taxBase: st.taxBase
  });

  return {
  ...initial(),

  start: (code) => {
    const s = initial();
    const player = s.countries[code];
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
    set({
      ...s,
      started: true,
      playerCode: code,
      selected: code,
      tradeBase: baseline,
      taxBase,
      politics: defaultPolitics(player, 1),
      startingGdp: player.economy.gdp_trillion_usd,
      feed: [
        {
          turn: 1,
          date: dateLabel(s.world),
          kind: 'sistema',
          emoji: player.flag,
          title: `Asumis el gobierno de ${player.name}`,
          body: `Inflacion ${player.economy.inflation}% - desempleo ${player.economy.unemployment}% - deuda ${player.economy.debt_to_gdp}% del PBI. Tenes ${s.capital} de capital politico y cuatro anios de mandato por delante.`,
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
          gdp: player.economy.gdp_trillion_usd
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
      countries: st.countries,
      relations: st.relations,
      blocs: st.blocs,
      sanctions: st.sanctions,
      feed: st.feed,
      pending: st.pending,
      active: st.active ?? [],
      recentEventIds: st.recentEventIds,
      lastActions: st.lastActions,
      history: st.history,
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
      politics: st.politics ?? defaultPolitics(st.countries[st.playerCode], st.turn),
      startingGdp: st.startingGdp ?? st.countries[st.playerCode].economy.gdp_trillion_usd,
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
    return projectDecision(cloneSim(simOf(st)), dec, target, 3);
  },

  /**
   * Sube o baja una alicuota. El costo politico crece con el tamano del
   * cambio: retocar dos puntos es un tramite, subir diez es una reforma.
   */
  setTaxRate: (kind, delta) => {
    const st = get();
    if (!st.started || st.gameOver || !delta) return;

    const cost = Math.round(2 + Math.abs(delta) * 1.5);
    if (st.capital < cost) return;

    const countries = fresh(st.countries);
    const e = countries[st.playerCode].economy;
    const field = kind === 'iva' ? 'tax_iva' : kind === 'corporate' ? 'tax_corporate' : 'tax_income_avg';
    const before = e[field];
    const after = clamp(Math.round((before + delta) * 10) / 10, 0, 60);
    if (after === before) return;
    e[field] = after;

    const label = kind === 'iva' ? 'IVA' : kind === 'corporate' ? 'Impuesto a las empresas' : 'Impuesto a los ingresos';
    const fx = taxEffects(countries[st.playerCode], st.taxBase[st.playerCode]);

    set({
      countries,
      capital: clamp(st.capital - cost, 0, 100),
      lastActions: [...st.lastActions, `${label}: ${before}% -> ${after}%`],
      feed: [
        {
          turn: st.turn,
          date: dateLabel(st.world),
          kind: 'decision',
          emoji: after > before ? '📈' : '📉',
          title: `${label} ${after > before ? 'sube' : 'baja'} a ${after}%`,
          body: `Contra la estructura con la que arrancaste: recaudacion ${fx.fiscal >= 0 ? '+' : ''}${fx.fiscal} del PBI, crecimiento ${fx.growth >= 0 ? '+' : ''}${fx.growth}, humor social ${fx.happiness >= 0 ? '+' : ''}${fx.happiness} por turno.`,
          tone: 'neutral'
        },
        ...st.feed
      ]
    });
    persist();
  },
  setMapMode: (m) => set({ mapMode: m }),

  // ----------------------------------------------------------
  takeDecision: (id, target) => {
    const st = get();
    if (st.gameOver) return;
    const dec = DECISIONS.find((d) => d.id === id);
    if (!dec) return;
    // con una oposicion fuerte, gobernar sale mas caro
    const cost = Math.round(dec.cost.capital * oppositionCostFactor(st.politics.opposition));
    if (st.capital < cost) return;
    if (dec.needsTarget && !target) return;

    const countries = fresh(st.countries);
    const relations = { ...st.relations };
    const world = fresh(st.world);
    const player = countries[st.playerCode];

    applyDelta(player, dec.effects, world);

    let hostility = 0;
    for (const rd of dec.relations ?? []) {
      const targets = resolveRelationTargets(rd, {
        player: st.playerCode, target, countries, blocs: st.blocs
      });
      targets.forEach((t) => adjustRelation(relations, st.playerCode, t, rd.amount));
      hostility += rd.amount;
    }

    const sanctions = [...st.sanctions];
    if (dec.id === 'sancionar' && target && !sanctions.includes(target)) sanctions.push(target);

    const targetName = target ? countries[target]?.name : '';
    const title = dec.needsTarget ? `${dec.label} - ${targetName}` : dec.label;

    set({
      countries,
      relations,
      world,
      sanctions,
      capital: clamp(st.capital - cost + (dec.effects.capital ?? 0), 0, 100),
      lastActions: [...st.lastActions, title],
      feed: [
        {
          turn: st.turn,
          date: dateLabel(world),
          kind: 'decision',
          emoji: dec.emoji,
          title,
          body: dec.detail,
          tone: 'neutral'
        },
        ...st.feed
      ]
    });
    persist();
  },

  // ---------------------------------------------------------- politica
  currentPoll: () => {
    const st = get();
    if (!st.started) return 0;
    return poll(st.countries[st.playerCode], st.politics, st.capital);
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
  resolveEvent: (key, choiceId) => {
    const st = get();
    const item = st.pending.find((p) => p.key === key);
    if (!item) return;
    const choice = item.event.choices?.find((c) => c.id === choiceId);
    if (!choice) return;

    const countries = fresh(st.countries);
    const relations = { ...st.relations };
    const world = fresh(st.world);
    const player = countries[st.playerCode];

    applyDelta(player, choice.effects, world);
    if (choice.cost?.fiscal) applyDelta(player, { fiscal_balance: -choice.cost.fiscal }, world);

    let outcome = choice.detail;
    let tone: FeedItem['tone'] = 'neutral';

    if (choice.risk && Math.random() < choice.risk.chance) {
      applyDelta(player, choice.risk.effects, world);
      outcome = `${choice.detail} PERO: ${choice.risk.label}.`;
      tone = 'malo';
    }

    for (const rd of choice.relations ?? []) {
      const targets = resolveRelationTargets(rd, {
        player: st.playerCode, target: item.target, countries, blocs: st.blocs
      });
      targets.forEach((t) => adjustRelation(relations, st.playerCode, t, rd.amount));
    }

    set({
      countries,
      relations,
      world,
      capital: clamp(st.capital - (choice.cost?.capital ?? 0) + (choice.effects.capital ?? 0), 0, 100),
      pending: st.pending.filter((p) => p.key !== key),
      lastActions: [...st.lastActions, `${item.event.title} -> ${choice.label}`],
      feed: [
        {
          turn: st.turn,
          date: dateLabel(world),
          kind: 'evento',
          emoji: item.event.emoji,
          title: `${item.event.title}: ${choice.label}`,
          body: outcome,
          tone
        },
        ...st.feed
      ]
    });
    persist();
  },

  // ----------------------------------------------------------
  endTurn: () => {
    const st = get();
    if (st.gameOver) return;

    const countries = fresh(st.countries);
    const relations = { ...st.relations };
    const world = fresh(st.world);
    const blocs = fresh(st.blocs);
    const feed: FeedItem[] = [];
    const pending: ActiveEvent[] = [];

    // 1. eventos sin resolver: la inaccion tambien es una decision
    for (const p of st.pending) {
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
      capital: st.capital,
      sanctions: st.sanctions,
      disruptions,
      tradeBase: st.tradeBase,
      active: st.active,
      taxBase: st.taxBase
    });
    const turn = tick.state.turn;
    const active = tick.state.active;

    if (tick.oilShockApplied > 0) {
      feed.push({
        turn, date: dateLabel(world), kind: 'sistema', emoji: '⛴️',
        title: 'Rutas maritimas interrumpidas',
        body: `El bloqueo sigue activo: el barril sube a ${world.oil_price} USD y el flete de larga distancia se encarece.`,
        tone: 'malo'
      });
    }

    // 5. eventos del turno
    const player = countries[st.playerCode];
    const rolled: GameEvent[] = [
      ...rollEvents(player, world, turn, blocs, relations, st.recentEventIds),
      ...crisisEvents(player)
    ];

    for (const ev of rolled) {
      const key = `${ev.id}-${turn}`;
      for (const cp of ev.disrupts ?? []) disruptions[cp] = turn + ev.duration;
      if (ev.worldEffects) {
        for (const c of Object.values(countries)) applyDelta(c, ev.worldEffects, undefined);
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
    if (st.lastActions.length) {
      const hostility = st.lastActions.some((a) => /sancion|Movilizar|Retirar|aranceles/i.test(a)) ? -18 : 8;
      reactions = aiReactions(countries, relations, blocs, st.playerCode, st.lastActions[0], hostility);
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

    // 8. la oposicion se mueve todos los meses segun como te vaya
    let politics: Politics = { ...st.politics, opposition: driftOpposition(st.politics, p2) };
    let election: ElectionResult | null = null;
    let succession: Candidate[] = [];

    // 9. se termino el mandato: hay elecciones
    if (isElectionDue(politics, turn)) {
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
        }
        if (after.gameOver) {
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
      }
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
      reactions,
      lastActions: [],
      pending: [...pending],
      recentEventIds: [...rolled.map((e) => e.id), ...st.recentEventIds].slice(0, 8),
      feed: [...feed.reverse(), ...st.feed].slice(0, 200),
      history: [
        ...st.history,
        {
          turn,
          happiness: p2.population.happiness,
          stability: p2.population.stability,
          inflation: p2.economy.inflation,
          growth: p2.economy.gdp_growth,
          gdp: p2.economy.gdp_trillion_usd
        }
      ].slice(-60),
      gameOver
    });
    persist();
  },

  // ----------------------------------------------------------
  joinBloc: (id) => {
    const st = get();
    const bloc = st.blocs.find((b) => b.id === id);
    if (!bloc) return;
    const check = canJoin(bloc, st.playerCode, st.relations, st.capital);
    if (!check.ok) return;

    const blocs = fresh(st.blocs);
    const relations = { ...st.relations };
    const target = blocs.find((b) => b.id === id)!;
    target.members.push(st.playerCode);
    target.candidates = target.candidates.filter((c) => c !== st.playerCode);
    target.cohesion = clamp(target.cohesion - 4, 0, 100);

    target.members.forEach((m) => m !== st.playerCode && adjustRelation(relations, st.playerCode, m, 10));
    target.rivals.forEach((r) => adjustRelation(relations, st.playerCode, r, -15));

    set({
      blocs,
      relations,
      capital: clamp(st.capital - (check.cost ?? 20), 0, 100),
      lastActions: [...st.lastActions, `Ingreso a ${target.short}`],
      feed: [
        {
          turn: st.turn, date: dateLabel(st.world), kind: 'bloque', emoji: '🤝',
          title: `${st.countries[st.playerCode].name} ingresa a ${target.short}`,
          body: target.rules[0],
          tone: 'bueno'
        },
        ...st.feed
      ]
    });
    persist();
  },

  leaveBloc: (id) => {
    const st = get();
    const blocs = fresh(st.blocs);
    const relations = { ...st.relations };
    const target = blocs.find((b) => b.id === id);
    if (!target || !target.members.includes(st.playerCode)) return;

    target.members = target.members.filter((m) => m !== st.playerCode);
    target.cohesion = clamp(target.cohesion - 10, 0, 100);
    target.members.forEach((m) => adjustRelation(relations, st.playerCode, m, -20));

    const countries = fresh(st.countries);
    applyDelta(countries[st.playerCode], { gdp_growth: -0.5, stability: -3 }, undefined);

    set({
      blocs, relations, countries,
      capital: clamp(st.capital - 15, 0, 100),
      lastActions: [...st.lastActions, `Salida de ${target.short}`],
      feed: [
        {
          turn: st.turn, date: dateLabel(st.world), kind: 'bloque', emoji: '🚪',
          title: `${st.countries[st.playerCode].name} abandona ${target.short}`,
          body: 'Los socios lo leen como una traicion. Cae el comercio y la confianza.',
          tone: 'malo'
        },
        ...st.feed
      ]
    });
    persist();
  },

  summit: (id) => {
    const st = get();
    if (st.capital < 10) return;
    const blocs = fresh(st.blocs);
    const relations = { ...st.relations };
    const target = blocs.find((b) => b.id === id);
    if (!target || !target.members.includes(st.playerCode)) return;

    target.cohesion = clamp(target.cohesion + 8, 0, 100);
    target.members.forEach((m) => m !== st.playerCode && adjustRelation(relations, st.playerCode, m, 8));

    set({
      blocs, relations,
      capital: clamp(st.capital - 10, 0, 100),
      lastActions: [...st.lastActions, `Cumbre de ${target.short}`],
      feed: [
        {
          turn: st.turn, date: dateLabel(st.world), kind: 'bloque', emoji: '🏛️',
          title: `Cumbre de ${target.short} en ${st.countries[st.playerCode].capital}`,
          body: `Cohesion del bloque +8 (ahora ${target.cohesion}). Las relaciones con los socios mejoran.`,
          tone: 'bueno'
        },
        ...st.feed
      ]
    });
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

      set({ countries, relations, world, feed: [...feed.reverse(), ...st.feed] });
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
