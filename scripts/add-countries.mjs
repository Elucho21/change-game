/**
 * Agrega 52 paises a engine/countries_mvp.json y META de build-data.mjs.
 * Idempotente: no duplica claves existentes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const META_ADD = {
  India:        { iso: 'IND', flag: '🇮🇳', lat: 28.6,  lng: 77.2 },
  Indonesia:    { iso: 'IDN', flag: '🇮🇩', lat: -6.2,  lng: 106.8 },
  Turkey:       { iso: 'TUR', flag: '🇹🇷', lat: 39.9,  lng: 32.9 },
  SaudiArabia:  { iso: 'SAU', flag: '🇸🇦', lat: 24.7,  lng: 46.7 },
  Iran:         { iso: 'IRN', flag: '🇮🇷', lat: 35.7,  lng: 51.4 },
  Israel:       { iso: 'ISR', flag: '🇮🇱', lat: 31.8,  lng: 35.2 },
  Iraq:         { iso: 'IRQ', flag: '🇮🇶', lat: 33.3,  lng: 44.4 },
  UAE:          { iso: 'ARE', flag: '🇦🇪', lat: 24.5,  lng: 54.4 },
  Australia:    { iso: 'AUS', flag: '🇦🇺', lat: -35.3, lng: 149.1 },
  NewZealand:   { iso: 'NZL', flag: '🇳🇿', lat: -41.3, lng: 174.8 },
  Italy:        { iso: 'ITA', flag: '🇮🇹', lat: 41.9,  lng: 12.5 },
  Poland:       { iso: 'POL', flag: '🇵🇱', lat: 52.2,  lng: 21.0 },
  Netherlands:  { iso: 'NLD', flag: '🇳🇱', lat: 52.4,  lng: 4.9 },
  Belgium:      { iso: 'BEL', flag: '🇧🇪', lat: 50.8,  lng: 4.4 },
  Sweden:       { iso: 'SWE', flag: '🇸🇪', lat: 59.3,  lng: 18.1 },
  Norway:       { iso: 'NOR', flag: '🇳🇴', lat: 59.9,  lng: 10.8 },
  Switzerland:  { iso: 'CHE', flag: '🇨🇭', lat: 46.9,  lng: 7.4 },
  Portugal:     { iso: 'PRT', flag: '🇵🇹', lat: 38.7,  lng: -9.1 },
  Greece:       { iso: 'GRC', flag: '🇬🇷', lat: 38.0,  lng: 23.7 },
  Ukraine:      { iso: 'UKR', flag: '🇺🇦', lat: 50.4,  lng: 30.5 },
  Czechia:      { iso: 'CZE', flag: '🇨🇿', lat: 50.1,  lng: 14.4 },
  Hungary:      { iso: 'HUN', flag: '🇭🇺', lat: 47.5,  lng: 19.0 },
  Romania:      { iso: 'ROU', flag: '🇷🇴', lat: 44.4,  lng: 26.1 },
  Ireland:      { iso: 'IRL', flag: '🇮🇪', lat: 53.3,  lng: -6.3 },
  SouthAfrica:  { iso: 'ZAF', flag: '🇿🇦', lat: -25.7, lng: 28.2 },
  Nigeria:      { iso: 'NGA', flag: '🇳🇬', lat: 9.1,   lng: 7.5 },
  Egypt:        { iso: 'EGY', flag: '🇪🇬', lat: 30.0,  lng: 31.2 },
  Kenya:        { iso: 'KEN', flag: '🇰🇪', lat: -1.3,  lng: 36.8 },
  Morocco:      { iso: 'MAR', flag: '🇲🇦', lat: 34.0,  lng: -6.8 },
  Algeria:      { iso: 'DZA', flag: '🇩🇿', lat: 36.8,  lng: 3.0 },
  Ethiopia:     { iso: 'ETH', flag: '🇪🇹', lat: 9.0,   lng: 38.7 },
  Ghana:        { iso: 'GHA', flag: '🇬🇭', lat: 5.6,   lng: -0.2 },
  Angola:       { iso: 'AGO', flag: '🇦🇴', lat: -8.8,  lng: 13.2 },
  Tanzania:     { iso: 'TZA', flag: '🇹🇿', lat: -6.2,  lng: 35.7 },
  CongoDR:      { iso: 'COD', flag: '🇨🇩', lat: -4.3,  lng: 15.3 },
  Senegal:      { iso: 'SEN', flag: '🇸🇳', lat: 14.7,  lng: -17.4 },
  Thailand:     { iso: 'THA', flag: '🇹🇭', lat: 13.8,  lng: 100.5 },
  Vietnam:      { iso: 'VNM', flag: '🇻🇳', lat: 21.0,  lng: 105.8 },
  Philippines:  { iso: 'PHL', flag: '🇵🇭', lat: 14.6,  lng: 121.0 },
  Malaysia:     { iso: 'MYS', flag: '🇲🇾', lat: 3.1,   lng: 101.7 },
  Singapore:    { iso: 'SGP', flag: '🇸🇬', lat: 1.3,   lng: 103.8 },
  Bangladesh:   { iso: 'BGD', flag: '🇧🇩', lat: 23.8,  lng: 90.4 },
  Pakistan:     { iso: 'PAK', flag: '🇵🇰', lat: 33.7,  lng: 73.1 },
  Kazakhstan:   { iso: 'KAZ', flag: '🇰🇿', lat: 51.2,  lng: 71.4 },
  Cuba:         { iso: 'CUB', flag: '🇨🇺', lat: 23.1,  lng: -82.4 },
  Panama:       { iso: 'PAN', flag: '🇵🇦', lat: 9.0,   lng: -79.5 },
  CostaRica:    { iso: 'CRI', flag: '🇨🇷', lat: 9.9,   lng: -84.1 },
  DominicanRepublic: { iso: 'DOM', flag: '🇩🇴', lat: 18.5, lng: -69.9 },
  Guatemala:    { iso: 'GTM', flag: '🇬🇹', lat: 14.6,  lng: -90.5 },
  Honduras:     { iso: 'HND', flag: '🇭🇳', lat: 14.1,  lng: -87.2 },
  ElSalvador:   { iso: 'SLV', flag: '🇸🇻', lat: 13.7,  lng: -89.2 },
  Nicaragua:    { iso: 'NIC', flag: '🇳🇮', lat: 12.1,  lng: -86.3 }
};

function c(spec) {
  const unemployed = Math.round(spec.pop * (spec.unemp / 100) * 10) / 10;
  const milScale = Math.max(0.4, Math.sqrt(spec.gdp / 2));
  return {
    name: spec.name,
    name_en: spec.nameEn ?? spec.name,
    region: spec.region,
    capital: spec.capital,
    playable: true,
    economy: {
      gdp_trillion_usd: spec.gdp,
      gdp_growth: spec.growth,
      unemployment: spec.unemp,
      inflation: spec.infl,
      gold_reserves_tonnes: spec.gold,
      debt_to_gdp: spec.debt,
      fiscal_balance: spec.fiscal,
      tax_iva: spec.iva,
      tax_corporate: spec.corp,
      tax_income_avg: spec.income
    },
    population: {
      total_millions: spec.pop,
      male_pct: spec.male ?? 49.5,
      female_pct: spec.male ? Math.round((100 - spec.male) * 10) / 10 : 50.5,
      unemployed_millions: unemployed,
      minorities: spec.minorities,
      happiness: spec.hap,
      stability: spec.stab
    },
    military: {
      active_soldiers: spec.soldiers,
      reserves: spec.reserves ?? Math.round(spec.soldiers * 1.5),
      aircraft: spec.aircraft ?? Math.round(80 * milScale),
      submarines: spec.subs ?? 0,
      nuclear_warheads: spec.nukes ?? 0,
      tanks: spec.tanks ?? Math.round(200 * milScale),
      naval_ships: spec.ships ?? Math.round(15 * milScale),
      military_budget_bn: spec.milbud ?? Math.round(spec.gdp * 25 * 10) / 10
    },
    sectors: spec.sectors,
    relations: spec.relations,
    traits: {
      ideology: spec.ideo,
      aggression: spec.agg,
      risk_tolerance: spec.risk,
      nuclear_doctrine: spec.nukes ? spec.nukeDoc ?? 'no_first_use' : 'none',
      priorities: spec.prio
    }
  };
}

const NEW = {
  India: c({
    name: 'India', region: 'South Asia', capital: 'New Delhi',
    gdp: 3.9, growth: 6.5, unemp: 8.0, infl: 4.8, gold: 800, debt: 82, fiscal: -5.6,
    iva: 18, corp: 25, income: 20, pop: 1440, male: 52.0, hap: 58, stab: 62,
    minorities: { hindu: 80, muslim: 14, other: 6 },
    soldiers: 1450000, reserves: 1150000, aircraft: 2100, subs: 18, nukes: 170, tanks: 4600, ships: 150, milbud: 85,
    sectors: { industry: 25, agriculture: 16, services: 49, commerce: 10, tourism: 2 },
    relations: { USA: 'amistoso', China: 'tenso', Russia: 'amistoso', Pakistan: 'hostil', UK: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.35, risk: 0.45, prio: ['growth', 'contain_china', 'food', 'tech']
  }),
  Indonesia: c({
    name: 'Indonesia', region: 'Southeast Asia', capital: 'Jakarta',
    gdp: 1.4, growth: 5.0, unemp: 5.3, infl: 2.6, gold: 79, debt: 40, fiscal: -2.3,
    iva: 11, corp: 22, income: 22, pop: 279, hap: 64, stab: 60,
    minorities: { javanese: 40, sundanese: 16, other: 44 },
    soldiers: 400000, aircraft: 420, subs: 4, ships: 220, milbud: 10,
    sectors: { industry: 40, agriculture: 13, services: 43, commerce: 10, tourism: 4 },
    relations: { China: 'tenso', USA: 'amistoso', Australia: 'amistoso', Japan: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.25, risk: 0.4, prio: ['growth', 'malacca', 'islam_politics', 'nickel']
  }),
  Turkey: c({
    name: 'Turquia', nameEn: 'Turkey', region: 'West Asia', capital: 'Ankara',
    gdp: 1.1, growth: 3.2, unemp: 9.4, infl: 45, gold: 540, debt: 35, fiscal: -5.0,
    iva: 20, corp: 25, income: 27, pop: 86, hap: 48, stab: 52,
    minorities: { turkish: 75, kurdish: 18, other: 7 },
    soldiers: 355000, reserves: 380000, aircraft: 1050, tanks: 3000, ships: 115, milbud: 16,
    sectors: { industry: 31, agriculture: 7, services: 54, commerce: 12, tourism: 8 },
    relations: { USA: 'tenso', Russia: 'amistoso', Germany: 'amistoso', Iran: 'tenso', Israel: 'hostil', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.55, risk: 0.6, prio: ['regional_power', 'nato_leverage', 'industry']
  }),
  SaudiArabia: c({
    name: 'Arabia Saudita', nameEn: 'Saudi Arabia', region: 'Middle East', capital: 'Riyadh',
    gdp: 1.1, growth: 1.5, unemp: 5.0, infl: 1.8, gold: 323, debt: 30, fiscal: -2.0,
    iva: 15, corp: 20, income: 0, pop: 37, male: 57.5, hap: 61, stab: 72,
    minorities: { saudi: 58, foreign: 42 },
    soldiers: 257000, aircraft: 850, tanks: 1000, ships: 55, milbud: 75,
    sectors: { industry: 48, agriculture: 2, services: 42, commerce: 8, tourism: 3 },
    relations: { USA: 'amistoso', Iran: 'hostil', Israel: 'tenso', China: 'amistoso', UAE: 'aliado', default: 'neutral' },
    ideo: 'monarchy', agg: 0.4, risk: 0.35, prio: ['oil', 'vision2030', 'contain_iran']
  }),
  Iran: c({
    name: 'Iran', region: 'Middle East', capital: 'Tehran',
    gdp: 0.4, growth: 2.5, unemp: 9.0, infl: 35, gold: 320, debt: 35, fiscal: -4.0,
    iva: 9, corp: 25, income: 25, pop: 90, hap: 42, stab: 50,
    minorities: { persian: 61, azeri: 16, kurdish: 10, other: 13 },
    soldiers: 580000, reserves: 350000, aircraft: 350, subs: 17, nukes: 0, tanks: 1600, ships: 70, milbud: 16,
    sectors: { industry: 35, agriculture: 10, services: 47, commerce: 8, tourism: 1 },
    relations: { USA: 'hostil', Israel: 'hostil', SaudiArabia: 'hostil', Russia: 'amistoso', China: 'amistoso', default: 'tenso' },
    ideo: 'authoritarian', agg: 0.7, risk: 0.55, prio: ['hormuz', 'nuclear', 'axis']
  }),
  Israel: c({
    name: 'Israel', region: 'Middle East', capital: 'Jerusalem',
    gdp: 0.53, growth: 2.0, unemp: 3.4, infl: 2.8, gold: 0, debt: 62, fiscal: -4.5,
    iva: 17, corp: 23, income: 31, pop: 9.8, hap: 64, stab: 58,
    minorities: { jewish: 74, arab: 21, other: 5 },
    soldiers: 170000, reserves: 465000, aircraft: 600, subs: 6, nukes: 90, tanks: 1400, ships: 65, milbud: 24,
    sectors: { industry: 17, agriculture: 1, services: 70, commerce: 10, tourism: 2 },
    relations: { USA: 'aliado', Iran: 'hostil', Turkey: 'hostil', Egypt: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.65, risk: 0.7, nukeDoc: 'opacity', prio: ['security', 'tech', 'usa']
  }),
  Iraq: c({
    name: 'Irak', nameEn: 'Iraq', region: 'Middle East', capital: 'Baghdad',
    gdp: 0.25, growth: 2.8, unemp: 14, infl: 4.0, gold: 130, debt: 48, fiscal: -1.5,
    iva: 0, corp: 15, income: 15, pop: 45, hap: 40, stab: 35,
    minorities: { shia: 60, sunni: 20, kurdish: 15, other: 5 },
    soldiers: 193000, aircraft: 90, tanks: 400, ships: 8, milbud: 7,
    sectors: { industry: 48, agriculture: 5, services: 42, commerce: 5, tourism: 0 },
    relations: { Iran: 'amistoso', USA: 'tenso', SaudiArabia: 'tenso', Turkey: 'tenso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.4, risk: 0.3, prio: ['oil', 'stability', 'sovereignty']
  }),
  UAE: c({
    name: 'Emiratos Arabes Unidos', nameEn: 'United Arab Emirates', region: 'Middle East', capital: 'Abu Dhabi',
    gdp: 0.51, growth: 4.0, unemp: 2.5, infl: 2.0, gold: 74, debt: 32, fiscal: 4.0,
    iva: 5, corp: 9, income: 0, pop: 10.5, male: 69, hap: 72, stab: 80,
    minorities: { emirati: 12, foreign: 88 },
    soldiers: 65000, aircraft: 550, ships: 40, milbud: 23,
    sectors: { industry: 47, agriculture: 1, services: 44, commerce: 12, tourism: 8 },
    relations: { USA: 'amistoso', SaudiArabia: 'aliado', Iran: 'tenso', India: 'amistoso', default: 'neutral' },
    ideo: 'monarchy', agg: 0.3, risk: 0.5, prio: ['trade_hub', 'oil', 'soft_power']
  }),
  Australia: c({
    name: 'Australia', region: 'Oceania', capital: 'Canberra',
    gdp: 1.8, growth: 1.8, unemp: 4.1, infl: 3.2, gold: 80, debt: 50, fiscal: -1.5,
    iva: 10, corp: 30, income: 32, pop: 27, hap: 72, stab: 82,
    minorities: { anglo: 57, asian: 18, other: 25 },
    soldiers: 59000, aircraft: 420, subs: 6, ships: 50, milbud: 33,
    sectors: { industry: 25, agriculture: 3, services: 65, commerce: 10, tourism: 4 },
    relations: { USA: 'aliado', China: 'tenso', Japan: 'amistoso', Indonesia: 'amistoso', UK: 'aliado', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.25, risk: 0.35, prio: ['aukus', 'china_trade', 'minerals']
  }),
  NewZealand: c({
    name: 'Nueva Zelanda', nameEn: 'New Zealand', region: 'Oceania', capital: 'Wellington',
    gdp: 0.25, growth: 1.2, unemp: 4.6, infl: 3.0, gold: 0, debt: 45, fiscal: -2.5,
    iva: 15, corp: 28, income: 33, pop: 5.3, hap: 74, stab: 85,
    minorities: { european: 70, maori: 17, asian: 13 },
    soldiers: 9000, aircraft: 50, ships: 11, milbud: 3.5,
    sectors: { industry: 20, agriculture: 6, services: 66, commerce: 10, tourism: 8 },
    relations: { Australia: 'aliado', USA: 'amistoso', China: 'amistoso', UK: 'amistoso', default: 'neutral' },
    ideo: 'social_democracy', agg: 0.1, risk: 0.25, prio: ['dairy', 'pacific', 'climate']
  }),
  Italy: c({
    name: 'Italia', nameEn: 'Italy', region: 'Europe', capital: 'Rome',
    gdp: 2.3, growth: 0.7, unemp: 7.5, infl: 1.5, gold: 2452, debt: 138, fiscal: -4.0,
    iva: 22, corp: 24, income: 36, pop: 59, hap: 62, stab: 68,
    minorities: { italian: 92, other: 8 },
    soldiers: 165000, aircraft: 760, subs: 8, ships: 180, milbud: 32,
    sectors: { industry: 24, agriculture: 2, services: 66, commerce: 11, tourism: 8 },
    relations: { Germany: 'aliado', France: 'aliado', USA: 'aliado', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.2, risk: 0.3, prio: ['debt', 'eu', 'industry']
  }),
  Poland: c({
    name: 'Polonia', nameEn: 'Poland', region: 'Europe', capital: 'Warsaw',
    gdp: 0.85, growth: 2.8, unemp: 2.9, infl: 4.0, gold: 360, debt: 54, fiscal: -5.0,
    iva: 23, corp: 19, income: 32, pop: 37.5, hap: 63, stab: 70,
    minorities: { polish: 97, other: 3 },
    soldiers: 190000, aircraft: 450, tanks: 600, ships: 50, milbud: 35,
    sectors: { industry: 32, agriculture: 2, services: 58, commerce: 10, tourism: 2 },
    relations: { USA: 'aliado', Germany: 'amistoso', Ukraine: 'amistoso', Russia: 'hostil', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.4, risk: 0.4, prio: ['nato_east', 'ukraine', 'energy']
  }),
  Netherlands: c({
    name: 'Paises Bajos', nameEn: 'Netherlands', region: 'Europe', capital: 'Amsterdam',
    gdp: 1.2, growth: 1.1, unemp: 3.7, infl: 2.8, gold: 612, debt: 48, fiscal: -0.5,
    iva: 21, corp: 25, income: 37, pop: 18, hap: 75, stab: 84,
    minorities: { dutch: 76, other: 24 },
    soldiers: 41000, aircraft: 160, ships: 30, milbud: 16,
    sectors: { industry: 18, agriculture: 2, services: 70, commerce: 14, tourism: 4 },
    relations: { Germany: 'aliado', USA: 'aliado', UK: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.15, risk: 0.4, prio: ['trade_hub', 'eu', 'ports']
  }),
  Belgium: c({
    name: 'Belgica', nameEn: 'Belgium', region: 'Europe', capital: 'Brussels',
    gdp: 0.65, growth: 1.0, unemp: 5.6, infl: 2.5, gold: 227, debt: 108, fiscal: -4.5,
    iva: 21, corp: 25, income: 40, pop: 11.7, hap: 68, stab: 72,
    minorities: { flemish: 57, walloon: 32, other: 11 },
    soldiers: 25000, aircraft: 80, ships: 9, milbud: 7,
    sectors: { industry: 22, agriculture: 1, services: 69, commerce: 12, tourism: 3 },
    relations: { France: 'aliado', Germany: 'aliado', Netherlands: 'aliado', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.1, risk: 0.25, prio: ['eu_capital', 'nato_hq']
  }),
  Sweden: c({
    name: 'Suecia', nameEn: 'Sweden', region: 'Europe', capital: 'Stockholm',
    gdp: 0.6, growth: 1.2, unemp: 8.2, infl: 2.0, gold: 126, debt: 35, fiscal: -0.8,
    iva: 25, corp: 21, income: 32, pop: 10.5, hap: 76, stab: 82,
    minorities: { swedish: 80, other: 20 },
    soldiers: 24000, aircraft: 200, subs: 5, ships: 40, milbud: 12,
    sectors: { industry: 22, agriculture: 1, services: 70, commerce: 10, tourism: 3 },
    relations: { USA: 'aliado', Germany: 'aliado', Russia: 'tenso', default: 'neutral' },
    ideo: 'social_democracy', agg: 0.2, risk: 0.3, prio: ['nato', 'tech', 'welfare']
  }),
  Norway: c({
    name: 'Noruega', nameEn: 'Norway', region: 'Europe', capital: 'Oslo',
    gdp: 0.5, growth: 1.5, unemp: 3.8, infl: 2.6, gold: 37, debt: 44, fiscal: 12,
    iva: 25, corp: 22, income: 28, pop: 5.5, hap: 78, stab: 88,
    minorities: { norwegian: 83, other: 17 },
    soldiers: 23000, aircraft: 110, subs: 6, ships: 60, milbud: 9,
    sectors: { industry: 32, agriculture: 2, services: 58, commerce: 8, tourism: 3 },
    relations: { USA: 'aliado', UK: 'aliado', Russia: 'tenso', default: 'neutral' },
    ideo: 'social_democracy', agg: 0.15, risk: 0.25, prio: ['oil_fund', 'arctic', 'nato']
  }),
  Switzerland: c({
    name: 'Suiza', nameEn: 'Switzerland', region: 'Europe', capital: 'Bern',
    gdp: 0.9, growth: 1.3, unemp: 2.4, infl: 1.2, gold: 1040, debt: 38, fiscal: 0.5,
    iva: 8, corp: 15, income: 22, pop: 8.9, hap: 80, stab: 92,
    minorities: { german: 62, french: 23, italian: 8, other: 7 },
    soldiers: 20000, reserves: 140000, aircraft: 80, milbud: 6,
    sectors: { industry: 25, agriculture: 1, services: 71, commerce: 10, tourism: 3 },
    relations: { Germany: 'amistoso', France: 'amistoso', USA: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.05, risk: 0.15, prio: ['finance', 'neutrality', 'pharma']
  }),
  Portugal: c({
    name: 'Portugal', region: 'Europe', capital: 'Lisbon',
    gdp: 0.3, growth: 1.8, unemp: 6.4, infl: 2.4, gold: 383, debt: 98, fiscal: -0.8,
    iva: 23, corp: 21, income: 28, pop: 10.4, hap: 66, stab: 75,
    minorities: { portuguese: 95, other: 5 },
    soldiers: 27000, aircraft: 90, ships: 20, milbud: 4,
    sectors: { industry: 19, agriculture: 2, services: 69, commerce: 10, tourism: 12 },
    relations: { Spain: 'aliado', Brazil: 'amistoso', USA: 'amistoso', default: 'neutral' },
    ideo: 'social_democracy', agg: 0.1, risk: 0.25, prio: ['eu', 'tourism', 'lusophone']
  }),
  Greece: c({
    name: 'Grecia', nameEn: 'Greece', region: 'Europe', capital: 'Athens',
    gdp: 0.24, growth: 2.0, unemp: 10.0, infl: 2.8, gold: 114, debt: 162, fiscal: -1.0,
    iva: 24, corp: 22, income: 22, pop: 10.4, hap: 55, stab: 62,
    minorities: { greek: 93, other: 7 },
    soldiers: 142000, aircraft: 350, ships: 70, milbud: 7,
    sectors: { industry: 16, agriculture: 4, services: 68, commerce: 10, tourism: 18 },
    relations: { France: 'amistoso', Turkey: 'tenso', Germany: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.3, risk: 0.3, prio: ['debt', 'aegean', 'tourism']
  }),
  Ukraine: c({
    name: 'Ucrania', nameEn: 'Ukraine', region: 'Europe', capital: 'Kyiv',
    gdp: 0.18, growth: 3.5, unemp: 18, infl: 8.0, gold: 27, debt: 90, fiscal: -18,
    iva: 20, corp: 18, income: 18, pop: 37, hap: 38, stab: 32,
    minorities: { ukrainian: 78, russian: 17, other: 5 },
    soldiers: 900000, aircraft: 200, tanks: 1500, ships: 20, milbud: 30,
    sectors: { industry: 20, agriculture: 10, services: 62, commerce: 8, tourism: 1 },
    relations: { USA: 'aliado', Poland: 'aliado', Russia: 'hostil', Germany: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.5, risk: 0.4, prio: ['survival', 'eu', 'grain']
  }),
  Czechia: c({
    name: 'Chequia', nameEn: 'Czechia', region: 'Europe', capital: 'Prague',
    gdp: 0.33, growth: 1.5, unemp: 2.6, infl: 2.5, gold: 12, debt: 44, fiscal: -2.5,
    iva: 21, corp: 21, income: 15, pop: 10.9, hap: 67, stab: 78,
    minorities: { czech: 64, moravian: 5, other: 31 },
    soldiers: 27000, aircraft: 40, tanks: 120, milbud: 5,
    sectors: { industry: 35, agriculture: 2, services: 55, commerce: 10, tourism: 3 },
    relations: { Germany: 'aliado', Poland: 'amistoso', USA: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.2, risk: 0.3, prio: ['industry', 'eu', 'energy']
  }),
  Hungary: c({
    name: 'Hungria', nameEn: 'Hungary', region: 'Europe', capital: 'Budapest',
    gdp: 0.22, growth: 1.0, unemp: 4.3, infl: 4.5, gold: 94, debt: 74, fiscal: -5.0,
    iva: 27, corp: 9, income: 15, pop: 9.6, hap: 55, stab: 60,
    minorities: { hungarian: 85, other: 15 },
    soldiers: 22000, aircraft: 30, tanks: 50, milbud: 5,
    sectors: { industry: 30, agriculture: 3, services: 59, commerce: 10, tourism: 4 },
    relations: { Germany: 'tenso', Russia: 'amistoso', Poland: 'amistoso', USA: 'tenso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.25, risk: 0.45, prio: ['sovereignty', 'illiberal', 'eu_funds']
  }),
  Romania: c({
    name: 'Rumania', nameEn: 'Romania', region: 'Europe', capital: 'Bucharest',
    gdp: 0.35, growth: 2.2, unemp: 5.5, infl: 5.5, gold: 104, debt: 50, fiscal: -6.0,
    iva: 19, corp: 16, income: 10, pop: 19, hap: 58, stab: 64,
    minorities: { romanian: 89, hungarian: 6, other: 5 },
    soldiers: 70000, aircraft: 80, tanks: 400, milbud: 8,
    sectors: { industry: 28, agriculture: 4, services: 60, commerce: 10, tourism: 2 },
    relations: { USA: 'aliado', France: 'amistoso', Russia: 'tenso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.25, risk: 0.3, prio: ['nato_east', 'energy', 'eu']
  }),
  Ireland: c({
    name: 'Irlanda', nameEn: 'Ireland', region: 'Europe', capital: 'Dublin',
    gdp: 0.55, growth: 2.5, unemp: 4.4, infl: 2.2, gold: 6, debt: 43, fiscal: 1.5,
    iva: 23, corp: 15, income: 40, pop: 5.3, hap: 73, stab: 80,
    minorities: { irish: 82, other: 18 },
    soldiers: 8500, aircraft: 0, ships: 8, milbud: 1.2,
    sectors: { industry: 38, agriculture: 1, services: 55, commerce: 8, tourism: 4 },
    relations: { UK: 'amistoso', USA: 'amistoso', France: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.05, risk: 0.4, prio: ['tech_fdi', 'neutrality', 'eu']
  }),
  SouthAfrica: c({
    name: 'Sudafrica', nameEn: 'South Africa', region: 'Africa', capital: 'Pretoria',
    gdp: 0.4, growth: 1.0, unemp: 32, infl: 4.8, gold: 125, debt: 75, fiscal: -5.0,
    iva: 15, corp: 27, income: 31, pop: 63, hap: 48, stab: 50,
    minorities: { black: 81, coloured: 9, white: 7, indian: 3 },
    soldiers: 74000, aircraft: 220, ships: 40, milbud: 3,
    sectors: { industry: 25, agriculture: 2, services: 61, commerce: 12, tourism: 3 },
    relations: { China: 'amistoso', USA: 'neutral', Russia: 'amistoso', default: 'neutral' },
    ideo: 'social_democracy', agg: 0.2, risk: 0.35, prio: ['brics', 'minerals', 'inequality']
  }),
  Nigeria: c({
    name: 'Nigeria', region: 'Africa', capital: 'Abuja',
    gdp: 0.25, growth: 3.2, unemp: 33, infl: 28, gold: 21, debt: 50, fiscal: -4.0,
    iva: 7.5, corp: 30, income: 24, pop: 227, hap: 45, stab: 40,
    minorities: { hausa: 30, yoruba: 21, igbo: 18, other: 31 },
    soldiers: 135000, aircraft: 130, ships: 75, milbud: 3.2,
    sectors: { industry: 22, agriculture: 24, services: 46, commerce: 10, tourism: 1 },
    relations: { USA: 'amistoso', China: 'amistoso', UK: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.3, risk: 0.4, prio: ['oil', 'security', 'demography']
  }),
  Egypt: c({
    name: 'Egipto', nameEn: 'Egypt', region: 'Africa', capital: 'Cairo',
    gdp: 0.4, growth: 3.8, unemp: 7.0, infl: 25, gold: 126, debt: 96, fiscal: -3.5,
    iva: 14, corp: 22, income: 25, pop: 114, hap: 50, stab: 55,
    minorities: { arab: 99, other: 1 },
    soldiers: 440000, reserves: 480000, aircraft: 1050, tanks: 4500, ships: 320, milbud: 5,
    sectors: { industry: 32, agriculture: 11, services: 50, commerce: 10, tourism: 5 },
    relations: { USA: 'amistoso', Israel: 'amistoso', SaudiArabia: 'amistoso', Iran: 'tenso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.4, risk: 0.35, prio: ['suez', 'imf', 'stability']
  }),
  Kenya: c({
    name: 'Kenia', nameEn: 'Kenya', region: 'Africa', capital: 'Nairobi',
    gdp: 0.12, growth: 5.0, unemp: 5.5, infl: 6.0, gold: 0, debt: 70, fiscal: -5.5,
    iva: 16, corp: 30, income: 25, pop: 55, hap: 52, stab: 55,
    minorities: { kikuyu: 17, luhya: 14, other: 69 },
    soldiers: 24000, aircraft: 40, milbud: 1.2,
    sectors: { industry: 16, agriculture: 22, services: 55, commerce: 10, tourism: 8 },
    relations: { USA: 'amistoso', China: 'amistoso', UK: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.2, risk: 0.4, prio: ['east_africa_hub', 'debt', 'climate']
  }),
  Morocco: c({
    name: 'Marruecos', nameEn: 'Morocco', region: 'Africa', capital: 'Rabat',
    gdp: 0.15, growth: 3.0, unemp: 13, infl: 2.5, gold: 22, debt: 70, fiscal: -4.5,
    iva: 20, corp: 31, income: 38, pop: 38, hap: 58, stab: 68,
    minorities: { arab_berber: 99, other: 1 },
    soldiers: 195000, aircraft: 280, tanks: 600, ships: 70, milbud: 5,
    sectors: { industry: 25, agriculture: 12, services: 55, commerce: 10, tourism: 8 },
    relations: { France: 'amistoso', Spain: 'tenso', USA: 'amistoso', Algeria: 'hostil', default: 'neutral' },
    ideo: 'monarchy', agg: 0.3, risk: 0.35, prio: ['sahara', 'eu_trade', 'phosphate']
  }),
  Algeria: c({
    name: 'Argelia', nameEn: 'Algeria', region: 'Africa', capital: 'Algiers',
    gdp: 0.25, growth: 3.0, unemp: 12, infl: 6.0, gold: 174, debt: 55, fiscal: -3.0,
    iva: 19, corp: 26, income: 35, pop: 46, hap: 50, stab: 58,
    minorities: { arab_berber: 99, other: 1 },
    soldiers: 130000, aircraft: 250, tanks: 1200, ships: 70, milbud: 18,
    sectors: { industry: 45, agriculture: 12, services: 40, commerce: 6, tourism: 1 },
    relations: { France: 'tenso', Russia: 'amistoso', Morocco: 'hostil', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.4, risk: 0.3, prio: ['gas', 'sahara', 'non_aligned']
  }),
  Ethiopia: c({
    name: 'Etiopia', nameEn: 'Ethiopia', region: 'Africa', capital: 'Addis Ababa',
    gdp: 0.16, growth: 6.5, unemp: 18, infl: 20, gold: 0.3, debt: 40, fiscal: -3.0,
    iva: 15, corp: 30, income: 35, pop: 129, hap: 46, stab: 40,
    minorities: { oromo: 35, amhara: 27, other: 38 },
    soldiers: 150000, aircraft: 80, tanks: 300, milbud: 0.5,
    sectors: { industry: 22, agriculture: 32, services: 40, commerce: 6, tourism: 2 },
    relations: { China: 'amistoso', USA: 'tenso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.45, risk: 0.4, prio: ['nile', 'growth', 'federation']
  }),
  Ghana: c({
    name: 'Ghana', region: 'Africa', capital: 'Accra',
    gdp: 0.08, growth: 3.5, unemp: 14, infl: 18, gold: 9, debt: 84, fiscal: -5.0,
    iva: 15, corp: 25, income: 25, pop: 34, hap: 55, stab: 60,
    minorities: { akan: 48, other: 52 },
    soldiers: 15500, milbud: 0.3,
    sectors: { industry: 32, agriculture: 20, services: 42, commerce: 8, tourism: 3 },
    relations: { USA: 'amistoso', China: 'amistoso', UK: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.15, risk: 0.35, prio: ['cocoa', 'gold', 'democracy']
  }),
  Angola: c({
    name: 'Angola', region: 'Africa', capital: 'Luanda',
    gdp: 0.09, growth: 2.5, unemp: 15, infl: 18, gold: 0, debt: 60, fiscal: -1.0,
    iva: 14, corp: 25, income: 17, pop: 37, hap: 44, stab: 50,
    minorities: { ovimbundu: 37, other: 63 },
    soldiers: 107000, aircraft: 270, milbud: 1.5,
    sectors: { industry: 42, agriculture: 10, services: 43, commerce: 5, tourism: 1 },
    relations: { China: 'amistoso', Portugal: 'amistoso', USA: 'neutral', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.25, risk: 0.3, prio: ['oil', 'cabinda', 'china']
  }),
  Tanzania: c({
    name: 'Tanzania', region: 'Africa', capital: 'Dodoma',
    gdp: 0.08, growth: 5.5, unemp: 9, infl: 3.5, gold: 0, debt: 48, fiscal: -3.5,
    iva: 18, corp: 30, income: 30, pop: 67, hap: 54, stab: 62,
    minorities: { sukuma: 16, other: 84 },
    soldiers: 27000, milbud: 0.8,
    sectors: { industry: 28, agriculture: 26, services: 40, commerce: 6, tourism: 8 },
    relations: { China: 'amistoso', India: 'amistoso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.15, risk: 0.25, prio: ['ports', 'minerals', 'union']
  }),
  CongoDR: c({
    name: 'Republica Democratica del Congo', nameEn: 'DR Congo', region: 'Africa', capital: 'Kinshasa',
    gdp: 0.07, growth: 6.0, unemp: 12, infl: 12, gold: 0, debt: 15, fiscal: -1.5,
    iva: 16, corp: 30, income: 30, pop: 102, hap: 38, stab: 28,
    minorities: { kongo: 16, luba: 18, other: 66 },
    soldiers: 135000, milbud: 0.4,
    sectors: { industry: 45, agriculture: 20, services: 32, commerce: 3, tourism: 0 },
    relations: { China: 'amistoso', USA: 'neutral', Rwanda: 'hostil', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.35, risk: 0.3, prio: ['minerals', 'east_conflict', 'state']
  }),
  Senegal: c({
    name: 'Senegal', region: 'Africa', capital: 'Dakar',
    gdp: 0.03, growth: 5.0, unemp: 20, infl: 3.5, gold: 0, debt: 80, fiscal: -5.0,
    iva: 18, corp: 30, income: 40, pop: 18, hap: 56, stab: 62,
    minorities: { wolof: 43, other: 57 },
    soldiers: 17000, milbud: 0.4,
    sectors: { industry: 22, agriculture: 16, services: 54, commerce: 8, tourism: 5 },
    relations: { France: 'amistoso', USA: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.15, risk: 0.3, prio: ['democracy', 'sahel', 'ports']
  }),
  Thailand: c({
    name: 'Tailandia', nameEn: 'Thailand', region: 'Southeast Asia', capital: 'Bangkok',
    gdp: 0.5, growth: 2.5, unemp: 1.1, infl: 1.0, gold: 244, debt: 62, fiscal: -3.0,
    iva: 7, corp: 20, income: 25, pop: 72, hap: 62, stab: 58,
    minorities: { thai: 98, other: 2 },
    soldiers: 360000, aircraft: 470, ships: 80, milbud: 6,
    sectors: { industry: 35, agriculture: 8, services: 49, commerce: 10, tourism: 12 },
    relations: { USA: 'amistoso', China: 'amistoso', Japan: 'amistoso', default: 'neutral' },
    ideo: 'monarchy', agg: 0.25, risk: 0.3, prio: ['tourism', 'export', 'palace']
  }),
  Vietnam: c({
    name: 'Vietnam', region: 'Southeast Asia', capital: 'Hanoi',
    gdp: 0.45, growth: 6.0, unemp: 2.2, infl: 3.5, gold: 0, debt: 38, fiscal: -3.5,
    iva: 10, corp: 20, income: 20, pop: 100, hap: 64, stab: 72,
    minorities: { viet: 85, other: 15 },
    soldiers: 470000, aircraft: 280, subs: 6, ships: 100, milbud: 7,
    sectors: { industry: 38, agriculture: 12, services: 42, commerce: 10, tourism: 4 },
    relations: { USA: 'amistoso', China: 'tenso', Russia: 'amistoso', default: 'neutral' },
    ideo: 'authoritarian_state_capitalism', agg: 0.3, risk: 0.4, prio: ['export', 'south_china_sea', 'party']
  }),
  Philippines: c({
    name: 'Filipinas', nameEn: 'Philippines', region: 'Southeast Asia', capital: 'Manila',
    gdp: 0.45, growth: 5.5, unemp: 4.3, infl: 3.2, gold: 164, debt: 60, fiscal: -4.0,
    iva: 12, corp: 25, income: 25, pop: 115, hap: 63, stab: 55,
    minorities: { tagalog: 28, other: 72 },
    soldiers: 150000, aircraft: 170, ships: 90, milbud: 4,
    sectors: { industry: 30, agriculture: 9, services: 53, commerce: 10, tourism: 5 },
    relations: { USA: 'aliado', China: 'tenso', Japan: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.3, risk: 0.45, prio: ['south_china_sea', 'remittances', 'usa']
  }),
  Malaysia: c({
    name: 'Malasia', nameEn: 'Malaysia', region: 'Southeast Asia', capital: 'Kuala Lumpur',
    gdp: 0.45, growth: 4.5, unemp: 3.3, infl: 2.0, gold: 39, debt: 66, fiscal: -4.5,
    iva: 8, corp: 24, income: 26, pop: 34, hap: 65, stab: 68,
    minorities: { malay: 69, chinese: 23, indian: 7, other: 1 },
    soldiers: 113000, aircraft: 170, ships: 60, milbud: 4,
    sectors: { industry: 37, agriculture: 8, services: 47, commerce: 10, tourism: 6 },
    relations: { China: 'amistoso', USA: 'amistoso', Singapore: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.2, risk: 0.35, prio: ['malacca', 'palm', 'islam']
  }),
  Singapore: c({
    name: 'Singapur', nameEn: 'Singapore', region: 'Southeast Asia', capital: 'Singapore',
    gdp: 0.5, growth: 2.5, unemp: 2.1, infl: 2.5, gold: 222, debt: 168, fiscal: 3.0,
    iva: 9, corp: 17, income: 22, pop: 5.9, hap: 70, stab: 90,
    minorities: { chinese: 76, malay: 15, indian: 7, other: 2 },
    soldiers: 51000, reserves: 250000, aircraft: 200, ships: 40, milbud: 16,
    sectors: { industry: 25, agriculture: 0, services: 70, commerce: 16, tourism: 4 },
    relations: { USA: 'amistoso', China: 'amistoso', Malaysia: 'amistoso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.15, risk: 0.3, prio: ['hub', 'malacca', 'finance']
  }),
  Bangladesh: c({
    name: 'Bangladesh', region: 'South Asia', capital: 'Dhaka',
    gdp: 0.45, growth: 6.0, unemp: 5.0, infl: 9.5, gold: 14, debt: 40, fiscal: -4.5,
    iva: 15, corp: 27, income: 25, pop: 173, hap: 55, stab: 50,
    minorities: { bengali: 98, other: 2 },
    soldiers: 160000, aircraft: 80, ships: 50, milbud: 4.5,
    sectors: { industry: 33, agriculture: 12, services: 50, commerce: 8, tourism: 1 },
    relations: { India: 'amistoso', China: 'amistoso', USA: 'amistoso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.2, risk: 0.3, prio: ['garments', 'climate', 'growth']
  }),
  Pakistan: c({
    name: 'Pakistan', region: 'South Asia', capital: 'Islamabad',
    gdp: 0.35, growth: 2.5, unemp: 8.0, infl: 12, gold: 65, debt: 78, fiscal: -7.0,
    iva: 18, corp: 29, income: 20, pop: 241, hap: 46, stab: 38,
    minorities: { punjabi: 45, pashtun: 15, sindhi: 14, other: 26 },
    soldiers: 654000, aircraft: 1400, subs: 8, nukes: 170, tanks: 2500, ships: 100, milbud: 10,
    sectors: { industry: 20, agriculture: 22, services: 52, commerce: 8, tourism: 1 },
    relations: { China: 'aliado', India: 'hostil', USA: 'tenso', SaudiArabia: 'amistoso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.55, risk: 0.4, prio: ['india', 'imf', 'army']
  }),
  Kazakhstan: c({
    name: 'Kazajistan', nameEn: 'Kazakhstan', region: 'Central Asia', capital: 'Astana',
    gdp: 0.26, growth: 4.0, unemp: 4.8, infl: 8.0, gold: 400, debt: 25, fiscal: -2.0,
    iva: 12, corp: 20, income: 10, pop: 20, hap: 60, stab: 70,
    minorities: { kazakh: 70, russian: 15, other: 15 },
    soldiers: 45000, aircraft: 200, tanks: 300, milbud: 1.5,
    sectors: { industry: 32, agriculture: 5, services: 55, commerce: 8, tourism: 1 },
    relations: { Russia: 'aliado', China: 'amistoso', USA: 'neutral', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.2, risk: 0.25, prio: ['oil', 'multivector', 'steppe']
  }),
  Cuba: c({
    name: 'Cuba', region: 'Caribbean', capital: 'Havana',
    gdp: 0.1, growth: -1.5, unemp: 3.0, infl: 30, gold: 0, debt: 50, fiscal: -8.0,
    iva: 0, corp: 35, income: 0, pop: 11, hap: 42, stab: 55,
    minorities: { white: 64, mestizo: 27, black: 9 },
    soldiers: 49000, reserves: 39000, aircraft: 80, milbud: 0.5,
    sectors: { industry: 22, agriculture: 4, services: 68, commerce: 4, tourism: 8 },
    relations: { USA: 'hostil', China: 'amistoso', Russia: 'amistoso', Venezuela: 'aliado', default: 'neutral' },
    ideo: 'socialist', agg: 0.2, risk: 0.2, prio: ['embargo', 'tourism', 'medicine']
  }),
  Panama: c({
    name: 'Panama', region: 'Central America', capital: 'Panama City',
    gdp: 0.08, growth: 4.5, unemp: 8.0, infl: 1.5, gold: 0, debt: 55, fiscal: -3.0,
    iva: 7, corp: 25, income: 25, pop: 4.5, hap: 62, stab: 65,
    minorities: { mestizo: 65, other: 35 },
    soldiers: 0, reserves: 20000, aircraft: 0, ships: 20, milbud: 0.8,
    sectors: { industry: 16, agriculture: 2, services: 70, commerce: 14, tourism: 8 },
    relations: { USA: 'amistoso', China: 'amistoso', Colombia: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.1, risk: 0.35, prio: ['canal', 'finance', 'logistics']
  }),
  CostaRica: c({
    name: 'Costa Rica', region: 'Central America', capital: 'San Jose',
    gdp: 0.07, growth: 3.5, unemp: 8.0, infl: 1.5, gold: 0, debt: 60, fiscal: -3.5,
    iva: 13, corp: 30, income: 25, pop: 5.2, hap: 70, stab: 80,
    minorities: { white_mestizo: 84, other: 16 },
    soldiers: 0, reserves: 0, aircraft: 0, milbud: 0.5,
    sectors: { industry: 19, agriculture: 5, services: 68, commerce: 10, tourism: 12 },
    relations: { USA: 'amistoso', China: 'amistoso', default: 'neutral' },
    ideo: 'social_democracy', agg: 0.05, risk: 0.25, prio: ['no_army', 'eco', 'tech']
  }),
  DominicanRepublic: c({
    name: 'Republica Dominicana', nameEn: 'Dominican Republic', region: 'Caribbean', capital: 'Santo Domingo',
    gdp: 0.12, growth: 4.5, unemp: 5.5, infl: 3.5, gold: 0.6, debt: 58, fiscal: -3.0,
    iva: 18, corp: 27, income: 25, pop: 11.3, hap: 60, stab: 62,
    minorities: { mixed: 73, white: 16, black: 11 },
    soldiers: 56000, milbud: 0.8,
    sectors: { industry: 30, agriculture: 6, services: 56, commerce: 10, tourism: 16 },
    relations: { USA: 'amistoso', Haiti: 'tenso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.15, risk: 0.35, prio: ['tourism', 'remittances', 'haiti']
  }),
  Guatemala: c({
    name: 'Guatemala', region: 'Central America', capital: 'Guatemala City',
    gdp: 0.1, growth: 3.5, unemp: 2.5, infl: 4.0, gold: 7, debt: 30, fiscal: -1.5,
    iva: 12, corp: 25, income: 7, pop: 18, hap: 52, stab: 48,
    minorities: { mestizo: 56, maya: 42, other: 2 },
    soldiers: 18000, milbud: 0.3,
    sectors: { industry: 22, agriculture: 10, services: 60, commerce: 10, tourism: 4 },
    relations: { USA: 'amistoso', Mexico: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.2, risk: 0.3, prio: ['migration', 'corruption', 'coffee']
  }),
  Honduras: c({
    name: 'Honduras', region: 'Central America', capital: 'Tegucigalpa',
    gdp: 0.035, growth: 3.2, unemp: 8.0, infl: 5.0, gold: 0.7, debt: 50, fiscal: -3.5,
    iva: 15, corp: 25, income: 25, pop: 10.6, hap: 48, stab: 42,
    minorities: { mestizo: 90, other: 10 },
    soldiers: 15000, milbud: 0.4,
    sectors: { industry: 26, agriculture: 12, services: 54, commerce: 8, tourism: 3 },
    relations: { USA: 'amistoso', default: 'neutral' },
    ideo: 'liberal_democracy', agg: 0.2, risk: 0.3, prio: ['gangs', 'migration', 'usa']
  }),
  ElSalvador: c({
    name: 'El Salvador', region: 'Central America', capital: 'San Salvador',
    gdp: 0.035, growth: 2.8, unemp: 5.5, infl: 1.5, gold: 0, debt: 85, fiscal: -4.0,
    iva: 13, corp: 30, income: 30, pop: 6.3, hap: 58, stab: 55,
    minorities: { mestizo: 86, other: 14 },
    soldiers: 25000, milbud: 0.3,
    sectors: { industry: 25, agriculture: 5, services: 62, commerce: 10, tourism: 5 },
    relations: { USA: 'tenso', China: 'amistoso', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.35, risk: 0.55, prio: ['bitcoin', 'gangs', 'strongman']
  }),
  Nicaragua: c({
    name: 'Nicaragua', region: 'Central America', capital: 'Managua',
    gdp: 0.017, growth: 3.5, unemp: 5.0, infl: 5.5, gold: 0, debt: 45, fiscal: -2.0,
    iva: 15, corp: 30, income: 15, pop: 6.9, hap: 44, stab: 45,
    minorities: { mestizo: 69, white: 17, other: 14 },
    soldiers: 12000, milbud: 0.1,
    sectors: { industry: 24, agriculture: 15, services: 54, commerce: 7, tourism: 4 },
    relations: { USA: 'hostil', Russia: 'amistoso', Cuba: 'aliado', Venezuela: 'aliado', default: 'neutral' },
    ideo: 'authoritarian', agg: 0.3, risk: 0.25, prio: ['canal_dream', 'russia', 'family']
  })
};

// CongoDR relations referenced Rwanda which is not in the set — strip unknown later

const srcPath = resolve(root, 'engine/countries_mvp.json');
const src = JSON.parse(readFileSync(srcPath, 'utf-8'));

let added = 0;
for (const [code, body] of Object.entries(NEW)) {
  if (src.countries[code]) continue;
  // drop relation keys that don't exist yet (plus the ones we are adding)
  const known = new Set([...Object.keys(src.countries), ...Object.keys(NEW), 'default']);
  const rel = {};
  for (const [k, v] of Object.entries(body.relations)) {
    if (known.has(k)) rel[k] = v;
  }
  body.relations = rel;
  src.countries[code] = body;
  added++;
}

src.meta.countries_count = Object.keys(src.countries).length;
src.meta.notes = 'Datos logicos y proporcionales, no exactos. Todos los listados son jugables.';

writeFileSync(srcPath, JSON.stringify(src, null, 2) + '\n');
console.log(`OK: +${added} paises, total ${src.meta.countries_count}`);

// patch META in build-data.mjs
const buildPath = resolve(root, 'scripts/build-data.mjs');
let build = readFileSync(buildPath, 'utf-8');
if (!build.includes('India:')) {
  const extra = Object.entries(META_ADD).map(([k, v]) =>
    `  ${k}:`.padEnd(14) + `{ iso: '${v.iso}', flag: '${v.flag}', lat: ${String(v.lat).padStart(5)}, lng: ${String(v.lng).padStart(6)} }`
  ).join(',\n') + '\n';
  build = build.replace(
    "  Suriname:   { iso: 'SUR', flag: '🇸🇷', lat: 5.9,   lng: -55.2 }\n};",
    "  Suriname:   { iso: 'SUR', flag: '🇸🇷', lat: 5.9,   lng: -55.2 },\n" + extra + '};'
  );
  writeFileSync(buildPath, build);
  console.log('OK: META actualizado');
} else {
  console.log('META ya tenia India, no toco build-data.mjs');
}

export { META_ADD, NEW };
