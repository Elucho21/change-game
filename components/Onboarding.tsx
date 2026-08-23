'use client';

import { useEffect, useState } from 'react';

const KEY = 'change-game:onboarded';

/**
 * Se muestra una sola vez, la primera vez que arranca una partida: nadie
 * llega a este juego sabiendo que hacen las 6 pestanas y el globo. Despues
 * de cerrarlo no vuelve a aparecer (ni en otra partida), como un tutorial
 * de verdad y no un popup que molesta cada vez.
 */
export default function Onboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      // localStorage no disponible (modo privado, etc): no bloquea el juego
    }
  }, []);

  const close = () => {
    setShow(false);
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      // si no se puede guardar, el onboarding vuelve a aparecer la proxima vez, sin drama
    }
  };

  if (!show) return null;

  return (
    <div className="overlay" onClick={close}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <h2>🌍 Como se juega</h2>
        <p>Gobernas un pais mes a mes. Cada turno decidis, plantas impuestos, respondes eventos, y despues avanzas.</p>

        <div className="section" style={{ padding: '10px 0' }}>
          <div className="row"><span>📊 Pais</span><b className="muted">Tus indicadores y acciones con otros paises</b></div>
          <div className="row"><span>🏛️ Gobierno</span><b className="muted">Mandato, elecciones e impuestos</b></div>
          <div className="row"><span>👥 Gabinete</span><b className="muted">Tus ministros</b></div>
          <div className="row"><span>🎯 Decisiones</span><b className="muted">Politicas que podes tomar este turno</b></div>
          <div className="row"><span>🧩 Bloques</span><b className="muted">Alianzas y uniones economicas</b></div>
          <div className="row"><span>📚 Eventos</span><b className="muted">Lo que ya paso y lo que puede pasar</b></div>
          <div className="row"><span>👴 Previsional</span><b className="muted">Jubilaciones, empleo formal/informal y salario real</b></div>
        </div>

        <p className="muted" style={{ fontSize: 12.5 }}>
          El globo del medio muestra relaciones, comercio y bloques en vivo. Nada de lo que planees se
          aplica hasta que apretes <b>Avanzar mes</b>, arriba a la derecha: hasta entonces podes probar y cambiar de idea.
        </p>

        <button className="btn-primary" onClick={close} style={{ marginTop: 8 }}>Entendido, a gobernar</button>
      </div>
    </div>
  );
}
