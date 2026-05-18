import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#004b33",
          900: "#006f46",
          850: "#008455",
          800: "#009056"
        },
        charcoal: {
          950: "#111418",
          900: "#171b20",
          800: "#242a31"
        },
        silver: {
          50: "#f7f8fa",
          100: "#eef1f4",
          200: "#d9dee5",
          300: "#b7c0ca",
          500: "#7e8997"
        },
        champagne: {
          100: "#eaf5f0",
          300: "#80c7ab",
          500: "#009056"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        display: [
          "Cormorant Garamond",
          "Georgia",
          "serif"
        ]
      },
      boxShadow: {
        soft: "0 24px 80px rgba(7, 17, 31, 0.12)",
        panel: "0 16px 50px rgba(17, 20, 24, 0.10)"
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px"
      }
    }
  },
  plugins: []
};

export default config;
