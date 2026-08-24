# CHANGE WORLD GAME – Banco Central: Fórmulas y Mecánicas
**Para Claude / Grok Build**  
Fecha: 2026-08-24  
Complemento del Dashboard e Infraestructura.

---

## 1. Variables Principales

| Variable | Símbolo | Unidad | Descripción |
|----------|---------|--------|-------------|
| Inflación | `I` | % | Variación de precios |
| Crecimiento | `G` | % | Crecimiento del PIB real |
| Déficit | `D` | % del PIB | Gasto – Ingresos |
| Deuda | `Debt` | % del PIB | Deuda pública total |
| Emisión | `E` | % de la base monetaria | Nueva moneda creada |
| Tasa de Interés | `R` | % | Tasa de política |
| Oro | `Gold` | unidades | Reservas de oro |
| Divisas | `FX` | unidades (USD) | Reservas de dólares |
| Cotización | `X` | moneda local / 1 USD | Tipo de cambio |
| Confianza | `Conf` | 0–100 | Confianza en la moneda |
| Base Monetaria | `M` | unidades | Dinero en circulación |

---

## 2. Fórmulas Core

### Inflación
```ts
I_t = I_prev 
    + 0.60 * E 
    + 0.25 * Math.max(0, D) 
    - 0.40 * (R - R_natural) 
    + 0.35 * deltaX 
    + shock
```
- `R_natural ≈ 3.5`
- Si `I > 25` → Crisis Inflacionaria

### Crecimiento
```ts
G_t = 2.5 
    + 0.35 * (R_natural - R) 
    - 0.20 * I 
    - 0.08 * Math.max(0, Debt - 60) 
    + infraBonus 
    + 0.10 * (Conf / 100) 
    + shock
```

### Deuda
```ts
Debt_t = Debt_prev + D + (Debt_prev * R_deuda / 100) ± efectoFX
```
- `Debt > 90` → alerta
- `Debt > 120` → Crisis de Deuda posible

### Cotización (X)
```ts
X_t = X_prev 
    * (1 + 0.45 * E) 
    * (1 - 0.30 * (R - R_extranjero)) 
    * (1 - 0.15 * deltaGold - 0.25 * deltaFX) 
    * (1 - 0.20 * Conf / 100)
```
- X sube = depreciación de la moneda local

### Confianza
```ts
Conf_t = clamp(0, 100,
  Conf_prev
  - 1.8 * Math.max(0, I - 8)
  - 2.2 * Math.max(0, E - 5)
  + 0.6 * (R - R_min)
  + 0.4 * (reservasTotales / PIB)
  - 0.7 * Math.max(0, Debt - 80)
)
```
- Si `Conf < 25` → Pérdida de Confianza

---

## 3. Operaciones del Jugador

### Comprar / Vender Oro
```ts
// Comprar Q
Gold += Q
FX   -= Q * precioOro
Conf += pequeña subida
X    *= (1 - 0.04 * (Q / reservasTotales))

// Vender Q
Gold -= Q
FX   += Q * precioOro
Conf -= mayor bajada
X    *= (1 + 0.06 * (Q / reservasTotales))
```

### Comprar / Vender Dólares
```ts
// Comprar dólares → X se deprecia
// Vender dólares  → X se aprecia (defensa de moneda)
```

### Emitir Moneda (E)
```ts
E = (cantidadEmitida / baseMonetariaAnterior) * 100
M *= (1 + E / 100)
// Impacta fuerte en I y X, baja Conf si E > 5
```

### Cambiar Tasa de Interés (R)
```ts
// Subir R → baja G, baja I, aprecia X, sube Conf
// Bajar R → sube G, sube I, deprecia X
```

---

## 4. Multiplicador de Corrupción

```ts
efectividadReal = efectividadTeorica * (1 - corrupcion / 150)
```
- Alta corrupción → más inflación por misma emisión, menos crecimiento por misma baja de tasas.

---

## 5. Valores iniciales sugeridos

| Variable | Valor |
|----------|-------|
| I | 4.5 |
| G | 2.8 |
| D | 3.2 |
| Debt | 55 |
| R | 5.0 |
| Conf | 65 |
| X | 1.0 |

---

## 6. Base lógica de código (TypeScript)

```ts
// lib/centralBank.ts  (esqueleto inicial)

export interface CentralBankState {
  inflation: number;      // I
  growth: number;         // G
  deficit: number;        // D
  debt: number;           // Debt % PIB
  emission: number;       // E %
  rate: number;           // R
  gold: number;
  fx: number;             // dólares
  exchangeRate: number;   // X
  confidence: number;     // Conf 0-100
  monetaryBase: number;   // M
}

export const R_NATURAL = 3.5;

export function updateInflation(s: CentralBankState, deltaX: number, shock = 0): number {
  return s.inflation
    + 0.60 * s.emission
    + 0.25 * Math.max(0, s.deficit)
    - 0.40 * (s.rate - R_NATURAL)
    + 0.35 * deltaX
    + shock;
}

export function updateGrowth(s: CentralBankState, infraBonus: number, shock = 0): number {
  return 2.5
    + 0.35 * (R_NATURAL - s.rate)
    - 0.20 * s.inflation
    - 0.08 * Math.max(0, s.debt - 60)
    + infraBonus
    + 0.10 * (s.confidence / 100)
    + shock;
}

export function updateConfidence(s: CentralBankState, reservasTotales: number, pib: number): number {
  const next = s.confidence
    - 1.8 * Math.max(0, s.inflation - 8)
    - 2.2 * Math.max(0, s.emission - 5)
    + 0.6 * (s.rate - 0)
    + 0.4 * (reservasTotales / pib)
    - 0.7 * Math.max(0, s.debt - 80);
  return Math.max(0, Math.min(100, next));
}

export function applyCorruptionMultiplier(value: number, corruption: number): number {
  return value * (1 - corruption / 150);
}

// Operaciones
export function buyGold(s: CentralBankState, q: number, precioOro: number): CentralBankState { /* ... */ }
export function sellGold(s: CentralBankState, q: number, precioOro: number): CentralBankState { /* ... */ }
export function buyFX(s: CentralBankState, q: number): CentralBankState { /* ... */ }
export function sellFX(s: CentralBankState, q: number): CentralBankState { /* ... */ }
export function emitMoney(s: CentralBankState, amount: number): CentralBankState { /* ... */ }
export function setRate(s: CentralBankState, newRate: number): CentralBankState { /* ... */ }
```

---

**Notas de implementación**
- Todas las fórmulas deben ser transparentes en el “Informe del Banco Central”.
- Feedback inmediato al confirmar operación.
- Corrupción actúa como multiplicador oculto.
- No hacer el sistema demasiado punitivo al inicio.
