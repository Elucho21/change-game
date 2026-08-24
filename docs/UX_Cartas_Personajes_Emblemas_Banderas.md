# UX / UI – Cartas, Personajes, Emblemas y Banderas
## CHANGE WORLD GAME v1.1

**Objetivo:** Elevar el diseño, la animación y la claridad de la capa de cartas y personajes (Sistema Moral + líderes + eventos) hasta un nivel profesional, y dejar lista la infraestructura visual para **emblemas de personajes** y **banderas de países**.

---

## 1. Principios de diseño

| Principio | Descripción |
|-----------|-------------|
| **Legibilidad primero** | El jugador debe entender en < 2 segundos quién habla y qué está en juego. |
| **Personalidad visual** | Cada personaje tiene color, forma y ritmo de animación propios. |
| **Feedback inmediato** | Toda opción muestra preview de impacto en KPIs antes de confirmar. |
| **Escalabilidad** | El mismo sistema de carta sirve para Enrique, líderes minoritarios, Corte, Comisión, eventos internacionales y futuros personajes. |
| **Banderas y emblemas nativos** | Todo personaje o país puede llevar un emblema/flag sin romper el layout. |

---

## 2. Anatomía de una Carta de Evento (estructura base)

```
┌─────────────────────────────────────────────────────────────┐
│  [Emblema/Flag]  NOMBRE DEL PERSONAJE / EVENTO              │
│  Cargo o tipo de carta                    [Tag de urgencia] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Retrato / Ilustración del personaje]                     │
│                                                             │
│   Diálogo o descripción del evento                          │
│   (máx. 4-5 líneas visibles, scroll si es necesario)        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  OPCIONES                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ A) Título corto │  │ B) Título corto │  │ C) ...      │ │
│  │ Preview KPIs    │  │ Preview KPIs    │  │ Preview     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  [Barra de Corrupción / Investigaciones si aplica]          │
└─────────────────────────────────────────────────────────────┘
```

### Elementos obligatorios

1. **Header**
   - Emblema circular o bandera pequeña (izquierda)
   - Nombre del personaje / título del evento
   - Cargo o categoría (Subsecretario, Líder Partido Comunista, etc.)
   - Tag de urgencia (Normal / Importante / Crítico)

2. **Zona de personaje**
   - Retrato o silueta estilizada
   - Color de acento del personaje detrás o como borde

3. **Cuerpo**
   - Diálogo (Enrique y líderes) o descripción narrativa
   - Tipografía legible, buen contraste

4. **Opciones**
   - 2 a 4 botones
   - Cada uno muestra **preview de impacto** (iconos + números) al hover o siempre visible en mobile
   - Ejemplo de preview: `Corrupción +9  ·  Capital Político -3  ·  Investigaciones -8`

5. **Footer opcional**
   - Barra de estado de Corrupción o Progreso de Investigaciones cuando el evento las afecta

---

## 3. Sistema de Emblemas de Personajes

Cada personaje importante tiene un **emblema** propio (círculo o forma geométrica simple + símbolo).

| Personaje            | Forma base     | Color principal     | Símbolo sugerido                  | Personalidad visual      |
|----------------------|----------------|---------------------|-----------------------------------|--------------------------|
| **Enrique Grook**    | Círculo        | Gris pizarra + oro  | Ojo entreabierto / llave          | Cínico, elegante, oscuro |
| **Gustavo Comun**    | Estrella / puño| Rojo intenso        | Puño cerrado o estrella           | Agitado, combativo       |
| **Amalia Verde**     | Hoja / círculo | Verde esmeralda     | Hoja o planeta                    | Calmada, moralista       |
| **Jhon el Duro**     | Escudo         | Negro + rojo oscuro | Águila / bota / estrella militar  | Duro, autoritario        |
| **Suprema Corte**    | Balanza        | Azul marino + plata | Balanza de la justicia            | Institucional, frío      |
| **Comisión Anticorrupción** | Martillo / sello | Gris + rojo      | Martillo o lupa                   | Investigador             |

### Reglas de emblema

- Tamaño estándar en carta: **48×48 px** (desktop) / **40×40 px** (mobile)
- Siempre con borde sutil y sombra suave
- Animación de entrada: scale 0.8 → 1.0 + fade (200-300 ms)
- En el onboarding de Enrique el emblema aparece primero, luego el nombre, luego el diálogo

---

## 4. Banderas de Países

### Uso

- En eventos internacionales
- En el Timeline cuando un país actúa
- En el globo / mapa
- En cartas de diplomacia o bloques
- En fichas de líderes extranjeros (futuro)

### Especificación técnica

| Propiedad | Valor recomendado |
|-----------|-------------------|
| Formato | SVG preferente (o PNG @2x/@3x) |
| Proporción | 3:2 (estándar internacional) |
| Tamaño en carta | 32×22 px o 40×27 px |
| Tamaño en Timeline | 24×16 px |
| Tamaño en globo/tooltip | 20×14 px |
| Borde | 1 px sutil oscuro o sombra para contraste sobre cualquier fondo |
| Fallback | Código ISO del país en un rectángulo de color neutro |

### Convención de nombres de archivo

```
flags/
  PER.svg
  USA.svg
  CHN.svg
  BRA.svg
  ...
```

Usar códigos ISO 3166-1 alpha-3 (o alpha-2 si el motor ya los usa).

---

## 5. Animaciones y micro-interacciones

### Entrada de carta (todas)

1. Overlay oscuro semitransparente (fade in 150 ms)
2. Carta entra desde abajo o con scale + fade (300-400 ms, ease-out)
3. Emblema/flag hace un pequeño “pop” (scale 0.7 → 1.05 → 1.0)
4. Texto del diálogo aparece con leve delay (stagger de 50-80 ms por línea si se desea)

### Onboarding de Enrique (especial)

Secuencia recomendada:

1. Pantalla se oscurece
2. Emblema de Enrique aparece en el centro (grande)
3. Nombre y cargo se deslizan
4. Diálogo de presentación
5. Botón “Continuar”
6. Transición suave al **panel de explicación** (“Cómo funciona el poder en las sombras”)
7. El panel se puede cerrar con “Entendido. Empecemos.”
8. La carta se cierra y se desbloquean los KPIs en el dashboard con una pequeña animación de “nuevo indicador”

### Hover / Focus en opciones

- La opción se eleva ligeramente (translateY -2 px)
- Borde del color del personaje
- Preview de KPIs se vuelve más visible o se colorea (rojo = malo, verde = bueno, amarillo = mixto)

### Confirmación de opción

- La carta hace un leve “shake” o flash del color de impacto dominante
- Se muestran los números finales que se aplicaron (feedback de +9 Corrupción, etc.)
- Cierre de carta (scale down + fade)

### Urgencia

| Tag        | Animación extra                  | Color del tag |
|------------|----------------------------------|---------------|
| Normal     | Ninguna                          | Gris          |
| Importante | Pulso suave del borde            | Naranja       |
| Crítico    | Pulso más marcado + glow rojo    | Rojo          |

---

## 6. Colores y tipografía por personaje

### Enrique Grook
- Fondo de carta: `#1a1d23` → `#252a33`
- Acento: `#c9a227` (oro apagado)
- Texto diálogo: `#e8e6e3`
- Botones: borde dorado sutil

### Gustavo Comun
- Acento: `#c41e3a` (rojo)
- Fondo ligeramente más cálido
- Tipografía un poco más “gritada” (weight más bold en el nombre)

### Amalia Verde
- Acento: `#2d6a4f` / `#40916c`
- Fondo más limpio / aireado
- Tipografía más ligera y elegante

### Jhon el Duro
- Acento: `#1b1b1b` + `#8b0000`
- Bordes más duros (menos radius)
- Tipografía condensada / militar

### Corte / Comisión
- Azules y grises institucionales
- Más formal, menos “personaje”

---

## 7. Layout responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| Desktop    | Carta centrada, máximo 520-560 px de ancho. Opciones en fila. |
| Tablet     | Carta un poco más ancha. Opciones pueden pasar a 2 columnas. |
| Mobile     | Carta casi full-width con márgenes laterales. Opciones apiladas verticalmente. Preview de KPIs siempre visible debajo del título de cada opción. |

---

## 8. Componentes reutilizables (para el frontend)

```
<EventCard>
  <CardHeader emblem={...} flag={...} title name role urgency />
  <CardPortrait characterId accentColor />
  <CardBody dialogue or description />
  <CardOptions>
    <Option previewKpis={[...]} onConfirm />
  </CardOptions>
  <CardFooter statusBars />
</EventCard>
```

```
<CharacterEmblem id size animated />
<CountryFlag code size bordered />
```

```
<OnboardingSequence character="enrique_grook">
  <StepPresentation />
  <StepSystemExplanation />
</OnboardingSequence>
```

---

## 9. Estados especiales de carta

| Estado              | Visual                                      |
|---------------------|---------------------------------------------|
| Primera vez (onboarding) | Más grande, sin opciones de juego todavía |
| Carta normal        | Layout estándar                             |
| Carta crítica       | Borde rojo + pulso + tag “CRÍTICO”          |
| Carta de aliado temporal | Pequeño indicador “Aliado” en header     |
| Carta ignorada / archivada | No se muestra, solo queda en Timeline   |

---

## 10. Integración con Timeline

Cuando una carta se resuelve:

- Se agrega una entrada al Timeline nacional con:
  - Emblema o bandera pequeña
  - Título corto
  - Resultado principal (ej. “Corrupción +9 · Investigaciones -8”)
- Click en la entrada del Timeline puede reabrir un resumen de la carta (solo lectura)

---

## 11. Roadmap visual recomendado

**Fase 1 (inmediata)**
- Layout base de EventCard
- Emblemas de Enrique + 3 líderes
- Animación de entrada y de opciones
- Preview de KPIs en cada opción
- Onboarding de Enrique con la secuencia de 2 pasos

**Fase 2**
- Banderas de los 15-20 países principales
- Tags de urgencia con animación
- Feedback de confirmación (números que vuelan hacia los KPIs del dashboard)

**Fase 3**
- Retratos / ilustraciones más elaboradas
- Variantes de emblema según estado (aliado, enemigo, neutral)
- Modo “carta de la Corte” y “carta de la Comisión” con visual institucional

---

## 12. Checklist de calidad UX

- [ ] Se entiende en menos de 2 segundos quién habla
- [ ] El preview de impacto es visible antes de elegir
- [ ] La animación de entrada no bloquea más de 400-500 ms
- [ ] En mobile las opciones son fáciles de tocar
- [ ] Los emblemas y banderas tienen buen contraste
- [ ] El onboarding de Enrique se siente especial (no es una carta más)
- [ ] El jugador siempre sabe si la carta es Normal / Importante / Crítica

---

**Fin del documento de UX/UI para Cartas, Personajes, Emblemas y Banderas.**

Este archivo es la especificación visual que debe acompañar a `Sistema_Moral_COMPLETO.md` a la hora de implementar.
