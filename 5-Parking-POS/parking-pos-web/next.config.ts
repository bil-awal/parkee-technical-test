import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    // Alternative configuration for more specific control:
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
        pathname: '/api/parking/photos/**',
      },
    ],
  },
};

export default nextConfig;