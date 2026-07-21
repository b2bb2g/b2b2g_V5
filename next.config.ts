import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.hcaptcha.com https://*.hcaptcha.com`,
  "style-src 'self' 'unsafe-inline' https://*.hcaptcha.com",
  "font-src 'self' data:",
  `img-src 'self' data: blob: ${supabaseOrigin} https://i.ytimg.com https://*.hcaptcha.com`,
  `connect-src 'self' ${supabaseOrigin} wss://${supabaseHost} https://*.hcaptcha.com`,
  "frame-src 'self' https://*.hcaptcha.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  // Dev runs plain HTTP on dev.b2bb2g.com:3000; upgrading would break every
  // script load and form POST there (no TLS on that host).
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Local dev via a hosts-file alias (hCaptcha does not support localhost).
  allowedDevOrigins: ["dev.b2bb2g.com"],
  // Server Actions cap request bodies at 1MB by default, which rejected image
  // uploads (site OG image, landing hero image) that our uploaders allow up to
  // 10MB. Raise it to fit a 10MB file plus multipart overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    // Optimized images rarely change per URL; keep them in the CDN cache.
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      {
        // Fonts are content-stable; served immutable.
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Static brand/content images in public/ (Vercel defaults to
        // max-age=0 there, forcing a revalidation on every view).
        source: "/:dir(icons|brand|catalog|events|notices|landing-v2|generated)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
