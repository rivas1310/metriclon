/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Deshabilitar características experimentales que pueden causar problemas
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Optimizaciones para Vercel
  swcMinify: true,
  compress: true,
  // Configuración de build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Configuración de imágenes
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },
  // Configuración de webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  },
  // Variables de entorno
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
