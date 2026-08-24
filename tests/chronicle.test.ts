import { describe, expect, it } from 'vitest';
import { buildLocalChronicle, pickHeadline, type ChronicleInput } from '../lib/chronicle';

const base: ChronicleInput = {
  turn: 12,
  dateLabel: 'marzo 2027',
  tradeChangeVsStart: 0,
  topPartner: null,
  stability: 60,
  happiness: 55,
  unemployment: 8,
  inflation: 3,
  oilPrice: 80,
  oilShock: 0,
  globalTension: 40,
  aiMoves: [],
  worldEventTitles: []
};

describe('buildLocalChronicle', () => {
  it('menciona el comercio cuando el cambio vs el arranque supera el 5%', () => {
    const c = buildLocalChronicle({ ...base, tradeChangeVsStart: 12, topPartner: 'China' });
    expect(c.lines.some((l) => l.includes('comercio') && l.includes('subio') && l.includes('China'))).toBe(true);
  });

  it('no menciona el comercio si el cambio es chico', () => {
    const c = buildLocalChronicle({ ...base, tradeChangeVsStart: 2, topPartner: 'China' });
    expect(c.lines.some((l) => l.includes('comercio'))).toBe(false);
  });

  it('menciona presion sobre el petroleo si hubo oil shock', () => {
    const c = buildLocalChronicle({ ...base, oilShock: 5, oilPrice: 110 });
    expect(c.lines.some((l) => l.includes('petroleo'))).toBe(true);
  });

  it('incluye hasta 2 movidas de IA', () => {
    const c = buildLocalChronicle({
      ...base,
      aiMoves: [
        { title: 'Estados Unidos', body: 'sube tasas' },
        { title: 'China', body: 'estimulo fiscal' },
        { title: 'Alemania', body: 'ajuste presupuestario' }
      ]
    });
    expect(c.lines.filter((l) => l.includes('Estados Unidos') || l.includes('China') || l.includes('Alemania')).length).toBe(2);
  });

  it('incluye un evento mundial cuando hay uno', () => {
    const c = buildLocalChronicle({ ...base, worldEventTitles: ['Cierre de Ormuz'] });
    expect(c.lines.some((l) => l.includes('Cierre de Ormuz'))).toBe(true);
  });

  it('marca crisis de estabilidad interna por debajo de 40', () => {
    const c = buildLocalChronicle({ ...base, stability: 25 });
    expect(c.lines.some((l) => l.includes('estabilidad interna'))).toBe(true);
  });

  it('marca desempleo alto solo cuando la estabilidad no esta en crisis', () => {
    const c = buildLocalChronicle({ ...base, stability: 60, unemployment: 14 });
    expect(c.lines.some((l) => l.includes('desempleo'))).toBe(true);
  });

  it('recorta a un maximo de 6 lineas', () => {
    const c = buildLocalChronicle({
      ...base,
      tradeChangeVsStart: 15,
      topPartner: 'China',
      oilShock: 3,
      aiMoves: [
        { title: 'A', body: 'a' },
        { title: 'B', body: 'b' }
      ],
      worldEventTitles: ['Evento mundial'],
      stability: 20,
      unemployment: 15
    });
    expect(c.lines.length).toBeLessThanOrEqual(6);
  });

  it('usa "Balance del mes" como headline por defecto', () => {
    expect(pickHeadline(base)).toBe('Balance del mes');
  });

  it('prioriza rutas bajo tension como headline cuando hay oil shock', () => {
    expect(pickHeadline({ ...base, oilShock: 4 })).toBe('Rutas bajo tension');
  });

  it('trae el turno y source local en el resultado', () => {
    const c = buildLocalChronicle(base);
    expect(c.turn).toBe(12);
    expect(c.source).toBe('local');
    expect(c.headline.startsWith('marzo 2027')).toBe(true);
  });
});
