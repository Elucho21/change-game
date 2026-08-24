# CHANGE WORLD GAME – Infraestructura & Decisiones Contextuales
**Para Claude / Grok Build**  
Fecha: 2026-08-24  
Documento separado del Banco Central.

---

## 1. Sistema de Infraestructura y Proyección de Poder

El jugador construye infraestructuras estratégicas con **impacto real en el mapa global**.

### Tipos

| Infraestructura              | Coste     | Tiempo     | Efectos principales                          | Impacto Global                     |
|-----------------------------|-----------|------------|----------------------------------------------|------------------------------------|
| Aeropuerto Internacional    | Alto      | Medio      | Comercio, turismo, influencia blanda        | Rutas aéreas globales             |
| Puerto de Aguas Profundas   | Muy Alto  | Alto       | Comercio marítimo, control de rutas         | Poder en océanos / estrechos      |
| Base Militar                | Muy Alto  | Alto       | Proyección militar, disuasión, alianzas     | Equilibrio de poder regional      |
| Centro de Datos IA          | Extremo   | Medio-Alto | Ventaja tecnológica, influencia digital, IA | Nodos de datos e influencia soft  |

### Reglas de Construcción

Deben cumplirse **todas**:

1. Presupuesto suficiente
2. Capital Político suficiente
3. Estabilidad Política mínima (varía por tipo)
4. Corrupción no excesiva
5. Relaciones / Bloques permiten la obra
6. Región disponible en el mapa nacional

### Efecto de la Corrupción

| Rango Corrupción | Efecto |
|------------------|--------|
| < 30%            | Coste y tiempo normales + bonus completo |
| 30–60%           | Coste +15–25%, tiempo +10–20% |
| 60–80%           | Coste +40–60%, alto riesgo de pérdida de presupuesto |
| > 80%            | Muy difícil. Alto riesgo de obra a medias o escándalo |

### Impacto en Mapas

- **Mapa Nacional**: Icono en la región + cambio de color según desarrollo.
- **Mapa Global**: Al completarse genera **nodo de poder** visible. Otros actores reaccionan.

### Bonus Pasivos por Turno

| Infraestructura           | Bonus típico |
|---------------------------|--------------|
| Aeropuerto Internacional  | +Comercio, +Turismo, +Influencia Blanda |
| Puerto de Aguas Profundas | +Exportaciones, +Control rutas marítimas |
| Base Militar              | +Disuasión, +Proyección, +Alianzas |
| Centro de Datos IA        | +Ventaja tecnológica, +Influencia digital, +IA |

---

## 2. Sistema de Decisiones Contextuales (No cartas infinitas)

Se elimina la lógica de mazo infinito.

Las opciones disponibles **dependen del estado real del país**.

### Principios

- No hay opciones genéricas siempre disponibles.
- Cada decisión tiene requisitos claros.
- Se habilitan/bloquean según:
  - Corrupción
  - Estabilidad Política
  - Apoyo Popular
  - Recursos (Presupuesto, Capital Político, Influencia)
  - Infraestructuras ya construidas
  - Eventos y crisis activas
  - Relaciones con actores y bloques
  - Estado del Banco Central

### Categorías

1. **Decisiones de Crisis** → Solo con evento/crisis activa
2. **Decisiones de Política Económica / Banco Central**
3. **Decisiones de Infraestructura** → Solo si se cumplen requisitos
4. **Decisiones de Política Exterior y Bloques**
5. **Decisiones Morales / de Justicia** → Ligadas a corrupción

### Ejemplo de lógica de desbloqueo

```ts
if (corruption < 40 && stability > 55 && budget >= cost && politicalCapital >= req) {
  show("Construir Aeropuerto Internacional");
}

if (corruption > 70) {
  hideOrExpensive("opciones limpias");
  show("atajos corruptos"); // más baratos, coste moral
}
```

### Feedback

Cuando una decisión está bloqueada se muestra claramente el motivo:
- “Corrupción demasiado alta”
- “Presupuesto insuficiente”
- “Requiere Centro de Datos IA”
- etc.

---

## 3. Base lógica de código (TypeScript)

```ts
// lib/infrastructure.ts  (esqueleto)

export type InfraType = "airport" | "port" | "military_base" | "ai_datacenter";

export interface Infrastructure {
  id: string;
  type: InfraType;
  regionId: string;
  progress: number;       // 0-100
  completed: boolean;
  costPaid: number;
  corruptionPenalty: number;
}

export const INFRA_CONFIG: Record<InfraType, {
  baseCost: number;
  baseTime: number;       // turnos
  minStability: number;
  maxCorruption: number;
  globalImpact: string;
  passiveBonus: Partial<Record<string, number>>;
}> = {
  airport: {
    baseCost: 120,
    baseTime: 4,
    minStability: 45,
    maxCorruption: 70,
    globalImpact: "air_routes",
    passiveBonus: { trade: 0.15, softPower: 0.10 }
  },
  port: {
    baseCost: 180,
    baseTime: 6,
    minStability: 50,
    maxCorruption: 65,
    globalImpact: "sea_lanes",
    passiveBonus: { exports: 0.20, seaControl: 0.15 }
  },
  military_base: {
    baseCost: 220,
    baseTime: 7,
    minStability: 55,
    maxCorruption: 60,
    globalImpact: "military_projection",
    passiveBonus: { deterrence: 0.25, alliances: 0.10 }
  },
  ai_datacenter: {
    baseCost: 300,
    baseTime: 5,
    minStability: 60,
    maxCorruption: 50,
    globalImpact: "data_nodes",
    passiveBonus: { tech: 0.30, digitalInfluence: 0.20, ai: 0.15 }
  }
};

export function canBuild(
  type: InfraType,
  budget: number,
  politicalCapital: number,
  stability: number,
  corruption: number,
  relationsOk: boolean
): { ok: boolean; reason?: string } {
  const cfg = INFRA_CONFIG[type];
  if (budget < cfg.baseCost) return { ok: false, reason: "Presupuesto insuficiente" };
  if (stability < cfg.minStability) return { ok: false, reason: "Estabilidad demasiado baja" };
  if (corruption > cfg.maxCorruption) return { ok: false, reason: "Corrupción demasiado alta" };
  if (!relationsOk) return { ok: false, reason: "Bloques geopolíticos bloquean la obra" };
  return { ok: true };
}

export function applyCorruptionCostMultiplier(baseCost: number, corruption: number): number {
  if (corruption < 30) return baseCost;
  if (corruption < 60) return baseCost * 1.20;
  if (corruption < 80) return baseCost * 1.50;
  return baseCost * 1.80;
}
```

```ts
// lib/contextualDecisions.ts  (esqueleto)

export interface DecisionRequirement {
  minStability?: number;
  maxCorruption?: number;
  minBudget?: number;
  minPoliticalCapital?: number;
  requiredInfra?: InfraType[];
  requiresCrisis?: boolean;
  minConfidence?: number;
}

export interface ContextualDecision {
  id: string;
  category: "crisis" | "economy" | "infra" | "foreign" | "moral";
  title: string;
  requirements: DecisionRequirement;
  effects: Record<string, number>;
}

export function isDecisionAvailable(
  decision: ContextualDecision,
  state: {
    stability: number;
    corruption: number;
    budget: number;
    politicalCapital: number;
    completedInfra: InfraType[];
    hasActiveCrisis: boolean;
    confidence: number;
  }
): { available: boolean; reason?: string } {
  const r = decision.requirements;

  if (r.minStability !== undefined && state.stability < r.minStability)
    return { available: false, reason: "Estabilidad insuficiente" };
  if (r.maxCorruption !== undefined && state.corruption > r.maxCorruption)
    return { available: false, reason: "Corrupción demasiado alta" };
  if (r.minBudget !== undefined && state.budget < r.minBudget)
    return { available: false, reason: "Presupuesto insuficiente" };
  if (r.minPoliticalCapital !== undefined && state.politicalCapital < r.minPoliticalCapital)
    return { available: false, reason: "Capital político insuficiente" };
  if (r.requiredInfra?.length) {
    const missing = r.requiredInfra.filter(i => !state.completedInfra.includes(i));
    if (missing.length) return { available: false, reason: `Requiere: ${missing.join(", ")}` };
  }
  if (r.requiresCrisis && !state.hasActiveCrisis)
    return { available: false, reason: "Solo disponible en crisis" };
  if (r.minConfidence !== undefined && state.confidence < r.minConfidence)
    return { available: false, reason: "Confianza monetaria demasiado baja" };

  return { available: true };
}
```

---

**Fin del documento**

Usar estos esqueletos como punto de partida para reducir tokens al implementar en Claude.
