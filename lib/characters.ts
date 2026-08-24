/**
 * Config de personajes/instituciones del Sistema Moral, Change World Game
 * v1.1 (docs/UX_Cartas_Personajes_Emblemas_Banderas.md, seccion 3).
 *
 * Fuente unica para el emblema (components/CharacterEmblem.tsx) y el
 * encabezado de una carta (components/EventCard.tsx): nombre, cargo,
 * forma, color y simbolo.
 */
export type CharacterId =
  | 'enrique_grook' | 'gustavo_comun' | 'amalia_verde' | 'jhon_el_duro'
  | 'supreme_court' | 'anti_corruption';

export type EmblemShape = 'circle' | 'star' | 'leaf' | 'shield';

export interface CharacterConfig {
  name: string;
  role: string;
  shape: EmblemShape;
  color: string;
  symbol: string;
}

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  enrique_grook: {
    name: 'Enrique Grook',
    role: 'Subsecretario de la Subsecretaria de Presidencia',
    shape: 'circle',
    color: '#c9a227',
    symbol: '🕴️'
  },
  gustavo_comun: {
    name: 'Gustavo Comun',
    role: 'Lider del Partido Comunista',
    shape: 'star',
    color: '#c41e3a',
    symbol: '✊'
  },
  amalia_verde: {
    name: 'Amalia Verde',
    role: 'Lider del Partido Verde',
    shape: 'leaf',
    color: '#40916c',
    symbol: '🌿'
  },
  jhon_el_duro: {
    name: 'Jhon el Duro',
    role: 'Lider de la Ultra-Derecha',
    shape: 'shield',
    color: '#8b0000',
    symbol: '🎖️'
  },
  supreme_court: {
    name: 'Suprema Corte',
    role: 'Poder Judicial',
    shape: 'circle',
    color: '#4f7cff',
    symbol: '⚖️'
  },
  anti_corruption: {
    name: 'Comision Anticorrupcion',
    role: 'Comision Parlamentaria',
    shape: 'circle',
    color: '#8a93a6',
    symbol: '🔨'
  }
};

export const characterOf = (id?: string): CharacterConfig | undefined =>
  id && id in CHARACTERS ? CHARACTERS[id as CharacterId] : undefined;
