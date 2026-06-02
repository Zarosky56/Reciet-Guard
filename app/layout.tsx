import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";

import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { RouteProgress } from "@/components/ui/route-progress";
import "./globals.css";

// Geist Sans is the chosen UI sans (see design.md "Typography tokens").
// Variable font; only the regular axis file is loaded, so `preload: true`
// preloads exactly one font asset (Requirement 12.3).
const geist = Geist({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Mono is loaded but not preloaded — used only on data/code surfaces.
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

function appMetadataBase() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3100";

  return new URL(configuredUrl);
}

export const metadata: Metadata = {
  metadataBase: appMetadataBase(),
  title: "Receipt Guardian — Never miss a return window",
  description:
    "Turn order emails into a calm deadline dashboard. Track returns, warranties, and money at risk without a spreadsheet.",
  applicationName: "Receipt Guardian",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Receipt Guardian",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#08080c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geist.variable} ${jetBrainsMono.variable}`}
    >
      <body className="bg-bg text-text-primary antialiased">
        <ServiceWorkerRegister />
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        <InstallAppPrompt />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast:
                "border border-border bg-surface text-text-primary shadow-overlay backdrop-blur",
              title: "text-[13px] font-medium",
              description: "text-text-secondary",
              actionButton:
                "bg-action-strong text-white hover:brightness-110",
            },
          }}
        />
      </body>
    </html>
  );
}
