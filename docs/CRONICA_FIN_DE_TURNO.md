# CHANGE WORLD GAME – Crónica de fin de turno
**Capa narrativa estilo Pax Historia**  
Para Claude / Grok Build · 2026-08-24

Complementa el puente existente (`docs/GROK.md`, `components/GrokBridge.tsx`, `buildGrokPrompt` en `lib/engine.ts`).

---

## 1. Objetivo

Al cerrar el mes, el jugador no solo ve un log de deltas.  
Ve un **informe corto** de qué pasó en el mundo y en su país: tono de parte de inteligencia / crónica geopolítica.

Eso empuja la identidad hacia **Pax Historia** sin reemplazar el motor numérico.

---

## 2. Cuándo se genera

### Momento

**Después** de `deterministicTick` + resolución de plan + eventos + reacciones IA,  
**antes** de mostrar el feed final al jugador (o como bloque destacado al tope del feed del turno).

Flujo sugerido en `endTurn`:

```
1. runPlan()
2. deterministicTick()
3. rollEvents / crisis / apply…
4. aiReactions + aiCountryDecisions
5. capital regen / moral tick / etc.
6. ★ generar Crónica de fin de turno
7. push al feed (o panel “Informe del mes”)
8. checkGameOver / persist
```

### Frecuencia

- **Siempre** una crónica local (plantilla, sin tokens).
- **Opcional** crónica enriquecida con Grok (cuando el jugador usa el puente o en “modo narrativo” si se activa).

No bloquear el turno si Grok falla: fallback a plantilla.

---

## 3. Formato de salida (contrato)

### 3.1 Estructura fija (4–7 líneas)

```ts
interface TurnChronicle {
  /** Título corto del mes, ej. "Marzo 2027 — Presión en el Pacífico" */
  headline: string;
  /** 3–6 bullets o frases cortas */
  lines: string[];
  /** Origen: plantilla local vs Grok */
  source: 'local' | 'grok';
  /** Turno al que corresponde */
  turn: number;
}
```

### 3.2 Contenido mínimo (local, sin IA)

La crónica local debe mencionar, si aplica:

| Prioridad | Señal | Ejemplo de línea |
|-----------|--------|------------------|
| 1 | Cambio fuerte de comercio vs baseline | "El comercio total cayó 12% respecto al inicio de mandato; el principal socio sigue siendo China." |
| 2 | Movimiento de potencias (aiCountryDecisions) | "Estados Unidos endureció su política monetaria ante la inflación." |
| 3 | Evento mundial o chokepoint | "El cierre de Ormuz mantiene el petróleo al alza." |
| 4 | Bloque / diplomacia del jugador | "La cohesión de MERCOSUR subió tras la cumbre." |
| 5 | Interno crítico | "La estabilidad se mantiene en zona de riesgo; el desempleo en 14%." |
| 6 | Moral / minoritarios (si onboarded) | "Crece la presión de sectores movilizados en la calle." |

Máximo **6 líneas**. Sin relleno.

### 3.3 Tono

- Parte de inteligencia / cable diplomático, no tutorial.
- Tercera persona o impersonal.
- Sin consejos al jugador (“deberías…”).
- Puede ser seco o tenso según indicadores (estabilidad baja → tono más duro).

---

## 4. Generación local (sin Grok)

### Entrada

```ts
interface ChronicleInput {
  turn: number;
  dateLabel: string;           // "marzo 2027"
  playerName: string;
  // Comercio
  tradeChangeVsStart: number;  // %
  topPartner: string | null;
  // Interno
  stability: number;
  happiness: number;
  unemployment: number;
  inflation: number;
  // Mundo
  oilPrice: number;
  oilShock: number;
  globalTension: number;
  // IA / eventos de este turno
  aiMoves: { country: string; action: string }[];
  worldEventTitles: string[];
  nationalEventTitles: string[];
  // Diplomacia
  capitalDiplomatico: number;
  blocNames: string[];
  // Moral opcional
  moralOnboarded?: boolean;
  corruption?: number;
}
```

### Lógica de plantilla (esqueleto)

```ts
// lib/chronicle.ts

export function buildLocalChronicle(input: ChronicleInput): TurnChronicle {
  const lines: string[] = [];

  // Comercio
  if (Math.abs(input.tradeChangeVsStart) >= 5 && input.topPartner) {
    const dir = input.tradeChangeVsStart > 0 ? 'subió' : 'cayó';
    lines.push(
      `El comercio total ${dir} ${Math.abs(input.tradeChangeVsStart).toFixed(0)}% respecto al inicio; principal socio: ${input.topPartner}.`
    );
  }

  // Petróleo / rutas
  if (input.oilShock > 0) {
    lines.push(`Las interrupciones en rutas mantienen presión sobre el petróleo (≈ ${input.oilPrice.toFixed(0)} USD).`);
  }

  // Movimientos IA (máx 2)
  for (const m of input.aiMoves.slice(0, 2)) {
    lines.push(m.action);
  }

  // Eventos mundiales
  for (const t of input.worldEventTitles.slice(0, 1)) {
    lines.push(`En el tablero global: ${t}.`);
  }

  // Interno
  if (input.stability < 40) {
    lines.push(`La estabilidad interna sigue bajo presión (${input.stability.toFixed(0)}).`);
  } else if (input.unemployment >= 12) {
    lines.push(`El desempleo en ${input.unemployment.toFixed(0)}% marca la agenda doméstica.`);
  }

  // Headline
  const headline = `${input.dateLabel} — ${pickHeadline(input)}`;

  return {
    headline,
    lines: lines.slice(0, 6),
    source: 'local',
    turn: input.turn
  };
}

function pickHeadline(input: ChronicleInput): string {
  if (input.oilShock > 0) return 'Rutas bajo tensión';
  if (input.stability < 35) return 'Agenda interna en riesgo';
  if (Math.abs(input.tradeChangeVsStart) >= 10) return 'Reacomodo comercial';
  if (input.globalTension > 65) return 'Clima internacional cargado';
  return 'Balance del mes';
}
```

---

## 5. Capa Grok (opcional)

### Cuándo llamar

1. El jugador presiona el flujo narrativo existente (puente Grok), **o**
2. Setting “Crónica narrativa” activado y hay cuota/API, **o**
3. Eventos de alta intensidad este turno (guerra de rutas, crisis institucional, sanción mayor) → sugerir enriquecer.

**No** llamar a Grok en silencio cada turno por defecto (costo + latencia).  
La crónica **local siempre existe**; Grok la **reemplaza o amplía** cuando se pide.

### Prompt compacto (añadir al puente)

Además del JSON de reacciones ya definido en `GROK.md`, pedir un bloque:

```json
{
  "chronicle": {
    "headline": "string corto",
    "lines": ["frase 1", "frase 2", "frase 3", "frase 4"]
  }
}
```

Reglas en el prompt:

- Máximo 5 líneas.
- Basarse solo en hechos del estado enviado (comercio, eventos, movimientos IA, indicadores).
- No inventar guerras o tratados que el motor no refleje.
- Tono cable diplomático.
- Idioma: español.

### Validación

- Si `lines.length === 0` o JSON inválido → quedarse con crónica local.
- Recortar a 6 líneas máximo.
- No aplicar efectos numéricos desde la crónica (solo texto). Los números siguen saliendo del motor.

---

## 6. UI

### Dónde mostrarla

Opción recomendada:

- **Bloque fijo al inicio del feed del turno** (distinto estilo: tipografía un poco más “informe”, borde o icono 🗞️ / 🛰️).
- Headline en negrita; líneas como lista.
- Badge `Local` vs `Grok` para transparencia.

Opción secundaria:

- Panel colapsable “Informe del mes” junto al feed.

### Qué no hacer

- No mezclar la crónica con cada línea de `applyDelta`.
- No hacer scroll infinito de prosa.
- No tapar el plan del turno ni los eventos que requieren decisión.

---

## 7. Integración en store (contrato)

```ts
// En estado del turno / history
chronicle?: TurnChronicle;

// Al final de endTurn, tras armar ChronicleInput desde el estado post-tick:
const chronicle = buildLocalChronicle(input);
// Si el jugador pidió Grok y hay respuesta válida:
// chronicle = mergeOrReplaceWithGrok(chronicle, grokJson.chronicle);
st.feed.unshift({
  id: `chronicle-${st.turn}`,
  kind: 'chronicle',
  title: chronicle.headline,
  body: chronicle.lines.join('\n'),
  turn: st.turn
});
st.chronicle = chronicle;
```

Persistir `chronicle` del último turno (opcional) o solo en `history` resumido.

---

## 8. Orden de implementación

1. `lib/chronicle.ts` + `buildLocalChronicle` con señales ya disponibles (`trade`, `aiMoves`, oil, stability).
2. Enganche en `endTurn` + entrada de feed dedicada.
3. Estilo UI mínimo.
4. Extender contrato Grok con `chronicle` opcional y merge seguro.
5. (Opcional) Setting “siempre intentar crónica Grok” para quien tenga API.

---

## 9. Criterio de éxito (identidad)

El jugador, al avanzar un mes, debería poder responder en 10 segundos:

- ¿Qué pasó **afuera** que me importa?
- ¿Mi **comercio / rutas** se movieron?
- ¿El **clima interno** está estable o en riesgo?

Si solo ve “+0.2 crecimiento, −1 capital”, seguimos en modo Democracy/log.  
Si ve un informe de 4 líneas que conecta mundo + país, estamos en modo **Pax + P&R**.

---

**Fin del documento**

Implementar primero la crónica **local**; Grok es mejora, no dependencia.
