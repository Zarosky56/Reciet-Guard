import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Receipt Guardian",
    short_name: "Receipts",
    description:
      "Track receipt return windows, warranties, and reminders from one calm dashboard.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#08080c", // allow:color - PWA manifests require concrete color values.
    theme_color: "#08080c", // allow:color - PWA manifests require concrete color values.
    orientation: "portrait",
    categories: ["productivity", "finance", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Scan receipt",
        short_name: "Scan",
        description: "Capture or upload a new receipt.",
        url: "/dashboard?capture=none",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Open settings",
        short_name: "Settings",
        description: "Manage account and notification settings.",
        url: "/settings",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
