/** @type {import('next').NextConfig} */
const nextConfig = {
  // Partial prerendering / Cache Components for routes that opt into `use cache`.
  // Authenticated ERP UIs remain client-fetched with private no-store APIs.
  cacheComponents: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
