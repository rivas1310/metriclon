/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Ignora errores de TypeScript durante la compilación
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errores de ESLint durante la compilación
    ignoreDuringBuilds: true,
  },
  // Ignora errores de módulos no encontrados
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  experimental: {
    // Permite importaciones más flexibles
    esmExternals: 'loose',
  }
};

module.exports = nextConfig;
