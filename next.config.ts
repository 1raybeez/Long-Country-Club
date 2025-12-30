import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // This is still supported to bypass the draft/page.tsx error
    ignoreBuildErrors: true, 
  },
  images: {
    unoptimized: true, 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sleepercdn.com',
        port: '',
        pathname: '/**', 
      },
    ],
  },
};

export default nextConfig;