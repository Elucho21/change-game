'use client';

import { useEffect } from 'react';
import { useGame } from '@/lib/store';
import StartScreen from '@/components/StartScreen';
import GameShell from '@/components/GameShell';

export default function Page() {
  const started = useGame((s) => s.started);
  const loadSaved = useGame((s) => s.loadSaved);
  const refreshSavedSummary = useGame((s) => s.refreshSavedSummary);

  // al abrir la pagina: si hay una partida guardada, se retoma sola.
  // Va en un effect y no en el render para no romper la hidratacion de Next
  // (el servidor no tiene localStorage).
  useEffect(() => {
    refreshSavedSummary();
    if (!useGame.getState().started) loadSaved();
  }, [loadSaved, refreshSavedSummary]);

  return started ? <GameShell /> : <StartScreen />;
}
