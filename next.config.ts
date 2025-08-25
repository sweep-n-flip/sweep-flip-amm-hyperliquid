import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permitir imagens de qualquer domínio HTTPS
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Desabilita otimização para permitir todos os domínios
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  typescript: {
    // Ignore TypeScript errors during build (for development)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build (for development)
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
