'use client';

import { useGame } from '@/lib/store';
import { classCompositionFromCountry, GROUP_BLURB, GROUP_KEYS, GROUP_LABEL } from '@/lib/popularGroups';
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

const toneFor = (v: number) => (v < 35 ? 'bad' : v < 50 ? 'warn' : 'good');

/**
 * Popularidad por sector (Change World Game v1.2): 5 grupos con intereses
 * distintos, capa PARALELA a la felicidad general (ver components/CountryPanel.tsx).
 * Solo lectura por ahora — todavia no hay decisiones que la muestren en su
 * propio preview mas alla de las que ya tocan `groupEffects`.
 */
export default function GroupsPanel() {
  const groups = useGame((s) => s.groups);
  const player = useGame((s) => s.countries[s.playerCode]);
  const comp = classCompositionFromCountry(player);

  return (
    <div>
      <div className="section">
        <h3>Popularidad por sector</h3>
        <p className="muted" style={{ fontSize: 11.5, lineHeight: 1.45 }}>
          Cada grupo le importa cosas distintas y pesa distinto en la eleccion. El peso poblacional
          es aproximado (PBI per capita y estructura economica) hasta que llegue el dato real por pais.
        </p>
      </div>

      {GROUP_KEYS.map((key) => {
        const value = groups[key];
        const weight = comp[key];
        return (
          <Collapsible title={`${GROUP_EMOJI[key]} ${GROUP_LABEL[key]}`} key={key}>
            <div className="row">
              <span>Humor del grupo</span>
              <b className={toneFor(value)}>{value}</b>
            </div>
            <div className="bar"><div style={{ width: `${value}%`, background: GROUP_COLOR[key] }} /></div>
            <div className="row" style={{ marginTop: 6 }}>
              <span>Peso en la poblacion</span>
              <b className="muted">~{weight}%</b>
            </div>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.45 }}>
              {GROUP_BLURB[key]}
            </p>
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
