'use client';

import { dateLabel, useGame } from '@/lib/store';

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="stat">
      <b className={tone}>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export default function TopBar({ onGrok }: { onGrok: () => void }) {
  const { countries, playerCode, turn, capital, world, pending } = useGame();
  const endTurn = useGame((s) => s.endTurn);
  const reset = useGame((s) => s.reset);
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
        <Stat label="Capital politico" value={`${Math.round(capital)}`} tone={capital < 20 ? 'bad' : capital > 60 ? 'good' : 'warn'} />
        <Stat label="Felicidad" value={`${p.population.happiness}`} tone={p.population.happiness < 40 ? 'bad' : p.population.happiness > 65 ? 'good' : ''} />
        <Stat label="Estabilidad" value={`${p.population.stability}`} tone={p.population.stability < 40 ? 'bad' : p.population.stability > 65 ? 'good' : ''} />
        <Stat label="Crecimiento" value={`${e.gdp_growth}%`} tone={e.gdp_growth < 0 ? 'bad' : 'good'} />
        <Stat label="Inflacion" value={`${e.inflation}%`} tone={e.inflation > 25 ? 'bad' : e.inflation > 10 ? 'warn' : 'good'} />
        <Stat label="Desempleo" value={`${e.unemployment}%`} tone={e.unemployment > 10 ? 'bad' : ''} />
        <Stat label="Fiscal" value={`${e.fiscal_balance}%`} tone={e.fiscal_balance < -3 ? 'bad' : e.fiscal_balance > 0 ? 'good' : 'warn'} />
        <Stat label="Deuda/PBI" value={`${e.debt_to_gdp}%`} tone={e.debt_to_gdp > 90 ? 'bad' : ''} />
        <Stat label="Tension global" value={`${world.global_tension}`} tone={world.global_tension > 65 ? 'bad' : ''} />
        <Stat label="Petroleo" value={`$${world.oil_price}`} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onGrok} title="Genera el prompt del turno para pegar en Grok">🤖 Grok</button>
        <button onClick={reset} title="Volver a elegir pais">↺</button>
        <button className="btn-primary" onClick={endTurn}>
          {pending.length ? `Avanzar mes (${pending.length} sin resolver)` : 'Avanzar mes ▶'}
        </button>
      </div>
    </div>
  );
}
