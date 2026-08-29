import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB request body limit — too small for
    // real photo uploads (createOrder in app/order/[slug]/actions.ts takes
    // up to 3 photos, each allowed up to MAX_PHOTO_SIZE_MB in lib/types.ts).
    // 30mb comfortably covers 3 photos at that per-photo limit plus the
    // rest of the form fields.
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  async headers() {
    return [
      {
        // The customize page (and its preview iframe + confirmation page)
        // holds live, per-session form state — a browser's back-forward
        // cache (bfcache) can otherwise freeze and later restore a whole
        // prior instance of this page verbatim on Back navigation,
        // including whatever it was showing at the moment the customer
        // navigated away. Cache-Control: no-store is the standard way to
        // opt a page out of bfcache in Chromium/WebKit browsers, so every
        // visit — including via Back — is guaranteed a genuinely fresh
        // load instead of a frozen one.
        source: "/order/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
