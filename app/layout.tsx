import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";

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

export const metadata: Metadata = {
  title: "Receipt Guardian — Never miss a return window",
  description:
    "Turn order emails into a calm deadline dashboard. Track returns, warranties, and money at risk without a spreadsheet.",
};

export const viewport: Viewport = {
  themeColor: "#08080c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
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
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
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
