'use client';

import type { ReactNode } from 'react';
import { characterOf } from '@/lib/characters';
import CharacterEmblem from './CharacterEmblem';
import CountryFlag from './CountryFlag';

export type Urgency = 'normal' | 'important' | 'critical';

export interface KpiPreview {
  key: string;
  label: string;
  value: number;
  tone: 'bueno' | 'malo';
}

export interface EventCardOption {
  id: string;
  title: string;
  description?: string;
  costLabel?: string;
  preview: KpiPreview[];
  disabled?: boolean;
  disabledReason?: string;
  /** ya elegida en el plan del turno (Feed.tsx): marca visual, no bloquea re-elegir */
  selected?: boolean;
  onConfirm: () => void;
}

export interface EventCardProps {
  /** lib/characters.ts. Si no hay personaje, se usa `flagCode` o `emoji` en su lugar. */
  characterId?: string;
  flagCode?: string;
  emoji?: string;
  title: string;
  role?: string;
  urgency?: Urgency;
  body: ReactNode;
  options: EventCardOption[];
  footerStatus?: ReactNode;
  /** 'modal' = pantalla completa (Enrique); 'inline' = tarjeta normal (Feed, líderes) */
  mode?: 'modal' | 'inline';
}

const URGENCY_LABEL: Record<Urgency, string> = { normal: 'Normal', important: 'Importante', critical: 'Critico' };

/**
 * Carta de evento unificada (docs/UX_Cartas_Personajes_Emblemas_Banderas.md):
 * sirve para Enrique Grook (modal), los lideres minoritarios y cualquier
 * evento nacional/mundial con `choices` (inline, dentro de Feed.tsx).
 * La superficie (fondo/borde/padding) la pone el contenedor — `.modal` en
 * modo modal, `.card` en modo inline — para no duplicar esos estilos.
 */
export default function EventCard({
  characterId, flagCode, emoji, title, role, urgency = 'normal', body, options, footerStatus, mode = 'inline'
}: EventCardProps) {
  const character = characterOf(characterId);

  const inner = (
    <div className={`event-card event-card-${urgency}`}>
      <div className="event-card-header">
        {character ? (
          <CharacterEmblem id={characterId!} size={mode === 'modal' ? 48 : 40} animated />
        ) : flagCode ? (
          <CountryFlag code={flagCode} size="md" bordered />
        ) : (
          <span className="event-card-emoji">{emoji}</span>
        )}
        <div className="event-card-heading">
          <h2>{title}</h2>
          {role && <p className="event-card-role">{role}</p>}
        </div>
        {urgency !== 'normal' && (
          <span className={`urgency-tag urgency-${urgency}`}>{URGENCY_LABEL[urgency]}</span>
        )}
      </div>

      <div className="event-card-body">{body}</div>

      <div className="event-card-options">
        {options.map((o) => (
          <button
            key={o.id}
            className={`decision event-card-option${o.selected ? ' planned' : ''}`}
            disabled={o.disabled}
            title={o.disabled ? o.disabledReason : undefined}
            onClick={o.onConfirm}
          >
            <strong>{o.title}{o.costLabel ? <span className="muted"> ({o.costLabel})</span> : null}</strong>
            {o.description && <small>{o.description}</small>}
            {o.preview.length > 0 && (
              <span className="preview">
                {o.preview.map((p) => (
                  <em key={p.key} className={p.tone === 'bueno' ? 'good' : 'bad'}>
                    {p.label} {p.value > 0 ? '+' : ''}{p.value}
                  </em>
                ))}
              </span>
            )}
          </button>
        ))}
      </div>

      {footerStatus && <div className="event-card-footer">{footerStatus}</div>}
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="overlay">
        <div className="modal event-card-modal">{inner}</div>
      </div>
    );
  }

  const borderColor = urgency === 'critical' ? 'var(--bad)' : urgency === 'important' ? 'var(--warn)' : undefined;
  return <div className="card event-card-inline" style={{ borderColor }}>{inner}</div>;
}
