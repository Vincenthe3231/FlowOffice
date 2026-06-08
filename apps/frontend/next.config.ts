import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    mcpServer: true,
    optimizePackageImports: [
      "recharts",
      "framer-motion",
      "motion",
      "lucide-react",
      "@radix-ui/react-icons",
    ],
  },
};

export default nextConfig;
