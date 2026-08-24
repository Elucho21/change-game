# CHANGE WORLD GAME – Identidad del juego
**De Democracy → Power & Revolution + Pax Historia**  
Para Claude / Grok Build · 2026-08-24

---

## 1. Posicionamiento (una frase)

> **Geopolítica por turnos con motor duro + capa narrativa de IA.**  
> Jugás un país en un mundo que se mueve. Gobernás en casa, proyectás afuera, y el informe del mes te cuenta qué hizo el resto del planeta.

No somos un simulador de votantes con el mapa de decorado.  
No somos un Excel de 1000 acciones.  
No somos solo chat con un LLM.

Somos el híbrido: **números que importan + mundo que actúa + crónica que se siente real**.

---

## 2. Referencias y qué tomamos de cada una

| Juego | Esencia | Qué nos quedamos | Qué evitamos |
|-------|---------|------------------|---------------|
| **Democracy 3/4** | Gobierno interno, políticas, votantes, capital político | Capital político, grupos de apoyo, ciclo electoral, trade-offs internos | Sliders eternos como eje central; victoria = solo reelección; mundo casi inexistente |
| **Power & Revolution** | País dentro de un sistema mundial vivo | Mapa como herramienta de poder; infra; comercio/turismo; militar; otros países que actúan; oposición con peso | 1000 acciones sin jerarquía; micro-wargame de unidades desde el día 1 |
| **Pax Historia** | IA como motor; acciones con peso narrativo; time-jump + reporte | Crónica de fin de turno; diplomacia con fricción; mundo proactivo; sensación de “el mundo contestó” | 100% texto libre sin motor numérico; pérdida de control de balance |

---

## 3. Ejes de sensación (checklist de diseño)

Cada feature nueva debe empujar al menos uno de estos ejes **lejos de Democracy** y **hacia P&R/Pax**:

### Eje A — Mapa = poder (P&R)
- Infraestructura con impacto global (aeropuertos, puertos, bases, centros IA)
- Nodos visibles en el globo
- Comercio y turismo como canales, no solo KPIs
- Chokepoints y rutas que duelen de verdad

### Eje B — Mundo que actúa sin vos (P&R + Pax)
- Potencias toman decisiones propias cada turno
- Crisis regionales con “dueño”
- Reordenamiento de bloques y sanciones que no dependen solo del jugador
- Eventos mundiales con impacto asimétrico (ya parcialmente hecho)

### Eje C — Diplomacia con fricción (P&R + Pax)
- Capital diplomático escaso y visible
- Acciones de alto impacto (cumbres, comprar tiempo, suavizar sanciones)
- Prestigio / soft power que alimenta turismo y regeneración diplomática

### Eje D — Tablero interno vivo (P&R, no Democracy puro)
- Minoritarios visibles (Gustavo, Amalia, Jhon) sin bajar umbrales
- Oposición, parlamento, gabinete con coste real
- Moral / corrupción con consecuencias de mediano plazo

### Eje E — Crónica de turno (Pax)
- Al cerrar el mes: informe corto legible (“qué hizo el mundo”)
- No solo log técnico de deltas
- Opcional: capa Grok para realismo fino (ver `docs/CRONICA_FIN_DE_TURNO.md`)

---

## 4. Qué ya empuja en la dirección correcta

- Globo 3D + capas (diplomacia, comercio, rutas, chokepoints)
- Comercio bilateral por gravedad + efecto en crecimiento
- Bloques con cohesión y reglas de entrada/salida
- Capital político **y** capital diplomático separados
- Plan de turno (órdenes → ejecución al avanzar mes)
- Preview a 3 meses
- IA roster de potencias + reacciones
- Sistema moral + líderes minoritarios (contenido listo; pipeline a reforzar)
- Puente Grok existente

---

## 5. Qué todavía “suena Democracy” (y hay que diluir)

- Sensación de que el loop principal es “gastar capital en decisiones internas y mirar felicidad/estabilidad”
- Poca visibilidad del comercio/turismo como herramienta
- Diplomacia como categoría de menú, no como teatro de prestigio y riesgo
- Feed de turno más log que informe de inteligencia
- Mapa todavía más informativo que operacional (infra global no jugable del todo)

**Regla:** no borrar el eje interno (elecciones, capital político, grupos).  
**Sí:** hacer que cada mes el jugador mire también el tablero mundial y la crónica.

---

## 6. Prioridades de diseño (orden de impacto en identidad)

| # | Trabajo | Eje | Doc relacionado |
|---|---------|-----|-----------------|
| 1 | Fix minoritarios (`onboarded` + `moral` en sorteo) | D | `LIDERES_MINORITARIOS_DIAGNOSTICO.md` |
| 2 | UI comercio/turismo (top partner, % baseline, drivers turismo) | A | `COMERCIO_Y_TURISMO_FORMULAS.md` |
| 3 | Capital diplomático visible + acciones de alto impacto | C | `CAPITAL_DIPLOMATICO_FORMULAS.md` |
| 4 | **Crónica de fin de turno** | E | `CRONICA_FIN_DE_TURNO.md` |
| 5 | Primera infra global jugable (aeropuerto o puerto) | A | `INFRAESTRUCTURA_Y_DECISIONES_CONTEXTUALES.md` |
| 6 | Ampliar mundo proactivo (más aiCountryDecisions / crisis con dueño) | B | — |
| 7 | Guerra limitada / proyección militar | A/B | PLAN_MEJORAS (pendiente) |

---

## 7. Anti-patrones (no hacer)

1. **No** convertir el juego en un árbol infinito de sliders tipo Democracy.
2. **No** añadir 200 decisiones genéricas “siempre disponibles”.
3. **No** hacer que la reelección sea la única condición de éxito a largo plazo.
4. **No** reemplazar el motor numérico por “solo Grok decide”.
5. **No** bajar umbrales de minoritarios para forzar contenido: arreglar el pipeline.
6. **No** saturár el feed con ruido; la crónica debe ser corta y legible.

---

## 8. Test de identidad (para cualquier PR de diseño)

Antes de mergear una feature, preguntar:

1. ¿Esto hace que el **mapa** importe más, igual o menos?
2. ¿El **mundo** puede sorprender al jugador sin que él mueva ficha?
3. ¿La **diplomacia** se siente costosa y estratégica, o es otro botón de menú?
4. ¿Al cerrar el turno el jugador entiende **qué pasó en el planeta**, no solo en su Excel interno?
5. ¿Estamos reforzando “admin de votantes” o “jefe de Estado en un sistema mundial”?

Si la mayoría apunta a Democracy puro → rediseñar o recortar alcance.

---

## 9. Resumen para Claude

- Identidad objetivo: **ido P&R (sistema mundial + mapa-poder) + Pax (crónica + mundo proactivo), con base interna sólida heredada de Democracy pero **no como eje único**.
- Docs de soporte ya en el repo: capital diplomático, comercio/turismo, infraestructura, minoritarios, banco central.
- Siguiente pieza de identidad explícita: **crónica de fin de turno** (`docs/CRONICA_FIN_DE_TURNO.md`).

**Fin del documento**
