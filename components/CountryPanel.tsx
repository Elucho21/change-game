'use client';

import { getRelation, relLabel, useGame } from '@/lib/store';
import { REL_COLORS } from '@/lib/engine';
import { partnersOf, totalTrade, type TradeContext } from '@/lib/trade';
import { DECISIONS } from '@/lib/decisions';
import { previewDelta } from '@/lib/engine';

function Meter({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = pct > 65 ? 'var(--good)' : pct > 40 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="row"><span>{label}</span><b>{value}</b></div>
      <div className="bar"><div style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

/** Acciones bilaterales disponibles contra el pais seleccionado. */
const BILATERAL = DECISIONS.filter((d) => d.needsTarget);

/** Los mismos efectos que aplicara el motor, escalados por el tamano del socio. */
const SCALABLE = ['gdp_growth', 'inflation', 'unemployment', 'fiscal_balance', 'happiness'] as const;

function scaledEffectsOf(d: (typeof DECISIONS)[number], size: number) {
  const out = { ...d.effects };
  for (const k of SCALABLE) {
    const v = d.effects[k];
    if (v === undefined) continue;
    out[k] = Math.round(v * size * 100) / 100;
  }
  return out;
}

export default function CountryPanel() {
  const {
    countries, relations, blocs, playerCode, selected, capital, sanctions,
    disruptions, turn, tradeBase
  } = useGame();
  const plan = useGame((s) => s.planDecision);
  const available = useGame((s) => s.availableCapital)();
  const quoteDecision = useGame((s) => s.quoteDecision);
  const orders = useGame((s) => s.orders);
  const code = selected ?? playerCode;
  const c = countries[code];
  if (!c) return null;

  const tradeCtx: TradeContext = {
    countries, relations, blocs, sanctions, playerCode, disruptions, turn
  };
  const partners = partnersOf(code, tradeCtx).slice(0, 6);
  const total = totalTrade(code, tradeCtx);
  const base = tradeBase[code];
  const tradeDelta = base ? ((total / base - 1) * 100) : 0;

  const isPlayer = code === playerCode;
  const rel = getRelation(relations, playerCode, code);
  const label = relLabel(rel);
  const memberships = blocs.filter((b) => b.members.includes(code));

  return (
    <div>
      <div className="section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 30 }}>{c.flag}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{c.name}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{c.capital} · {c.region}</div>
          </div>
        </div>

        {!isPlayer && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="pill" style={{ color: REL_COLORS[label], borderColor: REL_COLORS[label] }}>
              {label} ({rel})
            </span>
            {sanctions.includes(code) && <span className="pill bad">sancionado</span>}
          </div>
        )}

        <Meter label="Felicidad" value={c.population.happiness} />
        <Meter label="Estabilidad" value={c.population.stability} />

        <div className="row"><span>PBI</span><b>{c.economy.gdp_trillion_usd} T USD</b></div>
        <div className="row"><span>Crecimiento</span><b className={c.economy.gdp_growth < 0 ? 'bad' : 'good'}>{c.economy.gdp_growth}%</b></div>
        <div className="row"><span>Inflacion</span><b className={c.economy.inflation > 25 ? 'bad' : ''}>{c.economy.inflation}%</b></div>
        <div className="row"><span>Desempleo</span><b>{c.economy.unemployment}%</b></div>
        <div className="row"><span>Deuda / PBI</span><b>{c.economy.debt_to_gdp}%</b></div>
        <div className="row"><span>Balance fiscal</span><b className={c.economy.fiscal_balance < 0 ? 'bad' : 'good'}>{c.economy.fiscal_balance}%</b></div>
        <div className="row"><span>Reservas de oro</span><b>{c.economy.gold_reserves_tonnes} t</b></div>
        <div className="row"><span>Poblacion</span><b>{c.population.total_millions} M</b></div>
      </div>

      <div className="section">
        <h3>Comercio</h3>
        <div className="row">
          <span>Intercambio total</span>
          <b>{Math.round(total)} mil M USD</b>
        </div>
        {base ? (
          <div className="row">
            <span>Contra el inicio de la partida</span>
            <b className={tradeDelta < -1 ? 'bad' : tradeDelta > 1 ? 'good' : ''}>
              {tradeDelta > 0 ? '+' : ''}{tradeDelta.toFixed(1)}%
            </b>
          </div>
        ) : null}
        <p className="muted" style={{ fontSize: 11, margin: '6px 0 4px' }}>Socios principales</p>
        {partners.map((f) => (
          <div className="row" key={f.to}>
            <span>{countries[f.to].flag} {countries[f.to].name}{f.sanctioned ? ' (sancionado)' : ''}</span>
            <b className={f.sanctioned ? 'bad' : ''}>{Math.round(f.volume)}</b>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>Militar</h3>
        <div className="row"><span>Presupuesto</span><b>{c.military.military_budget_bn} B USD</b></div>
        <div className="row"><span>Efectivos</span><b>{c.military.active_soldiers.toLocaleString('es')}</b></div>
        <div className="row"><span>Aviones / tanques</span><b>{c.military.aircraft} / {c.military.tanks}</b></div>
        <div className="row"><span>Submarinos / buques</span><b>{c.military.submarines} / {c.military.naval_ships}</b></div>
        <div className="row"><span>Ojivas nucleares</span><b className={c.military.nuclear_warheads > 0 ? 'warn' : ''}>{c.military.nuclear_warheads}</b></div>
      </div>

      <div className="section">
        <h3>Perfil</h3>
        <div className="row"><span>Ideologia</span><b>{c.traits.ideology}</b></div>
        <div className="row"><span>Agresividad</span><b>{c.traits.aggression}</b></div>
        <div className="row"><span>Tolerancia al riesgo</span><b>{c.traits.risk_tolerance}</b></div>
        <div className="row"><span>Doctrina nuclear</span><b>{c.traits.nuclear_doctrine}</b></div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
          Prioridades: {c.traits.priorities.join(', ')}
        </p>
      </div>

      <div className="section">
        <h3>Bloques</h3>
        {memberships.length === 0 && <p className="muted" style={{ fontSize: 12 }}>Sin membresias.</p>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {memberships.map((b) => (
            <span key={b.id} className="pill" style={{ borderColor: b.color, color: b.color }}>
              {b.short} · {b.cohesion}
            </span>
          ))}
        </div>
      </div>

      {!isPlayer && (
        <div className="section">
          <h3>Acciones bilaterales</h3>
          <p className="muted" style={{ fontSize: 11, margin: '-4px 0 8px', lineHeight: 1.45 }}>
            El precio y el resultado dependen de con quien negocies: el tamano de su economia
            frente a la tuya y como viene la relacion.
          </p>

          {BILATERAL.map((d) => {
            const quote = quoteDecision(d.id, code);
            const cost = quote?.cost ?? d.cost.capital;
            const enfriando = (quote?.cooldown ?? 0) > 0;
            const afford = available >= cost;
            const yaEnPlan = orders.some((o) => o.kind === 'decision' && o.id === d.id && o.target === code);

            return (
              <button
                key={d.id}
                className={`decision${yaEnPlan ? ' planned' : ''}`}
                disabled={!afford || enfriando}
                onClick={() => plan(d.id, code)}
                title={
                  enfriando ? `Ya lo hiciste hace poco: disponible en ${quote?.cooldown} meses`
                    : afford ? 'Queda en el plan del turno' : 'Capital politico insuficiente'
                }
              >
                <strong>
                  {d.emoji} {d.label}{yaEnPlan ? ' ✓' : ''}{' '}
                  <span className={cost > d.cost.capital ? 'warn' : cost < d.cost.capital ? 'good' : 'muted'}>
                    ({cost} cap.{cost !== d.cost.capital ? ` en vez de ${d.cost.capital}` : ''})
                  </span>
                </strong>
                <small>{d.detail}</small>
                {enfriando && (
                  <small className="warn">En enfriamiento: disponible en {quote?.cooldown} meses.</small>
                )}
                <span className="preview">
                  {previewDelta(quote ? scaledEffectsOf(d, quote.size) : d.effects).map((p) => (
                    <em key={p.key} className={p.tone === 'bueno' ? 'good' : 'bad'}>
                      {p.label} {p.value > 0 ? '+' : ''}{p.value}
                    </em>
                  ))}
                  {d.relations?.map((r, i) => (
                    <em key={i} className={r.amount > 0 ? 'good' : 'bad'}>
                      Relacion {r.amount > 0 ? '+' : ''}{r.amount}
                    </em>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
