/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración mínima para evitar recursiones
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Configuración de webpack simplificada
  webpack: (config) => {
    return config;
  },
  // Variables de entorno
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
  // Optimización para evitar el error de stack size
  poweredByHeader: false,
};

module.exports = nextConfig;
