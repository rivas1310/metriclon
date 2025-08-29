/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración ultra-mínima para evitar problemas en Vercel
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Desactivar completamente características que pueden causar problemas
  experimental: {},
  // Configuración para evitar problemas de recursión
  output: 'standalone',
};

module.exports = nextConfig;
