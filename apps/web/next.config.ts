import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@code-duo/shared'],
  turbopack: {},
};

export default nextConfig;
