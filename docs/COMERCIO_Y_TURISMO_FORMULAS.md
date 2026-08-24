# CHANGE WORLD GAME – Comercio + Turismo: Fórmulas y Mecánicas
**Para Claude / Grok Build**  
Fecha: 2026-08-24  
Complementa `lib/trade.ts`, sectores productivos y el sistema de infraestructura.

---

## 1. Objetivo

El comercio bilateral ya funciona bien (modelo de gravedad).  
Lo que falta es que el **jugador lo sienta como herramienta** y que el **turismo** exista como canal propio, no como un número escondido dentro de `sectors.tourism`.

Este documento define:

1. Palancas jugables de comercio (aranceles, tipo de cambio, tratados).
2. Turismo como sector vivo con drivers propios.
3. Conexión con infraestructura (aeropuertos, puertos), seguridad, soft power y capital diplomático.
4. Esqueletos TypeScript listos para implementar.

---

## 2. Comercio – Estado actual vs. lo que falta

### Ya existe (`lib/trade.ts`)

```ts
volumen(A,B) = √(PBI_A × PBI_B) × 112 / (distancia_km/1000 + 1)^0.6
             × (1 + relación/250)
             × multiplicador_bloque
             × factor_rutas
             × 0.15 si hay sanciones
```

Efecto en crecimiento:

```ts
efectoCrecimiento = clamp((comercio_actual / baseline - 1) * 2, -2, 2)
```

### Lo que falta (palancas del jugador)

| Palanca | Estado hoy | Objetivo |
|---------|------------|----------|
| Aranceles por país/sector | Número fijo del bloque | Decisión jugable |
| Tipo de cambio | Calculado en `lib/fx.ts`, no controlable | Decisión / Banco Central |
| Feedback top partner | Casi invisible | Visible en Dashboard / CountryPanel |
| % cambio vs baseline | Existe en `eventExtra.trade` | Mostrar con color en UI |

---

## 3. Fórmulas de Comercio ampliadas

### 3.1 Aranceles jugables

```ts
// Multiplicador de arancel sobre el volumen bilateral
arancelMult(playerTariff: number, partnerTariff: number): number {
  // Arancel propio alto protege pero reduce comercio
  // Arancel del socio alto te cierra el mercado
  const avg = (playerTariff + partnerTariff) / 2;
  return clamp(1 - avg / 80, 0.25, 1.15); // 0% arancel = 1.15, 40% = 0.5
}
```

Integración en `bilateralVolume`:

```ts
const tariffMult = arancelMult(
  getTariff(player, partner, sector),
  getTariff(partner, player, sector)
);
const v = gravity * relMult * blocMult * longHaul * tariffMult * (sanctioned ? 0.15 : 1);
```

### 3.2 Tipo de cambio como palanca

```ts
// Moneda débil (X alto) favorece exportaciones, encarece importaciones
fxTradeMult(exchangeRate: number): number {
  // X = 100 es el arranque. X > 100 = depreciación.
  const delta = (exchangeRate - 100) / 100;
  return clamp(1 + delta * 0.35, 0.7, 1.4);
}
```

- Depreciar → más exportaciones, más inflación importada.
- Apreciar → menos competitividad exportadora, inflación más baja.

### 3.3 Feedback obligatorio en UI

Cada turno el jugador debe ver:

```ts
{
  topPartner: string;           // ej. "China"
  topPartnerVolume: number;     // miles de millones USD
  changeVsStart: number;        // % vs baseline
  tradeGrowthEffect: number;    // impacto en gdp_growth este mes
}
```

Colores:
- `changeVsStart > 5%` → verde
- `changeVsStart < -10%` → rojo
- resto → neutro

---

## 4. Turismo – Canal propio

### 4.1 Drivers del turismo

| Driver | Fuente | Efecto |
|--------|--------|--------|
| Seguridad | `moral.securityIndex` (bajo = más seguro) | Fuerte |
| Estabilidad | `population.stability` | Medio |
| Tipo de cambio | `fx` (moneda barata atrae) | Medio-alto |
| Soft power / imagen | derivado de capital diplomático + corrupción baja | Medio |
| Aeropuertos internacionales | Infraestructura completada | Alto |
| Peso del sector | `sectors.tourism` del país | Base |

### 4.2 Fórmula de aporte del turismo al crecimiento

```ts
function tourismGrowthContribution(input: {
  sectorWeight: number;       // sectors.tourism (0–100)
  securityIndex: number;      // 0–100 (alto = más inseguro)
  stability: number;          // 0–100
  fx: number;                 // 100 = baseline
  softPower: number;          // 0–100
  airportCount: number;       // aeropuertos internacionales completados
  baseTourismHealth: number;  // 0–100, salud del sector
}): number {
  const {
    sectorWeight, securityIndex, stability, fx,
    softPower, airportCount, baseTourismHealth
  } = input;

  // Seguridad: securityIndex alto mata turismo
  const securityFactor = clamp(1 - (securityIndex - 40) / 80, 0.3, 1.2);

  // Estabilidad
  const stabilityFactor = clamp(stability / 60, 0.5, 1.15);

  // Tipo de cambio: moneda débil ayuda
  const fxFactor = clamp(1 + (fx - 100) / 200, 0.75, 1.3);

  // Soft power
  const softFactor = clamp(0.8 + softPower / 200, 0.8, 1.25);

  // Aeropuertos: cada uno suma
  const airportFactor = 1 + airportCount * 0.08;

  // Salud del sector
  const healthFactor = baseTourismHealth / 100;

  const intensity =
    securityFactor * stabilityFactor * fxFactor * softFactor * airportFactor * healthFactor;

  // Aporte al gdp_growth (calibrar: sector 8% con intensity 1 ≈ +0.15 a +0.25)
  return round((sectorWeight / 100) * intensity * 2.2, 2);
}
```

### 4.3 Impacto en empleo

El turismo es intensivo en empleo:

```ts
empleoTurismoDelta = tourismGrowthContribution(...) * 1.5; // elasticidad alta
// Se aplica como reducción de desempleo (o aumento si el turismo cae)
```

Usar la tabla de `lib/employment_sectors.ts` cuando esté cableada (intensidad turismo ≈ 1.55).

### 4.4 Eventos y decisiones de turismo

Categorías sugeridas:

- **Campaña de promoción turística** (cuesta capital político + un poco de fiscal)
- **Visa flexible / open skies** (capital diplomático + posible tensión con vecinos)
- **Crisis de seguridad que ahuyenta turistas** (evento ligado a `securityIndex`)
- **Temporada récord** (cuando todos los drivers están bien)

---

## 5. Conexión con Infraestructura

| Infraestructura | Efecto en Comercio | Efecto en Turismo |
|-----------------|--------------------|-------------------|
| Aeropuerto Internacional | +conectividad, +comercio aéreo | +fuerte |
| Puerto de Aguas Profundas | +exportaciones, +control de rutas | leve |
| Base Militar | disuasión (puede subir o bajar turismo según contexto) | variable |
| Centro de Datos IA | soft power digital, imagen | +moderado |

Cuando se completa un aeropuerto:

```ts
airportCount += 1;
// El próximo tick de tourismGrowthContribution ya refleja el bonus
```

---

## 6. Soft Power (puente entre diplomacia y turismo/comercio)

```ts
function softPowerOf(input: {
  capitalDiplomatico: number;  // 0–100
  corruption: number;          // 0–100
  completedInfra: string[];    // ids de infra
}): number {
  let sp = input.capitalDiplomatico * 0.5;
  sp += clamp(50 - input.corruption, 0, 40) * 0.4;
  if (input.completedInfra.includes('ai_datacenter')) sp += 8;
  if (input.completedInfra.includes('airport')) sp += 5;
  return clamp(sp, 0, 100);
}
```

Se usa en:
- Regeneración de capital diplomático (doc anterior)
- Fórmula de turismo
- Algunos eventos de imagen internacional

---

## 7. Base lógica de código (TypeScript)

```ts
// lib/tourism.ts  (esqueleto)

import { clamp } from './engine';

export interface TourismInput {
  sectorWeight: number;
  securityIndex: number;
  stability: number;
  fx: number;
  softPower: number;
  airportCount: number;
  sectorHealth: number;
}

export function tourismGrowthContribution(input: TourismInput): number {
  const securityFactor = clamp(1 - (input.securityIndex - 40) / 80, 0.3, 1.2);
  const stabilityFactor = clamp(input.stability / 60, 0.5, 1.15);
  const fxFactor = clamp(1 + (input.fx - 100) / 200, 0.75, 1.3);
  const softFactor = clamp(0.8 + input.softPower / 200, 0.8, 1.25);
  const airportFactor = 1 + input.airportCount * 0.08;
  const healthFactor = input.sectorHealth / 100;

  const intensity =
    securityFactor * stabilityFactor * fxFactor * softFactor * airportFactor * healthFactor;

  return Math.round((input.sectorWeight / 100) * intensity * 2.2 * 100) / 100;
}

export function tourismEmploymentDelta(growthContribution: number): number {
  // elasticidad alta: turismo genera más empleo por punto de PBI
  return Math.round(growthContribution * 1.5 * 100) / 100;
}
```

```ts
// Extensión sugerida en lib/trade.ts o lib/tariffs.ts

export function arancelMult(playerTariff: number, partnerTariff: number): number {
  const avg = (playerTariff + partnerTariff) / 2;
  return Math.max(0.25, Math.min(1.15, 1 - avg / 80));
}

export function fxTradeMult(exchangeRate: number): number {
  const delta = (exchangeRate - 100) / 100;
  return Math.max(0.7, Math.min(1.4, 1 + delta * 0.35));
}
```

---

## 8. Orden de implementación recomendado

1. Exponer en UI: top partner + `changeVsStart` + efecto en crecimiento.
2. Crear `lib/tourism.ts` e integrarlo en el tick (después de seguridad/FX).
3. Contar aeropuertos completados desde el sistema de infraestructura.
4. Añadir 2–3 decisiones de promoción turística / open skies.
5. Hacer aranceles y tipo de cambio decisiones jugables (patrón de `TaxOrder`).
6. Conectar soft power con capital diplomático y corrupción.

---

**Fin del documento**

Listo para que Claude lo lea e implemente por partes.
