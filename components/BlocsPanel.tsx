'use client';

import { canJoin, useGame } from '@/lib/store';
import { blocEffects } from '@/lib/engine';

const TYPE_LABEL: Record<string, string> = {
  militar: 'Alianza militar',
  aduanera: 'Union aduanera',
  economica: 'Bloque economico',
  politica: 'Foro politico'
};

export default function BlocsPanel() {
  const { blocs, playerCode, countries, relations, capitalDiplomatico } = useGame();
  const join = useGame((s) => s.planJoinBloc);
  const leave = useGame((s) => s.planLeaveBloc);
  const summit = useGame((s) => s.planSummit);
  const orders = useGame((s) => s.orders);
  const available = useGame((s) => s.availableCapitalDiplomatico)();

  const fx = blocEffects(blocs, playerCode);

  return (
    <div>
      <div className="section">
        <h3>Tu integracion en el mundo</h3>
        <div className="row"><span>Bonus de comercio</span><b className="good">+{fx.tradeBonus.toFixed(2)}% crecimiento</b></div>
        <div className="row"><span>Paraguas de seguridad</span><b>{fx.securityBonus.toFixed(0)}</b></div>
        <div className="row"><span>Ancla de inflacion</span><b>{fx.inflationDrag.toFixed(2)}</b></div>
        <div className="row"><span>Arancel externo comun</span><b>{fx.externalTariff ? `${fx.externalTariff}%` : 'propio'}</b></div>
      </div>

      {blocs.map((b) => {
        const isMember = b.members.includes(playerCode);
        const check = canJoin(b, playerCode, relations, capitalDiplomatico);
        return (
          <div className="section" key={b.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: b.color, display: 'inline-block' }} />
              <b style={{ fontSize: 14 }}>{b.short}</b>
              <span className="pill">{TYPE_LABEL[b.type]}</span>
              {isMember && <span className="pill good">miembro</span>}
            </div>

            <p className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, margin: '0 0 8px' }}>{b.description}</p>

            <div className="row"><span>Cohesion</span><b>{b.cohesion}</b></div>
            <div className="bar"><div style={{ width: `${b.cohesion}%`, background: b.color }} /></div>

            <p className="muted" style={{ fontSize: 11.5, margin: '8px 0 4px' }}>
              Miembros: {b.members.map((m) => countries[m]?.flag ?? m).join(' ')}
            </p>

            <ul style={{ margin: '6px 0 8px', paddingLeft: 16, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              {b.rules.map((r, i) => <li key={i}>{r}</li>)}
            </ul>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {isMember ? (
                <>
                  <button onClick={() => summit(b.id)} disabled={available < 10}>🏛️ Cumbre al plan (10 cap. diplomatico)</button>
                  <button onClick={() => leave(b.id)} disabled={available < 15}>🚪 Salir, al plan (15 cap. diplomatico)</button>
                </>
              ) : (
                <button onClick={() => join(b.id)} disabled={!check.ok} title={check.reason}>
                  🤝 Pedir ingreso, al plan
                </button>
              )}
              {orders.some((o) => o.kind === 'bloc' && o.blocId === b.id) && (
                <span className="pill warn">en el plan</span>
              )}
            </div>
            {!isMember && <p className="muted" style={{ fontSize: 11, marginTop: 5 }}>{check.reason}</p>}
          </div>
        );
      })}
    </div>
  );
}
