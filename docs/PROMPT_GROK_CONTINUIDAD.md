# CHANGE WORLD GAME – Continuidad Grok
**Versión 1.0**

# Prompt de Continuidad para Grok (yo) – Diseño Económico del Juego

**Este es el contexto maestro que debo cargar / recordar en futuras conversaciones de este proyecto.**

---

Proyecto: Diseño de simulación de gobierno / geopolítica con economía realista.

### Estado actual de las lógicas (Agosto 2026)

**Regla prioritaria recién agregada – Deflación:**
- Si el país tiene **deflación** (inflación < 0):
  - Las **Reservas Internacionales crecen de forma PASIVA**.
  - Si además hay **Superávit fiscal**, el superávit **NO decrece de forma pasiva**; se preserva y se fortalece en términos reales.
- Deflación leve = círculo virtuoso (reservas ↑, poder adquisitivo ↑, Capital Político ↑).
- Deflación profunda = riesgo de trampa suave (postergación de gasto e inversión).

**Empleo + Salarios (últimas 3 propuestas ya desarrolladas e integradas):**
1. Interacción Empleo ↔ Sectores del PBI (intensidad de empleo y formalidad diferente por sector).
2. Sistema de Incentivos a la Formalización (reducciones temporales de aportes, créditos fiscales, simplificación, amnistías).
3. Rol del Ministro de Trabajo/Economía como multiplicador de impactos según competencia (0-100).

Además:
- Impacto detallado de cada variable sobre salarios reales y nominales.
- Fórmulas de empleo formal con elasticidades.
- Desempleo e informalidad como drivers fuertes de Capital Político y voto.

**Otros sistemas ya sólidos:**
- Capital Político base = 10.
- Sistema previsional completo con reformas costosas y calculadora.
- Inflación, tipo de cambio, deuda/PBI, superávit/déficit.
- 15 países con Especiales (Ormuz solo Irán).
- Timeline vivo de otros países.
- Ministros con interoperabilidad real.

### Archivos clave en /home/workdir/artifacts/
- `Gestion_Jubilaciones_Juego.xlsx` → Archivo maestro de parámetros, proyecciones, calculadoras e impactos.
- `Logicas_Economicas_Completas.md` → Documento de verdad de todas las lógicas.
- `Prompt_Claude.md` → Prompt listo para pasarle a Claude si el usuario quiere continuar con él.
- Este archivo (`Prompt_Grok_Continuidad.md`) → Mi propia memoria de continuidad.

### Instrucciones para mí (Grok) en próximas interacciones:
1. Siempre partir de estas lógicas. No contradecirlas.
2. Cuando el usuario pida “agregar”, “desarrollar” o “pushear”, actualizar el Excel + los MD correspondientes.
3. Mantener el tono de diseño colaborativo, proponer trade-offs claros y números balanceables.
4. Responder en español.
5. Si se crean nuevos archivos, guardarlos en /home/workdir/artifacts/ y avisar.
6. Recordar proactivamente las reglas de deflación + reservas pasivas + superávit preservado cada vez que se hable de inflación, reservas o resultado fiscal.

### Próximas áreas naturales de expansión (si el usuario no especifica):
- Interacción completa Empleo × Sectores del PBI (tabla de intensidades).
- Sistema concreto de incentivos a la formalización (acciones con costes y tiempos).
- Fórmulas más precisas de salarios reales bajo deflación/inflación.
- Feedback visual en el Timeline y en la UI del jugador sobre estos efectos.
- Balance de Capital Político cuando hay deflación + superávit + empleo formal creciente (combo poderoso).

---

**Usar este documento como ancla de continuidad del proyecto.**

### Actualización Agosto 2026 – Dinámica de Recaudación
- El crecimiento o contracción del PBI impacta la recaudación con elasticidad > 1 (tax buoyancy ≈ 1.10-1.30).
- Bajar impuestos tiene coste estático inmediato pero puede compensarse a mediano plazo (2-4 años) vía mayor actividad económica + formalización.
- Existe calculadora simplificada de efecto dinámico en la hoja Calculadora Reforma del Excel.
- Esta lógica hace que bajar impuestos tenga sentido estratégico y no solo político.
