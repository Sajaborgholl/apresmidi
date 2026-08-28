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
};

export default nextConfig;
