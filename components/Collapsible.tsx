'use client';

import { useState } from 'react';

/**
 * Section colapsable: el titulo siempre se ve, el contenido se puede
 * plegar. `defaultOpen=false` para secciones de detalle que no hace falta
 * ver todo el tiempo (mantiene el panel limpio por default, expandible
 * cuando el jugador quiere mas informacion).
 */
export default function Collapsible({
  title, defaultOpen = true, children
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="section">
      <button type="button" className="section-toggle" onClick={() => setOpen((o) => !o)}>
        <h3>{title}</h3>
        <span className="section-caret">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}
