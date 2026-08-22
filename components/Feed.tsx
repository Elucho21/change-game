'use client';

import { previewDelta } from '@/lib/engine';
import { chosenFor } from '@/lib/orders';
import { useGame } from '@/lib/store';

const TONE: Record<string, string> = { bueno: 'good', malo: 'bad', neutral: 'muted' };

export default function Feed() {
  const { feed, pending, history, capital, orders } = useGame();
  const planChoice = useGame((s) => s.planEventChoice);

  return (
    <div>
      {pending.length > 0 && (
        <div className="section">
          <h3 className="warn">Esperan tu decision ({pending.length})</h3>
          <p className="muted" style={{ fontSize: 11, margin: '-4px 0 8px' }}>
            Tu respuesta queda en el plan y se resuelve al avanzar el mes. Podes cambiarla antes.
          </p>
          {pending.map((p) => (
            <div className="card" key={p.key} style={{ borderColor: 'var(--warn)' }}>
              <h4>{p.event.emoji} {p.event.title}</h4>
              <p>{p.event.description}</p>
              <div style={{ marginTop: 9 }}>
                {p.event.choices?.map((c) => {
                  const cost = c.cost?.capital ?? 0;
                  const elegida = chosenFor(orders, p.key) === c.id;
                  return (
                    <button
                      key={c.id}
                      className={`decision${elegida ? ' planned' : ''}`}
                      disabled={capital < cost}
                      onClick={() => planChoice(p.key, c.id)}
                      title={capital < cost ? 'Capital politico insuficiente' : 'Queda en el plan del turno'}
                    >
                      <strong>{elegida ? '✓ ' : ''}{c.label} {cost ? <span className="muted">({cost} cap.)</span> : null}</strong>
                      <small>{c.detail}</small>
                      <span className="preview">
                        {previewDelta(c.effects).map((d) => (
                          <em key={d.key} className={d.tone === 'bueno' ? 'good' : 'bad'}>
                            {d.label} {d.value > 0 ? '+' : ''}{d.value}
                          </em>
                        ))}
                        {c.risk && <em className="bad">riesgo {Math.round(c.risk.chance * 100)}%: {c.risk.label}</em>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 2 && <Sparkline />}

      <div>
        {feed.map((f, i) => (
          <div className="feed-item" key={i}>
            <span className="ico">{f.emoji}</span>
            <div style={{ minWidth: 0 }}>
              <h5 className={TONE[f.tone]}>{f.title}</h5>
              <p>{f.body}</p>
              <div className="when">turno {f.turn} · {f.date} · {f.kind}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mini grafico de la evolucion de tu gobierno. */
function Sparkline() {
  const history = useGame((s) => s.history);
  const W = 300;
  const H = 70;
  const pts = history.slice(-40);
  const line = (key: 'happiness' | 'stability', color: string) => {
    const d = pts
      .map((p, i) => {
        const x = (i / Math.max(1, pts.length - 1)) * W;
        const y = H - (p[key] / 100) * H;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return <path d={d} fill="none" stroke={color} strokeWidth={2} />;
  };

  return (
    <div className="section">
      <h3>Tu gobierno turno a turno</h3>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#1e293f" strokeWidth={1} />
        {line('happiness', '#37c98a')}
        {line('stability', '#4f7cff')}
      </svg>
      <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
        <span className="good">— felicidad</span>
        <span style={{ color: '#4f7cff' }}>— estabilidad</span>
      </div>
    </div>
  );
}
