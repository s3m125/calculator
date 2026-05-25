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
  // pglite is only required for *local* mode (no Supabase env vars set).
  // We mark it external so its WASM payload isn't bundled — important for
  // both Node's fs.readFile URL strictness AND for Vercel's function size.
  // In cloud mode (real Supabase URL set), pglite is dynamically imported
  // and never loaded, so this setting is harmless either way.
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite"],
  },
};

export default nextConfig;
