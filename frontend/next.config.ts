import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Optional: Add rewrites for development, but exclude NextAuth routes
  async rewrites() {
    return [
      {
        source: '/api/events/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/events/:path*`,
      },
      {
        source: '/api/user/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/user/:path*`,
      },
      // Don't rewrite NextAuth routes - let them be handled locally
    ];
  },
};

export default nextConfig;
