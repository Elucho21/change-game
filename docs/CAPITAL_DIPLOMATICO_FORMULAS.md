# CHANGE WORLD GAME – Capital Diplomático: Fórmulas y Mecánicas
**Para Claude / Grok Build**  
Fecha: 2026-08-24  
Complementa `lib/electoral.ts`, `lib/simulation.ts` y `lib/diplomacy.ts`.

---

## 1. Concepto

El **Capital Diplomático** (`capitalDiplomatico`) es un recurso **separado** del Capital Político.

- Solo lo gastan y ganan las acciones de **diplomacia** y los movimientos de **bloques**.
- Representa prestigio, contactos, crédito internacional y capacidad de negociación.
- Es más escaso que el capital político a propósito: la diplomacia debe sentirse limitada y estratégica.

Rango: **0 – 100**.

---

## 2. Valores base (actuales en código)

| Constante | Valor | Archivo |
|-----------|-------|--------|
| `CAPITAL_DIPLOMATICO_START` | 25 | `lib/electoral.ts` |
| `DIPLOMATIC_CAPITAL_PASSIVE_BASE` | 3 | `lib/electoral.ts` |

---

## 3. Regeneración pasiva (cada turno)

```ts
passive = DIPLOMATIC_CAPITAL_PASSIVE_BASE + Math.min(3, blocMemberships * 0.6)
regen   = passive * (1 + cancillerBonus) * (honeymoon ? 1.5 : 1)
capitalDiplomatico = clamp(capitalDiplomatico + regen, 0, 100)
```

### Desglose

| Factor | Efecto |
|--------|--------|
| Base | +3 por turno |
| Membresía en bloques | +0.6 por bloque (máx +3) |
| Bonus del Canciller (`diplomaticCapitalBonus`) | Multiplica la regeneración (ej: 0.2 = +20%) |
| Luna de miel (100 días) | ×1.5 |

**Ejemplo:**
- 2 bloques + Canciller 0.25 + sin luna de miel  
  → `3 + min(3, 1.2) = 4.2` → `4.2 × 1.25 = 5.25` por turno.

---

## 4. Gasto y ganancia por decisiones

### Regla principal (ya implementada en `applyDecisionTo`)

```ts
if (dec.category === 'diplomacia') {
  capitalDiplomatico = clamp(
    capitalDiplomatico - dec.cost.capital + (dec.effects.capital ?? 0),
    0, 100
  );
} else {
  // capital político normal
}
```

- El `cost.capital` de una decisión de diplomacia se resta del pool diplomático.
- Si la decisión tiene `effects.capital` positivo, se suma al mismo pool.

### Tasador diplomático (`scaleDecision`)

El costo real se escala por tamaño del objetivo y relación:

```ts
size = clamp(targetGDP / playerGDP, 0.25, 4)
relMod = clamp(1 - relation / 200, 0.6, 1.4)

costFinal = round( baseCost * (0.5 + 0.5 * size) * relMod )
```

- Negociar con un país mucho más grande cuesta más.
- Negociar con un hostil cuesta más.
- Negociar con un aliado cuesta menos.

---

## 5. Fórmulas de diseño recomendadas (profundización)

### 5.1 Regeneración ampliada (propuesta)

```ts
function diplomaticCapitalRegen(
  current: number,
  blocMemberships: number,
  cancillerBonus: number,      // 0–0.5 típico
  softPower: number,           // 0–100 (influencia blanda / prestigio)
  tradeChangeVsStart: number,  // % cambio comercio vs baseline
  honeymoon: boolean
): number {
  let passive = 3;                                    // base
  passive += Math.min(3, blocMemberships * 0.6);      // bloques
  passive += softPower / 50;                          // +0 a +2
  passive += clamp(tradeChangeVsStart / 20, -1.5, 1.5); // comercio ayuda o duele

  const mult = (1 + cancillerBonus) * (honeymoon ? 1.5 : 1);
  return clamp(current + passive * mult, 0, 100);
}
```

### 5.2 Pérdida por aislamiento / crisis

```ts
// Al final del turno, si capitalDiplomatico está muy bajo o hay sanciones masivas
if (capitalDiplomatico < 10 && sanctions.length >= 2) {
  // pequeño drift negativo adicional o evento de "aislamiento"
}

// Sanciones activas erosionan un poco cada turno (además de la relación)
capitalDiplomatico -= sanctions.length * 0.3;   // opcional, balanceable
```

### 5.3 Uso de alto impacto (nuevas acciones recomendadas)

| Acción | Costo típico (base) | Efecto principal |
|--------|---------------------|------------------|
| Forzar cumbre de emergencia | 12–18 | +cohesión bloque, posible desbloqueo de evento |
| Comprar tiempo en crisis bilateral | 8–15 | Retrasa o suaviza un evento hostil |
| Suavizar sanción | 10–20 | Reduce efecto de sanción o acelera levantamiento |
| Misión de mediación | 6–12 | Mejora relación con dos países a la vez |
| Ofensiva de prestigio (gira) | 15–25 | +softPower temporal + regeneración extra |

Todos estos costos pasan por el tasador si son bilaterales.

### 5.4 Interacción con otros sistemas

| Sistema | Cómo afecta al Capital Diplomático |
|---------|------------------------------------|
| **Bloques** | Entrar/salir gasta/gana. Cohesión alta mejora regeneración. |
| **Comercio** | Comercio creciendo vs baseline → regeneración extra. Caída fuerte → regeneración negativa. |
| **Corrupción / Moral** | Alta corrupción reduce el bonus del Canciller y puede generar eventos de “pérdida de prestigio”. |
| **Infraestructura** | Centros de Datos IA y Aeropuertos Internacionales dan softPower → regeneración. |
| **Líderes minoritarios** | Algunas acciones de Amalia/Jhon pueden costar o regenerar capital diplomático (imagen internacional). |
| **FMI / Crisis** | Stage avanzado del FMI puede limitar regeneración o aumentar costos diplomáticos. |

---

## 6. Feedback y UI recomendados

1. **Barra o número visible** junto al Capital Político (diferente color, ej. azul/índigo).
2. Al gastar: animación o texto “−12 Capital Diplomático”.
3. Tooltip con desglose de regeneración del último turno.
4. Aviso cuando queda < 15: “Capacidad de negociación limitada”.
5. En el preview de decisiones de diplomacia mostrar el impacto en ambos capitals.

---

## 7. Base lógica de código (TypeScript)

```ts
// lib/diplomaticCapital.ts  (esqueleto propuesto)

import { clamp } from './engine';
import { DIPLOMATIC_CAPITAL_PASSIVE_BASE, CAPITAL_DIPLOMATICO_START } from './electoral';

export const DIPLOMATIC_CAPITAL_MAX = 100;

export interface DiplomaticRegenInput {
  current: number;
  blocMemberships: number;
  cancillerBonus: number;       // 0–0.5
  softPower?: number;           // 0–100
  tradeChangeVsStart?: number;  // %
  honeymoon?: boolean;
  sanctionsCount?: number;
}

/** Regeneración pasiva al cierre de turno */
export function diplomaticCapitalRegen(input: DiplomaticRegenInput): number {
  const {
    current,
    blocMemberships,
    cancillerBonus = 0,
    softPower = 50,
    tradeChangeVsStart = 0,
    honeymoon = false,
    sanctionsCount = 0
  } = input;

  let passive = DIPLOMATIC_CAPITAL_PASSIVE_BASE;
  passive += Math.min(3, blocMemberships * 0.6);
  passive += (softPower - 50) / 50;                    // -1 a +1 alrededor de 50
  passive += clamp(tradeChangeVsStart / 20, -1.5, 1.5);
  passive -= sanctionsCount * 0.25;                    // sanciones pesan

  const mult = (1 + cancillerBonus) * (honeymoon ? 1.5 : 1);
  return clamp(current + passive * mult, 0, DIPLOMATIC_CAPITAL_MAX);
}

/** Aplica costo y posible ganancia de una decisión de diplomacia */
export function applyDiplomaticCost(
  current: number,
  cost: number,
  gain = 0
): number {
  return clamp(current - cost + gain, 0, DIPLOMATIC_CAPITAL_MAX);
}

/** ¿Tiene suficiente capital diplomático? */
export function canAffordDiplomatic(current: number, cost: number): boolean {
  return current >= cost;
}

/** Texto de feedback para la UI */
export function diplomaticStatusLabel(value: number): string {
  if (value >= 70) return 'Alto prestigio';
  if (value >= 40) return 'Capacidad normal';
  if (value >= 15) return 'Limitado';
  return 'Aislamiento diplomático';
}
```

---

## 8. Orden de implementación recomendado

1. Extraer la lógica actual de `diplomaticCapitalRegen` a un módulo limpio (arriba).
2. Añadir `softPower` y `tradeChangeVsStart` como inputs (ya existen datos parciales).
3. Hacer visible el recurso en TopBar / Dashboard con color distinto.
4. Crear 3–5 decisiones nuevas de alto impacto que solo gasten capital diplomático.
5. Conectar con el sistema de Infraestructura (bonus de softPower).
6. Añadir warning en el preview cuando la decisión deja el capital diplomático < 15.

---

**Fin del documento**

Este archivo está listo para que Claude lo lea e implemente sin re-interpretar las fórmulas.
