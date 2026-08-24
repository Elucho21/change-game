/** Tipos del juego. La forma de Country espeja engine/countries_mvp.json
 *  para que el motor Python, la web y Grok hablen el mismo idioma. */

export type RelationLabel = 'aliado' | 'amistoso' | 'neutral' | 'tenso' | 'hostil';
export type BlocType = 'militar' | 'aduanera' | 'economica' | 'politica';
export type EventScope = 'mundial' | 'nacional' | 'personal';
export type ArcKind = 'alianza' | 'comercio' | 'tension' | 'sancion' | 'flujo';

export interface Economy {
  gdp_trillion_usd: number;
  gdp_growth: number;
  unemployment: number;
  inflation: number;
  gold_reserves_tonnes: number;
  debt_to_gdp: number;
  fiscal_balance: number;
  tax_iva: number;
  tax_corporate: number;
  tax_income_avg: number;
}

export interface Population {
  total_millions: number;
  male_pct: number;
  female_pct: number;
  unemployed_millions: number;
  minorities: Record<string, number>;
  happiness: number;
  stability: number;
}

export interface Military {
  active_soldiers: number;
  reserves: number;
  aircraft: number;
  submarines: number;
  nuclear_warheads: number;
  tanks: number;
  naval_ships: number;
  military_budget_bn: number;
}

export interface Traits {
  ideology: string;
  aggression: number;
  risk_tolerance: number;
  nuclear_doctrine: string;
  priorities: string[];
}

/**
 * Previsional, empleo y peso fiscal de pensiones/defensa.
 * Viene de engine/countries_mvp.json (FMI/SIPRI/OECD/ILO, 2026).
 * Opcional: un save viejo o un pais sin ficha social no rompe.
 */
export interface SocialStats {
  retirement_age_men: number;
  retirement_age_women: number;
  /** gasto publico en pensiones, % del PBI */
  pension_spend_pct_gdp: number;
  /** gasto militar, % del PBI (SIPRI o presupuesto / PBI) */
  military_spend_pct_gdp: number;
  contrib_worker: number;
  contrib_employer: number;
  replacement_rate: number;
  coverage: number;
  evasion: number;
  dependency_ratio: number;
  /** % de ocupados formales */
  formal_pct: number;
  /** % de ocupados informales */
  informal_pct: number;
}

export interface Country {
  code: string;              // clave del JSON original: 'Argentina', 'USA'...
  iso: string;               // ADM0_A3 del GeoJSON: 'ARG', 'USA'...
  name: string;
  flag: string;
  region: string;
  capital: string;
  lat: number;
  lng: number;
  playable: boolean;
  economy: Economy;
  population: Population;
  military: Military;
  sectors: Record<string, number>;
  traits: Traits;
  /** ficha previsional/empleo del pais. Semilla del tick v1.0. */
  social?: SocialStats;
  /**
   * Composicion de clase (peso poblacional de cada grupo, lib/popularGroups.ts).
   * Dato real pendiente de Grok (docs/PEDIDOS_A_GROK.md): si falta, se usa un
   * default calculado desde PBI per capita y sectores (`computeClassComposition`).
   */
  classComposition?: ClassComposition;
  /**
   * Salud de cada sector, 0-100. No viene del JSON: aparece cuando un evento
   * golpea un sector y se recupera sola unos puntos por turno.
   */
  sectorHealth?: Record<string, number>;
  /** inflacion del mes anterior: sirve para saber si sube o baja */
  prevInflation?: number;
  /** felicidad del mes anterior: sirve para medir tendencia en driftOpposition (lib/politics.ts) */
  prevHappiness?: number;
  /** ultimo efecto fiscal por impuestos ya asentado en fiscal_balance (ver taxEffects en engine.ts) */
  taxFiscalApplied?: number;
  /**
   * Indice de tipo de cambio. 100 = arranque de partida.
   * Sube = depreciacion; baja = apreciacion. Solo lo llena el pais del jugador.
   */
  fx?: number;
}

export interface GlobalState {
  year: number;
  month: number;
  oil_price: number;
  gold_price: number;
  usd_strength: number;
  global_tension: number;
  active_conflicts: string[];
}

/** Bloque: alianza militar, union aduanera, bloque economico o foro politico. */
export interface Bloc {
  id: string;
  name: string;
  short: string;
  type: BlocType;
  color: string;
  founded: number;
  members: string[];
  candidates: string[];       // paises que pueden pedir ingreso
  rivals: string[];           // ingresar tensa la relacion con estos
  cohesion: number;           // 0-100, sube/baja con eventos y cumbres
  description: string;
  effects: {
    tradeBonus?: number;      // +% al crecimiento por comercio intrabloque
    internalTariff?: number;  // arancel interno (union aduanera = 0)
    externalTariff?: number;  // arancel externo comun
    securityBonus?: number;   // disuasion militar
    techBonus?: number;
    inflationDrag?: number;   // ancla nominal (ej. UE)
  };
  rules: string[];            // reglas que ve el jugador en el panel
}

/** Delta que un evento o decision aplica sobre un pais. */
export interface Delta {
  happiness?: number;
  stability?: number;
  gdp_growth?: number;
  inflation?: number;
  unemployment?: number;
  fiscal_balance?: number;
  debt_to_gdp?: number;
  military_budget_bn?: number;
  gold_reserves_tonnes?: number;
  capital?: number;           // capital politico del jugador
  global_tension?: number;
  oil_price?: number;
  /**
   * Oposicion politica (lib/politics.ts `Politics.opposition`). Igual que
   * `capital`, vive fuera de `Country` asi que `applyDelta` no lo toca: se
   * aplica especial-caseado en `runPlan` (lib/store.ts), no en engine.ts.
   * Negativo = baja la oposicion (lo que hace una jugada populista de verdad).
   */
  opposition?: number;
}

export interface RelationDelta {
  target: string | 'bloc:militar' | 'bloc:aduanera' | 'vecinos' | 'todos';
  amount: number;
}

/**
 * Sistema Moral (Corrupcion, Justicia, lideres minoritarios), lib/moral.ts,
 * Change World Game v1.1. Vive en lib/types.ts (no en lib/moral.ts) porque
 * EventContext.moral lo necesita mas abajo y lib/moral.ts a su vez importa
 * `MoralEffects` de este archivo — ponerlo en moral.ts armaria un ciclo.
 */
export interface MoralState {
  /** 0-100. Nivel general de corrupcion del gobierno. */
  corruption: number;
  /** 0-100. Progreso de Investigaciones (Corte/Comision "tirando del hilo"). */
  investigacion: number;
  /** 0-100. Independencia de la Suprema Corte (agregado de los 5 jueces). */
  corteIntegrity: number;
  /** 0-100. Lealtad de la Corte al oficialismo. */
  corteLealtad: number;
  /** 0-40. Favores vigentes a jueces/parlamentarios: frenan investigaciones, cuestan a largo plazo. */
  favoresActivos: number;
  /** 0-100. Indice ambiental liviano (Amalia Verde). Alto = mejor. */
  environmentIndex: number;
  /** 0-100. Indice de inseguridad liviano (Jhon el Duro). Alto = peor. */
  securityIndex: number;
  /** 0 / 15 / 30. Factor de escandalo activo, decae solo. */
  scandalFactor: number;
  /** true despues del onboarding de Enrique (mes 4). Antes, todo esto no se ve. */
  onboarded: boolean;
  /** 0-8%. Apoyo al Partido Comunista. */
  gustavoApoyo: number;
  /** 0-5%. Apoyo al Partido Verde. */
  amaliaApoyo: number;
  /** 0-9%. Apoyo a la Ultra-Derecha. */
  jhonApoyo: number;
}

/**
 * Efectos de una Decision o EventChoice sobre el sistema moral (lib/moral.ts,
 * Change World Game v1.1). Separado de `Delta` a proposito: son campos que
 * solo usa un puñado de cartas (Enrique Grook, lideres minoritarios), no
 * tiene sentido que las otras 100+ decisiones del juego carguen con ellos.
 */
export interface MoralEffects {
  corruption?: number;
  investigacion?: number;
  corteIntegrity?: number;
  corteLealtad?: number;
  favoresActivos?: number;
  environmentIndex?: number;
  securityIndex?: number;
  scandalFactor?: number;
  gustavoApoyo?: number;
  amaliaApoyo?: number;
  jhonApoyo?: number;
}

/**
 * Popularidad por sector (lib/popularGroups.ts, Change World Game v1.2).
 * Capa PARALELA a `population.happiness`: no lo reemplaza, y felicidad
 * sigue con su propio motor intacto (renuncia forzada, presion de calle,
 * regen de capital, drift de corrupcion). Vive aca por el mismo motivo que
 * `MoralState`: EventContext y Decision/EventChoice/GameEvent lo necesitan
 * mas abajo, y lib/popularGroups.ts a su vez importa `GroupEffects` de aca.
 */
export type GroupKey = 'empresarios' | 'claseMedia' | 'obrera' | 'alta' | 'fieles';

export interface PopularGroupsState {
  /** 0-100. Empresarios y comerciantes: priorizan baja inflacion, baja carga impositiva, desregulacion. */
  empresarios: number;
  /** 0-100. Clase media: odia corrupcion/inflacion/desempleo, quiere impuestos bajos Y buenos servicios. */
  claseMedia: number;
  /** 0-100. Clase obrera: en contra del desempleo y del capital, a favor de los sindicatos. */
  obrera: number;
  /** 0-100. Clase alta/oligarcas: quieren desregulacion y favores, les pesa el impuesto corporativo. */
  alta: number;
  /** 0-100. Los fieles: base leal, se mueve poco y tiene piso alto. */
  fieles: number;
  /** 0-100, 50=neutral. Sube con desregulacion/privatizaciones, baja con controles/estatizaciones. */
  deregulationIndex: number;
}

/** Peso poblacional de cada grupo, 0-100, suma ~100. Estatico por pais (ver lib/popularGroups.ts). */
export interface ClassComposition {
  empresarios: number;
  claseMedia: number;
  obrera: number;
  alta: number;
  fieles: number;
}

/** Efectos de una Decision o EventChoice sobre la popularidad por sector. */
export interface GroupEffects {
  empresarios?: number;
  claseMedia?: number;
  obrera?: number;
  alta?: number;
  fieles?: number;
  deregulationIndex?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  detail: string;
  cost?: { capital?: number; fiscal?: number };
  effects: Delta;
  relations?: RelationDelta[];
  risk?: { chance: number; label: string; effects: Delta };  // puede salir mal
  /** efectos sobre corrupcion/justicia/lideres minoritarios (lib/moral.ts) */
  moralEffects?: MoralEffects;
  /** efectos sobre la popularidad por sector (lib/popularGroups.ts) */
  groupEffects?: GroupEffects;
  /** golpe directo sobre la tasa de politica del Banco Central (lib/centralBank.ts) */
  rateEffect?: number;
}

export interface GameEvent {
  id: string;
  scope: EventScope;
  title: string;
  emoji: string;
  tags: string[];
  weight: number;
  duration: number;
  description: string;
  /** condicion para que el evento pueda dispararse */
  when?: (ctx: EventContext) => boolean;
  /** efecto automatico si el jugador no elige (o evento mundial) */
  effects?: Delta;
  worldEffects?: Delta;       // aplica a todos los paises (solo scope mundial)
  choices?: EventChoice[];
  /** ids de Chokepoint que este evento cierra durante `duration` turnos */
  disrupts?: string[];
  /**
   * Efecto que se repite CADA TURNO mientras el evento sigue activo, durante
   * `duration` turnos. Es lo que separa una recesion de cuatro meses de un
   * apagon de un dia: `effects` es el golpe inicial, `ongoing` es el que duele
   * todos los meses hasta que pasa. Aplica al pais del jugador.
   */
  ongoing?: Delta;
  /** igual que `ongoing` pero sobre todos los paises (solo scope mundial) */
  worldOngoing?: Delta;
  /**
   * Golpe sobre sectores productivos, en % de caida del sector.
   * `{ agriculture: -20 }` = la agricultura cae 20%. El impacto sobre el
   * crecimiento del pais es proporcional al peso de ese sector en su economia,
   * asi una sequia castiga a Argentina (agricultura 8%) y no a Japon (1%).
   */
  sectorEffects?: Record<string, number>;
  /** efecto automatico sobre corrupcion/justicia/lideres minoritarios (lib/moral.ts), junto a `effects` */
  moralEffects?: MoralEffects;
  /** efecto automatico sobre la popularidad por sector (lib/popularGroups.ts), junto a `effects` */
  groupEffects?: GroupEffects;
  /** quien habla (lib/characters.ts): 'enrique_grook' | 'gustavo_comun' | 'amalia_verde' | 'jhon_el_duro' */
  characterId?: string;
  /** UX/UI v1.1 (components/EventCard.tsx): tag visual de urgencia. Default 'normal' si no se declara. */
  urgency?: 'normal' | 'important' | 'critical';
}

export interface EventContext {
  player: Country;
  world: GlobalState;
  turn: number;
  blocs: Bloc[];
  relationOf: (other: string) => number;
  memberOf: (blocId: string) => boolean;
  /**
   * Estado politico para condicionar eventos de oposicion, campana e interna.
   * Opcional para no romper los eventos que ya existen.
   *
   *   when: (c) => (c.politics?.opposition ?? 0) > 60
   *   when: (c) => (c.politics?.monthsToElection ?? 99) <= 6
   */
  politics?: {
    /** fuerza de la oposicion, 0-100 */
    opposition: number;
    /** meses que faltan para la proxima eleccion presidencial */
    monthsToElection: number;
    /** meses que faltan para el medio termino, o null si el pais no tiene */
    monthsToMidterm: number | null;
    /** intencion de voto proyectada de hoy, 0-100 */
    poll: number;
    /** mandatos consecutivos del lider actual */
    consecutiveTerms: number;
    /** true si este es su ultimo mandato y despues hay que elegir sucesor */
    lastTerm: boolean;
    /** true durante los primeros meses despues de ganar una eleccion */
    honeymoon: boolean;
    /** capital politico disponible ahora */
    capital: number;
    /** escanos propios en el parlamento de 100 */
    seats: number;
    /** true si hay algun ministro de otro partido en el gabinete */
    coalition: boolean;
  };
  /**
   * Comercio del jugador, para eventos que reaccionen a la economia externa.
   *   when: (c) => (c.trade?.changeVsStart ?? 0) < -10
   */
  trade?: {
    /** intercambio total en miles de millones de USD */
    total: number;
    /** variacion porcentual contra el arranque de la partida */
    changeVsStart: number;
    /** codigo del principal socio comercial */
    topPartner: string;
  };
  /**
   * FMI del jugador. Opcional para no romper eventos que no lo miran.
   *   when: (c) => (c.imf?.weight ?? 0) >= 5
   *   when: (c) => c.imf?.stage === 'watch'
   */
  imf?: {
    stage: 'none' | 'watch' | 'mission' | 'program' | 'exit';
    weight: number;
    monthsRising: number;
  };
  /**
   * Indice de tipo de cambio del jugador. 100 = arranque. Sube = depreciacion.
   *   when: (c) => (c.fx ?? 100) > 120
   */
  fx?: number;
  /**
   * Presion de calle por inflacion/desempleo altos sostenidos (lib/streetPressure.ts).
   *   when: (c) => (c.street?.streetWeight ?? 0) >= 4
   */
  street?: {
    inflationMonthsHigh: number;
    unemploymentMonthsHigh: number;
    streetWeight: number;
  };
  /**
   * Sistema moral del jugador (lib/moral.ts), Change World Game v1.1.
   * Solo existe (para el jugador) despues del onboarding de Enrique, mes 4.
   *   when: (c) => (c.moral?.environmentIndex ?? 100) < 40
   */
  moral?: MoralState;
  /**
   * Popularidad por sector (lib/popularGroups.ts), Change World Game v1.2.
   * Solo se completa para el gating de decisiones en components/DecisionsPanel.tsx
   * (no pasa por SimState/eventExtraOf: el filtro de decisiones es UI de
   * display, no parte del contrato preview-vs-real que SimState protege).
   *   when: (c) => (c.groups?.obrera ?? 50) < 30
   */
  groups?: PopularGroupsState;
  /**
   * Capital diplomatico disponible (pool separado del politico, lib/electoral.ts).
   * Mismo motivo que `groups`: solo para gating de decisiones en el panel.
   *   when: (c) => (c.capitalDiplomatico ?? 0) >= 20
   */
  capitalDiplomatico?: number;
}

/**
 * Onboarding de Enrique (mes 4, obligatorio, 2 pasos) o una de sus cartas
 * normales, esperando en pantalla completa (components/EnriqueModal.tsx).
 * Se resuelve YA al click (`resolveEnrique` en lib/store.ts), no pasa por
 * `pending`/orders: es modal bloqueante, no algo que se planifique como el
 * resto de los eventos.
 */
export type PendingEnrique =
  | { kind: 'onboarding'; step: 'intro' | 'panel' }
  | { kind: 'event'; key: string; event: GameEvent }
  | null;

export interface ActiveEvent {
  key: string;
  event: GameEvent;
  turn: number;
  target: string;
  resolved: boolean;
  chosen?: string;
  outcome?: string;
  /** turnos que le quedan al efecto `ongoing`; se descuenta en cada tick */
  turnsLeft?: number;
}

export interface Decision {
  id: string;
  category:
    | 'economia' | 'diplomacia' | 'comercio' | 'interior' | 'defensa' | 'comunicacion' | 'previsional'
    | 'infraestructura';
  label: string;
  emoji: string;
  detail: string;
  cost: { capital: number; fiscal?: number };
  needsTarget?: boolean;
  effects: Delta;
  relations?: RelationDelta[];
  /**
   * Meses que hay que esperar para volver a usarla.
   * Entre 1 y 3 segun el peso de la medida; los actos de comunicacion usan 4,
   * porque repetir el gesto todos los meses lo gasta.
   * Si no se declara, se usa el default de su categoria (lib/diplomacy.ts).
   */
  cooldown?: number;
  when?: (ctx: EventContext) => boolean;
  /** si true, se puede tomar una sola vez en toda la partida (lib/diplomacy.ts decisionEligible) */
  once?: boolean;
  /** id de la decision que se HABILITA al ejecutar esta (par toggle, ej. crear/desmantelar) */
  unlocks?: string;
  /** id de una decision que ya tiene que haberse tomado antes para que esta aparezca */
  requires?: string;
  /** efectos sobre corrupcion/justicia/lideres minoritarios (lib/moral.ts) */
  moralEffects?: MoralEffects;
  /** efectos sobre la popularidad por sector (lib/popularGroups.ts) */
  groupEffects?: GroupEffects;
}

export interface FeedItem {
  turn: number;
  date: string;
  kind: 'evento' | 'decision' | 'reaccion' | 'sistema' | 'bloque';
  emoji: string;
  title: string;
  body: string;
  tone: 'bueno' | 'malo' | 'neutral';
}

/** Un chokepoint: paso obligado del comercio maritimo mundial. */
export interface Chokepoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  oilShare: number;      // fraccion del petroleo mundial que pasa por aca
  description: string;
}

/** Ruta maritima real, dibujada con pathsData en el globo. */
export interface MaritimeRoute {
  id: string;
  name: string;
  volume: number;              // importancia relativa (miles de millones USD/ano)
  color: string;
  chokepoints: string[];       // ids de Chokepoint por los que pasa
  coords: [number, number][];  // [lat, lng] de cada tramo
}

/** Flujo de comercio bilateral, en miles de millones de USD al ano. */
export interface TradeFlow {
  from: string;
  to: string;
  volume: number;
  sanctioned: boolean;
}

export interface DiploArc {
  id: string;
  from: string;
  to: string;
  kind: ArcKind;
  strength: number;
  label: string;
}

// ============================================================
// MAPA: MODOS, CAPAS Y PUNTOS
// ============================================================

export type MapMode = 'relaciones' | 'bloques' | 'estabilidad' | 'economia';

/** Capas del globo que el jugador puede prender y apagar. */
export interface Layers {
  diplomacia: boolean;
  comercio: boolean;
  rutas: boolean;
  /** capa maestra de puntos: si esta en false no se dibuja ningun punto */
  points: boolean;
  capitals: boolean;
  ports: boolean;
  airports: boolean;
  infraestructura: boolean;
}

export type PointKind = 'capital' | 'puerto' | 'aeropuerto' | 'chokepoint' | 'infraestructura';

/** Punto dibujable sobre el globo (pointsData). */
export interface MapPoint {
  id: string;
  kind: PointKind;
  name: string;
  lat: number;
  lng: number;
  /** codigo del pais al que pertenece, si aplica */
  country?: string;
  /** importancia relativa 0-1: define el radio del punto */
  weight?: number;
  description?: string;
}

/** Crisis activa en un paso maritimo. */
export interface ChokepointCrisis {
  id: string;
  name: string;
  /** turno en el que se reabre */
  until: number;
  /** que lo cerro: id del evento o 'manual' */
  cause: string;
}

// ============================================================
// PROYECCION DE CONSECUENCIAS (2do y 3er orden)
// ============================================================

export type ProjectionKey =
  | 'happiness' | 'stability' | 'gdp_growth' | 'inflation' | 'unemployment'
  | 'fiscal_balance' | 'debt_to_gdp' | 'capital' | 'capitalDiplomatico' | 'trade';

export interface ProjectionMetric {
  key: ProjectionKey;
  label: string;
  /** valor actual, antes de decidir */
  now: number;
  /** diferencia contra no hacer nada, en el turno 0 (inmediato), +1, +2, +3... */
  deltas: number[];
  tone: 'bueno' | 'malo' | 'neutral';
}

export interface ProjectionWarning {
  turn: number;
  severity: 'aviso' | 'grave';
  text: string;
}

export interface Projection {
  horizon: number;
  metrics: ProjectionMetric[];
  warnings: ProjectionWarning[];
  /** eventos que esta decision vuelve posibles (no lo eran antes) */
  unlocks: { id: string; title: string; emoji: string }[];
  /** eventos que esta decision deja de habilitar */
  defuses: { id: string; title: string; emoji: string }[];
}
