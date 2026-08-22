import type { Bloc, Country, TradeFlow } from './types';
import { getRelation } from './engine';
import { disruptionFactor } from './routes';

/**
 * Modelo de comercio bilateral (gravedad).
 *
 * La idea: dos economias comercian mas cuanto mas grandes son y menos cuanto
 * mas lejos estan. Encima de eso pesan los bloques (una union aduanera
 * multiplica el flujo), la relacion diplomatica, las sanciones y el estado de
 * las rutas maritimas.
 *
 * La constante 112 esta calibrada sobre la GRAVEDAD BASE, antes de los
 * multiplicadores, en miles de millones de USD al ano:
 *   China-EE.UU. ~ 580 | EE.UU.-Mexico ~ 350 | Brasil-China ~ 130
 *
 * El volumen final es mayor cuando hay bloque compartido o buena relacion:
 * EE.UU.-Mexico termina cerca de 560 porque comparten el T-MEC, que es lo que
 * se busca. Los tests cuidan el orden de magnitud, no el numero exacto.
 */

const K = 112;

/** Distancia en km entre dos puntos (haversine). */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Cache de distancias entre paises. Las capitales no se mueven, asi que la
 * distancia entre dos paises se calcula una sola vez por partida.
 *
 * Importa mas de lo que parece: el preview de consecuencias simula 3 turnos
 * por duplicado y cada turno recalcula el comercio de los 24 paises contra
 * todos los demas. Sin cache son ~3.500 haversine por preview.
 */
const distCache = new Map<string, number>();

function cachedDistance(a: Country, b: Country): number {
  const key = a.code < b.code ? `${a.code}|${b.code}` : `${b.code}|${a.code}`;
  const hit = distCache.get(key);
  if (hit !== undefined) return hit;
  const d = distanceKm(a.lat, a.lng, b.lat, b.lng);
  distCache.set(key, d);
  return d;
}

/**
 * Factor de distancia de cada par: K / (km/1000 + 1)^0.6.
 *
 * Las capitales no se mueven, asi que este numero es constante para toda la
 * partida. Guardarlo evita una potencia por par en cada calculo: con 76 paises
 * son 2.850 `Math.pow` por turno, y el preview simula seis turnos.
 */
const gravityCache = new Map<string, number>();

function gravityFactor(a: Country, b: Country): number {
  const key = a.code < b.code ? `${a.code}|${b.code}` : `${b.code}|${a.code}`;
  const hit = gravityCache.get(key);
  if (hit !== undefined) return hit;
  const dist = cachedDistance(a, b);
  const f = K / (dist / 1000 + 1) ** 0.6;
  gravityCache.set(key, f);
  return f;
}

export interface TradeContext {
  countries: Record<string, Country>;
  relations: Record<string, number>;
  blocs: Bloc[];
  sanctions: string[];
  playerCode: string;
  disruptions: Record<string, number>;
  turn: number;
}

/** Multiplicador por bloques compartidos: la union aduanera es la que mas pesa. */
function blocMultiplier(blocs: Bloc[], a: string, b: string) {
  let m = 1;
  for (const bloc of blocs) {
    if (!bloc.members.includes(a) || !bloc.members.includes(b)) continue;
    const w = bloc.cohesion / 100;
    if (bloc.type === 'aduanera') m += 0.5 * w;
    else if (bloc.type === 'economica') m += 0.2 * w;
    else if (bloc.type === 'militar') m += 0.1 * w;
  }
  return m;
}

/** Volumen anual de comercio entre dos paises, en miles de millones de USD. */
export function bilateralVolume(a: string, b: string, ctx: TradeContext): number {
  const ca = ctx.countries[a];
  const cb = ctx.countries[b];
  if (!ca || !cb || a === b) return 0;

  const size = Math.sqrt(ca.economy.gdp_trillion_usd * cb.economy.gdp_trillion_usd);
  const gravity = size * gravityFactor(ca, cb);

  const rel = getRelation(ctx.relations, a, b);
  const relMult = 1 + rel / 250;                       // 0.6 .. 1.4
  const blocMult = blocMultiplier(ctx.blocs, a, b);
  const sanctioned =
    (a === ctx.playerCode && ctx.sanctions.includes(b)) ||
    (b === ctx.playerCode && ctx.sanctions.includes(a));

  // el comercio de larga distancia depende de que las rutas esten abiertas
  const longHaul = cachedDistance(ca, cb) > 6000 ? disruptionFactor(ctx.disruptions, ctx.turn) : 1;

  const v = gravity * relMult * blocMult * longHaul * (sanctioned ? 0.15 : 1);
  return Math.round(v * 10) / 10;
}

/**
 * Matriz de comercio de todo el mundo, cacheada por contexto.
 *
 * Con 76 paises hay 2.850 pares. Calcular el total de cada pais por separado
 * era O(n^2) por pais, o sea O(n^3) para el mundo entero, y cada turno del
 * preview lo repetia: 12 ms con 24 paises pasaron a 95 ms con 76.
 *
 * Aca la matriz se calcula UNA vez por estado del mundo, aprovechando que el
 * comercio es simetrico (la mitad de las cuentas), y se guarda contra las
 * partes del contexto que pueden cambiarla. Mientras el mundo no cambie, los
 * totales salen del cache.
 */
interface TradeMatrix {
  /** volumen por par, clave "A|B" con A < B */
  pairs: Map<string, number>;
  /** comercio total por pais */
  totals: Record<string, number>;
}

interface CacheEntry {
  signature: string;
  rel: unknown;
  blocs: unknown;
  disr: unknown;
  matrix: TradeMatrix;
}

/**
 * Cache de varias matrices a la vez.
 *
 * Con una sola entrada no alcanzaba: el preview de decisiones corre DOS
 * simulaciones en paralelo (con la decision y sin ella) y alterna entre las
 * dos, asi que cada consulta pisaba la del otro estado y se recalculaba todo,
 * 2.850 pares por vez. Cuatro entradas cubren el patron con memoria trivial.
 */
const CACHE_SIZE = 4;
let cache: CacheEntry[] = [];

/**
 * Firma barata del estado que afecta al comercio.
 *
 * No se serializa el mundo entero: eso costaba mas que la propia matriz. Con
 * el turno, la suma de los PBI y la identidad de los objetos que el store
 * reemplaza cuando cambian, alcanza.
 */
function signatureOf(ctx: TradeContext): string {
  let gdpSum = 0;
  for (const c of Object.values(ctx.countries)) gdpSum += c.economy.gdp_trillion_usd;
  return `${ctx.turn}|${ctx.playerCode}|${ctx.sanctions.length}|${Math.round(gdpSum * 1000)}`;
}

export function tradeMatrix(ctx: TradeContext): TradeMatrix {
  const signature = signatureOf(ctx);
  const hit = cache.find(
    (e) => e.signature === signature && e.rel === ctx.relations && e.blocs === ctx.blocs && e.disr === ctx.disruptions
  );
  if (hit) return hit.matrix;

  const codes = Object.keys(ctx.countries);
  const pairs = new Map<string, number>();
  const totals: Record<string, number> = {};
  for (const c of codes) totals[c] = 0;

  // el comercio es simetrico: se calcula media matriz
  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      const a = codes[i];
      const b = codes[j];
      const v = bilateralVolume(a, b, ctx);
      if (v <= 0) continue;
      pairs.set(a < b ? `${a}|${b}` : `${b}|${a}`, v);
      totals[a] += v;
      totals[b] += v;
    }
  }
  for (const c of codes) totals[c] = Math.round(totals[c] * 10) / 10;

  const matrix: TradeMatrix = { pairs, totals };
  cache = [
    { signature, rel: ctx.relations, blocs: ctx.blocs, disr: ctx.disruptions, matrix },
    ...cache
  ].slice(0, CACHE_SIZE);
  return matrix;
}

/** Volumen entre dos paises tomandolo de la matriz ya calculada. */
export const volumeFrom = (m: TradeMatrix, a: string, b: string) =>
  m.pairs.get(a < b ? `${a}|${b}` : `${b}|${a}`) ?? 0;

/** El socio mas grande de un pais, sin ordenar la lista entera. */
export function topPartnerOf(code: string, ctx: TradeContext): string {
  const m = tradeMatrix(ctx);
  let best = '';
  let bestV = -1;
  for (const other of Object.keys(ctx.countries)) {
    if (other === code) continue;
    const v = volumeFrom(m, code, other);
    if (v > bestV) {
      bestV = v;
      best = other;
    }
  }
  return best;
}

/** Vacia el cache. Solo hace falta en tests que reusan objetos mutados. */
export const clearTradeCache = () => {
  cache = [];
};

/** Todos los socios de un pais, ordenados de mayor a menor volumen. */
export function partnersOf(code: string, ctx: TradeContext): TradeFlow[] {
  const { pairs } = tradeMatrix(ctx);
  return Object.keys(ctx.countries)
    .filter((other) => other !== code)
    .map((other) => ({
      from: code,
      to: other,
      volume: pairs.get(code < other ? `${code}|${other}` : `${other}|${code}`) ?? 0,
      sanctioned: code === ctx.playerCode && ctx.sanctions.includes(other)
    }))
    .sort((x, y) => y.volume - x.volume);
}

/** Comercio total de un pais (suma de todos sus socios). */
export const totalTrade = (code: string, ctx: TradeContext) => tradeMatrix(ctx).totals[code] ?? 0;

/** Comercio total de cada pais: se calcula una vez al empezar la partida y sirve de baseline. */
export function tradeBaseline(ctx: TradeContext): Record<string, number> {
  return { ...tradeMatrix(ctx).totals };
}

/**
 * Cuanto empuja (o frena) el comercio al crecimiento, comparado con el
 * arranque de la partida. Perder el 20% del comercio = -0.4 de crecimiento.
 */
export function tradeGrowthEffect(code: string, ctx: TradeContext, baseline: Record<string, number>) {
  const base = baseline[code];
  if (!base) return 0;
  const now = totalTrade(code, ctx);
  const ratio = now / base;
  return Math.max(-2, Math.min(2, (ratio - 1) * 2));
}

/**
 * Flujos que se dibujan en el globo: los socios principales del jugador mas el
 * comercio entre potencias, para que el globo cuente algo sin saturarse.
 */
export function visibleFlows(ctx: TradeContext, limit = 8): TradeFlow[] {
  const flows: TradeFlow[] = partnersOf(ctx.playerCode, ctx).slice(0, limit);
  const majors = ['USA', 'China', 'Germany', 'Japan'];
  for (const a of majors) {
    for (const b of majors) {
      if (a >= b || !ctx.countries[a] || !ctx.countries[b]) continue;
      if (a === ctx.playerCode || b === ctx.playerCode) continue;
      flows.push({ from: a, to: b, volume: bilateralVolume(a, b, ctx), sanctioned: false });
    }
  }
  return flows.filter((f) => f.volume > 0);
}
