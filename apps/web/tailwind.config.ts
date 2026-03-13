import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Geist'", "system-ui", "sans-serif"],
        mono: ["'Geist Mono'", "'JetBrains Mono'", "'Fira Code'", "monospace"],
        display: ["'Instrument Serif'", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
          muted: "hsl(var(--surface-muted))",
        },
        editor: {
          DEFAULT: "hsl(var(--editor-surface))",
          chrome: "hsl(var(--editor-chrome))",
          panel: "hsl(var(--editor-panel))",
        },
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
        status: {
          connected: "hsl(var(--status-connected))",
          syncing: "hsl(var(--status-syncing))",
          offline: "hsl(var(--status-offline))",
        },
        cursor: {
          1: "#FF6B6B",
          2: "#4ECDC4",
          3: "#45B7D1",
          4: "#96CEB4",
          5: "#FFEAA7",
          6: "#DDA0DD",
          7: "#98D8C8",
          8: "#F7DC6F",
          9: "#BB8FCE",
          10: "#85C1E9",
          11: "#F1948A",
          12: "#82E0AA",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        toolbar: "3rem",
        sidebar: "clamp(15rem, 15vw, 20rem)",
      },
      boxShadow: {
        panel: "0 18px 48px rgba(2, 6, 23, 0.28)",
        toolbar: "0 1px 0 rgba(148, 163, 184, 0.08), 0 12px 32px rgba(2, 6, 23, 0.18)",
        focus: "0 0 0 3px rgba(77, 148, 255, 0.24)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
