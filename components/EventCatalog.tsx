'use client';

import { useState } from 'react';
import { NATIONAL_EVENTS } from '@/lib/events/national';
import { WORLD_EVENTS } from '@/lib/events/world';
import type { GameEvent } from '@/lib/types';

/** Catalogo completo: que le puede pasar al mundo y que te puede pasar a vos. */
const GROUPS: { id: string; label: string; list: GameEvent[]; hint: string }[] = [
  {
    id: 'mundial',
    label: '🌍 Mundiales',
    list: WORLD_EVENTS,
    hint: 'Le pasan al planeta entero. No los controlas: solo decidis como responder.'
  },
  {
    id: 'nacional',
    label: '🏠 Nacionales',
    list: NATIONAL_EVENTS.filter((e) => e.scope === 'nacional'),
    hint: 'Se disparan por el estado interno de tu pais: inflacion, desempleo, humor social.'
  },
  {
    id: 'personal',
    label: '👤 Liderazgo',
    list: NATIONAL_EVENTS.filter((e) => e.scope === 'personal'),
    hint: 'Le pasan a tu figura y a tu gabinete.'
  }
];

export default function EventCatalog() {
  const [tab, setTab] = useState('mundial');
  const group = GROUPS.find((g) => g.id === tab)!;

  return (
    <div>
      <div className="section" style={{ position: 'sticky', top: 0, zIndex: 4 }}>
        <h3>Catalogo de eventos ({WORLD_EVENTS.length + NATIONAL_EVENTS.length})</h3>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {GROUPS.map((g) => (
            <button key={g.id} className={tab === g.id ? 'btn-primary' : ''} onClick={() => setTab(g.id)}>
              {g.label} ({g.list.length})
            </button>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>{group.hint}</p>
      </div>

      <div className="section">
        {group.list.map((e) => (
          <div className="card" key={e.id}>
            <h4>{e.emoji} {e.title}</h4>
            <p>{e.description}</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
              {e.tags.map((t) => <span className="pill" key={t}>{t}</span>)}
              <span className="pill">peso {e.weight}</span>
              <span className="pill">{e.duration} {e.duration === 1 ? 'mes' : 'meses'}</span>
              {e.when && <span className="pill warn">condicionado</span>}
              {e.choices?.length ? <span className="pill good">{e.choices.length} opciones</span> : <span className="pill">automatico</span>}
            </div>
            {e.choices?.length ? (
              <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                {e.choices.map((c) => (
                  <li key={c.id}>
                    <b style={{ color: 'var(--text)' }}>{c.label}:</b> {c.detail}
                    {c.risk && <span className="bad"> · riesgo {Math.round(c.risk.chance * 100)}%</span>}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
