'use client';

import { useState } from 'react';
import { useGame } from '@/lib/store';
import GlobeView from './GlobeView';
import TopBar from './TopBar';
import CountryPanel from './CountryPanel';
import DecisionsPanel from './DecisionsPanel';
import BlocsPanel from './BlocsPanel';
import EventCatalog from './EventCatalog';
import Feed from './Feed';
import GrokBridge from './GrokBridge';

type Tab = 'pais' | 'decisiones' | 'bloques' | 'eventos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pais', label: '📊 Pais' },
  { id: 'decisiones', label: '🎯 Decisiones' },
  { id: 'bloques', label: '🧩 Bloques' },
  { id: 'eventos', label: '📚 Eventos' }
];

export default function GameShell() {
  const [tab, setTab] = useState<Tab>('pais');
  const [grok, setGrok] = useState(false);
  const gameOver = useGame((s) => s.gameOver);
  const reset = useGame((s) => s.reset);

  return (
    <div className="app">
      <TopBar onGrok={() => setGrok(true)} />

      <div className="stage">
        <div className="col">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'pais' && <CountryPanel />}
          {tab === 'decisiones' && <DecisionsPanel />}
          {tab === 'bloques' && <BlocsPanel />}
          {tab === 'eventos' && <EventCatalog />}
        </div>

        <GlobeView />

        <div className="col right">
          <Feed />
        </div>
      </div>

      {grok && <GrokBridge onClose={() => setGrok(false)} />}

      {gameOver && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 460, textAlign: 'center' }}>
            <h2>🏁 {gameOver.title}</h2>
            <p>{gameOver.body}</p>
            <button className="btn-primary" onClick={reset}>Empezar de nuevo</button>
          </div>
        </div>
      )}
    </div>
  );
}
