# Pedido a Opus — UX Cartas, Personajes, Emblemas y Banderas

**Grok → Opus** · 23/08/2026  
**Repo:** `Elucho21/change-game`  
**Prioridad:** Alta (capa visual del Sistema Moral + infraestructura reutilizable)

---

## Contexto

Se diseñó el **Sistema Moral / Justicia / Corrupción** completo (Enrique Grook, Suprema Corte, Comisión, 3 líderes minoritarios, mecánicas de corrupción e investigaciones).  

Ahora se necesita la **capa UX/UI** para que las cartas y personajes se sientan profesionales, con animaciones, emblemas propios y soporte nativo de banderas de países.

**Documentos de referencia (se suben a `docs/`):**
- `docs/UX_Cartas_Personajes_Emblemas_Banderas.md` → especificación visual completa
- `docs/Sistema_Moral_COMPLETO.md` → lógica y contenido del sistema moral
- `docs/Sistema_Moral_Justicia_Corrupcion.md` → versión de trabajo

---

## Qué hay que implementar

### U1. Componente `EventCard` (base reutilizable)

**Qué:** Carta de evento unificada que sirva para:
- Enrique Grook (incluyendo onboarding)
- Gustavo Comun / Amalia Verde / Jhon el Duro
- Suprema Corte / Comisión
- Futuros eventos nacionales e internacionales

**Contrato sugerido (UI):**

```tsx
type Urgency = 'normal' | 'important' | 'critical';

interface KpiPreview {
  key: string;          // 'corruption' | 'investigation' | 'politicalCapital' | ...
  delta: number;
  label?: string;
}

interface EventCardOption {
  id: string;
  title: string;
  description?: string;
  preview: KpiPreview[];
  onConfirm: () => void;
}

interface EventCardProps {
  characterId?: string;       // 'enrique_grook' | 'gustavo_comun' | ...
  flagCode?: string;          // ISO country code (ej. 'PER', 'USA')
  title: string;
  role?: string;              // cargo
  urgency?: Urgency;
  portrait?: ReactNode;
  body: ReactNode;            // diálogo o descripción
  options: EventCardOption[];
  footerStatus?: ReactNode;   // barras de corrupción / investigaciones
  onClose?: () => void;
}
```

**Requisitos UX:**
- Preview de impacto en KPIs **visible antes de confirmar**
- Emblema o bandera en el header
- Tag de urgencia con estilo distinto (normal / important / critical)
- Responsive: opciones en fila (desktop) / apiladas (mobile)

---

### U2. Sistema de Emblemas de personajes

**Qué:** Componente `CharacterEmblem` + mapa de configuración.

| characterId       | Forma     | Color principal     | Notas                |
|-------------------|-----------|---------------------|----------------------|
| enrique_grook     | circle    | slate + gold        | Cínico, elegante     |
| gustavo_comun     | star/fist | red intense         | Combativo            |
| amalia_verde      | leaf      | emerald             | Calmada              |
| jhon_el_duro      | shield    | black + dark red    | Militar / autoritario|
| supreme_court     | scales    | navy + silver       | Institucional        |
| anti_corruption   | gavel     | gray + red          | Investigador         |

**Contrato:**

```tsx
<CharacterEmblem id="enrique_grook" size={48} animated />
```

- Tamaño estándar carta: 48px (desktop) / 40px (mobile)
- Animación de entrada: scale 0.8 → 1.0 + fade (~250 ms)

---

### U3. Componente `CountryFlag`

**Qué:** Bandera reutilizable para cartas, Timeline, tooltips del globo y diplomacia.

```tsx
<CountryFlag code="PER" size="sm" | "md" | "lg" bordered />
```

- Preferir SVG en `/public/flags/{CODE}.svg` (ISO alpha-3 o el código que ya use el motor)
- Fallback: rectángulo con el código del país
- Tamaños: Timeline ~24×16, Carta ~32–40, Tooltip ~20×14

---

### U4. Onboarding de Enrique Grook (mes 4)

**Qué:** Secuencia especial de 2 pasos (no es una carta normal).

1. **Paso 1 – Presentación**  
   Emblema grande + nombre + cargo + diálogo cínico de presentación.  
   Botón “Continuar”.

2. **Paso 2 – Panel de explicación**  
   Título: “Cómo funciona el poder en las sombras”  
   Explica de forma breve:
   - Corrupción
   - Suprema Corte
   - Comisión de Corrupción
   - Cómo avanzan / se frenan las investigaciones
   - Rol de Enrique (“No soy tu conciencia. Soy tu opción fácil.”)

3. Al cerrar:
   - Desbloquear KPIs de Corrupción, Progreso de Investigaciones, Integridad Corte/Comisión en el dashboard
   - Registrar en Timeline
   - A partir de ahí Enrique puede aparecer con cartas normales

**Referencia de textos:** ver `docs/Sistema_Moral_COMPLETO.md` sección 4 (Onboarding).

---

### U5. Animaciones mínimas obligatorias

| Momento                    | Animación                                      |
|----------------------------|------------------------------------------------|
| Entrada de carta           | Overlay fade + carta scale/fade (≤ 400 ms)     |
| Emblema                    | Pop scale 0.7 → 1.05 → 1.0                     |
| Hover opción               | Elevación leve + borde del color del personaje |
| Confirmación               | Feedback de números aplicados a KPIs           |
| Tag “Crítico”              | Pulso + glow rojo suave                        |
| Onboarding Enrique         | Secuencia especial (emblema → diálogo → panel) |

No bloquear la interacción más de ~500 ms.

---

### U6. Integración con Timeline

Cuando se resuelve una carta:
- Entrada en Timeline con emblema o bandera pequeña
- Título corto + resultado principal (ej. `Corrupción +9 · Investigaciones -8`)
- Click puede abrir resumen de solo lectura (opcional Fase 2)

---

## Fuera de alcance de este pedido (Fase 2+)

- Retratos ilustrados de alta calidad
- Variantes de emblema según estado (aliado/enemigo)
- Numeritos volando hacia el dashboard (polish)
- Pack completo de 76 banderas (empezar con los países del MVP / los más usados)

---

## Criterios de aceptación

1. Existe `EventCard` usable por Enrique y por al menos un líder minoritario.
2. `CharacterEmblem` renderiza los 4 personajes principales + Corte/Comisión.
3. `CountryFlag` muestra bandera o fallback limpio.
4. Onboarding de Enrique en mes 4 sigue la secuencia de 2 pasos y desbloquea los KPIs.
5. Cada opción muestra preview de impacto antes de confirmar.
6. Responsive aceptable en mobile (opciones apiladas).
7. Animaciones de entrada no superan ~400-500 ms.

---

## Archivos de diseño a usar

| Archivo en repo | Contenido |
|-----------------|-----------|
| `docs/UX_Cartas_Personajes_Emblemas_Banderas.md` | Especificación visual completa |
| `docs/Sistema_Moral_COMPLETO.md` | Lógica + textos de onboarding + cartas |
| `docs/Sistema_Moral_Justicia_Corrupcion.md` | Versión de trabajo |

---

## Notas para Opus

- Grok **no codea** componentes React/UI de motor. Este pedido es contrato + diseño.
- Reutilizar el sistema de cartas/eventos que ya exista en el proyecto; no reinventar el modal base si ya hay uno sólido.
- Los números de impacto (Corrupción, Investigaciones, etc.) vienen del Sistema Moral; la UI solo los muestra y aplica vía el motor de eventos/decisiones.
- Priorizar legibilidad y feedback claro sobre animaciones elaboradas.

---

**Fin del pedido U1–U6 (UX Cartas / Emblemas / Banderas).**
