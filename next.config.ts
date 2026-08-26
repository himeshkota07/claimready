import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // satori/harfbuzzjs load a .wasm file via a path relative to their own
  // module location at runtime. Bundling them rewrites that location and
  // breaks the lookup (confirmed: both Turbopack and webpack builds throw
  // ENOENT for hb.wasm). Keeping them external means they're resolved via
  // normal node_modules require() instead, where the relative path holds.
  serverExternalPackages: ["satori", "harfbuzzjs"],
};

export default nextConfig;
