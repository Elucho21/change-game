import type {
  ActiveEvent, Bloc, Country, FeedItem, GlobalState, Layers, MapMode
} from './types';
import type { TaxRates } from './engine';
import type { Politics } from './politics';
import type { PlannedOrder } from './orders';

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
  }[];
  selected: string | null;
  mapMode: MapMode;
  layers: Layers;
  disruptions: Record<string, number>;
  tradeBase: Record<string, number>;
  /** opcionales: los saves v1 no los traian */
  taxBase?: Record<string, TaxRates>;
  politics?: Politics;
  startingGdp?: number;
  /** plan del turno sin ejecutar */
  orders?: PlannedOrder[];
  /** acciones diplomaticas en enfriamiento */
  cooldowns?: Record<string, number>;
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
 * Migra un save viejo al formato actual. Hoy solo acepta la version corriente;
 * cuando exista la v2, aca va el `if (raw.version === 1) { ... }`.
 */
function migrate(raw: SavedGame): SavedGame | null {
  if (raw.version === SAVE_VERSION) return raw;
  return null;
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
    const parsed = JSON.parse(raw) as SavedGame;
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
