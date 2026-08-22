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
}

export interface RelationDelta {
  target: string | 'bloc:militar' | 'bloc:aduanera' | 'vecinos' | 'todos';
  amount: number;
}

export interface EventChoice {
  id: string;
  label: string;
  detail: string;
  cost?: { capital?: number; fiscal?: number };
  effects: Delta;
  relations?: RelationDelta[];
  risk?: { chance: number; label: string; effects: Delta };  // puede salir mal
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
}

export interface EventContext {
  player: Country;
  world: GlobalState;
  turn: number;
  blocs: Bloc[];
  relationOf: (other: string) => number;
  memberOf: (blocId: string) => boolean;
}

export interface ActiveEvent {
  key: string;
  event: GameEvent;
  turn: number;
  target: string;
  resolved: boolean;
  chosen?: string;
  outcome?: string;
}

export interface Decision {
  id: string;
  category: 'economia' | 'diplomacia' | 'comercio' | 'interior' | 'defensa';
  label: string;
  emoji: string;
  detail: string;
  cost: { capital: number; fiscal?: number };
  needsTarget?: boolean;
  effects: Delta;
  relations?: RelationDelta[];
  cooldown?: number;
  when?: (ctx: EventContext) => boolean;
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
}

export type PointKind = 'capital' | 'puerto' | 'aeropuerto' | 'chokepoint';

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
  | 'fiscal_balance' | 'debt_to_gdp' | 'capital' | 'trade';

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
