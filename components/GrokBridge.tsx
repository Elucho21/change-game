'use client';

import { useState } from 'react';
import { useGame } from '@/lib/store';

/**
 * Puente con Grok: genera el prompt compacto del turno (formato PROMPT_MAESTRO.md),
 * lo copias, lo pegas en Grok, y volves con el JSON de reacciones para aplicarlo.
 *
 * Es manual a proposito: no hay fetch a ninguna API externa aca, asi que no
 * hay ninguna clave que exponer. Si algun dia esto se automatiza (llamar a
 * la API de Grok directo), esa llamada tiene que salir de una API route
 * server-side, nunca de este componente 'use client' con la key en el bundle.
 */
export default function GrokBridge({ onClose }: { onClose: () => void }) {
  const prompt = useGame((s) => s.grokPrompt)();
  const apply = useGame((s) => s.applyGrokJson);
  const [answer, setAnswer] = useState('');
  const [msg, setMsg] = useState('');

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🤖 Puente con Grok</h2>
        <p>
          El motor local resuelve numeros y eventos. Grok agrega el realismo fino: como reacciona
          cada pais y la cronica del turno. Copia el prompt, pegalo en Grok y trae el JSON de vuelta.
        </p>

        <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)' }}>1. Prompt del turno</h3>
        <textarea readOnly rows={12} value={prompt} />
        <div style={{ display: 'flex', gap: 8, margin: '8px 0 18px' }}>
          <button
            className="btn-primary"
            onClick={() => {
              navigator.clipboard.writeText(prompt).then(
                () => setMsg('Prompt copiado.'),
                () => setMsg('No pude copiar: seleccionalo a mano.')
              );
            }}
          >
            Copiar prompt
          </button>
        </div>

        <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)' }}>2. Respuesta de Grok (JSON)</h3>
        <textarea
          rows={8}
          value={answer}
          placeholder='{"reactions":[{"country":"Brazil","action":"...","relation_change":-8,"intensity":3}],"narrative":"..."}'
          onChange={(e) => setAnswer(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => setMsg(apply(answer))} disabled={!answer.trim()}>
            Aplicar al juego
          </button>
          <button onClick={onClose}>Cerrar</button>
          {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
