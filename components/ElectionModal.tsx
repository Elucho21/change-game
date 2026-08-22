'use client';

import { useGame } from '@/lib/store';

/**
 * Dos momentos electorales:
 *  - elegir sucesor cuando se te agotaron los mandatos (la partida espera)
 *  - leer el resultado de una eleccion ya resuelta
 */
export default function ElectionModal() {
  const succession = useGame((s) => s.succession);
  const election = useGame((s) => s.election);
  const politics = useGame((s) => s.politics);
  const gameOver = useGame((s) => s.gameOver);
  const chooseSuccessor = useGame((s) => s.chooseSuccessor);
  const dismissElection = useGame((s) => s.dismissElection);

  if (succession.length > 0) {
    return (
      <div className="overlay">
        <div className="modal">
          <h2>🗳️ Elegi tu sucesor</h2>
          <p>
            Se termina tu ultimo mandato consecutivo y no podes presentarte de nuevo. Elegi quien
            encabeza la boleta de <b>{politics.partyName}</b>: si gana, tu proyecto sigue en el poder.
            Ninguno es mejor que otro, cada uno te deja parado para un problema distinto.
          </p>

          {succession.map((c) => (
            <button key={c.id} className="decision" onClick={() => chooseSuccessor(c.id)}>
              <strong>{c.name} — {c.title}</strong>
              <small>{c.description}</small>
              <span className="preview">
                {Object.entries(c.modifiers).map(([k, v]) => (
                  <em key={k} className={(v as number) > 0 ? 'good' : 'bad'}>
                    {k} {(v as number) > 0 ? '+' : ''}{v as number}
                  </em>
                ))}
                <em className={c.voteBonus >= 0 ? 'good' : 'bad'}>
                  Voto {c.voteBonus >= 0 ? '+' : ''}{c.voteBonus}
                </em>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // el cartel del resultado no aparece si la partida termino: manda el de fin de juego
  if (!election || gameOver) return null;

  return (
    <div className="overlay" onClick={dismissElection}>
      <div className="modal" style={{ maxWidth: 460, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <h2>{election.won ? '🎉' : '🏛️'} {election.headline}</h2>
        <p>{election.detail}</p>
        <div className="row"><span>Intencion de voto</span><b className={election.won ? 'good' : 'bad'}>{election.vote}%</b></div>
        <div className="row"><span>Diferencia</span><b>{election.margin > 0 ? '+' : ''}{election.margin} puntos</b></div>
        <div className="row"><span>Participacion</span><b>{election.turnout}%</b></div>
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={dismissElection}>
          Seguir gobernando
        </button>
      </div>
    </div>
  );
}
