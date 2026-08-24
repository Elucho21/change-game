import type {
  ActiveEvent, Bloc, Country, FeedItem, GlobalState, Layers, MapMode, MoralState, PendingEnrique
} from './types';
import type { TaxRates } from './engine';
import type { Politics } from './politics';
import type { PlannedOrder } from './orders';
import type { Cabinet } from './cabinet';
import type { PensionState } from './pension';
import type { EmploymentState } from './employment';

/**
 * Guardado de partida en localStorage.
 *
 * Regla de compatibilidad: el save lleva version. Si en el futuro cambia la
 * forma del estado, se sube SAVE_VERSION y se agrega la migracion en
 * `migrate()`. Un save de version desconocida se descarta en silencio en vez
 * de romper la partida: perder una partida es molesto, cargar un estado
 * corrupto es peor.
 */

export const SAVE_KEY = 'change-game:save';
export const SAVE_VERSION = 1;

/** Lo unico que se guarda: datos, nunca funciones del store. */
export interface PersistedState {
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
  lastActions: string[];
  history: {
    turn: number; happiness: number; stability: number;
    inflation: number; growth: number; gdp: number;
    // agregados despues: los saves viejos no los traen
    unemployment?: number; fiscal?: number; debt?: number;
    capital?: number; opposition?: number; tension?: number; oil?: number;
    fx?: number;
  }[];
  selected: string | null;
  mapMode: MapMode;
  layers: Layers;
  disruptions: Record<string, number>;
  tradeBase: Record<string, number>;
  imf?: {
    stage: 'none' | 'watch' | 'mission' | 'program' | 'exit';
    monthsRising: number;
    monthsPrimarySurplus: number;
    conditionStreak: number;
    weight: number;
    exitUntil: number;
  };
  /** presion de calle por inflacion/desempleo altos sostenidos */
  street?: {
    inflationMonthsHigh: number;
    unemploymentMonthsHigh: number;
    streetWeight: number;
  };
  /** opcionales: los saves v1 no los traian */
  taxBase?: Record<string, TaxRates>;
  politics?: Politics;
  startingGdp?: number;
  /** plan del turno sin ejecutar */
  orders?: PlannedOrder[];
  /** acciones diplomaticas en enfriamiento */
  cooldowns?: Record<string, number>;
  /** decisiones "once" ya usadas. Opcional: los saves anteriores no lo traen. */
  usedOnce?: string[];
  cabinet?: Cabinet;
  lastCoalitionDemand?: number;
  /** sistema previsional del jugador (Change World Game v1.0). Opcional: los saves anteriores no lo traen. */
  pension?: PensionState;
  /** empleo formal/informal y salario real del jugador. Opcional: los saves anteriores no lo traen. */
  employment?: EmploymentState;
  /** sistema moral (Change World Game v1.1). Opcional: los saves anteriores no lo traen. */
  moral?: MoralState;
  /** onboarding/carta de Enrique esperando resolucion. Opcional: los saves anteriores no lo traen. */
  pendingEnrique?: PendingEnrique;
  gameOver: { title: string; body: string } | null;
}

export interface SavedGame {
  version: number;
  savedAt: string;
  /** para mostrar en la pantalla de inicio sin cargar toda la partida */
  summary: { playerCode: string; playerName: string; flag: string; turn: number; date: string };
  state: PersistedState;
}

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;

/**
 * Migra un save viejo al formato actual.
 *
 * Patron para cuando exista la v2: agregar un caso `if (raw.version === 1)`
 * que devuelva `{ ...raw, version: 2, state: { ...raw.state, campoNuevo: X } }`
 * en vez de descartarlo. Hoy solo hay v1, asi que no hay nada que migrar
 * todavia, pero la funcion ya tiene la forma que va a necesitar.
 */
function migrate(raw: SavedGame): SavedGame | null {
  if (raw.version === SAVE_VERSION) return raw;
  return null;
}

/**
 * Chequeo minimo de forma antes de aceptar un save. No es una validacion
 * exhaustiva de todos los campos (serian decenas), pero cubre lo que
 * rompe el juego en runtime si falta: un save con forma invalida (editado
 * a mano en devtools, truncado, de otra version que paso el chequeo de
 * `version` por casualidad) se descarta en vez de reventar mas adelante
 * con un `undefined.algo` en medio de una partida.
 */
function isPlausibleSave(raw: unknown): raw is SavedGame {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Partial<SavedGame>;
  if (typeof r.version !== 'number') return false;
  if (typeof r.savedAt !== 'string') return false;
  if (!r.summary || typeof r.summary !== 'object') return false;
  if (!r.state || typeof r.state !== 'object') return false;

  const s = r.state as Partial<PersistedState>;
  if (typeof s.playerCode !== 'string' || !s.playerCode) return false;
  if (typeof s.turn !== 'number') return false;
  if (!s.countries || typeof s.countries !== 'object') return false;

  const player = s.countries[s.playerCode];
  if (!player || typeof player !== 'object') return false;
  if (!player.economy || typeof player.economy.tax_iva !== 'number') return false;

  return true;
}

export function saveGame(state: PersistedState, summary: SavedGame['summary']): boolean {
  if (!hasStorage()) return false;
  try {
    const payload: SavedGame = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      summary,
      state
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    // cuota llena o modo privado: el juego sigue, simplemente no se guarda
    return false;
  }
}

export function loadGame(): SavedGame | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlausibleSave(parsed)) {
      clearGame();
      return null;
    }
    const migrated = migrate(parsed);
    if (!migrated) {
      clearGame();
      return null;
    }
    return migrated;
  } catch {
    clearGame();
    return null;
  }
}

/** Resumen de la partida guardada, sin cargarla. Para la pantalla de inicio. */
export function savedSummary(): SavedGame['summary'] | null {
  return loadGame()?.summary ?? null;
}

export function clearGame(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // nada que hacer: si no se puede borrar, la proxima partida lo sobreescribe
  }
}

/**
 * Baja la partida guardada como archivo .json. Es la unica forma de no
 * perderla si se borra el navegador o se cambia de maquina: localStorage
 * no viaja con vos, un archivo si.
 */
export function exportSave(): boolean {
  if (!hasStorage()) return false;
  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  const summary = savedSummary();
  const name = summary
    ? `change-game-${summary.playerCode}-turno${summary.turn}.json`
    : 'change-game-save.json';

  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Carga una partida desde un archivo exportado con `exportSave`. Pasa por
 * el mismo chequeo de forma que un save de localStorage: un archivo
 * cualquiera (o de otro juego) se rechaza en vez de reventar la partida.
 */
export async function importSave(file: File): Promise<{ ok: boolean; error?: string }> {
  if (!hasStorage()) return { ok: false, error: 'localStorage no disponible' };
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON valido' };
  }

  if (!isPlausibleSave(parsed)) {
    return { ok: false, error: 'El archivo no tiene la forma de una partida de Change World Game' };
  }
  if (!migrate(parsed)) {
    return { ok: false, error: `Version de save no soportada (v${parsed.version})` };
  }

  try {
    window.localStorage.setItem(SAVE_KEY, text);
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo guardar (localStorage lleno o modo privado)' };
  }
}
