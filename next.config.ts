import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Next.js static export requires disabling image optimization for the Image component
  // if you use it, but we mostly use native img tags anyway.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
