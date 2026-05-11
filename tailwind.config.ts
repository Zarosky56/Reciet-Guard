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
        bg: "#0A0A0F",
        surface: "#14141B",
        "surface-hover": "#1E1E28",
        border: "#2A2A3A",
        "border-focus": "#3B3B50",
        "text-primary": "#E8E8ED",
        "text-secondary": "#A0A0B8",
        "text-muted": "#6B6B80",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        action: "#3B82F6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        toast: "0 4px 12px rgba(0, 0, 0, 0.3)",
      },
      keyframes: {
        "pulse-red": {
          "0%, 100%": { opacity: "0.72" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-red": "pulse-red 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
