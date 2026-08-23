import type { Metadata } from 'next';
import './globals.css';
import ServiceWorker from '@/components/ServiceWorker';

export const metadata: Metadata = {
  title: 'Change Game - simulador geopolitico',
  description: 'Juego de geopolitica y gran estrategia con globo 3D, bloques, arcos diplomaticos y eventos.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
