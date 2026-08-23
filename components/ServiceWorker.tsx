'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker que cachea geojson + texturas del globo.
 * Solo en produccion: en dev, un SW de por medio complica el hot reload
 * sin ningun beneficio (los assets ya se sirven locales e instantaneos).
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // si falla el registro, el juego sigue andando igual sin cache extra
    });
  }, []);

  return null;
}
