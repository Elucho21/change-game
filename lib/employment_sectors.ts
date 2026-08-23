/**
 * Intensidad de empleo y formalidad por sector del PBI.
 *
 * Fuente de diseno: CHANGE WORLD GAME 1.0 (Logicas_Economicas_Completas.md).
 * Esto es DATOS. El motor todavia no lo consume: el pedido esta en
 * docs/PEDIDOS_A_OPUS.md. Las decisiones de impulso sectorial y los
 * eventos de formalizacion usan estos numeros como referencia de balance.
 *
 * Sectores del JSON de paises: industry, agriculture, services, commerce, tourism.
 * Tres perfiles extra (mineria/energia, tecnologia, empleo publico) documentan
 * el diseno; el motor puede mapearlos a industry / services cuando los cablee.
 */

export type GameSector = 'industry' | 'agriculture' | 'services' | 'commerce' | 'tourism';

export type LaborSector = GameSector | 'mining_energy' | 'technology' | 'public';

export interface SectorLaborProfile {
  sector: LaborSector;
  mapsTo: GameSector;
  /** etiqueta para docs y UI futura (sin tildes: pasa por el motor Python) */
  label: string;
  /**
   * Empleos por unidad de valor agregado. 1.0 = media de la economia.
   * Mineria 0.35 (mucho PBI, poco empleo); turismo 1.55 (al reves).
   */
  employmentIntensity: number;
  /** 0-1. Share formal del empleo del sector. */
  formality: number;
  /** 0-1. Que tanto se contrae el empleo formal si sube el costo laboral. */
  laborCostSensitivity: number;
  /** 0-1. Sensibilidad a tipo de cambio y seguridad (turismo alto). */
  fxSafetySensitivity: number;
  notes: string;
}

export const GAME_SECTORS: GameSector[] = [
  'industry',
  'agriculture',
  'services',
  'commerce',
  'tourism'
];

/**
 * Tabla de intensidades. Numeros editables: el motor deberia leerlos, no
 * hardcodearlos. Elasticidad empleo-PBI de diseno: 0.45-0.60 (ver logicas).
 */
export const SECTOR_LABOR: Record<LaborSector, SectorLaborProfile> = {
  mining_energy: {
    sector: 'mining_energy',
    mapsTo: 'industry',
    label: 'Mineria y energia',
    employmentIntensity: 0.35,
    formality: 0.88,
    laborCostSensitivity: 0.25,
    fxSafetySensitivity: 0.2,
    notes: 'Alto valor agregado, poco empleo, alta formalidad. Impulsarla da PBI y exportaciones, no votos de empleo.'
  },
  industry: {
    sector: 'industry',
    mapsTo: 'industry',
    label: 'Industria',
    employmentIntensity: 1.05,
    formality: 0.72,
    laborCostSensitivity: 0.7,
    fxSafetySensitivity: 0.35,
    notes: 'Empleo formal medio-alto. Sensible a costo laboral y energia.'
  },
  agriculture: {
    sector: 'agriculture',
    mapsTo: 'agriculture',
    label: 'Agro',
    employmentIntensity: 0.85,
    formality: 0.48,
    laborCostSensitivity: 0.45,
    fxSafetySensitivity: 0.4,
    notes: 'Estacional. Informalidad alta en cosecha. Dolares frescos, poco empleo urbano.'
  },
  services: {
    sector: 'services',
    mapsTo: 'services',
    label: 'Servicios',
    employmentIntensity: 1.25,
    formality: 0.55,
    laborCostSensitivity: 0.5,
    fxSafetySensitivity: 0.2,
    notes: 'Alto empleo, formalidad variable. Incluye estado, salud, educacion y profesionales.'
  },
  commerce: {
    sector: 'commerce',
    mapsTo: 'commerce',
    label: 'Comercio',
    employmentIntensity: 1.2,
    formality: 0.5,
    laborCostSensitivity: 0.55,
    fxSafetySensitivity: 0.45,
    notes: 'Mucha gente, mucha informalidad. Guerra comercial y fletes le pegan directo.'
  },
  tourism: {
    sector: 'tourism',
    mapsTo: 'tourism',
    label: 'Turismo',
    employmentIntensity: 1.55,
    formality: 0.42,
    laborCostSensitivity: 0.4,
    fxSafetySensitivity: 0.85,
    notes: 'Mucho empleo, informal. Muy sensible a seguridad y tipo de cambio.'
  },
  technology: {
    sector: 'technology',
    mapsTo: 'services',
    label: 'Tecnologia',
    employmentIntensity: 0.4,
    formality: 0.9,
    laborCostSensitivity: 0.3,
    fxSafetySensitivity: 0.15,
    notes: 'Altos salarios, bajo volumen, alta productividad. Poco empleo, mucho PBI por cabeza.'
  },
  public: {
    sector: 'public',
    mapsTo: 'services',
    label: 'Empleo estatal',
    employmentIntensity: 1.1,
    formality: 0.97,
    laborCostSensitivity: 0.15,
    fxSafetySensitivity: 0.05,
    notes: 'Rigido: dificil de recortar. El ajuste aca duele estabilidad, no productividad.'
  }
};

/** Perfiles que el JSON de paises ya tiene (los 5 sectores del globo). */
export const GAME_SECTOR_LABOR: Record<GameSector, SectorLaborProfile> = {
  industry: SECTOR_LABOR.industry,
  agriculture: SECTOR_LABOR.agriculture,
  services: SECTOR_LABOR.services,
  commerce: SECTOR_LABOR.commerce,
  tourism: SECTOR_LABOR.tourism
};

/**
 * Impulsar un sector mueve empleo ~ intensidad, no ~ PBI.
 * Turismo 1.55 vs mineria 0.35: misma inversion, distinto voto.
 */
export function employmentFromSectorPush(sector: GameSector, gdpDelta: number): number {
  return gdpDelta * GAME_SECTOR_LABOR[sector].employmentIntensity;
}
