import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Next.js dev server to accept HMR/WebSocket connections from
  // LAN IP addresses (e.g. iPhone on 192.168.x.x:10002).
  // Without this, cross-origin dev requests are blocked → React fails to
  // hydrate → page renders but all click handlers are missing.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.16.*.*'],
};

export default nextConfig;
