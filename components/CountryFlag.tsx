'use client';

const SIZES: Record<'sm' | 'md' | 'lg', { w: number; h: number; font: number }> = {
  sm: { w: 20, h: 14, font: 6.5 },
  md: { w: 32, h: 22, font: 9 },
  lg: { w: 40, h: 27, font: 10.5 }
};

/**
 * Bandera de pais (docs/UX_Cartas_Personajes_Emblemas_Banderas.md, seccion 4).
 * Alcance de esta pasada: solo el fallback (rectangulo con el codigo ISO) —
 * el pack de SVGs reales es "Fase 2" en el propio documento de diseño
 * ("empezar con los paises del MVP / los mas usados"), y no hay assets de
 * bandera en el repo para generarlo sin inventar diseños. Si mas adelante
 * se agregan archivos a `/public/flags/{CODE}.svg`, este componente es el
 * unico lugar que hay que tocar para usarlos.
 */
export default function CountryFlag({
  code, size = 'md', bordered = false
}: {
  code: string;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
}) {
  const { w, h, font } = SIZES[size];
  return (
    <span
      className="flag-fallback"
      style={{
        width: w,
        height: h,
        fontSize: font,
        border: bordered ? '1px solid rgba(255,255,255,0.35)' : undefined
      }}
      title={code}
    >
      {code.slice(0, 3).toUpperCase()}
    </span>
  );
}
