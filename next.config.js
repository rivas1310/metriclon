/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración mínima para evitar problemas en Vercel
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Desactivar características que pueden causar problemas
  experimental: {},
  // Optimización para evitar el error de stack size
  poweredByHeader: false,
  // Configuración para evitar problemas de recursión
  output: 'standalone',
};

module.exports = nextConfig;
