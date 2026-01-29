import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images from common recipe sites
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
