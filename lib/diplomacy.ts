import type { Country, Decision, Delta, EventContext } from './types';
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
 * Enfriamiento de las acciones de gobierno.
 *
 * Toda decision tiene un tiempo de espera: sin eso, la estrategia optima era
 * repetir la misma jugada todos los meses hasta romper el juego (cinco
 * misiones diplomaticas seguidas convertian a cualquiera en aliado).
 *
 * La escala es corta a proposito, para que el jugador siempre tenga algo que
 * hacer: 1 mes las medidas de rutina, 2 las que mueven la aguja, 3 las que
 * cuestan capital de verdad. Los actos de comunicacion usan 4: el gesto se
 * gasta si lo repetis.
 */
export const DEFAULT_COOLDOWN: Record<string, number> = {
  economia: 2,
  interior: 2,
  comercio: 2,
  diplomacia: 2,
  defensa: 3,
  comunicacion: 4,
  previsional: 3
};

/** Meses de espera de una decision: los suyos, o los de su categoria. */
export const cooldownOf = (dec: Decision) =>
  dec.cooldown ?? DEFAULT_COOLDOWN[dec.category] ?? 2;

export const cooldownKey = (decisionId: string, target?: string) =>
  target ? `${decisionId}|${target}` : decisionId;

/** Turno en el que vuelve a estar disponible. */
export const cooldownUntil = (dec: Decision, turn: number) => turn + cooldownOf(dec);

/** Cuantos meses faltan para poder repetir esta accion con este pais. */
export function cooldownLeft(
  cooldowns: Record<string, number>, decisionId: string, target: string | undefined, turn: number
): number {
  const until = cooldowns[cooldownKey(decisionId, target)] ?? 0;
  return Math.max(0, until - turn);
}

// ------------------------------------------------------------------
// Decisiones "once" / toggle / requires
// ------------------------------------------------------------------

/** true si esta decision (o esta decision contra este objetivo) ya se tomo alguna vez. */
export function isUsedOnce(usedOnce: string[], decisionId: string, target?: string): boolean {
  return usedOnce.includes(cooldownKey(decisionId, target));
}

/**
 * Elegibilidad estructural de una decision, mas alla del cooldown normal
 * (eso lo resuelve `cooldownLeft` aparte): si es `once`, no puede haberse
 * usado ya; si tiene `requires`, ese prerequisito tiene que estar usado.
 * Es lo que hace que un par toggle (crear/desmantelar) se muestre uno a la
 * vez en vez de los dos juntos o el usado quedando ahi para siempre.
 */
export function decisionEligible(dec: Decision, usedOnce: string[], target?: string): boolean {
  if (dec.once && isUsedOnce(usedOnce, dec.id, target)) return false;
  if (dec.requires && !isUsedOnce(usedOnce, dec.requires, target)) return false;
  return true;
}

/**
 * Decisiones contextuales (Change World Game v1.2, pedido de Grok en
 * docs/INFRAESTRUCTURA_Y_DECISIONES_CONTEXTUALES.md): una decision con
 * `when` que da falso no aparece en el catalogo, mismo criterio que
 * `decisionEligible` de arriba (desaparece, no se muestra deshabilitada).
 * Mismo one-liner que `eligibleEvents` (lib/engine.ts) para eventos.
 */
export function decisionWhenEligible(dec: Decision, ctx: EventContext): boolean {
  return !dec.when || dec.when(ctx);
}
