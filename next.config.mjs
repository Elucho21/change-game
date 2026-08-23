import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-globe.gl', 'globe.gl', 'three'],
  async headers() {
    return [
      {
        // geojson y texturas del globo: no cambian entre partidas, se sirven
        // igual para todos los jugadores. Cache largo + immutable evita que
        // el navegador los vuelva a pedir en cada carga del juego.
        source: '/:path(countries.geojson|earth-night.webp|earth-topology.webp)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      }
    ];
  }
};

export default withBundleAnalyzer(nextConfig);
