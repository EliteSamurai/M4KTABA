import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === "production",
  },
  async headers() {
    return [
      {
        source: "/(.*)", // applies to all routes
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://js.stripe.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' https: data: https://cdn.sanity.io;",
              "font-src 'self' https://fonts.gstatic.com;",
              "connect-src 'self' https://api.stripe.com https://api.easypost.com https://www.facebook.com;",
              "frame-src 'self' https://js.stripe.com;",
              "worker-src 'self' blob:;",
              "object-src 'none';",
              "base-uri 'self';",
              "form-action 'self';",
            ].join(" "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
