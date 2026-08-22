/**
 * Convierte engine/countries_mvp.json (fuente de verdad, compartida con el motor
 * Python y con Grok) en lib/data/countries.gen.json, listo para el globo 3D.
 *
 * Agrega: codigo ISO3 (para pintar el poligono del pais en el GeoJSON),
 * coordenadas de la capital (para los arcos diplomaticos), bandera y la
 * matriz de relaciones convertida a numeros -100..100.
 *
 * Uso:  npm run data
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// code del JSON -> ISO3 del GeoJSON + capital + bandera
const META = {
  USA:        { iso: 'USA', flag: '🇺🇸', lat: 38.9,  lng: -77.0 },
  China:      { iso: 'CHN', flag: '🇨🇳', lat: 39.9,  lng: 116.4 },
  Russia:     { iso: 'RUS', flag: '🇷🇺', lat: 55.8,  lng: 37.6 },
  Japan:      { iso: 'JPN', flag: '🇯🇵', lat: 35.7,  lng: 139.7 },
  SouthKorea: { iso: 'KOR', flag: '🇰🇷', lat: 37.6,  lng: 127.0 },
  NorthKorea: { iso: 'PRK', flag: '🇰🇵', lat: 39.0,  lng: 125.8 },
  UK:         { iso: 'GBR', flag: '🇬🇧', lat: 51.5,  lng: -0.13 },
  France:     { iso: 'FRA', flag: '🇫🇷', lat: 48.9,  lng: 2.35 },
  Germany:    { iso: 'DEU', flag: '🇩🇪', lat: 52.5,  lng: 13.4 },
  Spain:      { iso: 'ESP', flag: '🇪🇸', lat: 40.4,  lng: -3.7 },
  Canada:     { iso: 'CAN', flag: '🇨🇦', lat: 45.4,  lng: -75.7 },
  Mexico:     { iso: 'MEX', flag: '🇲🇽', lat: 19.4,  lng: -99.1 },
  Brazil:     { iso: 'BRA', flag: '🇧🇷', lat: -15.8, lng: -47.9 },
  Argentina:  { iso: 'ARG', flag: '🇦🇷', lat: -34.6, lng: -58.4 },
  Chile:      { iso: 'CHL', flag: '🇨🇱', lat: -33.4, lng: -70.7 },
  Colombia:   { iso: 'COL', flag: '🇨🇴', lat: 4.7,   lng: -74.1 },
  Peru:       { iso: 'PER', flag: '🇵🇪', lat: -12.0, lng: -77.0 },
  Venezuela:  { iso: 'VEN', flag: '🇻🇪', lat: 10.5,  lng: -66.9 },
  Ecuador:    { iso: 'ECU', flag: '🇪🇨', lat: -0.2,  lng: -78.5 },
  Bolivia:    { iso: 'BOL', flag: '🇧🇴', lat: -16.5, lng: -68.1 },
  Paraguay:   { iso: 'PRY', flag: '🇵🇾', lat: -25.3, lng: -57.6 },
  Uruguay:    { iso: 'URY', flag: '🇺🇾', lat: -34.9, lng: -56.2 },
  Guyana:     { iso: 'GUY', flag: '🇬🇾', lat: 6.8,   lng: -58.2 },
  Suriname:   { iso: 'SUR', flag: '🇸🇷', lat: 5.9,   lng: -55.2 }
};

// escala categoria -> numero (y a la inversa se muestra en la UI)
const REL_SCALE = { amistoso: 55, aliado: 80, neutral: 0, tenso: -40, hostil: -75 };

const src = JSON.parse(readFileSync(resolve(root, 'engine/countries_mvp.json'), 'utf-8'));
const codes = Object.keys(src.countries);

const missing = codes.filter((c) => !META[c]);
if (missing.length) {
  console.error(`Faltan metadatos (ISO3/capital) para: ${missing.join(', ')}`);
  console.error('Agregalos en scripts/build-data.mjs -> META y volve a correr npm run data.');
  process.exit(1);
}

/** relacion declarada de A hacia B, cayendo al default del pais */
function declared(code, other) {
  const rel = src.countries[code].relations || {};
  const label = rel[other] ?? rel.default ?? 'neutral';
  return REL_SCALE[label] ?? 0;
}

// matriz simetrica: promedio de lo que cada uno declara del otro
const relations = {};
for (let i = 0; i < codes.length; i++) {
  for (let j = i + 1; j < codes.length; j++) {
    const a = codes[i], b = codes[j];
    relations[`${a}|${b}`] = Math.round((declared(a, b) + declared(b, a)) / 2);
  }
}

const countries = {};
for (const code of codes) {
  const c = src.countries[code];
  countries[code] = {
    code,
    iso: META[code].iso,
    name: c.name,
    flag: META[code].flag,
    region: c.region,
    capital: c.capital,
    lat: META[code].lat,
    lng: META[code].lng,
    playable: c.playable !== false,
    economy: c.economy,
    population: c.population,
    military: c.military,
    sectors: c.sectors,
    traits: c.traits
  };
}

const out = {
  meta: { ...src.meta, generatedAt: new Date().toISOString(), source: 'engine/countries_mvp.json' },
  global: src.global_state,
  countries,
  relations,
  isoToCode: Object.fromEntries(codes.map((c) => [META[c].iso, c]))
};

writeFileSync(resolve(root, 'lib/data/countries.gen.json'), JSON.stringify(out, null, 1));
console.log(`OK: ${codes.length} paises, ${Object.keys(relations).length} pares de relaciones -> lib/data/countries.gen.json`);
