import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";

import { RouteProgress } from "@/components/ui/route-progress";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
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
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} bg-bg text-text-primary antialiased`}
      >
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
                "border border-border bg-surface text-text-primary shadow-toast backdrop-blur",
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
