'use client';

import { characterOf, type CharacterId, type EmblemShape } from '@/lib/characters';

const CLIP_PATH: Partial<Record<EmblemShape, string>> = {
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  shield: 'polygon(50% 0%, 100% 20%, 100% 60%, 50% 100%, 0% 60%, 0% 20%)'
};

/**
 * Emblema de personaje (docs/UX_Cartas_Personajes_Emblemas_Banderas.md,
 * seccion 3). Forma + color + simbolo por CSS, sin assets de imagen:
 * `leaf` y `circle`/`shield`/`star` alcanzan para diferenciar cada
 * personaje a simple vista sin depender de ilustraciones (fuera de
 * alcance de este pedido — ver seccion 11, Fase 3).
 */
export default function CharacterEmblem({
  id, size = 48, animated = false
}: {
  id: string;
  size?: number;
  animated?: boolean;
}) {
  const character = characterOf(id);
  if (!character) return null;

  const clip = CLIP_PATH[character.shape];

  return (
    <div
      className={`emblem${animated ? ' emblem-pop' : ''}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 28%, ${character.color}dd, ${character.color}88 70%)`,
        clipPath: clip,
        borderRadius: character.shape === 'leaf' ? '65% 0 65% 65%' : clip ? undefined : '50%'
      }}
      title={character.name}
    >
      <span style={{ fontSize: size * 0.5 }}>{character.symbol}</span>
    </div>
  );
}

export type { CharacterId };
