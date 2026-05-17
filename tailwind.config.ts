import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#08080C",
        "bg-elevated": "#0D0D14",
        surface: "#14141B",
        "surface-hover": "#1E1E28",
        "surface-elevated": "#1A1A23",
        border: "#2A2A3A",
        "border-strong": "#353548",
        "border-focus": "#3B3B50",
        "text-primary": "#ECECF1",
        "text-secondary": "#A0A0B8",
        "text-muted": "#6B6B80",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        action: "#5B8CFF",
        "action-strong": "#3B82F6",
        "action-soft": "rgba(91, 140, 255, 0.12)",
        "action-glow": "rgba(91, 140, 255, 0.35)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "14px",
        "card-lg": "18px",
        xl2: "20px",
      },
      boxShadow: {
        toast: "0 4px 12px rgba(0, 0, 0, 0.3)",
        "card-sm":
          "0 1px 0 rgba(255,255,255,0.02) inset, 0 1px 2px rgba(0,0,0,0.3)",
        "card-lift":
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 40px -18px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.35)",
        "glow-action":
          "0 0 0 1px rgba(91,140,255,0.35), 0 12px 40px -10px rgba(91,140,255,0.45)",
        "glow-soft":
          "0 0 0 1px rgba(91,140,255,0.18), 0 20px 60px -20px rgba(91,140,255,0.25)",
        "inner-hair": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
        "aurora-action":
          "radial-gradient(60% 60% at 50% 0%, rgba(91,140,255,0.22) 0%, rgba(91,140,255,0) 70%)",
        "aurora-soft":
          "radial-gradient(50% 50% at 50% 0%, rgba(91,140,255,0.14) 0%, rgba(91,140,255,0) 70%)",
        "card-elevated":
          "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 40%)",
      },
      keyframes: {
        "pulse-red": {
          "0%, 100%": { opacity: "0.72" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ledger-scan": {
          "0%": { opacity: "0", transform: "translateY(-14px)" },
          "18%": { opacity: "1" },
          "74%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(24px)" },
        },
        "loader-rail": {
          "0%": { opacity: "0", transform: "translateX(-110%)" },
          "24%": { opacity: "0.9" },
          "100%": { opacity: "0", transform: "translateX(220%)" },
        },
        "loader-step": {
          "0%, 100%": { opacity: "0.32", transform: "scale(0.82)" },
          "46%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-red": "pulse-red 3s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
        "glow-pulse": "glow-pulse 3.2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 400ms ease-out both",
        "ledger-scan": "ledger-scan 1.45s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "loader-rail": "loader-rail 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "loader-step": "loader-step 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
