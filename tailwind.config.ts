import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* iFundOS Government Color Palette */
        navy: {
          DEFAULT: "#0D1B2A",
          50: "#E8EDF2",
          100: "#C5D0DD",
          200: "#9BAFC5",
          300: "#708EAD",
          400: "#4E7499",
          500: "#2C5A85",
          600: "#1E4068",
          700: "#15304F",
          800: "#0D1B2A",
          900: "#060E17",
        },
        teal: {
          DEFAULT: "#00B4D8",
          50: "#E0F7FB",
          100: "#B3ECF6",
          200: "#80DFF0",
          300: "#4DD2EA",
          400: "#26C8E3",
          500: "#00B4D8",
          600: "#0096B4",
          700: "#007A93",
          800: "#005E72",
          900: "#004352",
        },
        surface: {
          DEFAULT: "#F0F4F8",
          50: "#FFFFFF",
          100: "#F8FAFB",
          200: "#F0F4F8",
          300: "#E2E8F0",
          400: "#CBD5E1",
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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
