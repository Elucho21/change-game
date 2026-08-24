'use client';

import { useGame } from '@/lib/store';
import { monthsToElection, needsSuccessor, oppositionCostFactor } from '@/lib/politics';
import { systemOf } from '@/lib/electoral';
import { damagedSectors, taxEffects } from '@/lib/engine';
import { goldCapitalCost, goldFiscalDelta, plannedTaxRate, rateCost, type GoldOrder, type RateOrder } from '@/lib/orders';
import { oppositionSplit } from '@/lib/politics';
import { confidenceLabel, RATE_MAX, RATE_MIN, RATE_STEP } from '@/lib/centralBank';
import Collapsible from './Collapsible';

const GOLD_STEP = 5;

/**
 * Panel de gobierno: mandato, oposicion, encuesta y politica impositiva.
 * Todo lo que se muestra lo calcula el motor; aca solo se dibuja.
 */
export default function GovernmentPanel() {
  const { countries, playerCode, politics, turn, capital, taxBase, active, world, centralBank } = useGame();
  const planTaxChange = useGame((s) => s.planTaxChange);
  const planGoldOrder = useGame((s) => s.planGoldOrder);
  const planRateChange = useGame((s) => s.planRateChange);
  const orders = useGame((s) => s.orders);
  const currentPoll = useGame((s) => s.currentPoll);

  const country = countries[playerCode];
  const votes = currentPoll();
  const meses = monthsToElection(politics, turn);
  const sys = systemOf(playerCode);
  const honeymoonLeft = Math.max(0, (politics.honeymoonUntil ?? 0) - turn + 1);
  const fx = taxEffects(country, taxBase[playerCode]);
  const costFactor = oppositionCostFactor(politics.opposition);
  const danados = damagedSectors(country);

  const TAXES: { kind: 'iva' | 'corporate' | 'income'; label: string; value: number; hint: string }[] = [
    { kind: 'iva', label: 'IVA', value: country.economy.tax_iva, hint: 'Recauda facil, empuja precios y castiga a los que menos tienen.' },
    { kind: 'corporate', label: 'Empresas', value: country.economy.tax_corporate, hint: 'Financia el Estado y frena la inversion.' },
    { kind: 'income', label: 'Ingresos', value: country.economy.tax_income_avg, hint: 'Recauda sin inflacionar; lo siente la clase media.' }
  ];

  return (
    <div>
      <Collapsible title="Mandato">
        <div className="row"><span>Partido</span><b>{politics.partyName}</b></div>
        <div className="row"><span>Gobierna</span><b>{politics.leaderName}</b></div>
        <div className="row"><span>Sistema</span><b>{sys.label}</b></div>
        <div className="row">
          <span>Mandato</span>
          <b>{politics.consecutiveTerms} de {politics.maxConsecutive} consecutivos · {Math.round(sys.termMonths / 12)} anios</b>
        </div>
        <div className="row">
          <span>Proximas elecciones</span>
          <b className={meses <= 6 ? 'warn' : ''}>
            {politics.pendingBallotage
              ? 'ballotage este mes'
              : meses === 0 ? 'ahora' : `en ${meses} ${meses === 1 ? 'mes' : 'meses'}`}
          </b>
        </div>
        {sys.midtermMonths > 0 && (
          <div className="row">
            <span>Medio termino</span>
            <b>
              {Math.max(0, sys.midtermMonths - (turn - politics.termStart))} meses
            </b>
          </div>
        )}
        <div className="row"><span>Elecciones ganadas</span><b>{politics.electionsWon}</b></div>
        {honeymoonLeft > 0 && (
          <p className="good" style={{ fontSize: 11.5, margin: '6px 0 0' }}>
            Primeros 100 dias: capital pasivo x2 durante {honeymoonLeft} mes{honeymoonLeft === 1 ? '' : 'es'}.
          </p>
        )}
        {needsSuccessor(politics) && (
          <p className="warn" style={{ fontSize: 11.5, margin: '6px 0 0' }}>
            Es tu ultimo mandato: al terminar vas a tener que elegir sucesor para que el partido siga.
          </p>
        )}
      </Collapsible>

      <Collapsible title="Intencion de voto">
        <div className="row">
          <span>Si las elecciones fueran hoy</span>
          <b className={votes > 50 ? 'good' : 'bad'}>{votes}%</b>
        </div>
        <div className="bar">
          <div style={{ width: `${votes}%`, background: votes > 50 ? 'var(--good)' : 'var(--bad)' }} />
        </div>
        {politics.pollHistory && politics.pollHistory.length > 1 && (
          <PollChart history={politics.pollHistory} />
        )}
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          {sys.bar}. {sys.notes}
        </p>
      </Collapsible>

      <Collapsible title="Oposicion">
        <div className="row">
          <span>Fuerza total</span>
          <b className={politics.opposition > 60 ? 'bad' : politics.opposition < 35 ? 'good' : 'warn'}>
            {politics.opposition}
          </b>
        </div>
        <div className="bar">
          <div style={{ width: `${politics.opposition}%`, background: 'var(--bad)' }} />
        </div>

        {politics.oppositionParties && (() => {
          const [partyA, partyB] = politics.oppositionParties;
          const [shareA, shareB] = oppositionSplit(politics.opposition);
          return (
            <div style={{ marginTop: 8 }}>
              <div className="row"><span>{partyA}</span><b>{shareA}</b></div>
              <div className="row"><span>{partyB}</span><b>{shareB}</b></div>
            </div>
          );
        })()}

        <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
          Cada decision te cuesta <b className={costFactor > 1 ? 'bad' : 'good'}>{costFactor}x</b> capital politico.
          {politics.opposition > 60 && ' Con esta oposicion, gobernar se vuelve caro: convoca al dialogo o mejora el humor social.'}
          {' '}A 3 meses de la eleccion podes ofrecerle una coalicion a alguno de los dos, y a 1 mes elegis tu discurso de cierre.
        </p>
      </Collapsible>

      <Collapsible title="Politica impositiva">
        {TAXES.map((t) => {
          const planeado = plannedTaxRate(orders, t.kind, country);
          return (
            <div key={t.kind} style={{ marginBottom: 10 }}>
              <div className="row">
                <span>{t.label}</span>
                <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <button
                    onClick={() => planTaxChange(t.kind, -2)}
                    disabled={capital < 5 || t.value <= 0}
                    title="Bajar 2 puntos en el plan"
                  >−</button>
                  <b style={{ minWidth: 44, textAlign: 'center' }}>
                    {t.value}%
                    {planeado !== null && planeado !== t.value && (
                      <span className="warn"> → {planeado}%</span>
                    )}
                  </b>
                  <button onClick={() => planTaxChange(t.kind, 2)} disabled={capital < 5} title="Subir 2 puntos en el plan">+</button>
                </span>
              </div>
              <small className="muted" style={{ fontSize: 11, lineHeight: 1.35 }}>{t.hint}</small>
            </div>
          );
        })}

        <p className="muted" style={{ fontSize: 11, marginTop: -2 }}>
          Los cambios quedan en el plan del turno y se aplican al avanzar el mes. Si subis y
          despues bajas la misma alicuota, se cancelan solos y no queda nada en el historial.
        </p>

        <div className="card" style={{ marginTop: 4 }}>
          <h4 style={{ fontSize: 12 }}>Contra la estructura con la que arrancaste</h4>
          <div className="row"><span>Recaudacion</span><b className={fx.fiscal >= 0 ? 'good' : 'bad'}>{fx.fiscal >= 0 ? '+' : ''}{fx.fiscal} del PBI</b></div>
          <div className="row"><span>Inflacion</span><b className={fx.inflation > 0 ? 'bad' : 'good'}>{fx.inflation >= 0 ? '+' : ''}{fx.inflation}/turno</b></div>
          <div className="row"><span>Crecimiento</span><b className={fx.growth >= 0 ? 'good' : 'bad'}>{fx.growth >= 0 ? '+' : ''}{fx.growth}</b></div>
          <div className="row"><span>Humor social</span><b className={fx.happiness >= 0 ? 'good' : 'bad'}>{fx.happiness >= 0 ? '+' : ''}{fx.happiness}/turno</b></div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <span>Balance fiscal actual</span>
          <b className={country.economy.fiscal_balance >= 0 ? 'good' : 'warn'}>{country.economy.fiscal_balance}%</b>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
          {country.economy.fiscal_balance >= 0
            ? 'En superavit: la deuda esta bajando.'
            : `Mientras el balance fiscal siga negativo, la deuda sigue subiendo aunque mejores el numero — necesitas
               llegar a 0% para frenarla del todo. Hoy la deuda esta en ${country.economy.debt_to_gdp}%${
              country.economy.debt_to_gdp > 110 ? ', y arriba de 110% del PBI resta humor social todos los meses por si sola.' : '.'
            }`}
        </p>
      </Collapsible>

      <Collapsible title="Banco Central">
        <div className="row">
          <span>Reservas de oro</span>
          <b>{country.economy.gold_reserves_tonnes} t</b>
        </div>
        <div className="row">
          <span>Precio internacional</span>
          <b>${world.gold_price}/oz</b>
        </div>

        {(() => {
          const goldOrder = orders.find((o): o is GoldOrder => o.kind === 'gold');
          const planned = goldOrder
            ? goldOrder.action === 'comprar'
              ? country.economy.gold_reserves_tonnes + goldOrder.tonnes
              : country.economy.gold_reserves_tonnes - goldOrder.tonnes
            : null;
          return (
            <div className="row">
              <span>Plan del turno</span>
              <b className={goldOrder ? (goldOrder.action === 'comprar' ? 'good' : 'warn') : 'muted'}>
                {goldOrder ? `${goldOrder.label} → ${planned} t` : 'nada planeado'}
              </b>
            </div>
          );
        })()}

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={() => planGoldOrder('comprar', GOLD_STEP)}
            disabled={capital < goldCapitalCost('comprar', GOLD_STEP)}
            title={`Costo estimado: ${goldCapitalCost('comprar', GOLD_STEP)} cap., balance fiscal ${goldFiscalDelta('comprar', GOLD_STEP)}`}
          >
            🪙 Comprar {GOLD_STEP} t
          </button>
          <button
            onClick={() => planGoldOrder('vender', GOLD_STEP)}
            disabled={country.economy.gold_reserves_tonnes < GOLD_STEP || capital < goldCapitalCost('vender', GOLD_STEP)}
            title={`Costo estimado: ${goldCapitalCost('vender', GOLD_STEP)} cap., balance fiscal +${goldFiscalDelta('vender', GOLD_STEP)}`}
          >
            💰 Vender {GOLD_STEP} t
          </button>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
          Comprar oro cuesta caja pero mejora el tipo de cambio (mas reservas, menos presion). Vender oro
          entra caja al balance fiscal de inmediato (menos que lo que cuesta comprar: hay diferencia entre
          precio de compra y venta), util para tapar un bache o financiar un plan sin subir impuestos.
        </p>

        <div className="row" style={{ marginTop: 10 }}>
          <span>Tasa de politica</span>
          <b>{centralBank.rate}%</b>
        </div>
        <div className="row">
          <span>Confianza</span>
          <b className={centralBank.confidence < 40 ? 'bad' : centralBank.confidence > 65 ? 'good' : 'warn'}>
            {centralBank.confidence}/100 · {confidenceLabel(centralBank.confidence)}
          </b>
        </div>

        {(() => {
          const rateOrder = orders.find((o): o is RateOrder => o.kind === 'rate');
          const planned = rateOrder ? centralBank.rate + rateOrder.delta : null;
          return (
            <div className="row">
              <span>Plan del turno</span>
              <b className={rateOrder ? (rateOrder.delta > 0 ? 'warn' : 'good') : 'muted'}>
                {rateOrder ? `${rateOrder.label} → ${planned}%` : 'nada planeado'}
              </b>
            </div>
          );
        })()}

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={() => planRateChange(-RATE_STEP)}
            disabled={capital < rateCost(RATE_STEP) || centralBank.rate <= RATE_MIN}
            title={`Costo estimado: ${rateCost(RATE_STEP)} cap.`}
          >
            🏦⬇️ Bajar {RATE_STEP}pt
          </button>
          <button
            onClick={() => planRateChange(RATE_STEP)}
            disabled={capital < rateCost(RATE_STEP) || centralBank.rate >= RATE_MAX}
            title={`Costo estimado: ${rateCost(RATE_STEP)} cap.`}
          >
            🏦⬆️ Subir {RATE_STEP}pt
          </button>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
          Subir la tasa ancla la inflacion y frena la depreciacion, a costa de crecimiento; bajarla hace lo
          contrario. Pega desde el mes que viene, no de inmediato. La Confianza es informativa por ahora.
        </p>
      </Collapsible>

      {(danados.length > 0 || active.length > 0) && (
        <Collapsible title="Situacion">
          {active.map((a) => (
            <div className="row" key={a.key}>
              <span>{a.event.emoji} {a.event.title}</span>
              <b className="warn">{a.turnsLeft} {a.turnsLeft === 1 ? 'mes' : 'meses'}</b>
            </div>
          ))}
          {danados.map((d) => (
            <div key={d.sector}>
              <div className="row">
                <span>Sector {d.sector} ({d.weight}% del PBI)</span>
                <b className="bad">{d.health}%</b>
              </div>
              <div className="bar"><div style={{ width: `${d.health}%`, background: 'var(--bad)' }} /></div>
            </div>
          ))}
        </Collapsible>
      )}
    </div>
  );
}

/**
 * La encuesta mes a mes. La linea punteada es el umbral que define la
 * eleccion: por encima ganas, por debajo perdes.
 */
function PollChart({ history }: { history: { turn: number; value: number }[] }) {
  const W = 300;
  const H = 64;
  const pts = history.slice(-48);
  if (pts.length < 2) return null;

  const d = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - (p.value / 100) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const ultimo = pts[pts.length - 1].value;
  const primero = pts[0].value;

  return (
    <div style={{ marginTop: 8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#e5484d" strokeWidth={1} strokeDasharray="4 3" />
        <path d={d} fill="none" stroke={ultimo > 50 ? '#37c98a' : '#f0a742'} strokeWidth={2} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
        <span className="muted">hace {pts.length} meses: {primero}%</span>
        <span className="muted">linea roja: 50%</span>
        <span className={ultimo > 50 ? 'good' : 'warn'}>hoy: {ultimo}%</span>
      </div>
    </div>
  );
}
