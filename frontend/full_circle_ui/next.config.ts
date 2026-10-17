import type { NextConfig } from "next";

// The portfolio serves the export at /projects/fullcircle/index.html.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/projects/fullcircle",
  images: { unoptimized: true },
};

export default nextConfig;
