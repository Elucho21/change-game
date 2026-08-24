'use client';

import { useGame } from '@/lib/store';
import { previewMoralDelta } from '@/lib/moral';
import EventCard from './EventCard';

/**
 * Enrique Grook, Change World Game v1.1 (docs/UX_Cartas_Personajes_Emblemas_Banderas.md).
 * El onboarding (2 pasos) y las cartas normales comparten el mismo EventCard
 * en modo 'modal' — el onboarding es no-dismissible (sin `options` en el
 * paso 1, un solo boton "Continuar"/"Entendido" en vez de opciones A/B/C).
 */
export default function EnriqueModal() {
  const pendingEnrique = useGame((s) => s.pendingEnrique);
  const resolveEnrique = useGame((s) => s.resolveEnrique);

  if (!pendingEnrique) return null;

  if (pendingEnrique.kind === 'onboarding') {
    if (pendingEnrique.step === 'intro') {
      return (
        <EventCard
          mode="modal"
          characterId="enrique_grook"
          title="Enrique Grook"
          role="Subsecretario de la Subsecretaria de Presidencia"
          body={
            'Presidente… o como prefiera que lo llamen mientras todavia lo llamen.\n\n'
            + 'Yo soy Enrique Grook. Subsecretario de la Subsecretaria de Presidencia.\n'
            + 'Mi trabajo es simple: hacer que las cosas desagradables… desaparezcan. O al menos se vuelvan mas manejables.\n\n'
            + 'No me pague con ideales. Pagueme con resultados.\n'
            + 'A partir de ahora, cuando el olor a podrido suba demasiado, yo voy a aparecer.\n\n'
            + '¿Preguntas? No.\n'
            + '¿Opciones? Siempre.\n\n'
            + 'Pero antes de que empecemos a jugar de verdad… dejeme explicarle como funciona este mundito.\n'
            + 'Porque la mayoria de los que llegaron hasta aqui sin entenderlo… ya no estan.'
          }
          options={[{ id: 'continuar', title: 'Continuar', preview: [], onConfirm: () => resolveEnrique() }]}
        />
      );
    }

    return (
      <EventCard
        mode="modal"
        characterId="enrique_grook"
        title="Como funciona el poder en las sombras"
        body={
          <div className="section" style={{ padding: 0 }}>
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
        }
        options={[{ id: 'entendido', title: 'Entendido. Empecemos.', preview: [], onConfirm: () => resolveEnrique() }]}
      />
    );
  }

  const { event } = pendingEnrique;
  return (
    <EventCard
      mode="modal"
      characterId={event.characterId ?? 'enrique_grook'}
      title={event.title}
      role="Enrique Grook"
      urgency={event.urgency}
      body={event.description}
      options={(event.choices ?? []).map((c) => ({
        id: c.id,
        title: c.label,
        description: c.detail,
        preview: c.moralEffects ? previewMoralDelta(c.moralEffects) : [],
        onConfirm: () => resolveEnrique(c.id)
      }))}
    />
  );
}
