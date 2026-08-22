import type { Bloc, Country, GameEvent } from './types';
import { DECISIONS } from './decisions';

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
}

export interface EventOrder {
  kind: 'event';
  eventKey: string;
  choiceId: string;
  capitalCost: number;
  label: string;
  emoji: string;
}

export type PlannedOrder = DecisionOrder | TaxOrder | BlocOrder | EventOrder;

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

/** Capital politico comprometido por el plan. */
export const committedCapital = (orders: PlannedOrder[]) =>
  orders.reduce((sum, o) => sum + o.capitalCost, 0);

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
      emoji: dec.emoji
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
      emoji: action === 'join' ? '🤝' : action === 'leave' ? '🚪' : '🏛️'
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

/** Que opcion quedo elegida para un evento, si hay alguna. */
export const chosenFor = (orders: PlannedOrder[], eventKey: string) =>
  orders.find((o): o is EventOrder => o.kind === 'event' && o.eventKey === eventKey)?.choiceId;

/** Cambio de alicuota planificado, para mostrar el valor futuro junto al actual. */
export function plannedTaxRate(orders: PlannedOrder[], rate: TaxKind, country: Country): number | null {
  const order = orders.find((o): o is TaxOrder => o.kind === 'tax' && o.rate === rate);
  if (!order) return null;
  return Math.round((country.economy[TAX_FIELD[rate]] + order.delta) * 10) / 10;
}
