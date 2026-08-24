'use client';

import { useGame } from '@/lib/store';

/**
 * Enrique Grook, Change World Game v1.1. Modal bloqueante en pantalla
 * completa (sin `onClick` de cierre en `.overlay`, como el paso de sucesion
 * de ElectionModal.tsx): el onboarding del mes 4 no se puede saltear, y sus
 * cartas normales se resuelven con un click en una opcion, no con "cerrar".
 */
export default function EnriqueModal() {
  const pendingEnrique = useGame((s) => s.pendingEnrique);
  const resolveEnrique = useGame((s) => s.resolveEnrique);

  if (!pendingEnrique) return null;

  if (pendingEnrique.kind === 'onboarding') {
    if (pendingEnrique.step === 'intro') {
      return (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 560 }}>
            <p className="muted" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 4px' }}>
              Enrique Grook — Subsecretario de la Subsecretaria de Presidencia
            </p>
            <p style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {'Presidente… o como prefiera que lo llamen mientras todavia lo llamen.\n\n'
                + 'Yo soy Enrique Grook. Subsecretario de la Subsecretaria de Presidencia.\n'
                + 'Mi trabajo es simple: hacer que las cosas desagradables… desaparezcan. O al menos se vuelvan mas manejables.\n\n'
                + 'No me pague con ideales. Pagueme con resultados.\n'
                + 'A partir de ahora, cuando el olor a podrido suba demasiado, yo voy a aparecer.\n\n'
                + '¿Preguntas? No.\n'
                + '¿Opciones? Siempre.\n\n'
                + 'Pero antes de que empecemos a jugar de verdad… dejeme explicarle como funciona este mundito.\n'
                + 'Porque la mayoria de los que llegaron hasta aqui sin entenderlo… ya no estan.'}
            </p>
            <button className="btn-primary" onClick={() => resolveEnrique()} style={{ marginTop: 10 }}>
              Continuar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="overlay">
        <div className="modal" style={{ maxWidth: 560 }}>
          <h2>🕴️ Como funciona el poder en las sombras</h2>

          <div className="section" style={{ padding: '8px 0' }}>
            <h4 style={{ marginBottom: 2 }}>Corrupcion</h4>
            <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
              Es el indicador principal. Sube cuando haces favores, contratos opacos, nombramientos politicos
              o &quot;arreglos&quot;. Baja cuando limpias, destituyes o pagas el precio politico de parecer limpio.
              Cuanto mas alta, mas facil es que la Justicia y el Parlamento te huelan.
            </p>
            <h4 style={{ marginBottom: 2 }}>La Suprema Corte</h4>
            <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
              Puede acelerar o frenar investigaciones. Podes influir en su independencia... pero cada favor
              tiene un precio y el pueblo lo nota.
            </p>
            <h4 style={{ marginBottom: 2 }}>La Comision Anticorrupcion</h4>
            <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
              Se reparte segun tus escanos. Tener mayoria ayuda a diluir las investigaciones, pero nunca las
              anula por completo. Si el pueblo esta enojado, la Comision avanza igual.
            </p>
            <h4 style={{ marginBottom: 2 }}>Las investigaciones</h4>
            <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
              Avanzan mas rapido con corrupcion alta, pueblo infeliz y escandalos visibles. Avanzan mas lento
              con favores estrategicos y pueblo contento.
            </p>
            <h4 style={{ marginBottom: 2 }}>Enrique</h4>
            <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
              Yo no soy tu conciencia. Soy tu opcion facil. Cada vez que aparezca te voy a ofrecer caminos...
              con letra chica. Tu eliges. Yo solo administro la realidad.
            </p>
          </div>

          <button className="btn-primary" onClick={() => resolveEnrique()} style={{ marginTop: 8 }}>
            Entendido. Empecemos.
          </button>
        </div>
      </div>
    );
  }

  const { event } = pendingEnrique;
  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth: 560 }}>
        <p className="muted" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 4px' }}>
          Enrique Grook
        </p>
        <h2>{event.emoji} {event.title}</h2>
        <p style={{ lineHeight: 1.6 }}>{event.description}</p>

        {(event.choices ?? []).map((c) => (
          <button key={c.id} className="decision" onClick={() => resolveEnrique(c.id)}>
            <strong>{c.label}</strong>
            <small>{c.detail}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
