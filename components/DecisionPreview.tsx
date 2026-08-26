'use client';

import type { Projection } from '@/lib/types';

/**
 * Consecuencias de una decision a 3 turnos vista.
 * Todo el calculo viene del motor (lib/simulation.ts): este componente solo dibuja.
 */
export default function DecisionPreview({ projection }: { projection: Projection }) {
  const { metrics, warnings, unlocks, defuses, horizon } = projection;

  const fmt = (v: number, key: string) => {
    const s = Math.abs(v) < 0.05 ? '0' : `${v > 0 ? '+' : ''}${v}`;
    return key === 'trade' && s !== '0' ? `${s}%` : s;
  };

  return (
    <div className="projection">
      <div className="proj-head">
        <span>Consecuencias probables</span>
        <span className="muted">ahora → +1 → +2 → +{horizon} meses</span>
      </div>

      {metrics.length === 0 && (
        <p className="muted" style={{ fontSize: 11.5, margin: '4px 0' }}>
          Sin efectos medibles a {horizon} meses.
        </p>
      )}

      {metrics.map((m) => {
        // cuanto de esto es tendencia (iba a pasar igual) vs. lo que causa
        // la decision: se compara al cierre del horizonte, no turno a turno,
        // para no duplicar la fila de arriba con otra serie casi identica.
        const drift = m.naturalDrift[m.naturalDrift.length - 1];
        return (
          <div key={m.key}>
            <div className="proj-row">
              <span className="proj-label">{m.label}</span>
              <span className="proj-series">
                {m.deltas.map((d, i) => (
                  <em
                    key={i}
                    className={Math.abs(d) < 0.05 ? 'muted' : m.tone === 'malo' ? 'bad' : 'good'}
                    title={i === 0 ? 'impacto inmediato' : `dentro de ${i} ${i === 1 ? 'mes' : 'meses'}`}
                  >
                    {fmt(d, m.key)}
                  </em>
                ))}
              </span>
            </div>
            {Math.abs(drift) >= 0.05 && (
              <div className="proj-drift muted" title={`Sin tomar esta decision, ${m.label.toLowerCase()} iba a moverse igual a ${horizon} meses`}>
                tendencia sin actuar: {fmt(drift, m.key)}
              </div>
            )}
          </div>
        );
      })}

      {warnings.length > 0 && (
        <ul className="proj-warnings">
          {warnings.map((w, i) => (
            <li key={i} className={w.severity === 'grave' ? 'bad' : 'warn'}>
              {w.severity === 'grave' ? '⚠️' : '•'} {w.text}
              {w.turn > 0 && <span className="muted"> (mes +{w.turn})</span>}
            </li>
          ))}
        </ul>
      )}

      {unlocks.length > 0 && (
        <p className="proj-events bad">
          Habilita: {unlocks.map((e) => `${e.emoji} ${e.title}`).join(' · ')}
        </p>
      )}
      {defuses.length > 0 && (
        <p className="proj-events good">
          Desactiva: {defuses.map((e) => `${e.emoji} ${e.title}`).join(' · ')}
        </p>
      )}
    </div>
  );
}
