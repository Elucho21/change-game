'use client';

import { useState } from 'react';
import { dateLabel, useGame } from '@/lib/store';
import type { HistoryPoint } from '@/lib/store';
import { monthsToElection } from '@/lib/politics';

/**
 * Barra de indicadores. Cada KPI abre, al pasar el mouse, la evolucion de los
 * ultimos meses: el numero de hoy dice poco si no se ve de donde viene.
 */

type MetricKey = keyof Omit<HistoryPoint, 'turn'>;

/** Metricas donde subir es malo, para pintar la linea del color correcto. */
const BAD_UP: MetricKey[] = ['inflation', 'unemployment', 'debt', 'opposition', 'tension', 'oil', 'fx'];

function Sparkline({ points, metric }: { points: HistoryPoint[]; metric: MetricKey }) {
  const pts = points.slice(-24);
  if (pts.length < 2) {
    return <div className="muted" style={{ fontSize: 11 }}>Todavia no hay historial. Avanza unos meses.</div>;
  }

  const values = pts.map((p) => p[metric] ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const W = 210;
  const H = 46;

  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / span) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const cambio = Math.round((values[values.length - 1] - values[0]) * 100) / 100;
  const mejora = BAD_UP.includes(metric) ? cambio < 0 : cambio > 0;
  const color = Math.abs(cambio) < 0.01 ? '#8a93a6' : mejora ? '#37c98a' : '#e5484d';

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <path d={d} fill="none" stroke={color} strokeWidth={2} />
      </svg>
      <div className="spark-foot">
        <span className="muted">ultimos {pts.length} meses</span>
        <span style={{ color }}>{cambio > 0 ? '+' : ''}{cambio}</span>
      </div>
      <div className="muted" style={{ fontSize: 10 }}>
        min {Math.round(min * 100) / 100} · max {Math.round(max * 100) / 100}
      </div>
    </>
  );
}

function Stat({
  label, value, tone, metric, history
}: {
  label: string;
  value: string;
  tone?: string;
  metric?: MetricKey;
  history?: HistoryPoint[];
}) {
  const [open, setOpen] = useState(false);
  const puedeGraficar = !!metric && !!history;

  return (
    <div
      className="stat"
      style={puedeGraficar ? { cursor: 'help', position: 'relative' } : undefined}
      onMouseEnter={() => puedeGraficar && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <b className={tone}>{value}</b>
      <span>{label}{puedeGraficar ? ' ·' : ''}</span>
      {open && metric && history && (
        <div className="stat-pop">
          <div className="stat-pop-title">{label}</div>
          <Sparkline points={history} metric={metric} />
        </div>
      )}
    </div>
  );
}

export default function TopBar({ onGrok }: { onGrok: () => void }) {
  const {
    countries, playerCode, turn, capital, world, pending, politics, active, orders, history
  } = useGame();
  const endTurn = useGame((s) => s.endTurn);
  const newGame = useGame((s) => s.newGame);
  const p = countries[playerCode];
  const e = p.economy;

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontSize: 24 }}>{p.flag}</span>
        <div className="stat">
          <b style={{ fontSize: 16 }}>{p.name}</b>
          <span>turno {turn} · {dateLabel(world)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', flex: 1 }}>
        <Stat label="Capital politico" value={`${Math.round(capital)}`} metric="capital" history={history}
          tone={capital < 20 ? 'bad' : capital > 60 ? 'good' : 'warn'} />
        <Stat label="Felicidad" value={`${p.population.happiness}`} metric="happiness" history={history}
          tone={p.population.happiness < 40 ? 'bad' : p.population.happiness > 65 ? 'good' : ''} />
        <Stat label="Estabilidad" value={`${p.population.stability}`} metric="stability" history={history}
          tone={p.population.stability < 40 ? 'bad' : p.population.stability > 65 ? 'good' : ''} />
        <Stat label="Crecimiento" value={`${e.gdp_growth}%`} metric="growth" history={history}
          tone={e.gdp_growth < 0 ? 'bad' : 'good'} />
        <Stat label="Inflacion" value={`${e.inflation}%`} metric="inflation" history={history}
          tone={e.inflation > 25 ? 'bad' : e.inflation > 10 ? 'warn' : 'good'} />
        <Stat label="Desempleo" value={`${e.unemployment}%`} metric="unemployment" history={history}
          tone={e.unemployment > 10 ? 'bad' : ''} />
        <Stat label="Fiscal" value={`${e.fiscal_balance}%`} metric="fiscal" history={history}
          tone={e.fiscal_balance < -3 ? 'bad' : e.fiscal_balance > 0 ? 'good' : 'warn'} />
        <Stat label="Deuda/PBI" value={`${e.debt_to_gdp}%`} metric="debt" history={history}
          tone={e.debt_to_gdp > 90 ? 'bad' : ''} />
        <Stat
          label="Tipo de cambio"
          value={`${p.fx ?? 100}`}
          metric="fx"
          history={history}
          tone={(p.fx ?? 100) > 130 ? 'bad' : (p.fx ?? 100) > 110 ? 'warn' : ''}
        />
        <Stat label="Tension global" value={`${world.global_tension}`} metric="tension" history={history}
          tone={world.global_tension > 65 ? 'bad' : ''} />
        <Stat label="Petroleo" value={`$${world.oil_price}`} metric="oil" history={history} />
        <Stat
          label="Elecciones"
          value={`${monthsToElection(politics, turn)} m`}
          tone={monthsToElection(politics, turn) <= 6 ? 'warn' : ''}
        />
        <Stat label="Oposicion" value={`${politics.opposition}`} metric="opposition" history={history}
          tone={politics.opposition > 60 ? 'bad' : politics.opposition < 35 ? 'good' : ''} />
      </div>

      {active.length > 0 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {active.map((a) => (
            <span className="pill warn" key={a.key} title={a.event.description}>
              {a.event.emoji} {a.event.title} · {a.turnsLeft}m
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onGrok} title="Genera el prompt del turno para pegar en Grok">🤖 Grok</button>
        <button
          onClick={() => {
            if (confirm('Se borra la partida guardada y volves a elegir pais. Seguro?')) newGame();
          }}
          title="Nueva partida (borra el guardado)"
        >
          ↺ Nueva
        </button>
        <button
          className="btn-primary"
          onClick={endTurn}
          title={orders.length ? 'Ejecuta el plan y avanza el mes' : 'Avanza el mes sin tomar decisiones'}
        >
          {orders.length
            ? `Ejecutar ${orders.length} y avanzar ▶`
            : pending.length ? `Avanzar mes (${pending.length} sin responder)` : 'Avanzar mes ▶'}
        </button>
      </div>
    </div>
  );
}
