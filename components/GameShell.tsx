'use client';

import { useEffect, useRef, useState } from 'react';
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
import PrevisionalPanel from './PrevisionalPanel';
import JusticiaPanel from './JusticiaPanel';
import GroupsPanel from './GroupsPanel';
import ElectionModal from './ElectionModal';
import EnriqueModal from './EnriqueModal';
import TurnPlan from './TurnPlan';
import Feed from './Feed';
import GrokBridge from './GrokBridge';
import Onboarding from './Onboarding';
import EndGameScreen from './EndGameScreen';

type Tab =
  | 'pais' | 'gobierno' | 'grupos' | 'gabinete' | 'decisiones' | 'bloques' | 'eventos' | 'previsional' | 'justicia';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pais', label: '📊 Pais' },
  { id: 'gobierno', label: '🏛️ Gobierno' },
  { id: 'grupos', label: '📣 Grupos' },
  { id: 'gabinete', label: '👥 Gabinete' },
  { id: 'decisiones', label: '🎯 Decisiones' },
  { id: 'bloques', label: '🧩 Bloques' },
  { id: 'eventos', label: '📚 Eventos' },
  { id: 'previsional', label: '👴 Previsional' },
  { id: 'justicia', label: '⚖️ Justicia' }
];

// menu de escritorio: dos pestanas sueltas (las de uso mas frecuente) y el
// resto agrupado en 3 submenus verticales, mas cerca de como se organiza el
// panel interno en P&R que una tira de 9 botones iguales.
const STANDALONE_TABS: Tab[] = ['pais', 'decisiones'];
const MENU_GROUPS: { label: string; emoji: string; tabs: Tab[] }[] = [
  { label: 'Gobierno', emoji: '🏛️', tabs: ['gobierno', 'gabinete', 'previsional'] },
  { label: 'Mundo', emoji: '🌎', tabs: ['bloques', 'eventos'] },
  { label: 'Sociedad', emoji: '👥', tabs: ['grupos', 'justicia'] }
];

const TURN_FX_MS = 1400;

const groupOf = (t: Tab) => MENU_GROUPS.find((g) => g.tabs.includes(t))?.label ?? null;

export default function GameShell() {
  const [tab, setTab] = useState<Tab>('pais');
  const [openGroup, setOpenGroup] = useState<string | null>(() => groupOf('pais'));
  const [grok, setGrok] = useState(false);
  const [turnFx, setTurnFx] = useState(false);
  const [fxLabel, setFxLabel] = useState('');
  const turn = useGame((s) => s.turn);
  const world = useGame((s) => s.world);
  const pendingCount = useGame((s) => s.pending.length);
  const damagedCount = useGame((s) => damagedSectors(s.countries[s.playerCode]).length);
  const moralOnboarded = useGame((s) => s.moral.onboarded);
  const prevTurn = useRef(turn);
  const skipFirst = useRef(true);

  // Al avanzar el mes: flash global + etiqueta con el nuevo turno.
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      prevTurn.current = turn;
      return;
    }
    if (turn === prevTurn.current) return;
    prevTurn.current = turn;
    const month = world.month;
    const year = world.year;
    setFxLabel(`Mes ${month}/${year} · turno ${turn}`);
    setTurnFx(true);
    const t = window.setTimeout(() => setTurnFx(false), TURN_FX_MS);
    return () => window.clearTimeout(t);
  }, [turn, world.month, world.year]);

  const BADGES: Partial<Record<Tab, number>> = {
    decisiones: pendingCount,
    pais: damagedCount
  };

  // la pestana Justicia no existe hasta el onboarding de Enrique (mes 4)
  const visibleTabs = moralOnboarded ? TABS : TABS.filter((t) => t.id !== 'justicia');
  const visibleIds = new Set(visibleTabs.map((t) => t.id));
  const labelOf = (id: Tab) => visibleTabs.find((t) => t.id === id)?.label ?? id;

  const goTo = (id: Tab) => {
    setTab(id);
    const g = groupOf(id);
    if (g) setOpenGroup(g);
  };

  return (
    <div className={`app${turnFx ? ' turn-fx' : ''}`}>
      <TopBar onGrok={() => setGrok(true)} turnFx={turnFx} />

      <div className="stage">
        <div className="col">
          <nav className="side-menu">
            {STANDALONE_TABS.filter((id) => visibleIds.has(id)).map((id) => {
              const badge = BADGES[id];
              return (
                <button key={id} className={tab === id ? 'on' : ''} onClick={() => goTo(id)}>
                  {labelOf(id)}
                  {!!badge && tab !== id && <span className="tab-badge">{badge}</span>}
                </button>
              );
            })}
            {MENU_GROUPS.map((g) => {
              const items = g.tabs.filter((id) => visibleIds.has(id));
              if (items.length === 0) return null;
              const isOpen = openGroup === g.label;
              return (
                <div key={g.label}>
                  <button
                    className={`side-menu-group-header${items.includes(tab) ? ' on' : ''}`}
                    onClick={() => setOpenGroup(isOpen ? null : g.label)}
                  >
                    <span>{g.emoji} {g.label}</span>
                    <span className="side-menu-caret">{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className="side-menu-sub">
                      {items.map((id) => {
                        const badge = BADGES[id];
                        return (
                          <button key={id} className={tab === id ? 'on' : ''} onClick={() => goTo(id)}>
                            {labelOf(id)}
                            {!!badge && tab !== id && <span className="tab-badge">{badge}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="tabs mobile-only">
            {visibleTabs.map((t) => {
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
          {tab === 'grupos' && <GroupsPanel />}
          {tab === 'gabinete' && <CabinetPanel />}
          {tab === 'decisiones' && <DecisionsPanel />}
          {tab === 'bloques' && <BlocsPanel />}
          {tab === 'eventos' && <EventCatalog />}
          {tab === 'previsional' && <PrevisionalPanel />}
          {tab === 'justicia' && moralOnboarded && <JusticiaPanel />}
        </div>

        <GlobeView turnFx={turnFx} />

        <div className={`col right${turnFx ? ' feed-fx' : ''}`}>
          <TurnPlan />
          <Feed turnFx={turnFx} />
        </div>
      </div>

      {turnFx && (
        <div className="turn-fx-banner" aria-live="polite">
          <span className="turn-fx-ico">🌍</span>
          <div>
            <strong>Mundo reaccionando</strong>
            <span>{fxLabel}</span>
          </div>
        </div>
      )}

      {grok && <GrokBridge onClose={() => setGrok(false)} />}

      <Onboarding />

      <ElectionModal />

      <EnriqueModal />

      <EndGameScreen />
    </div>
  );
}
