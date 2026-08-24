'use client';

import {
  classCompositionFromCountry, GROUP_BLURB, GROUP_CRISIS_THRESHOLD, GROUP_KEYS, GROUP_LABEL
} from '@/lib/popularGroups';
import { useGame, type HistoryPoint } from '@/lib/store';
import type { GroupKey } from '@/lib/types';
import Collapsible from './Collapsible';

const GROUP_EMOJI: Record<GroupKey, string> = {
  empresarios: '💼',
  claseMedia: '🏠',
  obrera: '🔧',
  alta: '🎩',
  fieles: '🚩'
};

const GROUP_COLOR: Record<GroupKey, string> = {
  empresarios: '#4f7cff',
  claseMedia: '#37c98a',
  obrera: '#f0a742',
  alta: '#e5484d',
  fieles: '#a78bfa'
};

/** Campo de HistoryPoint que guarda el snapshot mensual de cada grupo (lib/store.ts). */
const GROUP_HISTORY_KEY: Record<GroupKey, keyof HistoryPoint> = {
  empresarios: 'groupEmpresarios',
  claseMedia: 'groupClaseMedia',
  obrera: 'groupObrera',
  alta: 'groupAlta',
  fieles: 'groupFieles'
};

const toneFor = (v: number) => (v < GROUP_CRISIS_THRESHOLD ? 'bad' : v < 50 ? 'warn' : 'good');

/**
 * Sparkline chica de un grupo, mismo criterio visual que la de TopBar.tsx
 * (no se reutiliza el componente porque ahi esta acoplado a `MetricKey`,
 * que no incluye los campos de grupo) pero mas compacta: vive adentro de un
 * `Collapsible` ya angosto, no en la barra superior.
 */
function GroupSparkline({ points, field, color }: { points: HistoryPoint[]; field: keyof HistoryPoint; color: string }) {
  const pts = points.filter((p) => p[field] !== undefined).slice(-24);
  if (pts.length < 2) return null;

  const values = pts.map((p) => (p[field] as number) ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const W = 180;
  const H = 32;

  const d = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / span) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

/** Flecha de tendencia: compara el valor de hace `span` meses contra el actual. */
function trendOf(points: HistoryPoint[], field: keyof HistoryPoint, current: number, span = 6) {
  const withField = points.filter((p) => p[field] !== undefined);
  if (withField.length < 2) return null;
  const past = withField[Math.max(0, withField.length - 1 - span)][field] as number;
  const delta = Math.round((current - past) * 10) / 10;
  if (Math.abs(delta) < 1) return { arrow: '→', tone: 'muted', delta };
  return delta > 0 ? { arrow: '↑', tone: 'good', delta } : { arrow: '↓', tone: 'bad', delta };
}

/**
 * Popularidad por sector (Change World Game v1.2): 5 grupos con intereses
 * distintos, capa PARALELA a la felicidad general (ver components/CountryPanel.tsx).
 *
 * Desde v1.4 dejo de ser solo lectura pasiva: `groupEffects` esta en ~40
 * decisiones y en los eventos nacionales grandes (antes 5 y 0), el feed narra
 * cualquier swing notable (no solo "empresarios contentos") y un grupo que
 * cae bajo `GROUP_CRISIS_THRESHOLD` gatilla una consecuencia dura mensual
 * (huelga, fuga de capitales, caida de inversion, cacerolazo — ver
 * `groupConsequences`, lib/popularGroups.ts). Este panel suma tendencia y
 * mini-historial para que el jugador vea hacia donde va cada grupo, no solo
 * el nivel de hoy.
 */
export default function GroupsPanel() {
  const groups = useGame((s) => s.groups);
  const player = useGame((s) => s.countries[s.playerCode]);
  const history = useGame((s) => s.history);
  const comp = classCompositionFromCountry(player);

  return (
    <div>
      <div className="section">
        <h3>Popularidad por sector</h3>
        <p className="muted" style={{ fontSize: 11.5, lineHeight: 1.45 }}>
          Cada grupo le importa cosas distintas y pesa distinto en la eleccion. El peso poblacional
          es aproximado (PBI per capita y estructura economica) hasta que llegue el dato real por pais.
          Por debajo de {GROUP_CRISIS_THRESHOLD} un grupo deja de ser paciente y actua por su cuenta.
        </p>
      </div>

      {GROUP_KEYS.map((key) => {
        const value = groups[key];
        const weight = comp[key];
        const field = GROUP_HISTORY_KEY[key];
        const trend = trendOf(history, field, value);
        const enCrisis = value < GROUP_CRISIS_THRESHOLD;
        return (
          <Collapsible title={`${GROUP_EMOJI[key]} ${GROUP_LABEL[key]}${enCrisis ? ' ⚠️' : ''}`} key={key}>
            <div className="row">
              <span>Humor del grupo</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {trend && (
                  <b className={trend.tone} title={`${trend.delta > 0 ? '+' : ''}${trend.delta} en los ultimos 6 meses`}>
                    {trend.arrow}
                  </b>
                )}
                <b className={toneFor(value)}>{value}</b>
              </span>
            </div>
            <div className="bar"><div style={{ width: `${value}%`, background: GROUP_COLOR[key] }} /></div>
            <div style={{ marginTop: 8 }}>
              <GroupSparkline points={history} field={field} color={GROUP_COLOR[key]} />
            </div>
            <div className="row" style={{ marginTop: 6 }}>
              <span>Peso en la poblacion</span>
              <b className="muted">~{weight}%</b>
            </div>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.45 }}>
              {GROUP_BLURB[key]}
            </p>
            {enCrisis && (
              <p className="bad" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.45 }}>
                Por debajo de {GROUP_CRISIS_THRESHOLD}: esta consecuencia se aplica todos los meses
                hasta que el grupo se recupere. Revisa el feed para el detalle.
              </p>
            )}
          </Collapsible>
        );
      })}

      <Collapsible title="Indice de desregulacion" defaultOpen={false}>
        <div className="row"><span>Indice</span><b>{Math.round(groups.deregulationIndex)}</b></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
          0-100, 50 = neutral. Sube con desregulacion y privatizaciones, baja con controles y
          estatizaciones. Deriva solo a neutral si nadie lo mueve. Empresarios y clase alta lo
          festejan cuando sube; la clase obrera, cuando baja.
        </p>
      </Collapsible>
    </div>
  );
}
