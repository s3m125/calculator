/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // pglite ships a WASM build that loads via `new URL(...)` — webpack must
  // not bundle it or Node's fs.readFile rejects the polyfilled URL instance.
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite"],
  },
};

export default nextConfig;
