'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES, DECISIONS } from '@/lib/decisions';
import { previewDelta } from '@/lib/engine';
import { useGame } from '@/lib/store';
import DecisionPreview from './DecisionPreview';

/**
 * Decisiones por categoria. El primer click abre las consecuencias a 3 turnos;
 * el segundo confirma. Asi el jugador ve el impacto de segundo orden antes de
 * gastar capital politico, y no se ejecuta nada por un click perdido.
 */
export default function DecisionsPanel() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]['id']>('economia');
  const [open, setOpen] = useState<string | null>(null);

  const { capital, selected, playerCode, countries, orders, turn } = useGame();
  const plan = useGame((s) => s.planDecision);
  const preview = useGame((s) => s.previewDecision);
  const available = useGame((s) => s.availableCapital)();
  const target = selected && selected !== playerCode ? selected : undefined;

  const list = DECISIONS.filter((d) => d.category === cat);

  // la proyeccion simula 3 turnos por duplicado: se calcula solo para la
  // decision abierta y se recalcula unicamente si cambia el turno o el objetivo
  const projection = useMemo(
    () => (open ? preview(open, target) : null),
    [open, target, turn, preview]
  );

  return (
    <div>
      <div className="section" style={{ position: 'sticky', top: 0, zIndex: 4 }}>
        <h3>
          Capital politico: {available} libre
          {available !== Math.round(capital) && (
            <span className="muted"> (de {Math.round(capital)}, el resto ya esta en el plan)</span>
          )}
        </h3>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={cat === c.id ? 'btn-primary' : ''}
              onClick={() => { setCat(c.id); setOpen(null); }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        {orders.length > 0 && (
          <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
            En el plan: {orders.map((o) => o.label).join(' · ')}
          </p>
        )}
      </div>

      <div className="section">
        {list.map((d) => {
          const needsTarget = d.needsTarget && !target;
          const afford = available >= d.cost.capital;
          const yaEnPlan = orders.some((o) => o.kind === 'decision' && o.id === d.id);
          const disabled = !afford || needsTarget;
          const isOpen = open === d.id;

          return (
            <div key={d.id}>
              <button
                className={`decision${isOpen ? ' open' : ''}${yaEnPlan ? ' planned' : ''}`}
                disabled={disabled}
                onClick={() => setOpen(isOpen ? null : d.id)}
                title={needsTarget ? 'Elegi un pais en el globo primero' : afford ? '' : 'Capital politico insuficiente'}
              >
                <strong>
                  {d.emoji} {d.label}{yaEnPlan ? ' ✓' : ''}{' '}
                  <span className="muted">
                    ({d.cost.capital} cap.{d.cost.fiscal ? ` · ${d.cost.fiscal}% PBI` : ''})
                  </span>
                </strong>
                <small>{d.detail}</small>
                {d.needsTarget && (
                  <small className={target ? 'good' : 'warn'}>
                    {target ? `Objetivo: ${countries[target].flag} ${countries[target].name}` : 'Elegi un pais en el globo'}
                  </small>
                )}
                <span className="preview">
                  {previewDelta(d.effects).map((p) => (
                    <em key={p.key} className={p.tone === 'bueno' ? 'good' : 'bad'}>
                      {p.label} {p.value > 0 ? '+' : ''}{p.value}
                    </em>
                  ))}
                  {d.relations?.map((r, i) => (
                    <em key={i} className={r.amount > 0 ? 'good' : 'bad'}>
                      {r.target === 'TARGET' ? 'Relacion objetivo' : `Relacion ${r.target}`} {r.amount > 0 ? '+' : ''}{r.amount}
                    </em>
                  ))}
                </span>
              </button>

              {isOpen && (
                <div className="decision-open">
                  {projection && <DecisionPreview projection={projection} />}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      className="btn-primary"
                      onClick={() => { plan(d.id, target); setOpen(null); }}
                      disabled={disabled}
                    >
                      {yaEnPlan ? 'Actualizar en el plan' : 'Agregar al plan'}
                    </button>
                    <button onClick={() => setOpen(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
