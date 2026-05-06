import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['docxtemplater', 'pizzip'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
