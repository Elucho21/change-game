/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-globe.gl', 'globe.gl', 'three']
};
export default nextConfig;
