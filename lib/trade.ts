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
 * La constante 112 esta calibrada para que los pares conocidos den valores
 * creibles en miles de millones de USD al ano:
 *   China-EE.UU. ~ 580 | EE.UU.-Mexico ~ 350 | Brasil-China ~ 130
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
  const dist = distanceKm(ca.lat, ca.lng, cb.lat, cb.lng);
  const gravity = (size * K) / (dist / 1000 + 1) ** 0.6;

  const rel = getRelation(ctx.relations, a, b);
  const relMult = 1 + rel / 250;                       // 0.6 .. 1.4
  const blocMult = blocMultiplier(ctx.blocs, a, b);
  const sanctioned =
    (a === ctx.playerCode && ctx.sanctions.includes(b)) ||
    (b === ctx.playerCode && ctx.sanctions.includes(a));

  // el comercio de larga distancia depende de que las rutas esten abiertas
  const longHaul = dist > 6000 ? disruptionFactor(ctx.disruptions, ctx.turn) : 1;

  const v = gravity * relMult * blocMult * longHaul * (sanctioned ? 0.15 : 1);
  return Math.round(v * 10) / 10;
}

/** Todos los socios de un pais, ordenados de mayor a menor volumen. */
export function partnersOf(code: string, ctx: TradeContext): TradeFlow[] {
  return Object.keys(ctx.countries)
    .filter((other) => other !== code)
    .map((other) => ({
      from: code,
      to: other,
      volume: bilateralVolume(code, other, ctx),
      sanctioned: code === ctx.playerCode && ctx.sanctions.includes(other)
    }))
    .sort((x, y) => y.volume - x.volume);
}

/** Comercio total de un pais (suma de todos sus socios). */
export const totalTrade = (code: string, ctx: TradeContext) =>
  partnersOf(code, ctx).reduce((s, f) => s + f.volume, 0);

/** Comercio total de cada pais: se calcula una vez al empezar la partida y sirve de baseline. */
export function tradeBaseline(ctx: TradeContext): Record<string, number> {
  const out: Record<string, number> = {};
  for (const code of Object.keys(ctx.countries)) out[code] = totalTrade(code, ctx);
  return out;
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
