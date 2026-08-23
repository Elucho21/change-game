/**
 * Actualiza engine/countries_mvp.json con macro 2026 (FMI WEO abril 2026)
 * + militar SIPRI + oro WGC + previsional/empleo por pais.
 *
 * Uso: node scripts/update-macro.mjs
 * Requiere engine/_weo_raw.json (descarga IMF Datamapper).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const weo = JSON.parse(readFileSync(resolve(root, 'engine/_weo_raw.json'), 'utf8'));
const src = JSON.parse(readFileSync(resolve(root, 'engine/countries_mvp.json'), 'utf8'));

const ISO = {
  USA: 'USA', China: 'CHN', Russia: 'RUS', Japan: 'JPN', SouthKorea: 'KOR', NorthKorea: 'PRK',
  UK: 'GBR', France: 'FRA', Germany: 'DEU', Spain: 'ESP', Canada: 'CAN', Mexico: 'MEX',
  Brazil: 'BRA', Argentina: 'ARG', Chile: 'CHL', Colombia: 'COL', Peru: 'PER', Venezuela: 'VEN',
  Ecuador: 'ECU', Bolivia: 'BOL', Paraguay: 'PRY', Uruguay: 'URY', Guyana: 'GUY', Suriname: 'SUR',
  India: 'IND', Indonesia: 'IDN', Turkey: 'TUR', SaudiArabia: 'SAU', Iran: 'IRN', Israel: 'ISR',
  Iraq: 'IRQ', UAE: 'ARE', Australia: 'AUS', NewZealand: 'NZL', Italy: 'ITA', Poland: 'POL',
  Netherlands: 'NLD', Belgium: 'BEL', Sweden: 'SWE', Norway: 'NOR', Switzerland: 'CHE',
  Portugal: 'PRT', Greece: 'GRC', Ukraine: 'UKR', Czechia: 'CZE', Hungary: 'HUN', Romania: 'ROU',
  Ireland: 'IRL', SouthAfrica: 'ZAF', Nigeria: 'NGA', Egypt: 'EGY', Kenya: 'KEN', Morocco: 'MAR',
  Algeria: 'DZA', Ethiopia: 'ETH', Ghana: 'GHA', Angola: 'AGO', Tanzania: 'TZA', CongoDR: 'COD',
  Senegal: 'SEN', Thailand: 'THA', Vietnam: 'VNM', Philippines: 'PHL', Malaysia: 'MYS',
  Singapore: 'SGP', Bangladesh: 'BGD', Pakistan: 'PAK', Kazakhstan: 'KAZ', Cuba: 'CUB',
  Panama: 'PAN', CostaRica: 'CRI', DominicanRepublic: 'DOM', Guatemala: 'GTM', Honduras: 'HND',
  ElSalvador: 'SLV', Nicaragua: 'NIC'
};

const YEAR = 2026;

function weoVal(ind, iso) {
  const s = weo[ind]?.[iso];
  if (!s) return null;
  if (s[YEAR] != null && Number.isFinite(s[YEAR])) return s[YEAR];
  if (s[YEAR - 1] != null && Number.isFinite(s[YEAR - 1])) return s[YEAR - 1];
  return null;
}

function r(n, d) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function gdpT(billions) {
  const t = billions / 1000;
  if (t >= 10) return r(t, 1);
  if (t >= 1) return r(t, 2);
  if (t >= 0.1) return r(t, 3);
  return r(t, 4);
}

/** SIPRI 2024/25, miles de millones USD. Si falta, se escala el % anterior. */
const SIPRI = {
  USA: 997, China: 314, Russia: 149, Germany: 88, India: 86, UK: 82, SaudiArabia: 80,
  Ukraine: 65, France: 65, Japan: 55, SouthKorea: 48, Israel: 47, Italy: 38, Poland: 38,
  Australia: 34, Canada: 29, Spain: 25, Netherlands: 23, Brazil: 21, Algeria: 21,
  Turkey: 19, Sweden: 12, Singapore: 13, Colombia: 11, Mexico: 12, Norway: 10,
  Pakistan: 10, Indonesia: 9.5, Iran: 8, Romania: 8, Greece: 8, Belgium: 7.5,
  Iraq: 7, Egypt: 5.2, Morocco: 5.5, Argentina: 4.2, SouthAfrica: 3.1, Chile: 5.5,
  UAE: 23, Switzerland: 6.5, Portugal: 4.2, Czechia: 6.5, Hungary: 5.5, Thailand: 6.2,
  Vietnam: 7.3, Philippines: 4.4, Malaysia: 4.2, Bangladesh: 4.6, Kazakhstan: 1.8,
  Nigeria: 3.4, Kenya: 1.3, Ghana: 0.4, Angola: 1.6, Peru: 2.9, Ecuador: 2.4,
  Uruguay: 1.4, NewZealand: 3.6, Ireland: 1.4, Finland: 6.8
};

/** Toneladas, World Gold Council 2025 (reservas oficiales). */
const GOLD = {
  USA: 8133, Germany: 3352, Italy: 2452, France: 2437, Russia: 2336, China: 2292,
  Switzerland: 1040, Japan: 846, India: 880, Netherlands: 612, Turkey: 571,
  Poland: 448, Portugal: 383, Uzbekistan: 365, SaudiArabia: 323, UK: 310,
  Kazakhstan: 294, Spain: 282, Austria: 280, Thailand: 235, Belgium: 227,
  Singapore: 220, Algeria: 174, Iraq: 153, Venezuela: 161, Libya: 117,
  Philippines: 128, Sweden: 126, SouthAfrica: 125, Mexico: 120, Greece: 114,
  Romania: 104, SouthKorea: 104, Australia: 80, Kuwait: 79, Indonesia: 79,
  Egypt: 127, Brazil: 130, Denmark: 67, Pakistan: 65, Argentina: 62,
  Finland: 49, Belarus: 54, Bulgaria: 41, Malaysia: 39, Peru: 35, Slovakia: 32,
  Bolivia: 23, Ecuador: 26, Qatar: 110, UAE: 74, Colombia: 4.7, Chile: 0.25,
  Canada: 0, Norway: 37, Hungary: 94, Czechia: 51, Israel: 0, NewZealand: 0
};

/**
 * Previsional y empleo. Fuentes: OECD SOCX / Pensions at a Glance, ISSA, ILO informal,
 * leyes nacionales 2025-2026. Coverage = ocupados que aportan. informal = % ocupados.
 * pension_spend_pct_gdp = gasto publico en pensiones % PBI.
 */
const SOCIAL = {
  USA: [67, 67, 7.1, 0.062, 0.062, 0.39, 0.90, 0.08, 0.28, 86, 10],
  China: [60, 55, 6.8, 0.08, 0.16, 0.45, 0.68, 0.20, 0.22, 62, 32],
  Russia: [65, 60, 7.2, 0.0, 0.22, 0.40, 0.75, 0.15, 0.26, 78, 16],
  Japan: [65, 65, 9.4, 0.0915, 0.0915, 0.39, 0.95, 0.04, 0.50, 88, 8],
  SouthKorea: [63, 63, 3.6, 0.045, 0.045, 0.43, 0.82, 0.10, 0.24, 74, 16],
  NorthKorea: [60, 55, 4.0, 0.0, 0.20, 0.30, 0.95, 0.05, 0.18, 90, 5],
  UK: [66, 66, 5.1, 0.08, 0.138, 0.29, 0.92, 0.06, 0.30, 86, 10],
  France: [64, 64, 13.8, 0.111, 0.165, 0.74, 0.90, 0.08, 0.35, 86, 8],
  Germany: [67, 67, 10.4, 0.093, 0.093, 0.48, 0.90, 0.07, 0.36, 88, 8],
  Spain: [66, 66, 11.6, 0.047, 0.236, 0.72, 0.85, 0.12, 0.33, 78, 15],
  Canada: [65, 65, 4.8, 0.0595, 0.0595, 0.39, 0.93, 0.06, 0.30, 86, 10],
  Mexico: [65, 65, 2.7, 0.011, 0.052, 0.26, 0.35, 0.25, 0.12, 42, 55],
  Brazil: [65, 62, 12.0, 0.08, 0.20, 0.58, 0.55, 0.22, 0.16, 54, 38],
  Argentina: [65, 60, 8.5, 0.11, 0.16, 0.72, 0.52, 0.22, 0.18, 48, 42],
  Chile: [65, 60, 3.1, 0.10, 0.0, 0.40, 0.65, 0.18, 0.18, 68, 27],
  Colombia: [62, 57, 3.8, 0.04, 0.12, 0.45, 0.35, 0.28, 0.13, 40, 56],
  Peru: [65, 65, 2.2, 0.13, 0.09, 0.40, 0.28, 0.30, 0.12, 28, 68],
  Venezuela: [60, 55, 4.5, 0.04, 0.09, 0.40, 0.30, 0.40, 0.14, 35, 55],
  Ecuador: [60, 60, 4.4, 0.0945, 0.1115, 0.70, 0.40, 0.25, 0.13, 48, 46],
  Bolivia: [58, 58, 3.5, 0.10, 0.03, 0.70, 0.22, 0.32, 0.10, 25, 70],
  Paraguay: [60, 60, 2.8, 0.09, 0.14, 0.45, 0.22, 0.30, 0.10, 30, 64],
  Uruguay: [60, 60, 8.7, 0.15, 0.075, 0.60, 0.72, 0.12, 0.24, 72, 22],
  Guyana: [60, 60, 1.2, 0.05, 0.07, 0.40, 0.25, 0.30, 0.08, 40, 48],
  Suriname: [60, 60, 2.0, 0.04, 0.08, 0.40, 0.30, 0.28, 0.10, 42, 48],
  India: [60, 60, 1.3, 0.12, 0.12, 0.40, 0.22, 0.25, 0.10, 18, 80],
  Indonesia: [57, 57, 1.0, 0.03, 0.037, 0.40, 0.28, 0.30, 0.10, 30, 66],
  Turkey: [60, 58, 7.2, 0.09, 0.115, 0.70, 0.70, 0.18, 0.14, 68, 28],
  SaudiArabia: [60, 55, 2.2, 0.09, 0.09, 0.50, 0.55, 0.15, 0.06, 70, 20],
  Iran: [62, 55, 4.8, 0.07, 0.20, 0.55, 0.50, 0.22, 0.10, 55, 38],
  Israel: [67, 62, 4.8, 0.06, 0.065, 0.50, 0.80, 0.10, 0.22, 82, 12],
  Iraq: [60, 55, 3.5, 0.05, 0.12, 0.50, 0.35, 0.30, 0.08, 40, 50],
  UAE: [60, 60, 0.8, 0.05, 0.125, 0.50, 0.40, 0.10, 0.04, 75, 15],
  Australia: [67, 67, 4.3, 0.0, 0.115, 0.32, 0.90, 0.05, 0.26, 86, 10],
  NewZealand: [65, 65, 5.1, 0.0, 0.03, 0.40, 0.95, 0.04, 0.26, 88, 8],
  Italy: [67, 67, 15.4, 0.0919, 0.2361, 0.74, 0.88, 0.10, 0.39, 82, 12],
  Poland: [65, 60, 11.1, 0.0976, 0.0976, 0.54, 0.80, 0.12, 0.28, 78, 16],
  Netherlands: [67, 67, 5.2, 0.05, 0.13, 0.71, 0.92, 0.05, 0.32, 88, 8],
  Belgium: [66, 66, 10.5, 0.075, 0.0886, 0.61, 0.88, 0.08, 0.32, 86, 10],
  Sweden: [66, 66, 7.2, 0.07, 0.1021, 0.54, 0.92, 0.05, 0.33, 90, 6],
  Norway: [67, 67, 5.4, 0.079, 0.141, 0.52, 0.93, 0.04, 0.28, 90, 6],
  Switzerland: [65, 64, 6.5, 0.053, 0.053, 0.44, 0.90, 0.05, 0.30, 88, 8],
  Portugal: [66, 66, 12.4, 0.11, 0.238, 0.74, 0.85, 0.12, 0.36, 80, 14],
  Greece: [67, 67, 15.7, 0.0667, 0.1333, 0.76, 0.80, 0.18, 0.37, 72, 20],
  Ukraine: [60, 60, 10.0, 0.22, 0.0, 0.40, 0.55, 0.25, 0.28, 60, 30],
  Czechia: [64, 64, 8.0, 0.065, 0.216, 0.46, 0.88, 0.08, 0.32, 86, 10],
  Hungary: [65, 65, 7.3, 0.10, 0.13, 0.56, 0.85, 0.10, 0.30, 84, 12],
  Romania: [65, 63, 8.1, 0.105, 0.205, 0.44, 0.70, 0.18, 0.28, 72, 22],
  Ireland: [66, 66, 3.5, 0.04, 0.088, 0.34, 0.90, 0.06, 0.24, 86, 10],
  SouthAfrica: [60, 60, 3.1, 0.0, 0.01, 0.18, 0.12, 0.20, 0.09, 32, 34],
  Nigeria: [60, 60, 0.6, 0.08, 0.10, 0.40, 0.10, 0.35, 0.06, 12, 80],
  Egypt: [60, 60, 4.2, 0.11, 0.1875, 0.55, 0.40, 0.28, 0.10, 45, 48],
  Kenya: [60, 60, 1.1, 0.06, 0.06, 0.40, 0.18, 0.30, 0.06, 20, 72],
  Morocco: [63, 63, 2.8, 0.0448, 0.0888, 0.50, 0.30, 0.28, 0.11, 32, 60],
  Algeria: [60, 55, 6.5, 0.09, 0.16, 0.65, 0.45, 0.22, 0.10, 40, 50],
  Ethiopia: [60, 60, 0.8, 0.07, 0.11, 0.40, 0.10, 0.30, 0.06, 12, 80],
  Ghana: [60, 60, 1.2, 0.055, 0.13, 0.40, 0.15, 0.30, 0.06, 18, 70],
  Angola: [60, 60, 1.5, 0.03, 0.08, 0.40, 0.12, 0.32, 0.06, 20, 70],
  Tanzania: [60, 60, 0.9, 0.10, 0.10, 0.40, 0.10, 0.32, 0.06, 14, 76],
  CongoDR: [65, 60, 0.7, 0.05, 0.05, 0.40, 0.08, 0.35, 0.05, 10, 82],
  Senegal: [60, 60, 1.4, 0.056, 0.084, 0.40, 0.15, 0.30, 0.06, 18, 72],
  Thailand: [60, 60, 3.0, 0.05, 0.05, 0.40, 0.40, 0.20, 0.20, 55, 38],
  Vietnam: [62, 60, 2.0, 0.08, 0.175, 0.45, 0.35, 0.22, 0.12, 40, 52],
  Philippines: [60, 60, 1.7, 0.05, 0.10, 0.40, 0.30, 0.25, 0.10, 38, 55],
  Malaysia: [60, 60, 2.2, 0.11, 0.13, 0.40, 0.50, 0.18, 0.10, 62, 30],
  Singapore: [63, 63, 2.1, 0.20, 0.17, 0.20, 0.85, 0.05, 0.20, 90, 6],
  Bangladesh: [59, 59, 0.7, 0.0, 0.0, 0.30, 0.08, 0.30, 0.08, 14, 82],
  Pakistan: [60, 55, 1.6, 0.01, 0.05, 0.40, 0.12, 0.32, 0.08, 20, 72],
  Kazakhstan: [63, 61, 3.5, 0.10, 0.05, 0.40, 0.60, 0.18, 0.12, 70, 24],
  Cuba: [65, 60, 7.0, 0.05, 0.125, 0.60, 0.85, 0.10, 0.22, 80, 15],
  Panama: [62, 57, 3.2, 0.0925, 0.1225, 0.60, 0.45, 0.22, 0.12, 50, 42],
  CostaRica: [65, 65, 5.4, 0.1066, 0.2667, 0.67, 0.60, 0.18, 0.16, 58, 36],
  DominicanRepublic: [60, 60, 2.4, 0.0287, 0.0710, 0.40, 0.40, 0.25, 0.10, 42, 52],
  Guatemala: [60, 60, 1.1, 0.0483, 0.1067, 0.40, 0.20, 0.30, 0.08, 28, 68],
  Honduras: [65, 60, 1.3, 0.025, 0.035, 0.40, 0.20, 0.30, 0.08, 25, 70],
  ElSalvador: [60, 55, 4.2, 0.0725, 0.0775, 0.45, 0.28, 0.28, 0.12, 32, 62],
  Nicaragua: [60, 60, 3.0, 0.07, 0.10, 0.40, 0.22, 0.28, 0.10, 30, 64]
};

function packSocial(row, milPct) {
  const [ageM, ageF, pens, cW, cE, repl, cov, ev, dep, formal, informal] = row;
  return {
    retirement_age_men: ageM,
    retirement_age_women: ageF,
    pension_spend_pct_gdp: pens,
    military_spend_pct_gdp: milPct,
    contrib_worker: cW,
    contrib_employer: cE,
    replacement_rate: repl,
    coverage: cov,
    evasion: ev,
    dependency_ratio: dep,
    formal_pct: formal,
    informal_pct: informal
  };
}

let updated = 0;
let missingWeo = [];

for (const [code, c] of Object.entries(src.countries)) {
  const iso = ISO[code];
  const gdpB = weoVal('NGDPD', iso);
  const growth = weoVal('NGDP_RPCH', iso);
  const inf = weoVal('PCPIPCH', iso);
  const une = weoVal('LUR', iso);
  const debt = weoVal('GGXWDG_NGDP', iso);
  const fisc = weoVal('GGXCNL_NGDP', iso);
  const pop = weoVal('LP', iso);

  if (gdpB == null) missingWeo.push(code);

  const e = c.economy;
  if (gdpB != null) e.gdp_trillion_usd = gdpT(gdpB);
  if (growth != null) e.gdp_growth = r(growth, 1);
  if (inf != null) e.inflation = r(inf, 1);
  if (une != null) e.unemployment = r(une, 1);
  if (debt != null) e.debt_to_gdp = r(debt, 1);
  if (fisc != null) e.fiscal_balance = r(fisc, 1);
  if (GOLD[code] != null) e.gold_reserves_tonnes = GOLD[code];

  if (pop != null) {
    c.population.total_millions = pop >= 100 ? r(pop, 0) : r(pop, 1);
  }
  const p = c.population.total_millions;
  const u = e.unemployment;
  c.population.unemployed_millions = r(p * 0.5 * (u / 100), p >= 50 ? 1 : 2);

  const oldPct = c.military.military_budget_bn / Math.max(0.001, c.economy.gdp_trillion_usd * 10);
  let milBn;
  if (SIPRI[code] != null) milBn = SIPRI[code];
  else milBn = oldPct * e.gdp_trillion_usd * 10;
  c.military.military_budget_bn = milBn >= 10 ? r(milBn, 0) : r(milBn, 1);
  const milPct = r(c.military.military_budget_bn / (e.gdp_trillion_usd * 10), 2);

  if (!SOCIAL[code]) throw new Error(`Falta SOCIAL para ${code}`);
  c.social = packSocial(SOCIAL[code], milPct);
  updated++;
}

src.meta = {
  version: '1.0',
  year: 2026,
  description: 'CHANGE WORLD GAME — base macro FMI WEO abril 2026 + SIPRI + WGC + previsional/empleo por pais.',
  countries_count: Object.keys(src.countries).length,
  notes: 'PBI, crecimiento, inflacion, desempleo, deuda, resultado fiscal y poblacion: FMI WEO abril 2026 (proyeccion 2026; 2025 si falta). Militar: SIPRI 2024/25 o % previo reescalado. Oro: World Gold Council 2025. Previsional/empleo: OECD/ISSA/ILO. Corea del Norte y Cuba sin WEO: se conservan estimaciones. unemployed_millions = poblacion * 0.5 * desempleo/100 (PEA aprox.).'
};

writeFileSync(resolve(root, 'engine/countries_mvp.json'), JSON.stringify(src, null, 2) + '\n');
console.log(`OK: ${updated} paises. Sin WEO (estimados): ${missingWeo.join(', ') || '(ninguno)'}`);
