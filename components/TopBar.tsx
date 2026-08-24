'use client';

import { useEffect, useRef, useState } from 'react';
import { dateLabel, useGame } from '@/lib/store';
import { exportSave } from '@/lib/persistence';
import type { HistoryPoint } from '@/lib/store';
import { monthsToElection } from '@/lib/politics';
import type { ActiveEvent } from '@/lib/types';

type MetricKey = keyof Omit<HistoryPoint, 'turn'>;

const BAD_UP: MetricKey[] = ['inflation', 'unemployment', 'debt', 'opposition', 'tension', 'oil', 'fx'];

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

function ActiveEvents({ active }: { active: ActiveEvent[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (ev: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (active.length === 0) return null;

  return (
    <div style={{ position: 'relative' }} ref={wrapRef}>
      <button
        type="button"
        className="pill warn"
        onClick={() => setOpen((o) => !o)}
        title="Ver eventos en curso"
      >
        🔥 {active.length} {active.length === 1 ? 'evento activo' : 'eventos activos'}{open ? ' ▲' : ' ▾'}
      </button>
      {open && (
        <div className="stat-pop" style={{ width: 280, right: 0, left: 'auto' }}>
          <div className="stat-pop-title">Eventos en curso</div>
          {active.map((a) => (
            <div className="row" key={a.key} style={{ alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 12.5 }}>{a.event.emoji} {a.event.title}</span>
              <b className="warn" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{a.turnsLeft}m</b>
            </div>
          ))}
          <p className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
            {active.length === 1
              ? active[0].event.description
              : 'Detalle completo en Gobierno → Situacion.'}
          </p>
        </div>
      )}
    </div>
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

export default function TopBar({ onGrok, turnFx = false }: { onGrok: () => void; turnFx?: boolean }) {
  const {
    countries, playerCode, turn, capital, world, pending, politics, active, orders, history, moral
  } = useGame();
  const endTurn = useGame((s) => s.endTurn);
  const newGame = useGame((s) => s.newGame);
  const p = countries[playerCode];
  const e = p.economy;
  const insightCtx = {
    fiscal: e.fiscal_balance, debt: e.debt_to_gdp, opposition: politics.opposition, happiness: p.population.happiness
  };

  const [busy, setBusy] = useState(false);
  const handleEndTurn = () => {
    if (busy || turnFx) return;
    setBusy(true);
    endTurn();
    setTimeout(() => setBusy(false), 900);
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

      <div className="topbar-stats">
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
        {moral.onboarded && (
          <>
            <Stat label="Corrupcion" value={`${moral.corruption}`}
              tone={moral.corruption > 55 ? 'bad' : moral.corruption > 35 ? 'warn' : 'good'} />
            <Stat label="Investigaciones" value={`${moral.investigacion}`}
              tone={moral.investigacion > 65 ? 'bad' : moral.investigacion > 25 ? 'warn' : 'good'} />
          </>
        )}
      </div>

      <ActiveEvents active={active} />

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
          className={`btn-primary${turnFx ? ' turn-btn-fx' : ''}`}
          onClick={handleEndTurn}
          disabled={busy || turnFx}
          title={orders.length ? 'Ejecuta el plan y avanza el mes' : 'Avanza el mes sin tomar decisiones'}
        >
          {turnFx || busy
            ? 'Resolviendo mes…'
            : orders.length
              ? `Ejecutar ${orders.length} y avanzar ▶`
              : pending.length
                ? `Avanzar mes (${pending.length} sin responder)`
                : 'Avanzar mes ▶'}
        </button>
      </div>
    </div>
  );
}
