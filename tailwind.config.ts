import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      desktop: "1200px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        /* iFundOS Sovereign Palette — "Bloomberg meets Saudi modern architecture" */
        sovereign: {
          charcoal: "#1a1714",
          soft: "#2a2520",
          ink: "#2d2a26",
          stone: "#8a8275",
          stoneLight: "#9a9488",
          warm: "#b5ad9e",
          parchment: "#f8f5ef",
          cream: "#faf8f4",
          ivory: "#fdfcfa",
          gold: "#b8943f",
          goldLight: "#d4c5a0",
        },
        /* Neumorphic surface system — tactile warm clay */
        neu: {
          base: "#e8e0d0",
          light: "#f0ead9",
          lighter: "#f5f0e3",
          dark: "#d9d0be",
          darker: "#cec4b0",
        },
        /* Semantic status colors */
        verified: "#4a7c59",
        amber: "#b87a3f",
        critical: "#9c4a4a",
        /* Environmental data viz — Saudi Green Initiative */
        leaf: {
          DEFAULT: "#059669",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          950: "#022C22",
        },
        ocean: {
          DEFAULT: "#0891B2",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        sand: {
          DEFAULT: "#D97706",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        violet: {
          DEFAULT: "#7c3aed",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#1e1b4b",
        },
        /* shadcn/ui compatible tokens */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "18px",
        "3xl": "24px",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        serif: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        organic: "0 4px 24px -4px rgba(5, 150, 105, 0.10)",
        "organic-lg": "0 8px 40px -8px rgba(5, 150, 105, 0.16)",
        soft: "0 2px 16px 0 rgba(0, 0, 0, 0.04)",
        sovereign: "0 1px 3px rgba(26,23,20,0.04), 0 4px 16px rgba(26,23,20,0.04)",
        elevated: "0 2px 8px rgba(26,23,20,0.06), 0 8px 32px rgba(26,23,20,0.08)",
        glow: "0 0 24px rgba(184,148,63,0.15)",
        /* Neumorphic raised shadows — light from top-left */
        "neu-raised": "6px 6px 14px rgba(156,148,130,0.45), -6px -6px 14px rgba(255,250,240,0.8)",
        "neu-raised-sm": "3px 3px 8px rgba(156,148,130,0.4), -3px -3px 8px rgba(255,250,240,0.75)",
        "neu-raised-lg": "8px 8px 20px rgba(156,148,130,0.5), -8px -8px 20px rgba(255,250,240,0.85)",
        /* Neumorphic inset shadows — wells, tracks, toggles */
        "neu-inset": "inset 3px 3px 8px rgba(156,148,130,0.4), inset -3px -3px 8px rgba(255,250,240,0.7)",
        "neu-inset-deep": "inset 4px 4px 12px rgba(140,132,115,0.5), inset -4px -4px 12px rgba(255,250,240,0.6)",
        /* Neumorphic pressed — button tap state */
        "neu-pressed": "inset 2px 2px 6px rgba(156,148,130,0.45), inset -2px -2px 6px rgba(255,250,240,0.65)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
