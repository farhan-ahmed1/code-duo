import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@code-duo/shared"],
  turbopack: {},
};

export default nextConfig;
