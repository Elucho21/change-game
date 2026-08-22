import type { Country, Decision, Delta } from './types';
import { clamp, getRelation } from './engine';

/**
 * Tasador diplomatico: una accion bilateral vale segun con quien.
 *
 * Antes, firmar un tratado con Uruguay costaba y rendia exactamente lo mismo
 * que firmarlo con Estados Unidos. Ahora el tamano relativo de la otra economia
 * define las dos cosas: cuanto sale conseguirlo y cuanto te cambia la vida.
 *
 * Con Argentina como jugador y el tratado comercial (12 de capital, +0.4 de
 * crecimiento) queda asi:
 *   Uruguay  -> ~8 de capital  y +0.10 de crecimiento
 *   Estados Unidos -> ~30 de capital y +1.60 de crecimiento
 *
 * Encima pesa la relacion: negociar con un aliado es mas barato que arrancarle
 * lo mismo a alguien hostil.
 */

/** Cuanto mas grande es la otra economia. Acotado para que no se dispare. */
export function sizeFactor(player: Country, target: Country): number {
  const mine = Math.max(0.01, player.economy.gdp_trillion_usd);
  const theirs = Math.max(0.01, target.economy.gdp_trillion_usd);
  return clamp(theirs / mine, 0.25, 4);
}

/**
 * Modificador por relacion, 0.6 a 1.4.
 * Con un aliado la negociacion ya esta medio hecha; con un hostil, todo cuesta.
 */
export const relationMod = (relation: number) => clamp(1 - relation / 200, 0.6, 1.4);

export interface ScaledAction {
  /** costo en capital politico, ya redondeado */
  cost: number;
  /** efectos escalados por el tamano del objetivo */
  effects: Delta;
  size: number;
  /** explicacion corta para mostrar en la UI */
  reason: string;
}

/** Metricas que escalan con el tamano del socio. El resto queda igual. */
const SCALABLE: (keyof Delta)[] = [
  'gdp_growth', 'inflation', 'unemployment', 'fiscal_balance', 'happiness'
];

/**
 * Ajusta costo y efectos de una decision bilateral segun el objetivo.
 * Si la decision no necesita objetivo, devuelve todo tal cual.
 */
export function scaleDecision(
  dec: Decision,
  player: Country,
  target: Country | undefined,
  relations: Record<string, number>
): ScaledAction {
  if (!dec.needsTarget || !target) {
    return { cost: dec.cost.capital, effects: dec.effects, size: 1, reason: '' };
  }

  const size = sizeFactor(player, target);
  const relation = getRelation(relations, player.code, target.code);
  const relMod = relationMod(relation);

  const cost = Math.max(1, Math.round(dec.cost.capital * (0.5 + 0.5 * size) * relMod));

  const effects: Delta = { ...dec.effects };
  for (const key of SCALABLE) {
    const v = dec.effects[key];
    if (v === undefined) continue;
    effects[key] = Math.round(v * size * 100) / 100;
  }

  const escala =
    size >= 2 ? 'una economia mucho mas grande que la tuya'
      : size <= 0.5 ? 'una economia mucho mas chica que la tuya'
        : 'una economia de tu tamano';
  const clima =
    relMod > 1.1 ? ' y una relacion complicada'
      : relMod < 0.9 ? ' y una relacion que ya viene bien'
        : '';

  return { cost, effects, size, reason: `${target.name} es ${escala}${clima}.` };
}

/**
 * Cooldown de acciones diplomaticas por pais.
 * Sin esto, mandar la misma mision diplomatica cinco veces seguidas era la
 * forma barata de llevar cualquier relacion a aliado.
 */
export const COOLDOWNS: Record<string, number> = {
  mision_diplomatica: 6,
  ayuda_humanitaria: 6,
  ejercicios_conjuntos: 8,
  tratado_comercial: 12,
  retirar_embajador: 4,
  sancionar: 6,
  movilizacion: 12
};

export const cooldownKey = (decisionId: string, target?: string) =>
  target ? `${decisionId}|${target}` : decisionId;

/** Turno en el que vuelve a estar disponible, o 0 si no tiene cooldown. */
export const cooldownUntil = (decisionId: string, turn: number) =>
  COOLDOWNS[decisionId] ? turn + COOLDOWNS[decisionId] : 0;

/** Cuantos meses faltan para poder repetir esta accion con este pais. */
export function cooldownLeft(
  cooldowns: Record<string, number>, decisionId: string, target: string | undefined, turn: number
): number {
  const until = cooldowns[cooldownKey(decisionId, target)] ?? 0;
  return Math.max(0, until - turn);
}
