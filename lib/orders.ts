import type { Bloc, Country, Delta, GameEvent } from './types';
import { DECISIONS } from './decisions';
import { APPOINT_COST, DISMISS_COST, ministerById, SEAT_LABEL, type CabinetSeat } from './cabinet';
import { ratesOf, taxEffects, type TaxRates } from './engine';

/**
 * Plan del turno: lo que el jugador decidio hacer, todavia sin ejecutar.
 *
 * Nada se aplica al mundo en el momento. Las ordenes se acumulan, se pueden
 * quitar y recien se ejecutan al avanzar el mes. Eso permite probar, comparar
 * y arrepentirse sin ensuciar la partida ni el historial.
 *
 * Los cambios de impuestos se consolidan por alicuota: subir el IVA dos puntos
 * y despues bajarlo dos deja el plan como estaba, sin dos lineas contradictorias
 * en el historial.
 */

export type TaxKind = 'iva' | 'corporate' | 'income';

export interface DecisionOrder {
  kind: 'decision';
  id: string;
  target?: string;
  capitalCost: number;
  label: string;
  emoji: string;
  /** que pool paga esto: las decisiones de categoria diplomacia usan capital diplomatico */
  pool: 'politico' | 'diplomatico';
}

export interface TaxOrder {
  kind: 'tax';
  rate: TaxKind;
  /** cambio acumulado en puntos porcentuales */
  delta: number;
  capitalCost: number;
  label: string;
  emoji: string;
}

export interface BlocOrder {
  kind: 'bloc';
  action: 'join' | 'leave' | 'summit';
  blocId: string;
  capitalCost: number;
  label: string;
  emoji: string;
  /** los bloques siempre pagan del pool diplomatico */
  pool: 'diplomatico';
}

export interface EventOrder {
  kind: 'event';
  eventKey: string;
  choiceId: string;
  capitalCost: number;
  label: string;
  emoji: string;
}

export interface CabinetOrder {
  kind: 'cabinet';
  seat: CabinetSeat;
  /** id del ministro, o null para dejar la silla vacia */
  ministerId: string | null;
  capitalCost: number;
  label: string;
  emoji: string;
}

/** Banco Central: comprar o vender reservas de oro. */
export interface GoldOrder {
  kind: 'gold';
  action: 'comprar' | 'vender';
  /** toneladas, siempre positivo: la accion define si suman o restan reservas */
  tonnes: number;
  capitalCost: number;
  label: string;
  emoji: string;
}

export type PlannedOrder = DecisionOrder | TaxOrder | BlocOrder | EventOrder | CabinetOrder | GoldOrder;

export const TAX_LABELS: Record<TaxKind, string> = {
  iva: 'IVA',
  corporate: 'Impuesto a las empresas',
  income: 'Impuesto a los ingresos'
};

export const TAX_FIELD: Record<TaxKind, 'tax_iva' | 'tax_corporate' | 'tax_income_avg'> = {
  iva: 'tax_iva',
  corporate: 'tax_corporate',
  income: 'tax_income_avg'
};

/** Costo politico de mover una alicuota: retocar es barato, reformar no. */
export const taxCost = (delta: number) => (delta === 0 ? 0 : Math.round(2 + Math.abs(delta) * 1.5));

/**
 * Banco Central: tasas de conversion oro <-> caja.
 * Vender rinde menos por tonelada de lo que cuesta comprar (spread real de
 * cualquier mercado): comprar y vender en el mismo turno para lucrar con la
 * diferencia no compensa el costo politico de ida y vuelta.
 */
export const GOLD_BUY_RATE = { capitalPerTonne: 5 / 6, fiscalPerTonne: 0.6 / 6 };
export const GOLD_SELL_RATE = { capitalPerTonne: 0.3, fiscalPerTonne: 0.08 };

export function goldCapitalCost(action: 'comprar' | 'vender', tonnes: number): number {
  const rate = action === 'comprar' ? GOLD_BUY_RATE.capitalPerTonne : GOLD_SELL_RATE.capitalPerTonne;
  return Math.round(tonnes * rate);
}

/** Cuanto mueve el balance fiscal: negativo al comprar (sale caja), positivo al vender (entra caja). */
export function goldFiscalDelta(action: 'comprar' | 'vender', tonnes: number): number {
  const perTonne = action === 'comprar' ? -GOLD_BUY_RATE.fiscalPerTonne : GOLD_SELL_RATE.fiscalPerTonne;
  return Math.round(tonnes * perTonne * 100) / 100;
}

/**
 * Capital comprometido por el plan, en el pool indicado (politico por
 * default). Las ordenes de decision y de bloque llevan su propio `pool`;
 * todo el resto (impuestos, oro, eventos, gabinete) es siempre politico.
 */
export const committedCapital = (orders: PlannedOrder[], pool: 'politico' | 'diplomatico' = 'politico') =>
  orders.reduce((sum, o) => {
    const orderPool = o.kind === 'decision' || o.kind === 'bloc' ? o.pool : 'politico';
    return orderPool === pool ? sum + o.capitalCost : sum;
  }, 0);

/**
 * Agrega una orden de impuestos consolidando con la que ya exista para esa
 * alicuota. Si el cambio neto queda en cero, la orden desaparece del plan.
 */
export function addTaxOrder(orders: PlannedOrder[], rate: TaxKind, delta: number): PlannedOrder[] {
  const rest = orders.filter((o) => !(o.kind === 'tax' && o.rate === rate));
  const current = orders.find((o): o is TaxOrder => o.kind === 'tax' && o.rate === rate);
  const total = Math.round(((current?.delta ?? 0) + delta) * 10) / 10;

  if (total === 0) return rest;

  return [
    ...rest,
    {
      kind: 'tax',
      rate,
      delta: total,
      capitalCost: taxCost(total),
      label: `${TAX_LABELS[rate]} ${total > 0 ? '+' : ''}${total} puntos`,
      emoji: total > 0 ? '📈' : '📉'
    }
  ];
}

/**
 * Agrega una orden del Banco Central consolidando con la que ya exista:
 * comprar 10 y despues vender 4 en el mismo turno deja una sola orden de
 * comprar 6, igual que pasa con los impuestos. `currentReserves` limita
 * cuanto se puede vender: no se puede vender lo que no se tiene.
 */
export function addGoldOrder(
  orders: PlannedOrder[], action: 'comprar' | 'vender', tonnes: number, currentReserves: number
): PlannedOrder[] {
  const rest = orders.filter((o) => o.kind !== 'gold');
  const current = orders.find((o): o is GoldOrder => o.kind === 'gold');
  const currentSigned = current ? (current.action === 'comprar' ? current.tonnes : -current.tonnes) : 0;
  const deltaSigned = action === 'comprar' ? tonnes : -tonnes;
  const totalSigned = Math.round((currentSigned + deltaSigned) * 10) / 10;

  if (totalSigned === 0) return rest;

  const finalAction: 'comprar' | 'vender' = totalSigned > 0 ? 'comprar' : 'vender';
  const finalTonnes = finalAction === 'vender'
    ? Math.min(Math.abs(totalSigned), currentReserves)
    : Math.abs(totalSigned);
  if (finalTonnes <= 0) return rest;

  return [
    ...rest,
    {
      kind: 'gold',
      action: finalAction,
      tonnes: finalTonnes,
      capitalCost: goldCapitalCost(finalAction, finalTonnes),
      label: finalAction === 'comprar' ? `Comprar ${finalTonnes} t de oro` : `Vender ${finalTonnes} t de oro`,
      emoji: finalAction === 'comprar' ? '🪙' : '💰'
    }
  ];
}

/** Una decision por vez: volver a elegirla con otro objetivo reemplaza la anterior. */
export function addDecisionOrder(
  orders: PlannedOrder[], id: string, capitalCost: number, target?: string, targetName?: string
): PlannedOrder[] {
  const dec = DECISIONS.find((d) => d.id === id);
  if (!dec) return orders;
  const rest = orders.filter((o) => !(o.kind === 'decision' && o.id === id));
  return [
    ...rest,
    {
      kind: 'decision',
      id,
      target,
      capitalCost,
      label: targetName ? `${dec.label} - ${targetName}` : dec.label,
      emoji: dec.emoji,
      pool: dec.category === 'diplomacia' ? 'diplomatico' : 'politico'
    }
  ];
}

/** Una accion por bloque: cambiar de idea reemplaza la anterior. */
export function addBlocOrder(
  orders: PlannedOrder[], action: BlocOrder['action'], bloc: Bloc, capitalCost: number
): PlannedOrder[] {
  const rest = orders.filter((o) => !(o.kind === 'bloc' && o.blocId === bloc.id));
  const label =
    action === 'join' ? `Ingresar a ${bloc.short}`
      : action === 'leave' ? `Abandonar ${bloc.short}`
        : `Convocar cumbre de ${bloc.short}`;
  return [
    ...rest,
    {
      kind: 'bloc',
      action,
      blocId: bloc.id,
      capitalCost,
      label,
      emoji: action === 'join' ? '🤝' : action === 'leave' ? '🚪' : '🏛️',
      pool: 'diplomatico'
    }
  ];
}

/** Una respuesta por evento: elegir otra opcion reemplaza la anterior. */
export function addEventOrder(
  orders: PlannedOrder[], event: GameEvent, eventKey: string, choiceId: string, capitalCost: number
): PlannedOrder[] {
  const choice = event.choices?.find((c) => c.id === choiceId);
  if (!choice) return orders;
  const rest = orders.filter((o) => !(o.kind === 'event' && o.eventKey === eventKey));
  return [
    ...rest,
    {
      kind: 'event',
      eventKey,
      choiceId,
      capitalCost,
      label: `${event.title}: ${choice.label}`,
      emoji: event.emoji
    }
  ];
}

/**
 * Una silla por vez: volver a mover la misma reemplaza la orden anterior.
 * Nombrar cuesta menos que echar: sacar a alguien tiene costo politico propio.
 */
export function addCabinetOrder(
  orders: PlannedOrder[], seat: CabinetSeat, ministerId: string | null, ocupada: boolean
): PlannedOrder[] {
  const rest = orders.filter((o) => !(o.kind === 'cabinet' && o.seat === seat));
  const minister = ministerById(ministerId ?? undefined);

  if (!ministerId) {
    return [
      ...rest,
      {
        kind: 'cabinet', seat, ministerId: null,
        capitalCost: DISMISS_COST,
        label: `Dejar vacante ${SEAT_LABEL[seat]}`,
        emoji: '🚪'
      }
    ];
  }
  if (!minister) return orders;

  return [
    ...rest,
    {
      kind: 'cabinet', seat, ministerId,
      capitalCost: ocupada ? APPOINT_COST + DISMISS_COST : APPOINT_COST,
      label: `${SEAT_LABEL[seat]}: ${minister.name} (${minister.title})`,
      emoji: minister.party === 'oposicion' ? '🤝' : '👤'
    }
  ];
}

/** Que opcion quedo elegida para un evento, si hay alguna. */
export const chosenFor = (orders: PlannedOrder[], eventKey: string) =>
  orders.find((o): o is EventOrder => o.kind === 'event' && o.eventKey === eventKey)?.choiceId;

const DELTA_KEYS: (keyof Delta)[] = [
  'happiness', 'stability', 'gdp_growth', 'inflation', 'unemployment',
  'fiscal_balance', 'debt_to_gdp', 'military_budget_bn', 'gold_reserves_tonnes',
  'capital', 'global_tension', 'oil_price'
];

function addDelta(acc: Delta, delta: Delta) {
  for (const k of DELTA_KEYS) {
    const v = delta[k];
    if (v === undefined) continue;
    acc[k] = Math.round(((acc[k] ?? 0) + v) * 100) / 100;
  }
}

/**
 * Efecto combinado estimado de lo que hay planeado para este turno: suma los
 * `effects` de las decisiones planeadas y el efecto de recaudacion/inflacion/
 * crecimiento/humor de los cambios de impuestos planeados (via `taxEffects`).
 *
 * No suma bloques, gabinete ni eventos: esos son cambios de relaciones o
 * personas, no numeros de economia/humor comparables en la misma tabla. Es
 * una estimacion del "grueso" del turno, no el resultado exacto: eventos que
 * disparen despues de ejecutar el plan pueden mover las cosas igual.
 */
export function estimatedTurnEffects(orders: PlannedOrder[], country: Country): Delta {
  const acc: Delta = {};

  for (const o of orders) {
    if (o.kind === 'decision') {
      const dec = DECISIONS.find((d) => d.id === o.id);
      if (dec) addDelta(acc, dec.effects);
    }
  }

  const taxOrders = orders.filter((o): o is TaxOrder => o.kind === 'tax');
  if (taxOrders.length) {
    const baseline: TaxRates = ratesOf(country);
    const projected: Country = {
      ...country,
      economy: { ...country.economy }
    };
    for (const o of taxOrders) {
      projected.economy[TAX_FIELD[o.rate]] = country.economy[TAX_FIELD[o.rate]] + o.delta;
    }
    const tax = taxEffects(projected, baseline);
    addDelta(acc, {
      fiscal_balance: tax.fiscal,
      inflation: tax.inflation,
      gdp_growth: tax.growth,
      happiness: tax.happiness
    });
  }

  return acc;
}

/** Cambio de alicuota planificado, para mostrar el valor futuro junto al actual. */
export function plannedTaxRate(orders: PlannedOrder[], rate: TaxKind, country: Country): number | null {
  const order = orders.find((o): o is TaxOrder => o.kind === 'tax' && o.rate === rate);
  if (!order) return null;
  return Math.round((country.economy[TAX_FIELD[rate]] + order.delta) * 10) / 10;
}
