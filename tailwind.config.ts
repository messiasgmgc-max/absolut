import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          50: "#FCF9EE",
          100: "#F7F0D4",
          200: "#EFE0A6",
          300: "#E5CD74",
          400: "#DAB844",
          500: "#C9A227", // Gold luxury brand accent
          600: "#A8821B",
          700: "#806015",
          800: "#5D4512",
          900: "#3D2C0E",
        },
        noir: {
          950: "#09090b",
          900: "#121215",
          850: "#18181c",
          800: "#222228",
          700: "#2e2e36",
        }
      },
    },
  },
  plugins: [],
};

export default config;
