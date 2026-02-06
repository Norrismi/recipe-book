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

  // This silences the "multiple lockfiles detected" warning
  outputFileTracingRoot: "/Users/norris/Documents/vibe/recipe_book",
};

export default nextConfig;