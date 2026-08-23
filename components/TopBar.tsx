'use client';

import { useEffect, useRef, useState } from 'react';
import { dateLabel, useGame } from '@/lib/store';
import { exportSave } from '@/lib/persistence';
import type { HistoryPoint } from '@/lib/store';
import { monthsToElection } from '@/lib/politics';

/**
 * Barra de indicadores. Cada KPI abre, al pasar el mouse, la evolucion de los
 * ultimos meses: el numero de hoy dice poco si no se ve de donde viene.
 */

type MetricKey = keyof Omit<HistoryPoint, 'turn'>;

/** Metricas donde subir es malo, para pintar la linea del color correcto. */
const BAD_UP: MetricKey[] = ['inflation', 'unemployment', 'debt', 'opposition', 'tension', 'oil', 'fx'];

/**
 * Explicacion de "por que" detras de cada numero. No son solo datos: son la
 * relacion entre metricas que el jugador no ve en ningun otro lado. La mas
 * importante es deuda/fiscal: mejorar el balance fiscal sin llegar a 0 sigue
 * dejando que la deuda suba (mas lento, pero sube), y eso se siente como que
 * "se pierde lo conseguido" cuando en realidad el balance fiscal no se movio.
 */
function statInsight(
  metric: MetricKey,
  ctx: { fiscal: number; debt: number; opposition: number; happiness: number }
): string | null {
  switch (metric) {
    case 'debt':
      if (ctx.fiscal >= 0) return 'Balance fiscal en positivo: la deuda ya deberia estar bajando.';
      return `Sube mientras el balance fiscal sea negativo (ahora ${ctx.fiscal}%), aunque haya mejorado. `
        + 'Para que empiece a bajar hace falta llegar a 0% o mas, no solo mejorar.'
        + (ctx.debt > 110 ? ' Ademas, arriba de 110% del PBI la deuda resta humor social todos los meses.' : '');
    case 'fiscal':
      return ctx.fiscal >= 0
        ? 'En superavit: cada mes que se sostiene, la deuda baja.'
        : 'Mientras sea negativo la deuda sigue subiendo, aunque el numero haya mejorado. El objetivo real es cruzar a 0.';
    case 'happiness':
      return ctx.debt > 110
        ? 'Ademas de inflacion, desempleo y crecimiento, una deuda arriba de 110% del PBI resta humor social todos los meses por si sola.'
        : null;
    case 'opposition':
      return ctx.opposition > 60
        ? 'Con oposicion alta, las decisiones grandes cuestan mas capital politico (ver Gobierno).'
        : null;
    default:
      return null;
  }
}

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
  label, value, tone, metric, history, insight
}: {
  label: string;
  value: string;
  tone?: string;
  metric?: MetricKey;
  history?: HistoryPoint[];
  insight?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const puedeExpandir = !!metric && !!history;
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (ev: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  // flash breve cuando el numero cambia: asi ejecutar el turno se siente
  // como que algo paso de verdad, no solo un texto que cambia sin mas.
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="stat" style={{ position: 'relative' }} ref={wrapRef}>
      <button
        type="button"
        className="stat-trigger"
        disabled={!puedeExpandir}
        onClick={() => setOpen((o) => !o)}
        title={puedeExpandir ? (open ? 'Ver menos' : 'Ver evolucion y detalle') : undefined}
      >
        <b className={`${tone ?? ''}${flash ? ' stat-flash' : ''}`}>{value}</b>
        <span>{label}{puedeExpandir ? (open ? ' ▲' : ' ▾') : ''}</span>
      </button>
      {open && metric && history && (
        <div className="stat-pop">
          <div className="stat-pop-title">{label}</div>
          <Sparkline points={history} metric={metric} />
          {insight && <p className="muted stat-pop-insight">{insight}</p>}
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
  const insightCtx = {
    fiscal: e.fiscal_balance, debt: e.debt_to_gdp, opposition: politics.opposition, happiness: p.population.happiness
  };

  // endTurn es sincronico (no hay ningun await de por medio), asi que dos
  // clicks rapidos no compiten por el mismo estado: cada uno se procesa
  // entero antes del siguiente. El problema es otro: un doble click sin
  // querer avanza dos meses de una sin que el jugador lo pida. Se bloquea
  // el boton un instante despues de cada click para que eso no pase.
  const [busy, setBusy] = useState(false);
  const handleEndTurn = () => {
    if (busy) return;
    setBusy(true);
    endTurn();
    setTimeout(() => setBusy(false), 350);
  };

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
          tone={p.population.happiness < 40 ? 'bad' : p.population.happiness > 65 ? 'good' : ''}
          insight={statInsight('happiness', insightCtx)} />
        <Stat label="Estabilidad" value={`${p.population.stability}`} metric="stability" history={history}
          tone={p.population.stability < 40 ? 'bad' : p.population.stability > 65 ? 'good' : ''} />
        <Stat label="Crecimiento" value={`${e.gdp_growth}%`} metric="growth" history={history}
          tone={e.gdp_growth < 0 ? 'bad' : 'good'} />
        <Stat label="Inflacion" value={`${e.inflation}%`} metric="inflation" history={history}
          tone={e.inflation > 25 ? 'bad' : e.inflation > 10 ? 'warn' : 'good'} />
        <Stat label="Desempleo" value={`${e.unemployment}%`} metric="unemployment" history={history}
          tone={e.unemployment > 10 ? 'bad' : ''} />
        <Stat label="Fiscal" value={`${e.fiscal_balance}%`} metric="fiscal" history={history}
          tone={e.fiscal_balance < -3 ? 'bad' : e.fiscal_balance > 0 ? 'good' : 'warn'}
          insight={statInsight('fiscal', insightCtx)} />
        <Stat label="Deuda/PBI" value={`${e.debt_to_gdp}%`} metric="debt" history={history}
          tone={e.debt_to_gdp > 90 ? 'bad' : ''}
          insight={statInsight('debt', insightCtx)} />
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
          tone={politics.opposition > 60 ? 'bad' : politics.opposition < 35 ? 'good' : ''}
          insight={statInsight('opposition', insightCtx)} />
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
        <button onClick={() => exportSave()} title="Descarga la partida como archivo .json (no se pierde aunque se borre el navegador)">
          💾
        </button>
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
          onClick={handleEndTurn}
          disabled={busy}
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
