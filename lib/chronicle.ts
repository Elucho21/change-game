/**
 * Cronica de fin de turno: informe corto (4-6 lineas) de que paso en el mundo
 * y en el pais al cerrar el mes, en vez de que el jugador solo vea deltas
 * numericos. Ver docs/CRONICA_FIN_DE_TURNO.md.
 *
 * v1 es local (sin IA): las senales de comercio/bloques por mandato y de
 * moral/minoritarios quedan afuera porque no hay un snapshot pre-tick barato
 * en el punto de enganche (endTurn) para calcular esos deltas todavia.
 */

export interface TurnChronicle {
  headline: string;
  lines: string[];
  source: 'local';
  turn: number;
}

export interface ChronicleInput {
  turn: number;
  dateLabel: string;
  /** % de cambio del comercio total del jugador vs el arranque de la partida (tradeBase). */
  tradeChangeVsStart: number;
  topPartner: string | null;
  stability: number;
  happiness: number;
  unemployment: number;
  inflation: number;
  oilPrice: number;
  oilShock: number;
  globalTension: number;
  /** titulos+cuerpos de los movimientos de IA ya empujados al feed este turno (kind 'reaccion'). */
  aiMoves: { title: string; body: string }[];
  /** titulos de eventos mundiales/nacionales ya empujados al feed este turno (kind 'evento'). */
  worldEventTitles: string[];
}

/** Maximo de lineas de la cronica (docs/CRONICA_FIN_DE_TURNO.md #3.1). */
const MAX_LINES = 6;

export function pickHeadline(input: ChronicleInput): string {
  if (input.oilShock > 0) return 'Rutas bajo tension';
  if (input.stability < 35) return 'Agenda interna en riesgo';
  if (Math.abs(input.tradeChangeVsStart) >= 10) return 'Reacomodo comercial';
  if (input.globalTension > 65) return 'Clima internacional cargado';
  return 'Balance del mes';
}

export function buildLocalChronicle(input: ChronicleInput): TurnChronicle {
  const lines: string[] = [];

  if (Math.abs(input.tradeChangeVsStart) >= 5 && input.topPartner) {
    const dir = input.tradeChangeVsStart > 0 ? 'subio' : 'cayo';
    lines.push(
      `El comercio total ${dir} ${Math.abs(input.tradeChangeVsStart).toFixed(0)}% respecto al inicio; principal socio: ${input.topPartner}.`
    );
  }

  if (input.oilShock > 0) {
    lines.push(`Las interrupciones en rutas mantienen presion sobre el petroleo (aprox ${input.oilPrice.toFixed(0)} USD).`);
  }

  for (const m of input.aiMoves.slice(0, 2)) {
    lines.push(`${m.title}: ${m.body}`);
  }

  for (const t of input.worldEventTitles.slice(0, 1)) {
    lines.push(`En el tablero global: ${t}.`);
  }

  if (input.stability < 40) {
    lines.push(`La estabilidad interna sigue bajo presion (${input.stability.toFixed(0)}).`);
  } else if (input.unemployment >= 12) {
    lines.push(`El desempleo en ${input.unemployment.toFixed(0)}% marca la agenda domestica.`);
  }

  const headline = `${input.dateLabel} — ${pickHeadline(input)}`;

  return {
    headline,
    lines: lines.slice(0, MAX_LINES),
    source: 'local',
    turn: input.turn
  };
}
