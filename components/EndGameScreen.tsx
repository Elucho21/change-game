'use client';

import { useMemo } from 'react';
import { useGame } from '@/lib/store';
import { buildRecapSummary, computeAchievements, METRIC_UNIT } from '@/lib/recap';
import type { Milestone } from '@/lib/milestones';

const TONE_CLASS: Record<Milestone['tone'], string> = { bueno: 'good', malo: 'bad', neutral: 'neutral' };

/**
 * Pantalla de fin de partida: reemplaza el cartel minimo de "perdiste"
 * (antes en GameShell.tsx) por un balance de gestion completo — arranque vs
 * cierre, mejor/peor momento de cada indicador, logros desbloqueados y la
 * linea de tiempo de hitos institucionales. Todo se calcula al vuelo con
 * lib/recap.ts a partir de `history` y `milestones`: no se guarda nada nuevo.
 */
export default function EndGameScreen() {
  const gameOver = useGame((s) => s.gameOver);
  const history = useGame((s) => s.history);
  const milestones = useGame((s) => s.milestones);
  const politics = useGame((s) => s.politics);
  const moral = useGame((s) => s.moral);
  const world = useGame((s) => s.world);
  const turn = useGame((s) => s.turn);
  const startingGdp = useGame((s) => s.startingGdp);
  const playerCode = useGame((s) => s.playerCode);
  const player = useGame((s) => s.countries[s.playerCode]);
  const newGame = useGame((s) => s.newGame);

  const recap = useMemo(() => {
    if (!gameOver || !player || !history.length) return null;
    const input = { history, milestones, politics, moral, player, world, turn, startingGdp };
    const summary = buildRecapSummary(input);
    const achievements = computeAchievements(input, summary);
    const timeline = [...milestones].sort((a, b) => a.turn - b.turn);
    return { summary, achievements, timeline };
  }, [gameOver, player, history, milestones, politics, moral, world, turn, startingGdp]);

  if (!gameOver || !recap || !playerCode) return null;
  const { summary, achievements, timeline } = recap;

  return (
    <div className="overlay">
      <div className="modal end-game-modal">
        <h2>🏁 {gameOver.title}</h2>
        <p>{gameOver.body}</p>

        <div className="section">
          <h3>Balance de gestion</h3>
          <div className="row"><span>Asumiste</span><b>{summary.startDate}</b></div>
          <div className="row"><span>Dejaste el poder</span><b>{summary.endDate}</b></div>
          <div className="row"><span>Duracion</span><b>{summary.turns} meses (~{summary.years} anios)</b></div>
          <div className="row"><span>Elecciones ganadas</span><b>{summary.electionsWon}</b></div>
        </div>

        <div className="section">
          <h3>Arranque, mejor y peor momento, cierre</h3>
          <div className="recap-table">
            <div className="recap-row recap-head">
              <span>Indicador</span><span>Arranque</span><span>Mejor</span><span>Peor</span><span>Cierre</span>
            </div>
            {summary.metrics.map((m) => (
              <div className="recap-row" key={m.key}>
                <span>{m.label}</span>
                <span>{m.start}{METRIC_UNIT[m.key]}</span>
                <span className="good">{m.best.value}{METRIC_UNIT[m.key]}<small>{m.best.date}</small></span>
                <span className="bad">{m.worst.value}{METRIC_UNIT[m.key]}<small>{m.worst.date}</small></span>
                <span>{m.end}{METRIC_UNIT[m.key]}</span>
              </div>
            ))}
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="section">
            <h3>Logros de tu gestion ({achievements.length})</h3>
            <div className="achv-grid">
              {achievements.map((a) => (
                <div className="card achv-card" key={a.id}>
                  <div className="achv-emoji">{a.emoji}</div>
                  <div>
                    <h4>{a.title}</h4>
                    <p>{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {timeline.length > 0 && (
          <div className="section">
            <h3>Hitos de la gestion ({timeline.length})</h3>
            <div className="recap-timeline">
              {timeline.map((m, i) => (
                <div className={`feed-item tone-${TONE_CLASS[m.tone]}`} key={`${m.turn}-${m.kind}-${i}`}>
                  <div className="ico">{m.emoji}</div>
                  <div>
                    <h5>{m.title}</h5>
                    <p>{m.body}</p>
                    <div className="when">{m.date} · turno {m.turn}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn-primary" style={{ marginTop: 14 }} onClick={newGame}>
          Empezar de nuevo
        </button>
      </div>
    </div>
  );
}
