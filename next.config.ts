import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // Public tournament pages: players refresh constantly while matches are
    // played. Organizer actions invalidate the tag immediately; this lifetime
    // only bounds staleness for anything that bypasses those actions.
    live: {
      stale: 15,
      revalidate: 30,
      expire: 600,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // Routes used before the organizer panel moved under /panel.
    return [
      { source: "/crear", destination: "/panel/crear", permanent: true },
      { source: "/configuracion", destination: "/panel/configuracion", permanent: true },
      { source: "/dashboard/torneo/:id", destination: "/panel/torneo/:id", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/panel/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
