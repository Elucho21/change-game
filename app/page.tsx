'use client';

import { useGame } from '@/lib/store';
import StartScreen from '@/components/StartScreen';
import GameShell from '@/components/GameShell';

export default function Page() {
  const started = useGame((s) => s.started);
  return started ? <GameShell /> : <StartScreen />;
}
