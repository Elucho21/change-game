'use client';

import { useGame } from '@/lib/store';
import { committedCapital } from '@/lib/orders';

/**
 * Plan del turno: lo que decidiste hacer y todavia no paso.
 * Se puede sacar cualquier orden hasta el momento de avanzar el mes.
 */
export default function TurnPlan() {
  const orders = useGame((s) => s.orders);
  const capital = useGame((s) => s.capital);
  const cancelOrder = useGame((s) => s.cancelOrder);
  const clearOrders = useGame((s) => s.clearOrders);

  if (orders.length === 0) {
    return (
      <div className="section">
        <h3>Plan del turno</h3>
        <p className="muted" style={{ fontSize: 11.5, margin: 0, lineHeight: 1.5 }}>
          Todavia no hay nada planificado. Lo que elijas se acumula aca y se ejecuta
          cuando avances el mes: hasta entonces podes probar, comparar y sacar lo que no te cierre.
        </p>
      </div>
    );
  }

  const comprometido = committedCapital(orders);
  const disponible = Math.round((capital - comprometido) * 10) / 10;

  return (
    <div className="section plan">
      <h3>
        Plan del turno ({orders.length}){' '}
        <button className="link" onClick={clearOrders} title="Vaciar el plan">vaciar</button>
      </h3>

      {orders.map((o, i) => (
        <div className="plan-item" key={`${o.kind}-${i}`}>
          <span className="ico">{o.emoji}</span>
          <span className="plan-label">{o.label}</span>
          {o.capitalCost > 0 && <span className="muted">{o.capitalCost} cap.</span>}
          <button className="link bad" onClick={() => cancelOrder(i)} title="Sacar del plan">✕</button>
        </div>
      ))}

      <div className="row" style={{ marginTop: 8, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
        <span>Capital comprometido</span>
        <b>{comprometido} de {Math.round(capital)}</b>
      </div>
      <div className="row">
        <span>Queda libre</span>
        <b className={disponible < 10 ? 'warn' : 'good'}>{disponible}</b>
      </div>
      <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
        Nada de esto paso todavia. Se ejecuta al avanzar el mes.
      </p>
    </div>
  );
}
