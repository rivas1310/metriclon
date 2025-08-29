/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración básica
  reactStrictMode: true,
  swcMinify: true,
  
  // Ignorar errores durante la compilación
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimización de imágenes
  images: {
    unoptimized: true,
  },
  
  // Configuración para Vercel
  output: 'standalone',
};

module.exports = nextConfig;
