# Base de datos macro — CHANGE WORLD GAME 1.0

Fuente de verdad: `engine/countries_mvp.json`. Se genera `lib/data/countries.gen.json` con `npm run data`.

**Año de la ficha:** 2026.

## Qué se actualizó (23/08/2026)

| Bloque | Campos | Fuente |
|---|---|---|
| Economía | PBI (USD corr.), crecimiento, inflación, desempleo, deuda/PBI, resultado fiscal | FMI WEO abril 2026, proyección 2026 (2025 si falta el dato) |
| Población | total, `unemployed_millions` = población × 0.5 × desempleo/100 | FMI WEO `LP` + PEA aproximada |
| Oro | toneladas | World Gold Council 2025 |
| Militar | `military_budget_bn` y `social.military_spend_pct_gdp` | SIPRI 2024/25; si no hay ficha, se reescala el % anterior al PBI nuevo |
| Previsional / empleo | edad H/M, gasto pensiones % PBI, aportes, cobertura, evasión, dependencia, formal/informal | OECD SOCX / Pensions at a Glance, ISSA, ILO informal, leyes nacionales 2025-26 |

Corea del Norte y Cuba **no están en el WEO**: se conservan estimaciones.

## Cómo se usa en el juego

Al elegir país, el store siembra:

- `pensionFromCountry(code)` → edad de jubilación, aportes, cobertura
- `employmentFromCountry(code)` → formal/informal

El gasto militar en % del PBI se lee de `country.social.military_spend_pct_gdp` (el panel previsional también puede calcularlo de presupuesto / PBI: tienen que coincidir).

## Cómo volver a actualizar

```bash
# 1. bajar WEO (Datamapper FMI)
node --input-type=module -e "/* ver scripts/update-macro.mjs header */"

# 2. aplicar
node scripts/update-macro.mjs
npm run data
npm test
```

El JSON crudo del FMI **no** se commitea (`engine/_weo_raw.json`).
