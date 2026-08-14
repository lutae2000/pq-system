import type { NextConfig } from "next";

const normalizeBaseUrl = (value: string | undefined) => value?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.113"],
  output: "standalone",
  reactStrictMode: true,
  compress: true,
  env: {
    NEXT_API_KEY: process.env.NEXT_API_KEY ?? "",
    NEXT_SERVICE_ID: process.env.NEXT_SERVICE_ID ?? "application",
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async rewrites() {
    const apiBaseUrl = normalizeBaseUrl(process.env.NEXT_API_BASE_URL);

    if (!apiBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
