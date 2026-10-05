import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.110.179",
    "192.168.110.179:3000",
    "192.168.110.179:3001",
  ],
};

export default nextConfig;
