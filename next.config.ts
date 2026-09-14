import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDFKit loads its bundled AFM font metrics at runtime. Keeping it external
  // preserves those package assets in production Route Handlers.
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.congress.gov", pathname: "/img/member/**" },
    ],
  },
};

export default nextConfig;
