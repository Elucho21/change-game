# Lógicas Económicas Completas del Juego
**CHANGE WORLD GAME 1.0** — fuente de verdad de diseño económico.

Código de contenido que ya refleja esto (zona Grok):
- `lib/employment_sectors.ts` — intensidades de empleo y formalidad
- `lib/decisions_economia.ts` — formalización e impulso por sector
- Eventos de deflación / informalidad / recaudación en `lib/events/national_extra.ts`

Lo que **falta cablear en el motor** está pedido en `docs/PEDIDOS_A_OPUS.md`.

**Versión actualizada – Agosto 2026**  
Incluye: Sistema previsional, Capital Político/Diplomático, Inflación/Deflación, Tipo de Cambio, Empleo, Salarios, Reservas, Superávit pasivo y las últimas propuestas de diseño.

---

## 1. Regla nueva de Deflación + Reservas + Superávit Pasivo

### Principio central
Si el país entra en **deflación** (inflación < 0):

1. **Las Reservas Internacionales crecen de forma PASIVA.**  
   - Fórmula aproximada:  
     \[
     \Delta \text{Reservas}_{\text{pasivo}} \approx |\pi| \times \text{factor} \times \text{Reservas actuales}
     \]
   - Factor recomendado: **1.0% – 1.5%** de las reservas por cada 1 punto porcentual de deflación anual.
   - Mecanismos reales simulados: apreciación real de la moneda, menor demanda de importaciones, posible entrada de capitales en busca de activos reales, y fortalecimiento del poder de compra de las reservas existentes.

2. **Si existe Superávit fiscal, éste NO decrece de forma pasiva.**  
   - Se preserva en términos nominales.  
   - Se fortalece en términos reales (el mismo superávit “compra” más bienes y servicios).  
   - Esto da un círculo virtuoso: deflación → más reservas → más confianza → más facilidad para mantener el superávit.

3. **Efecto sobre salarios y aprobación:**  
   - Si los salarios nominales se mantienen (o bajan menos que los precios), el **poder adquisitivo real sube automáticamente**.  
   - Esto genera Capital Político positivo sin necesidad de gastar.

### Riesgos de la deflación (para balance)
- Si es profunda y prolongada (> 2-3% anual durante varios trimestres) puede generar:
  - Postergación de consumo e inversión (expectativas de precios aún más bajos).
  - Dificultad para bajar salarios nominales (rigidez a la baja).
  - Aumento de la carga real de la deuda privada.

**Diseño recomendado:** Deflación leve (0 a -1.5%) es muy positiva. Deflación profunda es una trampa suave que el jugador debe manejar.

---

## 2. Impacto en Salarios (nuevo desarrollo)

| Factor                              | Efecto en Salarios Reales          | Efecto en Nominales       | Velocidad   | Notas |
|-------------------------------------|------------------------------------|---------------------------|-------------|-------|
| Suba aporte trabajador              | ↓ Fuerte (neto)                    | Neutro o leve ↓           | Inmediata   | El trabajador siente la pérdida de inmediato |
| Suba aporte empleador               | Leve ↓ (si se traslada)            | Posible ↓ o estancamiento | Media       | Empresas moderan aumentos |
| ↑ Empleo formal / formalización     | ↑ Presión alcista                  | ↑                         | Media-Lenta | Más demanda de trabajo formal |
| ↑ Desempleo                         | ↓ Fuerte                           | ↓ o estancamiento         | Rápida      | Debilita negociación |
| **Deflación**                       | **↑ Reales** (si nominales se mantienen) | Estables o leves ↓   | Media       | Poder adquisitivo mejora solo |
| Inflación alta no indexada          | ↓ Fuerte                           | ↑ (pero real cae)         | Rápida      | Uno de los peores para el trabajador |
| Crecimiento de productividad        | ↑ Reales                           | ↑                         | Lenta       | Canal más sano |
| Suba edad de jubilación             | Leve ↓ presión (más oferta)        | Leve ↓                    | Lenta       | Más trabajadores activos |

**Elasticidades clave (editables):**
- Elasticidad salarios-empleo formal ≈ 0.4
- Elasticidad salarios-productividad ≈ 0.7
- Impacto de aportes en salarios netos ≈ -0.9 (casi 1:1)
- Indexación salarios a inflación ≈ 0.85 (ajustable)

---

## 3. Lógica de Empleo (resumen + 3 propuestas desarrolladas)

### Canales principales
- Aportes ↑ → Formalidad ↓ / Informalidad ↑ / Desempleo posible ↑
- Edad de jubilación ↑ → Oferta laboral (PEA) ↑
- Formalización ↑ → Empleo formal ↑ + Capital Político ↑
- Crecimiento PBI → Empleo total ↑ (elasticidad 0.45-0.60)
- Superávit + baja inflación → Mejor entorno para empleo formal

### Fórmula simplificada de Empleo Formal
\[
\Delta \text{Empleo Formal} \approx \varepsilon \cdot \Delta\text{PBI} - \alpha \cdot \Delta(\text{Aportes}) - \beta \cdot \Delta(\text{Costo Laboral}) + \gamma \cdot \Delta\text{Cobertura} + \delta \cdot \Delta(\text{Edad Jubilación})
\]

### Las 3 propuestas adicionales (desarrolladas)

#### A) Interacción Empleo ↔ Sectores del PBI
Cada sector tiene distinta intensidad de empleo y formalidad:
- **Minería y Energía**: Alto valor agregado, bajo empleo relativo, alta formalidad.
- **Industria**: Medio-alto empleo formal, sensible a costo laboral y energía.
- **Servicios**: Alto empleo, formalidad variable.
- **Turismo**: Alto empleo, más propenso a informalidad, muy sensible a seguridad y tipo de cambio.
- **Tecnología**: Altos salarios, bajo volumen de empleo, alta productividad.
- **Gasto Estatal**: Empleo público rígido (difícil de reducir).

El jugador, al impulsar un sector (vía ministro o política), mueve el empleo de forma diferenciada. Impulsar minería da PBI y exportaciones pero poco empleo. Impulsar turismo o industria da más empleo pero con distintos grados de formalidad.

#### B) Sistema de Incentivos a la Formalización
Acciones disponibles para el jugador:
- Reducción temporal de aportes (1-3 años) para nuevos formales.
- Créditos fiscales por formalización.
- Simplificación burocrática (requiere ministro de Trabajo/Economía competente).
- Amnistías parciales de deudas previsionales.

**Trade-off:** Coste fiscal en el corto plazo vs ganancia de cobertura + Capital Político a mediano plazo.  
**Riesgo:** Si la fiscalización es débil, se genera abuso y el coste fiscal se vuelve permanente.

#### C) Rol del Ministro de Trabajo / Economía
La competencia del ministro (0-100) actúa como **multiplicador**:
- Ministro alto: reduce el daño de subas de aportes sobre el empleo formal, acelera formalización, mitiga protestas, mejora diseño de incentivos.
- Ministro débil: amplifica todos los efectos negativos.
- Nombrar o destituir tiene coste de Capital Político según lealtad, momento político y si hay crisis.

---

## 4. Vínculos con el resto del sistema

- **Superávit + Deflación** = círculo virtuoso de reservas + preservación del superávit + mejora de salarios reales + Capital Político.
- **Déficit + Inflación** = espiral de emisión → inflación → devaluación → pérdida de poder adquisitivo → destrucción de empleo formal → más presión sobre el sistema previsional.
- El **empleo** y los **salarios reales** son de los 3-4 indicadores que más mueven el voto y el Capital Político (junto con inflación y seguridad).
- Las reformas previsionales siempre tienen el trade-off explícito: sostenibilidad fiscal vs riesgo de destrucción de empleo formal en el corto plazo.

---

## 5. Archivo de soporte
Todo lo anterior está implementado y parametrizado en:

`Gestion_Jubilaciones_Juego.xlsx`

Hojas relevantes:
- Parámetros Sistema (incluye deflación, reservas, salarios, empleo)
- Impacto en Empleo (canales, fórmulas, salarios, deflación, 3 propuestas)
- Reformas y Capital Político
- Calculadora Reforma
- Fórmulas Economía
- Proyección 10 años
- Dashboard Rápido

---

**Fin del documento de lógicas.**  
Usar este MD como fuente de verdad para continuar el desarrollo.

---

## 6. Crecimiento / Contracción de la Economía → Impacto en la Recaudación (nueva lógica)

### Principio central
El **tamaño de la economía (PBI)** impacta directamente la recaudación tributaria y previsional.  
Por lo tanto, **bajar impuestos tiene sentido a mediano plazo** porque el aumento de la actividad económica (mayor base imponible + formalización) puede compensar total o parcialmente la menor tasa.

### Fórmulas de diseño

**Recaudación estática:**
\[
\text{Recaudación}_t = \text{CargaTributaria} \times \text{PBI}_t
\]

**Cuando cambia el tamaño de la economía:**
\[
\Delta \text{Recaudación} \approx \text{Elasticidad}_{\text{Recaudación/PBI}} \times \Delta\text{PBI} \times \text{Recaudación}_{t-1}
\]
- Elasticidad (tax buoyancy) típica: **1.10 – 1.30**  
  (Si el PBI crece 3%, la recaudación tiende a crecer 3.3–3.9%).

**Efecto dinámico de bajar impuestos:**

1. **Efecto estático inmediato** (dolor corto plazo):  
   \(\Delta\text{Recaudación}_{\text{estática}} = \Delta\text{tasa} \times \text{Base actual}\) (negativo)

2. **Efecto actividad económica**:  
   \(\Delta\text{PBI} \approx \text{Elasticidad}_{\text{PBI/Carga}} \times \Delta\text{CargaTributaria}\)  
   (Elasticidad recomendada ≈ **-0.30 a -0.45**)

3. **Efecto formalización**:  
   Bajar la carga tributaria aumenta la formalización → más empleo formal → más aportes + más IVA/ganancias.

4. **Efecto dinámico total a mediano plazo (años 3-5)**:  
   \[
   \Delta\text{Recaudación}_{\text{dinámica}} \approx \Delta\text{Recaudación}_{\text{estática}} + (\text{Elasticidad} \times \Delta\text{PBI} \times \text{Recaudación}) + \text{efecto formalización}
   \]

### Por qué bajar impuestos puede tener sentido
- La pérdida estática se ve parcialmente o totalmente compensada por el mayor tamaño de la economía y por mayor formalización.
- Lag típico: **2-4 años**. Corto plazo duele; mediano plazo puede ser neutral o positivo para la caja.
- Condiciones para que funcione bien: estabilidad macro, credibilidad de que la baja es permanente, y que no se financie con emisión.
- En economías con alta informalidad o en recesión el efecto dinámico es más potente.

### Vínculo con el resto del sistema
- Superávit + deflación leve + baja de impuestos bien diseñada → círculo virtuoso (más actividad → más recaudación dinámica → superávit más fácil → más reservas pasivas).
- Contracción del PBI → caída más que proporcional de la recaudación → dificulta el superávit y empeora cualquier déficit.
- Bajar impuestos también ayuda al empleo formal (menor costo laboral + mayor formalización).

### Parámetros editables en el Excel
- Carga tributaria total (% PBI)
- Elasticidad recaudación / PBI
- Elasticidad PBI / carga tributaria
- Elasticidad formalización / carga tributaria
- Lag del efecto (años)
- % de compensación media a mediano plazo

Hay una **Calculadora rápida de efecto dinámico de baja de impuestos** en la hoja “Calculadora Reforma”.

---

**Actualización de versión:** Lógicas económicas completas + dinámica de recaudación por crecimiento/contracción + justificación de baja de impuestos a mediano plazo.
