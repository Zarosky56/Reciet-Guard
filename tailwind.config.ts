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
        // ── Redesigned tokens (Phase 1) — back tokens defined in app/globals.css ──
        canvas: "var(--color-canvas)",
        "canvas-raised": "var(--color-canvas-raised)",
        surface: "var(--color-surface)",
        "surface-hover": "var(--color-surface-hover)",
        "surface-overlay": "var(--color-surface-overlay)",
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
          focus: "var(--color-border-focus)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          tint: "var(--color-accent-tint)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",

        // ── Deprecated palette (removed in task 11) ──
        bg: "#08080C",
        "bg-elevated": "#0D0D14",
        "surface-elevated": "#1A1A23",
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
        // Redesigned radius scale (Phase 1)
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
        // Deprecated (removed in task 11)
        card: "14px",
        "card-lg": "18px",
        xl2: "20px",
      },
      maxWidth: {
        auth: "var(--container-auth)",
        narrow: "var(--container-narrow)",
        content: "var(--container-content)",
        wide: "var(--container-wide)",
      },
      transitionDuration: {
        instant: "var(--motion-instant)",
        quick: "var(--motion-quick)",
        default: "var(--motion-default)",
        slow: "var(--motion-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
        linear: "var(--ease-linear)",
      },
      boxShadow: {
        // Redesigned overlay shadow (Phase 1) — the ONLY allowed shadow
        // token per Requirement 5.3. Backed by `--shadow-overlay`
        // defined in `app/globals.css`. The deprecated
        // `shadow-card-sm`, `shadow-card-lift`, `shadow-glow-action`,
        // `shadow-glow-soft`, `shadow-inner-hair`, and `shadow-toast`
        // tokens were removed in task 11.2 (Requirements 5.2, 5.3,
        // 8.6, 14.4) — Toaster now uses `shadow-overlay` directly.
        overlay: "var(--shadow-overlay)",
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
        // Redesigned keyframes (Phase 1). The deprecated
        // `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`,
        // `shimmer`, `fade-in-up`, and `pulse-red` keyframes were
        // removed in task 11.2 (Requirements 5.2, 6.7, 8.6, 14.4).
        attention: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "route-progress": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        // Redesigned animations (Phase 1). Deprecated animation
        // utilities (`animate-ledger-scan`, `animate-loader-rail`,
        // `animate-loader-step`, `animate-glow-pulse`,
        // `animate-shimmer`, `animate-fade-in-up`, `animate-pulse-red`)
        // were removed in task 11.2.
        attention: "attention 2.4s var(--ease-emphasized) infinite",
        "route-progress": "route-progress 1.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
