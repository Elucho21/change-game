'use client';

import { useState } from 'react';
import { useGame } from '@/lib/store';
import { damagedSectors } from '@/lib/engine';
import GlobeView from './GlobeView';
import TopBar from './TopBar';
import CountryPanel from './CountryPanel';
import DecisionsPanel from './DecisionsPanel';
import BlocsPanel from './BlocsPanel';
import EventCatalog from './EventCatalog';
import GovernmentPanel from './GovernmentPanel';
import CabinetPanel from './CabinetPanel';
import ElectionModal from './ElectionModal';
import TurnPlan from './TurnPlan';
import Feed from './Feed';
import GrokBridge from './GrokBridge';
import Onboarding from './Onboarding';

type Tab = 'pais' | 'gobierno' | 'gabinete' | 'decisiones' | 'bloques' | 'eventos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pais', label: '📊 Pais' },
  { id: 'gobierno', label: '🏛️ Gobierno' },
  { id: 'gabinete', label: '👥 Gabinete' },
  { id: 'decisiones', label: '🎯 Decisiones' },
  { id: 'bloques', label: '🧩 Bloques' },
  { id: 'eventos', label: '📚 Eventos' }
];

export default function GameShell() {
  const [tab, setTab] = useState<Tab>('pais');
  const [grok, setGrok] = useState(false);
  const gameOver = useGame((s) => s.gameOver);
  const newGame = useGame((s) => s.newGame);
  const pendingCount = useGame((s) => s.pending.length);
  const damagedCount = useGame((s) => damagedSectors(s.countries[s.playerCode]).length);

  // Cuantos avisos tiene cada pestana que no es la activa: para notar que
  // paso algo en otro lado sin tener que ir clickeando las seis a ver.
  const BADGES: Partial<Record<Tab, number>> = {
    decisiones: pendingCount,
    pais: damagedCount
  };

  return (
    <div className="app">
      <TopBar onGrok={() => setGrok(true)} />

      <div className="stage">
        <div className="col">
          <div className="tabs">
            {TABS.map((t) => {
              const badge = BADGES[t.id];
              return (
                <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                  {t.label}
                  {!!badge && tab !== t.id && <span className="tab-badge">{badge}</span>}
                </button>
              );
            })}
          </div>
          {tab === 'pais' && <CountryPanel />}
          {tab === 'gobierno' && <GovernmentPanel />}
          {tab === 'gabinete' && <CabinetPanel />}
          {tab === 'decisiones' && <DecisionsPanel />}
          {tab === 'bloques' && <BlocsPanel />}
          {tab === 'eventos' && <EventCatalog />}
        </div>

        <GlobeView />

        <div className="col right">
          <TurnPlan />
          <Feed />
        </div>
      </div>

      {grok && <GrokBridge onClose={() => setGrok(false)} />}

      <Onboarding />

      <ElectionModal />

      {gameOver && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 460, textAlign: 'center' }}>
            <h2>🏁 {gameOver.title}</h2>
            <p>{gameOver.body}</p>
            <button className="btn-primary" onClick={newGame}>Empezar de nuevo</button>
          </div>
        </div>
      )}
    </div>
  );
}
